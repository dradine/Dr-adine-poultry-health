/* ADINE — Broiler Performance Intelligence Source Adapter V5
   Read-only adapter.
   The intelligence layer MUST consume the same target definitions used by
   the weekly evaluation. No independent FCR target registry is allowed.
   No Supabase access or writes.
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
  if(!s||!Array.isArray(s.records))return null;
  const i=s.records.findIndex(x=>Number(x[0])===age);
  if(i<0)return null;
  const x=s.records[i],prev=i>0?s.records[i-1]:null;
  const weight=n(x[1]),cumFcr=n(x[2]);
  const prevWeight=prev?n(prev[1]):null,prevCumFcr=prev?n(prev[2]):null;
  const weeklyFcr=weight!==null&&cumFcr!==null&&(!prev||prevWeight===null||prevCumFcr===null)
    ?cumFcr
    :(weight!==null&&cumFcr!==null&&prevWeight!==null&&prevCumFcr!==null&&weight>prevWeight
      ?(cumFcr*weight-prevCumFcr*prevWeight)/(weight-prevWeight):null);
  return {weight,cumulativeFcr:cumFcr,weeklyFcr:weeklyFcr===null?null:Number(weeklyFcr.toFixed(3)),weeklyWeightGain:prevWeight!==null&&weight!==null?weight-prevWeight:null,cv:10,uniformity10:80,uniformity15:90,sourceLabel:'استاندارد ارزیابی هفتگی — همان مرجع نمایش‌داده‌شده در گزارش هفتگی'};
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
  }catch(e){console.warn('ADINE PI weekly standard resolver unavailable:',e);return null}
}
function enrich(flock,rows){
  return (Array.isArray(rows)?rows:[]).map(r=>{
    const raw=r.raw||r,pm=raw.production_metrics||{},livability=n(r.livability??raw.livability??pm.livability_cumulative_percent),epef=n(r.epef??r.EPEF??r.pef??raw.epef??pm.epef??pm.pef),resolved=resolveWeeklyOfficial(flock,r),weekly=weeklyEvaluationStandard(flock,r);
    const canonicalTargets=Object.freeze({
      weight:weekly?.weight??resolved?.weight??pick(r,['standardWeight','standard_weight']),
      fcr:weekly?.weeklyFcr??pick(r,['standardWeeklyFcr','officialWeeklyFcr','official_weekly_fcr'])??resolved?.fcr,
      cumulativeFcr:weekly?.cumulativeFcr??pick(r,['standardCumulativeFcr','officialCumulativeFcr','official_cumulative_fcr']),
      adg:weekly?.weeklyWeightGain??pick(r,['standardWeeklyWeightGain','officialWeeklyWeightGain','standard_weekly_weight_gain']),
      mortality:pick(r,['standardMortalityPercent','standard_mortality','officialMortalityPercent']),
      cv:weekly?.cv??pick(r,['cvStandard','standardCv','standard_cv','officialCv']),
      u10:weekly?.uniformity10??pick(r,['uniformity10Standard','standardUniformity10','standard_uniformity_10','officialUniformity10']),
      u15:weekly?.uniformity15??pick(r,['uniformity15Standard','standardUniformity15','standard_uniformity_15','officialUniformity15']),
      feed:pick(r,['standardFeedPerBirdDay','standard_feed_per_bird_day','standardFeed','standard_feed']),
      water:pick(r,['standardWaterPerBirdDay','standard_water_per_bird_day','standardWater','standard_water']),
      wfr:pick(r,['standardWaterFeedRatio','standard_water_feed_ratio','officialWaterFeedRatio'])
    });
    return Object.freeze({...r,weeklyWeightGain:r.weeklyWeightGain??n(pm.weekly_gain_g),livability,epef,epef_source:epef===null?'not_available_from_canonical_model':'canonical_weekly_or_comprehensive_record',canonicalTargets,targetAuthority:'canonical-weekly-report',targetResolver:'weekly-evaluation-standard',targetResolverVersion:'WEEKLY-EVALUATION-TARGETS-V1',targetRecordId:r.targetRecordId??r.id??null,targetSourceLabel:weekly?.sourceLabel||resolved?.weightSourceLabel||r.weightSourceLabel||r.standardWeightSourceLabel||'ارزیابی هفتگی / canonical'});
  });
}
global.AdineBroilerPerformanceIntelligenceSourceV1=Object.freeze({version:'BROILER-PI-SOURCE-V5',enrich});
})(typeof window!=='undefined'?window:globalThis);