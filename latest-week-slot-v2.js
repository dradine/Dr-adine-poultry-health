/* ADINE — Stable latest-week display V6
   Presentation only. Overall and comparison use the SAME active-flock source
   and latest-week resolver. No separate comparison-week logic.
*/
"use strict";
(function(global){
  const $=s=>document.querySelector(s),n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null},fmt=v=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR')};
  let cache={};
  function slot(){return $('#latestWeekSlot')}
  function set(html,visible){const el=slot();if(!el)return;el.innerHTML=html;el.classList.toggle('latest-week-slot-hidden',!visible)}
  async function latest(id){
    if(!id)return null;
    if(cache[id]!==undefined)return cache[id];
    if(!global.supabaseClient)return null;
    const {data,error}=await global.supabaseClient.from('weekly_records').select('week_number,production_week,age_days,production_day').eq('flock_id',id).order('week_number',{ascending:true});
    if(error)throw error;
    let w=null;
    for(const r of(data||[])){
      const a=n(r.week_number??r.production_week),b=n(r.age_days??r.production_day),x=a!==null?Math.max(1,Math.round(a)):(b!==null?Math.max(1,Math.round(b/7)):null);
      if(x!==null)w=x;
    }
    cache[id]=w;
    return w;
  }
  function activeTab(){return document.querySelector('.report-tab.active')?.dataset.tab||'weekly'}
  function prepare(tab){
    const root=$('#root');
    if(tab==='overall'||tab==='compare-empty'){
      if(root)root.innerHTML=`<section class="section report-view-loading"><div class="empty">در حال آماده‌سازی ${tab==='overall'?'گزارش جامع عملکرد گله':'گزارش مقایسه‌ای'}…</div></section>`;
      set('<span>ارزیابی آخرین هفته</span><strong>در حال دریافت…</strong>',true);
    }
  }
  async function overall(){
    try{
      const id=global.AdineReportRouter?.currentFlockId?.();
      const w=await latest(id);
      set(`<span>ارزیابی آخرین هفته</span><strong>${w===null?'هنوز ثبت هفتگی وجود ندارد':`هفته ${fmt(w)}`}</strong>`,true);
    }catch(e){console.error('[AdineLatestWeekSlotV2] overall',e);set('<span>ارزیابی آخرین هفته</span><strong>—</strong>',true)}
  }
  async function comparison(){
    /* IMPORTANT: comparison must be identical to comprehensive report here.
       Use the active flock from the same report router and the same latest-week resolver.
       Do not read comparison selectors, #fc2-week, or calculate a separate common week. */
    return overall();
  }
  function sync(){const t=activeTab();if(t==='overall'||t==='compare-empty')overall();else set('',false)}
  document.addEventListener('click',e=>{
    const tab=e.target?.closest?.('.report-tab');
    if(tab&&(tab.dataset.tab==='overall'||tab.dataset.tab==='compare-empty'))prepare(tab.dataset.tab);
    if(tab)setTimeout(sync,0);
    if(e.target?.closest?.('#fc2-run'))setTimeout(sync,100);
    if(e.target?.closest?.('#fc2-clear'))setTimeout(sync,100);
  },true);
  document.addEventListener('change',e=>{
    if(e.target?.matches?.('[id^="fc2-flock-"]')||e.target?.matches?.('#fc2-week'))setTimeout(sync,50);
  });
  const rootObserver=new MutationObserver(()=>{
    if(activeTab()==='overall'||activeTab()==='compare-empty')setTimeout(sync,50);
  });
  function start(){const root=$('#root');if(root)rootObserver.observe(root,{childList:true,subtree:true});sync()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  global.AdineLatestWeekSlotV2={sync,overall,comparison};
})(window);
