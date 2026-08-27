/* =========================================================
   WEEKLY AUTO WEEK ENGINE
   - Derives week number from flock placement date + evaluation date.
   - Uses the flock's start_age_days when present (default 1).
   - Standard weeks are 7-day age blocks.
   - If an evaluation falls 1-2 days into a new 7-day block,
     it remains assigned to the previous week (late-evaluation tolerance).
   - The result is written to #weekNumber and made read-only.
   - No weekly calculations, reports, scores or stored records are changed.
========================================================= */
(function () {
    "use strict";

    const START_DATE_KEYS = [
        "placement_date",
        "placementDate",
        "flock_start_date",
        "flockStartDate",
        "start_date",
        "startDate",
        "entry_date",
        "entryDate",
        "chick_placement_date",
        "chickPlacementDate",
        "chick_arrival_date",
        "chickArrivalDate",
        "arrival_date",
        "arrivalDate"
    ];

    function normalize(value) {
        if (value === null || value === undefined) return "";
        return String(value)
            .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
            .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
            .trim();
    }

    function flockStartDate(flock) {
        if (!flock || typeof flock !== "object") return null;
        for (const key of START_DATE_KEYS) {
            const value = flock[key];
            if (value !== null && value !== undefined && String(value).trim()) {
                return value;
            }
        }
        return null;
    }

    function evaluationDate() {
        const input = document.getElementById("evaluationDate");
        return input ? normalize(input.value).replace(/[.-]/g, "/") : "";
    }

    function calculateWeek(startJalali, evaluationJalali, startAgeDays) {
        if (!window.AdineDateSystem) return null;
        const startISO = window.AdineDateSystem.jalaliToISO(startJalali);
        const evaluationISO = window.AdineDateSystem.jalaliToISO(evaluationJalali);
        if (!startISO || !evaluationISO) return null;

        const diff = window.AdineDateSystem.dateOnlyDiffDays(startISO, evaluationISO);
        if (diff === null || diff < 0) return null;

        const ageStart = Number(startAgeDays);
        const baseAge = Number.isFinite(ageStart) && ageStart >= 0 ? Math.floor(ageStart) : 1;
        const ageDays = baseAge + diff;

        // Normal poultry weekly blocks: days 1-7, 8-14, 15-21, ...
        let week = Math.max(1, Math.floor((Math.max(1, ageDays) - 1) / 7) + 1);

        // Late-evaluation tolerance requested by the user:
        // days 15-16 remain week 2, days 22-23 remain week 3, etc.
        // More generally, first two days of a new block stay with the prior week.
        const position = ((Math.max(1, ageDays) - 1) % 7) + 1;
        if (week > 1 && position <= 2) week -= 1;

        return { week, ageDays, diffDays: diff, startISO, evaluationISO };
    }

    function setWeek(result) {
        const input = document.getElementById("weekNumber");
        if (!input) return;
        if (!result) {
            input.value = "";
            input.removeAttribute("data-auto-week");
            input.removeAttribute("aria-readonly");
            input.readOnly = false;
            return;
        }
        input.value = String(result.week);
        input.readOnly = true;
        input.setAttribute("data-auto-week", "true");
        input.setAttribute("aria-readonly", "true");
        input.title = `هفته ${result.week} — سن گله در تاریخ ارزیابی: ${result.ageDays} روز`;
    }

    function recalculate() {
        const flock = window.currentFlock || window.currentFlockForSpecialized || null;
        const start = flockStartDate(flock);
        const evaluation = evaluationDate();
        if (!start || !evaluation) {
            setWeek(null);
            return null;
        }

        const result = calculateWeek(
            start,
            evaluation,
            flock.start_age_days ?? flock.startAgeDays ?? 1
        );
        setWeek(result);
        return result;
    }

    function attach() {
        const input = document.getElementById("evaluationDate");
        if (!input || input.dataset.autoWeekBound === "true") return;
        input.dataset.autoWeekBound = "true";
        input.addEventListener("change", recalculate);
        input.addEventListener("input", recalculate);
        recalculate();
    }

    window.AdineWeeklyWeek = {
        calculate: calculateWeek,
        recalculate,
        getStartDate: flockStartDate,
        selfTest: function () {
            const tests = [
                ["1405/01/02", "1405/01/08", 1, 1],
                ["1405/01/02", "1405/01/14", 1, 2],
                ["1405/01/02", "1405/01/15", 1, 2],
                ["1405/01/02", "1405/01/16", 1, 2],
                ["1405/01/02", "1405/01/17", 1, 3],
                ["1405/01/02", "1405/01/21", 1, 3]
            ];
            const failures = [];
            tests.forEach(t => {
                const r = calculateWeek(t[0], t[1], t[2]);
                if (!r || r.week !== t[3]) failures.push({ input: t, result: r });
            });
            return { ok: failures.length === 0, failures };
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", attach, { once: true });
    } else {
        attach();
    }

    // weekly.js loads the flock asynchronously; retry briefly after it becomes available.
    let attempts = 0;
    const timer = setInterval(() => {
        attempts += 1;
        recalculate();
        if (window.currentFlock || attempts >= 40) clearInterval(timer);
    }, 250);
})();
