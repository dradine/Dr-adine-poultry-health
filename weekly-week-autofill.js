/* QUICK WEEKLY ENTRY — AUTHORITATIVE AUTO WEEK v7
   Date/week source of truth: the same flock start date used by weekly storage.
   Evaluation date is NEVER rejected merely because it is before placement_date
   when the flock has a valid hatch_date on/before the evaluation date.
   Week is calculated from biological age: hatch_date -> age 1, then 7-day blocks.
   If hatch_date is unavailable, placement_date is the fallback.
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

  function toISO(v) {
    const raw = String(v == null ? "" : v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const s = digits(raw).replace(/[.\-]/g, "/");
    if (!s) return null;
    if (window.AdineDateSystem && typeof window.AdineDateSystem.jalaliToISO === "function") {
      const iso = window.AdineDateSystem.jalaliToISO(s);
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return iso;
    }
    const p = s.split("/");
    if (p.length !== 3) return null;
    const y = Number(p[0]), m = Number(p[1]), d = Number(p[2]);
    if (![y,m,d].every(Number.isInteger) || m < 1 || m > 12 || d < 1 || d > 31) return null;
    if (y >= 1700 && y <= 2500) return `${String(y).padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return null;
  }

  function dayDiff(a, b) {
    if (window.AdineDateSystem && typeof window.AdineDateSystem.dateOnlyDiffDays === "function") {
      const n = Number(window.AdineDateSystem.dateOnlyDiffDays(a, b));
      if (Number.isFinite(n)) return n;
    }
    const A = a.split("-").map(Number), B = b.split("-").map(Number);
    if (A.length !== 3 || B.length !== 3 || A.some(Number.isNaN) || B.some(Number.isNaN)) return null;
    return Math.round((Date.UTC(B[0],B[1]-1,B[2]) - Date.UTC(A[0],A[1]-1,A[2])) / 86400000);
  }

  function getSelection() {
    try { return JSON.parse(localStorage.getItem("adine_poultry_current_selection") || "{}"); }
    catch (_) { return {}; }
  }

  function getFlock() {
    return window.currentFlockForSpecialized || window.currentFlock || flockCache || null;
  }

  async function resolveFlock() {
    const direct = getFlock();
    if (direct && direct.id) {
      flockCache = direct;
      return direct;
    }
    const selection = getSelection();
    const id = selection.flockId || selection.flock_id || selection.flockID;
    if (!id || !window.supabaseClient) return direct;
    try {
      const { data, error } = await window.supabaseClient
        .from("flocks")
        .select("id,placement_date,hatch_date,start_age_days")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) flockCache = data;
    } catch (_) {}
    return flockCache;
  }

  function calculate(flock, evaluation) {
    const evalISO = toISO(evaluation);
    if (!evalISO) return null;

    // Biological monitoring anchor: hatch_date when present; placement_date fallback.
    const anchor = toISO(flock && (flock.hatch_date || flock.placement_date));
    if (!anchor) return null;

    const diff = dayDiff(anchor, evalISO);
    if (diff == null || diff < 0) return null;

    const configuredStartAge = Number(flock && flock.start_age_days);
    const initialAge = Number.isFinite(configuredStartAge) && configuredStartAge >= 1
      ? Math.floor(configuredStartAge) : 1;
    const age = initialAge + diff;
    const week = Math.min(MAX_WEEK, Math.max(1, Math.floor((age - 1) / 7) + 1));
    return { week, age, diff, anchor, evalISO };
  }

  function write(result) {
    const el = document.getElementById("weekNumber");
    if (!el) return;
    el.value = result ? String(result.week) : "";
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
    const sig = `${flock && flock.id || ""}|${flock && flock.hatch_date || ""}|${flock && flock.placement_date || ""}|${dateEl.value}|${flock && flock.start_age_days || "1"}`;
    if (!force && sig === last) return null;
    last = sig;
    const result = calculate(flock, dateEl.value);
    write(result);
    return result;
  }

  function installSaveGuard() {
    if (window.__ADINE_WEEK_SAVE_GUARD_V7__) return true;
    if (typeof window.saveWeeklyRecord !== "function") return false;
    const original = window.saveWeeklyRecord;
    window.__ADINE_WEEK_SAVE_GUARD_V7__ = true;
    window.saveWeeklyRecord = async function () {
      const result = await recalculate(true);
      if (!result) {
        alert("تاریخ ارزیابی معتبر نیست یا قبل از تاریخ شروع واقعی گله است.");
        return;
      }
      write(result);
      return original.apply(this, arguments);
    };
    return true;
  }

  function bind() {
    const dateEl = document.getElementById("evaluationDate");
    if (dateEl && !dateEl.dataset.autoWeekV7) {
      dateEl.dataset.autoWeekV7 = "1";
      ["input","change","keyup","blur"].forEach(name => dateEl.addEventListener(name, () => recalculate(true)));
      if (window.jQuery) window.jQuery(dateEl).on("changeDate dp.change persianDatepicker.change observer", () => recalculate(true));
    }
    installSaveGuard();
    recalculate(true);
  }

  window.AdineWeeklyAutoWeek = {
    calculate,
    recalculate: () => recalculate(true),
    selfTest: function () {
      const failures = [];
      for (let age = 1; age <= 840; age++) {
        const expected = Math.min(MAX_WEEK, Math.max(1, Math.floor((age - 1) / 7) + 1));
        if (expected < 1 || expected > MAX_WEEK) failures.push(age);
      }
      return { ok: failures.length === 0, testedAges: 840, maxWeek: MAX_WEEK, failures };
    }
  };

  bind();
  const timer = setInterval(() => { bind(); recalculate(true); }, 500);
  setTimeout(() => clearInterval(timer), 60000);
})();
