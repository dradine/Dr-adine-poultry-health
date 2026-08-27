/* =========================================================
   ADINE POULTRY HEALTH CENTER
   WEEKLY FEED / WATER AUTO CALCULATOR
   Mortality-aware management calculation
   ========================================================= */

"use strict";

(function () {
    const FEED_ID = "feedTotal";
    const WATER_ID = "waterTotal";
    const BIRDS_ID = "liveBirds";
    const MORTALITY_ID = "mortalityWeek";
    const FEED_PER_BIRD_ID = "feedPerBird";
    const WATER_PER_BIRD_ID = "waterPerBird";
    const PRIMARY_RATIO_SELECTOR = '[data-weekly-specialized="water_feed_ratio"]';

    function numberOf(id) {
        const el = document.getElementById(id);
        if (!el) return null;
        const normalizer = typeof window.normalizeNumberString === "function"
            ? window.normalizeNumberString
            : value => String(value ?? "").replace(/,/g, "");
        const value = Number(normalizer(el.value));
        return Number.isFinite(value) ? value : null;
    }

    function numberFrom(value) {
        if (value === null || value === undefined || value === "") return null;
        const normalizer = typeof window.normalizeNumberString === "function"
            ? window.normalizeNumberString
            : v => String(v ?? "").replace(/,/g, "");
        const valueNumber = Number(normalizer(value));
        return Number.isFinite(valueNumber) ? valueNumber : null;
    }

    function format(value, decimals = 2) {
        if (!Number.isFinite(value)) return "";
        return Number(value.toFixed(decimals)).toString();
    }

    /*
     * Mortality-aware population model:
     * endBirds = live birds entered for the end of the week
     * startBirds = endBirds + deaths during the week
     * effectiveBirds = midpoint of start and end populations
     *
     * Therefore weekly mortality directly changes BOTH:
     *   1) feed per bird (grams)
     *   2) water per bird (grams/ml)
     * and also the mortality-adjusted water:feed index.
     *
     * The raw water:feed ratio is retained separately and is never destroyed.
     */
    function calculateMetrics(feedKg, waterL, liveBirds, mortalityWeek) {
        const feed = numberFrom(feedKg);
        const water = numberFrom(waterL);
        const live = numberFrom(liveBirds);
        const mortality = Math.max(0, numberFrom(mortalityWeek) ?? 0);

        const rawRatio = Number.isFinite(feed) && feed > 0 && Number.isFinite(water) && water >= 0
            ? water / feed
            : null;

        const endBirds = Number.isFinite(live) && live > 0 ? live : null;
        const startBirds = endBirds !== null ? endBirds + mortality : null;
        const effectiveBirds = startBirds !== null && endBirds !== null
            ? (startBirds + endBirds) / 2
            : null;

        // Total feed is kg/week -> grams/week, divided by mortality-adjusted effective birds.
        const feedPerBirdG = effectiveBirds !== null && effectiveBirds > 0 && Number.isFinite(feed) && feed >= 0
            ? (feed * 1000) / effectiveBirds
            : null;

        // Total water is L/week -> ml/week (approximately grams for water), divided by the same population.
        const waterPerBirdMl = effectiveBirds !== null && effectiveBirds > 0 && Number.isFinite(water) && water >= 0
            ? (water * 1000) / effectiveBirds
            : null;

        const mortalityFactor = startBirds !== null && endBirds !== null && endBirds > 0
            ? startBirds / endBirds
            : 1;

        const mortalityAdjustedRatio = rawRatio !== null
            ? rawRatio * mortalityFactor
            : null;

        const mortalityRate = startBirds !== null && startBirds > 0
            ? (mortality / startBirds) * 100
            : null;

        return {
            feedPerBirdG,
            waterPerBirdMl,
            // Alias in grams because the UI label may use «گرم» for water.
            waterPerBirdG: waterPerBirdMl,
            waterFeedRatio: mortalityAdjustedRatio,
            rawWaterFeedRatio: rawRatio,
            mortalityAdjustedWaterFeedRatio: mortalityAdjustedRatio,
            mortalityFactor,
            mortalityRate,
            effectiveBirds,
            startBirds,
            endBirds
        };
    }

    function getMetricsFromInputs() {
        return calculateMetrics(
            numberOf(FEED_ID),
            numberOf(WATER_ID),
            numberOf(BIRDS_ID),
            numberOf(MORTALITY_ID)
        );
    }

    function setReadonlyCalculatedFields() {
        [FEED_PER_BIRD_ID, WATER_PER_BIRD_ID].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.readOnly = true;
            el.setAttribute("aria-readonly", "true");
            el.setAttribute("tabindex", "-1");
            el.placeholder = "خودکار";
        });

        const primaryRatio = document.querySelector(PRIMARY_RATIO_SELECTOR);
        if (primaryRatio) {
            primaryRatio.readOnly = true;
            primaryRatio.setAttribute("aria-readonly", "true");
            primaryRatio.setAttribute("tabindex", "-1");
            primaryRatio.placeholder = "خودکار";
        }
    }

    function syncPrimaryRatio(ratio) {
        const primaryRatio = document.querySelector(PRIMARY_RATIO_SELECTOR);
        if (!primaryRatio) return;
        primaryRatio.value = Number.isFinite(ratio) ? format(ratio, 3) : "";
        primaryRatio.readOnly = true;
        primaryRatio.setAttribute("aria-readonly", "true");
        primaryRatio.setAttribute("tabindex", "-1");
        primaryRatio.dataset.autoCalculated = "true";
    }

    function calculateFeedWater() {
        const metrics = getMetricsFromInputs();
        const feedEl = document.getElementById(FEED_PER_BIRD_ID);
        const waterEl = document.getElementById(WATER_PER_BIRD_ID);
        if (feedEl) feedEl.value = format(metrics.feedPerBirdG, 2);
        if (waterEl) waterEl.value = format(metrics.waterPerBirdMl, 2);
        syncPrimaryRatio(metrics.mortalityAdjustedWaterFeedRatio);
        window.weeklyFeedWaterAuto = metrics;
        return metrics;
    }

    function attachInputListeners() {
        [FEED_ID, WATER_ID, BIRDS_ID, MORTALITY_ID].forEach(id => {
            const el = document.getElementById(id);
            if (!el || el.dataset.feedWaterAutoBound === "true") return;
            el.dataset.feedWaterAutoBound = "true";
            el.addEventListener("input", calculateFeedWater);
            el.addEventListener("change", calculateFeedWater);
            el.addEventListener("blur", calculateFeedWater);
        });
    }

    function calculateRecordMetrics(inputData) {
        const data = inputData && typeof inputData === "object" ? inputData : {};
        return calculateMetrics(
            data.feed ?? data.feedTotal,
            data.water ?? data.waterTotal,
            data.liveBirds,
            data.mortalityWeek ?? data.weeklyMortality ?? data.mortality
        );
    }

    function applyMetricsToRecord(record, metrics) {
        return {
            ...record,
            feedPerBirdG: metrics.feedPerBirdG,
            waterPerBirdMl: metrics.waterPerBirdMl,
            feedPerBird: metrics.feedPerBirdG,
            waterPerBird: metrics.waterPerBirdMl,
            waterPerBirdG: metrics.waterPerBirdG,
            waterFeedRatio: metrics.mortalityAdjustedWaterFeedRatio,
            waterToFeedRatio: metrics.mortalityAdjustedWaterFeedRatio,
            rawWaterFeedRatio: metrics.rawWaterFeedRatio,
            mortalityAdjustedWaterFeedRatio: metrics.mortalityAdjustedWaterFeedRatio,
            mortalityFactor: metrics.mortalityFactor,
            mortalityRate: metrics.mortalityRate,
            effectiveBirds: metrics.effectiveBirds,
            effectiveBirdCount: metrics.effectiveBirds,
            startBirdsForFeedWater: metrics.startBirds,
            endBirdsForFeedWater: metrics.endBirds
        };
    }

    function patchWeeklyBuilder() {
        if (typeof window.buildWeeklyWeightRecord !== "function") return false;
        if (window.buildWeeklyWeightRecord.__feedWaterAutoPatched) return true;
        const original = window.buildWeeklyWeightRecord;
        function patchedWeeklyBuilder(data) {
            calculateFeedWater();
            const inputData = data && typeof data === "object" ? { ...data } : {};
            const metrics = calculateRecordMetrics(inputData);
            const record = original(inputData);
            return applyMetricsToRecord(record, metrics);
        }
        patchedWeeklyBuilder.__feedWaterAutoPatched = true;
        patchedWeeklyBuilder.__original = original;
        window.buildWeeklyWeightRecord = patchedWeeklyBuilder;
        return true;
    }

    function patchWeeklySave() {
        if (typeof window.saveWeeklyRecord !== "function") return false;
        if (window.saveWeeklyRecord.__feedWaterAutoPatched) return true;
        const original = window.saveWeeklyRecord;
        function patchedWeeklySave(...args) {
            calculateFeedWater();
            const result = original.apply(this, args);
            const finalize = () => {
                try {
                    const records = typeof getWeeklyRecords === "function" ? getWeeklyRecords() : null;
                    if (!Array.isArray(records) || !records.length) return;
                    const currentFlockId = window.currentFlock?.id || window.currentFlockForSpecialized?.id || null;
                    const date = document.getElementById("evaluationDate")?.value || "";
                    const weekNumber = numberOf("weekNumber");
                    let index = -1;
                    for (let i = records.length - 1; i >= 0; i--) {
                        const r = records[i];
                        if (currentFlockId && String(r.flockId) !== String(currentFlockId)) continue;
                        if (date && String(r.date || r.evaluationDate || "") !== String(date)) continue;
                        if (weekNumber !== null && Number(r.weekNumber) !== weekNumber) continue;
                        index = i;
                        break;
                    }
                    if (index < 0) index = records.length - 1;
                    const r = records[index];
                    const metrics = calculateRecordMetrics(r);
                    records[index] = applyMetricsToRecord(r, metrics);
                    if (typeof writeStorage === "function" && typeof WEEKLY_STORAGE_NAME !== "undefined") {
                        writeStorage(WEEKLY_STORAGE_NAME, records);
                    }
                } catch (error) {
                    console.error("Weekly mortality-aware feed/water calculation error:", error);
                }
            };
            if (result && typeof result.then === "function") {
                return result.then(value => { finalize(); return value; });
            }
            finalize();
            return result;
        }
        patchedWeeklySave.__feedWaterAutoPatched = true;
        patchedWeeklySave.__original = original;
        window.saveWeeklyRecord = patchedWeeklySave;
        return true;
    }

    function patchWeeklyEdit() {
        if (typeof window.editWeeklyRecord !== "function") return false;
        if (window.editWeeklyRecord.__feedWaterAutoPatched) return true;
        const original = window.editWeeklyRecord;
        function patchedWeeklyEdit(...args) {
            const result = original.apply(this, args);
            setTimeout(() => {
                setReadonlyCalculatedFields();
                calculateFeedWater();
            }, 0);
            return result;
        }
        patchedWeeklyEdit.__feedWaterAutoPatched = true;
        patchedWeeklyEdit.__original = original;
        window.editWeeklyRecord = patchedWeeklyEdit;
        return true;
    }

    function observeSpecializedRatio() {
        if (window.__weeklyFeedWaterRatioObserver) return;
        const target = document.body || document.documentElement;
        if (!target || typeof MutationObserver === "undefined") return;
        const observer = new MutationObserver(() => {
            const primaryRatio = document.querySelector(PRIMARY_RATIO_SELECTOR);
            if (!primaryRatio) return;
            setReadonlyCalculatedFields();
            const metrics = getMetricsFromInputs();
            syncPrimaryRatio(metrics.mortalityAdjustedWaterFeedRatio);
        });
        observer.observe(target, { childList: true, subtree: true });
        window.__weeklyFeedWaterRatioObserver = observer;
    }

    function boot() {
        const feed = document.getElementById(FEED_ID);
        const water = document.getElementById(WATER_ID);
        const birds = document.getElementById(BIRDS_ID);
        if (!feed || !water || !birds) return false;
        setReadonlyCalculatedFields();
        attachInputListeners();
        calculateFeedWater();
        observeSpecializedRatio();
        patchWeeklyBuilder();
        patchWeeklySave();
        patchWeeklyEdit();
        return true;
    }

    function start() {
        let attempts = 0;
        const timer = setInterval(() => {
            attempts += 1;
            const ready = boot();
            if (ready || attempts >= 120) clearInterval(timer);
        }, 100);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

    window.calculateWeeklyFeedWater = calculateFeedWater;
    window.calculateWeeklyFeedWaterMetrics = getMetricsFromInputs;
})();
