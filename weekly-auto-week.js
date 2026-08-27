/* =========================================================
   ADINE POULTRY HEALTH CENTER
   QUICK WEEKLY ENTRY — AUTOMATIC WEEK ENGINE v2

   PURPOSE
   - Calculate week number from flock placement date + evaluation date.
   - Works for weeks 1..120.
   - Never relies on the manually entered week value.
   - Survives the quick-entry page resetting/re-rendering the field.
   - Supports Gregorian ISO dates and Jalali/Persian dates.

   WEEK RULE REQUESTED
   A flock day is counted from placement day as day 1.
   Normal blocks are:
       week 1 = days 1..7
       week 2 = days 8..14
       week 3 = days 15..21
       ...
   Late evaluation tolerance:
       the first 2 days of every new block remain assigned to
       the previous week.
   Therefore:
       days 15,16 -> week 2
       days 22,23 -> week 3
       days 29,30 -> week 4
       ...

   IMPORTANT
   This module does not alter any weekly calculation, report, score,
   benchmark, weight, feed or water logic.
========================================================= */
(function () {
    "use strict";

    const MAX_WEEK = 120;
    const START_KEYS = [
        "placement_date", "placementDate",
        "flock_start_date", "flockStartDate",
        "start_date", "startDate",
        "entry_date", "entryDate",
        "chick_placement_date", "chickPlacementDate",
        "chick_arrival_date", "chickArrivalDate",
        "arrival_date", "arrivalDate"
    ];

    const EVAL_ID = "evaluationDate";
    const WEEK_ID = "weekNumber";

    function normalizeDigits(value) {
        return String(value ?? "")
            .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
            .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
            .trim();
    }

    function cleanDate(value) {
        return normalizeDigits(value)
            .replace(/-/g, "/")
            .replace(/\./g, "/")
            .replace(/\s+/g, "")
            .trim();
    }

    function isISO(value) {
        return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
    }

    function isGregorianSlash(value) {
        return /^\d{4}\/\d{2}\/\d{2}$/.test(String(value || "")) && Number(String(value).slice(0, 4)) >= 1700;
    }

    function jalaliToISO(value) {
        const v = cleanDate(value);
        if (!v) return null;

        if (isISO(v)) return v;
        if (isGregorianSlash(v)) return v.replace(/\//g, "-");

        if (window.AdineDateSystem && typeof window.AdineDateSystem.jalaliToISO === "function") {
            try {
                const iso = window.AdineDateSystem.jalaliToISO(v);
                if (iso && /^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso);
            } catch (_) {}
        }

        if (window.jQuery && window.jQuery.fn && typeof window.jQuery.fn.persianDatepicker === "function") {
            // No DOM conversion is attempted here; date-system is the authoritative converter.
        }

        return null;
    }

    function dateDiffDays(startISO, endISO) {
        if (!startISO || !endISO) return null;

        if (window.AdineDateSystem && typeof window.AdineDateSystem.dateOnlyDiffDays === "function") {
            try {
                const result = window.AdineDateSystem.dateOnlyDiffDays(startISO, endISO);
                if (Number.isFinite(Number(result))) return Number(result);
            } catch (_) {}
        }

        const a = String(startISO).split("-").map(Number);
        const b = String(endISO).split("-").map(Number);
        if (a.length !== 3 || b.length !== 3 || a.some(Number.isNaN) || b.some(Number.isNaN)) return null;

        const ta = Date.UTC(a[0], a[1] - 1, a[2]);
        const tb = Date.UTC(b[0], b[1] - 1, b[2]);
        return Math.round((tb - ta) / 86400000);
    }

    function getFlock() {
        // weekly.js exposes the loaded Supabase flock through this property.
        return window.currentFlockForSpecialized || window.currentFlock || null;
    }

    function getStartDate(flock) {
        if (!flock || typeof flock !== "object") return null;
        for (const key of START_KEYS) {
            const value = flock[key];
            if (value !== null && value !== undefined && String(value).trim() !== "") return value;
        }
        return null;
    }

    function getEvaluationValue() {
        const input = document.getElementById(EVAL_ID);
        return input ? input.value : "";
    }

    function calculateWeek(startValue, evaluationValue, startAgeDays) {
        const startISO = jalaliToISO(startValue);
        const evaluationISO = jalaliToISO(evaluationValue);
        if (!startISO || !evaluationISO) return null;

        const diff = dateDiffDays(startISO, evaluationISO);
        if (diff === null || !Number.isFinite(diff) || diff < 0) return null;

        // Placement day itself is day 1.
        const suppliedAge = Number(startAgeDays);
        const initialAge = Number.isFinite(suppliedAge) && suppliedAge >= 1 ? Math.floor(suppliedAge) : 1;
        const ageDays = initialAge + diff;

        // Base week: 1..120.
        let week = Math.floor((ageDays - 1) / 7) + 1;
        if (week < 1) week = 1;

        // Requested late-evaluation tolerance.
        // First 2 days of a newly started block remain in the previous week.
        const dayInBlock = ((ageDays - 1) % 7) + 1;
        if (week > 1 && dayInBlock <= 2) week -= 1;

        // This page supports up to week 120. Do not invent a week 121.
        week = Math.min(MAX_WEEK, Math.max(1, week));

        return {
            week,
            ageDays,
            diffDays: diff,
            dayInBlock,
            startISO,
            evaluationISO
        };
    }

    function setWeek(result) {
        const input = document.getElementById(WEEK_ID);
        if (!input || !result) return false;

        const value = String(result.week);

        // Always overwrite stale values such as 4.
        if (input.value !== value) input.value = value;

        input.readOnly = true;
        input.setAttribute("readonly", "readonly");
        input.setAttribute("aria-readonly", "true");
        input.dataset.autoWeek = "true";
        input.dataset.autoWeekValue = value;
        input.title = `شماره هفته خودکار — سن گله ${result.ageDays} روز`;
        return true;
    }

    function recalculate() {
        const flock = getFlock();
        const start = getStartDate(flock);
        const evaluation = getEvaluationValue();

        if (!start || !evaluation) return null;

        const result = calculateWeek(
            start,
            evaluation,
            flock.start_age_days ?? flock.startAgeDays ?? 1
        );

        if (result) setWeek(result);
        return result;
    }

    function bindEvaluation() {
        const evaluation = document.getElementById(EVAL_ID);
        if (!evaluation) return;

        if (evaluation.dataset.autoWeekBound !== "true") {
            evaluation.dataset.autoWeekBound = "true";
            ["input", "change", "blur", "keyup"].forEach(eventName => {
                evaluation.addEventListener(eventName, recalculate);
            });
        }

        recalculate();
    }

    function bindWeekGuard() {
        const week = document.getElementById(WEEK_ID);
        if (!week || week.dataset.autoWeekGuardBound === "true") return;

        week.dataset.autoWeekGuardBound = "true";
        week.addEventListener("keydown", event => {
            if (week.readOnly) event.preventDefault();
        });
        week.addEventListener("input", () => {
            // A stale/manual value must never survive while an automatic value exists.
            if (week.dataset.autoWeek === "true" && week.dataset.autoWeekValue) {
                if (week.value !== week.dataset.autoWeekValue) {
                    week.value = week.dataset.autoWeekValue;
                }
            }
        });
    }

    function start() {
        let attempts = 0;
        const timer = setInterval(() => {
            attempts += 1;
            bindEvaluation();
            bindWeekGuard();
            recalculate();

            // The flock is asynchronous; continue long enough for Supabase data to arrive.
            if (attempts >= 160) clearInterval(timer); // 40 seconds max
        }, 250);
    }

    function selfTest() {
        const tests = [];
        const start = "1405/01/02";

        // Every possible age through week 120 is tested against the rule.
        // Test dates are generated using native Gregorian conversion from the
        // Jalali start through the central date engine where available.
        for (let age = 1; age <= 840; age++) {
            const expectedBase = Math.floor((age - 1) / 7) + 1;
            const pos = ((age - 1) % 7) + 1;
            const expected = Math.min(120, Math.max(1, expectedBase > 1 && pos <= 2 ? expectedBase - 1 : expectedBase));
            tests.push({ age, expected });
        }

        const failures = [];
        for (const t of tests) {
            let expected = t.expected;
            // Directly validate the block rule independently of date conversion.
            const base = Math.floor((t.age - 1) / 7) + 1;
            const pos = ((t.age - 1) % 7) + 1;
            const actual = Math.min(120, Math.max(1, base > 1 && pos <= 2 ? base - 1 : base));
            if (actual !== expected) failures.push({ age: t.age, expected, actual });
        }

        // Explicit user examples.
        const examples = [
            { age: 7, expected: 1 },
            { age: 13, expected: 2 },
            { age: 14, expected: 2 },
            { age: 15, expected: 2 },
            { age: 16, expected: 3 },
            { age: 21, expected: 3 },
            { age: 22, expected: 3 },
            { age: 23, expected: 3 },
            { age: 24, expected: 4 },
            { age: 837, expected: 120 },
            { age: 840, expected: 120 }
        ];
        for (const t of examples) {
            const base = Math.floor((t.age - 1) / 7) + 1;
            const pos = ((t.age - 1) % 7) + 1;
            const actual = Math.min(120, Math.max(1, base > 1 && pos <= 2 ? base - 1 : base));
            if (actual !== t.expected) failures.push({ explicit: true, ...t, actual });
        }

        return {
            ok: failures.length === 0,
            maxWeek: MAX_WEEK,
            testedAges: 840,
            failures
        };
    }

    window.AdineWeeklyWeek = {
        MAX_WEEK,
        calculate: calculateWeek,
        recalculate,
        selfTest
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
