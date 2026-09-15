/* ADINE — Stable latest-week display V9
   Presentation only. The selectable «هفته گزارش» belongs exclusively to the
   weekly report. Comprehensive and comparison reports do not expose any
   week-selection / latest-week control in this slot. */
"use strict";
(function(global){
  const $=s=>document.querySelector(s),n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  let cache={};
  function slot(){return $('#latestWeekSlot')}
  function clear(){const el=slot();if(el){el.replaceChildren();el.classList.add('latest-week-slot-hidden')}}
  function activeTab(){return document.querySelector('.report-tab.active')?.dataset.tab||'weekly'}
  function sync(){
    /* This legacy presentation slot is intentionally disabled.
       The only week selector is the dedicated selector rendered by reports.js
       while activeTab === 'weekly'. */
    clear();
  }
  function prepare(){sync()}
  function overall(){sync()}
  function comparison(){sync()}
  document.addEventListener('click',e=>{
    const tab=e.target?.closest?.('.report-tab');
    if(tab) setTimeout(sync,0);
    if(e.target?.closest?.('#fc2-run,#fc2-clear'))setTimeout(sync,100);
  },true);
  document.addEventListener('change',e=>{
    if(e.target?.matches?.('[id^="fc2-flock-"]')||e.target?.matches?.('#fc2-week'))setTimeout(sync,50);
  });
  const rootObserver=new MutationObserver(()=>setTimeout(sync,50));
  function start(){const root=$('#root');if(root)rootObserver.observe(root,{childList:true,subtree:true});sync()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  global.AdineLatestWeekSlotV2={sync,overall,comparison,prepare,activeTab};
})(window);
