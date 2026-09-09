/* ADINE POULTRY HEALTH — BROILER FCR WEEKLY UI BRIDGE V1.2
   UI/integration bridge only.
   Canonical FCR math remains exclusively in broiler-fcr-engine-v11.js.
   No standards, formulas, database schema, or non-broiler calculations are changed.
*/
(function(global){'use strict';
  const VERSION='BROILER-FCR-WEEKLY-UI-V1.2';
  const num=v=>{
    if(v===null||v===undefined||v==='')return null;
    let s=String(v).trim().replace(/,/g,'').replace(/٬/g,'').replace(/٫/g,'.')
      .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    const x=Number(s);return Number.isFinite(x)?x:null;
  };
  const firstNumber=(...vs)=>{for(const v of vs){const x=num(v);if(x!==null)return x}return null};
  const flock=()=>global.currentFlockForSpecialized||global.currentFlock||null;
  const isBroiler=()=>global.AdineBroilerFCR?.isBroiler?.(flock())===true || ['broiler','broilers','گوشتی','meat'].includes(String(flock()?.production_type||flock()?.productionType||'').trim().toLowerCase());
  const performance=()=>global.AdinePerformance||null;

  function installBroilerCompatibility(){
    const f=flock(),p=performance();
    if(!f||!p||!isBroiler())return false;
    if(typeof p.layerWeekly!=='function')p.layerWeekly=()=>null;
    if(typeof p.layerCumulative!=='function')p.layerCumulative=()=>null;
    if(typeof p.mortalityCorrectedFCR!=='function')p.mortalityCorrectedFCR=()=>null;
    return true;
  }

  function currentInputs(result){
    const feed=firstNumber(result?.feed_total_kg,result?.feedTotalKg,result?.feedKg,document.getElementById('feedTotal')?.value);
    const live=firstNumber(result?.live_birds,result?.liveBirds,document.getElementById('liveBirds')?.value);
    const weight=firstNumber(result?.mean,result?.average_weight_g,result?.averageWeightG,document.getElementById('averageWeightDirect')?.value);
    const week=firstNumber(result?.week_number,result?.weekNumber,result?.week,document.getElementById('weekNumber')?.value);
    const age=firstNumber(result?.age_days,result?.ageDays);
    return {feed,live,weight,week,age};
  }

  function records(){
    try{if(typeof weeklyRecords!=='undefined'&&Array.isArray(weeklyRecords))return weeklyRecords}catch(e){}
    return [];
  }

  function previous(result){
    const rs=records(),i=currentInputs(result),w=i.week;
    const editing=typeof editingRecordId!=='undefined'?editingRecordId:null;
    const candidates=rs.filter(r=>String(r?.id)!==String(editing||''));
    if(!candidates.length)return null;
    if(w!=null){
      const prior=candidates.filter(r=>{const rw=firstNumber(r?.week_number,r?.weekNumber,r?.week);return rw!=null&&rw<w}).sort((a,b)=>firstNumber(a?.week_number,a?.weekNumber,a?.week)-firstNumber(b?.week_number,b?.weekNumber,b?.week));
      if(prior.length)return prior[prior.length-1];
    }
    return candidates.slice().sort((a,b)=>(firstNumber(a?.age_days,a?.ageDays)??-1)-(firstNumber(b?.age_days,b?.ageDays)??-1)).at(-1)||null;
  }

  function weeklyFcr(result){
    if(!installBroilerCompatibility())return null;
    const i=currentInputs(result),p=performance(),f=flock();
    if(i.feed==null||i.feed<=0||i.live==null||i.live<=0||i.weight==null||i.weight<=0)return null;

    /* Week 1 is a valid FCR calculation. There is no previous weekly record,
       so use the flock's registered opening population/weight as the opening
       state. This is the same opening-state convention already used by the
       canonical engine and by performance-engine-v2; no new formula is added. */
    const prev=previous(result);
    const openBirds=firstNumber(prev?.live_birds,prev?.liveBirds,f?.initial_bird_count,f?.initialBirdCount);
    const openWeight=firstNumber(prev?.average_weight_g,prev?.averageWeightG,prev?.averageWeight,f?.initial_average_weight_g,f?.initialAverageWeightG);
    const openAgeDays=firstNumber(prev?.age_days,prev?.ageDays,f?.start_age_days,f?.startAgeDays);

    return p.broilerWeeklyFCR({
      feedKg:i.feed,
      openBirds,
      openWeight,
      openAgeDays,
      closeBirds:i.live,
      closeWeight:i.weight,
      closeAgeDays:i.age
    });
  }

  function cumulativeFcr(result){
    if(!installBroilerCompatibility())return null;
    const p=performance(),i=currentInputs(result),f=flock();
    if(!f||i.feed==null||i.feed<=0||i.live==null||i.live<=0||i.weight==null||i.weight<=0)return null;
    const age=i.age;
    if(age==null)return null;
    const editing=typeof editingRecordId!=='undefined'?editingRecordId||'':'';
    const prior=records().filter(r=>String(r?.id)!==String(editing));
    const current={age_days:age,feed_total_kg:i.feed,average_weight_g:i.weight,live_birds:i.live};
    return p.broilerCumulativeFCR([...prior,current],f);
  }

  function upsertCard(id,title,value,sub){
    const root=document.getElementById('results');if(!root)return;
    let el=document.getElementById(id);
    if(!el){el=document.createElement('div');el.id=id;el.className='metric-card';root.appendChild(el)}
    el.innerHTML='<div class="metric-label">'+title+'</div><div class="metric-value">'+value+'</div>'+(sub?'<div class="metric-label" style="margin-top:6px">'+sub+'</div>':'');
  }

  function showFcr(result){
    if(!isBroiler())return;
    const wf=weeklyFcr(result),cf=cumulativeFcr(result);
    upsertCard('adineFcrWeekly','FCR هفتگی',wf==null?'قابل محاسبه نیست':Number(wf).toFixed(3),'محاسبه مستقل همان هفته');
    upsertCard('adineFcrCumulative','FCR تجمعی',cf==null?'پس از ذخیره تکمیل می‌شود':Number(cf).toFixed(3),'محاسبه مستقل از ابتدای گله');
  }

  async function showAuthorities(){
    if(!isBroiler()||!global.AdineBroilerFCR?.analysis)return;
    const f=flock();if(!f?.id)return;
    try{
      const a=await global.AdineBroilerFCR.analysis(f.id),r=a?.latest;
      if(!r)return;
      const fmt=v=>num(v)==null?'—':Number(v).toFixed(3);
      upsertCard('adineFcrWeekly','FCR هفتگی',fmt(r.weeklyFcr),'مقدار canonical ذخیره‌شده');
      upsertCard('adineFcrCumulative','FCR تجمعی',fmt(r.cumulativeFcr),'مقدار canonical ذخیره‌شده');
      upsertCard('adineFcrWeeklyAuthority','اختیار مدیریتی هفتگی',fmt(r.managementWeekly),r.management_cohort?('کوهورت: '+r.management_cohort):'');
      upsertCard('adineFcrCumulativeAuthority','اختیار مدیریتی تجمعی',fmt(r.managementCumulative),r.management_flocks!=null?('تعداد گله مرجع: '+r.management_flocks):'');
      upsertCard('adineFcrWeeklyOfficial','استاندارد رسمی هفتگی',fmt(r.officialWeekly),r.official_source||'');
      upsertCard('adineFcrCumulativeOfficial','استاندارد رسمی تجمعی',fmt(r.officialCumulative),r.official_source||'');
    }catch(e){console.warn('Broiler FCR authority display:',e)}
  }

  function patchRender(){
    if(typeof global.renderResults!=='function'||global.renderResults.__adineBroilerFcrV1)return false;
    const original=global.renderResults;
    function wrapped(result){original(result);try{showFcr(result)}catch(e){console.warn('Broiler FCR weekly UI:',e)}}
    wrapped.__adineBroilerFcrV1=true;
    global.renderResults=wrapped;
    return true;
  }

  function patchSave(){
    if(typeof global.saveWeeklyRecord!=='function'||global.saveWeeklyRecord.__adineBroilerFcrV1)return false;
    const original=global.saveWeeklyRecord;
    async function wrappedSave(){const out=await original.apply(this,arguments);await showAuthorities();return out}
    wrappedSave.__adineBroilerFcrV1=true;
    global.saveWeeklyRecord=wrappedSave;
    return true;
  }

  function start(){
    let i=0;
    const timer=setInterval(()=>{installBroilerCompatibility();patchRender();patchSave();if(++i>240)clearInterval(timer)},250);
    installBroilerCompatibility();patchRender();patchSave();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  global.AdineBroilerFcrWeeklyUI={VERSION};
})(typeof window!=='undefined'?window:globalThis);
