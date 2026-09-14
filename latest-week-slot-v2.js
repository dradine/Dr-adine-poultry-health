/* ADINE — Stable latest-week display + report-view stability V5
   Presentation only. Comparison reads the exact latest/common week selected by the comparison UI.
*/
"use strict";
(function(global){
  const $=s=>document.querySelector(s),n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null},fmt=v=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR')};
  let cache={};
  function slot(){return $('#latestWeekSlot')}
  function set(html,visible){const el=slot();if(!el)return;el.innerHTML=html;el.classList.toggle('latest-week-slot-hidden',!visible)}
  async function latest(id){if(!id)return null;if(cache[id]!==undefined)return cache[id];if(!global.supabaseClient)return null;const {data,error}=await global.supabaseClient.from('weekly_records').select('week_number,production_week,age_days,production_day').eq('flock_id',id).order('week_number',{ascending:true});if(error)throw error;let w=null;for(const r of(data||[])){const a=n(r.week_number??r.production_week),b=n(r.age_days??r.production_day),x=a!==null?Math.max(1,Math.round(a)):(b!==null?Math.max(1,Math.round(b/7)):null);if(x!==null)w=x}cache[id]=w;return w}
  function activeTab(){return document.querySelector('.report-tab.active')?.dataset.tab||'weekly'}
  function prepare(tab){const root=$('root');if(tab==='overall'){if(root)root.innerHTML='<section class="section report-view-loading"><div class="empty">در حال آماده‌سازی گزارش جامع عملکرد گله…</div></section>';set('<span>ارزیابی آخرین هفته</span><strong>در حال دریافت…</strong>',true)}else if(tab==='compare-empty'){if(root)root.innerHTML='<section class="section report-view-loading"><div class="empty">در حال آماده‌سازی گزارش مقایسه‌ای…</div></section>';set('<span>ارزیابی آخرین هفته</span><strong>در حال دریافت…</strong>',true)}}
  async function overall(){try{const id=global.AdineReportRouter?.currentFlockId?.();const w=await latest(id);set(`<span>ارزیابی آخرین هفته</span><strong>${w===null?'هنوز ثبت هفتگی وجود ندارد':`هفته ${fmt(w)}`}</strong>`,true)}catch(e){set('<span>ارزیابی آخرین هفته</span><strong>—</strong>',true)}}
  async function comparison(){try{
    /* Read the exact week produced by the comparison engine. Do not replace/remove its selector. */
    const select=$('#fc2-week');
    if(select?.selectedOptions?.[0]){
      const text=select.selectedOptions[0].textContent.trim(),match=text.match(/هفته\s+([۰-۹0-9]+)/),week=match?match[1]:text;
      set(`<span>ارزیابی آخرین هفته</span><strong>هفته ${week}</strong>`,true);
      return;
    }
    const ids=[...document.querySelectorAll('[id^="fc2-flock-"]')].map(x=>x.value).filter(Boolean);
    if(!ids.length){set('<span>ارزیابی آخرین هفته</span><strong>در انتظار انتخاب گله‌ها</strong>',true);return}
    const weeks=[];for(const id of ids){const w=await latest(id);if(w!==null)weeks.push(w)}
    if(!weeks.length){set('<span>ارزیابی آخرین هفته</span><strong>هنوز ثبت هفتگی وجود ندارد</strong>',true);return}
    set(`<span>ارزیابی آخرین هفته</span><strong>هفته ${fmt(Math.min(...weeks))}</strong>`,true);
  }catch(e){console.error('[AdineLatestWeekSlotV2] comparison',e);set('<span>ارزیابی آخرین هفته</span><strong>—</strong>',true)}}
  function sync(){const t=activeTab();if(t==='overall')overall();else if(t==='compare-empty')comparison();else set('',false)}
  document.addEventListener('click',e=>{const tab=e.target?.closest?.('.report-tab');if(tab&&(tab.dataset.tab==='overall'||tab.dataset.tab==='compare-empty'))prepare(tab.dataset.tab);if(tab)setTimeout(sync,0);if(e.target?.closest?.('#fc2-run'))[100,500,1000,1800].forEach(ms=>setTimeout(comparison,ms));if(e.target?.closest?.('#fc2-clear'))setTimeout(comparison,100)},true);
  document.addEventListener('change',e=>{if(e.target?.matches?.('[id^="fc2-flock-"]')||e.target?.matches?.('#fc2-week'))setTimeout(comparison,50)});
  const rootObserver=new MutationObserver(()=>{if(activeTab()==='compare-empty')setTimeout(comparison,50)});
  function start(){const root=$('#root');if(root)rootObserver.observe(root,{childList:true,subtree:true});sync()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  global.AdineLatestWeekSlotV2={sync,overall,comparison};
})(window);
