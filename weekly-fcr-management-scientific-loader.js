"use strict";
(function(){
  const p=String(location.pathname||"").toLowerCase().split("/").pop();
  if(p!=="reports-v2.html"&&p!=="reports.html")return;
  function boot(){
    if(document.querySelector('script[data-adine-fcr-scientific]'))return;
    const s=document.createElement('script');s.src='weekly-fcr-management-derived-v2.js';s.dataset.adineFcrScientific='1';document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
