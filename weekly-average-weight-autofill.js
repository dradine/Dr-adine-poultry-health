/* =========================================================
   WEEKLY AVERAGE WEIGHT AUTO-FILL
   Purpose: after sample-weight monitoring is calculated, the
   existing "وزن متوسط گله (گرم)" field receives the same mean.

   IMPORTANT:
   - No UI/CSS changes.
   - No changes to existing weight/CV/SD/uniformity formulas.
   - No database/schema changes.
   - Uses the existing monitoring result when available.
   - Falls back only to the arithmetic mean of the SAME sample
     inputs, so the field cannot remain blank because of load order.
   - The average-weight field is AUTO-ONLY and READ-ONLY.
========================================================= */

(function installWeeklyAverageWeightAutofill() {
    "use strict";

    function normalize(value) {
        return typeof normalizeNumberString === "function"
            ? normalizeNumberString(value)
            : String(value ?? "");
    }

    function getAverageField() {
        return document.getElementById("averageWeightDirect");
    }

    function lockAverageField() {
        const input = getAverageField();
        if (!input) return false;

        /* READ-ONLY (not disabled): the value remains part of normal form
           submission and existing save/calculation code can still read it. */
        input.readOnly = true;
        input.setAttribute("readonly", "readonly");
        input.setAttribute("aria-readonly", "true");
        input.dataset.autoOnly = "true";

        /* Remove the old manual-entry wording without changing the layout. */
        const help = input.parentElement?.querySelector?.(".quick-entry-help");
        if (help) {
            help.textContent = "این مقدار فقط به‌صورت خودکار از میانگین وزن‌کشی نمونه‌ای محاسبه می‌شود و قابل ورود دستی نیست.";
        }

        return true;
    }

    function setAverageField(mean) {
        const input = getAverageField();
        const numericMean = Number(mean);

        if (!input || !Number.isFinite(numericMean) || numericMean <= 0) {
            return false;
        }

        lockAverageField();
        input.value = normalize(numericMean.toFixed(2));
        input.dataset.autoFilledFromSample = "true";

        /* Keep the existing input system informed without changing it. */
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));

        return true;
    }

    function getSampleWeightsDirectly() {
        return Array.from(document.querySelectorAll("#weightsContainer .bird-weight"))
            .map(input => Number(normalize(input.value)))
            .filter(value => Number.isFinite(value) && value > 0);
    }

    function getCalculatedMean() {
        /* First preference: use the application's own monitoring function. */
        if (typeof getWeights === "function" && typeof calculateWeightStatistics === "function") {
            try {
                const weights = getWeights();
                if (Array.isArray(weights) && weights.length >= 2) {
                    const stats = calculateWeightStatistics(weights);
                    const mean = Number(stats?.mean);
                    if (Number.isFinite(mean) && mean > 0) {
                        return mean;
                    }
                }
            } catch (error) {
                console.warn("Weekly average weight sync fallback:", error);
            }
        }

        /* Same sample values, independent of script/load order. */
        const weights = getSampleWeightsDirectly();
        if (weights.length < 2) return null;

        return weights.reduce((sum, value) => sum + value, 0) / weights.length;
    }

    function syncAverageWeight() {
        lockAverageField();
        const mean = getCalculatedMean();
        return mean !== null && setAverageField(mean);
    }

    function syncAfterCalculation() {
        /* calculateWeekly may update/render other elements after its return.
           A few short retries make the synchronization deterministic without
           interfering with any existing calculation. */
        syncAverageWeight();
        [50, 150, 300, 600].forEach(delay => {
            window.setTimeout(syncAverageWeight, delay);
        });
    }

    function install() {
        if (window.__weeklyAverageWeightAutofillInstalled) return true;

        const button = Array.from(document.querySelectorAll("button"))
            .find(element => {
                const onclick = element.getAttribute("onclick") || "";
                return onclick.includes("calculateWeekly()");
            });

        /* Direct button hook. */
        if (button) {
            button.addEventListener("click", syncAfterCalculation, false);
        }

        /* Capture-phase hook survives changes to the button's own handlers. */
        document.addEventListener("click", function (event) {
            const target = event.target?.closest?.("button");
            if (!target) return;

            const onclick = target.getAttribute("onclick") || "";
            if (onclick.includes("calculateWeekly()")) {
                syncAfterCalculation();
            }
        }, true);

        /* Keep the field synchronized whenever sample weights are edited. */
        const container = document.getElementById("weightsContainer");
        if (container) {
            container.addEventListener("input", function () {
                syncAverageWeight();
            }, false);
        }

        /* If sample-weight inputs are dynamically recreated, observe them. */
        const observerTarget = document.getElementById("weightsContainer");
        if (observerTarget && window.MutationObserver) {
            new MutationObserver(function () {
                lockAverageField();
                syncAverageWeight();
            }).observe(observerTarget, { childList: true, subtree: true });
        }

        lockAverageField();
        window.__weeklyAverageWeightAutofillInstalled = true;
        return true;
    }

    function boot() {
        if (install()) return;

        let attempts = 0;
        const timer = window.setInterval(function () {
            attempts += 1;
            if (install() || attempts >= 100) {
                window.clearInterval(timer);
            }
        }, 100);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
