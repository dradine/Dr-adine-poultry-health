/* QUICK WEEKLY AUTO-WEEK LOADER — DIRECT AUTHORITATIVE CONTROLLER */
(function(){
  "use strict";
  function load(){
    if(document.getElementById("weekly-auto-week-direct-script"))return;
    const s=document.createElement("script");
    s.id="weekly-auto-week-direct-script";
    s.src="weekly-auto-week-direct.js?v=20260827-6";
    s.async=false;
    document.head.appendChild(s);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
})();
