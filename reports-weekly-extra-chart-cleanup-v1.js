/* WEEKLY REPORT — VISUAL CLEANUP ONLY.
   Do not calculate, fetch, derive, or invent any FCR series here.
   The report's existing data/motor/standards remain untouched. */
(function(){
'use strict';
if(String(location.pathname||'').toLowerCase().split('/').pop()!=='reports.html')return;
function clean(){try{
  var root=document.getElementById('root');if(!root)return;
  /* Restore the native Chart.js report charts hidden by the previous visual override. */
  root.querySelectorAll('.chart').forEach(function(x){
    x.style.display='block';
    x.style.height='300px';
    x.style.overflow='visible';
  });
  root.querySelectorAll('.chart canvas').forEach(function(x){x.style.display='block'});
  /* The application has no real cumulative-FCR observation series in weekly data.
     Therefore the cumulative-FCR chart is a visual-only element and must not be shown.
     No value is deleted or recalculated. */
  var cum=document.getElementById('wFcrCum');
  if(cum){var box=cum.closest('.box');if(box)box.remove();else cum.remove();}
  /* Remove any previously injected analytical/duplicate section. */
  root.querySelectorAll('.wa2').forEach(function(x){x.remove()});
  root.querySelectorAll('.wa2-box,.wa2-analysis').forEach(function(x){x.closest('.section')?.remove()||x.remove()});
}catch(e){console.error('Weekly visual cleanup',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(clean,1500)},{once:true});else setTimeout(clean,1500);
})();
