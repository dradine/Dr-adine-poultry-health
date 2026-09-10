/* =========================================================
   WEEKLY LIVE BIRDS AUTO-FILL LOADER
   Isolated: only controls automatic #liveBirds population.
========================================================= */
(function loadWeeklyLiveBirdsAuto(){
  if(document.getElementById("weekly-live-birds-autofill-script"))return;
  const load=function(){
    if(document.getElementById("weekly-live-birds-autofill-script"))return;
    const script=document.createElement("script");
    script.id="weekly-live-birds-autofill-script";
    script.src="weekly-live-birds-autofill-v1.js?v=20260910-3";
    script.async=false;
    (document.head||document.documentElement).appendChild(script);
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
})();