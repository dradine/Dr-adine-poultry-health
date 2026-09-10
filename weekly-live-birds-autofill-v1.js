/* =========================================================
   ADINE POULTRY HEALTH CENTER
   WEEKLY LIVE BIRDS AUTO-FILL v1
   Scope: ONLY automatic live-bird population in weekly entry.
   Does not alter standards, engines, calculations, navigation or layout.

   Rule:
   Week 1 = initial flock placement count.
   Week N (>1) = previous week's live birds - mortality entered for week N.
   If the immediate previous weekly record is unavailable, the value is
   reconstructed from initial flock count and saved mortalities from weeks 2..N.
========================================================= */
(function () {
    "use strict";

    const LIVE_ID = "liveBirds";
    const MORTALITY_ID = "mortalityWeek";
    const WEEK_ID = "weekNumber";
    let cache = { flockId: null, records: null };
    let lastSignature = "";
    let busy = false;

    function num(value) {
        if (value === null || value === undefined || value === "") return null;
        const normalizer = typeof window.normalizeNumberString === "function"
            ? window.normalizeNumberString
            : v => String(v ?? "").replace(/,/g, "");
        const n = Number(normalizer(value));
        return Number.isFinite(n) ? n : null;
    }

    function flock() {
        return window.currentFlockForSpecialized || window.currentFlock || null;
    }

    function initialBirds(f) {
        return num(
            f?.initial_bird_count ??
            f?.initialBirdCount ??
            f?.initial_birds ??
            f?.placement_birds ??
            f?.bird_count
        );
    }

    function currentWeek() {
        return num(document.getElementById(WEEK_ID)?.value);
    }

    function currentMortality() {
        const m = num(document.getElementById(MORTALITY_ID)?.value);
        return m === null ? 0 : Math.max(0, m);
    }

    function currentRecordId() {
        return window.editingRecordId || null;
    }

    async function loadRecords(f) {
        if (!f?.id || !window.supabaseClient) return [];
        if (cache.flockId === String(f.id) && Array.isArray(cache.records)) return cache.records;

        try {
            const { data, error } = await window.supabaseClient
                .from("weekly_records")
                .select("id,week_number,mortality_count,live_birds,age_days,evaluation_date,record_date,created_at")
                .eq("flock_id", f.id)
                .order("week_number", { ascending: true })
                .order("created_at", { ascending: true });

            if (error) {
                console.warn("Weekly live-birds auto-fill: records load failed", error);
                return [];
            }

            cache = { flockId: String(f.id), records: Array.isArray(data) ? data : [] };
            return cache.records;
        } catch (error) {
            console.warn("Weekly live-birds auto-fill: records load error", error);
            return [];
        }
    }

    function write(value) {
        const el = document.getElementById(LIVE_ID);
        if (!el || !Number.isFinite(value)) return;
        const safe = Math.max(0, Math.floor(value));
        el.value = String(safe);
        el.readOnly = true;
        el.setAttribute("readonly", "readonly");
        el.setAttribute("aria-readonly", "true");
        el.setAttribute("tabindex", "-1");
        el.dataset.autoLiveBirds = "true";
        el.title = "تعداد پرنده زنده به‌صورت خودکار محاسبه می‌شود.";
    }

    function previousRecord(records, week, currentId) {
        const candidates = (records || []).filter(r => {
            if (currentId && String(r.id) === String(currentId)) return false;
            const w = num(r.week_number ?? r.weekNumber);
            return w !== null && w < week;
        });
        candidates.sort((a, b) => {
            const wa = num(a.week_number ?? a.weekNumber) ?? 0;
            const wb = num(b.week_number ?? b.weekNumber) ?? 0;
            if (wa !== wb) return wb - wa;
            return String(b.created_at || b.evaluation_date || b.record_date || "")
                .localeCompare(String(a.created_at || a.evaluation_date || a.record_date || ""));
        });
        return candidates[0] || null;
    }

    function fallbackPopulation(records, initial, week, currentId, mortalityNow) {
        let live = initial;
        if (!(live >= 0)) return null;

        const saved = (records || [])
            .filter(r => {
                if (currentId && String(r.id) === String(currentId)) return false;
                const w = num(r.week_number ?? r.weekNumber);
                return w !== null && w >= 2 && w < week;
            })
            .sort((a, b) => (num(a.week_number ?? a.weekNumber) ?? 0) - (num(b.week_number ?? b.weekNumber) ?? 0));

        for (const r of saved) {
            live -= Math.max(0, num(r.mortality_count ?? r.mortality ?? r.weekly_mortality) ?? 0);
            if (live < 0) live = 0;
        }

        live -= mortalityNow;
        return Math.max(0, live);
    }

    async function recalculate(force) {
        const f = flock();
        const week = currentWeek();
        const liveEl = document.getElementById(LIVE_ID);
        if (!f?.id || !liveEl || !(week >= 1)) return null;

        const mortality = currentMortality();
        const sig = `${f.id}|${week}|${mortality}|${currentRecordId() || ""}`;
        if (!force && sig === lastSignature) return num(liveEl.value);
        lastSignature = sig;

        const initial = initialBirds(f);
        if (!(initial >= 0)) {
            liveEl.readOnly = false;
            liveEl.removeAttribute("aria-readonly");
            return null;
        }

        // Explicit business rule: week 1 is the placement population.
        if (week === 1) {
            write(initial);
            return initial;
        }

        if (busy) return num(liveEl.value);
        busy = true;
        try {
            const records = await loadRecords(f);
            const prev = previousRecord(records, week, currentRecordId());
            const prevLive = num(prev?.live_birds ?? prev?.liveBirds);

            // Prefer the stored previous week's live population so edits/deletions
            // do not change the established chain of weekly populations.
            const calculated = prevLive !== null
                ? Math.max(0, prevLive - mortality)
                : fallbackPopulation(records, initial, week, currentRecordId(), mortality);

            if (calculated !== null) write(calculated);
            return calculated;
        } finally {
            busy = false;
        }
    }

    function bind() {
        const live = document.getElementById(LIVE_ID);
        const mortality = document.getElementById(MORTALITY_ID);
        const week = document.getElementById(WEEK_ID);
        if (!live || !mortality || !week) return false;

        if (!live.dataset.liveBirdsAutoBound) {
            live.dataset.liveBirdsAutoBound = "1";
            live.readOnly = true;
            live.setAttribute("aria-readonly", "true");
            live.setAttribute("tabindex", "-1");
        }

        [mortality, week].forEach(el => {
            if (el.dataset.liveBirdsAutoListener) return;
            el.dataset.liveBirdsAutoListener = "1";
            ["input", "change", "blur", "keyup"].forEach(eventName => {
                el.addEventListener(eventName, () => recalculate(true));
            });
        });

        recalculate(true);
        return true;
    }

    function invalidateAndRefresh() {
        cache = { flockId: null, records: null };
        lastSignature = "";
        setTimeout(() => recalculate(true), 250);
    }

    function patchSave() {
        if (typeof window.saveWeeklyRecord !== "function") return false;
        if (window.saveWeeklyRecord.__liveBirdsAutoPatched) return true;
        const original = window.saveWeeklyRecord;
        async function patchedSave(...args) {
            await recalculate(true);
            const result = original.apply(this, args);
            if (result && typeof result.then === "function") {
                return result.then(value => {
                    invalidateAndRefresh();
                    return value;
                });
            }
            invalidateAndRefresh();
            return result;
        }
        patchedSave.__liveBirdsAutoPatched = true;
        patchedSave.__original = original;
        window.saveWeeklyRecord = patchedSave;
        return true;
    }

    function patchEdit() {
        if (typeof window.editWeeklyRecord !== "function") return false;
        if (window.editWeeklyRecord.__liveBirdsAutoPatched) return true;
        const original = window.editWeeklyRecord;
        function patchedEdit(...args) {
            const result = original.apply(this, args);
            setTimeout(() => {
                lastSignature = "";
                recalculate(true);
            }, 50);
            return result;
        }
        patchedEdit.__liveBirdsAutoPatched = true;
        patchedEdit.__original = original;
        window.editWeeklyRecord = patchedEdit;
        return true;
    }

    function boot() {
        const ready = bind();
        patchSave();
        patchEdit();
        return ready;
    }

    window.AdineWeeklyLiveBirdsAuto = {
        recalculate: () => recalculate(true),
        invalidateAndRefresh
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            let attempts = 0;
            const timer = setInterval(() => {
                attempts++;
                if (boot() || attempts >= 120) clearInterval(timer);
            }, 100);
        }, { once: true });
    } else {
        let attempts = 0;
        const timer = setInterval(() => {
            attempts++;
            if (boot() || attempts >= 120) clearInterval(timer);
        }, 100);
    }
})();
