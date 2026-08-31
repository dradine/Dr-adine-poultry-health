/* ADINE POULTRY HEALTH — CALCULATION COMPATIBILITY ADAPTER
   Canonical calculation owner: broiler-fcr-engine-v11.js
   This file contains NO independent calculation formulas.
   It only preserves legacy weekly-page function names during migration.
*/
(function(global){'use strict';
  const engine=global.AdineBroilerFCR;
  if(!engine) throw new Error('Canonical Broiler FCR Engine must load before performance-engine-v2.js');
  const rows=a=>(Array.isArray(a)?a:[]).filter(Boolean).slice().sort((a,b)=>(Number(a.age_days??a.ageDays)??0)-(Number(b.age_days??b.ageDays)??0));
  const typeOf=f=>String(f?.production_type??f?.productionType??'').trim().toLowerCase()==='گوشتی'?'broiler':String(f?.production_type??f?.productionType??'').trim().toLowerCase();
  const canonicalRows=(records,flock)=>engine.canonical(records,flock);
  const latestWeekly=(records,flock)=>{const out=canonicalRows(records,flock);return out.length?out[out.length-1].weeklyFcr:null};
  const latestCumulative=(records,flock)=>{const out=canonicalRows(records,flock);return out.length?out[out.length-1].cumulativeFcr:null};
  global.AdinePerformance={version:'CANONICAL-ADAPTER-2',typeOf,rows,canonicalRows,latestWeekly,latestCumulative,quality:x=>({ok:true,issues:[]})};
  global.calculateWeeklyFCR=function(flockId,currentWeight,currentFeed,currentLiveBirds,previousRecord,productionType){
    if(typeOf({production_type:productionType})!=='broiler') return null;
    const flock=global.currentFlock||global.currentFlockForSpecialized||{};
    const current={average_weight_g:currentWeight,feed_total_kg:currentFeed,live_birds:currentLiveBirds,age_days:currentWeight?.age_days??undefined};
    const previous=previousRecord||null;
    return previous?latestWeekly([previous,current],flock):null;
  };
  global.calculateWeeklyCumulativeConversion=function(records,current,type){
    if(typeOf({production_type:type})!=='broiler') return null;
    const flock=global.currentFlockForSpecialized||global.currentFlock||{};
    const all=[...(Array.isArray(records)?records:[]).filter(x=>String(x.id)!==String(current?.id)),current].filter(Boolean);
    return latestCumulative(all,flock);
  };
})(typeof window!=='undefined'?window:globalThis);