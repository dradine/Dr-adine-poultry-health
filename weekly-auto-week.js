/* =========================================================
   WEEKLY AUTO WEEK — QUICK ENTRY
   Derives week_number from flock placement date + evaluation date.
   Late tolerance: first 2 days of a new 7-day block remain in the
   previous week. This file is deliberately isolated from calculations.
========================================================= */
(function () {
  "use strict";

  const START_KEYS = [
    "placement_date", "placementDate", "flock_start_date", "flockStartDate",
    "start_date", "startDate", "entry_date", "entryDate",
    "chick_placement_date", "chickPlacementDate", "chick_arrival_date",
    "chickArrivalDate", "arrival_date", "arrivalDate"
  ];

  function norm(v) {
    return String(v ?? "")
      .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
      .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
      .trim();
  }

  function getFlock() {
    // currentFlock is a top-level let in weekly.js and therefore is NOT
    // available as window.currentFlock. weekly.js exposes the same object
    // through currentFlockForSpecialized.
    return window.currentFlockForSpecialized || window.currentFlock || null;
  }

  function getStart(flock) {
    if (!flock) return null;
    for (const key of START_KEYS) {
      if (flock[key] !== null && flock[key] !== undefined && String(flock[key]).trim()) {
        return flock[key];
      }
    }
    return null;
  }

  function toISO(value) {
    const v = norm(value).replace(/[.-]/g, "/");
    if (!v) return null;
    // Database stores placement_date as Gregorian ISO.
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(v) && Number(v.slice(0,4)) >= 1700) {
      return v.replaceAll("/", "-");
    }
    if (window.AdineDateSystem?.jalaliToISO) return window.AdineDateSystem.jalaliToISO(v);
    return null;
  }

  function getEvaluationISO() {
    const el = document.getElementById("evaluationDate");
    if (!el) return null;
    const v = norm(el.value).replace(/[.-]/g, "/");
    return window.AdineDateSystem?.jalaliToISO ? window.AdineDateSystem.jalaliToISO(v) : null;
  }

  function diffDays(a, b) {
    if (window.AdineDateSystem?.dateOnlyDiffDays) {
      return window.AdineDateSystem.dateOnlyDiffDays(a, b);
    }
    const aa = a.split("-").map(Number), bb = b.split("-").map(Number);
    return Math.round((Date.UTC(bb[0],bb[1]-1,bb[2]) - Date.UTC(aa[0],aa[1]-1,aa[2])) / 86400000);
  }

  function calculateWeekFromDates(startValue, evaluationValue, startAgeDays = 1) {
    const startISO = toISO(startValue);
    const evaluationISO = toISO(evaluationValue);
    if (!startISO || !evaluationISO) return null;
    const diff = diffDays(startISO, evaluationISO);
    if (diff === null || diff < 0) return null;

    const baseAge = Number.isFinite(Number(startAgeDays)) && Number(startAgeDays) >= 0
      ? Math.floor(Number(startAgeDays)) : 1;
    const ageDays = baseAge + diff;

    let week = Math.max(1, Math.floor((Math.max(1, ageDays) - 1) / 7) + 1);
    const position = ((Math.max(1, ageDays) - 1) % 7) + 1;

    // Example with placement on day 2:
    // evaluation day 8  => age 7  => week 1
    // evaluation day 14 => age 13 => week 2
    // evaluation day 15/16 => age 14/15 => week 2
    // evaluation day 17 => age 16 => week 3
    if (week > 1 && position <= 2) week -= 1;

    return { week, ageDays, diffDays: diff, startISO, evaluationISO };
  }

  function setWeek(result) {
    const el = document.getElementById("weekNumber");
    if (!el) return;
    if (!result) return;
    el.value = String(result.week);
    el.readOnly = true;
    el.dataset.autoWeek = "true";
    el.setAttribute("aria-readonly", "true");
    el.title = `شماره هفته خودکار — سن گله: ${result.ageDays} روز`;
  }

  function recalculate() {
    const flock = getFlock();
    const start = getStart(flock);
    const evaluationISO = getEvaluationISO();
    if (!start || !evaluationISO) return null;
    const result = calculateWeekFromDates(
      start,
      evaluationISO,
      flock.start_age_days ?? flock.startAgeDays ?? 1
    );
    setWeek(result);
    return result;
  }

  function bind() {
    const evaluation = document.getElementById("evaluationDate");
    if (!evaluation) return;
    if (evaluation.dataset.autoWeekBound !== "true") {
      evaluation.dataset.autoWeekBound = "true";
      evaluation.addEventListener("change", recalculate);
      evaluation.addEventListener("input", recalculate);
    }
    recalculate();
  }

  window.AdineWeeklyWeek = {
    calculate: calculateWeekFromDates,
    recalculate,
    selfTest() {
      const cases = [
        ["1405/01/02", "1405/01/08", 1],
        ["1405/01/02", "1405/01/14", 2],
        ["1405/01/02", "1405/01/15", 2],
        ["1405/01/02", "1405/01/16", 2],
        ["1405/01/02", "1405/01/17", 3]
      ];
      const failures = [];
      cases.forEach(([s,e,w]) => {
        const r = calculateWeekFromDates(s,e,1);
        if (!r || r.week !== w) failures.push({s,e,expected:w,result:r});
      });
      return { ok: failures.length === 0, failures };
    }
  };

  function start() {
    bind();
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      bind();
      // Keep polling until flock has loaded and the week has actually been set.
      const input = document.getElementById("weekNumber");
      if ((getFlock() && input?.dataset.autoWeek === "true") || tries >= 80) clearInterval(timer);
    }, 250);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();
})();
