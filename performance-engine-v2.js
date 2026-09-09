/* ADINE POULTRY HEALTH — CALCULATION COMPATIBILITY ADAPTER
   Canonical calculation owner: broiler-fcr-engine-v11.js
   This file contains NO independent calculation formulas.
   It only preserves legacy weekly-page function names during migration.
*/
(function(global){'use strict';
  const engine=global.AdineBroilerFCR;
  if(!engine) throw new Error('Canonical Broiler FCR Engine must load before performance-engine-v2.js');
  const num=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
  const rows=a=>(Array.isArray(a)?a:[]).filter(Boolean).slice().sort((a,b)=>(num(a?.age_days??a?.ageDays)??0)-(num(b?.age_days??b?.ageDays)??0));
  const typeOf=f=>{const t=String(f?.production_type??f?.productionType??'').trim().toLowerCase();if(['broiler','broilers','گوشتی','meat'].includes(t))return 'broiler';if(['layer','تخمگذار','تخم‌گذار'].includes(t))return 'layer';if(['breeder','مادر','مرغ مادر'].includes(t))return 'breeder';return t};
  const flockFor=()=>global.currentFlock||global.currentFlockForSpecialized||{};
  const canonicalRows=(records,flock)=>engine.canonical(rows(records),flock||flockFor());
  function weeklyFCR(input){
    const p=input||{};
    const flock=flockFor();
    const prev={
      live_birds:num(p.openBirds??p.open_birds??flock.initial_bird_count??flock.initialBirdCount),
      average_weight_g:num(p.openWeight??p.open_weight_g??flock.initial_average_weight_g??flock.initialAverageWeightG),
      age_days:num(p.openAgeDays??p.open_age_days)??0
    };
    const curr={
      live_birds:num(p.closeBirds??p.close_birds),
      average_weight_g:num(p.closeWeight??p.close_weight_g),
      feed_total_kg:num(p.feedKg??p.feed_total_kg??p.feedTotalKg),
      age_days:num(p.closeAgeDays??p.close_age_days)??1
    };
    if(prev.live_birds===null||prev.live_birds<=0||prev.average_weight_g===null||prev.average_weight_g<=0||curr.live_birds===null||curr.live_birds<=0||curr.average_weight_g===null||curr.average_weight_g<=0||curr.feed_total_kg===null||curr.feed_total_kg<=0)return null;
    const out=canonicalRows([prev,curr],flock);
    return out.length?out[out.length-1].weeklyFcr:null;
  }
  function cumulativeFCR(records,current,flock){
    const all=[...(Array.isArray(records)?records:[])];
    if(current)all.push(current);
    const out=canonicalRows(all,flock||flockFor());
    return out.length?out[out.length-1].cumulativeFcr:null;
  }
  global.AdinePerformance={version:'CANONICAL-ADAPTER-5',typeOf,rows,canonicalRows,broilerWeeklyFCR:weeklyFCR,broilerCumulativeFCR:(records,flock)=>cumulativeFCR(records,null,flock),latestWeekly:(records,flock)=>{const out=canonicalRows(records,flock);return out.length?out[out.length-1].weeklyFcr:null},latestCumulative:(records,flock)=>{const out=canonicalRows(records,flock);return out.length?out[out.length-1].cumulativeFcr:null},quality:x=>({ok:true,issues:[]})};
  global.calculateWeeklyFCR=function(flockId,currentWeight,currentFeed,currentLiveBirds,previousRecord,productionType){if(typeOf({production_type:productionType})!=='broiler')return null;return weeklyFCR({feedKg:currentFeed,openBirds:previousRecord?.live_birds??previousRecord?.liveBirds,openWeight:previousRecord?.average_weight_g??previousRecord?.averageWeightG??previousRecord?.averageWeight,closeBirds:currentLiveBirds,closeWeight:currentWeight,openAgeDays:previousRecord?.age_days??previousRecord?.ageDays,closeAgeDays:currentWeight?.age_days??currentWeight?.ageDays});};
  global.calculateWeeklyCumulativeConversion=function(records,current,type){if(typeOf({production_type:type})!=='broiler')return null;return cumulativeFCR(records,current,flockFor());};
  /* Load the UI bridge only after the page DOM is ready, so weekly.js has
     already defined calculateWeekly/renderResults and the bridge can attach
     to the real runtime functions. */
  function loadBridge(){
    if(typeof document==='undefined'||document.querySelector('script[data-adine-broiler-fcr-weekly-ui="1"]'))return;
    const s=document.createElement('script');
    s.src='broiler-fcr-weekly-ui-v1.js?v=1.6.0';
    s.async=false;
    s.dataset.adineBroilerFcrWeeklyUi='1';
    (document.head||document.documentElement).appendChild(s);
  }
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadBridge,{once:true});
    else loadBridge();
  }
})(typeof window!=='undefined'?window:globalThis);