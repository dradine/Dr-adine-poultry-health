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
   This is the proven fix used on 2026-08-26. It intentionally runs
   after weekly.js has defined its legacy date helpers and replaces
   them with the central AdineDateSystem conversion functions.
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
