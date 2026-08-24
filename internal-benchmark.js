/* =========================================================
   ADINE POULTRY HEALTH CENTER
   INTERNAL PEER BENCHMARK V6
   - Anonymous peer comparison
   - One representative record per farm
   - Progressive cohort matching
   - Confidence-aware peer score
   ========================================================= */
"use strict";

const INTERNAL_BENCHMARK_VERSION = "2026.3";

function benchmarkMetricLabel(metric){
  return ({
    body_weight:"وزن بدن", fcr:"FCR", mortality:"تلفات", uniformity:"یکنواختی ±۱۰٪", cv:"CV",
    egg_production:"تولید تخم", egg_weight:"وزن تخم", fertility:"نطفه‌داری", hatchability:"جوجه‌درآوری"
  })[metric] || metric;
}
function benchmarkDirection(metric){
  return ["fcr","mortality","cv"].includes(metric) ? "lower" :
         ["uniformity","egg_production","fertility","hatchability"].includes(metric) ? "higher" : "context";
}
function benchmarkConfidenceLabel(level){
  return ({
    insufficient:"داده ناکافی",
    initial:"بنچمارک اولیه",
    reliable:"بنچمارک قابل اتکا",
    stable:"بنچمارک پایدار"
  })[level] || "—";
}
function benchmarkPosition(b){
  if(!b || b.currentValue==null || !Number.isFinite(b.currentValue)) return {key:"none",label:"قابل مقایسه نیست"};
  if(b.direction==="context") return {key:"context",label:"مقایسه توزیعی"};
  const v=b.currentValue;
  if(b.direction==="higher"){
    if(v>=b.p75) return {key:"top25",label:"جزو ۲۵٪ برتر"};
    if(v>=b.median) return {key:"aboveMedian",label:"بهتر از میانه"};
    if(v>=b.p25) return {key:"belowMedian",label:"پایین‌تر از میانه"};
    return {key:"bottom25",label:"نیازمند توجه"};
  }
  if(v<=b.p25) return {key:"top25",label:"جزو ۲۵٪ برتر"};
  if(v<=b.median) return {key:"aboveMedian",label:"بهتر از میانه"};
  if(v<=b.p75) return {key:"belowMedian",label:"پایین‌تر از میانه"};
  return {key:"bottom25",label:"نیازمند توجه"};
}

async function getInternalBenchmark({flockId,metric,ageWindowDays=7}={}){
  if(!window.supabaseClient || !flockId || !metric) return null;
  try{
    const {data,error}=await supabaseClient.rpc("get_flock_benchmark_v6",{
      p_flock_id:flockId,
      p_metric:metric,
      p_age_window_days:ageWindowDays
    });
    if(error){ console.warn("Peer benchmark unavailable",error); return null; }
    const row=Array.isArray(data)?data[0]:data;
    if(!row) return null;
    return {
      version:INTERNAL_BENCHMARK_VERSION,
      metric,
      label:benchmarkMetricLabel(metric),
      direction:row.direction||benchmarkDirection(metric),
      cohortLevel:row.cohort_level,
      cohortLabel:row.cohort_label,
      comparableFarms:Number(row.comparable_farms||0),
      comparableFlocks:Number(row.comparable_flocks||0),
      comparableRecords:Number(row.comparable_records||0),
      ageMin:row.age_min==null?null:Number(row.age_min),
      ageMax:row.age_max==null?null:Number(row.age_max),
      p10:row.p10==null?null:Number(row.p10),
      p25:row.p25==null?null:Number(row.p25),
      median:row.median==null?null:Number(row.median),
      p75:row.p75==null?null:Number(row.p75),
      p90:row.p90==null?null:Number(row.p90),
      currentValue:row.current_value==null?null:Number(row.current_value),
      peerPercentile:row.peer_percentile==null?null:Number(row.peer_percentile),
      peerScore:row.peer_score==null?null:Number(row.peer_score),
      peerScoreUsable:!!row.peer_score_usable,
      confidenceLevel:row.confidence_level||"insufficient",
      confidenceLabel:row.confidence_label||benchmarkConfidenceLabel(row.confidence_level),
      sampleAdequate:!!row.sample_adequate,
      sampleNote:row.sample_note||"",
      selfMedian:row.self_median==null?null:Number(row.self_median),
      selfPrevious:row.self_previous==null?null:Number(row.self_previous),
      selfChangePct:row.self_change_pct==null?null:Number(row.self_change_pct)
    };
  }catch(error){ console.warn("Peer benchmark error",error); return null; }
}

async function getFlockMetricHistory({flockId,metric,limit=12}={}){
  if(!window.supabaseClient || !flockId || !metric) return [];
  const {data,error}=await supabaseClient.rpc("get_flock_metric_history_v6",{
    p_flock_id:flockId,p_metric:metric,p_limit:limit
  });
  if(error) return [];
  return (data||[]).map(r=>({
    ageDays:Number(r.age_days),
    value:Number(r.metric_value),
    createdAt:r.created_at
  })).filter(r=>Number.isFinite(r.value));
}

window.INTERNAL_BENCHMARK_VERSION=INTERNAL_BENCHMARK_VERSION;
window.getInternalBenchmark=getInternalBenchmark;
window.getFlockMetricHistory=getFlockMetricHistory;
window.benchmarkPosition=benchmarkPosition;
