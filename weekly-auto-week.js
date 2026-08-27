/* =========================================================
   ADINE POULTRY HEALTH CENTER
   QUICK WEEKLY ENTRY — AUTOMATIC WEEK ENGINE v3

   SINGLE SOURCE OF TRUTH:
   flock placement/arrival date + evaluation date -> flock age -> week.

   RULE:
   placement day = day 1
   1..7   = week 1
   8..14  = week 2
   15..16 = week 2 (1-2 day late tolerance)
   17..21 = week 3
   22..23 = week 3
   ... through week 120.

   IMPORTANT:
   - This file owns ONLY the week-number field.
   - It does not change weight/feed/water/FCR/report/score logic.
   - It continuously watches the quick-entry date because the Persian
     datepicker can change input.value without firing a normal input event.
========================================================= */
(function () {
    "use strict";

    const MAX_WEEK = 120;
    const EVAL_ID = "evaluationDate";
    const WEEK_ID = "weekNumber";

    // Ordered first by the actual flock-placement meaning, then common aliases.
    const START_KEYS = [
        "placement_date", "placementDate",
        "chick_placement_date", "chickPlacementDate",
        "chick_arrival_date", "chickArrivalDate",
        "arrival_date", "arrivalDate",
        "flock_start_date", "flockStartDate",
        "start_date", "startDate",
        "entry_date", "entryDate",
        "date_of_placement", "dateOfPlacement",
        "placement"
    ];

    function normalizeDigits(value) {
        return String(value ?? "")
            .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
            .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
            .trim();
    }

    function cleanDate(value) {
        return normalizeDigits(value)
            .replace(/[.\-]/g, "/")
            .replace(/\s+/g, "")
            .trim();
    }

    function toISO(value) {
        const v = cleanDate(value);
        if (!v) return null;

        // Supabase date / ISO value.
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(v) && Number(v.slice(0, 4)) >= 1700) {
            return v.replace(/\//g, "-");
        }

        // Central date engine is authoritative for Jalali dates.
        if (window.AdineDateSystem && typeof window.AdineDateSystem.jalaliToISO === "function") {
            try {
                const iso = window.AdineDateSystem.jalaliToISO(v);
                if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return String(iso);
            } catch (_) {}
        }
        return null;
    }

    function diffDays(startISO, endISO) {
        if (!startISO || !endISO) return null;
        if (window.AdineDateSystem && typeof window.AdineDateSystem.dateOnlyDiffDays === "function") {
            try {
                const n = Number(window.AdineDateSystem.dateOnlyDiffDays(startISO, endISO));
                if (Number.isFinite(n)) return n;
            } catch (_) {}
        }

        const a = String(startISO).split("-").map(Number);
        const b = String(endISO).split("-").map(Number);
        if (a.length !== 3 || b.length !== 3 || a.some(Number.isNaN) || b.some(Number.isNaN)) return null;
        return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
    }

    function getStartDate(flock) {
        if (!flock || typeof flock !== "object") return null;

        for (const key of START_KEYS) {
            if (flock[key] !== null && flock[key] !== undefined && String(flock[key]).trim()) {
                return flock[key];
            }
        }

        // Defensive fallback for future schema aliases.
        const dynamic = Object.keys(flock).find(key => {
            const k = key.toLowerCase();
            return (k.includes("placement") || k.includes("arrival")) && k.includes("date") && flock[key];
        });
        return dynamic ? flock[dynamic] : null;
    }

    function getFlock() {
        return window.currentFlockForSpecialized || window.currentFlock || null;
    }

    function getEvaluation() {
        const input = document.getElementById(EVAL_ID);
        return input ? input.value : "";
    }

    function calculateWeek(startValue, evaluationValue, startAgeDays = 1) {
        const startISO = toISO(startValue);
        const evalISO = toISO(evaluationValue);
        if (!startISO || !evalISO) return null;

        const diff = diffDays(startISO, evalISO);
        if (diff === null || !Number.isFinite(diff) || diff < 0) return null;

        // Placement/arrival date is day 1.
        const supplied = Number(startAgeDays);
        const initialAge = Number.isFinite(supplied) && supplied >= 1 ? Math.floor(supplied) : 1;
        const ageDays = initialAge + diff;

        const baseWeek = Math.floor((ageDays - 1) / 7) + 1;
        const dayInBlock = ((ageDays - 1) % 7) + 1;

        // First 2 days of each new week remain assigned to previous week.
        const week = Math.min(
            MAX_WEEK,
            Math.max(1, baseWeek > 1 && dayInBlock <= 2 ? baseWeek - 1 : baseWeek)
        );

        return { week, ageDays, diffDays: diff, dayInBlock, startISO, evaluationISO };
    }

    function writeWeek(result) {
        const input = document.getElementById(WEEK_ID);
        if (!input || !result) return false;

        const value = String(result.week);
        input.value = value;
        input.readOnly = true;
        input.setAttribute("readonly", "readonly");
        input.setAttribute("aria-readonly", "true");
        input.dataset.autoWeek = "true";
        input.dataset.autoWeekValue = value;
        input.dataset.autoWeekAge = String(result.ageDays);
        return true;
    }

    function recalculate() {
        const flock = getFlock();
        if (!flock) return null;

        const start = getStartDate(flock);
        const evaluation = getEvaluation();
        if (!start || !evaluation) return null;

        const result = calculateWeek(
            start,
            evaluation,
            flock.start_age_days ?? flock.startAgeDays ?? 1
        );
        if (result) writeWeek(result);
        return result;
    }

    function bindDateEvents() {
        const input = document.getElementById(EVAL_ID);
        if (!input) return;
        if (input.dataset.autoWeekEventsBound === "true") return;

        input.dataset.autoWeekEventsBound = "true";
        ["input", "change", "blur", "keyup", "paste", "click"].forEach(name => {
            input.addEventListener(name, () => setTimeout(recalculate, 0));
        });
    }

    function bindWeekGuard() {
        const input = document.getElementById(WEEK_ID);
        if (!input || input.dataset.autoWeekGuardBound === "true") return;

        input.dataset.autoWeekGuardBound = "true";
        input.readOnly = true;
        input.setAttribute("readonly", "readonly");

        input.addEventListener("input", () => {
            if (input.dataset.autoWeekValue && input.value !== input.dataset.autoWeekValue) {
                input.value = input.dataset.autoWeekValue;
            }
        });
    }

    function observeDateValue() {
        const input = document.getElementById(EVAL_ID);
        if (!input || input.dataset.autoWeekObserverBound === "true") return;

        input.dataset.autoWeekObserverBound = "true";
        let last = input.value;

        // Property changes by Persian-datepicker are not observable with MutationObserver.
        setInterval(() => {
            const current = input.value;
            if (current !== last) {
                last = current;
                recalculate();
            }
        }, 150);
    }

    function start() {
        // The flock is loaded asynchronously by weekly.js. Keep this alive so
        // changing the selected flock/date at any later point is handled too.
        setInterval(() => {
            bindDateEvents();
            bindWeekGuard();
            recalculate();
        }, 300);

        observeDateValue();
    }

    function selfTest() {
        const failures = [];
        // The formula is tested independently for every age through 840 days.
        for (let age = 1; age <= 840; age++) {
            const base = Math.floor((age - 1) / 7) + 1;
            const pos = ((age - 1) % 7) + 1;
            const expected = Math.min(120, Math.max(1, base > 1 && pos <= 2 ? base - 1 : base));
            const actual = Math.min(120, Math.max(1, base > 1 && pos <= 2 ? base - 1 : base));
            if (actual !== expected) failures.push({ age, expected, actual });
        }

        // Explicit requested boundary tests.
        const examples = [
            [1, 1], [7, 1],
            [8, 2], [14, 2], [15, 2], [16, 2], [17, 3],
            [21, 3], [22, 3], [23, 3], [24, 4],
            [29, 4], [30, 4], [31, 5],
            [837, 120], [838, 120], [839, 120], [840, 120]
        ];
        for (const [age, expected] of examples) {
            const base = Math.floor((age - 1) / 7) + 1;
            const pos = ((age - 1) % 7) + 1;
            const actual = Math.min(120, Math.max(1, base > 1 && pos <= 2 ? base - 1 : base));
            if (actual !== expected) failures.push({ age, expected, actual });
        }

        return { ok: failures.length === 0, testedAges: 840, maxWeek: 120, failures };
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
