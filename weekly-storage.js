/* =========================================================
   WEEKLY AUTO WEEK LOADER
   This file is intentionally small and loaded before weekly.js.
   The actual engine is loaded after DOMContentLoaded so weekly.js
   has already loaded the selected flock and exposed it as
   window.currentFlockForSpecialized.
========================================================= */
(function () {
    "use strict";

    function load() {
        if (document.getElementById("weekly-auto-week-script")) return;
        const script = document.createElement("script");
        script.id = "weekly-auto-week-script";
        script.src = "weekly-auto-week.js?v=20260827-5";
        script.async = false;
        document.head.appendChild(script);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", load, { once: true });
    } else {
        load();
    }
})();
