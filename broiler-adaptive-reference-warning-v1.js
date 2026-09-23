/* ADINE — REFERENCE-RELATIVE ADAPTIVE WARNING V1
   Additive safety layer. Does not replace canonical calculations, navigation,
   report routing, FCR engine, or existing PI state. All broiler reference
   resolution is delegated to BROILER_OFFICIAL_STANDARDS_V1.
*/
(function(g){
'use strict';
if(g.__ADINE_ADAPTIVE_REFERENCE_WARNING_V1__)return;
g.__ADINE_ADAPTIVE_REFERENCE_WARNING_V1__=true;
const VERSION='ADAPTIVE-REFERENCE-WARNING-V1.0';
const METRICS=['weight','adg','fcr','cumulativeFcr','mortality','cv','u10','u15','epef'];
const LABEL={weight:'وزن',adg:'افزایش وزن روزانه',fcr:'FCR هفتگی',cumulativeFcr:'FCR تجمعی',mortality:'تلفات',cv:'CV',u10:'یکنواختی ±۱۰٪',u15:'یکنواختی ±۱۵٪',epef:'EPEF'};
const LOWER=new Set(['fcr','cumulativeFcr','mortality','cv']);
const aliases={weight:['weight','average_weight_g','average_weight'],adg:['weeklyWeightGain','weekly_gain_g','adg','average_daily_gain'],fcr:['fcr','weekly_fcr'],cumulativeFcr:['cumulativeFcr','cumulative_fcr'],mortality:['mortalityPercent','mortality','mortality_rate'],cv:['cv','cv_percent'],u10:['uniformity10','uniformity_10_percent','uniformity_10'],u15:['uniformity15','uniformity_15_percent','uniformity_15'],epef:['epef','EPEF','pef']};
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
function actual(r,m){for(const k of aliases[m]||[]){const x=n(r?.[k]);if(x!==null)return x}return null}
function median(a){const x=a.filter(Number.isFinite).slice().sort((a,b)=>a-b);if(!x.length)return null;const i=(x.length-1)/2,b=Math.floor(i),f=i-b;return x[b]+(x[b+1]-x[b]||0)*f}
function reference(strain,age,m){
 const fn=g.broilerCanonicalMetricTarget;if(typeof fn!=='function')return null;
 const q=fn(strain,age,m);if(!q||n(q.value)===null)return null;
 return {value:n(q.value),age:q.standardAgeDays??null,sourceType:q.sourceType||null,sourceLabel:q.sourceLabel||'استاندارد کاننیکال'};
}
function gap(a,t,m){a=n(a);t=n(t);if(a===null||t===null||t===0)return null;return (LOWER.has(m)?(t-a):(a-t))/Math.abs(t)*100}
function calc(rows,m,strain){
 const points=[];
 for(const r of Array.isArray(rows)?rows:[]){
   const age=n(r?.age_days??r?.ageDays??r?.age);if(age===null)continue;
   const a=actual(r,m),ref=reference(strain,age,m),t=ref?.value;
   const q=gap(a,t,m);if(q===null)continue;
   points.push({age,actual:a,target:t,gapPercent:q,reference:ref});
 }
 if(!points.length)return{available:false,reason:'داده معتبر یا مرجع سنی معتبر وجود ندارد',metric:m};
 const current=points.at(-1),history=points.slice(0,-1);
 if(history.length<4)return{available:false,reason:'برای هشدار تطبیقی حداقل ۴ ارزیابی قبلی لازم است',metric:m,pointsUsed:history.length,currentGapPercent:current.gapPercent,currentReference:current.reference,minimumPriorEvaluations:4};
 const base=history.map(x=>x.gapPercent),center=median(base),absDev=base.map(x=>Math.abs(x-center)),mad=median(absDev)??0,sigma=Math.max(0.8,1.4826*mad);
 const currentResidual=current.gapPercent-center;
 const controlLimit=Math.max(3,3*sigma);
 let ewma=center;const lambda=.30;for(const v of base)ewma=lambda*v+(1-lambda)*ewma;
 const ewmaCurrent=lambda*current.gapPercent+(1-lambda)*ewma;
 const ewmaLimit=Math.max(2.5*sigma,2);
 let pos=0,neg=0;const k=.5*sigma;for(const v of [...base,current.gapPercent].slice(-6)){const z=v-center;pos=Math.max(0,pos+z-k);neg=Math.min(0,neg+z+k)}
 const cusumLimit=Math.max(4*sigma,4), negativeShift=neg < -cusumLimit;
 const pointWarning=currentResidual < -controlLimit;
 const ewmaWarning=ewmaCurrent < center-ewmaLimit;
 const confirmed=(pointWarning?1:0)+(ewmaWarning?1:0)+(negativeShift?1:0)>=2 || (negativeShift&&currentResidual<0);
 const state=confirmed?'warning':(pointWarning||ewmaWarning||negativeShift?'watch':'normal');
 return{available:true,metric:m,label:LABEL[m],pointsUsed:history.length+1,minimumPriorEvaluations:4,currentGapPercent:current.gapPercent,baselineMedianPercent:center,madPercent:mad,robustSigmaPercent:sigma,currentResidualPercent:currentResidual,controlLimitPercent:controlLimit,ewmaCurrentPercent:ewmaCurrent,ewmaCenterPercent:center,ewmaLimitPercent:ewmaLimit,cusumNegative:neg,cusumLimitPercent:cusumLimit,pointWarning,ewmaWarning,cusumWarning:negativeShift,confirmed,state,reference:current.reference,history:points};
}
function build(rows,flock){
 const strain=String(flock?.strain||flock?.genetics||'').trim();
 const perMetric={};for(const m of METRICS)perMetric[m]=calc(rows,m,strain);
 const available=Object.values(perMetric).filter(x=>x.available);
 const warnings=available.filter(x=>x.state==='warning');
 const watches=available.filter(x=>x.state==='watch');
 const axes={growth:['weight','adg'],efficiency:['fcr','cumulativeFcr'],survival:['mortality'],uniformity:['cv','u10','u15'],outcome:['epef']};
 const axisSignals=Object.fromEntries(Object.entries(axes).map(([axis,ms])=>[axis,ms.filter(m=>perMetric[m]?.confirmed).map(m=>perMetric[m])]));
 const confirmedAxes=Object.entries(axisSignals).filter(([,v])=>v.length).map(([k])=>k);
 let overall='normal';if(warnings.length>=2||confirmedAxes.length>=2)overall='warning';else if(warnings.length||watches.length)overall='watch';
 return{version:VERSION,referenceAuthority:'BROILER_OFFICIAL_STANDARDS_V1',referencePolicy:'age-specific canonical standard; official breeder objective where published, otherwise canonical management reference; no raw-metric adaptive baseline',strain,metrics:perMetric,warnings,watches,confirmedAxes,axisSignals,overall,minimumDataPolicy:'monitor-only until four prior valid evaluations exist'};
}
// The adaptive module is intentionally side-effect free. The PI engine consumes its public analyzer directly.
g.AdineAdaptiveReferenceWarningV1={version:VERSION,metrics:METRICS,analyze:build,metric:calc,reference};
})(typeof window!=='undefined'?window:globalThis);
