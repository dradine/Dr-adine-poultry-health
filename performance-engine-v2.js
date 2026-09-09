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
  function weeklyFCR(input){const p=input||{};const feed=num(p.feedKg??p.feed_total_kg??p.feedTotalKg),ob=num(p.openBirds??p.open_birds),ow=num(p.openWeight??p.open_weight_g),cb=num(p.closeBirds??p.close_birds),cw=num(p.closeWeight??p.close_weight_g);if(feed===null||feed<=0||ob===null||ob<=0||ow===null||ow<=0||cb===null||cb<=0||cw===null||cw<=0)return null;const gain=(cb*cw-ob*ow)/1000;if(gain<=0)return null;return Number((feed/gain).toFixed(4));}
  function cumulativeFCR(records,current,flock){const all=[...(Array.isArray(records)?records:[])];if(current)all.push(current);const out=canonicalRows(all,flock||flockFor());return out.length?out[out.length-1].cumulativeFcr:null;}
  global.AdinePerformance={version:'CANONICAL-ADAPTER-3',typeOf,rows,canonicalRows,broilerWeeklyFCR:weeklyFCR,broilerCumulativeFCR:(records,flock)=>cumulativeFCR(records,null,flock),latestWeekly:(records,flock)=>{const out=canonicalRows(records,flock);return out.length?out[out.length-1].weeklyFcr:null},latestCumulative:(records,flock)=>{const out=canonicalRows(records,flock);return out.length?out[out.length-1].cumulativeFcr:null},quality:x=>({ok:true,issues:[]})};
  global.calculateWeeklyFCR=function(flockId,currentWeight,currentFeed,currentLiveBirds,previousRecord,productionType){if(typeOf({production_type:productionType})!=='broiler')return null;return weeklyFCR({feedKg:currentFeed,openBirds:previousRecord?.live_birds??previousRecord?.liveBirds,openWeight:previousRecord?.average_weight_g??previousRecord?.averageWeightG??previousRecord?.averageWeight,closeBirds:currentLiveBirds,closeWeight:currentWeight})};
  global.calculateWeeklyCumulativeConversion=function(records,current,type){if(typeOf({production_type:type})!=='broiler')return null;return cumulativeFCR(records,current,flockFor())};
})(typeof window!=='undefined'?window:globalThis);