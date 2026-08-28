"use strict";

/* ADINEH mortality/disease module — active flock synchronization + form UX.
   Reads the application's canonical current_selection and refreshes this
   module when flock/farm/house changes. It never writes selection state. */
(function(){
    let lastKey = null;
    let syncing = false;

    function selectionKey(){
        try {
            if (typeof getCurrentSelection !== "function") return "";
            const s = getCurrentSelection() || {};
            return String(s.flockId || "");
        } catch (_) { return ""; }
    }

    function normalizeDate(value){
        if (!value) return null;
        try {
            if (window.AdineDateSystem && typeof window.AdineDateSystem.jalaliToISO === "function") {
                return window.AdineDateSystem.jalaliToISO(value);
            }
            if (typeof window.jalaliToGregorianISO === "function") return window.jalaliToGregorianISO(value);
        } catch (_) {}
        return null;
    }

    function calculateAgeForDate(){
        const dateInput = document.getElementById("eventDate");
        const ageInput = document.getElementById("eventAge");
        if (!dateInput || !ageInput || !window.healthFlock) return;

        const placement = String(window.healthFlock.placement_date || "").slice(0,10);
        const eventISO = normalizeDate(dateInput.value);
        if (!placement || !eventISO) {
            ageInput.value = "";
            ageInput.removeAttribute("aria-invalid");
            return;
        }

        const diffFn = window.AdineDateSystem && typeof window.AdineDateSystem.dateOnlyDiffDays === "function"
            ? window.AdineDateSystem.dateOnlyDiffDays
            : null;
        const age = diffFn ? diffFn(placement, eventISO) : Math.round((new Date(eventISO)-new Date(placement))/86400000);

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
        if (!input || input.dataset.ageSyncBound === "1") return;
        input.dataset.ageSyncBound = "1";
        ["input", "change", "blur"].forEach(type => input.addEventListener(type, calculateAgeForDate));
        document.addEventListener("adine:jalali-date-selected", calculateAgeForDate);
        calculateAgeForDate();
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
                const event = Array.isArray(window.healthEvents) ? window.healthEvents.find(x => x.id === selectedEventId) : null;
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
        document.addEventListener("adine:active-flock-synced", bindEventDateAge);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
    else start();
})();