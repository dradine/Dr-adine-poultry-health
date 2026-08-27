/* ADINE REPORTS UI V8 — SINGLE VISIBLE FLOCK/WEEK CONTROL */
(function(){
'use strict';
if(window.__ADINE_REPORTS_UI_V8__) return;
window.__ADINE_REPORTS_UI_V8__=true;
function clean(){
  var page=document.querySelector('.reports-page');
  if(!page)return;
  var canonical=document.getElementById('adineReportsControlCard');
  var source=document.getElementById('flockSelect');
  if(source){
    var sourceCard=source.closest('section.card');
    if(sourceCard && sourceCard!==canonical) sourceCard.style.display='none';
  }
  page.querySelectorAll('[id="reportWeekSelectorCard"]').forEach(function(el){
    if(el!==canonical)el.remove();
  });
  var exec=document.getElementById('executiveReportCard');
  var standard=document.getElementById('standardFrameworkCard');
  if(exec){
    page.insertBefore(exec,page.children[1]||null);
  }
  canonical=document.getElementById('adineReportsControlCard');
  if(canonical && exec && canonical.parentNode===page){
    page.insertBefore(canonical,exec.nextSibling);
  }
  /* Keep the standards framework below the flock/week controls. */
  standard=document.getElementById('standardFrameworkCard');
  canonical=document.getElementById('adineReportsControlCard');
  if(standard && canonical && standard.parentNode===page){
    page.insertBefore(standard,canonical.nextSibling);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});
else clean();
var n=0;var timer=setInterval(function(){clean();if(++n>120)clearInterval(timer)},100);
})();
