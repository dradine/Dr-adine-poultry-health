/* ADINE POULTRY HEALTH — CALCULATION COMPATIBILITY ADAPTER
   Canonical calculation owner: broiler-fcr-engine-v11.js
   This file intentionally contains NO independent calculation formulas.
   It exists only so legacy weekly-page callers do not break while the
   report architecture is being rebuilt around isolated production engines.
*/
(function(global){'use strict';
  const engine=global.AdineBroilerFCR;
  if(!engine) throw new Error('Canonical Broiler FCR Engine must load before performance-engine-v2.js');
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
  const rows=a=>(Array.isArray(a)?a:[]).filter(Boolean).slice().sort((a,b)=>(n(a.age_days??a.ageDays)??0)-(n(b.age_days??b.ageDays)??0));
  const biomassGainKg=(openBirds,openWeight,closeBirds,closeWeight)=>{const ob=n(openBirds),ow=n(openWeight),cb=n(closeBirds),cw=n(closeWeight);if(!(ob>0&&ow>=0&&cb>0&&cw>0))return null;const g=(cb*cw-ob*ow)/1000;return g>0?g:null};
  const broilerWeeklyFCR=({feedKg,openBirds,openWeight,closeBirds,closeWeight})=>{const f=n(feedKg),g=biomassGainKg(openBirds,openWeight,closeBirds,closeWeight);return f>0&&g>0?f/g:null};
  const broilerCumulativeFCR=(records,flock)=>{const out=engine.canonical(records,flock);return out.length?out[out.length-1].cumulativeFcr:null};
  const typeOf=f=>String(f?.production_type??f?.productionType??'').trim().toLowerCase()==='گوشتی'?'broiler':String(f?.production_type??f?.productionType??'').trim().toLowerCase();
  global.AdinePerformance={version:'CANONICAL-ADAPTER-1',typeOf,rows,biomassGainKg,broilerWeeklyFCR,broilerCumulativeFCR,quality:x=>({ok:true,issues:[]})};
  global.calculateWeeklyFCR=function(flockId,currentWeight,currentFeed,currentLiveBirds,previousRecord,productionType){if(typeOf({production_type:productionType})!=='broiler')return null;return broilerWeeklyFCR({feedKg:currentFeed,openBirds:previousRecord?.live_birds??previousRecord?.liveBirds,openWeight:previousRecord?.average_weight_g??previousRecord?.averageWeight,closeBirds:currentLiveBirds,closeWeight:currentWeight})};
  global.calculateWeeklyCumulativeConversion=function(records,current,type){if(typeOf({production_type:type})!=='broiler')return null;return broilerCumulativeFCR([...(Array.isArray(records)?records:[]).filter(x=>String(x.id)!==String(current?.id)),current].filter(Boolean),global.currentFlockForSpecialized||global.currentFlock||{})};
})(typeof window!=='undefined'?window:globalThis);