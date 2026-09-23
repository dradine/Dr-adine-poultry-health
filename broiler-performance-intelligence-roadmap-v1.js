/* ADINE — Decision Roadmap V1.0
 * Presentation-only layer. It reads the existing PI engine model and never changes
 * standards, calculations, navigation, flock loading, or analytical outputs.
 */
(function(global){
  'use strict';

  const esc=s=>String(s??'—').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const n=v=>Number.isFinite(Number(v))?Number(v):null;
  const fmt=(v,d=1)=>n(v)===null?'—':n(v).toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d});

  const dirLabel=d=>d==='improving'?'بهبود':d==='worsening'?'تضعیف':d==='stable'?'پایدار':'نامشخص';
  const posLabel=p=>p==='better'?'بهتر از مرجع':p==='weaker'?'ضعیف‌تر از مرجع':p==='near_reference'?'نزدیک به مرجع':'نامشخص';
  const evidenceLabel=x=>x==='high'?'قوی':x==='medium'?'متوسط':x==='limited'?'محدود':'کم';
  const persistLabel=x=>x==='high'?'بالا':x==='medium'?'متوسط':x==='limited'?'محدود':x==='low'?'کم':'—';

  function chooseSignal(m){
    const fs=m?.forecastSummary||{};
    const candidates=[fs.risk,fs.improve].filter(Boolean);
    if(!candidates.length)return null;
    return candidates.sort((a,b)=>{
      const ea=n(a.evidenceScore)||0, eb=n(b.evidenceScore)||0;
      if(eb!==ea)return eb-ea;
      const pa=n(a.trajectory?.pointsUsed)||0, pb=n(b.trajectory?.pointsUsed)||0;
      return pb-pa;
    })[0];
  }

  function metricKeys(item){
    const out=[];
    if(item?.label)out.push(item.label);
    if(Array.isArray(item?.corroboratingMetrics))out.push(...item.corroboratingMetrics);
    return [...new Set(out.filter(Boolean))].slice(0,3);
  }

  function checkpointText(item,m){
    const keys=metricKeys(item);
    if(keys.length)return 'نقطه کنترل: '+keys.join(' • ')+' — در ارزیابی بعدی بررسی شود آیا فاصله نسبت به مرجع سنی حفظ، کمتر یا بیشتر شده است.';
    const states=m?.states||{};
    const candidates=Object.entries(states).map(([key,q])=>{
      const t=q?.trend||{}, tr=q?.trajectory||{};
      return {key,q,t,tr};
    }).filter(x=>x.t?.available||x.tr?.currentGapPercent!==undefined);
    const worsening=candidates.filter(x=>(x.tr?.pathDirection||x.t?.pathDirection||x.t?.direction)==='worsening');
    const improving=candidates.filter(x=>(x.tr?.pathDirection||x.t?.pathDirection||x.t?.direction)==='improving');
    const pick=(worsening[0]||improving[0]);
    return pick?'نقطه کنترل: '+esc(pick.q?.official?.label||pick.key)+' — جهت مسیر و فاصله از مرجع سنی در ارزیابی بعدی دوباره سنجیده شود.':'نقطه کنترل: ارزیابی بعدی باید با همان مرجع سنی معتبر، تغییر فاصله و جهت مسیر را دوباره محاسبه کند.';
  }

  function build(m){
    const item=chooseSignal(m);
    const fs=m?.forecastSummary||{};
    const risk=fs.risk, improve=fs.improve;
    const tr=item?.trajectory||{};
    const forecast=item?.forecast||{};
    const currentPosition=item?.currentMeaning||posLabel(tr.currentPosition);
    const currentGap=n(tr.currentGapPercent);
    const path=tr.pathDirection||forecast.pathDirection||item?.rawDirection||'stable';
    const relation=item?.gapRelation||'فاصله عملکردی تقریباً ثابت';
    const evidence=tr.evidenceLevel||item?.confidence||m?.confidence||'limited';
    const points=n(tr.pointsUsed);
    const persistence=tr.persistenceLevel;
    const uncertainty=n(forecast.uncertaintyPercent);
    const outlookAvailable=Boolean(forecast.available);
    const projected=tr.projectedPosition?posLabel(tr.projectedPosition):'—';
    const scenario=tr.conditionalOutlook?.primaryScenario;
    const scenarioLabel={
      continued_pressure:'تداوم فشار',
      deterioration_watch:'تضعیف از موقعیت مطلوب',
      negative_drift:'لغزش نامطلوب',
      recovery_path:'بازیابی مشروط',
      positive_continuation:'تداوم عملکرد مطلوب',
      improvement_watch:'حرکت بهبود نیازمند تأیید',
      stabilization:'تثبیت و پایش'
    }[scenario]||null;

    let nowTitle, nowText, nowClass='neutral';
    if(item){
      nowClass=(risk===item?'risk':'positive');
      nowTitle=item.label||'سیگنال غالب عملکردی';
      nowText=item.reason||('وضعیت فعلی '+currentPosition+' است و مسیر نسبت به مرجع سنی '+dirLabel(path)+' گزارش شده است.');
    }else{
      nowTitle='سیگنال غالب قابل اتکا تعیین نشد';
      nowText='داده فعلی برای انتخاب یک محور غالب کافی نیست؛ وضعیت موجود بدون ساختن یک نتیجه مصنوعی نمایش داده می‌شود.';
    }

    let nextTitle='ارزیابی بعدی: تأیید یا رد مسیر مشاهده‌شده';
    let nextText=checkpointText(item,m);
    if(item?.trajectory?.turningPoint==='recent_turning_point'){
      nextText+=' چرخش اخیر مشاهده شده و ارزیابی بعدی باید مشخص کند این چرخش پایدار است یا موقتی.';
    }else if(path==='worsening'){
      nextText+=' چون مسیر نامطلوب است، استمرار آن باید در نقطه اندازه‌گیری بعدی تأیید شود؛ یک مشاهده منفرد برای نتیجه‌گیری قطعی کافی نیست.';
    }else if(path==='improving'){
      nextText+=' چون مسیر به سمت بهتر حرکت کرده است، ارزیابی بعدی باید استمرار این بهبود نسبت به مرجع را تأیید کند.';
    }

    let laterTitle, laterText, laterClass='neutral';
    if(outlookAvailable){
      laterClass=path==='worsening'?'risk':path==='improving'?'positive':'neutral';
      laterTitle=projected==='بهتر از مرجع'?'بهبود مشروط موقعیت عملکردی':projected==='ضعیف‌تر از مرجع'?'تضعیف مشروط موقعیت عملکردی':'تثبیت مشروط موقعیت عملکردی';
      laterText=(forecast?.statement||tr.conditionalOutlook?.statement||('اگر همین مسیر نسبت به مرجع سنی ادامه پیدا کند، موقعیت عملکردی به سمت '+projected+' حرکت خواهد کرد.'))+' این یک سناریوی شرطی است، نه پیش‌بینی قطعی.';
      if(scenarioLabel)laterText+=' سناریو: '+scenarioLabel+'.';
      if(uncertainty!==null)laterText+=' دامنه عدم‌قطعیت مسیر: حدود ±'+fmt(uncertainty,1)+' واحد درصد.';
    }else{
      laterTitle='چشم‌انداز مشروط فعلاً قابل اتکا نیست';
      laterText='با داده یا پایداری فعلی، نمایش یک مسیر آینده به‌عنوان نتیجه معتبر علمی مناسب نیست. پس از ارزیابی‌های بیشتر، چشم‌انداز دوباره محاسبه می‌شود.';
    }

    const evidenceText=points!==null?fmt(points,0)+' ارزیابی':'تعداد نقاط نامشخص';
    const quality='شواهد '+evidenceLabel(evidence)+(persistence?' • تداوم '+persistLabel(persistence):'');
    const gapText=currentGap===null?'فاصله فعلی: —':'فاصله فعلی: '+(currentGap>0?'+':'')+fmt(currentGap,1)+'٪ نسبت به مرجع سنی';
    const conflict=risk&&improve?'سیگنال‌های مثبت و منفی هم‌زمان وجود دارند؛ کارت اکنون بر سیگنال با شواهد قوی‌تر تکیه می‌کند.':'';
    return '<div class="pi-roadmap-v1" dir="rtl">'+
      '<div class="pi-roadmap-v1-head"><div><span class="pi-roadmap-v1-kicker">DECISION ROADMAP • V1.0</span><b>مسیر تصمیم عملکردی</b><small>موقعیت فعلی → نقطه کنترل → چشم‌انداز مشروط</small></div><span class="pi-roadmap-v1-badge">'+esc(quality)+'</span></div>'+
      '<div class="pi-roadmap-v1-flow">'+
        '<article class="pi-roadmap-v1-card '+nowClass+'"><div class="pi-roadmap-v1-index">۰۱</div><div class="pi-roadmap-v1-label">اکنون <i>موقعیت فعلی</i></div><h4>'+esc(nowTitle)+'</h4><p>'+esc(nowText)+'</p><div class="pi-roadmap-v1-facts"><span>'+esc(currentPosition)+'</span><span>'+esc(gapText)+'</span><span>مسیر: '+esc(dirLabel(path))+'</span></div></article>'+
        '<div class="pi-roadmap-v1-connector" aria-hidden="true"><span></span></div>'+
        '<article class="pi-roadmap-v1-card next"><div class="pi-roadmap-v1-index">۰۲</div><div class="pi-roadmap-v1-label">ارزیابی بعدی <i>نقطه کنترل</i></div><h4>'+esc(nextTitle)+'</h4><p>'+esc(nextText)+'</p><div class="pi-roadmap-v1-check">'+esc(nextText.split(' — ')[0])+'</div></article>'+
        '<div class="pi-roadmap-v1-connector" aria-hidden="true"><span></span></div>'+
        '<article class="pi-roadmap-v1-card '+laterClass+'"><div class="pi-roadmap-v1-index">۰۳</div><div class="pi-roadmap-v1-label">اگر مسیر ادامه پیدا کند <i>چشم‌انداز مشروط</i></div><h4>'+esc(laterTitle)+'</h4><p>'+esc(laterText)+'</p><div class="pi-roadmap-v1-facts"><span>مبنای مسیر: مرجع سنی</span><span>'+esc(projected)+'</span><span>'+esc(scenarioLabel||'سناریوی مشروط')+'</span></div></article>'+
      '</div>'+
      '<div class="pi-roadmap-v1-evidence"><span class="pi-roadmap-v1-evidence-dot '+nowClass+'"></span><b>مبنای شواهد</b><span>'+esc(evidenceText)+'</span><span>'+esc(quality)+'</span><span>'+esc(relation)+'</span>'+ (conflict?'<span class="conflict">'+esc(conflict)+'</span>':'') +'</div>'+
    '</div>';
  }

  function apply(){
    const host=document.querySelector('.pi-roadmap-colored');
    const m=global.__adinePerformanceIntelligenceModel;
    if(!host||!m?.ready)return false;
    if(host.dataset.roadmapV1Applied==='true')return true;
    host.dataset.roadmapV1Applied='true';
    host.outerHTML=build(m);
    return true;
  }

  function boot(){
    let tries=0;
    const tick=()=>{
      if(apply())return;
      if(++tries<80)setTimeout(tick,125);
    };
    tick();
    const obs=new MutationObserver(()=>apply());
    obs.observe(document.body,{subtree:true,childList:true});
  }

  global.AdinePerformanceDecisionRoadmapV1={version:'1.0.0',build,apply};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
