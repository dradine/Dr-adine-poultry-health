/* ADINE REPORTS UI V8 — SINGLE VISIBLE FLOCK/WEEK CONTROL */
(function(){
'use strict';
if(window.__ADINE_REPORTS_UI_V8__) return;
window.__ADINE_REPORTS_UI_V8__=true;
function clean(){
  var page=document.querySelector('.reports-page');
  if(!page)return;
  var canonical=document.getElementById('adineReportsControlCard');
  /* The original flock-only card is a data source for V4, but must never be visible. */
  var source=document.getElementById('flockSelect');
  if(source){
    var sourceCard=source.closest('section.card');
    if(sourceCard && sourceCard!==canonical) sourceCard.style.display='none';
  }
  /* Hide any accidental duplicate legacy week-selector cards. */
  page.querySelectorAll('[id="reportWeekSelectorCard"]').forEach(function(el){
    if(el!==canonical)el.remove();
  });
  /* Evaluation must always precede the single control. */
  var exec=document.getElementById('executiveReportCard');
  if(exec && canonical && exec.parentNode===page){
    page.insertBefore(exec,canonical);
  } else if(exec && canonical){
    canonical.parentNode.insertBefore(exec,canonical);
  }
  /* If V4 has not injected yet, do not create a second control here. */
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});
else clean();
var n=0;var timer=setInterval(function(){clean();if(++n>120)clearInterval(timer)},100);
})();
