/* ADINE REPORTS — BROILER PERFORMANCE INTELLIGENCE V5
   Read-only presentation adapter. Canonical metrics and weekly report calculations are untouched.
   The analysis engine resolves its primary benchmark through the canonical performance-intelligence RPC,
   then separately reads management benchmarks for display/fallback context.
*/
"use strict";
(function(global){
  const $=id=>document.getElementById(id);
  const n=v=>{if(v===null||v===undefined||v==="")return null;const x=Number(String(v).replace(/[٬,]/g,"").replace("٫","."));return Number.isFinite(x)?x:null};
  const fmt=(v,d=1)=>{const x=n(v);return x===null?"—":x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
  const pct=(v,d=1)=>{const x=n(v);return x===null?"—":x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})+'٪'};
  const esc=s=>String(s??"—").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const statusFa=s=>({excellent:"عالی",good:"خوب",watch:"نیازمند پایش",critical:"نیازمند اقدام",unknown:"اطلاعات ناکافی"}[s]||"اطلاعات ناکافی");
  const cls=s=>s==="excellent"||s==="good"||s==="watch"||s==="critical"?s:"unknown";
  const modelTarget=(r,m)=>m==="body_weight"?r.standardWeight:m==="weekly_weight_gain"?r.standardWeeklyWeightGain:m==="fcr"?r.standardWeeklyFcr:m==="cumulative_fcr"?r.standardCumulativeFcr:m==="cv"?r.cvStandard:m==="uniformity_10"?r.uniformity10Standard:m==="uniformity_15"?r.uniformity15Standard:null;
  const value=(r,m)=>m==="body_weight"?r.weight:m==="weekly_weight_gain"?r.weeklyWeightGain:m==="fcr"?r.fcr:m==="cumulative_fcr"?r.cumulativeFcr:m==="cv"?r.cv:m==="uniformity_10"?r.uniformity10:m==="uniformity_15"?r.uniformity15:null;
  const label={body_weight:"وزن",weekly_weight_gain:"افزایش وزن هفتگی",fcr:"FCR هفتگی",cumulative_fcr:"FCR تجمعی",cv:"CV",uniformity_10:"یکنواختی ±10",uniformity_15:"یکنواختی ±15"};
  const unit=m=>m==="body_weight"||m==="weekly_weight_gain"?" گرم":m==="cv"||m.startsWith("uniformity")?"٪":"";
  const norm=v=>String(v??'').normalize('NFKC').replace(/[\u200c\u200f\u202a-\u202e]/g,'').replace(/[‐‑‒–—−]/g,'-').replace(/[._/\\]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
  function history(rows,i,m){return rows.slice(0,i).map((r,j)=>({x:n(r.age),y:value(r,m),standard:modelTarget(r,m)})).filter(p=>p.x!==null&&p.y!==null&&p.standard!==null&&p.standard>0)}
  async function managementTargets(flock,ageDays){
    const client=global.supabaseClient||global.supabase;
    if(!client||n(ageDays)===null)return{};
    try{
      const {data,error}=await client.from('poultry_management_benchmarks').select('metric_code,age_days,target_value,source_type,source_name,source_year,source_url,genetics,strain,lower_value,upper_value').eq('active',true).eq('production_type','broiler').eq('age_days',Number(ageDays));
      if(error)throw error;
      const strain=norm(flock?.strain),genetics=norm(flock?.genetics);
      const rows=(data||[]).filter(x=>x.source_type!=='internal_real_flocks').filter(x=>{const xs=norm(x.strain),xg=norm(x.genetics);return xs?xs===strain:(!xg||xg===genetics)});
      const rank=x=>{const xs=norm(x.strain),xg=norm(x.genetics);return(xs===strain?8:0)+(xg===genetics?4:0)+(x.source_type==='management'?3:0)+(x.source_type==='management-fallback'?2:0)+(x.source_type==='official-proxy-management'?1:0)};
      const out={};
      for(const x of rows){const code=x.metric_code==='fcr_weekly'?'fcr':x.metric_code;if(!['body_weight','weekly_weight_gain','fcr','cumulative_fcr'].includes(code))continue;const v=n(x.target_value);if(v===null)continue;if(!out[code]||rank(x)>rank(out[code]))out[code]={value:v,sourceType:x.source_type||'management',sourceName:x.source_name||'هدف مدیریتی',sourceYear:x.source_year||null,sourceUrl:x.source_url||null,low:n(x.lower_value),high:n(x.upper_value)}}
      return out;
    }catch(e){console.warn('[Adine PI] management benchmark lookup failed',e);return{}};
  }
  function card(a,m){
    const cur=n(a?.currentValue??a?.current),management=a?.management||null;
    if(cur===null)return `<article class="pi-card unknown"><div class="pi-card-head"><span>${esc(label[m])}</span><span class="pi-badge unknown">داده ثبت نشده</span></div><div class="pi-main">—</div><div class="pi-detail">مقدار واقعی این شاخص در رکورد انتخاب‌شده موجود نیست.</div></article>`;
    if(!a?.ok){
      const mg=management?`<div class="pi-target">هدف مدیریتی: ${fmt(management.value,m.includes("fcr")?3:1)}${unit(m)}${management.sourceName?` — ${esc(management.sourceName)}`:''}</div>`:'';
      return `<article class="pi-card unknown"><div class="pi-card-head"><span>${esc(label[m])}</span><span class="pi-badge unknown">مرجع برای تحلیل کافی نیست</span></div><div class="pi-main">${fmt(cur,m.includes("fcr")?3:1)}${unit(m)}</div><div class="pi-target">${a.target!==null&&a.target!==undefined?`مرجع تحلیل: ${fmt(a.target,m.includes("fcr")?3:1)}${unit(m)}`:'مرجع رسمی/مدیریتی در این سن پیدا نشد'}</div>${mg}<div class="pi-detail">${esc(a.message||'مقدار واقعی حفظ شده است؛ فقط امتیازدهی بدون مرجع معتبر انجام نشد.')}</div></article>`;
    }
    const s=cls(a.status),d=n(a.delta_percent),lower=a.direction==="lower";
    const cmp=d===null?"":d===0?"مطابق مرجع":lower?(d<0?`${pct(Math.abs(d),2)} بهتر از مرجع`:`${pct(Math.abs(d),2)} بالاتر از مرجع`):(d>0?`${pct(Math.abs(d),2)} بالاتر از مرجع`:`${pct(Math.abs(d),2)} پایین‌تر از مرجع`);
    const f=a.forecast,ft=f?.available?`برآورد روند: ${fmt(f.projected_value,m.includes("fcr")?3:1)}${unit(m)}`:`پیش‌بینی فعال نیست؛ حداقل ۴ سابقه معتبر قبلی لازم است.`;
    const at=a.alert?.alert?`<div class="pi-alert">هشدار روند: ${a.alert.severity==="high"?"شدید":"نیازمند پایش"}</div>`:"";
    const source=a.source_name?`<div class="pi-source">منبع مرجع تحلیل: ${esc(a.source_name)}</div>`:'';
    const mg=management?`<div class="pi-target management">هدف مدیریتی: ${fmt(management.value,m.includes("fcr")?3:1)}${unit(m)}${management.sourceName?` — ${esc(management.sourceName)}`:''}</div>`:`<div class="pi-target management">هدف مدیریتی: ثبت نشده</div>`;
    return `<article class="pi-card ${s}"><div class="pi-card-head"><span>${esc(label[m])}</span><span class="pi-badge ${s}">${esc(statusFa(a.status))}</span></div><div class="pi-main">${fmt(a.current,m.includes("fcr")?3:1)}${unit(m)}</div><div class="pi-target">مرجع تحلیل: ${fmt(a.target,m.includes("fcr")?3:1)}${unit(m)}${a.source_type?` — ${esc(a.source_type)}`:''}</div>${mg}<div class="pi-detail">${esc(cmp||"بدون انحراف قابل گزارش")}</div><div class="pi-forecast">${esc(ft)}</div>${source}${at}</article>`;
  }
  function overall(results){const w={body_weight:25,weekly_weight_gain:20,fcr:20,cumulative_fcr:20,cv:7.5,uniformity_10:3.75,uniformity_15:3.75};let total=0,ws=0;results.forEach(a=>{if(a?.ok&&n(a.score)!==null){const z=w[a.metric]||1;total+=a.score*z;ws+=z}});const score=ws?total/ws:null;return{score,status:score===null?"unknown":score>=90?"excellent":score>=75?"good":score>=60?"watch":"critical"}}
  async function mountPanel(model,flock,rawRows,flockId,sel){
    const root=$('root');if(!root||!model?.rows?.length)return false;
    const i=Math.max(0,Number(sel?.value||0)),r=model.rows[i];if(!r)return false;
    const metrics=['body_weight','weekly_weight_gain','fcr','cumulative_fcr','cv','uniformity_10','uniformity_15'];
    const A=global.AdinePerformanceIntelligence;
    const mgMap=await managementTargets(flock,r.age);
    const analyses=metrics.map(async m=>{
      const cur=value(r,m);if(cur===null)return{ok:false,metric:m,currentValue:null,management:mgMap[m]||null,code:'insufficient_data'};
      if(!A?.analyze)return{ok:false,metric:m,currentValue:cur,management:mgMap[m]||null,code:'intelligence_engine_unavailable'};
      try{
        const future=model.rows.slice(i+1).find(x=>modelTarget(x,m)!==null);
        const result=await A.analyze({flockId,evaluationDate:r.raw?.evaluation_date||r.raw?.record_date||null,ageDays:r.age,metric:m,currentValue:cur,productionType:'broiler',genetics:flock.genetics||null,strain:flock.strain||null,history:history(model.rows,i,m),targetAgeDays:future?.age??null,futureStandard:future?modelTarget(future,m):null});
        return{...result,metric:m,currentValue:cur,management:mgMap[m]||null};
      }catch(e){console.warn('[Adine PI] metric failed',m,e);return{ok:false,metric:m,currentValue:cur,management:mgMap[m]||null,code:'metric_analysis_error',message:String(e?.message||e)}}
    });
    Promise.all(analyses).then(results=>{
      const panel=$('broiler-intelligence-panel')||document.createElement('section');panel.id='broiler-intelligence-panel';panel.className='section broiler-intelligence';
      const o=overall(results),failed=results.filter(a=>!a?.ok).length;
      panel.innerHTML=`<div class="pi-header"><div><div class="eyebrow">موتور تحلیل گوشتی</div><h2>تحلیل هوشمند عملکرد گله</h2><p>مقادیر واقعی از رکوردهای اصلی گله خوانده می‌شوند؛ مرجع رسمی و هدف مدیریتی فقط برای مقایسه استفاده می‌شوند.</p></div><div class="pi-overall ${cls(o.status)}"><span>امتیاز عملکرد</span><strong>${o.score===null?'—':fmt(o.score,0)}</strong><small>${esc(statusFa(o.status))}</small></div></div><div class="pi-grid">${results.map(a=>card(a,a.metric)).join('')}</div><div class="pi-foot"><span>هفته ${fmt(r.week,0)} — سن ${fmt(r.age,0)} روز</span><span>${failed?`${failed} شاخص مرجع/داده کافی برای امتیازدهی نداشت.`:'تمام شاخص‌های قابل تحلیل پردازش شدند.'}</span></div>`;
      if(!panel.parentNode)root.appendChild(panel);
      global.__ADINE_PI_LAST_OK=true;global.__ADINE_PI_LAST_STATE={flockId,week:r.week,age:r.age,failed};
    }).catch(e=>{console.error('[Adine PI] panel build failed',e);global.__ADINE_PI_LAST_OK=false;global.__ADINE_PI_LAST_ERROR=String(e?.message||e)});
    return true;
  }
  async function run(){
    const tab=document.querySelector('.report-tab.active');if(tab?.dataset.tab&&tab.dataset.tab!=='weekly'){ $('broiler-intelligence-panel')?.remove(); return false; }
    const root=$('root'),sel=$('week');if(!root||!sel)return false;
    if(!global.AdinePerformanceIntelligence||!global.AdineReportRouter||!global.AdineBroilerReportEngine)return false;
    const flockId=global.AdineReportRouter.currentFlockId()||global.currentFlock?.id||global.currentFlockForSpecialized?.id;if(!flockId)return false;
    try{const [flock,raw]=await Promise.all([global.AdineReportRouter.getFlock(flockId),global.AdineReportRouter.getWeeklyRecords(flockId)]);if(global.AdineReportRouter.productionType(flock.production_type)!=='broiler')return false;const model=global.AdineBroilerReportEngine.build(flock,raw||[]);return mountPanel(model,flock,raw||[],flockId,sel)}catch(e){console.warn('[Adine PI] data/build failed',e);global.__ADINE_PI_LAST_OK=false;global.__ADINE_PI_LAST_ERROR=String(e?.message||e);return false}
  }
  let timer=null,running=false,tries=0;
  function schedule(delay=300){clearTimeout(timer);timer=setTimeout(async()=>{if(running)return;running=true;try{const ok=await run();if(!ok&&tries<40){tries++;schedule(500)}}finally{running=false}},delay)}
  function start(){schedule(250);window.addEventListener('load',()=>schedule(100),{once:true});const root=$('root');if(root)new MutationObserver(()=>schedule(200)).observe(root,{childList:true,subtree:true});document.addEventListener('change',e=>{if(e.target?.id==='week')schedule(100)});document.addEventListener('click',e=>{if(e.target?.closest?.('.report-tab'))schedule(100)});global.addEventListener?.('adine:report-ready',()=>schedule(50));global.AdineMountBroilerIntelligence=()=>schedule(20)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
