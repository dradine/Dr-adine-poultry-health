/* =========================================================
   ADINE POULTRY HEALTH CENTER
   WEEKLY FEED / WATER AUTO CALCULATOR
   ========================================================= */

"use strict";

(function () {

    const FEED_ID = "feedTotal";
    const WATER_ID = "waterTotal";
    const BIRDS_ID = "liveBirds";
    const FEED_PER_BIRD_ID = "feedPerBird";
    const WATER_PER_BIRD_ID = "waterPerBird";
    const RATIO_ID = "waterFeedRatio";
    const RATIO_FIELD_ID = "waterFeedRatioField";

    function numberOf(id) {
        const el = document.getElementById(id);
        if (!el) return null;

        const normalizer =
            typeof window.normalizeNumberString === "function"
                ? window.normalizeNumberString
                : value => String(value ?? "").replace(/,/g, "");

        const value = Number(normalizer(el.value));
        return Number.isFinite(value) ? value : null;
    }

    function format(value, decimals = 2) {
        if (!Number.isFinite(value)) return "";
        return Number(value.toFixed(decimals)).toString();
    }

    function ensureRatioField() {
        const existing = document.getElementById(RATIO_ID);
        if (existing) return existing;

        const waterField = document.getElementById(WATER_PER_BIRD_ID)?.closest(".form-group");
        if (!waterField || !waterField.parentElement) return null;

        const wrapper = document.createElement("div");
        wrapper.className = "form-group";
        wrapper.id = RATIO_FIELD_ID;
        wrapper.innerHTML = `
            <label for="${RATIO_ID}">
                نسبت آب به دان
                <span>(L/kg)</span>
            </label>
            <input
                id="${RATIO_ID}"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                readonly
                tabindex="-1"
                placeholder="خودکار"
                aria-label="نسبت آب به دان"
            >
            <small class="quick-entry-help">
                خودکار از مصرف کل آب و دان محاسبه می‌شود.
            </small>
        `;

        waterField.parentElement.appendChild(wrapper);
        return document.getElementById(RATIO_ID);
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
    }

    function calculateFeedWater() {
        const birds = numberOf(BIRDS_ID);
        const feedKg = numberOf(FEED_ID);
        const waterL = numberOf(WATER_ID);

        const feedPerBird =
            Number.isFinite(birds) && birds > 0 && Number.isFinite(feedKg) && feedKg >= 0
                ? (feedKg * 1000) / birds
                : null;

        const waterPerBird =
            Number.isFinite(birds) && birds > 0 && Number.isFinite(waterL) && waterL >= 0
                ? (waterL * 1000) / birds
                : null;

        const ratio =
            Number.isFinite(feedKg) && feedKg > 0 && Number.isFinite(waterL) && waterL >= 0
                ? waterL / feedKg
                : null;

        const feedEl = document.getElementById(FEED_PER_BIRD_ID);
        const waterEl = document.getElementById(WATER_PER_BIRD_ID);
        const ratioEl = ensureRatioField();

        if (feedEl) feedEl.value = format(feedPerBird, 2);
        if (waterEl) waterEl.value = format(waterPerBird, 2);
        if (ratioEl) ratioEl.value = format(ratio, 3);

        window.weeklyFeedWaterAuto = {
            feedPerBirdG: feedPerBird,
            waterPerBirdMl: waterPerBird,
            waterFeedRatio: ratio
        };

        return window.weeklyFeedWaterAuto;
    }

    function attachInputListeners() {
        [FEED_ID, WATER_ID, BIRDS_ID].forEach(id => {
            const el = document.getElementById(id);
            if (!el || el.dataset.feedWaterAutoBound === "true") return;

            el.dataset.feedWaterAutoBound = "true";
            el.addEventListener("input", calculateFeedWater);
            el.addEventListener("change", calculateFeedWater);
            el.addEventListener("blur", calculateFeedWater);
        });
    }

    function patchWeeklyBuilder() {
        if (typeof window.buildWeeklyWeightRecord !== "function") return false;
        if (window.buildWeeklyWeightRecord.__feedWaterAutoPatched) return true;

        const original = window.buildWeeklyWeightRecord;

        function patchedWeeklyBuilder(data) {
            const auto = calculateFeedWater();
            const inputData = data && typeof data === "object" ? { ...data } : {};

            const feed = Number(inputData.feed);
            const water = Number(inputData.water);
            const birds = Number(inputData.liveBirds);

            const feedPerBird =
                Number.isFinite(feed) && feed >= 0 && Number.isFinite(birds) && birds > 0
                    ? (feed * 1000) / birds
                    : null;

            const waterPerBird =
                Number.isFinite(water) && water >= 0 && Number.isFinite(birds) && birds > 0
                    ? (water * 1000) / birds
                    : null;

            const ratio =
                Number.isFinite(feed) && feed > 0 && Number.isFinite(water) && water >= 0
                    ? water / feed
                    : null;

            const record = original(inputData);

            record.feedPerBirdG = feedPerBird;
            record.waterPerBirdMl = waterPerBird;
            record.waterFeedRatio = ratio;
            record.feedPerBird = feedPerBird;
            record.waterPerBird = waterPerBird;
            record.waterToFeedRatio = ratio;

            return record;
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
                    const records = getWeeklyRecords();
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
                    const feed = Number(r.feed);
                    const water = Number(r.water);
                    const birds = Number(r.liveBirds);

                    if (!Number.isFinite(birds) || birds <= 0) return;

                    const feedPerBird = Number.isFinite(feed) && feed >= 0 ? (feed * 1000) / birds : null;
                    const waterPerBird = Number.isFinite(water) && water >= 0 ? (water * 1000) / birds : null;
                    const ratio = Number.isFinite(feed) && feed > 0 && Number.isFinite(water) && water >= 0 ? water / feed : null;

                    records[index] = {
                        ...r,
                        feedPerBirdG: feedPerBird,
                        waterPerBirdMl: waterPerBird,
                        waterFeedRatio: ratio,
                        feedPerBird: feedPerBird,
                        waterPerBird: waterPerBird,
                        waterToFeedRatio: ratio
                    };

                    writeStorage(WEEKLY_STORAGE_NAME, records);
                } catch (error) {
                    console.error("Weekly feed/water post-save calculation error:", error);
                }
            };

            if (result && typeof result.then === "function") {
                return result.then(value => {
                    finalize();
                    return value;
                });
            }

            finalize();
            return result;
        }

        patchedWeeklySave.__feedWaterAutoPatched = true;
        patchedWeeklySave.__original = original;
        window.saveWeeklyRecord = patchedWeeklySave;
        return true;
    }

    function boot() {
        const feed = document.getElementById(FEED_ID);
        const water = document.getElementById(WATER_ID);
        const birds = document.getElementById(BIRDS_ID);

        if (!feed || !water || !birds) return false;

        ensureRatioField();
        setReadonlyCalculatedFields();
        attachInputListeners();
        calculateFeedWater();
        patchWeeklyBuilder();
        patchWeeklySave();
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
})();
