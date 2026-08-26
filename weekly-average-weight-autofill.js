/* =========================================================
   WEEKLY AVERAGE WEIGHT AUTO-FILL
   Minimal compatibility enhancement:
   - Uses the already calculated sample mean.
   - Mirrors that mean into the existing "averageWeightDirect" field.
   - Does not change weight statistics, FCR, water/feed calculations,
     payload structure, UI markup, or database schema.
========================================================= */

(function installWeeklyAverageWeightAutofill() {
    "use strict";

    function normalize(value) {
        if (typeof normalizeNumberString === "function") {
            return normalizeNumberString(value);
        }
        return String(value ?? "");
    }

    function fillAverageField(mean) {
        const input = document.getElementById("averageWeightDirect");
        if (!input || !Number.isFinite(Number(mean)) || Number(mean) <= 0) return;

        input.value = normalize(Number(mean).toFixed(2));
        input.dataset.autoFilledFromSample = "true";
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function applyFromCurrentSample() {
        if (typeof getWeights !== "function" || typeof calculateWeightStatistics !== "function") return;

        const weights = getWeights();
        if (!Array.isArray(weights) || weights.length < 2) return;

        const stats = calculateWeightStatistics(weights);
        if (stats && Number.isFinite(Number(stats.mean)) && Number(stats.mean) > 0) {
            fillAverageField(stats.mean);
        }
    }

    function install() {
        if (window.__weeklyAverageWeightAutofillInstalled) return true;
        if (typeof window.calculateWeekly !== "function") return false;

        const originalCalculateWeekly = window.calculateWeekly;

        window.calculateWeekly = function () {
            const result = originalCalculateWeekly.apply(this, arguments);
            applyFromCurrentSample();
            return result;
        };

        if (typeof window.editWeeklyRecord === "function") {
            const originalEditWeeklyRecord = window.editWeeklyRecord;
            window.editWeeklyRecord = function (recordId) {
                const result = originalEditWeeklyRecord.apply(this, arguments);
                try {
                    const record = Array.isArray(window.weeklyRecords)
                        ? window.weeklyRecords.find(item => String(item.id) === String(recordId))
                        : null;
                    if (record && Number.isFinite(Number(record.average_weight_g)) && Number(record.average_weight_g) > 0) {
                        fillAverageField(record.average_weight_g);
                    }
                } catch (error) {
                    console.warn("Weekly average weight autofill edit hook:", error);
                }
                return result;
            };
        }

        window.__weeklyAverageWeightAutofillInstalled = true;
        return true;
    }

    function boot() {
        if (install()) return;

        let attempts = 0;
        const timer = setInterval(function () {
            attempts += 1;
            if (install() || attempts >= 50) clearInterval(timer);
        }, 100);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
