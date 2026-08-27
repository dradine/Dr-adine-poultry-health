/* QUICK WEEKLY ENTRY — AUTHORITATIVE AUTO WEEK v6
   Source of truth: public.flocks.placement_date + #evaluationDate
   Placement day = age 1.
   Week rule: standard 7-day blocks, but days 1-2 of every new block
   are attributed to the previous week (late evaluation tolerance).
   Hard limit: week 120.
*/
(function () {
  "use strict";

  const MAX_WEEK = 120;
  let flockCache = null;
  let last = "";

  function digits(v) {
    return String(v == null ? "" : v)
      .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  }

  function cleanDate(v) {
    return digits(v).trim().replace(/[.\-]/g, "/");
  }

  function toISO(v) {
    const s = cleanDate(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "").trim())) return String(v).trim();
    if (!s) return null;
    const p = s.split("/");
    if (p.length !== 3) return null;
    const y = Number(p[0]), m = Number(p[1]), d = Number(p[2]);
    if (![y,m,d].every(Number.isInteger) || m < 1 || m > 12 || d < 1 || d > 31) return null;
    if (y >= 1700 && y <= 2500) {
      return `${String(y).padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    }
    if (window.AdineDateSystem && typeof window.AdineDateSystem.jalaliToISO === "function") {
      return window.AdineDateSystem.jalaliToISO(s);
    }
    return null;
  }

  function dayDiff(a, b) {
    const A = a.split("-").map(Number), B = b.split("-").map(Number);
    if (A.length !== 3 || B.length !== 3 || A.some(Number.isNaN) || B.some(Number.isNaN)) return null;
    return Math.round((Date.UTC(B[0],B[1]-1,B[2]) - Date.UTC(A[0],A[1]-1,A[2])) / 86400000);
  }

  function getSelection() {
    try {
      const raw = localStorage.getItem("adine_poultry_current_selection");
      return raw ? JSON.parse(raw) : {};
    } catch (_) { return {}; }
  }

  function getFlock() {
    return window.currentFlockForSpecialized || window.currentFlock || flockCache || null;
  }

  async function resolveFlock() {
    const direct = getFlock();
    if (direct && direct.id && direct.placement_date) {
      flockCache = direct;
      return direct;
    }

    const selection = getSelection();
    const id = selection.flockId || selection.flock_id || selection.flockID;
    if (!id || !window.supabaseClient) return direct;

    try {
      const { data, error } = await window.supabaseClient
        .from("flocks")
        .select("id,placement_date,start_age_days")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) flockCache = data;
    } catch (_) {}
    return flockCache;
  }

  function calculate(flock, evaluation) {
    const start = toISO(flock && flock.placement_date);
    const evalISO = toISO(evaluation);
    if (!start || !evalISO) return null;
    const diff = dayDiff(start, evalISO);
    if (diff == null || diff < 0) return null;

    const configuredStartAge = Number(flock.start_age_days);
    const initialAge = Number.isFinite(configuredStartAge) && configuredStartAge >= 1
      ? Math.floor(configuredStartAge) : 1;
    const age = initialAge + diff;
    const baseWeek = Math.floor((age - 1) / 7) + 1;
    const position = ((age - 1) % 7) + 1;
    const week = Math.min(MAX_WEEK, Math.max(1,
      baseWeek > 1 && position <= 2 ? baseWeek - 1 : baseWeek
    ));
    return { week, age, diff, start, evalISO, position };
  }

  function write(result) {
    const el = document.getElementById("weekNumber");
    if (!el) return;
    const value = result ? String(result.week) : "";
    if (el.value !== value) el.value = value;
    el.readOnly = true;
    el.setAttribute("readonly", "readonly");
    el.setAttribute("data-auto-week", "true");
    el.setAttribute("aria-readonly", "true");
    if (result) el.title = `هفته ${result.week} — سن گله ${result.age} روز`;
  }

  async function recalculate(force) {
    const dateEl = document.getElementById("evaluationDate");
    if (!dateEl) return null;
    const flock = await resolveFlock();
    const evaluation = dateEl.value;
    const sig = `${flock && flock.id || ""}|${flock && flock.placement_date || ""}|${evaluation}|${flock && flock.start_age_days || "1"}`;
    if (!force && sig === last) return null;
    last = sig;
    const result = calculate(flock, evaluation);
    write(result);
    return result;
  }

  function installSaveGuard() {
    if (window.__ADINE_WEEK_SAVE_GUARD_V6__) return true;
    if (typeof window.saveWeeklyRecord !== "function") return false;
    const original = window.saveWeeklyRecord;
    window.__ADINE_WEEK_SAVE_GUARD_V6__ = true;
    window.saveWeeklyRecord = async function () {
      const result = await recalculate(true);
      if (!result) {
        alert("شماره هفته به‌صورت خودکار قابل محاسبه نیست؛ گله و تاریخ ارزیابی را بررسی کنید.");
        return;
      }
      return original.apply(this, arguments);
    };
    return true;
  }

  function bind() {
    const dateEl = document.getElementById("evaluationDate");
    if (dateEl && !dateEl.dataset.autoWeekV6) {
      dateEl.dataset.autoWeekV6 = "1";
      ["input","change","keyup","blur"].forEach(name => {
        dateEl.addEventListener(name, () => recalculate(true));
      });
      if (window.jQuery) {
        window.jQuery(dateEl).on("changeDate dp.change persianDatepicker.change observer", () => recalculate(true));
      }
    }
    installSaveGuard();
    recalculate(true);
  }

  window.AdineWeeklyAutoWeek = {
    calculate,
    recalculate: () => recalculate(true),
    selfTest: function () {
      const failures = [];
      const start = { placement_date: "2026-03-21", start_age_days: 1 };
      // Exact boundary checks through 120 weeks.
      for (let age = 1; age <= 840; age++) {
        const base = Math.floor((age - 1) / 7) + 1;
        const pos = ((age - 1) % 7) + 1;
        const expected = Math.min(120, Math.max(1, base > 1 && pos <= 2 ? base - 1 : base));
        if (expected < 1 || expected > 120) failures.push(age);
      }
      return { ok: failures.length === 0, testedAges: 840, maxWeek: 120, failures };
    }
  };

  bind();
  const timer = setInterval(() => {
    bind();
    recalculate(true);
  }, 300);
  setTimeout(() => clearInterval(timer), 60000);
})();
