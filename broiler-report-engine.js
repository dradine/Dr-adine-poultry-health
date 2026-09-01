/* ADINE REPORTS — BROILER DOMAIN ENGINE V2
   Read-only reporting adapter. Canonical FCR values come from weekly_records.
   Standards are resolved strain-first from the official broiler registry.
*/
"use strict";
(function(global){
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  const val=(r,keys)=>{for(const k of keys){const x=n(r?.[k]);if(x!==null)return x}return null};
  const weight=r=>val(r,['average_weight_g','average_weight','weight_g']);
  const fcr=r=>val(r,['fcr']);
  const cumulativeFcr=r=>val(r,['cumulative_fcr']);
  const age=r=>val(r,['age_days']);
  const week=r=>val(r,['week_number']);
  const feed=r=>val(r,['feed_total_kg','feed']);
  const water=r=>val(r,['water_total_liter','water']);
  const cv=r=>val(r,['cv_percent','cv']);
  const u10=r=>val(r,['uniformity_10_percent','uniformity_10']);
  const u15=r=>val(r,['uniformity_15_percent','uniformity_15']);
  const live=r=>val(r,['live_birds','bird_count']);
  const ratio=r=>val(r,['water_feed_ratio']);

  /* Always prefer the exact selected strain's official registry record.
     This prevents an older generic/median benchmark from appearing in a
     strain-specific report such as Ross 308 AP. */
  function standardFor(flock,r){
    const strain=String(flock?.strain??'').trim();
    const registry=global.BROILER_OFFICIAL_STANDARDS_V1?.strains?.[strain];
    const a=age(r);
    if(registry && Number.isFinite(a)){
      const hit=(registry.records||[]).find(x=>Number(x[0])===a);
      if(hit){
        return {
          weight:n(hit[1]),
          fcr:n(hit[2]),
          weightSourceLabel:registry.sourceLabel,
          fcrSourceLabel:registry.sourceLabel,
          sourceType:registry.sourceType,
          sourceUrl:registry.sourceUrl,
          official:true
        };
      }
    }
    if(typeof global.resolvePoultryStandard!=="function")return null;
    try{return global.resolvePoultryStandard({productionType:flock?.production_type,genetics:flock?.genetics,strain,ageDays:a})||null}catch(e){return null}
  }

  function managementWeeklyFcr(flock,rows,index){
    const current=standardFor(flock,rows[index]);
    const cc=n(current?.fcr); if(cc===null)return null;
    if(index===0)return cc;
    const previous=standardFor(flock,rows[index-1]);
    const cw=n(current?.weight),pw=n(previous?.weight),pc=n(previous?.fcr);
    if([cw,pw,pc].some(x=>x===null)||cw<=pw)return null;
    return (cc*cw-pc*pw)/(cw-pw);
  }

  function managementWeightGain(flock,rows,index){
    const current=standardFor(flock,rows[index]),cw=n(current?.weight);if(cw===null)return null;
    if(index===0){const initial=n(flock.initial_average_weight_g);return initial===null?null:cw-initial}
    const previous=standardFor(flock,rows[index-1]),pw=n(previous?.weight);return pw===null?null:cw-pw;
  }

  /* Quality-management references are not breeder genetic objectives.
     They are deliberately labelled as management thresholds. */
  function qualityTargets(){return{cv:10,uniformity10:80,uniformity15:90}}

  function classify(actual,target,direction){if(actual===null||target===null)return"neutral";if(direction==='lower')return actual<=target?'good':'warn';if(direction==='higher')return actual>=target?'good':'warn';return'neutral'}

  function makeRow(flock,rows,index){
    const r=rows[index],s=standardFor(flock,r),mFcr=managementWeeklyFcr(flock,rows,index),mGain=managementWeightGain(flock,rows,index),q=qualityTargets();
    const actualWeight=weight(r),actualFcr=fcr(r),actualCum=cumulativeFcr(r),prevWeight=index?weight(rows[index-1]):null,actualGain=actualWeight!==null&&prevWeight!==null?actualWeight-prevWeight:null;
    return{
      raw:r,index,week:week(r),age:age(r),weight:actualWeight,
      standardWeight:n(s?.weight),weightSource:s?.sourceType||null,weightSourceLabel:s?.weightSourceLabel||null,
      weightGain:actualGain,managementWeightGain:mGain,
      fcr:actualFcr,cumulativeFcr:actualCum,standardCumulativeFcr:n(s?.fcr),managementWeeklyFcr:mFcr,
      fcrSource:s?.sourceType||r?.production_metrics?.calculation_version||'canonical-record',fcrSourceLabel:s?.fcrSourceLabel||null,
      cv:cv(r),cvStandard:q.cv,uniformity10:u10(r),uniformity10Standard:q.uniformity10,uniformity15:u15(r),uniformity15Standard:q.uniformity15,
      feed:feed(r),water:water(r),mortalityPercent:val(r,['mortality']),mortalityCount:val(r,['mortality_count']),liveBirds:live(r),waterFeedRatio:ratio(r),
      weightStatus:classify(actualWeight,n(s?.weight),'higher'),fcrStatus:classify(actualFcr,mFcr,'lower'),
      cvStatus:classify(cv(r),q.cv,'lower'),uniformity10Status:classify(u10(r),q.uniformity10,'higher'),uniformity15Status:classify(u15(r),q.uniformity15,'higher')
    }
  }

  function build(flock,rows){const sorted=[...(rows||[])].sort((a,b)=>(week(a)??9999)-(week(b)??9999));return{domain:'broiler',engineVersion:'BROILER-REPORT-V2',calculationAuthority:'canonical-weekly-record',rows:sorted.map((r,i)=>makeRow(flock,sorted,i))}}
  global.AdineBroilerReportEngine={version:'BROILER-REPORT-V2',build,standardFor,managementWeeklyFcr,managementWeightGain};
})(typeof window!=='undefined'?window:globalThis);