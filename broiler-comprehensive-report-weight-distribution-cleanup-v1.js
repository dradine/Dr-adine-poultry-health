/* ADINE — Weight distribution presentation cleanup.
   Hides the obsolete 7-bin distribution panel after the new expert analysis is mounted.
   Presentation-only; no calculations or source data are changed.
*/
"use strict";
(function(){
  function clean(){
    const c=document.getElementById('cr2Dist');
    const sec=document.getElementById('adineWeightDistribution');
    if(!c||!sec)return false;
    const old=c.closest('.cr2-panel,.cr2-chart,.cr2-card');
    if(old){old.style.display='none';old.setAttribute('aria-hidden','true');}
    const note=document.getElementById('cr2DistNote');
    if(note)note.style.display='none';
    return true;
  }
  let tries=0;const tick=()=>{if(!clean()&&tries++<40)setTimeout(tick,250)};tick();
  document.addEventListener('DOMContentLoaded',()=>setTimeout(tick,100),{once:true});
})();
