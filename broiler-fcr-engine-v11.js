/* ADINE POULTRY HEALTH — BROILER FCR CANONICAL ENGINE V14.2 */
(function(global){'use strict';
const VERSION='BROILER-FCR-V14.2';
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const norm=v=>String(v??'').trim().toLowerCase();
const isBroiler=f=>['broiler','broilers','گوشتی','meat'].includes(norm(f?.production_type||f?.productionType));
function canonical(records,flock){
  if(!Array.isArray(records))return[];
  const sorted=[...records].sort((a,b)=>Number(a.ageDays??a.age_days)-Number(b.ageDays??b.age_days));
  const iw=n(flock?.initial_average_weight_g??flock?.initialAverageWeightG),ib=n(flock?.initial_bird_count??flock?.initialBirdCount);
  let prev=null,cumFeed=0;
  return sorted.map((r,index)=>{
    const weight=n(r.average_weight_g??r.averageWeight),live=n(r.live_birds??r.liveBirds),feed=n(r.feed_total_kg??r.feedTotalKg??r.feed);
    const openingLive=index===0?ib:n(prev?.live_birds??prev?.liveBirds),openingWeight=index===0?iw:n(prev?.average_weight_g??prev?.averageWeight);
    let weekly=null;
    /* Comparable FCR follows breeder-catalog semantics: mortality is not separately
       credited/debited. Period feed is divided by current live birds multiplied by
       the period's per-bird weight gain. */
    if(live>0&&weight>0&&openingWeight!==null&&weight>openingWeight){const gain=live*(weight-openingWeight)/1000;if(feed>0&&gain>0)weekly=feed/gain;}
    if(feed!==null&&feed>=0)cumFeed+=feed;
    /* Cumulative comparable FCR uses the current live population and total
       per-bird gain from placement, matching the breeder-table definition. */
    const cumulativeGain=(live>0&&weight>0&&iw!==null&&weight>iw)?live*(weight-iw)/1000:null;
    let cumulative=null;if(cumFeed>0&&cumulativeGain>0)cumulative=cumFeed/cumulativeGain;
    const result={...r,ageDays:n(r.ageDays??r.age_days),weeklyFcr:weekly==null?null:Number(weekly.toFixed(4)),cumulativeFcr:cumulative==null?null:Number(cumulative.toFixed(4)),fcr:weekly==null?null:Number(weekly.toFixed(4)),calculationVersion:VERSION,fcrSemantics:'comparable-breeder-catalog-mortality-not-accounted-for'};
    prev=r;
    return result;
  });
}
function status(actual,target){if(actual==null||target==null)return{key:'none',label:'قابل مقایسه نیست'};const d=(actual-target)/target*100;if(d<=0)return{key:'good',label:'بهتر از معیار'};if(d<=5)return{key:'near',label:'نزدیک به معیار'};if(d<=10)return{key:'warning',label:'نیازمند توجه'};return{key:'bad',label:'نامطلوب'};}
function loadCanonicalSource(){return new Promise((resolve,reject)=>{if(global.AdineBroilerPerformanceIntelligenceSourceV1?.version==='BROILER-PI-SOURCE-V7'){resolve();return}if(typeof document==='undefined'){reject(new Error('PI_SOURCE_NOT_LOADED'));return}const s=document.createElement('script');s.src='broiler-performance-intelligence-source-v1.js?v=20260915.7';s.async=false;s.onload=()=>global.AdineBroilerPerformanceIntelligenceSourceV1?.version==='BROILER-PI-SOURCE-V7'?resolve():reject(new Error('PI_SOURCE_VERSION_MISMATCH'));s.onerror=()=>reject(new Error('PI_SOURCE_LOAD_FAILED'));document.head.appendChild(s)})}
function canonicalTarget(flock,row){try{if(global.AdineBroilerPerformanceIntelligenceSourceV1?.weeklyEvaluationStandard)return global.AdineBroilerPerformanceIntelligenceSourceV1.weeklyEvaluationStandard(flock,row)||null;if(global.resolvePoultryStandard){const age=n(row?.age_days??row?.ageDays);if(age===null)return null;const x=global.resolvePoultryStandard({productionType:'broiler',breed:flock?.genetics||'',genetics:flock?.genetics||'',strain:flock?.strain||'',ageDays:age});if(!x)return null;return{weight:x.weight,cumulativeFcr:null,weeklyFcr:x.fcr,sourceType:x.confidence==='official'?'official-performance-objective':'management-standard',sourceLabel:x.sourceName||x.fcrSourceLabel||'استاندارد کاننیکال'}}}catch(e){console.warn('ADINE FCR canonical target unavailable:',e)}return null}
async function analysis(flockId){
  if(!global.supabaseClient||!flockId)return{ok:false,rows:[]};
  await loadCanonicalSource();
  const flockResult=await global.supabaseClient.from('flocks').select('*').eq('id',flockId).maybeSingle();
  if(flockResult.error)throw flockResult.error;
  const flock=flockResult.data;
  if(!flock||!isBroiler(flock))return{ok:true,rows:[],latest:null};
  const recordsResult=await global.supabaseClient.from('weekly_records').select('*').eq('flock_id',flockId).order('evaluation_date',{ascending:true}).order('record_date',{ascending:true});
  if(recordsResult.error)throw recordsResult.error;
  const actualRows=canonical(recordsResult.data||[],flock);
  const rows=actualRows.map(r=>{
    const target=canonicalTarget(flock,r),officialWeekly=target?.sourceType==='official-performance-objective'?n(target.weeklyFcr):null,officialCumulative=target?.sourceType==='official-performance-objective'?n(target.cumulativeFcr):null,managementWeekly=target?.sourceType==='management-standard'?n(target.weeklyFcr):null,managementCumulative=target?.sourceType==='management-standard'?n(target.cumulativeFcr):null;
    return {...r,record_id:r.id,evaluation_date:r.evaluation_date||r.record_date,weeklyFcr:n(r.weeklyFcr??r.fcr),cumulativeFcr:n(r.cumulativeFcr??r.cumulative_fcr),officialWeekly,officialCumulative,managementWeekly,managementCumulative,official_weekly_fcr:officialWeekly,official_cumulative_fcr:officialCumulative,management_weekly_fcr:managementWeekly,management_cumulative_fcr:managementCumulative,official_source:officialWeekly!==null?target?.sourceLabel:null,official_year:officialWeekly!==null?(global.BROILER_OFFICIAL_STANDARDS_V1?.strains?.[flock.strain]?.sourceYear??null):null,management_cohort:managementWeekly!==null?target?.sourceLabel:null,management_flocks:0,management_units:0,weeklyOfficialStatus:status(n(r.weeklyFcr??r.fcr),officialWeekly),cumulativeOfficialStatus:status(n(r.cumulativeFcr??r.cumulative_fcr),officialCumulative),weeklyManagementStatus:status(n(r.weeklyFcr??r.fcr),managementWeekly),cumulativeManagementStatus:status(n(r.cumulativeFcr??r.cumulative_fcr),managementCumulative),calculation_version:VERSION};
  });
  return{ok:true,rows,latest:rows.at(-1)||null};
}
global.AdineBroilerFCR={VERSION,canonical,analysis,status,isBroiler};
})(typeof window!=='undefined'?window:globalThis);