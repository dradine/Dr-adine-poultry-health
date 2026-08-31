/* ADINE POULTRY HEALTH — CALCULATION COMPATIBILITY ADAPTER
   Canonical calculation owner: broiler-fcr-engine-v11.js
   No independent FCR formulas live here.
*/
(function(global){'use strict';
  const engine=global.AdineBroilerFCR;
  if(!engine) throw new Error('Canonical Broiler FCR Engine must load before performance-engine-v2.js');
  const num=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
  const rows=a=>(Array.isArray(a)?a:[]).filter(Boolean).slice().sort((a,b)=>(num(a.age_days??a.ageDays)??0)-(num(b.age_days??b.ageDays)??0));
  const typeOf=f=>String(f?.production_type??f?.productionType??'').trim().toLowerCase()==='گوشتی'?'broiler':String(f?.production_type??f?.productionType??'').trim().toLowerCase();
  const canonicalRows=(records,flock)=>engine.canonical(records,flock);
  const latestWeekly=(records,flock)=>{const out=canonicalRows(records,flock);return out.length?out[out.length-1].weeklyFcr:null};
  const latestCumulative=(records,flock)=>{const out=canonicalRows(records,flock);return out.length?out[out.length-1].cumulativeFcr:null};
  global.AdinePerformance={version:'CANONICAL-ADAPTER-3',typeOf,rows,canonicalRows,latestWeekly,latestCumulative,quality:x=>({ok:true,issues:[]})};
  global.calculateWeeklyFCR=function(flockId,currentWeight,currentFeed,currentLiveBirds,previousRecord,productionType){
    if(typeOf({production_type:productionType})!=='broiler'||!previousRecord)return null;
    const flock=global.currentFlock||global.currentFlockForSpecialized||{};
    const prevAge=num(previousRecord.age_days??previousRecord.ageDays);
    const current={average_weight_g:currentWeight,feed_total_kg:currentFeed,live_birds:currentLiveBirds,age_days:prevAge!=null?prevAge+7:null};
    return latestWeekly([previousRecord,current],flock);
  };
  global.calculateWeeklyCumulativeConversion=function(records,current,type){
    if(typeOf({production_type:type})!=='broiler')return null;
    const flock=global.currentFlockForSpecialized||global.currentFlock||{};
    const all=[...(Array.isArray(records)?records:[]).filter(x=>String(x.id)!==String(current?.id)),current].filter(Boolean);
    return latestCumulative(all,flock);
  };
})(typeof window!=='undefined'?window:globalThis);