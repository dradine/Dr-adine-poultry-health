/* =========================================================
   ADINE POULTRY HEALTH CENTER
   WEEKLY LIVE BIRDS AUTO-FILL v4
   Scope: ONLY automatic live-bird population in weekly entry.
========================================================= */
(function () {
    "use strict";

    const LIVE_ID = "liveBirds";
    const MORTALITY_ID = "mortalityWeek";
    const WEEK_ID = "weekNumber";
    const SELECTION_KEY = "adine_poultry_current_selection";
    let flockCache = null;
    let recordsCache = null;
    let recordsFlockId = null;
    let bound = false;
    let recalculationTimer = null;
    let bootTimer = null;
    let bootStarted = false;

    function num(value) {
        if (value === null || value === undefined || value === "") return null;
        let s = String(value)
            .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776))
            .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632))
            .replace(/٬/g, "")
            .replace(/,/g, "")
            .replace(/٫/g, ".");
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
    }

    function getFlockId() {
        try {
            if (typeof currentFlock !== "undefined" && currentFlock?.id) return currentFlock.id;
        } catch (_) {}
        if (window.currentFlockForSpecialized?.id) return window.currentFlockForSpecialized.id;
        if (window.currentFlock?.id) return window.currentFlock.id;
        try {
            const selection = JSON.parse(localStorage.getItem(SELECTION_KEY) || "{}");
            return selection?.flockId || selection?.flock_id || null;
        } catch (_) {
            return null;
        }
    }

    async function resolveFlock() {
        try {
            if (typeof currentFlock !== "undefined" && currentFlock?.id) {
                flockCache = currentFlock;
                return currentFlock;
            }
        } catch (_) {}

        if (window.currentFlockForSpecialized?.id) {
            flockCache = window.currentFlockForSpecialized;
            return flockCache;
        }

        const id = getFlockId();
        if (flockCache?.id && id && String(flockCache.id) === String(id)) return flockCache;
        if (!id || !window.supabaseClient) return null;

        try {
            const { data, error } = await window.supabaseClient
                .from("flocks")
                .select("*")
                .eq("id", id)
                .maybeSingle();
            if (!error && data) {
                flockCache = data;
                window.currentFlockForSpecialized = data;
                return data;
            }
        } catch (_) {}
        return null;
    }

    function initialBirds(f) {
        return num(f?.initial_bird_count ?? f?.initialBirdCount ?? f?.initial_birds ?? f?.placement_birds ?? f?.bird_count);
    }

    function weekValue() {
        return num(document.getElementById(WEEK_ID)?.value);
    }

    function mortalityValue() {
        const n = num(document.getElementById(MORTALITY_ID)?.value);
        return n === null ? 0 : Math.max(0, Math.floor(n));
    }

    function editingId() {
        try {
            if (typeof editingRecordId !== "undefined" && editingRecordId) return editingRecordId;
        } catch (_) {}
        return window.editingRecordId || window.__editingRecordId || null;
    }

    async function loadRecords(f) {
        if (!f?.id || !window.supabaseClient) return [];
        if (recordsCache && String(recordsFlockId) === String(f.id)) return recordsCache;
        try {
            const { data, error } = await window.supabaseClient
                .from("weekly_records")
                .select("id,week_number,mortality_count,live_birds,age_days,evaluation_date,record_date,created_at")
                .eq("flock_id", f.id)
                .order("week_number", { ascending: true })
                .order("created_at", { ascending: true });
            if (error) return recordsCache || [];
            recordsCache = Array.isArray(data) ? data : [];
            recordsFlockId = f.id;
            return recordsCache;
        } catch (_) {
            return recordsCache || [];
        }
    }

    function write(value) {
        const el = document.getElementById(LIVE_ID);
        if (!el || !Number.isFinite(value)) return false;
        const safe = Math.max(0, Math.floor(value));
        el.value = String(safe);
        el.readOnly = true;
        el.setAttribute("readonly", "readonly");
        el.setAttribute("aria-readonly", "true");
        el.setAttribute("tabindex", "-1");
        el.dataset.autoLiveBirds = "true";
        return true;
    }

    function bestPreviousLive(records, week, currentId) {
        let best = null;
        for (const r of records || []) {
            if (currentId && String(r.id) === String(currentId)) continue;
            const w = num(r.week_number ?? r.weekNumber);
            const live = num(r.live_birds ?? r.liveBirds);
            if (w === null || live === null || w >= week) continue;
            if (!best || w > best.week) best = { week: w, live };
        }
        return best;
    }

    function reconstruct(records, initial, week, currentId, mortalityNow) {
        let live = initial;
        const prior = (records || [])
            .filter(r => {
                if (currentId && String(r.id) === String(currentId)) return false;
                const w = num(r.week_number ?? r.weekNumber);
                return w !== null && w >= 2 && w < week;
            })
            .sort((a, b) => (num(a.week_number ?? a.weekNumber) || 0) - (num(b.week_number ?? b.weekNumber) || 0));
        for (const r of prior) {
            live -= Math.max(0, Math.floor(num(r.mortality_count ?? r.mortality ?? r.weekly_mortality) || 0));
            live = Math.max(0, live);
        }
        return Math.max(0, live - mortalityNow);
    }

    async function recalculate() {
        const el = document.getElementById(LIVE_ID);
        const week = weekValue();
        if (!el || !(week >= 1)) return false;

        const f = await resolveFlock();
        if (!f?.id) return false;
        const initial = initialBirds(f);
        if (!(initial >= 0)) return false;

        if (week === 1) return write(initial);

        const records = await loadRecords(f);
        const currentId = editingId();
        const mortality = mortalityValue();
        const prev = bestPreviousLive(records, week, currentId);
        const result = prev
            ? Math.max(0, Math.floor(prev.live) - mortality)
            : reconstruct(records, initial, week, currentId, mortality);
        return write(result);
    }

    function schedule() {
        clearTimeout(recalculationTimer);
        recalculationTimer = setTimeout(() => { recalculate(); }, 0);
    }

    function bind() {
        const live = document.getElementById(LIVE_ID);
        const mortality = document.getElementById(MORTALITY_ID);
        const week = document.getElementById(WEEK_ID);
        if (!live || !mortality || !week) return false;

        live.readOnly = true;
        live.setAttribute("readonly", "readonly");
        live.setAttribute("aria-readonly", "true");
        live.setAttribute("tabindex", "-1");
        live.dataset.autoLiveBirds = "true";

        if (!bound) {
            bound = true;
            [week, mortality].forEach(el => {
                ["input", "change", "blur", "keyup"].forEach(type => el.addEventListener(type, schedule));
            });
            ["weekly:flock-loaded", "weekly:history-loaded", "weekly:record-saved", "weekly:record-edited"].forEach(name => {
                document.addEventListener(name, () => {
                    recordsCache = null;
                    recordsFlockId = null;
                    flockCache = null;
                    schedule();
                });
            });
        }
        schedule();
        return true;
    }

    async function bootAttempt() {
        const boundNow = bind();
        if (!boundNow) return false;
        return await recalculate();
    }

    function start() {
        if (bootStarted) return;
        bootStarted = true;
        let tries = 0;
        bootTimer = setInterval(async () => {
            tries++;
            const success = await bootAttempt();
            if (success || tries >= 240) {
                clearInterval(bootTimer);
                bootTimer = null;
            }
        }, 250);
    }

    window.AdineWeeklyLiveBirdsAuto = {
        recalculate,
        invalidateAndRefresh: () => {
            recordsCache = null;
            recordsFlockId = null;
            flockCache = null;
            schedule();
        }
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();