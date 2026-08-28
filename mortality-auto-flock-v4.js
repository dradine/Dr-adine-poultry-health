"use strict";

/* ADINEH mortality/disease module — active flock synchronization + event-date age. */
(function(){
    let lastKey = null;
    let syncing = false;
    let ageWatchTimer = null;

    function getHealthFlock(){
        try {
            if (typeof healthFlock !== "undefined" && healthFlock) return healthFlock;
        } catch (_) {}
        return window.healthFlock || null;
    }

    function selectionKey(){
        try {
            if (typeof getCurrentSelection !== "function") return "";
            const s = getCurrentSelection() || {};
            return String(s.flockId || "");
        } catch (_) { return ""; }
    }

    function normalizeDate(value){
        if (!value) return null;
        const raw = String(value).trim().replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
        try {
            if (window.jalaliDate && typeof window.jalaliDate.jalaliToISO === "function") {
                const iso = window.jalaliDate.jalaliToISO(raw);
                if (iso) return String(iso).slice(0,10);
            }
        } catch (_) {}
        try {
            if (window.AdineDateSystem && typeof window.AdineDateSystem.jalaliToISO === "function") {
                const iso = window.AdineDateSystem.jalaliToISO(raw);
                if (iso) return String(iso).slice(0,10);
            }
        } catch (_) {}
        try {
            if (typeof window.jalaliToGregorianISO === "function") {
                const iso = window.jalaliToGregorianISO(raw);
                if (iso) return String(iso).slice(0,10);
            }
        } catch (_) {}
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
        return null;
    }

    function dateOnlyDiffDays(startISO, endISO){
        const diffFn = window.AdineDateSystem && typeof window.AdineDateSystem.dateOnlyDiffDays === "function"
            ? window.AdineDateSystem.dateOnlyDiffDays
            : null;
        if (diffFn) {
            const n = Number(diffFn(startISO, endISO));
            if (Number.isFinite(n)) return n;
        }
        const a = String(startISO).slice(0,10).split("-").map(Number);
        const b = String(endISO).slice(0,10).split("-").map(Number);
        if (a.length !== 3 || b.length !== 3 || a.some(Number.isNaN) || b.some(Number.isNaN)) return NaN;
        return Math.round((Date.UTC(b[0], b[1]-1, b[2]) - Date.UTC(a[0], a[1]-1, a[2])) / 86400000);
    }

    /* سن رخداد باید بر اساس تاریخ رخداد محاسبه شود، نه تاریخ امروز. */
    function calculateAgeForDate(){
        const dateInput = document.getElementById("eventDate");
        const ageInput = document.getElementById("eventAge");
        const flock = getHealthFlock();
        if (!dateInput || !ageInput || !flock) return;

        /* سن یک مقدار محاسباتی است و کاربر نباید آن را دستی تغییر دهد. */
        ageInput.readOnly = true;
        ageInput.setAttribute("aria-readonly", "true");
        ageInput.title = "سن گله در تاریخ رخداد، به‌صورت خودکار محاسبه می‌شود.";

        const placement = String(flock.placement_date || "").slice(0,10);
        const eventISO = normalizeDate(dateInput.value);

        if (!placement || !eventISO) {
            ageInput.value = "";
            ageInput.removeAttribute("aria-invalid");
            return;
        }

        const age = dateOnlyDiffDays(placement, eventISO);

        if (!Number.isFinite(age) || age < 0) {
            ageInput.value = "";
            ageInput.setAttribute("aria-invalid", "true");
            ageInput.title = "تاریخ رخداد نمی‌تواند قبل از تاریخ شروع گله باشد.";
            return;
        }

        ageInput.value = String(age);
        ageInput.removeAttribute("aria-invalid");
        ageInput.title = "سن گله در تاریخ رخداد، به‌صورت خودکار محاسبه شده است.";
    }

    function bindEventDateAge(){
        const input = document.getElementById("eventDate");
        const ageInput = document.getElementById("eventAge");
        if (!input || !ageInput) return;

        input.dataset.ageSyncBound = "1";
        ["input", "change", "blur"].forEach(type => {
            if (input.dataset["ageSync_" + type] !== "1") {
                input.addEventListener(type, calculateAgeForDate);
                input.dataset["ageSync_" + type] = "1";
            }
        });

        ageInput.readOnly = true;
        ageInput.setAttribute("aria-readonly", "true");
        calculateAgeForDate();
    }

    function startAgeWatch(){
        if (ageWatchTimer) return;
        ageWatchTimer = setInterval(() => {
            /* این فراخوانی عمداً دوره‌ای است تا حتی اگر تقویم تاریخ را
               با تغییر مستقیم value تنظیم کند و هیچ event استانداردی
               ارسال نکند، سن گله حتماً خودکار به‌روزرسانی شود. */
            bindEventDateAge();
        }, 250);
    }

    function tidyReportSettings(){
        if (document.getElementById("adineReportSettingsStyle")) return;
        const style = document.createElement("style");
        style.id = "adineReportSettingsStyle";
        style.textContent = `
            .report-box{display:grid;grid-template-columns:1fr;gap:10px;align-items:center}
            .report-box>strong{display:block;font-size:14px;color:#173f35;margin-bottom:2px}
            .report-row{display:flex!important;align-items:center!important;gap:9px!important;margin:0!important;padding:9px 11px;border:1px solid #e1e8e4;border-radius:10px;background:#fff}
            .report-row input[type="checkbox"]{width:18px!important;height:18px!important;min-width:18px;margin:0!important;accent-color:#173f35}
            .report-row label{margin:0!important;font-size:12px;line-height:1.6;cursor:pointer}
            .report-box>.form-group{margin:0!important;padding:9px 11px;border:1px solid #e1e8e4;border-radius:10px;background:#fff}
            .report-box>.form-group label{display:block;margin:0 0 6px;font-size:11px;font-weight:700;color:#33443d}
            .report-box>.form-group select{width:100%;box-sizing:border-box}
            @media(min-width:700px){.report-box{grid-template-columns:1fr 1fr}.report-box>strong{grid-column:1/-1}.report-box>.form-group{grid-column:1/-1}}
        `;
        document.head.appendChild(style);
    }

    async function sync(reason){
        const key = selectionKey();
        if (!key || key === lastKey || syncing) return;
        if (typeof loadCurrentFlock !== "function") return;

        syncing = true;
        try {
            await loadCurrentFlock();
            lastKey = key;
            if (typeof loadEvents === "function") await loadEvents();
            if (typeof renderDashboard === "function") renderDashboard();
            if (typeof renderOverview === "function") renderOverview();
            if (typeof renderHistory === "function") renderHistory();
            if (typeof window.renderReportPreview === "function" && typeof selectedEventId !== "undefined" && selectedEventId) {
                const events = typeof healthEvents !== "undefined" && Array.isArray(healthEvents) ? healthEvents : [];
                const event = events.find(x => x.id === selectedEventId);
                if (event) window.renderReportPreview(event);
            }
            bindEventDateAge();
            tidyReportSettings();
            document.dispatchEvent(new CustomEvent("adine:active-flock-synced", { detail:{ flockId:key, reason } }));
        } catch (error) {
            console.error("Active flock synchronization failed:", error);
        } finally {
            syncing = false;
        }
    }

    function start(){
        lastKey = selectionKey();
        bindEventDateAge();
        startAgeWatch();
        tidyReportSettings();
        setInterval(() => sync("poll"), 1500);
        window.addEventListener("focus", () => sync("focus"));
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) sync("visibility");
        });
        window.addEventListener("storage", event => {
            if (event.key && event.key.indexOf("adine_poultry_current_selection") >= 0) sync("storage");
        });
        document.addEventListener("adine:current-selection-changed", () => sync("selection-event"));
        document.addEventListener("adine:jalali-date-selected", calculateAgeForDate);
        document.addEventListener("adine:active-flock-synced", bindEventDateAge);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
    else start();
})();
