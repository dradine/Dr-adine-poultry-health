/* =========================================================
   ADINE POULTRY HEALTH CENTER
   HEALTH DATE ADAPTER

   IMPORTANT:
   This file no longer contains a second Jalali/Gregorian engine.
   All date arithmetic and validation are delegated to date-system.js.
   The health calendar UI remains here because it is a UI concern.
========================================================= */
(function () {
    "use strict";

    const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
    const ARABIC_DIGITS  = "٠١٢٣٤٥٦٧٨٩";

    function toEnglishDigits(value) {
        return String(value ?? "")
            .replace(/[۰-۹]/g, d => String(PERSIAN_DIGITS.indexOf(d)))
            .replace(/[٠-٩]/g, d => String(ARABIC_DIGITS.indexOf(d)));
    }

    function loadCentralEngine() {
        if (window.AdineDateSystem) return Promise.resolve(window.AdineDateSystem);

        return new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-adine-date-engine="true"]');
            if (existing) {
                const started = Date.now();
                const wait = () => {
                    if (window.AdineDateSystem) return resolve(window.AdineDateSystem);
                    if (Date.now() - started > 5000) return reject(new Error("Central date engine did not initialize."));
                    setTimeout(wait, 25);
                };
                wait();
                return;
            }

            const script = document.createElement("script");
            script.src = "date-system.js";
            script.dataset.adineDateEngine = "true";
            script.onload = () => window.AdineDateSystem
                ? resolve(window.AdineDateSystem)
                : reject(new Error("Central date engine loaded without API."));
            script.onerror = () => reject(new Error("Unable to load date-system.js."));
            document.head.appendChild(script);
        });
    }

    function exposeCentralAPI(api) {
        if (!api) return;

        window.jalaliDate = {
            jalaliToISO: api.jalaliToISO,
            isoToJalali: api.isoToJalali,
            todayJalali: api.todayJalali,
            isValidJalali: api.isValidJalali,
            prepareDateFields,
            toEnglishDigits
        };
    }

    function prepareDateFields() {
        document.querySelectorAll(".jalali-input").forEach(input => {
            input.setAttribute("inputmode", "numeric");
            input.setAttribute("autocomplete", "off");
            input.setAttribute("placeholder", "۱۴۰۵/۰۵/۲۹");

            if (input.dataset.adineDateInputBound === "true") return;
            input.dataset.adineDateInputBound = "true";

            input.addEventListener("input", function () {
                this.value = toEnglishDigits(this.value).replace(/[^0-9/]/g, "");
            });

            input.addEventListener("blur", function () {
                const api = window.AdineDateSystem;
                if (!api || !this.value.trim()) return;
                if (!api.isValidJalali(this.value)) {
                    this.setCustomValidity("تاریخ شمسی واردشده معتبر نیست.");
                } else {
                    this.setCustomValidity("");
                }
            });
        });
    }

    async function initializeDateAdapter() {
        try {
            const api = await loadCentralEngine();
            exposeCentralAPI(api);
            prepareDateFields();
        } catch (error) {
            console.error("Health date adapter initialization error:", error);
        }
    }

    /* =====================================================
       SMALL JALALI CALENDAR FOR HEALTH DATE FIELDS
    ===================================================== */
    function installCompactCalendarStyle() {
        if (document.getElementById("adine-health-calendar-compact-style")) return;

        const style = document.createElement("style");
        style.id = "adine-health-calendar-compact-style";
        style.textContent = `
            .datepicker-plot-area {
                width: 238px !important;
                min-width: 238px !important;
                max-width: calc(100vw - 24px) !important;
                box-sizing: border-box !important;
                padding: 4px !important;
                font-size: 12px !important;
                border-radius: 11px !important;
            }
            .datepicker-plot-area .datepicker-header {
                padding: 2px 0 !important;
                margin: 0 !important;
            }
            .datepicker-plot-area .datepicker-navigator {
                min-height: 30px !important;
            }
            .datepicker-plot-area .datepicker-navigator .pwt-btn {
                height: 28px !important;
                line-height: 28px !important;
                font-size: 11px !important;
                padding: 0 4px !important;
            }
            .datepicker-plot-area .table-days {
                width: 100% !important;
                table-layout: fixed !important;
                margin: 0 !important;
            }
            .datepicker-plot-area .table-days th,
            .datepicker-plot-area .table-days td {
                width: 14.2857% !important;
                height: 28px !important;
                padding: 0 !important;
                margin: 0 !important;
                box-sizing: border-box !important;
            }
            .datepicker-plot-area .table-days th {
                font-size: 10px !important;
                line-height: 20px !important;
            }
            .datepicker-plot-area .table-days td span {
                width: 24px !important;
                height: 24px !important;
                line-height: 24px !important;
                font-size: 11px !important;
                margin: 2px auto !important;
                border-radius: 50% !important;
            }
            .datepicker-plot-area .datepicker-footer {
                padding: 2px 0 !important;
                margin: 0 !important;
            }
            .datepicker-plot-area .datepicker-footer .pwt-btn {
                min-height: 25px !important;
                line-height: 25px !important;
                font-size: 10px !important;
                padding: 0 5px !important;
            }
            @media (max-width: 480px) {
                .datepicker-plot-area {
                    width: min(238px, calc(100vw - 24px)) !important;
                    min-width: min(238px, calc(100vw - 24px)) !important;
                    max-width: calc(100vw - 24px) !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function initHealthCalendar() {
        if (
            typeof window.jQuery === "undefined" ||
            typeof window.jQuery.fn.persianDatepicker !== "function"
        ) {
            return;
        }

        installCompactCalendarStyle();

        const $ = window.jQuery;

        $(".jalali-input").each(function () {
            const input = this;
            if (input.dataset.calendarInitialized === "true") return;

            input.dataset.calendarInitialized = "true";

            $(input).persianDatepicker({
                format: "YYYY/MM/DD",
                autoClose: true,
                initialValue: false,
                observer: true,
                calendarType: "persian",
                calendar: {
                    persian: {
                        locale: "fa",
                        leapYearMode: "algorithmic"
                    }
                },
                toolbox: {
                    calendarSwitch: false,
                    todayButton: {
                        enabled: true,
                        text: { fa: "امروز" }
                    }
                },
                navigator: {
                    enabled: true,
                    scroll: { enabled: false }
                },
                responsive: false,
                timePicker: { enabled: false }
            });
        });
    }

    function waitForCalendar() {
        if (
            typeof window.jQuery !== "undefined" &&
            typeof window.jQuery.fn.persianDatepicker === "function"
        ) {
            initHealthCalendar();
            return;
        }
        setTimeout(waitForCalendar, 200);
    }

    window.initHealthCalendar = initHealthCalendar;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            initializeDateAdapter();
            waitForCalendar();
        }, { once: true });
    } else {
        initializeDateAdapter();
        waitForCalendar();
    }
})();
