/* ADINE REPORTS UI V5 LAYOUT GUARD */
(function(){'use strict';
function fix(){
  const exec=document.getElementById('executiveReportCard');
  const controls=document.getElementById('adineReportsControlCard');
  const page=document.querySelector('.reports-page');
  if(!exec||!controls||!page)return;
  // Required hierarchy: report/evaluation first, then flock/week selection.
  if(exec.nextElementSibling!==controls) exec.parentNode.insertBefore(controls,exec.nextSibling);
  controls.style.order='';
}
function boot(){fix();setTimeout(fix,100);setTimeout(fix,500);setTimeout(fix,1200);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
new MutationObserver(fix).observe(document.documentElement,{childList:true,subtree:true});
})();
