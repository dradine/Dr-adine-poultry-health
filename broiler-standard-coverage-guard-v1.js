/* ADINE — BROILER STANDARD COVERAGE GUARD V1
   This is NOT a second standards source. It is a compatibility/validation
   layer over the canonical engine. Every weekly report row must expose an
   effective target for all eight canonical ages. Where a metric has no
   separate management record, the official canonical target is the effective
   standard; no independent number is invented here.
*/
(function(g){'use strict';
  const AGES=Array.isArray(g.BROILER_OFFICIAL_STANDARDS_V1?.weeklyAges)?g.BROILER_OFFICIAL_STANDARDS_V1.weeklyAges.slice():[7,14,21,28,35,42,49,56];
  const METRICS=['weight','fcr','cumulativeFcr','adg','feed','mortality','cv','u10','u15','water','wfr','epef'];
  const canonical=(strain,age,metric)=>typeof g.broilerCanonicalMetricTarget==='function'?g.broilerCanonicalMetricTarget(strain,age,metric):null;
  function identity(strain){
    if(typeof g.findPoultryStandardIdentity==='function'){
      const x=g.findPoultryStandardIdentity('broiler','',strain);if(x?.matched)return x.strain;
    }
    return strain;
  }
  function coverage(strain){
    const key=identity(strain),missing=[];
    for(const age of AGES)for(const metric of METRICS){const t=canonical(key,age,metric);if(!t||t.value===null||t.value===undefined)missing.push({age,metric})}
    return {strain:key,ages:AGES.slice(),metrics:METRICS.slice(),complete:missing.length===0,missing};
  }
  function assertCoverage(){
    const strains=Object.keys(g.BROILER_OFFICIAL_STANDARDS_V1?.strains||{}),result=strains.map(coverage),failed=result.filter(x=>!x.complete);
    if(failed.length){const detail=failed.map(x=>`${x.strain}: ${x.missing.map(m=>`${m.metric}@${m.age}`).join(', ')}`).join(' | ');throw new Error(`BROILER_STANDARD_COVERAGE_INCOMPLETE: ${detail}`)}
    return {complete:true,strains:strains.length,ages:AGES.length,metrics:METRICS.length};
  }
  function effectiveManagementOrOfficial(strain,age,metric){
    const t=canonical(identity(strain),age,metric);if(!t)return null;
    return {value:t.value,sourceType:t.sourceType,targetType:t.targetType,sourceLabel:t.sourceLabel,isEffective:true};
  }
  if(g.AdineBroilerReportEngine&&typeof g.AdineBroilerReportEngine.standardFor==='function'){
    const original=g.AdineBroilerReportEngine.standardFor;
    const wrapped=function(flock,row){
      const out=original(flock,row);if(!out)return out;
      const strain=flock?.strain??flock?.flock_strain??flock?.genetics??'';const a=Number(row?.age_days);
      const metrics=['weight','fcr','cumulativeFcr','adg','feed','mortality','cv','u10','u15','water','wfr','epef'];
      const effective={};for(const m of metrics)effective[m]=effectiveManagementOrOfficial(strain,a,m);
      return Object.assign(out,{effectiveStandardSource:effective.weight?.sourceType||effective.fcr?.sourceType||null,effectiveStandardSourceLabel:effective.weight?.sourceLabel||effective.fcr?.sourceLabel||'استاندارد کاننیکال',effectiveStandardComplete:metrics.every(m=>effective[m]?.value!==null&&effective[m]?.value!==undefined),effectiveStandard:effective,
        managementWeeklyFcr:out.managementWeeklyFcr??effective.fcr?.value??null,
        managementCumulativeFcr:out.managementCumulativeFcr??effective.cumulativeFcr?.value??null,
        managementWeight:out.managementWeight??effective.weight?.value??null,
        managementWeightGain:out.managementWeightGain??effective.adg?.value*7??null});
    };
    g.AdineBroilerReportEngine.standardFor=wrapped;
  }
  g.AdineBroilerStandardCoverageGuard=Object.freeze({version:'BROILER-STANDARD-COVERAGE-GUARD-V1',ages:AGES,metrics:METRICS,coverage,assertCoverage,effectiveManagementOrOfficial});
  try{g.AdineBroilerStandardCoverageGuard.assertCoverage()}catch(e){console.error(e)}
})(typeof window!=='undefined'?window:globalThis);
