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

    function gregorianToJalali(gy, gm, gd) {
        gy = Number(gy); gm = Number(gm); gd = Number(gd);
        if (!isValidGregorian(gy, gm, gd)) return null;
        const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        let jy;
        let g = gy;
        if (g > 1600) { jy = 979; g -= 1600; } else { jy = 0; g -= 621; }
        const gy2 = gm > 2 ? g + 1 : g;
        let days = 365 * g + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + gdm[gm - 1];
        jy += 33 * Math.floor(days / 12053);
        days %= 12053;
        jy += 4 * Math.floor(days / 1461);
        days %= 1461;
        if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
        const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
        const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
        const result = [jy, jm, jd];
        result.jy = jy; result.jm = jm; result.jd = jd;
        return result;
    }

    function jalaliToGregorian(jy, jm, jd) {
        jy = Number(jy); jm = Number(jm); jd = Number(jd);
        if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return null;
        if (jy < 1 || jy > 3000 || jm < 1 || jm > 12 || jd < 1 || jd > 31) return null;
        if (jm <= 6 && jd > 31) return null;
        if (jm >= 7 && jm <= 11 && jd > 30) return null;
        if (jm === 12 && jd > 30) return null;
        let gy; let y;
        if (jy > 979) { gy = 1600; y = jy - 979; } else { gy = 621; y = jy; }
        let days = 365 * y + Math.floor(y / 33) * 8 + Math.floor(((y % 33) + 3) / 4) + 78 + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
        gy += 400 * Math.floor(days / 146097);
        days %= 146097;
        if (days > 36524) { gy += 100 * Math.floor((days - 1) / 36524); days = (days - 1) % 36524; if (days >= 365) days++; }
        gy += 4 * Math.floor(days / 1461);
        days %= 1461;
        if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
        let gd = days + 1; let gm = 1;
        while (gd > daysInGregorianMonth(gy, gm)) { gd -= daysInGregorianMonth(gy, gm); gm++; }
        return { gy, gm, gd };
    }

    function jalaliToGregorianISO(value) {
        if (value === null || value === undefined) return null;
        const text = normalizeDigits(value).trim().replace(/[.-]/g, "/");
        const parts = text.split("/");
        if (parts.length !== 3) return null;
        const jy = Number(parts[0]); const jm = Number(parts[1]); const jd = Number(parts[2]);
        if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return null;
        const g = jalaliToGregorian(jy, jm, jd);
        if (!g || !isValidGregorian(g.gy, g.gm, g.gd)) return null;
        const roundTrip = gregorianToJalali(g.gy, g.gm, g.gd);
        if (!roundTrip || roundTrip.jy !== jy || roundTrip.jm !== jm || roundTrip.jd !== jd) return null;
        return `${pad(g.gy, 4)}-${pad(g.gm)}-${pad(g.gd)}`;
    }

    function isoToJalali(value) {
        if (!value) return "";
        const text = String(value).trim().slice(0, 10);
        const parts = text.split("-");
        if (parts.length !== 3) return "";
        const gy = Number(parts[0]); const gm = Number(parts[1]); const gd = Number(parts[2]);
        if (!isValidGregorian(gy, gm, gd)) return "";
        const j = gregorianToJalali(gy, gm, gd);
        return j ? `${j.jy}/${pad(j.jm)}/${pad(j.jd)}` : "";
    }

    function isValidJalali(value) { return Boolean(jalaliToGregorianISO(value)); }
    function isJalaliLeapYear(jy) { return Boolean(jalaliToGregorianISO(`${Number(jy)}/12/30`)); }
    function todayGregorianISO() { const now = new Date(); return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`; }
    function todayJalali() { return isoToJalali(todayGregorianISO()); }
    function jalaliToISO(value) { return jalaliToGregorianISO(value); }
    function dateOnlyDiffDays(isoA, isoB) {
        const a = String(isoA || "").slice(0, 10).split("-").map(Number);
        const b = String(isoB || "").slice(0, 10).split("-").map(Number);
        if (a.length !== 3 || b.length !== 3 || !isValidGregorian(a[0], a[1], a[2]) || !isValidGregorian(b[0], b[1], b[2])) return null;
        return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
    }
    function jalaliDiffDays(start, end) { const a = jalaliToISO(start); const b = jalaliToISO(end); return a && b ? dateOnlyDiffDays(a, b) : null; }
    function formatJalali(value, persianDigits = false) { const text = isoToJalali(value); return persianDigits ? text.replace(/\d/g, d => PERSIAN_DIGITS[d]) : text; }

    function runSelfTest() {
        const failures = [];
        const expectRoundTrip = (j, expectedISO = null) => {
            const iso = jalaliToISO(j); const back = isoToJalali(iso);
            const expectedJalali = normalizeDigits(j).replace(/[-.]/g, "/").split("/").map((v, i) => i === 0 ? String(Number(v)) : pad(Number(v))).join("/");
            if (!iso || back !== expectedJalali) failures.push({ type: "round-trip", input: j, iso, back });
            if (expectedISO && iso !== expectedISO) failures.push({ type: "known-value", input: j, iso, expectedISO });
        };
        [["1405/01/01","2026-03-21"],["1405/01/31","2026-04-20"],["1405/02/01","2026-04-21"],["1405/04/31","2026-07-22"],["1405/05/08","2026-07-30"],["1405/05/31","2026-08-22"],["1405/06/01","2026-08-23"],["1405/12/29","2027-03-20"],["1403/12/30","2025-03-20"]].forEach(([j, iso]) => expectRoundTrip(j, iso));
        ["1405/12/30","1405/01/32","1405/07/31","1405/13/01","1405/00/01","1405/02/00","۱۴۰۵/۱۲/۳۰","1405-12-30","1405.12.30"].forEach(j => { if (isValidJalali(j)) failures.push({ type: "invalid-accepted", input: j }); });
        ["1403/12/30","1408/12/30","1399/12/30"].forEach(j => { if (!isValidJalali(j)) failures.push({ type: "leap-rejected", input: j }); });
        if (!isValidGregorian(2024, 2, 29)) failures.push({ type: "gregorian-leap" });
        if (isValidGregorian(2025, 2, 29)) failures.push({ type: "gregorian-invalid-leap" });
        if (dateOnlyDiffDays("2026-03-21", "2026-03-22") !== 1) failures.push({ type: "diff" });
        if (dateOnlyDiffDays("2026-03-22", "2026-03-21") !== -1) failures.push({ type: "diff" });
        if (jalaliDiffDays("1405/01/01", "1405/01/31") !== 30) failures.push({ type: "jalali-diff" });
        if (normalizeDigits("۱۴۰۵/۰۵/۰۸") !== "1405/05/08") failures.push({ type: "digits" });
        if (todayJalali() !== isoToJalali(todayGregorianISO())) failures.push({ type: "today" });
        return { ok: failures.length === 0, testCount: 28, failures };
    }

    window.AdineDateSystem = { normalizeDigits, gregorianToJalali, jalaliToGregorian, jalaliToGregorianISO, jalaliToISO, isoToJalali, isValidJalali, isJalaliLeapYear, todayGregorianISO, todayJalali, dateOnlyDiffDays, jalaliDiffDays, formatJalali, runSelfTest };
    window.gregorianToJalali = gregorianToJalali;
    window.jalaliToGregorian = jalaliToGregorian;
    window.jalaliToGregorianISO = jalaliToGregorianISO;
    window.jalaliToISO = jalaliToISO;
    window.isoToJalali = isoToJalali;
    window.__ADINE_DATE_SELF_TEST__ = runSelfTest();
})();

/* =========================================================
   WEEKLY AUTO FEED / WATER METRICS v3
   - Feed/bird and water/bird are derived only.
   - Population denominator is weekly average live birds.
   - Opening population is taken from the previous weekly record when
     available; otherwise flock initial count for week 1; otherwise
     closing live birds + weekly mortality (no movement assumed).
   - Water/feed is L/kg and independent of bird count.
========================================================= */
(function () {
    "use strict";

    function isWeeklyPage() {
        return Boolean(document.getElementById("feedTotal") && document.getElementById("waterTotal"));
    }

    function numberFrom(id) {
        const el = document.getElementById(id);
        if (!el) return null;
        const raw = typeof window.normalizeNumberString === "function"
            ? window.normalizeNumberString(el.value)
            : String(el.value || "").replace(/,/g, "").replace(/٬/g, "").replace(/٫/g, ".");
        if (!raw.trim()) return null;
        const value = Number(raw);
        return Number.isFinite(value) ? value : null;
    }

    function setDerived(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = value == null || !Number.isFinite(value) ? "" : Number(value.toFixed(3)).toString();
        el.readOnly = true;
        el.setAttribute("data-auto-derived", "true");
        el.setAttribute("aria-readonly", "true");
    }

    async function previousOpeningLive() {
        const flock = window.currentFlockForSpecialized || window.currentFlock || null;
        const week = numberFrom("weekNumber");
        const closing = numberFrom("liveBirds");
        if (!(closing > 0)) return { opening: null, basis: "جمعیت پایان هفته ثبت نشده است" };

        const initial = Number(flock?.initial_bird_count ?? flock?.initialBirdCount);
        if (week === 1 && Number.isFinite(initial) && initial > 0) {
            return { opening: initial, basis: "جمعیت ابتدای هفته = جوجه‌ریزی اولیه" };
        }

        if (flock?.id && week > 1 && window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient
                    .from("weekly_records")
                    .select("week_number,age_days,live_birds")
                    .eq("flock_id", flock.id)
                    .lt("week_number", week)
                    .order("week_number", { ascending: false })
                    .limit(1);
                if (!error && data?.length) {
                    const prev = Number(data[0].live_birds);
                    if (prev > 0) return { opening: prev, basis: "جمعیت ابتدای هفته = پایان هفته قبل" };
                }
            } catch (_) {}
        }

        const mortality = numberFrom("mortalityWeek");
        if (Number.isFinite(mortality) && mortality >= 0) {
            return { opening: closing + mortality, basis: "برآورد جمعیت ابتدای هفته از پایان هفته + تلفات؛ بدون جابه‌جایی" };
        }
        return { opening: closing, basis: "جمعیت ابتدای هفته در دسترس نیست؛ مخرج برابر پایان هفته" };
    }

    let calculationToken = 0;
    async function update() {
        if (!isWeeklyPage()) return;
        const token = ++calculationToken;
        const feedKg = numberFrom("feedTotal");
        const waterL = numberFrom("waterTotal");
        const basis = await previousOpeningLive();
        if (token !== calculationToken) return;

        const averageLive = basis.opening != null && numberFrom("liveBirds") > 0
            ? (basis.opening + numberFrom("liveBirds")) / 2
            : null;
        const feedPerBird = feedKg != null && feedKg >= 0 && averageLive > 0 ? feedKg * 1000 / averageLive : null;
        const waterPerBird = waterL != null && waterL >= 0 && averageLive > 0 ? waterL * 1000 / averageLive : null;
        const waterFeedRatio = feedKg != null && feedKg > 0 && waterL != null && waterL >= 0 ? waterL / feedKg : null;

        setDerived("feedPerBird", feedPerBird);
        setDerived("waterPerBird", waterPerBird);

        const ratioEl = document.getElementById("autoFeedWaterRatioValue");
        if (ratioEl) ratioEl.textContent = waterFeedRatio == null ? "نسبت آب به دان: —" : `نسبت آب به دان: ${waterFeedRatio.toFixed(3)} : 1`;

        const basisEl = document.getElementById("autoFeedWaterPopulationBasis");
        if (basisEl) basisEl.textContent = averageLive > 0 ? `${basis.basis} | جمعیت متوسط هفتگی: ${Math.round(averageLive).toLocaleString("fa-IR")} قطعه` : basis.basis;
    }

    function bind() {
        if (!isWeeklyPage()) return;
        ["feedTotal", "waterTotal", "liveBirds", "mortalityWeek", "weekNumber"].forEach(id => {
            const el = document.getElementById(id);
            if (!el || el.dataset.weeklyAutoBound === "true") return;
            el.dataset.weeklyAutoBound = "true";
            el.addEventListener("input", update);
            el.addEventListener("change", update);
        });
        update();
    }

    function protectDerivedFields() {
        ["feedPerBird", "waterPerBird"].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.readOnly = true;
            el.setAttribute("data-auto-derived", "true");
            el.setAttribute("aria-readonly", "true");
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!isWeeklyPage()) return;
        bind();
        protectDerivedFields();
        setTimeout(bind, 300);
        setTimeout(update, 900);
    });

    const observer = new MutationObserver(function () {
        if (isWeeklyPage()) {
            protectDerivedFields();
            bind();
        }
    });
    document.addEventListener("DOMContentLoaded", function () {
        observer.observe(document.body, { childList: true, subtree: true });
    });

    window.AdineWeeklyAutoMetrics = { update, populationBasis: previousOpeningLive };
})();
