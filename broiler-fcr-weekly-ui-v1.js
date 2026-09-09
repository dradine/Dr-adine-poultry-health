/* ADINE POULTRY HEALTH — BROILER FCR WEEKLY UI BRIDGE V1
   UI/integration bridge only.
   Canonical FCR math remains exclusively in broiler-fcr-engine-v11.js.
   No standards, formulas, database schema, or non-broiler calculations are changed.
*/
(function(global){'use strict';
  const VERSION='BROILER-FCR-WEEKLY-UI-V1';
  const num=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(v);return Number.isFinite(x)?x:null};
  const flock=()=>global.currentFlockForSpecialized||global.currentFlock||null;
  const isBroiler=()=>global.AdineBroilerFCR?.isBroiler?.(flock())===true || String(flock()?.production_type||flock()?.productionType||'').trim().toLowerCase()==='گوشتی';
  const performance=()=>global.AdinePerformance||null;

  function installBroilerCompatibility(){
    const f=flock(), p=performance();
    if(!f||!p||!isBroiler()) return false;
    if(typeof p.layerWeekly!=='function') p.layerWeekly=()=>null;
    if(typeof p.layerCumulative!=='function') p.layerCumulative=()=>null;
    if(typeof p.mortalityCorrectedFCR!=='function') p.mortalityCorrectedFCR=()=>null;
    return true;
  }

  function currentInputs(){
    const feed=num(document.getElementById('feedTotal')?.value);
    const live=num(document.getElementById('liveBirds')?.value);
    const weight=num(document.getElementById('averageWeightDirect')?.value);
    const week=num(document.getElementById('weekNumber')?.value);
    return {feed,live,weight,week};
  }

  function records(){
    try{if(typeof weeklyRecords!=='undefined'&&Array.isArray(weeklyRecords))return weeklyRecords}catch(e){}
    return [];
  }

  function previous(){
    const rs=records();
    const w=currentInputs().week;
    const editing=typeof editingRecordId!=='undefined'?editingRecordId:null;
    const candidates=rs.filter(r=>String(r?.id)!==String(editing||''));
    if(!candidates.length)return null;
    if(w!=null){
      const prior=candidates.filter(r=>{const rw=num(r?.week_number??r?.weekNumber??r?.week);return rw!=null&&rw<w;}).sort((a,b)=>num(a?.week_number??a?.weekNumber??a?.week)-num(b?.week_number??b?.weekNumber??b?.week));
      if(prior.length)return prior[prior.length-1];
    }
    return candidates.slice().sort((a,b)=>num(a?.age_days??a?.ageDays)-num(b?.age_days??b?.ageDays)).at(-1)||null;
  }

  function weeklyFcr(result){
    if(!installBroilerCompatibility()) return null;
    const i=currentInputs(), p=performance();
    const w=num(result?.mean)??i.weight;
    if(i.feed==null||i.feed<=0||i.live==null||i.live<=0||w==null||w<=0)return null;
    const prev=previous();
    return p.broilerWeeklyFCR({
      feedKg:i.feed,
      openBirds:prev?.live_birds??prev?.liveBirds,
      openWeight:prev?.average_weight_g??prev?.averageWeightG??prev?.average_weight,
      closeBirds:i.live,
      closeWeight:w
    });
  }

  function cumulativeFcr(result){
    if(!installBroilerCompatibility()) return null;
    const p=performance(), i=currentInputs(), f=flock();
    const w=num(result?.mean)??i.weight;
    if(!f||i.feed==null||i.feed<=0||i.live==null||i.live<=0||w==null||w<=0)return null;
    const age=num(result?.age_days??result?.ageDays);
    if(age==null)return null;
    const prior=records().filter(r=>String(r?.id)!==String(typeof editingRecordId!=='undefined'?editingRecordId||'':''));
    const current={age_days:age,feed_total_kg:i.feed,average_weight_g:w,live_birds:i.live};
    return p.broilerCumulativeFCR([...prior,current],f);
  }

  function upsertCard(id,title,value,sub){
    const root=document.getElementById('results'); if(!root)return;
    let el=document.getElementById(id);
    if(!el){el=document.createElement('div');el.id=id;el.className='metric-card';root.appendChild(el)}
    el.innerHTML='<div class="metric-label">'+title+'</div><div class="metric-value">'+value+'</div>'+(sub?'<div class="metric-label" style="margin-top:6px">'+sub+'</div>':'');
  }

  function showFcr(result){
    if(!isBroiler())return;
    const wf=weeklyFcr(result), cf=cumulativeFcr(result);
    upsertCard('adineFcrWeekly','FCR هفتگی',wf==null?'قابل محاسبه نیست':Number(wf).toFixed(3),'محاسبه مستقل همان هفته');
    upsertCard('adineFcrCumulative','FCR تجمعی',cf==null?'پس از ذخیره تکمیل می‌شود':Number(cf).toFixed(3),'محاسبه مستقل از ابتدای گله');
  }

  async function showAuthorities(){
    if(!isBroiler()||!global.AdineBroilerFCR?.analysis)return;
    const f=flock(); if(!f?.id)return;
    try{
      const a=await global.AdineBroilerFCR.analysis(f.id);
      const r=a?.latest;
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
