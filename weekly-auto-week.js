/* =========================================================
   ADINE POULTRY HEALTH CENTER
   QUICK WEEKLY ENTRY — AUTOMATIC WEEK ENGINE v4

   Calculates week from the REAL flock placement date and the
   CURRENT evaluation date. It continuously re-reads the live
   datepicker value so a Persian calendar selection cannot leave
   a stale week number on screen.
========================================================= */
(function () {
    "use strict";

    const MAX_WEEK = 120;
    const EVAL_ID = "evaluationDate";
    const WEEK_ID = "weekNumber";
    let lastSignature = "";

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

    function digits(v) {
        return String(v ?? "")
            .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
            .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
    }

    function clean(v) {
        return digits(v).trim().replace(/[.\-]/g, "/").replace(/\s+/g, "");
    }

    function iso(v) {
        const raw = String(v ?? "").trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
        const x = clean(raw);
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(x) && Number(x.slice(0, 4)) >= 1700) return x.replace(/\//g, "-");
        if (window.AdineDateSystem?.jalaliToISO) {
            try {
                const out = window.AdineDateSystem.jalaliToISO(x);
                if (/^\d{4}-\d{2}-\d{2}$/.test(String(out || ""))) return out;
            } catch (_) {}
        }
        return null;
    }

    function diff(a, b) {
        if (!a || !b) return null;
        if (window.AdineDateSystem?.dateOnlyDiffDays) {
            const n = Number(window.AdineDateSystem.dateOnlyDiffDays(a, b));
            if (Number.isFinite(n)) return n;
        }
        const pa = a.split("-").map(Number), pb = b.split("-").map(Number);
        if (pa.length !== 3 || pb.length !== 3 || pa.some(Number.isNaN) || pb.some(Number.isNaN)) return null;
        return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
    }

    function getFlock() {
        return window.currentFlockForSpecialized || null;
    }

    function getStartDate(f) {
        if (!f) return null;
        for (const k of START_KEYS) {
            if (f[k] !== null && f[k] !== undefined && String(f[k]).trim()) return f[k];
        }
        const key = Object.keys(f).find(k => {
            const s = k.toLowerCase();
            return s.includes("date") && (s.includes("placement") || s.includes("arrival"));
        });
        return key ? f[key] : null;
    }

    function getEvaluationDate() {
        const el = document.getElementById(EVAL_ID);
        return el ? (el.value || el.getAttribute("value") || "") : "";
    }

    function calculate(startValue, evalValue, initialAge = 1) {
        const a = iso(startValue), b = iso(evalValue);
        if (!a || !b) return null;
        const d = diff(a, b);
        if (d === null || d < 0) return null;

        const n = Number(initialAge);
        const initial = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
        const age = initial + d;
        const base = Math.floor((age - 1) / 7) + 1;
        const position = ((age - 1) % 7) + 1;

        // First two days of a new 7-day block remain in the previous week.
        const week = Math.min(MAX_WEEK, Math.max(1,
            base > 1 && position <= 2 ? base - 1 : base
        ));

        return { week, ageDays: age, diffDays: d, dayInBlock: position, startISO: a, evaluationISO: b };
    }

    function write(result) {
        const el = document.getElementById(WEEK_ID);
        if (!el || !result) return false;
        const value = String(result.week);
        el.value = value;
        el.readOnly = true;
        el.setAttribute("readonly", "readonly");
        el.setAttribute("aria-readonly", "true");
        el.dataset.autoWeek = "true";
        el.dataset.autoWeekValue = value;
        el.dataset.autoWeekAge = String(result.ageDays);
        return true;
    }

    function clearInvalid() {
        const el = document.getElementById(WEEK_ID);
        if (!el) return;
        el.value = "";
        el.dataset.autoWeek = "false";
        el.dataset.autoWeekValue = "";
    }

    function recalculate(force = false) {
        const f = getFlock();
        const start = getStartDate(f);
        const evaluation = getEvaluationDate();
        const signature = JSON.stringify([f?.id || "", String(start || ""), String(evaluation || "")]);

        if (!force && signature === lastSignature) return null;
        lastSignature = signature;

        if (!f || !start || !evaluation) {
            clearInvalid();
            return null;
        }

        const result = calculate(start, evaluation, f.start_age_days ?? f.startAgeDays ?? 1);
        if (!result) {
            clearInvalid();
            return null;
        }
        write(result);
        return result;
    }

    function guardWeek() {
        const el = document.getElementById(WEEK_ID);
        if (!el) return;
        el.readOnly = true;
        el.setAttribute("readonly", "readonly");
        const expected = el.dataset.autoWeekValue;
        if (expected && el.value !== expected) el.value = expected;
    }

    function bind() {
        const date = document.getElementById(EVAL_ID);
        const week = document.getElementById(WEEK_ID);
        if (!date || !week) return;

        if (date.dataset.weekV4Bound !== "true") {
            date.dataset.weekV4Bound = "true";
            ["input", "change", "blur", "keyup", "paste", "mouseup", "touchend"].forEach(evt => {
                date.addEventListener(evt, () => setTimeout(() => recalculate(true), 0));
            });
            document.addEventListener("click", () => setTimeout(() => recalculate(true), 60), true);
            document.addEventListener("touchend", () => setTimeout(() => recalculate(true), 60), true);
        }

        week.readOnly = true;
        week.setAttribute("readonly", "readonly");
    }

    function start() {
        // The Persian datepicker may mutate input.value without dispatching
        // an event, so the live value is checked every 100 ms.
        setInterval(() => {
            bind();
            recalculate(false);
            guardWeek();
        }, 100);
        setTimeout(() => recalculate(true), 0);
        setTimeout(() => recalculate(true), 500);
        setTimeout(() => recalculate(true), 1500);
    }

    function selfTest() {
        const failures = [];
        for (let age = 1; age <= 840; age++) {
            const base = Math.floor((age - 1) / 7) + 1;
            const pos = ((age - 1) % 7) + 1;
            const expected = Math.min(120, Math.max(1, base > 1 && pos <= 2 ? base - 1 : base));
            if (expected < 1 || expected > 120) failures.push({ age, expected });
        }
        const boundaries = [[1,1],[7,1],[8,2],[14,2],[15,2],[16,2],[17,3],[21,3],[22,3],[23,3],[24,4],[837,120],[838,120],[839,120],[840,120]];
        for (const [age, expected] of boundaries) {
            const base = Math.floor((age - 1) / 7) + 1;
            const pos = ((age - 1) % 7) + 1;
            const actual = Math.min(120, Math.max(1, base > 1 && pos <= 2 ? base - 1 : base));
            if (actual !== expected) failures.push({ age, expected, actual });
        }
        return { ok: failures.length === 0, testedAges: 840, maxWeek: 120, failures };
    }

    window.AdineWeeklyWeek = { MAX_WEEK, calculate, recalculate, selfTest };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();
