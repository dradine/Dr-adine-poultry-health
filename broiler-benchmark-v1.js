/* ADINE — BROILER BENCHMARK UI V2
   Rendering only. Calculations remain in the database benchmark engine.
   Community selector always exposes the full configured cohort catalog.
*/
"use strict";
(function(global){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  const fmt=(v,d=1)=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
  const pct=(v,d=1)=>n(v)===null?'—':fmt(v,d)+'٪';
  const COHORT_CATALOG=[
    {key:'all',label:'کل گله‌های گوشتی'},
    {key:'genetics',label:'همان ژنتیک / شرکت'},
    {key:'strain',label:'همان سویه'},
    {key:'climate',label:'همان اقلیم'},
    {key:'region',label:'همان منطقه جغرافیایی'},
    {key:'recent30',label:'۳۰ گله اخیر'},
    {key:'recent50',label:'۵۰ گله اخیر'}
  ];
  let host=null,flockId=null,payload=null,activeCohort='all';
  function cohortLabel(key){return COHORT_CATALOG.find(x=>x.key===key)?.label||key}
  function cohortMap(){return Object.fromEntries((payload?.cohorts||[]).map(x=>[x.key,x]))}
  function selected(){return cohortMap()[activeCohort]||null}
  function render(){
    if(!host)return;
    const map=cohortMap(), c=selected();
    const options=COHORT_CATALOG.map(x=>`<option value="${esc(x.key)}" ${x.key===activeCohort?'selected':''}>${esc(x.label)}</option>`).join('');
    const metrics=c?.metrics||{};
    const keys=Object.keys(metrics);
    host.innerHTML=`<div class="bb-shell" dir="rtl">
      <div class="bb-head"><div><div class="bb-kicker">BENCHMARK</div><h2>جایگاه گله در جامعه مقایسه</h2><p>${esc(payload?.flock?.name||'گله فعال')} — سن ${fmt(payload?.flock?.age_days,0)} روز</p></div><button type="button" class="bb-back" data-bb-back>بازگشت</button></div>
      <div class="bb-controls"><label>جامعه مقایسه<select id="bb-cohort">${options}</select></label></div>
      <div id="bb-content"></div>
    </div>`;
    $('bb-cohort')?.addEventListener('change',e=>{activeCohort=e.target.value;render()});
    const body=$('bb-content');
    if(!c){body.innerHTML=`<div class="bb-error">اطلاعات جامعه «${esc(cohortLabel(activeCohort))}» برای این گله/سن در حال حاضر قابل محاسبه نیست. ساختار و سایر جوامع دست‌نخورده باقی مانده‌اند.</div>`;return}
    if(!keys.length){body.innerHTML=`<div class="bb-error">برای «${esc(cohortLabel(activeCohort))}» در سن انتخاب‌شده داده کافی برای محاسبه وجود ندارد.</div>`;return}
    const cards=keys.map(k=>{const m=metrics[k]||{};return `<div class="bb-metric"><div class="bb-metric-title"><span>${esc(m.label||k)}</span><b>${m.percentile===null||m.percentile===undefined?'—':fmt(m.percentile,1)+'٪'}</b></div><div class="bb-statline"><span>فعلی: ${fmt(m.current,m.direction==='lower'?2:0)}</span><span>n=${fmt(m.n,0)}</span></div><div class="bb-detail"><span>P10 <b>${fmt(m.p10,2)}</b></span><span>میانه <b>${fmt(m.median,2)}</b></span><span>P90 <b>${fmt(m.p90,2)}</b></span></div></div>`}).join('');
    body.innerHTML=`<div class="bb-summary"><div><span>جامعه</span><strong>${esc(c.label||cohortLabel(activeCohort))}</strong><small>${fmt(keys.reduce((a,k)=>Math.max(a,Number(metrics[k]?.n||0)),0),0)} مشاهده در بزرگ‌ترین شاخص</small></div><div><span>سن مرجع</span><strong>${fmt(payload?.flock?.age_days,0)} روز</strong></div><div><span>نوع مقایسه</span><strong>درون Benchmark</strong></div></div><div class="bb-grid">${cards}</div>`;
  }
  async function mount(target,id,initialCohort){
    host=target;flockId=id;activeCohort=initialCohort||'all';
    host.innerHTML='<div class="bb-loading">در حال دریافت Benchmark…</div>';
    try{
      const {data,error}=await global.supabaseClient.rpc('get_broiler_benchmark_v1',{p_flock_id:flockId,p_age_days:null,p_age_window_days:3,p_recent_limit:30});
      if(error)throw error;if(!data?.ok)throw new Error(data?.message||'Benchmark قابل محاسبه نیست');
      payload=data;
      if(!COHORT_CATALOG.some(x=>x.key===activeCohort))activeCohort='all';
      render();
      host.querySelector('[data-bb-back]')?.addEventListener('click',()=>global.AdineComparisonLanding?.showLanding?.());
    }catch(e){console.error(e);host.innerHTML=`<div class="bb-error">${esc(e?.message||'خطا در دریافت Benchmark')}</div>`}
  }
  global.AdineBroilerBenchmark={mount};
})(window);
