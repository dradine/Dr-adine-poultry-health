/* =========================================================
   ADINE POULTRY HEALTH CENTER
   FLOCK BENCHMARK V7 - PRODUCTION CLIENT BRIDGE
   ========================================================= */
"use strict";
const INTERNAL_BENCHMARK_VERSION="V7.0";

function benchmarkMetricLabel(metric){return({body_weight:"وزن بدن",fcr:"FCR",mortality:"تلفات",livability:"زنده‌مانی",uniformity:"یکنواختی ±۱۰٪",cv:"CV",feed_per_bird:"مصرف دان/پرنده",water_per_bird:"مصرف آب/پرنده",egg_production:"تولید تخم",egg_weight:"وزن تخم",egg_mass:"Egg Mass",fertility:"نطفه‌داری",hatchability:"جوجه‌درآوری"})[metric]||metric}
function benchmarkDirection(metric){return["fcr","mortality","cv"].includes(metric)?"lower":["uniformity","livability","egg_production","egg_mass","fertility","hatchability"].includes(metric)?"higher":"context"}
function benchmarkConfidenceLabel(level){return({insufficient:"داده ناکافی",initial:"بنچمارک اولیه",reliable:"بنچمارک قابل اتکا",stable:"بنچمارک پایدار"})[level]||"—"}
function benchmarkDiagnostic(code){return({access_denied:"این گله برای حساب فعلی قابل مشاهده نیست.",age_unavailable:"سن واقعی گله برای مقایسه قابل محاسبه نیست.",insufficient_comparable_flocks:"تعداد گله‌های قابل مقایسه برای بنچمارک کافی نیست.",metric_unavailable:"این شاخص برای گله داده قابل مقایسه کافی ندارد.",database_error:"خطا در ارتباط با موتور بنچمارک گله.",not_applicable:"این شاخص در سن/مرحله فعلی گله قابل ارزیابی نیست."})[code]||"اطلاعات بنچمارک در دسترس نیست."}
function benchmarkPosition(b){if(!b||b.currentValue==null||!Number.isFinite(b.currentValue))return{key:"none",label:"قابل مقایسه نیست"};if(b.direction==="context")return{key:"context",label:"مقایسه توزیعی"};const v=b.currentValue;if(b.direction==="higher")return v>=b.p75?{key:"top25",label:"جزو ۲۵٪ برتر"}:v>=b.median?{key:"aboveMedian",label:"بهتر از میانه"}:v>=b.p25?{key:"belowMedian",label:"پایین‌تر از میانه"}:{key:"bottom25",label:"نیازمند توجه"};return v<=b.p25?{key:"top25",label:"جزو ۲۵٪ برتر"}:v<=b.median?{key:"aboveMedian",label:"بهتر از میانه"}:v<=b.p75?{key:"belowMedian",label:"پایین‌تر از میانه"}:{key:"bottom25",label:"نیازمند توجه"}}
function normalizeBenchmarkRow(row,metric){const num=k=>row[k]==null?null:Number(row[k]);const cohort=row.cohort_level||null;const sampleAdequate=cohort&&cohort!=="none"&&Number(row.comparable_flocks||0)>=10&&Number(row.independent_units||0)>=5;return{version:INTERNAL_BENCHMARK_VERSION,metric,label:benchmarkMetricLabel(metric),direction:row.direction||benchmarkDirection(metric),productionType:row.production_type||null,domain:row.domain||null,cohortLevel:cohort,cohortLabel:row.cohort_label||null,comparableFlocks:Number(row.comparable_flocks||0),independentUnits:Number(row.independent_units||0),comparableRecords:Number(row.comparable_records||0),ageDays:num("current_age_days"),ageWindowDays:num("age_window_days"),p10:num("p10"),p25:num("p25"),median:num("median"),p75:num("p75"),p90:num("p90"),iqr:num("iqr"),currentValue:num("current_value"),peerPercentile:num("peer_percentile"),peerScore:num("peer_score"),peerScoreUsable:!!row.peer_score_usable,confidenceLevel:row.confidence_level||"insufficient",confidenceScore:num("confidence_score"),confidenceLabel:row.confidence_label||benchmarkConfidenceLabel(row.confidence_level),sampleAdequate:!!sampleAdequate,sampleNote:row.sample_note||"",dataQuality:row.data_quality||null,standardTarget:num("standard_target"),standardSource:row.standard_source||null,standardVersion:row.standard_version||null,standardYear:num("standard_year"),deviationFromMedianPct:num("deviation_from_median_pct")}}
function benchmarkErrorCode(error){const message=String(error?.message||error||"");if(/permission|denied|not authorized|42501|دسترسی|مجاز نیست/i.test(message))return"access_denied";if(/function .* does not exist|42883/i.test(message))return"database_error";return"database_error"}
async function getInternalBenchmark({flockId,metric}={}){if(!window.supabaseClient||!flockId||!metric)return{ok:false,code:"database_error",message:benchmarkDiagnostic("database_error")};try{const{data,error}=await supabaseClient.rpc("get_flock_benchmark_v7",{p_flock_id:flockId,p_metric:metric});if(error){const code=benchmarkErrorCode(error);return{ok:false,code,message:benchmarkDiagnostic(code),technical:error.message||String(error)}}const row=Array.isArray(data)?data[0]:data;if(!row)return{ok:false,code:"metric_unavailable",message:benchmarkDiagnostic("metric_unavailable")};const result=normalizeBenchmarkRow(row,metric);if(result.cohortLevel==="none"||result.comparableFlocks<10||result.independentUnits<5)return{...result,ok:false,code:"insufficient_comparable_flocks",message:result.sampleNote||benchmarkDiagnostic("insufficient_comparable_flocks")};if(result.currentValue==null)return{...result,ok:false,code:"metric_unavailable",message:benchmarkDiagnostic("metric_unavailable")};return{...result,ok:true,code:null,message:null}}catch(error){const code=benchmarkErrorCode(error);return{ok:false,code,message:benchmarkDiagnostic(code),technical:error?.message||String(error)}}}

async function getFlockMetricHistory({flockId,metric,limit=12}={}){if(!window.supabaseClient||!flockId||!metric)return{ok:false,code:"database_error",message:benchmarkDiagnostic("database_error"),rows:[]};try{const{data,error}=await supabaseClient.rpc("get_flock_metric_history_v6",{p_flock_id:flockId,p_metric:metric,p_limit:Math.max(1,Math.min(52,Number(limit)||12))});if(error){const code=benchmarkErrorCode(error);return{ok:false,code,message:benchmarkDiagnostic(code),technical:error.message||String(error),rows:[]}}const rows=(data||[]).map(r=>({ageDays:r.age_days==null?null:Number(r.age_days),value:r.metric_value==null?null:Number(r.metric_value),createdAt:r.created_at,evaluationDate:r.evaluation_date||null,weekNumber:r.week_number==null?null:Number(r.week_number)})).filter(r=>r.value!=null&&Number.isFinite(r.value));if(!rows.length)return{ok:false,code:"metric_unavailable",message:benchmarkDiagnostic("metric_unavailable"),rows:[]};return{ok:true,code:null,message:null,rows}}catch(error){const code=benchmarkErrorCode(error);return{ok:false,code,message:benchmarkDiagnostic(code),technical:error?.message||String(error),rows:[]}}}

/* =========================================================
   UNIFIED AGE + REPORT ACCESS BRIDGE
   RLS remains the authoritative database boundary.
========================================================= */
function adineParseDate(value){if(!value)return null;const d=value instanceof Date?value:new Date(value);return Number.isNaN(d.getTime())?null:d}
function adineAgeDays(flock,evaluationDate){const placement=adineParseDate(flock?.placement_date);const evalDate=adineParseDate(evaluationDate);const start=Number(flock?.start_age_days);if(!placement||!evalDate||!Number.isFinite(start))return null;const a=new Date(Date.UTC(placement.getUTCFullYear(),placement.getUTCMonth(),placement.getUTCDate()));const b=new Date(Date.UTC(evalDate.getUTCFullYear(),evalDate.getUTCMonth(),evalDate.getUTCDate()));return Math.max(0,Math.trunc(start+((b-a)/86400000)))}
function adineRecordAge(record,flock){const derived=adineAgeDays(flock,record?.evaluation_date||record?.record_date);if(derived!=null)return derived;const stored=Number(record?.age_days);return Number.isFinite(stored)?stored:null}
window.AdineAge={calculate:adineAgeDays,recordAge:adineRecordAge};

function installReportAccessBridge(){
  if(typeof window==="undefined"||!window.supabaseClient)return;
  if(typeof window.getReportFlock==="function"){
    window.getReportFlock=async function(flockId){
      if(!flockId)return null;
      const {data,error}=await supabaseClient.from("flocks").select("*, farms(id,name), houses(id,name)").eq("id",flockId).maybeSingle();
      if(error)throw error;
      if(!data)return null;
      if(window.AdineAccess?.canAccessFarm&&data.farm_id){const allowed=await window.AdineAccess.canAccessFarm(data.farm_id);if(!allowed)return null;}
      window.__adineReportFlockContext=data;return data;
    };
  }
  if(typeof window.normalizeReportRecord==="function"){
    const legacy=window.normalizeReportRecord;
    window.normalizeReportRecord=function(record){const normalized=legacy(record);const age=adineRecordAge(record,window.__adineReportFlockContext);if(age!=null)normalized.ageDays=age;return normalized;};
  }
}
if(typeof window!=="undefined"){
  window.INTERNAL_BENCHMARK_VERSION=INTERNAL_BENCHMARK_VERSION;
  window.benchmarkDiagnostic=benchmarkDiagnostic;
  window.getInternalBenchmark=getInternalBenchmark;
  window.getFlockMetricHistory=getFlockMetricHistory;
  window.benchmarkPosition=benchmarkPosition;
  window.setTimeout(installReportAccessBridge,0);
  window.addEventListener("DOMContentLoaded",installReportAccessBridge,{once:true});
}
