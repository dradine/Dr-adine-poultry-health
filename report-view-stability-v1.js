/* ADINE — report view stability V1
   Presentation-only. Prevents intermediate weekly/comparison DOM from flashing while
   the dedicated comprehensive/comparison view is loading, and makes comparison week
   an automatic value derived from the shared weekly records.
*/
"use strict";
(function(global){
  const $=id=>document.getElementById(id);
  let patching=false;

  function prepare(tab){
    const root=$('root');
    if(tab==='overall'){
      if(root) root.innerHTML='<section class="section report-view-loading"><div class="empty">در حال آماده‌سازی گزارش جامع عملکرد گله…</div></section>';
      const slot=$('latestWeekSlot');
      if(slot){slot.classList.remove('latest-week-slot-hidden');slot.innerHTML='<span>ارزیابی آخرین هفته</span><strong>در حال دریافت…</strong>'}
    }else if(tab==='compare-empty'){
      if(root) root.innerHTML='<section class="section report-view-loading"><div class="empty">در حال آماده‌سازی گزارش مقایسه‌ای…</div></section>';
      const slot=$('latestWeekSlot');
      if(slot){slot.classList.remove('latest-week-slot-hidden');slot.innerHTML='<span>ارزیابی آخرین هفته گله‌های انتخاب‌شده</span><strong>در حال دریافت…</strong>'}
    }
  }

  function patchComparisonWeek(){
    if(patching)return;
    const active=document.querySelector('.report-tab.active')?.dataset?.tab;
    if(active!=='compare-empty')return;
    const select=$('fc2-week');
    if(!select||select.dataset.autoWeek==='1')return;
    const selected=select.selectedOptions?.[0];
    if(!selected)return;
    const text=selected.textContent.trim();
    const match=text.match(/هفته\s+([۰-۹0-9]+)/);
    const week=match?match[1]:text;
    patching=true;
    const span=document.createElement('span');
    span.id='fc2-week';
    span.className='fc-week fc-week-auto';
    span.setAttribute('aria-label','هفته ارزیابی خودکار');
    span.textContent=`هفته ارزیابی: ${week}`;
    select.replaceWith(span);
    patching=false;
  }

  document.addEventListener('click',e=>{
    const tab=e.target?.closest?.('.report-tab');
    if(!tab)return;
    const name=tab.dataset.tab;
    if(name==='overall'||name==='compare-empty')prepare(name);
  },true);

  const rootObserver=new MutationObserver(()=>{
    if(!patching)patchComparisonWeek();
  });
  function start(){
    const root=$('root');
    if(root)rootObserver.observe(root,{childList:true,subtree:true});
    patchComparisonWeek();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
