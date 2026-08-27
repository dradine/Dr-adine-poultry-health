/* ADINE REPORTS UI V8 — SINGLE VISIBLE FLOCK/WEEK CONTROL */
(function(){
'use strict';
if(window.__ADINE_REPORTS_UI_V8__) return;
window.__ADINE_REPORTS_UI_V8__=true;
function syncFlockMirror(){
  var source=document.getElementById('flockSelect');
  var mirror=document.getElementById('adineReportFlockMirror');
  if(!source||!mirror)return;
  var old=mirror.value;
  var opts=Array.from(source.options).filter(function(o){return o.value;});
  var signature=opts.map(function(o){return o.value+'|'+o.textContent}).join('\u0001');
  if(mirror.dataset.signature!==signature){
    mirror.innerHTML='<option value="">انتخاب گله</option>';
    opts.forEach(function(o){mirror.appendChild(o.cloneNode(true));});
    mirror.dataset.signature=signature;
  }
  if(source.value && Array.from(mirror.options).some(function(o){return o.value===source.value;})) mirror.value=source.value;
  else if(!source.value) mirror.value='';
}
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
  syncFlockMirror();
  var exec=document.getElementById('executiveReportCard');
  if(exec)page.insertBefore(exec,page.children[1]||null);
  canonical=document.getElementById('adineReportsControlCard');
  if(canonical && exec && canonical.parentNode===page)page.insertBefore(canonical,exec.nextSibling);
  var standard=document.getElementById('standardFrameworkCard');
  canonical=document.getElementById('adineReportsControlCard');
  if(standard && canonical && standard.parentNode===page)page.insertBefore(standard,canonical.nextSibling);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();
var observer=new MutationObserver(function(){syncFlockMirror();});
function startObserver(){var source=document.getElementById('flockSelect');if(source)observer.observe(source,{childList:true,subtree:true,attributes:true});}
startObserver();
var n=0;var timer=setInterval(function(){clean();startObserver();if(++n>300)clearInterval(timer)},100);
})();
