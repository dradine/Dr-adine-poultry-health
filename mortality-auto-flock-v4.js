"use strict";

/* ADINEH mortality/disease module — active flock synchronization only.
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
            document.dispatchEvent(new CustomEvent("adine:active-flock-synced", { detail:{ flockId:key, reason } }));
        } catch (error) {
            console.error("Active flock synchronization failed:", error);
        } finally {
            syncing = false;
        }
    }

    function start(){
        // The normal module already loads the active flock. We only observe
        // for changes, so no duplicate initial database request is made.
        lastKey = selectionKey();
        setInterval(() => sync("poll"), 1500);
        window.addEventListener("focus", () => sync("focus"));
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) sync("visibility");
        });
        window.addEventListener("storage", event => {
            if (event.key && event.key.indexOf("adine_poultry_current_selection") >= 0) sync("storage");
        });
        document.addEventListener("adine:current-selection-changed", () => sync("selection-event"));
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
    else start();
})();
