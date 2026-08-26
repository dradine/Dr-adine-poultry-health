/* =========================================================
   WEEKLY AVERAGE WEIGHT AUTO-FILL
   Isolated enhancement: after sample-weight monitoring is
   calculated, copy the SAME calculated sample mean into the
   existing "averageWeightDirect" field.
   No UI, calculation formula, payload or database structure changes.
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
        const numericMean = Number(mean);
        if (!input || !Number.isFinite(numericMean) || numericMean <= 0) return;

        input.value = normalize(numericMean.toFixed(2));
        input.dataset.autoFilledFromSample = "true";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function applyFromCurrentSample() {
        if (typeof getWeights !== "function" || typeof calculateWeightStatistics !== "function") return false;

        const weights = getWeights();
        if (!Array.isArray(weights) || weights.length < 2) return false;

        const stats = calculateWeightStatistics(weights);
        if (!stats || !Number.isFinite(Number(stats.mean)) || Number(stats.mean) <= 0) return false;

        fillAverageField(stats.mean);
        return true;
    }

    function install() {
        if (window.__weeklyAverageWeightAutofillInstalled) return true;
        if (typeof window.calculateWeekly !== "function") return false;

        /*
         * Primary hook: wrap the existing function. This preserves the
         * original calculation completely, then mirrors its result.
         */
        const originalCalculateWeekly = window.calculateWeekly;
        window.calculateWeekly = function () {
            const result = originalCalculateWeekly.apply(this, arguments);
            applyFromCurrentSample();
            return result;
        };

        /*
         * Safety hook: inline onclick handlers run before bubbling event
         * listeners. Therefore this also guarantees that a click on the
         * existing "محاسبه پایش" button fills the field after calculation,
         * even if another script replaces the global function later.
         */
        const calculateButton = Array.from(document.querySelectorAll("button")).find(button => {
            const onclick = button.getAttribute("onclick") || "";
            return onclick.includes("calculateWeekly()");
        });

        if (calculateButton) {
            calculateButton.addEventListener("click", function () {
                setTimeout(applyFromCurrentSample, 0);
            }, false);
        }

        /* When adding/editing sample weights, keep the field synchronized
           once there are at least two valid sample weights. */
        const weightsContainer = document.getElementById("weightsContainer");
        if (weightsContainer) {
            weightsContainer.addEventListener("input", function () {
                if (getWeights().length >= 2) applyFromCurrentSample();
            });
        }

        window.__weeklyAverageWeightAutofillInstalled = true;
        return true;
    }

    function boot() {
        if (install()) return;

        let attempts = 0;
        const timer = setInterval(function () {
            attempts += 1;
            if (install() || attempts >= 100) clearInterval(timer);
        }, 100);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
