/* ADINE — Stable latest-week display V7
   Presentation only. Overall and comparison use the SAME active-flock source
   and latest-week resolver. Comprehensive report gets two internal tabs.
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
  async function comparison(){return overall()}

  function ensureComprehensiveStyles(){
    if(document.getElementById('adine-comprehensive-subtabs-style'))return;
    const s=document.createElement('style');s.id='adine-comprehensive-subtabs-style';s.textContent=`
      .cr-subtabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 14px;padding:9px;background:#fff;border:1px solid #dfe8e3;border-radius:18px;box-shadow:0 7px 25px rgba(20,45,38,.06)}
      .cr-subtab{border:1px solid #d4dfda;border-radius:12px;background:#fff;color:#344a42;padding:13px 8px;font:inherit;font-size:11px;font-weight:900;cursor:pointer}
      .cr-subtab.active{background:#173f35;color:#fff;border-color:#173f35}
      .cr-subpane{display:block}.cr-subpane.is-hidden{display:none!important}
      .cr-intelligence-placeholder{padding:42px 20px;text-align:center;background:#f9fbfa;border:1px solid #dfe8e3;border-radius:14px;color:#596c64}
      .cr-intelligence-placeholder h2{margin:0 0 9px;font-size:17px;color:#173f35}.cr-intelligence-placeholder p{margin:0;font-size:10px;line-height:2}
      @media(max-width:600px){.cr-subtab{font-size:9px;padding:11px 4px}}
    `;document.head.appendChild(s);
  }
  function mountComprehensiveTabs(){
    if(activeTab()!=='overall')return;
    const root=$('#root');
    if(!root||root.querySelector('.cr-subtabs'))return;
    ensureComprehensiveStyles();
    const existing=document.createElement('div');existing.className='cr-subpane';
    while(root.firstChild)existing.appendChild(root.firstChild);
    const nav=document.createElement('nav');nav.className='cr-subtabs';nav.setAttribute('aria-label','بخش‌های گزارش جامع عملکرد');
    const a=document.createElement('button');a.type='button';a.className='cr-subtab active';a.dataset.crTab='analysis';a.textContent='تحلیل جامع عملکرد گله';
    const b=document.createElement('button');b.type='button';b.className='cr-subtab';b.dataset.crTab='intelligence';b.textContent='هوش عملکرد گله گوشتی';
    nav.append(a,b);
    const pane=document.createElement('div');pane.className='cr-subpane is-hidden';pane.dataset.crPane='intelligence';
    pane.innerHTML='<section class="section"><div class="cr-intelligence-placeholder"><h2>هوش عملکرد گله گوشتی</h2><p>این تب برای موتور جدید هوش عملکرد گله گوشتی آماده شده است.</p></div></section>';
    root.append(nav,existing,pane);
    nav.addEventListener('click',e=>{
      const btn=e.target.closest('.cr-subtab');if(!btn)return;
      const intelligence=btn.dataset.crTab==='intelligence';
      nav.querySelectorAll('.cr-subtab').forEach(x=>x.classList.toggle('active',x===btn));
      existing.classList.toggle('is-hidden',intelligence);
      pane.classList.toggle('is-hidden',!intelligence);
    });
  }
  function sync(){
    const t=activeTab();
    if(t==='overall'||t==='compare-empty')overall();else set('',false);
    if(t==='overall')setTimeout(mountComprehensiveTabs,180);
  }
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
    if(activeTab()==='overall')setTimeout(mountComprehensiveTabs,80);
    if(activeTab()==='overall'||activeTab()==='compare-empty')setTimeout(sync,50);
  });
  function start(){const root=$('#root');if(root)rootObserver.observe(root,{childList:true,subtree:true});sync()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  global.AdineLatestWeekSlotV2={sync,overall,comparison};
})(window);
