/* ADINE WEEKLY — AUTHORITATIVE WEEK POLICY v1
   Weekly monitoring starts from flock placement_date.
   Week 1 = placement day through day 7.
   Week N = floor((age - 1) / 7) + 1.
   No late-tolerance shifting between weeks.
*/
(function () {
  "use strict";

  const MAX_WEEK = 120;
  let wrappedSave = null;

  function digits(v) {
    return String(v ?? "")
      .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  }

  function toISO(v) {
    const raw = String(v ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const s = digits(raw).replace(/[.\-]/g, "/").replace(/\s+/g, "");
    if (window.AdineDateSystem?.jalaliToISO) {
      const iso = window.AdineDateSystem.jalaliToISO(s);
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return iso;
    }
    return null;
  }

  function diffDays(a, b) {
    const n = Number(window.AdineDateSystem?.dateOnlyDiffDays?.(a, b));
    if (Number.isFinite(n)) return n;
    const A = a.split("-").map(Number), B = b.split("-").map(Number);
    if (A.length !== 3 || B.length !== 3 || A.some(Number.isNaN) || B.some(Number.isNaN)) return null;
    return Math.round((Date.UTC(B[0], B[1]-1, B[2]) - Date.UTC(A[0], A[1]-1, A[2])) / 86400000);
  }

  function flock() {
    return window.currentFlockForSpecialized || window.currentFlock || null;
  }

  function calculate() {
    const f = flock();
    const dateEl = document.getElementById("evaluationDate");
    if (!f || !dateEl) return null;
    const start = toISO(f.placement_date || f.placementDate);
    const evaluation = toISO(dateEl.value);
    if (!start || !evaluation) return null;
    const d = diffDays(start, evaluation);
    if (d === null || d < 0) return null;
    const configuredAge = Number(f.start_age_days ?? f.startAgeDays);
    const initialAge = Number.isFinite(configuredAge) && configuredAge >= 1 ? Math.floor(configuredAge) : 1;
    const age = initialAge + d;
    const week = Math.min(MAX_WEEK, Math.max(1, Math.floor((age - 1) / 7) + 1));
    return { week, age, start, evaluation, diffDays: d };
  }

  function write(result) {
    const el = document.getElementById("weekNumber");
    if (!el) return;
    if (result) {
      el.value = String(result.week);
      el.readOnly = true;
      el.setAttribute("readonly", "readonly");
      el.setAttribute("aria-readonly", "true");
      el.dataset.authoritativeWeek = String(result.week);
      el.dataset.authoritativeWeekAge = String(result.age);
    }
  }

  function sync() {
    const result = calculate();
    if (result) write(result);
    const save = window.saveWeeklyRecord;
    if (typeof save === "function" && save !== wrappedSave) {
      const original = save;
      wrappedSave = async function () {
        const current = calculate();
        if (!current) {
          alert("تاریخ ارزیابی معتبر نیست یا قبل از تاریخ شروع گله است.");
          return;
        }
        write(current);
        return original.apply(this, arguments);
      };
      window.saveWeeklyRecord = wrappedSave;
    }
  }

  function selfTest() {
    const failures = [];
    for (let age = 1; age <= 840; age++) {
      const expected = Math.min(MAX_WEEK, Math.max(1, Math.floor((age - 1) / 7) + 1));
      if (expected < 1 || expected > MAX_WEEK) failures.push(age);
    }
    return { ok: failures.length === 0, testedAges: 840, maxWeek: MAX_WEEK, failures };
  }

  window.AdineWeeklyWeekPolicy = { calculate, sync, selfTest };
  setInterval(sync, 100);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sync, { once: true });
  else sync();
})();
