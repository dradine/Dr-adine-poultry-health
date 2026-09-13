/* =========================================================
   ADINE POULTRY HEALTH CENTER
   WEEKLY FEED / WATER AUTO CALCULATOR
   Raw + mortality-adjusted water:feed metrics
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
    const ADJUSTED_RATIO_ID = "weeklyMortalityAdjustedWaterFeedRatio";

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

    function calculateMetrics(feedKg, waterL, liveBirds, mortalityWeek) {
        const feed = numberFrom(feedKg);
        const water = numberFrom(waterL);
        const live = numberFrom(liveBirds);
        const mortality = Math.max(0, numberFrom(mortalityWeek) ?? 0);

        // Canonical Water:Feed = total water (L) / total feed (kg).
        // This value is independent of mortality and is the primary ratio.
        const rawRatio = Number.isFinite(feed) && feed > 0 && Number.isFinite(water) && water >= 0
            ? water / feed
            : null;

        const endBirds = Number.isFinite(live) && live > 0 ? live : null;
        const startBirds = endBirds !== null ? endBirds + mortality : null;
        const effectiveBirds = startBirds !== null && endBirds !== null
            ? (startBirds + endBirds) / 2
            : null;

        const feedPerBirdG = effectiveBirds !== null && effectiveBirds > 0 && Number.isFinite(feed) && feed >= 0
            ? (feed * 1000) / effectiveBirds
            : null;

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
            waterPerBirdG: waterPerBirdMl,
            // Primary/canonical ratio: L/kg, never mortality-adjusted.
            waterFeedRatio: rawRatio,
            rawWaterFeedRatio: rawRatio,
            // Diagnostic/secondary metric: kept separately.
            mortalityAdjustedWaterFeedRatio: mortalityAdjustedRatio,
            waterToFeedRatio: rawRatio,
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

    function syncAdjustedRatio(ratio) {
        const primaryRatio = document.querySelector(PRIMARY_RATIO_SELECTOR);
        if (!primaryRatio) return;

        let adjusted = document.getElementById(ADJUSTED_RATIO_ID);
        if (!adjusted) {
            const wrapper = document.createElement("div");
            wrapper.id = ADJUSTED_RATIO_ID;
            wrapper.setAttribute("data-weekly-mortality-adjusted-ratio", "true");
            wrapper.style.marginTop = "6px";
            wrapper.style.fontSize = "0.9em";
            wrapper.textContent = "نسبت تعدیل‌شده بر اساس تلفات: —";
            primaryRatio.insertAdjacentElement("afterend", wrapper);
            adjusted = wrapper;
        }

        adjusted.textContent = Number.isFinite(ratio)
            ? `نسبت تعدیل‌شده بر اساس تلفات: ${format(ratio, 3)} L/kg`
            : "نسبت تعدیل‌شده بر اساس تلفات: —";
    }

    function calculateFeedWater() {
        const metrics = getMetricsFromInputs();
        const feedEl = document.getElementById(FEED_PER_BIRD_ID);
        const waterEl = document.getElementById(WATER_PER_BIRD_ID);
        if (feedEl) feedEl.value = format(metrics.feedPerBirdG, 2);
        if (waterEl) waterEl.value = format(metrics.waterPerBirdMl, 2);
        syncPrimaryRatio(metrics.rawWaterFeedRatio);
        syncAdjustedRatio(metrics.mortalityAdjustedWaterFeedRatio);
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
            // Canonical stored/displayed ratio remains raw L/kg.
            waterFeedRatio: metrics.rawWaterFeedRatio,
            waterToFeedRatio: metrics.rawWaterFeedRatio,
            rawWaterFeedRatio: metrics.rawWaterFeedRatio,
            // Mortality-adjusted metric is preserved separately.
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

    /* =========================================================
       WEEKLY SAMPLING GUIDANCE — BROILER ONLY
       Scientific minimum: max(100, ceil(1% of population)).
       This wrapper changes only the recommendation/status field;
       CV, SD, mean, uniformity and all other calculations remain
       owned by weekly.js and are not modified.
    ========================================================= */

    function getWeeklySamplingPopulation() {
        const liveBirds = numberOf(BIRDS_ID);
        if (Number.isFinite(liveBirds) && liveBirds > 0) {
            return Math.floor(liveBirds);
        }

        const flock = window.currentFlockForSpecialized || window.currentFlock || null;
        if (!flock) return null;

        const candidates = [
            flock.initial_bird_count,
            flock.initialBirdCount,
            flock.initial_birds,
            flock.placement_birds,
            flock.bird_count
        ];

        for (const candidate of candidates) {
            const value = numberFrom(candidate);
            if (Number.isFinite(value) && value > 0) {
                return Math.floor(value);
            }
        }

        return null;
    }

    function isBroilerFlock() {
        const flock = window.currentFlockForSpecialized || window.currentFlock || null;
        const type = String(flock?.production_type ?? flock?.productionType ?? "").trim().toLowerCase();
        return ["broiler", "گوشتی", "مرغ گوشتی", "broiler chicken"].includes(type);
    }

    function patchWeeklySamplingRecommendation() {
        if (typeof window.calculateWeightStatistics !== "function") return false;
        if (window.calculateWeightStatistics.__populationSamplingPatched) return true;

        const original = window.calculateWeightStatistics;

        function patchedWeightStatistics(...args) {
            const result = original.apply(this, args);
            if (!result || typeof result !== "object") return result;
            if (!isBroilerFlock()) return result;

            const population = getWeeklySamplingPopulation();
            if (!Number.isFinite(population) || population <= 0) return result;

            const recommended = Math.max(100, Math.ceil(population * 0.01));
            const count = Number(result.count);
            let samplingStatus = result.samplingStatus;

            if (Number.isFinite(count)) {
                if (count < 30) {
                    samplingStatus = "ضعیف — حجم نمونه کمتر از ۳۰ پرنده است";
                } else if (count < recommended) {
                    samplingStatus = `قابل استفاده با احتیاط — نمونه فعلی ${count} پرنده است؛ حداقل پیشنهادی ${recommended} پرنده است`;
                } else {
                    samplingStatus = `مناسب — حداقل پیشنهادی ${recommended} پرنده بر اساس ۱٪ جمعیت است`;
                }
            }

            return {
                ...result,
                recommendedSampleSize: recommended,
                samplingStatus
            };
        }

        patchedWeightStatistics.__populationSamplingPatched = true;
        patchedWeightStatistics.__original = original;
        window.calculateWeightStatistics = patchedWeightStatistics;
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
            syncPrimaryRatio(metrics.rawWaterFeedRatio);
            syncAdjustedRatio(metrics.mortalityAdjustedWaterFeedRatio);
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
        patchWeeklySamplingRecommendation();
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