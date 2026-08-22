/* =========================================================
   ADINE POULTRY HEALTH CENTER
   JALALI DATE ENGINE
   بدون وابستگی به jQuery / Persian Datepicker
   ========================================================= */

(function () {

    "use strict";

    const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
    const ARABIC_DIGITS  = "٠١٢٣٤٥٦٧٨٩";

    function toEnglishDigits(value) {

        return String(value || "")
            .replace(/[۰-۹]/g, d =>
                String(PERSIAN_DIGITS.indexOf(d))
            )
            .replace(/[٠-٩]/g, d =>
                String(ARABIC_DIGITS.indexOf(d))
            );
    }


    function pad(number) {

        return String(number).padStart(2, "0");

    }


    /* =====================================================
       GREGORIAN → JALALI
    ===================================================== */

    function gregorianToJalali(gy, gm, gd) {

        const g_d_m = [
            0,
            31,
            59,
            90,
            120,
            151,
            181,
            212,
            243,
            273,
            304,
            334
        ];

        let jy;

        if (gy > 1600) {

            jy = 979;

            gy -= 1600;

        } else {

            jy = 0;

            gy -= 621;

        }

        const gy2 =
            gm > 2
                ? gy + 1
                : gy;

        let days =
            365 * gy +
            Math.floor((gy2 + 3) / 4) -
            Math.floor((gy2 + 99) / 100) +
            Math.floor((gy2 + 399) / 400) -
            80 +
            gd +
            g_d_m[gm - 1];

        jy +=
            33 *
            Math.floor(days / 12053);

        days %= 12053;

        jy +=
            4 *
            Math.floor(days / 1461);

        days %= 1461;

        if (days > 365) {

            jy +=
                Math.floor(
                    (days - 1) / 365
                );

            days =
                (days - 1) % 365;

        }

        let jm;

        if (days < 186) {

            jm =
                1 +
                Math.floor(days / 31);

        } else {

            jm =
                7 +
                Math.floor(
                    (days - 186) / 30
                );

        }

        const jd =
            1 +
            (
                days < 186
                    ? days % 31
                    : (days - 186) % 30
            );

        return {
            jy,
            jm,
            jd
        };

    }


    /* =====================================================
       JALALI → GREGORIAN
    ===================================================== */

    function jalaliToGregorian(jy, jm, jd) {

        jy = Number(jy);
        jm = Number(jm);
        jd = Number(jd);

        let gy;

        if (jy > 979) {

            gy = 1600;

            jy -= 979;

        } else {

            gy = 621;

        }

        let days =
            365 * jy +
            Math.floor(jy / 33) * 8 +
            Math.floor(
                ((jy % 33) + 3) / 4
            ) +
            78 +
            jd +
            (
                jm < 7
                    ? (jm - 1) * 31
                    : ((jm - 7) * 30) + 186
            );

        gy +=
            400 *
            Math.floor(days / 146097);

        days %= 146097;

        if (days > 36524) {

            gy +=
                100 *
                Math.floor(
                    --days / 36524
                );

            days %= 36524;

            if (days >= 365) {

                days++;

            }

        }

        gy +=
            4 *
            Math.floor(days / 1461);

        days %= 1461;

        if (days > 365) {

            gy +=
                Math.floor(
                    (days - 1) / 365
                );

            days =
                (days - 1) % 365;

        }

        let gd =
            days + 1;

        const sal_a = [
            0,
            31,
            (
                (gy % 4 === 0 &&
                 gy % 100 !== 0) ||
                 gy % 400 === 0
            )
                ? 29
                : 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31
        ];

        let gm = 0;

        while (
            gd >
            sal_a[gm]
        ) {

            gd -= sal_a[gm];

            gm++;

        }

        return {
            gy,
            gm,
            gd
        };

    }


    /* =====================================================
       JALALI STRING → ISO
       1405/05/30 → 2026-08-21
    ===================================================== */

    function jalaliToISO(value) {

        if (!value) {
            return null;
        }

        let text =
            toEnglishDigits(value)
                .trim()
                .replace(/-/g, "/")
                .replace(/\./g, "/");

        const parts =
            text.split("/");

        if (parts.length !== 3) {
            return null;
        }

        const jy = Number(parts[0]);
        const jm = Number(parts[1]);
        const jd = Number(parts[2]);

        if (
            !Number.isInteger(jy) ||
            !Number.isInteger(jm) ||
            !Number.isInteger(jd)
        ) {
            return null;
        }

        if (
            jy < 1300 ||
            jy > 1500 ||
            jm < 1 ||
            jm > 12 ||
            jd < 1 ||
            jd > 31
        ) {
            return null;
        }

        const g =
            jalaliToGregorian(
                jy,
                jm,
                jd
            );

        return (
            String(g.gy).padStart(4, "0") +
            "-" +
            pad(g.gm) +
            "-" +
            pad(g.gd)
        );

    }


    /* =====================================================
       ISO → JALALI
    ===================================================== */

    function isoToJalali(value) {

        if (!value) {
            return "";
        }

        const text =
            String(value).substring(0, 10);

        const parts =
            text.split("-");

        if (parts.length !== 3) {
            return value;
        }

        const gy = Number(parts[0]);
        const gm = Number(parts[1]);
        const gd = Number(parts[2]);

        if (
            !gy ||
            !gm ||
            !gd
        ) {
            return value;
        }

        const j =
            gregorianToJalali(
                gy,
                gm,
                gd
            );

        return (
            j.jy +
            "/" +
            pad(j.jm) +
            "/" +
            pad(j.jd)
        );

    }


    /* =====================================================
       TODAY
    ===================================================== */

    function todayJalali() {

        const now =
            new Date();

        return isoToJalali(
            now.toISOString()
        );

    }


    /* =====================================================
       VALIDATE
    ===================================================== */

    function isValidJalali(value) {

        return Boolean(
            jalaliToISO(value)
        );

    }


    /* =====================================================
       PREPARE DATE INPUTS
    ===================================================== */

    function prepareDateFields() {

        document
            .querySelectorAll(
                ".jalali-input"
            )
            .forEach(input => {

                input.setAttribute(
                    "inputmode",
                    "numeric"
                );

                input.setAttribute(
                    "autocomplete",
                    "off"
                );

                input.setAttribute(
                    "placeholder",
                    "۱۴۰۵/۰۵/۲۹"
                );

                input.addEventListener(
                    "input",
                    function () {

                        let value =
                            toEnglishDigits(
                                this.value
                            );

                        value =
                            value.replace(
                                /[^0-9/]/g,
                                ""
                            );

                        this.value =
                            value;

                    }
                );

            });

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.jalaliDate = {

        jalaliToISO,

        isoToJalali,

        todayJalali,

        isValidJalali,

        prepareDateFields,

        toEnglishDigits

    };

})();
/* =========================================================
   SMALL JALALI CALENDAR FOR HEALTH DATE FIELDS
========================================================= */

(function () {

    "use strict";

    function initHealthCalendar() {

        if (
            typeof window.jQuery === "undefined" ||
            typeof window.jQuery.fn.persianDatepicker !== "function"
        ) {
            console.warn("Persian datepicker is not loaded yet.");
            return;
        }

        const $ = window.jQuery;

        $(".jalali-input").each(function () {

            const input = this;

            if (input.dataset.calendarInitialized === "true") {
                return;
            }

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
                        text: {
                            fa: "امروز"
                        }
                    }
                },

                navigator: {
                    enabled: true,
                    scroll: {
                        enabled: false
                    }
                },

                responsive: true,

                timePicker: {
                    enabled: false
                }

            });

        });

    }


    /*
       چون کتابخانه تقویم بعد از health-date.js
       لود می‌شود، کمی صبر می‌کنیم.
    */

    function waitForCalendar() {

        if (
            typeof window.jQuery !== "undefined" &&
            typeof window.jQuery.fn.persianDatepicker === "function"
        ) {

            initHealthCalendar();

        } else {

            setTimeout(
                waitForCalendar,
                200
            );

        }

    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            waitForCalendar
        );

    } else {

        waitForCalendar();

    }


    window.initHealthCalendar =
        initHealthCalendar;

})();

