/* QUICK WEEKLY AUTO-WEEK LOADER — DIRECT AUTHORITATIVE CONTROLLER */
(function(){
  "use strict";
  function load(){
    if(document.getElementById("weekly-week-autofill-script"))return;
    const s=document.createElement("script");
    s.id="weekly-week-autofill-script";
    s.src="weekly-week-autofill.js?v=20260827-1";
    s.async=false;
    document.head.appendChild(s);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
})();
