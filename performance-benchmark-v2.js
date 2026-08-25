/* ADINE BENCHMARK V2: official/scientific registry fallback + farm historical fallback */
(function(){'use strict';
const legacy=window.getInternalBenchmark;
const metricMap={body_weight:'body_weight',fcr:'fcr_cumulative',egg_weight:'egg_weight_g',egg_production:'egg_production_pct',uniformity:'uniformity_10'};
function num(v){const x=Number(v);return Number.isFinite(x)?x:null}
function type(f){const t=String(f?.production_type||'broiler').toLowerCase();return t==='گوشتی'?'broiler':t==='تخمگذار'||t==='تخم‌گذار'?'layer':t==='مادر'||t==='مرغ مادر'?'breeder':t==='پولت'?'pullet':t}
function strain(f){return String(f?.genetics||f?.strain||'').trim()}
function stats(values){const a=values.map(num).filter(v=>v!=null).sort((x,y)=>x-y);if(!a.length)return null;const q=p=>a[Math.min(a.length-1,Math.max(0,Math.ceil(p*a.length)-1))];const med=q(.5);return{n:a.length,p25:q(.25),median:med,p75:q(.75),p10:q(.1),p90:q(.9)}}
async function registryBenchmark({flockId,metric}={}){
  const {data:flock,error:fe}=await supabaseClient.from('flocks').select('id,production_type,genetics,strain').eq('id',flockId).maybeSingle();
  if(fe||!flock)return null;
  const key=metricMap[metric]||metric;
  let q=supabaseClient.from('poultry_performance_standards').select('*').eq('production_type',type(flock)).eq('active',true).eq('metric_code',key).order('age_days',{ascending:true});
  const s=strain(flock);if(s)q=q.or(`strain.ilike.%${s}%,genetics.ilike.%${s}%`);
  const {data,error}=await q.limit(200);if(error||!data?.length)return null;
  const {data:latest}=await supabaseClient.from('weekly_records').select('age_days,evaluation_date,week_number,average_weight_g,fcr,cumulative_fcr,production_metrics').eq('flock_id',flockId).order('evaluation_date',{ascending:false}).limit(1);
  const current=latest?.[0], age=num(current?.age_days);if(age==null)return null;
  let candidates=data.filter(x=>Math.abs(Number(x.age_days)-age)<=7);if(!candidates.length)return null;candidates.sort((a,b)=>Math.abs(a.age_days-age)-Math.abs(b.age_days-age));const c=candidates[0];
  return {ok:true,version:'PERFORMANCE_REGISTRY_V2',metric,label:metric,direction:['fcr','mortality','cv'].includes(metric)?'lower':'higher',cohortLevel:'genetic_or_scientific',cohortLabel:`${c.source_type==='official'?'استاندارد رسمی':'مرجع علمی'} — ${c.strain||c.genetics||''}`,comparableFarms:0,comparableFlocks:0,comparableRecords:1,ageMin:c.age_days,ageMax:c.age_days,p10:c.lower_value??c.target_value,p25:c.lower_value??c.target_value,median:c.target_value,p75:c.upper_value??c.target_value,p90:c.upper_value??c.target_value,currentValue:metric==='body_weight'?num(current.average_weight_g):metric==='fcr'?num(current.fcr??current.cumulative_fcr):null,peerPercentile:null,peerScore:null,peerScoreUsable:false,confidenceLevel:c.confidence||'medium',confidenceLabel:c.source_type==='official'?'استاندارد رسمی':'مرجع علمی',sampleAdequate:true,sampleNote:`سن ${c.age_days} روز؛ منبع: ${c.source_name}`,diagnosticCode:null,diagnosticMessage:null,sourceType:c.source_type,sourceName:c.source_name,sourceUrl:c.source_url};
}
async function historicalBenchmark({flockId,metric}={}){
  const {data,error}=await supabaseClient.from('weekly_records').select('age_days,evaluation_date,average_weight_g,fcr,cumulative_fcr,production_metrics').eq('flock_id',flockId).order('evaluation_date',{ascending:true});if(error||!data||data.length<3)return null;
  const key=metric==='body_weight'?'average_weight_g':metric==='fcr'?'cumulative_fcr':null;if(!key)return null;const vals=data.map(x=>num(x[key]??x.fcr??x.average_weight_g)).filter(v=>v!=null);const s=stats(vals);if(!s)return null;const current=vals.at(-1);return {ok:true,version:'PERFORMANCE_REGISTRY_V2',metric,direction:['fcr','mortality','cv'].includes(metric)?'lower':'higher',cohortLevel:'farm_historical',cohortLabel:'سابقه همین گله',comparableFarms:1,comparableFlocks:1,comparableRecords:s.n,ageMin:num(data[0].age_days),ageMax:num(data.at(-1).age_days),p10:s.p10,p25:s.p25,median:s.median,p75:s.p75,p90:s.p90,currentValue:current,peerPercentile:null,peerScore:null,peerScoreUsable:false,confidenceLevel:s.n>=8?'medium':'low',confidenceLabel:s.n>=8?'سابقه قابل استفاده':'سابقه محدود',sampleAdequate:s.n>=3,sampleNote:`${s.n} رکورد از سابقه همین گله`,diagnosticCode:null,diagnosticMessage:null};
}
window.getInternalBenchmark=async function(args={}){let legacyResult=null;try{if(typeof legacy==='function')legacyResult=await legacy(args)}catch(e){legacyResult=null}if(legacyResult?.ok)return legacyResult;try{const reg=await registryBenchmark(args);if(reg)return reg;const hist=await historicalBenchmark(args);if(hist)return hist}catch(e){console.warn('Performance registry fallback:',e)}return legacyResult||{ok:false,code:'metric_unavailable',message:'برای این شاخص هنوز مرجع معتبر یا سابقه کافی وجود ندارد.'};};
window.AdinePerformanceBenchmark={registryBenchmark,historicalBenchmark};
})();
