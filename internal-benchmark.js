/* =========================================================
   ADINE POULTRY HEALTH CENTER
   INTERNAL PEER BENCHMARK V6
   ========================================================= */
"use strict";

const INTERNAL_BENCHMARK_VERSION="2026.4";

function benchmarkMetricLabel(metric){return({body_weight:"وزن بدن",fcr:"FCR",mortality:"تلفات",uniformity:"یکنواختی ±۱۰٪",cv:"CV",egg_production:"تولید تخم",egg_weight:"وزن تخم",fertility:"نطفه‌داری",hatchability:"جوجه‌درآوری"})[metric]||metric}
function benchmarkDirection(metric){return["fcr","mortality","cv"].includes(metric)?"lower":["uniformity","egg_production","fertility","hatchability"].includes(metric)?"higher":"context"}
function benchmarkConfidenceLabel(level){return({insufficient:"داده ناکافی",initial:"بنچمارک اولیه",reliable:"بنچمارک قابل اتکا",stable:"بنچمارک پایدار"})[level]||"—"}
function benchmarkDiagnostic(code){return({rpc_missing:"سرویس بنچمارک در پایگاه‌داده در دسترس نیست.",access_denied:"این فارم یا گله برای حساب فعلی قابل مشاهده نیست.",age_unavailable:"سن واقعی گله برای مقایسه قابل محاسبه نیست.",insufficient_comparable_farms:"تعداد فارم‌های قابل مقایسه برای بنچمارک کافی نیست.",metric_unavailable:"شاخص انتخاب‌شده برای این گله داده قابل مقایسه ندارد.",database_error:"خطا در ارتباط با پایگاه‌داده بنچمارک."})[code]||"اطلاعات بنچمارک در دسترس نیست."}
function benchmarkPosition(b){
 if(!b||b.currentValue==null||!Number.isFinite(b.currentValue))return{key:"none",label:"قابل مقایسه نیست"};
 if(b.direction==="context")return{key:"context",label:"مقایسه توزیعی"};
 const v=b.currentValue;
 if(b.direction==="higher")return v>=b.p75?{key:"top25",label:"جزو ۲۵٪ برتر"}:v>=b.median?{key:"aboveMedian",label:"بهتر از میانه"}:v>=b.p25?{key:"belowMedian",label:"پایین‌تر از میانه"}:{key:"bottom25",label:"نیازمند توجه"};
 return v<=b.p25?{key:"top25",label:"جزو ۲۵٪ برتر"}:v<=b.median?{key:"aboveMedian",label:"بهتر از میانه"}:v<=b.p75?{key:"belowMedian",label:"پایین‌تر از میانه"}:{key:"bottom25",label:"نیازمند توجه"};
}
function normalizeBenchmarkRow(row,metric){
 const num=k=>row[k]==null?null:Number(row[k]);
 return{version:INTERNAL_BENCHMARK_VERSION,metric,label:benchmarkMetricLabel(metric),direction:row.direction||benchmarkDirection(metric),cohortLevel:row.cohort_level,cohortLabel:row.cohort_label,comparableFarms:Number(row.comparable_farms||0),comparableFlocks:Number(row.comparable_flocks||0),comparableRecords:Number(row.comparable_records||0),ageMin:num("age_min"),ageMax:num("age_max"),p10:num("p10"),p25:num("p25"),median:num("median"),p75:num("p75"),p90:num("p90"),currentValue:num("current_value"),peerPercentile:num("peer_percentile"),peerScore:num("peer_score"),peerScoreUsable:!!row.peer_score_usable,confidenceLevel:row.confidence_level||"insufficient",confidenceLabel:row.confidence_label||benchmarkConfidenceLabel(row.confidence_level),sampleAdequate:!!row.sample_adequate,sampleNote:row.sample_note||"",selfMedian:num("self_median"),selfPrevious:num("self_previous"),selfChangePct:num("self_change_pct"),diagnosticCode:row.diagnostic_code||null,diagnosticMessage:row.diagnostic_message||null};
}
async function getInternalBenchmark({flockId,metric,ageWindowDays=7}={}){
 if(!window.supabaseClient||!flockId||!metric)return{ok:false,code:"database_error",message:benchmarkDiagnostic("database_error")};
 try{
  const{data,error}=await supabaseClient.rpc("get_flock_benchmark_v6",{p_flock_id:flockId,p_metric:metric,p_age_window_days:Math.max(0,Math.min(30,Number(ageWindowDays)||7))});
  if(error){
   const code=/function .* does not exist|42883/i.test(error.message||"")?"rpc_missing":/permission|denied|not authorized|42501/i.test(error.message||"")?"access_denied":"database_error";
   return{ok:false,code,message:benchmarkDiagnostic(code),technical:error.message||String(error)};
  }
  const row=Array.isArray(data)?data[0]:data;
  if(!row)return{ok:false,code:"metric_unavailable",message:benchmarkDiagnostic("metric_unavailable")};
  const result=normalizeBenchmarkRow(row,metric);
  if(result.diagnosticCode){result.ok=false;result.code=result.diagnosticCode;result.message=result.diagnosticMessage||benchmarkDiagnostic(result.code);return result}
  if(!result.ageMin&&result.currentValue==null)return{...result,ok:false,code:"age_unavailable",message:benchmarkDiagnostic("age_unavailable")};
  if(result.comparableFarms<3||result.comparableRecords<3)return{...result,ok:false,code:"insufficient_comparable_farms",message:benchmarkDiagnostic("insufficient_comparable_farms")};
  if(result.currentValue==null)return{...result,ok:false,code:"metric_unavailable",message:benchmarkDiagnostic("metric_unavailable")};
  return{...result,ok:true,code:null,message:null};
 }catch(error){return{ok:false,code:"database_error",message:benchmarkDiagnostic("database_error"),technical:error?.message||String(error)}}
}
async function getFlockMetricHistory({flockId,metric,limit=12}={}){
 if(!window.supabaseClient||!flockId||!metric)return[];
 try{
  const{data,error}=await supabaseClient.rpc("get_flock_metric_history_v6",{p_flock_id:flockId,p_metric:metric,p_limit:Math.max(1,Math.min(100,Number(limit)||12))});
  if(error)return[];
  return(data||[]).map(r=>({ageDays:r.age_days==null?null:Number(r.age_days),value:r.metric_value==null?null:Number(r.metric_value),createdAt:r.created_at,evaluationDate:r.evaluation_date||null,weekNumber:r.week_number==null?null:Number(r.week_number)})).filter(r=>Number.isFinite(r.value));
 }catch(_){return[]}
}
window.INTERNAL_BENCHMARK_VERSION=INTERNAL_BENCHMARK_VERSION;
window.benchmarkDiagnostic=benchmarkDiagnostic;
window.getInternalBenchmark=getInternalBenchmark;
window.getFlockMetricHistory=getFlockMetricHistory;
window.benchmarkPosition=benchmarkPosition;
