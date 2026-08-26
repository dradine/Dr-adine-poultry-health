/* =========================================================
   WEEKLY DATE SAVE COMPATIBILITY FIX
   Minimal patch: keep weekly UI/calculations unchanged and make
   weekly date conversion use the central date engine only.
========================================================= */
(function () {
    "use strict";

    function install() {
        if (!window.AdineDateSystem) {
            console.warn("Weekly date fix: central date engine is unavailable.");
            return;
        }

        if (typeof window.AdineDateSystem.jalaliToISO === "function") {
            window.getGregorianDateForSupabase = function (value) {
                const iso = window.AdineDateSystem.jalaliToISO(value);
                if (!iso) {
                    throw new Error("تاریخ شمسی واردشده صحیح نیست.");
                }
                return iso;
            };
        }

        if (typeof window.AdineDateSystem.isoToJalali === "function") {
            window.convertDatabaseDateToShamsi = function (value) {
                return value
                    ? window.AdineDateSystem.isoToJalali(value)
                    : "";
            };
        }

        window.__ADINE_WEEKLY_DATE_FIX__ = true;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();
