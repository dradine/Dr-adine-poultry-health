/* ADINE POULTRY HEALTH — BROILER FCR WEEKLY UI BRIDGE V1.5
   UI/integration bridge only.
   Canonical FCR math remains exclusively in broiler-fcr-engine-v11.js.
*/
(function(global){'use strict';
  const VERSION='BROILER-FCR-WEEKLY-UI-V1.5';
  const num=v=>{if(v===null||v===undefined||v==='')return null;let s=String(v).trim().replace(/,/g,'').replace(/٬/g,'').replace(/٫/g,'.').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));const x=Number(s);return Number.isFinite(x)?x:null};
  const firstNumber=(...vs)=>{for(const v of vs){const x=num(v);if(x!==null)return x}return null};
  const flock=()=>global.currentFlockForSpecialized||global.currentFlock||null;
  const engine=()=>global.AdineBroilerFCR||null;
  const isBroiler=()=>engine()?.isBroiler?.(flock())===true||['broiler','broilers','گوشتی','meat'].includes(String(flock()?.production_type||flock()?.productionType||'').trim().toLowerCase());
  const performance=()=>global.AdinePerformance||null;

  function installBroilerCompatibility(){
    const f=flock(),p=performance();if(!f||!p||!isBroiler())return false;
    if(typeof p.layerWeekly!=='function')p.layerWeekly=()=>null;
    if(typeof p.layerCumulative!=='function')p.layerCumulative=()=>null;
    if(typeof p.mortalityCorrectedFCR!=='function')p.mortalityCorrectedFCR=()=>null;
    return true;
  }
  function meanFromWeightInputs(){const values=Array.from(document.querySelectorAll('.bird-weight')).map(x=>num(x?.value)).filter(x=>x!==null&&x>0);return values.length?values.reduce((a,b)=>a+b,0)/values.length:null}
  function currentInputs(result){
    const live=firstNumber(result?.live_birds,result?.liveBirds,document.getElementById('liveBirds')?.value);
    let feed=firstNumber(result?.feed_total_kg,result?.feedTotalKg,result?.feedKg,document.getElementById('feedTotal')?.value);
    if(feed==null){const perBird=firstNumber(result?.feedPerBirdG,result?.feedPerBird,document.getElementById('feedPerBird')?.value);if(perBird!=null&&live!=null&&live>0)feed=perBird*live/1000}
    const weight=firstNumber(result?.mean,result?.average_weight_g,result?.averageWeightG,meanFromWeightInputs(),document.getElementById('averageWeightDirect')?.value);
    const week=firstNumber(result?.week_number,result?.weekNumber,result?.week,document.getElementById('weekNumber')?.value);
    const age=firstNumber(result?.age_days,result?.ageDays);
    return{feed,live,weight,week,age};
  }
  function records(){try{if(typeof weeklyRecords!=='undefined'&&Array.isArray(weeklyRecords))return weeklyRecords}catch(e){}return[]}
  function previous(result){
    const rs=records(),i=currentInputs(result),w=i.week;
    const editing=typeof editingRecordId!=='undefined'?editingRecordId:null;
    const candidates=rs.filter(r=>String(r?.id)!==String(editing||''));
    if(!candidates.length)return null;
    if(w!=null){const prior=candidates.filter(r=>{const rw=firstNumber(r?.week_number,r?.weekNumber,r?.week);return rw!=null&&rw<w}).sort((a,b)=>firstNumber(a?.week_number,a?.weekNumber,a?.week)-firstNumber(b?.week_number,b?.weekNumber,b?.week));if(prior.length)return prior[prior.length-1]}
    return candidates.slice().sort((a,b)=>(firstNumber(a?.age_days,a?.ageDays)??-1)-(firstNumber(b?.age_days,b?.ageDays)??-1)).at(-1)||null;
  }

  function canonicalWeekly(i,prev,f){
    const e=engine();if(!e?.canonical)return null;
    const openBirds=firstNumber(prev?.live_birds,prev?.liveBirds,f?.initial_bird_count,f?.initialBirdCount);
    const openWeight=firstNumber(prev?.average_weight_g,prev?.averageWeightG,prev?.averageWeight,f?.initial_average_weight_g,f?.initialAverageWeightG);
    if(i.feed==null||i.feed<=0||i.live==null||i.live<=0||i.weight==null||i.weight<=0||openBirds==null||openBirds<=0||openWeight==null||openWeight<=0)return null;
    const openAge=firstNumber(prev?.age_days,prev?.ageDays,f?.start_age_days,f?.startAgeDays)??0;
    const closeAge=firstNumber(i.age,i.week!=null?i.week*7:null)??(openAge+1);
    const rows=[
      {age_days:openAge,live_birds:openBirds,average_weight_g:openWeight,feed_total_kg:0},
      {age_days:Math.max(closeAge,openAge+1),live_birds:i.live,average_weight_g:i.weight,feed_total_kg:i.feed}
    ];
    const out=e.canonical(rows,f);
    return out.length?out[out.length-1].weeklyFcr:null;
  }

  function weeklyFcr(result){
    if(!isBroiler())return null;
    const i=currentInputs(result),f=flock(),prev=previous(result);
    if(i.feed==null||i.feed<=0||i.live==null||i.live<=0||i.weight==null||i.weight<=0)return null;
    let value=canonicalWeekly(i,prev,f);
    if(value==null){
      const p=performance();
      if(p?.broilerWeeklyFCR){try{value=p.broilerWeeklyFCR({feedKg:i.feed,openBirds:firstNumber(prev?.live_birds,prev?.liveBirds,f?.initial_bird_count,f?.initialBirdCount),openWeight:firstNumber(prev?.average_weight_g,prev?.averageWeightG,prev?.averageWeight,f?.initial_average_weight_g,f?.initialAverageWeightG),closeBirds:i.live,closeWeight:i.weight,closeAgeDays:i.age})}catch(e){}}
    }
    return value;
  }

  function cumulativeFcr(result){
    if(!isBroiler())return null;
    const e=engine(),f=flock(),i=currentInputs(result);if(!e?.canonical||!f||i.feed==null||i.feed<=0||i.live==null||i.live<=0||i.weight==null||i.weight<=0)return null;
    const age=firstNumber(i.age,i.week!=null?i.week*7:null);if(age==null)return null;
    const editing=typeof editingRecordId!=='undefined'?editingRecordId||'':'';
    const prior=records().filter(r=>String(r?.id)!==String(editing));
    const current={age_days:age,feed_total_kg:i.feed,average_weight_g:i.weight,live_birds:i.live};
    const out=e.canonical([...prior,current],f);return out.length?out[out.length-1].cumulativeFcr:null;
  }

  function upsertCard(id,title,value,sub){const root=document.getElementById('results');if(!root)return;let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.className='metric-card';root.appendChild(el)}el.innerHTML='<div class="metric-label">'+title+'</div><div class="metric-value">'+value+'</div>'+(sub?'<div class="metric-label" style="margin-top:6px">'+sub+'</div>':'')}
  function showFcr(result){if(!isBroiler())return;const root=document.getElementById('results');if(!root||root.__adineFcrUpdating)return;root.__adineFcrUpdating=true;try{const wf=weeklyFcr(result),cf=cumulativeFcr(result);upsertCard('adineFcrWeekly','FCR هفتگی',wf==null?'قابل محاسبه نیست':Number(wf).toFixed(3),'موتور canonical گوشتی');upsertCard('adineFcrCumulative','FCR تجمعی',cf==null?'پس از ذخیره تکمیل می‌شود':Number(cf).toFixed(3),'موتور canonical از ابتدای گله')}finally{root.__adineFcrUpdating=false}}
  async function showAuthorities(){if(!isBroiler()||!engine()?.analysis)return;const f=flock();if(!f?.id)return;try{const a=await engine().analysis(f.id),r=a?.latest;if(!r)return;const fmt=v=>num(v)==null?'—':Number(v).toFixed(3);upsertCard('adineFcrWeekly','FCR هفتگی',fmt(r.weeklyFcr),'مقدار canonical ذخیره‌شده');upsertCard('adineFcrCumulative','FCR تجمعی',fmt(r.cumulativeFcr),'مقدار canonical ذخیره‌شده');upsertCard('adineFcrWeeklyAuthority','اختیار مدیریتی هفتگی',fmt(r.managementWeekly),r.management_cohort?('کوهورت: '+r.management_cohort):'');upsertCard('adineFcrCumulativeAuthority','اختیار مدیریتی تجمعی',fmt(r.managementCumulative),r.management_flocks!=null?('تعداد گله مرجع: '+r.management_flocks):'');upsertCard('adineFcrWeeklyOfficial','استاندارد رسمی هفتگی',fmt(r.officialWeekly),r.official_source||'');upsertCard('adineFcrCumulativeOfficial','استاندارد رسمی تجمعی',fmt(r.officialCumulative),r.official_source||'')}catch(e){console.warn('Broiler FCR authority display:',e)}}
  function patchCalculateWeekly(){if(typeof global.calculateWeekly!=='function'||global.calculateWeekly.__adineBroilerFcrV15)return false;const original=global.calculateWeekly;function wrapped(){const out=original.apply(this,arguments);[0,100,500].forEach(ms=>setTimeout(()=>{try{showFcr(out)}catch(e){}},ms));return out}wrapped.__adineBroilerFcrV15=true;global.calculateWeekly=wrapped;return true}
  function observeResults(){if(global.__adineBroilerFcrResultsObserver||typeof MutationObserver==='undefined')return;const root=document.getElementById('results');if(!root)return;let scheduled=false;new MutationObserver(()=>{if(scheduled||root.__adineFcrUpdating)return;scheduled=true;setTimeout(()=>{scheduled=false;try{if(isBroiler()&&root.children.length)showFcr(null)}catch(e){}},60)}).observe(root,{childList:true});global.__adineBroilerFcrResultsObserver=true}
  function patchCalculateButton(){if(!document.documentElement)return false;if(document.documentElement.dataset.adineBroilerFcrCalculateHook==='5')return true;document.documentElement.dataset.adineBroilerFcrCalculateHook='5';document.addEventListener('click',event=>{const el=event.target?.closest?.('button,a,input[type="button"],input[type="submit"]');if(!el)return;const inline=String(el.getAttribute?.('onclick')||''),text=String(el.textContent||'').trim();if(!/calculateWeekly\s*\(|محاسبه پایش|محاسبه/.test(inline+' '+text))return;[0,50,150,400,800].forEach(ms=>setTimeout(()=>{try{if(isBroiler())showFcr(null)}catch(e){}},ms))},true);return true}
  function patchSave(){if(typeof global.saveWeeklyRecord!=='function'||global.saveWeeklyRecord.__adineBroilerFcrV15)return false;const original=global.saveWeeklyRecord;async function wrapped(){const out=await original.apply(this,arguments);await showAuthorities();return out}wrapped.__adineBroilerFcrV15=true;global.saveWeeklyRecord=wrapped;return true}
  function start(){let i=0;const timer=setInterval(()=>{installBroilerCompatibility();patchCalculateWeekly();patchCalculateButton();patchSave();observeResults();if(++i>240)clearInterval(timer)},250);installBroilerCompatibility();patchCalculateWeekly();patchCalculateButton();patchSave();observeResults()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  global.AdineBroilerFcrWeeklyUI={VERSION,showFcr,weeklyFcr,cumulativeFcr};
})(typeof window!=='undefined'?window:globalThis);
