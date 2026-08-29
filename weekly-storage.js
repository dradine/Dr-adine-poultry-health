/* QUICK WEEKLY AUTO-WEEK LOADER — DIRECT AUTHORITATIVE CONTROLLER */
(function(){
  "use strict";
  function load(){
    if(document.getElementById("weekly-week-autofill-script"))return;
    const s=document.createElement("script");
    s.id="weekly-week-autofill-script";
    s.src="weekly-week-autofill.js?v=20260828-2";
    s.async=false;
    document.head.appendChild(s);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
})();

/* =========================================================
   WEEKLY DATE SAVE COMPATIBILITY FIX LOADER
========================================================= */
(function loadWeeklyDateSaveFix(){
  if(document.getElementById("weekly-date-save-fix-script"))return;
  const load=function(){
    if(document.getElementById("weekly-date-save-fix-script"))return;
    const script=document.createElement("script");
    script.id="weekly-date-save-fix-script";
    script.src="weekly-date-save-fix.js?v=20260828-2";
    script.async=false;
    (document.head||document.documentElement).appendChild(script);
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
})();

/* =========================================================
   STRICT WEEKLY -> REPORT ROUTE LOADER
   Loaded after weekly.js so it can read the authoritative global
   lexical binding `currentFlock` created by weekly.js.
========================================================= */
(function loadWeeklyReportRoute(){
  if(document.getElementById("weekly-report-route-script"))return;
  const load=function(){
    if(document.getElementById("weekly-report-route-script"))return;
    const script=document.createElement("script");
    script.id="weekly-report-route-script";
    script.src="weekly-report-route-v1.js?v=20260829-3";
    script.async=false;
    (document.head||document.documentElement).appendChild(script);
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
})();