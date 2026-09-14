/* ADINE REPORTS — BROILER DOMAIN ENGINE V8
   Read-only reporting adapter.
   Actual values and reference targets used by reports come from the canonical
   weekly-report data path. This engine does not invent management targets.
   The legacy registry helper remains available for compatibility, but build()
   uses canonical row targets whenever present and marks absent targets null.
*/
"use strict";
(function(global){
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  const val=(r,keys)=>{for(const k of keys){const x=n(r?.[k]);if(x!==null)return x}return null};
  const weight=r=>val(r,['average_weight_g','average_weight','weight_g']);
  const fcr=r=>val(r,['fcr']);
  const cumulativeFcr=r=>val(r,['cumulative_fcr']);
  const age=r=>val(r,['age_days']);
  const week=r=>val(r,['week_number','production_week']);
  const feed=r=>val(r,['feed_total_kg','feed']);
  const water=r=>val(r,['water_total_liter','water']);
  const cv=r=>val(r,['cv_percent','cv']);
  const u10=r=>val(r,['uniformity_10_percent','uniformity_10']);
  const u15=r=>val(r,['uniformity_15_percent','uniformity_15']);
  const live=r=>val(r,['live_birds','bird_count']);
  const ratio=r=>val(r,['water_feed_ratio']);
  const norm=v=>String(v??'').normalize('NFKC').replace(/[\u200c\u200f\u202a-\u202e]/g,'').replace(/[‐‑‒–—−]/g,'-').replace(/[._/\\]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();

  function registryFor(strain){
    const registry=global.BROILER_OFFICIAL_STANDARDS_V1?.strains||{};
    if(registry[strain])return registry[strain];
    const key=norm(strain);
    const found=Object.keys(registry).find(k=>norm(k)===key);
    return found?registry[found]:null;
  }

  function benchmarkAge(r){const w=week(r);return Number.isFinite(w)&&w>0?w*7:age(r)}

  /* Compatibility helper only. Production build() prefers canonical weekly
     targets and never uses this registry when canonical target fields exist. */
  function standardFor(flock,r){
    const canonicalWeight=n(r?.standard_weight??r?.standardWeight),canonicalCum=n(r?.official_cumulative_fcr??r?.officialCumulativeFcr),canonicalWeekly=n(r?.official_weekly_fcr??r?.officialWeeklyFcr),canonicalManagement=n(r?.management_weekly_fcr??r?.managementWeeklyFcr);
    if(canonicalWeight!==null||canonicalCum!==null||canonicalWeekly!==null||canonicalManagement!==null){return{weight:canonicalWeight,fcr:canonicalCum,weeklyFcr:canonicalWeekly,managementFcr:canonicalManagement,weightSourceLabel:'ارزیابی هفتگی / canonical',fcrSourceLabel:r?.officialFcrSource||'ارزیابی هفتگی / canonical',sourceType:'canonical-weekly-report',sourceUrl:null,official:true,standardAgeDays:age(r),strainKey:String(flock?.strain??'')}}
    return null;
  }

  function canonicalOfficialWeeklyFcr(r){return n(r?.official_weekly_fcr??r?.officialWeeklyFcr)}
  function canonicalOfficialCumulativeFcr(r){return n(r?.official_cumulative_fcr??r?.officialCumulativeFcr)}
  function canonicalManagementWeeklyFcr(r){return n(r?.management_weekly_fcr??r?.managementWeeklyFcr)}
  function canonicalManagementCumulativeFcr(r){return n(r?.management_cumulative_fcr??r?.managementCumulativeFcr)}
  function canonicalManagementWeight(r){return n(r?.management_weight??r?.managementWeight??r?.management_target_weight??r?.managementTargetWeight)}
  function canonicalManagementWeightGain(r){return n(r?.management_weekly_weight_gain??r?.managementWeeklyWeightGain)}

  function actualWeeklyGain(rows,index,flock){const current=weight(rows[index]);if(current===null)return null;const previous=index>0?weight(rows[index-1]):n(flock?.initial_average_weight_g);return previous===null?null:current-previous}
  function actualCumulativeGain(rows,index,flock){const current=weight(rows[index]),initial=n(flock?.initial_average_weight_g);return current===null||initial===null?null:current-initial}
  function managementWeeklyWeightGain(flock,rows,index){return canonicalManagementWeightGain(rows[index])}
  function officialCumulativeGain(flock,rows,index){const current=weight(rows[index]),initial=n(flock?.initial_average_weight_g);return current===null||initial===null?null:current-initial}
  function managementWeeklyFcr(flock,rows,index){return canonicalManagementWeeklyFcr(rows[index])}
  function managementWeightGain(flock,rows,index){return managementWeeklyWeightGain(flock,rows,index)}
  function officialWeeklyFcr(flock,rows,index){return canonicalOfficialWeeklyFcr(rows[index])}
  function qualityTargets(r){return{cv:val(r,['standardCv','standard_cv','officialCv']),uniformity10:val(r,['standardUniformity10','standard_uniformity_10','officialUniformity10']),uniformity15:val(r,['standardUniformity15','standard_uniformity_15','officialUniformity15'])}}
  function classify(actual,target,direction){if(actual===null||target===null)return'neutral';if(direction==='lower')return actual<=target?'good':'warn';if(direction==='higher')return actual>=target?'good':'warn';return'neutral'}

  function makeRow(flock,rows,index){
    const r=rows[index],s=standardFor(flock,r),q=qualityTargets(r);
    const actualWeight=weight(r),actualFcr=fcr(r),actualCum=cumulativeFcr(r),actualWeekly=actualWeeklyGain(rows,index,flock),actualCumulative=actualCumulativeGain(rows,index,flock);
    const managementWeight=canonicalManagementWeight(r),managementGain=managementWeeklyWeightGain(flock,rows,index);
    const sourceType=s?.sourceType||null,sourceLabel=s?.sourceLabel||null;
    return{
      raw:r,index,week:week(r),age:age(r),benchmarkAgeDays:age(r),
      weight:actualWeight,standardWeight:n(r?.standard_weight??r?.standardWeight),weightSource:'canonical-weekly-record',weightSourceLabel:sourceLabel,standardWeightSource:'canonical-weekly-record',standardWeightSourceLabel:sourceLabel,
      weightGain:actualWeekly,weeklyWeightGain:actualWeekly,cumulativeWeightGain:actualCumulative,
      managementWeight,managementWeightGain:managementGain,standardWeeklyWeightGain:managementGain,standardWeeklyWeightGainSource:managementGain===null?null:'canonical-weekly-report',standardWeeklyWeightGainSourceLabel:managementGain===null?null:'ارزیابی هفتگی / canonical',standardCumulativeWeightGain:officialCumulativeGain(flock,rows,index),standardCumulativeWeightGainSource:'canonical-weekly-record',standardCumulativeWeightGainSourceLabel:sourceLabel,
      fcr:actualFcr,cumulativeFcr:actualCum,
      standardWeeklyFcr:canonicalOfficialWeeklyFcr(r),officialWeeklyFcr:canonicalOfficialWeeklyFcr(r),standardWeeklyFcrSource:'canonical-weekly-report',standardWeeklyFcrSourceLabel:r?.officialFcrSource||'ارزیابی هفتگی / canonical',
      standardCumulativeFcr:canonicalOfficialCumulativeFcr(r),officialCumulativeFcr:canonicalOfficialCumulativeFcr(r),standardCumulativeFcrSource:'canonical-weekly-report',standardCumulativeFcrSourceLabel:r?.officialFcrSource||'ارزیابی هفتگی / canonical',
      managementWeeklyFcr:canonicalManagementWeeklyFcr(r),managementCumulativeFcr:canonicalManagementCumulativeFcr(r),managementFcrSource:r?.managementFcrSource||null,
      fcrSource:r?.production_metrics?.calculation_version||'canonical-record',fcrSourceLabel:r?.officialFcrSource||sourceLabel,
      cv:cv(r),cvStandard:q.cv,uniformity10:u10(r),uniformity10Standard:q.uniformity10,uniformity15:u15(r),uniformity15Standard:q.uniformity15,
      feed:feed(r),water:water(r),mortalityPercent:val(r,['mortality']),mortalityCount:val(r,['mortality_count']),liveBirds:live(r),waterFeedRatio:ratio(r),
      targetAuthority:'canonical-weekly-report',targetRecordId:r?.targetRecordId||r?.id||null,
      weightStatus:classify(actualWeight,n(r?.standard_weight??r?.standardWeight),'higher'),fcrStatus:classify(actualFcr,canonicalOfficialWeeklyFcr(r),'lower'),cvStatus:classify(cv(r),q.cv,'lower'),uniformity10Status:classify(u10(r),q.uniformity10,'higher'),uniformity15Status:classify(u15(r),q.uniformity15,'higher')
    };
  }

  function build(flock,rows){const sorted=[...(rows||[])].sort((a,b)=>(week(a)??9999)-(week(b)??9999));return{domain:'broiler',engineVersion:'BROILER-REPORT-V8',calculationAuthority:'canonical-weekly-record',standardAuthority:'canonical-weekly-report',rows:sorted.map((r,i)=>makeRow(flock,sorted,i))}}
  global.AdineBroilerReportEngine={version:'BROILER-REPORT-V8',build,standardFor,officialWeeklyFcr,actualWeeklyGain,actualCumulativeGain,managementWeeklyWeightGain,officialCumulativeGain,managementWeeklyFcr,managementWeightGain,benchmarkAge};
})(typeof window!=='undefined'?window:globalThis);