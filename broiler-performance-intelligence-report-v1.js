/* ADINE — Broiler Performance Intelligence presentation V2
   Presentation only. Reads the isolated intelligence model; no calculations,
   standards lookup, database writes or source-data mutations.
*/
(function(global){'use strict';
const root=()=>document.getElementById('root');
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const fmt=(v,d=1)=>n(v)===null?'—':n(v).toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=v=>n(v)===null?'—':fmt(v,1)+'٪';
const statusText=s=>({excellent:'ممتاز',good:'مطلوب',watch:'نیازمند پایش',critical:'نیازمند اقدام',unavailable:'قابل ارزیابی نیست'}[s]||'قابل ارزیابی نیست');
const trendText=t=>({improving:'در حال بهبود',worsening:'در حال بدتر شدن',stable:'نسبتاً پایدار',insufficient:'سابقه کافی نیست'}[t?.direction]||'سابقه کافی نیست');
function metric(label,value,state,detail){return `<article class="pi-metric"><div class="pi-metric-label">${esc(label)}</div><div class="pi-metric-value">${esc(value)}</div><div class="pi-metric-sub">${esc(detail||'')}</div><div class="pi-metric-status ${esc(state?.status||'unavailable')}">${esc(statusText(state?.status))}</div></article>`}
function render(){const r=root();if(!r)return;const model=global.__adinePerformanceIntelligenceModel;if(!model||!model.ready){r.innerHTML='<section class="section"><div class="empty">برای هوش عملکرد، حداقل یک ارزیابی هفتگی معتبر لازم است.</div></section>';return}
 const s=model.states||{};const f=model.epefInfo||{};const status=model.status||'watch';
 const flock=global.__adineReportFlock||{};const strain=flock.strain||flock.genetics||'—';
 const insights=model.insights||[];
 const sourceNote='تمام مقایسه‌های مرجع از همان مدل ارزیابی هفتگی/گزارش جامع این گله خوانده شده‌اند؛ هوش عملکرد استاندارد مستقل یا داده خارجی را وارد نمی‌کند.';
 const missing=model.missing||[];
 r.innerHTML=`<div class="pi-intelligence" dir="rtl">
 <section class="pi-hero"><div class="pi-hero-main"><div class="pi-eyebrow">تصمیم‌یار تخصصی • گوشتی</div><h2>هوش عملکرد گله</h2><p>تحلیل چندشاخصی رشد، کارایی خوراک، بقا و یکنواختی؛ با تفسیر روندی و محافظه‌کارانه.</p><div class="pi-meta"><span>سویه: <b>${esc(strain)}</b></span><span>سن: <b>${fmt(model.age,0)} روز</b></span><span>ارزیابی‌های معتبر: <b>${fmt(model.coverage?.records,0)}</b></span><span>منبع: <b>ارزیابی هفتگی</b></span></div></div><div class="pi-status-card ${esc(status)}"><span class="pi-status-dot"></span><strong>${esc(statusText(status))}</strong><small>وضعیت کلی تصمیم‌یار<br>بر پایه شاخص‌های موجود</small></div></section>
 <section class="pi-section"><div class="pi-section-head"><div><h3>شاخص‌های اصلی</h3><p>مقدار فعلی در برابر مرجع ثبت‌شده</p></div></div><div class="pi-metrics">
 ${metric('وزن متوسط',s.weightState?.current===undefined?'—':fmt(s.weightState?.current,0)+' گرم',s.weightState,s.weightState?.deviation===null?'مرجع در ارزیابی موجود نیست':`${fmt(s.weightState.deviation,1)}٪ نسبت به مرجع`)}
 ${metric('FCR هفتگی',s.fcrState?.current===undefined?'—':fmt(s.fcrState?.current,3),s.fcrState,s.fcrState?.deviation===null?'مرجع FCR موجود نیست':`${fmt(s.fcrState.deviation,1)}٪ نسبت به مرجع`)}
 ${metric('FCR تجمعی',s.cumFcrState?.current===undefined?'—':fmt(s.cumFcrState?.current,3),s.cumFcrState,s.cumFcrState?.deviation===null?'مرجع تجمعی موجود نیست':`${fmt(s.cumFcrState.deviation,1)}٪ نسبت به مرجع`)}
 ${metric('ADG / افزایش هفتگی',s.adgState?.current===undefined?'—':fmt(s.adgState?.current,1)+' گرم/روز',s.adgState,s.adgState?.deviation===null?'مرجع ADG موجود نیست':`${fmt(s.adgState.deviation,1)}٪ نسبت به مرجع`)}
 ${metric('تلفات',s.mortalityState?.current===undefined?'—':pct(s.mortalityState?.current),s.mortalityState,s.mortalityState?.deviation===null?'مرجع تلفات موجود نیست':`${fmt(s.mortalityState.deviation,1)}٪ نسبت به مرجع`)}
 ${metric('CV',s.cvState?.current===undefined?'—':pct(s.cvState?.current),s.cvState,s.cvState?.deviation===null?'مرجع CV موجود نیست':`${fmt(s.cvState.deviation,1)}٪ نسبت به مرجع`)}
 ${metric('یکنواختی ±10٪',s.u10State?.current===undefined?'—':pct(s.u10State?.current),s.u10State,s.u10State?.deviation===null?'مرجع یکنواختی موجود نیست':`${fmt(s.u10State.deviation,1)}٪ نسبت به مرجع`)}
 ${metric('یکنواختی ±15٪',s.u15State?.current===undefined?'—':pct(s.u15State?.current),s.u15State,s.u15State?.deviation===null?'مرجع یکنواختی موجود نیست':`${fmt(s.u15State.deviation,1)}٪ نسبت به مرجع`)}
 </div></section>
 <section class="pi-section"><div class="pi-section-head"><div><h3>EPEF</h3><p>شاخص ترکیبی بهره‌وری؛ برای جلوگیری از دوباره‌شماری، مستقل از امتیازدهی سایر KPIها نمایش داده می‌شود.</p></div></div><div class="pi-epef"><strong>${model.epef===null||model.epef===undefined?'—':fmt(model.epef,0)}</strong><div class="pi-epef-copy"><b>${esc(statusText(f.status))}</b><span>${esc(f.text||'EPEF در داده‌های ارزیابی موجود نیست.')}</span></div></div></section>
 <section class="pi-section"><div class="pi-section-head"><div><h3>روند عملکرد</h3><p>روند فقط از سوابق هفتگی موجود در همین گله خوانده شده است.</p></div></div><div class="pi-metrics">
 ${metric('روند وزن',trendText(s.weightTrend),{status:s.weightTrend?.direction==='worsening'?'watch':s.weightTrend?.direction==='improving'?'good':'unavailable'},s.weightTrend?.deltaPercent===undefined?'':`${fmt(s.weightTrend.deltaPercent,1)}٪ تغییر در آخرین سوابق`)}
 ${metric('روند ADG',trendText(s.adgTrend),{status:s.adgTrend?.direction==='worsening'?'watch':s.adgTrend?.direction==='improving'?'good':'unavailable'},'سیگنال روندی، نه پیش‌بینی قطعی')}
 ${metric('روند FCR',trendText(s.fcrTrend),{status:s.fcrTrend?.direction==='worsening'?'watch':s.fcrTrend?.direction==='improving'?'good':'unavailable'},'برای FCR کاهش مطلوب است')}
 ${metric('روند CV',trendText(s.cvTrend),{status:s.cvTrend?.direction==='worsening'?'watch':s.cvTrend?.direction==='improving'?'good':'unavailable'},'برای CV کاهش مطلوب است')}
 </div></section>
 <section class="pi-section"><div class="pi-section-head"><div><h3>مهم‌ترین تفسیرها</h3><p>حداکثر چند insight با اولویت بالا؛ نه فهرست شلوغ هشدارها</p></div></div><div class="pi-insights">${insights.length?insights.map(x=>`<article class="pi-insight ${esc(x.severity||'watch')}"><h4>${esc(x.title)}</h4><p>${esc(x.text)}</p><small>قاعده: ${esc(x.code)}</small></article>`).join(''):'<article class="pi-insight positive"><h4>الگوی بحرانی شناسایی نشد</h4><p>در داده‌های موجود، ترکیب شاخص‌ها الگوی مهمی برای هشدار عملکردی ایجاد نکرده است.</p></article>'}</div></section>
 <div class="pi-note"><b>مبنای علمی و داده‌ای:</b> ${esc(sourceNote)}<br><span class="pi-missing">${missing.length?`داده‌های فاقد پوشش کامل: ${esc(missing.join('، '))}`:'پوشش داده‌ای شاخص‌های اصلی مناسب است.'}</span></div>
 </div>`;
}
global.AdineBroilerPerformanceIntelligenceReport={render};
})(window);