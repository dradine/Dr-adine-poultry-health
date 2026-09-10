/* ADINE STRICT PERFORMANCE SCORING — UI LABEL BRIDGE V2 */
(function(global){"use strict";
  function patch(){
    const root=document.getElementById("broiler-intelligence-panel");
    if(!root)return;
    root.querySelectorAll(".pi-badge.watch").forEach(el=>{el.textContent="قابل قبول";el.setAttribute("aria-label","قابل قبول")});
    root.querySelectorAll(".pi-badge.critical").forEach(el=>{el.textContent="نیازمند اقدام";el.setAttribute("aria-label","نیازمند اقدام")});
  }
  if(typeof document!=="undefined"){
    const boot=()=>{patch();const root=document.getElementById("broiler-intelligence-panel");if(root&&typeof MutationObserver!=="undefined")new MutationObserver(patch).observe(root,{childList:true,subtree:true})};
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
    setTimeout(patch,500);setTimeout(patch,1500);setTimeout(patch,3000);
  }
})(typeof window!=="undefined"?window:globalThis);
