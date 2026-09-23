/* ADINE — REFERENCE-RELATIVE ADAPTIVE WARNING V2
   Additive safety layer. Keeps canonical references, routing, PI state and
   existing calculations intact. Adds direction-aware trend interpretation,
   persistence, severity and multi-axis confirmation.
*/
(function(g){
'use strict';
if(g.__ADINE_ADAPTIVE_REFERENCE_WARNING_V2__)return;
g.__ADINE_ADAPTIVE_REFERENCE_WARNING_V2__=true;
const VERSION='ADAPTIVE-REFERENCE-WARNING-V2.0';
const METRICS=['weight','adg','fcr','cumulativeFcr','mortality','cv','u10','u15','epef'];
const LABEL={weight:'وزن',adg:'افزایش وزن روزانه',fcr:'FCR هفتگی',cumulativeFcr:'FCR تجمعی',mortality:'تلفات',cv:'CV',u10:'یکنواختی ±۱۰٪',u15:'یکنواختی ±۱۵٪',epef:'EPEF'};
const LOWER=new Set(['fcr','cumulativeFcr','mortality','cv']);
const aliases={weight:['weight','average_weight_g','average_weight'],adg:['adg','average_daily_gain','dailyWeightGain'],fcr:['fcr','weekly_fcr'],cumulativeFcr:['cumulativeFcr','cumulative_fcr'],mortality:['mortalityPercent','mortality','mortality_rate'],cv:['cv','cv_percent'],u10:['uniformity10','uniformity_10_percent','uniformity_10'],u15:['uniformity15','uniformity_15_percent','uniformity_15'],epef:['epef','EPEF','pef']};
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
function actual(r,m){
 if(m==='adg'){for(const k of ['average_daily_gain','dailyWeightGain']){const x=n(r?.[k]);if(x!==null)return x}for(const k of ['weeklyWeightGain','weekly_gain_g','adg']){const x=n(r?.[k]);if(x!==null)return x/7}return null}
 for(const k of aliases[m]||[]){const x=n(r?.[k]);if(x!==null)return x}return null;
}
function median(a){const x=a.filter(Number.isFinite).slice().sort((a,b)=>a-b);if(!x.length)return null;const i=(x.length-1)/2,b=Math.floor(i),f=i-b;return x[b]+(x[b+1]-x[b]||0)*f}
function reference(strain,age,m){const fn=g.broilerCanonicalMetricTarget;if(typeof fn!=='function')return null;const q=fn(strain,age,m);if(!q||n(q.value)===null)return null;return{value:n(q.value),age:q.standardAgeDays??null,sourceType:q.sourceType||null,sourceLabel:q.sourceLabel||'استاندارد کاننیکال'}}
function gap(a,t,m){a=n(a);t=n(t);if(a===null||t===null||t===0)return null;return(LOWER.has(m)?(t-a):(a-t))/Math.abs(t)*100}
function calc(rows,m,strain){
 const points=[];
 for(const r of Array.isArray(rows)?rows:[]){const age=n(r?.age_days??r?.ageDays??r?.age);if(age===null)continue;const a=actual(r,m),ref=reference(strain,age,m),q=gap(a,ref?.value,m);if(q===null)continue;points.push({age,actual:a,target:ref.value,gapPercent:q,reference:ref})}
 if(!points.length)return{available:false,reason:'داده معتبر یا مرجع سنی معتبر وجود ندارد',metric:m};
 const current=points.at(-1),history=points.slice(0,-1);
 if(history.length<4)return{available:false,reason:'برای هشدار تطبیقی حداقل ۴ ارزیابی قبلی لازم است',metric:m,pointsUsed:history.length,currentGapPercent:current.gapPercent,currentReference:current.reference,minimumPriorEvaluations:4};
 const base=history.map(x=>x.gapPercent),center=median(base),mad=median(base.map(x=>Math.abs(x-center)))??0,sigma=Math.max(.8,1.4826*mad);
 const currentResidual=current.gapPercent-center;
 const controlLimit=Math.max(3,3*sigma);
 let ewma=center;const lambda=.30;for(const v of base)ewma=lambda*v+(1-lambda)*ewma;
 const ewmaCurrent=lambda*current.gapPercent+(1-lambda)*ewma,ewmaLimit=Math.max(2.5*sigma,2);
 let neg=0;const k=.5*sigma;for(const v of [...base,current.gapPercent].slice(-6)){const z=v-center;neg=Math.min(0,neg+z+k)}
 const cusumLimit=Math.max(4*sigma,4),cusumWarning=neg < -cusumLimit;
 const pointWarning=currentResidual < -controlLimit,ewmaWarning=ewmaCurrent < center-ewmaLimit;
 const confirmed=(pointWarning?1:0)+(ewmaWarning?1:0)+(cusumWarning?1:0)>=2 || (cusumWarning&&currentResidual<0);
 const recent=points.slice(-Math.min(4,points.length)).map(x=>x.gapPercent);
 const prior=recent.slice(0,-1),recentMean=recent.reduce((a,b)=>a+b,0)/recent.length,priorMean=prior.length?prior.reduce((a,b)=>a+b,0)/prior.length:null;
 const trendDelta=priorMean===null?null:recentMean-priorMean;
 const direction=trendDelta===null?'insufficient':trendDelta>.75?'improving':trendDelta<-.75?'worsening':'stable';
 const worseningCount=recent.slice(1).reduce((c,v,i)=>c+(v<recent[i]-.25?1:0),0);
 const improvingCount=recent.slice(1).reduce((c,v,i)=>c+(v>recent[i]+.25?1:0),0);
 const severity=confirmed?(Math.abs(currentResidual)>=Math.max(2*controlLimit,8)?'critical':'warning'):(pointWarning||ewmaWarning||cusumWarning?'watch':'normal');
 const state=severity==='critical'?'critical':severity==='warning'?'warning':severity==='watch'?'watch':direction==='improving'?'improving':'normal';
 return{available:true,metric:m,label:LABEL[m],pointsUsed:points.length,minimumPriorEvaluations:4,currentGapPercent:current.gapPercent,baselineMedianPercent:center,madPercent:mad,robustSigmaPercent:sigma,currentResidualPercent:currentResidual,controlLimitPercent:controlLimit,ewmaCurrentPercent:ewmaCurrent,ewmaCenterPercent:center,ewmaLimitPercent:ewmaLimit,cusumNegative:neg,cusumLimitPercent:cusumLimit,pointWarning,ewmaWarning,cusumWarning,confirmed,state,severity,direction,trendDeltaPercent:trendDelta,recentMeanPercent:recentMean,improvingCount,worseningCount,reference:current.reference,history:points};
}
function build(rows,flock){
 const strain=String(flock?.strain||flock?.genetics||'').trim(),perMetric={};for(const m of METRICS)perMetric[m]=calc(rows,m,strain);
 const available=Object.values(perMetric).filter(x=>x.available),warnings=available.filter(x=>x.severity==='warning'||x.severity==='critical'),watches=available.filter(x=>x.severity==='watch');
 const axes={growth:['weight','adg'],efficiency:['fcr','cumulativeFcr'],survival:['mortality'],uniformity:['cv','u10','u15'],outcome:['epef']};
 const axisSignals=Object.fromEntries(Object.entries(axes).map(([axis,ms])=>[axis,ms.filter(m=>perMetric[m]?.confirmed).map(m=>perMetric[m])]));
 const confirmedAxes=Object.entries(axisSignals).filter(([,v])=>v.length).map(([k])=>k);
 const worsening=available.filter(x=>x.direction==='worsening').length,improving=available.filter(x=>x.direction==='improving').length;
 let overall='normal',severity='normal';
 if(warnings.some(x=>x.severity==='critical')||warnings.length>=2||confirmedAxes.length>=2){overall='warning';severity=warnings.some(x=>x.severity==='critical')?'critical':'warning'}
 else if(warnings.length||watches.length){overall='watch';severity='watch'}
 else if(improving>=2&&worsening===0){overall='improving';severity='improving'}
 const trend=improving>worsening?'improving':worsening>improving?'worsening':'stable';
 const stateLabel={normal:'عادی',improving:'روند بهبود',watch:'نیازمند پایش',warning:'هشدار عملکردی',critical:'هشدار جدی'}[severity];
 const summary=overall==='improving'?'چند شاخص در ارزیابی‌های اخیر در جهت مطلوب حرکت کرده‌اند، بدون شواهد کافی از افت هم‌زمان.':overall==='watch'?'انحراف یا روند نامطلوب مشاهده شده است، اما شواهد هنوز برای هشدار عملکردی قوی کافی نیست.':overall==='warning'?'انحراف عملکردی معنی‌دار و/یا تکرارشونده در یک یا چند محور عملکرد دیده می‌شود.':overall==='normal'?'انحراف غیرعادی یا روند نگران‌کننده‌ای نسبت به الگوی تاریخی گله شناسایی نشد.':'انحراف شدید یا چندمحوری با شواهد کافی برای هشدار جدی شناسایی شده است.';
 return{version:VERSION,referenceAuthority:'BROILER_OFFICIAL_STANDARDS_V1',referencePolicy:'age-specific canonical standard; no raw-metric adaptive baseline',strain,metrics:perMetric,warnings,watches,confirmedAxes,axisSignals,overall,severity,stateLabel,trend,summary,improvingMetrics:improving,worseningMetrics:worsening,minimumDataPolicy:'monitor-only until four prior valid evaluations exist'};
}
g.AdineAdaptiveReferenceWarningV1={version:VERSION,metrics:METRICS,analyze:build,metric:calc,reference};
})(typeof window!=='undefined'?window:globalThis);
