/* ADINE — Broiler Performance Intelligence report presentation layer V1
   Read-only. Does not alter weekly records, calculations, standards or navigation. */
(function(global){'use strict';
const $=s=>document.querySelector(s), root=()=>document.getElementById('root');
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const fmt=(v,d=1)=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
const pct=v=>n(v)===null?'—':fmt(v,1)+'٪';
function card(label,value,sub,kind='neutral'){return `<article class="pi-card ${kind}"><div>${esc(label)}</div><strong>${esc(value)}</strong><small>${esc(sub||'')}</small></article>`}
function state(s){return s==='excellent'?'عالی':s==='good'?'خوب':s==='watch'?'نیازمند پایش':s==='critical'?'نیازمند اقدام':'اطلاعات ناکافی'}
function render(){const r=root();if(!r)return;const model=global.AdineReportRouter?.currentModel?.();const flock=global.__adineReportFlock||null;const rows=global.__adineReportRows||[];if(!rows.length){r.innerHTML='<section class="section"><div class="empty">برای تحلیل هوشمند، حداقل یک رکورد هفتگی معتبر لازم است.</div></section>';return}
 const last=rows[rows.length-1]||{}, previous=rows.slice(0,-1);const age=n(last.age_days??last.age);const weight=n(last.average_weight_g??last.average_weight??last.weight_g??last.weight);const fcr=n(last.fcr);const cumFcr=n(last.cumulative_fcr);const cv=n(last.cv_percent??last.cv);const u10=n(last.uniformity_10_percent??last.uniformity_10);const u15=n(last.uniformity_15_percent??last.uniformity_15);const mort=n(last.mortality_count??last.mortality);
 const ref=(last.standardWeight??last.standard_weight), fcrRef=(last.standardWeeklyFcr??last.standard_fcr), cumRef=(last.standardCumulativeFcr??last.standard_cumulative_fcr);
 const engine=global.AdinePerformanceIntelligence;const analyses=[];
 async function one(metric,current,target,history){if(!engine||current===null)return null;try{return await engine.analyze({flockId:flock?.id,evaluationDate:last.evaluation_date||last.record_date||null,ageDays:age,metric,currentValue:current,productionType:'broiler',genetics:flock?.genetics,strain:flock?.strain,history,targetOverride:target,targetSourceType:target!==null?'official':'unknown',standardAgeDays:age})}catch(e){return null}}
 Promise.all([
   one('body_weight',weight,n(ref),previous.map(x=>({x:n(x.age_days??x.age),y:n(x.average_weight_g??x.average_weight??x.weight_g??x.weight),standard:n(x.standardWeight??x.standard_weight)}))),
   one('fcr',fcr,n(fcrRef),previous.map(x=>({x:n(x.age_days??x.age),y:n(x.fcr),standard:n(x.standardWeeklyFcr??x.standard_fcr)}))),
   one('cumulative_fcr',cumFcr,n(cumRef),previous.map(x=>({x:n(x.age_days??x.age),y:n(x.cumulative_fcr),standard:n(x.standardCumulativeFcr??x.standard_cumulative_fcr)}))),
   one('cv',cv,10,previous.map(x=>({x:n(x.age_days??x.age),y:n(x.cv_percent??x.cv),standard:10}))),
   one('uniformity_10',u10,80,previous.map(x=>({x:n(x.age_days??x.age),y:n(x.uniformity_10_percent??x.uniformity_10),standard:80}))),
   one('uniformity_15',u15,90,previous.map(x=>({x:n(x.age_days??x.age),y:n(x.uniformity_15_percent??x.uniformity_15),standard:90}))),
   one('mortality_rate',mort,null,previous.map(x=>({x:n(x.age_days??x.age),y:n(x.mortality_count??x.mortality),standard:1})))
 ]).then(a=>{const valid=a.filter(Boolean),bad=valid.filter(x=>x.status==='critical'||x.alert?.alert),good=valid.filter(x=>x.status==='excellent'||x.status==='good');const avg=valid.length?valid.reduce((s,x)=>s+(x.score??0),0)/valid.length:null;const forecast=valid.filter(x=>x.forecast?.available);const alerts=valid.filter(x=>x.alert?.alert);
 r.innerHTML=`<section class="section pi-hero"><div><div class="eyebrow">هوش عملکرد گله گوشتی</div><h2>تحلیل هوشمند عملکرد گله</h2><p>این بخش فقط لایه تصمیم‌یار است؛ محاسبات اصلی، استانداردهای رسمی و داده‌های ثبت‌شده را تغییر نمی‌دهد.</p><div class="pi-meta"><span>سن: <b>${fmt(age,0)} روز</b></span><span>رکوردهای تحلیل‌شده: <b>${fmt(rows.length,0)}</b></span><span>شاخص‌های قابل تحلیل: <b>${fmt(valid.length,0)}</b></span></div></div><div class="pi-score"><span>امتیاز هوشمند</span><strong>${fmt(avg,0)}/100</strong><small>${bad.length?'نیازمند توجه':good.length===valid.length?'وضعیت مطلوب':'پایش'}</small></div></section>
 <section class="section"><div class="pi-grid">${card('وزن',weight===null?'—':fmt(weight,0)+' گرم',valid[0]?.ui?.reasonFa||'')}${card('FCR هفتگی',fcr===null?'—':fmt(fcr,3),valid[1]?.ui?.reasonFa||'')}${card('FCR تجمعی',cumFcr===null?'—':fmt(cumFcr,3),valid[2]?.ui?.reasonFa||'')}${card('CV',pct(cv),valid[3]?.ui?.reasonFa||'')}${card('یکنواختی ±10',pct(u10),valid[4]?.ui?.reasonFa||'')}${card('یکنواختی ±15',pct(u15),valid[5]?.ui?.reasonFa||'')}</div></section>
 <section class="section"><div class="section-title"><div><div class="eyebrow">تصمیم‌یار</div><h2>مهم‌ترین یافته‌ها</h2></div></div><div class="pi-findings">${valid.map(x=>`<div class="pi-finding ${x.status||''}"><b>${esc(x.metric)}</b><span>${esc(x.ui?.label||state(x.status))}</span><p>${esc(x.ui?.reasonFa||'بدون انحراف قابل گزارش')}</p>${x.alert?.alert?`<em>⚠ ${esc(x.alert.message_fa||'انحراف غیرعادی نسبت به الگوی تاریخی')}</em>`:''}</div>`).join('')}</div></section>
 <section class="section"><div class="section-title"><div><div class="eyebrow">پیش‌بینی روند</div><h2>چشم‌انداز کوتاه‌مدت</h2></div></div><div class="pi-forecast">${forecast.length?forecast.map(x=>{const f=x.forecast;return `<div class="pi-forecast-item"><b>${esc(x.metric)}</b><span>${esc(f.direction==='rising'?'روند افزایشی':f.direction==='falling'?'روند کاهشی':'روند ثابت')}</span><small>روش: ${esc(f.method)} · اطمینان: ${esc(f.confidence)}</small></div>`}).join(''):'<div class="pi-muted">برای پیش‌بینی، سابقه کافی در دسترس نیست.</div>'}</div></section>`;});
}
 global.AdineBroilerPerformanceIntelligenceReport={render};
})(window);
