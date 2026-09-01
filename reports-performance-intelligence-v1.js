/* ADINE REPORTS — BROILER PERFORMANCE INTELLIGENCE INTEGRATION V3
   Read-only UI integration. Does not calculate or write canonical production metrics.
   Mounts after report rendering and retries until the report data lifecycle is ready.
*/
"use strict";
(function(global){
  const $=id=>document.getElementById(id);
  const n=v=>{if(v===null||v===undefined||v==="")return null;const x=Number(String(v).replace(/[٬,]/g,"").replace("٫","."));return Number.isFinite(x)?x:null};
  const fmt=(v,d=1)=>{const x=n(v);return x===null?"—":x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
  const pct=(v,d=1)=>{const x=n(v);return x===null?"—":x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})+'٪'};
  const esc=s=>String(s??"—").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const faStatus=s=>({excellent:"عالی",good:"خوب",watch:"نیازمند پایش",critical:"نیازمند اقدام",unknown:"اطلاعات ناکافی"}[s]||"اطلاعات ناکافی");
  const statusClass=s=>s==="excellent"?"excellent":s==="good"?"good":s==="watch"?"watch":s==="critical"?"critical":"unknown";
  const targetFor=(r,m)=>m==="body_weight"?r.standardWeight:m==="weekly_weight_gain"?r.standardWeeklyWeightGain:m==="fcr"?r.standardWeeklyFcr:m==="cumulative_fcr"?r.standardCumulativeFcr:m==="cv"?r.cvStandard:m==="uniformity_10"?r.uniformity10Standard:m==="uniformity_15"?r.uniformity15Standard:null;
  const valueFor=(r,m)=>m==="body_weight"?r.weight:m==="weekly_weight_gain"?r.weeklyWeightGain:m==="fcr"?r.fcr:m==="cumulative_fcr"?r.cumulativeFcr:m==="cv"?r.cv:m==="uniformity_10"?r.uniformity10:m==="uniformity_15"?r.uniformity15:null;
  const labelFor={body_weight:"وزن",weekly_weight_gain:"افزایش وزن هفتگی",fcr:"FCR هفتگی",cumulative_fcr:"FCR تجمعی",cv:"CV",uniformity_10:"یکنواختی ±10",uniformity_15:"یکنواختی ±15"};
  const unitFor=m=>m==="body_weight"||m==="weekly_weight_gain"?" گرم":m==="cv"||m.startsWith("uniformity")?"٪":"";
  function buildHistory(rows,index,m){return rows.slice(0,index).map((r,i)=>({x:n(r.age??r.age_days??i),y:valueFor(r,m),standard:targetFor(r,m)})).filter(p=>p.x!==null&&p.y!==null&&p.standard!==null&&p.standard>0)}
  function futureStandard(rows,index,m){const f=rows.slice(index+1).find(r=>targetFor(r,m)!==null);return f?{ageDays:n(f.age),standard:targetFor(f,m)}:null}
  function card(a,m){if(!a?.ok)return `<article class="pi-card unknown"><div class="pi-card-head"><span>${esc(labelFor[m])}</span><span class="pi-badge unknown">اطلاعات ناکافی</span></div><div class="pi-main">—</div><div class="pi-detail">این شاخص بدون داده و مرجع معتبر تحلیل نشد.</div></article>`;const s=statusClass(a.status),d=n(a.delta_percent),comparison=d===null?"":d===0?"مطابق مرجع":a.direction==="lower"?(d<0?`${pct(Math.abs(d),2)} بهتر از مرجع`:`${pct(Math.abs(d),2)} بالاتر از مرجع`)):(d>0?`${pct(Math.abs(d),2)} بالاتر از مرجع`:`${pct(Math.abs(d),2)} پایین‌تر از مرجع`);const f=a.forecast;const ftext=f?.available?`برآورد روند: ${fmt(f.projected_value,m.includes("fcr")?3:1)}${unitFor(m)}`:`پیش‌بینی فعال نیست؛ حداقل ۴ سابقه معتبر قبلی لازم است.`;const alert=a.alert?.alert?`هشدار روند: ${a.alert.severity==="high"?"شدید":"نیازمند پایش"}`:"";return `<article class="pi-card ${s}"><div class="pi-card-head"><span>${esc(labelFor[m])}</span><span class="pi-badge ${s}">${esc(faStatus(a.status))}</span></div><div class="pi-main">${fmt(a.current,m.includes("fcr")?3:1)}${unitFor(m)}</div><div class="pi-target">مرجع: ${fmt(a.target,m.includes("fcr")?3:1)}${unitFor(m)}</div><div class="pi-detail">${esc(comparison||"بدون انحراف قابل گزارش")}</div><div class="pi-forecast">${esc(ftext)}</div>${alert?`<div class="pi-alert">${esc(alert)}</div>`:""}</article>`}
  function summary(results){const weights={body_weight:25,weekly_weight_gain:20,fcr:20,cumulative_fcr:20,cv:7.5,uniformity_10:3.75,uniformity_15:3.75};const valid=results.filter(a=>a?.ok&&n(a.score)!==null);if(!valid.length)return{score:null,status:"unknown"};let total=0,ws=0;valid.forEach(a=>{const w=weights[a.metric]||1;total+=a.score*w;ws+=w});const score=ws?total/ws:null;return{score,status:score===null?"unknown":score>=90?"excellent":score>=75?"good":score>=60?"watch":"critical"}}
  let running=false,lastKey="",timer=null,retries=0;
  async function run(){
    const active=document.querySelector('.report-tab.active');
    if(active?.dataset.tab&&active.dataset.tab!=='weekly'){$('broiler-intelligence-panel')?.remove();return false}
    const root=$('root'),sel=$('week');
    if(!root||!sel)return false;
    if($('broiler-intelligence-panel'))return true;
    if(!global.AdinePerformanceIntelligence||!global.AdineReportRouter||!global.AdineBroilerReportEngine)return false;
    const flockId=global.AdineReportRouter.currentFlockId();if(!flockId)return false;
    let flock,rawRows;
    try{[flock,rawRows]=await Promise.all([global.AdineReportRouter.getFlock(flockId),global.AdineReportRouter.getWeeklyRecords(flockId)])}catch(e){console.warn('Broiler intelligence integration data load failed',e);return false}
    if(global.AdineReportRouter.productionType(flock.production_type)!=='broiler')return false;
    const model=global.AdineBroilerReportEngine.build(flock,rawRows||[]),i=Math.max(0,Number(sel.value||0)),r=model.rows[i];if(!r)return false;
    const metrics=['body_weight','weekly_weight_gain','fcr','cumulative_fcr','cv','uniformity_10','uniformity_15'];
    const results=await Promise.all(metrics.map(async m=>{const current=valueFor(r,m),target=targetFor(r,m);if(current===null||target===null)return{ok:false,code:'insufficient_data',metric:m};const fs=futureStandard(model.rows,i,m),official=['body_weight','weekly_weight_gain','fcr','cumulative_fcr'].includes(m);return{...(await global.AdinePerformanceIntelligence.analyze({flockId,evaluationDate:r.raw?.evaluation_date||r.raw?.record_date||null,ageDays:r.age,metric:m,currentValue:current,productionType:'broiler',genetics:flock.genetics||null,strain:flock.strain||null,history:buildHistory(model.rows,i,m),targetAgeDays:fs?.ageDays||null,futureStandard:fs?.standard??null,targetOverride:target,targetSourceType:official?'official':'management',targetSourceName:official?(r.weightSourceLabel||r.fcrSourceLabel||'مرجع رسمی سویه'):'هدف مدیریتی پایش',standardAgeDays:r.age})),metric:m}}));
    if($('broiler-intelligence-panel'))return true;
    const overall=summary(results),host=document.createElement('section');host.id='broiler-intelligence-panel';host.className='section broiler-intelligence';
    host.innerHTML=`<div class="pi-header"><div><div class="eyebrow">موتور تحلیل گوشتی</div><h2>تحلیل هوشمند عملکرد گله</h2><p>تحلیل فقط از داده‌های همین گله و مرجع همان سویه/سن استفاده می‌کند؛ هیچ مقدار canonical تغییر نمی‌کند.</p></div><div class="pi-overall ${statusClass(overall.status)}"><span>امتیاز عملکرد</span><strong>${overall.score===null?'—':fmt(overall.score,0)}</strong><small>${esc(faStatus(overall.status))}</small></div></div><div class="pi-grid">${results.map(a=>card(a,a.metric)).join('')}</div><div class="pi-foot"><span>هشدار تطبیقی پس از حداقل ۴ سابقه معتبر قبلی فعال می‌شود.</span><span>پیش‌بینی روند بر مبنای نسبت عملکرد واقعی به مرجع سنی انجام می‌شود؛ نه اختلاف مطلق.</span></div>`;
    root.appendChild(host);return true;
  }
  function schedule(force=false){clearTimeout(timer);timer=setTimeout(async()=>{if(running)return;running=true;try{const key=($('week')?.value||'')+'|'+location.search+'|'+(document.querySelector('.report-tab.active')?.dataset.tab||'weekly');const ok=await run();if(ok){lastKey=key;retries=0}else if(retries<30){retries++;schedule(true)}}catch(e){console.warn('Broiler intelligence render failed',e);if(retries<30){retries++;schedule(true)}}finally{running=false}},force?250:120)}
  function start(){schedule(true);window.addEventListener('load',()=>schedule(true),{once:true});const root=$('root'),sel=$('week');if(root){const observer=new MutationObserver(()=>schedule(true));observer.observe(root,{childList:true,subtree:true})}if(sel){const observer=new MutationObserver(()=>schedule(true));observer.observe(sel,{childList:true,subtree:true,attributes:true})}}
  document.addEventListener('change',e=>{if(e.target?.id==='week')schedule(true)});
  document.addEventListener('click',e=>{if(e.target?.closest?.('.report-tab'))schedule(true)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
