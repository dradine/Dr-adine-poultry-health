/* =========================================================
   ADINE POULTRY HEALTH CENTER
   SAFE JALALI DATE CORE
   Central correction for Jalali -> Gregorian conversion.
   The previous flock-specific converter omitted the +78 epoch offset,
   which shifted saved dates (e.g. Mordad dates into Ordibehesht).
========================================================= */
(function () {
    "use strict";

    function normalizeDigits(value) {
        return String(value ?? "")
            .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
            .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
    }

    function jalaliToGregorian(jy, jm, jd) {
        jy = Number(jy);
        jm = Number(jm);
        jd = Number(jd);

        if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return null;
        if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return null;
        if (jm <= 6 && jd > 31) return null;
        if (jm >= 7 && jm <= 11 && jd > 30) return null;
        if (jm === 12 && jd > 30) return null;

        let y = jy - 979;
        let days = 365 * y
            + Math.floor(y / 33) * 8
            + Math.floor(((y % 33) + 3) / 4)
            + 78
            + jd
            + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

        let gy = 1600 + 400 * Math.floor(days / 146097);
        days %= 146097;

        if (days > 36524) {
            days--;
            gy += 100 * Math.floor(days / 36524);
            days %= 36524;
            if (days >= 365) days++;
        }

        gy += 4 * Math.floor(days / 1461);
        days %= 1461;

        if (days > 365) {
            gy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }

        let gd = days + 1;
        const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
        const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let gm = 1;

        for (let i = 0; i < 12; i++) {
            if (gd > monthDays[i]) {
                gd -= monthDays[i];
                gm++;
            } else break;
        }

        return { gy, gm, gd };
    }

    function jalaliToGregorianISO(value) {
        const text = normalizeDigits(value).trim().replace(/[.-]/g, "/");
        const p = text.split("/").map(Number);
        if (p.length !== 3 || p.some(Number.isNaN)) return null;
        const g = jalaliToGregorian(p[0], p[1], p[2]);
        if (!g) return null;
        return `${String(g.gy).padStart(4, "0")}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
    }

    // Override the legacy global functions used by flocks.js/weekly.js.
    window.jalaliToGregorian = jalaliToGregorian;
    window.jalaliToGregorianISO = jalaliToGregorianISO;
    window.AdineDateSystem = { jalaliToGregorian, jalaliToGregorianISO };
})();
