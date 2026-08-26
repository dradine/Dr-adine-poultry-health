/* ADINEH | Production start date picker
   UI-only enhancement: does not change storage, calculations, validation or layout.
   Uses the same Persian datepicker libraries already loaded by flocks.html.
*/
(function () {
    "use strict";

    function initProductionStartDatePicker() {
        const input = document.getElementById("productionStartDate");
        if (!input || typeof window.jQuery === "undefined" || !jQuery.fn.persianDatepicker) return;

        const $input = jQuery(input);
        if ($input.data("pDatepickerInitialized")) return;

        $input.attr("readonly", "readonly");
        $input.attr("inputmode", "none");

        $input.persianDatepicker({
            format: "YYYY/MM/DD",
            autoClose: true,
            initialValue: false,
            observer: true,
            calendarType: "persian",
            toolbox: {
                calendarSwitch: { enabled: false }
            }
        });

        $input.data("pDatepickerInitialized", true);
    }

    function initWhenReady() {
        initProductionStartDatePicker();
        const target = document.getElementById("productionBaselineFields");
        if (target && !target.dataset.productionDateObserver) {
            target.dataset.productionDateObserver = "1";
            new MutationObserver(initProductionStartDatePicker).observe(target, {
                childList: true,
                subtree: true
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initWhenReady);
    } else {
        initWhenReady();
    }

    // farm-house-flock-enhancements creates this field after page load.
    window.addEventListener("load", initProductionStartDatePicker);
})();
