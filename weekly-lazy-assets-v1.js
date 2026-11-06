/* ADINE WEEKLY — LAZY CHART LOADER
   The shared Jalali calendar handles dates locally. Chart.js is loaded only
   when the user explicitly asks to calculate and render a weight chart.
*/
(function(){
 'use strict';
 let chartPromise=null;
 function ensureChart(){
  if(window.Chart)return Promise.resolve();
  if(chartPromise)return chartPromise;
  chartPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://cdn.jsdelivr.net/npm/chart.js';
   script.async=true;
   script.onload=()=>resolve();
   script.onerror=()=>reject(new Error('Chart.js failed to load'));
   document.head.appendChild(script);
  }).catch(error=>{chartPromise=null;throw error});
  return chartPromise;
 }
 document.addEventListener('click',event=>{
  const button=event.target?.closest?.('button[onclick="calculateWeekly()"]');
  if(!button||window.Chart)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  ensureChart().then(()=>{
   if(typeof window.calculateWeekly==='function')window.calculateWeekly();
  }).catch(error=>{
   console.warn('[ADINE] Chart.js unavailable; calculating without chart:',error);
   if(typeof window.calculateWeekly==='function')window.calculateWeekly();
  });
 },true);
})();
