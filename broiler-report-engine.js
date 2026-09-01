/* ADINE REPORTS — BROILER DOMAIN ENGINE V4
   Read-only reporting adapter.
   Actual values come from canonical weekly_records.
   Official references come ONLY from the exact selected strain's official registry.
   Weekly and cumulative gain are separate metrics.
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
  const norm=v=>String(v??'').normalize('NFKC').replace(/[\u200c\u200f\u202a-\u202e]/g,'').trim().toLowerCase();

  function registryFor(strain){
    const registry=global.BROILER_OFFICIAL_STANDARDS_V1?.strains||{};
    if(registry[strain])return registry[strain];
    const key=norm(strain);
    const found=Object.keys(registry).find(k=>norm(k)===key);
    return found?registry[found]:null;
  }

  function standardFor(flock,r){
    const strain=String(flock?.strain??'').trim();
    const registry=registryFor(strain);
    const a=age(r);
    if(registry && Number.isFinite(a)){
      const hit=(registry.records||[]).find(x=>Number(x[0])===a);
      if(hit){
        return {
          weight:n(hit[1]),fcr:n(hit[2]),weightSourceLabel:registry.sourceLabel,fcrSourceLabel:registry.sourceLabel,
          sourceType:registry.sourceType,sourceUrl:registry.sourceUrl,official:true,
          strainKey:Object.keys(global.BROILER_OFFICIAL_STANDARDS_V1?.strains||{}).find(k=>registry===global.BROILER_OFFICIAL_STANDARDS_V1.strains[k])||strain
        };
      }
    }
    return null;
  }

  function officialWeeklyFcr(flock,rows,index){
    const current=standardFor(flock,rows[index]);
    const cc=n(current?.fcr),cw=n(current?.weight);
    if(cc===null||cw===null)return null;
    if(index===0)return cc;
    const previous=standardFor(flock,rows[index-1]);
    const pc=n(previous?.fcr),pw=n(previous?.weight);
    if([pc,pw].some(x=>x===null)||cw<=pw)return null;
    return (cc*cw-pc*pw)/(cw-pw);
  }

  function actualWeeklyGain(rows,index,flock){
    const current=weight(rows[index]);
    if(current===null)return null;
    const previous=index>0?weight(rows[index-1]):n(flock?.initial_average_weight_g);
    return previous===null?null:current-previous;
  }

  function actualCumulativeGain(rows,index,flock){
    const current=weight(rows[index]),initial=n(flock?.initial_average_weight_g);
    return current===null||initial===null?null:current-initial;
  }

  function officialWeeklyGain(flock,rows,index){
    const current=standardFor(flock,rows[index]),cw=n(current?.weight);
    if(cw===null||index===0)return null;
    const previous=standardFor(flock,rows[index-1]),pw=n(previous?.weight);
    return pw===null?null:cw-pw;
  }

  // The official registry starts at day 7. Without an official day-0 weight,
  // an official cumulative gain would be fabricated. Keep it null until such
  // a baseline is explicitly defined in the official source.
  function officialCumulativeGain(){return null}

  function managementWeeklyFcr(flock,rows,index){return officialWeeklyFcr(flock,rows,index)}
  function managementWeightGain(flock,rows,index){return officialWeeklyGain(flock,rows,index)}
  function qualityTargets(){return{cv:10,uniformity10:80,uniformity15:90}}
  function classify(actual,target,direction){if(actual===null||target===null)return'neutral';if(direction==='lower')return actual<=target?'good':'warn';if(direction==='higher')return actual>=target?'good':'warn';return'neutral'}

  function makeRow(flock,rows,index){
    const r=rows[index],s=standardFor(flock,r),weeklyStandardFcr=officialWeeklyFcr(flock,rows,index),q=qualityTargets();
    const actualWeight=weight(r),actualFcr=fcr(r),actualCum=cumulativeFcr(r);
    const actualWeekly=actualWeeklyGain(rows,index,flock),actualCumulative=actualCumulativeGain(rows,index,flock);
    const standardWeeklyGain=officialWeeklyGain(flock,rows,index);
    return{
      raw:r,index,week:week(r),age:age(r),weight:actualWeight,
      standardWeight:n(s?.weight),weightSource:s?.sourceType||null,weightSourceLabel:s?.weightSourceLabel||null,
      weightGain:actualWeekly,weeklyWeightGain:actualWeekly,cumulativeWeightGain:actualCumulative,
      managementWeightGain:standardWeeklyGain,standardWeeklyWeightGain:standardWeeklyGain,standardCumulativeWeightGain:null,
      fcr:actualFcr,cumulativeFcr:actualCum,standardWeeklyFcr:n(weeklyStandardFcr),officialWeeklyFcr:n(weeklyStandardFcr),
      standardCumulativeFcr:n(s?.fcr),managementWeeklyFcr:n(weeklyStandardFcr),
      fcrSource:r?.production_metrics?.calculation_version||'canonical-record',fcrSourceLabel:s?.fcrSourceLabel||null,
      cv:cv(r),cvStandard:q.cv,uniformity10:u10(r),uniformity10Standard:q.uniformity10,uniformity15:u15(r),uniformity15Standard:q.uniformity15,
      feed:feed(r),water:water(r),mortalityPercent:val(r,['mortality']),mortalityCount:val(r,['mortality_count']),liveBirds:live(r),waterFeedRatio:ratio(r),
      weightStatus:classify(actualWeight,n(s?.weight),'higher'),fcrStatus:classify(actualFcr,n(weeklyStandardFcr),'lower'),
      cvStatus:classify(cv(r),q.cv,'lower'),uniformity10Status:classify(u10(r),q.uniformity10,'higher'),uniformity15Status:classify(u15(r),q.uniformity15,'higher')
    }
  }

  function build(flock,rows){
    const sorted=[...(rows||[])].sort((a,b)=>(week(a)??9999)-(week(b)??9999));
    return{domain:'broiler',engineVersion:'BROILER-REPORT-V4',calculationAuthority:'canonical-weekly-record',standardAuthority:'exact-strain-official-registry',rows:sorted.map((r,i)=>makeRow(flock,sorted,i))}
  }
  global.AdineBroilerReportEngine={version:'BROILER-REPORT-V4',build,standardFor,officialWeeklyFcr,actualWeeklyGain,actualCumulativeGain,officialWeeklyGain,officialCumulativeGain,managementWeeklyFcr,managementWeightGain};
})(typeof window!=='undefined'?window:globalThis);