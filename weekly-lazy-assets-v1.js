/* ADINE WEEKLY — LAZY OPTIONAL LIBRARIES
   Keep the weekly form interactive without waiting for chart/date-picker CDNs.
*/
(function(){
 'use strict';
 const loaded=new Map();
 function loadScript(src){
  if(loaded.has(src))return loaded.get(src);
  const promise=new Promise((resolve,reject)=>{
   const existing=[...document.scripts].find(s=>s.src===new URL(src,location.href).href);
   if(existing){if(existing.dataset.loaded==='true'){resolve();return}existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}
   const script=document.createElement('script');script.src=src;script.async=true;
   script.onload=()=>{script.dataset.loaded='true';resolve()};
   script.onerror=()=>reject(new Error('Optional library failed: '+src));
   document.head.appendChild(script);
  });
  loaded.set(src,promise);return promise;
 }
 function loadStyle(href){
  if(document.querySelector('link[data-adine-lazy-style="'+href+'"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.adineLazyStyle=href;document.head.appendChild(link);
 }
 let datePromise=null;
 function ensureDatePicker(){
  if(datePromise)return datePromise;
  datePromise=(async()=>{
   loadStyle('https://cdn.jsdelivr.net/npm/persian-datepicker@1.2.0/dist/css/persian-datepicker.min.css');
   await loadScript('https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js');
   await loadScript('https://cdn.jsdelivr.net/npm/persian-date@1.1.0/dist/persian-date.min.js');
   await loadScript('https://cdn.jsdelivr.net/npm/persian-datepicker@1.2.0/dist/js/persian-datepicker.min.js');
   if(typeof window.initializeEvaluationDatePicker==='function')window.initializeEvaluationDatePicker();
  })().catch(error=>{datePromise=null;console.warn('[ADINE] Persian date picker deferred:',error)});
  return datePromise;
 }
 document.addEventListener('focusin',event=>{
  if(event.target?.id==='evaluationDate'&&!window.jQuery?.fn?.persianDatepicker)ensureDatePicker();
 });
 document.addEventListener('click',event=>{
  const button=event.target?.closest?.('button[onclick="calculateWeekly()"]');
  if(!button||window.Chart)return;
  event.preventDefault();event.stopImmediatePropagation();
  loadScript('https://cdn.jsdelivr.net/npm/chart.js').then(()=>{
   if(typeof window.calculateWeekly==='function')window.calculateWeekly();
  }).catch(error=>{
   console.warn('[ADINE] Chart.js unavailable; calculating without chart:',error);
   if(typeof window.calculateWeekly==='function')window.calculateWeekly();
  });
 },true);
})();
