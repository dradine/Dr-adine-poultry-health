/* =========================================================
   ADINE POULTRY HEALTH CENTER
   CENTRAL DATE ENGINE v2

   Rules:
   - UI dates are Jalali (Shamsi).
   - Database date-only values are Gregorian ISO: YYYY-MM-DD.
   - No date-only conversion uses toISOString().
   - Gregorian <-> Jalali conversions are round-trip validated.
   - Invalid Jalali dates (for example 1405/12/30) are rejected.
   - Public compatibility APIs are kept for legacy flock/weekly code.
========================================================= */
(function () {
    "use strict";

    const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
    const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

    function normalizeDigits(value) {
        return String(value ?? "")
            .replace(/[۰-۹]/g, d => String(PERSIAN_DIGITS.indexOf(d)))
            .replace(/[٠-٩]/g, d => String(ARABIC_DIGITS.indexOf(d)));
    }

    function pad(n, size = 2) {
        return String(n).padStart(size, "0");
    }

    function isGregorianLeapYear(gy) {
        return (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
    }

    function daysInGregorianMonth(gy, gm) {
        const days = [31, isGregorianLeapYear(gy) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return days[gm - 1] || 0;
    }

    function isValidGregorian(gy, gm, gd) {
        return Number.isInteger(gy) && Number.isInteger(gm) && Number.isInteger(gd)
            && gm >= 1 && gm <= 12
            && gd >= 1 && gd <= daysInGregorianMonth(gy, gm);
    }

    /* ---------------------------------------------------------
       GREGORIAN -> JALALI
       Returned value is both array-compatible and object-compatible:
       result[0]/[1]/[2] and result.jy/jm/jd.
    --------------------------------------------------------- */
    function gregorianToJalali(gy, gm, gd) {
        gy = Number(gy); gm = Number(gm); gd = Number(gd);
        if (!isValidGregorian(gy, gm, gd)) return null;

        const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        let jy;
        let g = gy;

        if (g > 1600) {
            jy = 979;
            g -= 1600;
        } else {
            jy = 0;
            g -= 621;
        }

        const gy2 = gm > 2 ? g + 1 : g;
        let days = 365 * g
            + Math.floor((gy2 + 3) / 4)
            - Math.floor((gy2 + 99) / 100)
            + Math.floor((gy2 + 399) / 400)
            - 80 + gd + gdm[gm - 1];

        jy += 33 * Math.floor(days / 12053);
        days %= 12053;
        jy += 4 * Math.floor(days / 1461);
        days %= 1461;

        if (days > 365) {
            jy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }

        const jm = days < 186
            ? 1 + Math.floor(days / 31)
            : 7 + Math.floor((days - 186) / 30);

        const jd = 1 + (days < 186
            ? days % 31
            : (days - 186) % 30);

        const result = [jy, jm, jd];
        result.jy = jy;
        result.jm = jm;
        result.jd = jd;
        return result;
    }

    /* ---------------------------------------------------------
       JALALI -> GREGORIAN
       The arithmetic is followed by a reverse conversion check
       in the public ISO parser, so impossible dates are rejected.
    --------------------------------------------------------- */
    function jalaliToGregorian(jy, jm, jd) {
        jy = Number(jy); jm = Number(jm); jd = Number(jd);

        if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return null;
        if (jy < 1 || jy > 3000 || jm < 1 || jm > 12 || jd < 1 || jd > 31) return null;
        if (jm <= 6 && jd > 31) return null;
        if (jm >= 7 && jm <= 11 && jd > 30) return null;
        if (jm === 12 && jd > 30) return null;

        let gy;
        let y;

        if (jy > 979) {
            gy = 1600;
            y = jy - 979;
        } else {
            gy = 621;
            y = jy;
        }

        let days = 365 * y
            + Math.floor(y / 33) * 8
            + Math.floor(((y % 33) + 3) / 4)
            + 78 + jd
            + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

        gy += 400 * Math.floor(days / 146097);
        days %= 146097;

        if (days > 36524) {
            gy += 100 * Math.floor((days - 1) / 36524);
            days = (days - 1) % 36524;
            if (days >= 365) days++;
        }

        gy += 4 * Math.floor(days / 1461);
        days %= 1461;

        if (days > 365) {
            gy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }

        let gd = days + 1;
        let gm = 1;
        while (gd > daysInGregorianMonth(gy, gm)) {
            gd -= daysInGregorianMonth(gy, gm);
            gm++;
        }

        return { gy, gm, gd };
    }

    function jalaliToGregorianISO(value) {
        if (value === null || value === undefined) return null;
        const text = normalizeDigits(value).trim().replace(/[.-]/g, "/");
        const parts = text.split("/");
        if (parts.length !== 3) return null;

        const jy = Number(parts[0]);
        const jm = Number(parts[1]);
        const jd = Number(parts[2]);
        if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return null;

        const g = jalaliToGregorian(jy, jm, jd);
        if (!g || !isValidGregorian(g.gy, g.gm, g.gd)) return null;

        // Critical: reject impossible Jalali dates such as 1405/12/30.
        const roundTrip = gregorianToJalali(g.gy, g.gm, g.gd);
        if (!roundTrip || roundTrip.jy !== jy || roundTrip.jm !== jm || roundTrip.jd !== jd) return null;

        return `${pad(g.gy, 4)}-${pad(g.gm)}-${pad(g.gd)}`;
    }

    function isoToJalali(value) {
        if (!value) return "";
        const text = String(value).trim().slice(0, 10);
        const parts = text.split("-");
        if (parts.length !== 3) return value;

        const gy = Number(parts[0]);
        const gm = Number(parts[1]);
        const gd = Number(parts[2]);
        if (!isValidGregorian(gy, gm, gd)) return "";

        const j = gregorianToJalali(gy, gm, gd);
        return j ? `${j.jy}/${pad(j.jm)}/${pad(j.jd)}` : "";
    }

    function isValidJalali(value) {
        return Boolean(jalaliToGregorianISO(value));
    }

    function isJalaliLeapYear(jy) {
        return Boolean(jalaliToGregorianISO(`${jy}/12/30`));
    }

    function todayGregorianISO() {
        const now = new Date();
        // Local calendar date. Deliberately NOT toISOString().slice(0,10).
        return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    }

    function todayJalali() {
        return isoToJalali(todayGregorianISO());
    }

    function jalaliToISO(value) {
        return jalaliToGregorianISO(value);
    }

    function dateOnlyDiffDays(isoA, isoB) {
        const a = String(isoA || "").slice(0, 10).split("-").map(Number);
        const b = String(isoB || "").slice(0, 10).split("-").map(Number);
        if (a.length !== 3 || b.length !== 3 || !isValidGregorian(a[0], a[1], a[2]) || !isValidGregorian(b[0], b[1], b[2])) return null;
        return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
    }

    function jalaliDiffDays(start, end) {
        const a = jalaliToISO(start);
        const b = jalaliToISO(end);
        if (!a || !b) return null;
        return dateOnlyDiffDays(a, b);
    }

    function formatJalali(value, persianDigits = false) {
        const text = isoToJalali(value);
        if (!persianDigits) return text;
        return text.replace(/\d/g, d => PERSIAN_DIGITS[d]);
    }

    function runSelfTest() {
        const cases = [
            "1405/01/01",
            "1405/01/31",
            "1405/02/01",
            "1405/04/31",
            "1405/05/08",
            "1405/05/31",
            "1405/06/01",
            "1405/12/29",
            "1403/12/30"
        ];

        const failures = [];
        cases.forEach(j => {
            const iso = jalaliToISO(j);
            const back = isoToJalali(iso);
            if (!iso || back !== j) failures.push({ j, iso, back });
        });

        if (isValidJalali("1405/12/30")) failures.push({ j: "1405/12/30", error: "invalid leap day accepted" });
        if (!isValidJalali("1403/12/30")) failures.push({ j: "1403/12/30", error: "valid leap day rejected" });

        return {
            ok: failures.length === 0,
            cases: cases.length,
            failures
        };
    }

    const api = {
        normalizeDigits,
        gregorianToJalali,
        jalaliToGregorian,
        jalaliToGregorianISO,
        jalaliToISO,
        isoToJalali,
        isValidJalali,
        isJalaliLeapYear,
        todayGregorianISO,
        todayJalali,
        dateOnlyDiffDays,
        jalaliDiffDays,
        formatJalali,
        runSelfTest
    };

    // Canonical API.
    window.AdineDateSystem = api;

    // Compatibility for existing code in flocks.js / weekly.js / health.js.
    window.gregorianToJalali = gregorianToJalali;
    window.jalaliToGregorian = jalaliToGregorian;
    window.jalaliToGregorianISO = jalaliToGregorianISO;
    window.jalaliToISO = jalaliToISO;
    window.isoToJalali = isoToJalali;

    // Do not spam production logs; only expose the result for diagnostics.
    window.__ADINE_DATE_SELF_TEST__ = runSelfTest();
})();
