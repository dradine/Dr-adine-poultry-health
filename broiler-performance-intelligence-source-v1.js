/* ADINE — Broiler Performance Intelligence Source Adapter V7
   Read-only adapter.
   The intelligence layer consumes only the canonical broiler registry.
   Official breeder data wins per metric; management fallback is used only
   where the official metric/week is absent. Weekly FCR is marked management
   when either endpoint needed to derive that weekly value is a fallback.
*/
(function(global){'use strict';
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
function pick(r,keys){for(const k of keys){const v=n(r?.[k]);if(v!==null)return v}return null}
function weeklyEvaluationStandard(flock,r){
  const strain=flock?.strain??flock?.flock_strain??'';
  const age=n(r?.age??r?.age_days??r?.ageDays);
  const registry=global.BROILER_OFFICIAL_STANDARDS_V1?.strains;
  if(age===null||!registry)return null;
  const s=registry?.[strain];
  if(!s)return null;
  const ages=Array.isArray(global.BROILER_OFFICIAL_STANDARDS_V1?.weeklyAges)?global.BROILER_OFFICIAL_STANDARDS_V1.weeklyAges:[7,14,21,28,35,42,49,56];
  if(!ages.includes(age))return null;
  const find=(list,a)=>Array.isArray(list)?list.find(x=>Number(x?.[0])===a)||null:null;
  const official=find(s.records,age),management=find(s.managementRecords,age);
  const weight=n(official?.[1])??n(management?.[1]),cumFcr=n(official?.[2])??n(management?.[2]);
  const weightOfficial=n(official?.[1])!==null,fcrOfficial=n(official?.[2])!==null;
  const pos=ages.indexOf(age),prevAge=pos>0?ages[pos-1]:null;
  const prevOfficial=prevAge===null?null:find(s.records,prevAge),prevManagement=prevAge===null?null:find(s.managementRecords,prevAge);
  const prevWeight=n(prevOfficial?.[1])??n(prevManagement?.[1]),prevCumFcr=n(prevOfficial?.[2])??n(prevManagement?.[2]);
  const prevWeightOfficial=n(prevOfficial?.[1])!==null,prevFcrOfficial=n(prevOfficial?.[2])!==null;
  const initialWeight=n(s.initialWeight);
  let weeklyFcr=null;
  if(weight!==null&&cumFcr!==null){
    if(prevAge===null||prevWeight===null||prevCumFcr===null||weight<=prevWeight)weeklyFcr=cumFcr;
    else{const iw=initialWeight??0,currentCumulativeFeed=cumFcr*(weight-iw),previousCumulativeFeed=prevCumFcr*(prevWeight-iw),gain=weight-prevWeight;weeklyFcr=gain>0?(currentCumulativeFeed-previousCumulativeFeed)/gain:null;}
  }
  const weeklyFcrOfficial=fcrOfficial&&(prevAge===null||prevFcrOfficial);
  const adgOfficial=weightOfficial&&(prevAge===null||prevWeightOfficial);
  const weeklySourceType=weeklyFcrOfficial?'official-performance-objective':'management-standard';
  const sourceLabel=weeklyFcrOfficial?'استاندارد رسمی breeder — منحنی مرجع کاننیکال':'استاندارد مدیریتی کاننیکال — حداقل یکی از نقاط لازم برای این شاخص رسمی نیست';
  return {weight,cumulativeFcr:cumFcr,weeklyFcr:weeklyFcr===null?null:Number(weeklyFcr.toFixed(3)),weeklyWeightGain:prevWeight!==null&&weight!==null?weight-prevWeight:null,cv:10,uniformity10:80,uniformity15:90,sourceType:weeklySourceType,sourceLabel,weightOfficial,fcrOfficial,weeklyFcrOfficial,adgOfficial,weightSourceType:weightOfficial?'official-performance-objective':'management-standard',fcrSourceType:fcrOfficial?'official-performance-objective':'management-standard',adgSourceType:adgOfficial?'official-performance-objective':'management-standard',managementFallbackUsed:!weightOfficial||!fcrOfficial||!weeklyFcrOfficial||!adgOfficial};
}
function resolveWeeklyOfficial(flock,r){
  const weekly=weeklyEvaluationStandard(flock,r);
  if(weekly)return weekly;
  if(typeof global.resolvePoultryStandard!=='function')return null;
  try{
    const type=flock?.production_type??flock?.productionType??'broiler',genetics=flock?.genetics??flock?.genetic??flock?.breed??'',strain=flock?.strain??flock?.flock_strain??'',age=n(r?.age??r?.age_days??r?.ageDays);
    if(age===null)return null;
    const x=global.resolvePoultryStandard({productionType:type,breed:genetics,genetics,strain,ageDays:age});
    if(!x)return null;
    return {weight:n(x.weight),fcr:n(x.fcr),weightSource:x.weightSource??null,weightSourceLabel:x.weightSourceLabel??null,fcrSource:x.fcrSource??null,fcrSourceLabel:x.fcrSourceLabel??null,confidence:x.confidence??null};
  }catch(e){console.warn('ADINE PI canonical standard resolver unavailable:',e);return null}
}
function enrich(flock,rows){
  return (Array.isArray(rows)?rows:[]).map(r=>{
    const raw=r.raw||r,pm=raw.production_metrics||{},livability=n(r.livability??raw.livability??pm.livability_cumulative_percent),epef=n(r.epef??r.EPEF??r.pef??raw.epef??pm.epef??pm.pef),resolved=resolveWeeklyOfficial(flock,r),weekly=weeklyEvaluationStandard(flock,r);
    const canonicalTargets=Object.freeze({weight:weekly?.weight??resolved?.weight??pick(r,['standardWeight','standard_weight']),fcr:weekly?.weeklyFcr??pick(r,['standardWeeklyFcr','officialWeeklyFcr','official_weekly_fcr'])??resolved?.fcr,cumulativeFcr:weekly?.cumulativeFcr??pick(r,['standardCumulativeFcr','officialCumulativeFcr','official_cumulative_fcr']),adg:weekly?.weeklyWeightGain??pick(r,['standardWeeklyWeightGain','officialWeeklyWeightGain','standard_weekly_weight_gain']),mortality:pick(r,['standardMortalityPercent','standard_mortality','officialMortalityPercent']),cv:weekly?.cv??pick(r,['cvStandard','standardCv','standard_cv','officialCv']),u10:weekly?.uniformity10??pick(r,['uniformity10Standard','standardUniformity10','standard_uniformity_10','officialUniformity10']),u15:weekly?.uniformity15??pick(r,['uniformity15Standard','standardUniformity15','standard_uniformity_15','officialUniformity15']),feed:pick(r,['standardFeedPerBirdDay','standard_feed_per_bird_day','standardFeed','standard_feed']),water:pick(r,['standardWaterPerBirdDay','standard_water_per_bird_day','standardWater','standard_water']),wfr:pick(r,['standardWaterFeedRatio','standard_water_feed_ratio','officialWaterFeedRatio'])});
    return Object.freeze({...r,weeklyWeightGain:r.weeklyWeightGain??n(pm.weekly_gain_g),livability,epef,epef_source:epef===null?'not_available_from_canonical_model':'canonical_weekly_or_comprehensive_record',canonicalTargets,targetAuthority:'canonical-weekly-report',targetResolver:'broiler-canonical-registry-v2',targetResolverVersion:'BROILER-CANONICAL-STANDARDS-V2',targetRecordId:r.targetRecordId??r.id??null,targetSourceLabel:weekly?.sourceLabel||resolved?.weightSourceLabel||r.weightSourceLabel||r.standardWeightSourceLabel||'ارزیابی هفتگی / canonical',targetSourceType:weekly?.sourceType||null,weightTargetSourceType:weekly?.weightSourceType||null,fcrTargetSourceType:weekly?.fcrSourceType||null,adgTargetSourceType:weekly?.adgSourceType||null,managementFallbackUsed:Boolean(weekly?.managementFallbackUsed)});
  });
}
global.AdineBroilerPerformanceIntelligenceSourceV1=Object.freeze({version:'BROILER-PI-SOURCE-V7',enrich,weeklyEvaluationStandard});
})(typeof window!=='undefined'?window:globalThis);
