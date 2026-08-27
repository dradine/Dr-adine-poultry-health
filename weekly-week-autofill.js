/* =========================================================
   WEEKLY WEEK AUTO-FILL — DIRECT, DETERMINISTIC
   Source of truth:
     flocks.placement_date (Gregorian DATE)
     weekly form evaluationDate (Jalali UI date)

   Age convention:
     placement day = age day 1
     next day = age day 2

   Week convention requested by user:
     1..7   => week 1
     8..14  => week 2
     15..16 => week 2 (late evaluation tolerance)
     17..21 => week 3
     22..23 => week 3
     ...
     up to week 120.

   The field is calculated on every read/change and immediately before save.
========================================================= */
(function () {
  "use strict";

  const MAX_WEEK = 120;
  let lastSignature = "";
  let observerStarted = false;

  function digits(v) {
    return String(v ?? "")
      .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  }

  function isoDate(value) {
    const s = digits(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (window.AdineDateSystem && typeof window.AdineDateSystem.jalaliToISO === "function") {
      const iso = window.AdineDateSystem.jalaliToISO(s.replace(/[.-]/g, "/"));
      if (iso) return iso;
    }
    return null;
  }

  function diffDays(a, b) {
    if (!a || !b) return null;
    const A = a.split("-").map(Number);
    const B = b.split("-").map(Number);
    if (A.length !== 3 || B.length !== 3) return null;
    const da = Date.UTC(A[0], A[1] - 1, A[2]);
    const db = Date.UTC(B[0], B[1] - 1, B[2]);
    if (!Number.isFinite(da) || !Number.isFinite(db)) return null;
    return Math.round((db - da) / 86400000);
  }

  function getFlock() {
    return window.currentFlock || window.currentFlockForSpecialized || null;
  }

  function getEvaluation() {
    const el = document.getElementById("evaluationDate");
    return el ? digits(el.value).trim().replace(/[.-]/g, "/") : "";
  }

  function calculate(flock, evaluation) {
    const placement = flock?.placement_date || flock?.placementDate;
    const startISO = isoDate(placement);
    const evalISO = isoDate(evaluation);
    if (!startISO || !evalISO) return null;

    const diff = diffDays(startISO, evalISO);
    if (diff === null || diff < 0) return null;

    // Placement day is age 1.
    const age = diff + 1;
    let week = Math.floor((age - 1) / 7) + 1;
    const position = ((age - 1) % 7) + 1;

    // First two days of a new block are still treated as the previous week.
    if (week > 1 && position <= 2) week -= 1;
    week = Math.max(1, Math.min(MAX_WEEK, week));

    return { week, age, diff, startISO, evalISO, position };
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
    if (result) {
      el.title = `هفته ${result.week} — سن گله ${result.age} روز`;
    } else {
      el.removeAttribute("title");
    }
  }

  function recalculate(force = false) {
    const flock = getFlock();
    const evaluation = getEvaluation();
    const placement = flock?.placement_date || flock?.placementDate || "";
    const signature = `${flock?.id || ""}|${placement}|${evaluation}`;
    if (!force && signature === lastSignature) return null;
    lastSignature = signature;
    const result = calculate(flock, evaluation);
    write(result);
    return result;
  }

  // Expose a deterministic API for weekly.js and for diagnostics.
  window.AdineWeeklyAutoWeek = {
    calculate,
    recalculate,
    getFlock,
    selfTest: function () {
      const failures = [];
      const start = { placement_date: "2026-03-21" };
      const tests = [
        ["1405/01/01", 1], ["1405/01/07", 1], ["1405/01/08", 2],
        ["1405/01/14", 2], ["1405/01/15", 2], ["1405/01/16", 2],
        ["1405/01/17", 3], ["1405/01/21", 3], ["1405/01/22", 3],
        ["1405/01/23", 3], ["1405/01/24", 4]
      ];
      tests.forEach(([date, expected]) => {
        const r = calculate(start, date);
        if (!r || r.week !== expected) failures.push({ date, expected, got: r?.week });
      });
      // 120-week boundary: age 833 = week 119, age 834..840 = week 120.
      const boundaryDates = [
        ["2028-06-01", 119],
        ["2028-06-02", 119]
      ];
      boundaryDates.forEach(([date, expected]) => {
        const r = calculate(start, date);
        if (!r || r.week !== expected) failures.push({ date, expected, got: r?.week });
      });
      return { ok: failures.length === 0, failures };
    }
  };

  function installSaveGuard() {
    if (window.__ADINE_WEEK_SAVE_GUARD__) return;
    const original = window.saveWeeklyRecord;
    if (typeof original !== "function") return;
    window.__ADINE_WEEK_SAVE_GUARD__ = true;
    window.saveWeeklyRecord = function () {
      const result = recalculate(true);
      if (!result) {
        alert("برای ثبت شماره هفته، ابتدا گله و تاریخ ارزیابی معتبر را انتخاب کنید.");
        return;
      }
      return original.apply(this, arguments);
    };
  }

  function start() {
    const date = document.getElementById("evaluationDate");
    if (date && !date.dataset.weekAutoBound) {
      date.dataset.weekAutoBound = "true";
      ["input", "change", "blur", "keyup"].forEach(eventName => {
        date.addEventListener(eventName, () => recalculate(true));
      });
      if (window.jQuery) {
        window.jQuery(date).on("changeDate dp.change persianDatepicker.change", () => recalculate(true));
      }
    }
    installSaveGuard();
    recalculate(true);
  }

  // weekly.js loads the flock asynchronously; repeatedly synchronize until stable.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  if (!observerStarted) {
    observerStarted = true;
    const timer = setInterval(() => {
      start();
      if (window.currentFlock || window.currentFlockForSpecialized) {
        recalculate(true);
      }
    }, 250);
    setTimeout(() => clearInterval(timer), 30000);
  }
})();
