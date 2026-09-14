/* ADINE — Broiler Performance Intelligence Source Adapter V4
   Read-only adapter.
   The intelligence layer uses the SAME standards resolver used by weekly
   evaluation for age/strain-sensitive official targets, while preserving
   canonical weekly-record values for metrics such as FCR and quality targets.
   No external standards lookup, target calculation, KPI calculation or writes.
*/
(function(global){'use strict';
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
function pick(r,keys){for(const k of keys){const v=n(r?.[k]);if(v!==null)return v}return null}
function resolveWeeklyOfficial(flock,r){
  if(typeof global.resolvePoultryStandard!=='function')return null;
  try{
    const type=flock?.production_type??flock?.productionType??'broiler';
    const genetics=flock?.genetics??flock?.genetic??flock?.breed??'';
    const strain=flock?.strain??flock?.flock_strain??'';
    const age=n(r?.age??r?.age_days??r?.ageDays);
    if(age===null)return null;
    const x=global.resolvePoultryStandard({productionType:type,breed:genetics,genetics,strain,ageDays:age});
    if(!x)return null;
    return {weight:n(x.weight),fcr:n(x.fcr),weightSource:x.weightSource??null,weightSourceLabel:x.weightSourceLabel??null,fcrSource:x.fcrSource??null,fcrSourceLabel:x.fcrSourceLabel??null,confidence:x.confidence??null};
  }catch(e){console.warn('ADINE PI canonical weekly resolver unavailable:',e);return null}
}
function enrich(flock,rows){
  return (Array.isArray(rows)?rows:[]).map(r=>{
    const raw=r.raw||r;
    const pm=raw.production_metrics||{};
    const livability=n(r.livability??raw.livability??pm.livability_cumulative_percent);
    const epef=n(r.epef??r.EPEF??r.pef??raw.epef??pm.epef??pm.pef);
    const resolved=resolveWeeklyOfficial(flock,r);
    const canonicalTargets=Object.freeze({
      weight:resolved?.weight??pick(r,['standardWeight','standard_weight']),
      fcr:pick(r,['standardWeeklyFcr','officialWeeklyFcr','official_weekly_fcr'])??resolved?.fcr,
      cumulativeFcr:pick(r,['standardCumulativeFcr','officialCumulativeFcr','official_cumulative_fcr']),
      adg:pick(r,['standardWeeklyWeightGain','officialWeeklyWeightGain','standard_weekly_weight_gain']),
      mortality:pick(r,['standardMortalityPercent','standard_mortality','officialMortalityPercent']),
      cv:pick(r,['cvStandard','standardCv','standard_cv','officialCv']),
      u10:pick(r,['uniformity10Standard','standardUniformity10','standard_uniformity_10','officialUniformity10']),
      u15:pick(r,['uniformity15Standard','standardUniformity15','standard_uniformity_15','officialUniformity15']),
      feed:pick(r,['standardFeedPerBirdDay','standard_feed_per_bird_day','standardFeed','standard_feed']),
      water:pick(r,['standardWaterPerBirdDay','standard_water_per_bird_day','standardWater','standard_water']),
      wfr:pick(r,['standardWaterFeedRatio','standard_water_feed_ratio','officialWaterFeedRatio'])
    });
    return Object.freeze({
      ...r,
      weeklyWeightGain:r.weeklyWeightGain??n(pm.weekly_gain_g),
      livability,
      epef,
      epef_source:epef===null?'not_available_from_canonical_model':'canonical_weekly_or_comprehensive_record',
      canonicalTargets,
      targetAuthority:'canonical-weekly-report',
      targetResolver:'weekly-evaluation-resolver',
      targetResolverVersion:global.ADINE_STANDARDS_RESOLVER_VERSION||null,
      targetRecordId:r.targetRecordId??r.id??null,
      targetSourceLabel:resolved?.weightSourceLabel||r.weightSourceLabel||r.standardWeightSourceLabel||'ارزیابی هفتگی / canonical'
    });
  });
}
global.AdineBroilerPerformanceIntelligenceSourceV1=Object.freeze({version:'BROILER-PI-SOURCE-V4',enrich});
})(typeof window!=='undefined'?window:globalThis);