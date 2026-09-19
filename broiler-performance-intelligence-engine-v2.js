/* ADINE — BROILER PERFORMANCE INTELLIGENCE ENGINE V6.3 — MULTIVARIATE + SMART TREND V3.5 */
(function(global){'use strict';
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
const first=(r,ks)=>{for(const k of ks){const x=n(r?.[k]);if(x!==null)return x}return null};
const lower=new Set(['fcr','cumulativeFcr','mortality','cv','wfr']);
const defs={weight:{a:['weight','average_weight_g','average_weight']},fcr:{a:['fcr']},cumulativeFcr:{a:['cumulativeFcr','cumulative_fcr']},adg:{a:['weeklyWeightGain','weekly_gain_g','adg','average_daily_gain']},mortality:{a:['mortalityPercent','mortality','mortality_rate']},cv:{a:['cv','cv_percent']},u10:{a:['uniformity10','uniformity_10_percent','uniformity_10']},u15:{a:['uniformity15','uniformity_15_percent','uniformity_15']},feed:{a:['feedPerBirdDay','feed_per_bird_day','feedNormalized','feed_normalized','feed']},water:{a:['waterPerBirdDay','water_per_bird_day','waterNormalized','water_normalized','water']},wfr:{a:['waterFeedRatio','water_feed_ratio']},epef:{a:['epef','EPEF','pef']}};
function actual(r,m){
  const direct=first(r,defs[m].a);
  if(direct!==null)return direct;
  if(m==='epef'){
    const weight=first(r,['weight','average_weight_g','average_weight']);
    const age=first(r,['age','age_days','ageDays']);
    const fcr=first(r,['cumulativeFcr','cumulative_fcr','fcr']);
    const mortality=first(r,['mortalityPercent','mortality','mortality_rate']);
    if(weight!==null&&age!==null&&fcr!==null&&fcr>0&&mortality!==null){
      const liveability=100-mortality;
      return liveability*(weight/1000)/(age*fcr)*100;
    }
  }
  return null;
}
function target(r,m){const ct=r?.canonicalTargets?.[m];if(n(ct)!==null)return n(ct);const k={weight:'standardWeight',fcr:'officialWeeklyFcr',cumulativeFcr:'officialCumulativeFcr',adg:'standardWeeklyWeightGain',cv:'standardCv',u10:'standardUniformity10',u15:'standardUniformity15'}[m];return k?first(r,[k]):null}
function referenceMeta(r,m,strain){
 const mt=r?.metricTargets?.[m]||null;
 const value=target(r,m);
 const standardAge=n(r?.standardAgeDays)??n(r?.age);
 const actualAge=n(r?.age);
 const sourceLabel=mt?.sourceLabel||r?.targetSourceLabel||'استاندارد عملکرد گوشتی';
 const sourceType=mt?.sourceType||r?.targetSourceType||null;
 const targetType=mt?.targetType||null;
 const isManagement=String(targetType||sourceType||'').toLowerCase().includes('management');
 const basis=isManagement?'استاندارد مدیریتی':'استاندارد رسمی';
 const strainText=strain?(' — سویه '+strain):'';
 const ageText=standardAge===null?'':(' — سن مرجع '+standardAge+' روز');
 const windowText=(r?.ageWindowApplied&&actualAge!==null&&standardAge!==null&&actualAge!==standardAge)?(' (سن ارزیابی '+actualAge+' روز؛ نزدیک‌ترین نقطه معتبر استاندارد)'):'';
 return {value,sourceLabel,sourceType,targetType,basis,strain,standardAgeDays:standardAge,actualAgeDays:actualAge,ageWindowApplied:!!r?.ageWindowApplied,label:basis+strainText+ageText+windowText};
}
function gap(a,t,m){a=n(a);t=n(t);if(a===null||t===null||t===0)return null;return lower.has(m)?(t-a)/Math.abs(t):(a-t)/Math.abs(t)}
function state(a,t,m){const g=gap(a,t,m);if(g===null)return{status:'unavailable',current:n(a),target:n(t),gap:null,gapPercent:null,deviation:null,direction:lower.has(m)?'lower':'higher'};if(m==='cv'){const x=n(a);const boundary=10;if(x===null)return{status:'unavailable',current:null,target:n(t),gap:null,gapPercent:null,deviation:null,direction:'lower',statusBoundary:boundary,statusBoundaryType:'operational-upper-limit'};let status=x<=8?'excellent':x<=boundary?'good':x<=12?'watch':'critical';return{status,current:x,target:n(t),gap:g,gapPercent:g*100,deviation:(x-n(t))/Math.abs(n(t))*100,direction:'lower',statusBoundary:boundary,statusBoundaryType:'operational-upper-limit'}}if(m==='epef'){const x=n(a);let status='critical';if(x>=505)status='excellent';else if(x>=450)status='good';else if(x>=430)status='on_target';else if(x>=400)status='watch';return{status,current:x,target:n(t),gap:g,gapPercent:g*100,deviation:(x-n(t))/Math.abs(n(t))*100,direction:'higher',thresholds:{excellent:505,good:450,on_target:430,watch:400}}}const p=g*100;return{status:p>7?'excellent':p>3?'good':p>=-3?'on_target':p>=-7?'watch':'critical',current:n(a),target:n(t),gap:g,gapPercent:p,deviation:(n(a)-n(t))/Math.abs(n(t))*100,direction:lower.has(m)?'lower':'higher'}}
function trend(rows,m,strain){
 const usable=rows.map(r=>({r,actual:actual(r,m),g:gap(actual(r,m),target(r,m),m),reference:referenceMeta(r,m,strain)})).filter(x=>x.actual!==null&&x.g!==null);
 if(usable.length<2)return{available:false,direction:'insufficient',movement:'insufficient',pointsUsed:usable.length,reference:usable.at(-1)?.reference||null};
 const z=usable.slice(-Math.min(5,usable.length)), actualVals=z.map(x=>x.actual), lowerIsBetter=['fcr','cumulativeFcr','mortality','cv'].includes(m);
 const directionalVals=actualVals.map(v=>lowerIsBetter?-v:v), reg=robustRegression(directionalVals);
 const a=z.at(-1),b=z.at(-2),currentDirectional=directionalVals.at(-1),previousDirectional=directionalVals.at(-2),d=currentDirectional-previousDirectional;
 const noise=reg?.residualMad??0, slopeThreshold=Math.max(lowerIsBetter?.001:.5,noise), slope=reg?.slope??d;
 const performanceDirection=Math.abs(slope)<slopeThreshold?'stable':slope>0?'improving':'worsening';
 const currentGap=z.at(-1).g*100,previousGap=z.at(-2).g*100,distanceDelta=Math.abs(currentGap)-Math.abs(previousGap),gapDelta=currentGap-previousGap;
 let movement='stable';
 if(Math.abs(gapDelta)>=.5){
   if(currentGap>=0&&previousGap>=0)movement=gapDelta>0?'better_farther':'closer';
   else if(currentGap<=0&&previousGap<=0)movement=gapDelta>0?'closer':'worse_farther';
   else movement=currentGap>0?'crossed_to_better':'crossed_to_worse';
 }
 return{available:true,pointsUsed:z.length,direction:performanceDirection,performanceDirection,movement,currentGapPercent:currentGap,previousGapPercent:previousGap,distanceDeltaPercent:distanceDelta,performanceGapDeltaPercent:gapDelta,slopePerEvaluation:slope,slopeThresholdPercent:slopeThreshold,residualMadPercent:noise,reference:a.reference,lowerIsBetter};
}
function weights(r){const c=[r?.weights,r?.sample_weights,r?.sampleWeights,r?.weight_samples,r?.raw?.weights,r?.raw?.sample_weights,r?.raw?.sampleWeights,r?.raw?.weight_samples,r?.production_metrics?.weights,r?.raw?.production_metrics?.weights];for(let v of c){if(typeof v==='string'){try{v=JSON.parse(v)}catch(_){v=null}}if(v&&typeof v==='object'&&!Array.isArray(v))v=v.weights||v.values||v.samples;if(Array.isArray(v)){const o=v.map(n).filter(x=>x!==null&&x>0);if(o.length)return o}}return[]}
function band(r,w){const t=target(r,'weight');if(t===null||!w.length)return null;const c10=w.filter(x=>x>=t*.9&&x<=t*1.1).length,c15=w.filter(x=>x>=t*.85&&x<=t*1.15).length;return{referenceWeight:t,sampleCount:w.length,within10:c10,between10and15:Math.max(0,c15-c10),outside15:Math.max(0,w.length-c15),within10Percent:c10*100/w.length,between10and15Percent:Math.max(0,c15-c10)*100/w.length,outside15Percent:Math.max(0,w.length-c15)*100/w.length}}
function distribution(w,t){if(!w.length)return null;const s=[...w].sort((a,b)=>a-b),mean=w.reduce((a,b)=>a+b,0)/w.length,sd=Math.sqrt(w.reduce((a,b)=>a+(b-mean)**2,0)/w.length),q=p=>{const i=(s.length-1)*p,b=Math.floor(i),f=i-b;return s[b]+(s[b+1]-s[b]||0)*f};return{mean,sd,cv:mean?sd/mean*100:null,min:s[0],max:s.at(-1),median:q(.5),p10:q(.1),p90:q(.9),centerGapPercent:t?(mean-t)/t*100:null}}
function adaptive(rows,m){const p=rows.map(r=>gap(actual(r,m),target(r,m),m)).filter(x=>x!==null).map(x=>x*100);if(p.length<4)return{available:false,reason:'برای هشدار تطبیقی اولیه حداقل ۴ ارزیابی لازم است',pointsUsed:Math.max(0,p.length-1),minimumEvaluations:4};const h=p.slice(0,-1).sort((a,b)=>a-b),med=h[Math.floor(h.length/2)],dev=h.map(x=>Math.abs(x-med)).sort((a,b)=>a-b),mad=dev[Math.floor(dev.length/2)]||0,limit=Math.max(3,3*1.4826*mad),cur=p.at(-1);return{available:true,currentGapPercent:cur,baselineMedianPercent:med,mad,controlLimitPercent:limit,anomaly:Math.abs(cur-med)>limit,pointsUsed:h.length,minimumEvaluations:4,mode:p.length>=5?'stable-adaptive':'early-adaptive'}}
function median(a){const x=a.filter(v=>Number.isFinite(v)).slice().sort((p,q)=>p-q);if(!x.length)return null;const i=(x.length-1)/2,b=Math.floor(i),f=i-b;return x[b]+(x[b+1]-x[b]||0)*f}
function robustRegression(values){const y=values.filter(v=>Number.isFinite(v));if(y.length<3)return null;const slopes=[];for(let i=0;i<y.length;i++)for(let j=i+1;j<y.length;j++)slopes.push((y[j]-y[i])/(j-i));const slope=median(slopes)||0,intercepts=y.map((v,i)=>v-slope*i),intercept=median(intercepts),fitted=y.map((_,i)=>intercept+slope*i),res=y.map((v,i)=>v-fitted[i]),mad=median(res.map(Math.abs))||0;return{slope,intercept,points:y.length,nextGapPercent:intercept+slope*y.length,residualMad:mad,residualBand:Math.max(.8,1.4826*mad*1.96)}}
function forecast(rows,m){
 const vals=rows.map(r=>({actual:actual(r,m),gap:gap(actual(r,m),target(r,m),m)})).filter(x=>x.actual!==null&&x.gap!==null).slice(-5);
 if(vals.length<3)return{available:false,reason:'حداقل ۳ ارزیابی معتبر لازم است'};
 const lowerIsBetter=['fcr','cumulativeFcr','mortality','cv'].includes(m),directionalVals=vals.map(x=>lowerIsBetter?-x.actual:x.actual),reg=robustRegression(directionalVals);
 if(!reg)return{available:false,reason:'حداقل ۳ ارزیابی معتبر لازم است'};
 const gapVals=vals.map(x=>x.gap*100),gapReg=robustRegression(gapVals),cur=gapVals.at(-1),next=gapReg?.nextGapPercent??cur,delta=next-cur;
 const slope=reg.slope??0,threshold=Math.max(lowerIsBetter?.001:.5,reg.residualMad??0),direction=Math.abs(slope)<threshold?'stable':slope>0?'improving':'worsening';
 return{available:true,pointsUsed:vals.length,slopePerEvaluation:slope,currentGapPercent:cur,projectedGapPercent:next,changePercent:delta,uncertaintyPercent:gapReg?.residualBand??null,direction,risk:direction==='worsening'?'watch':direction==='improving'?'improve':'stable',conditional:true,method:'raw-direction-aware + normalized-gap-forecast',lowerIsBetter};
}
function series(rows,m,strain){return rows.map((r,i)=>{const a=actual(r,m),t=target(r,m),g=gap(a,t,m);return{index:i,week:first(r,['week','week_number','production_week']),age:first(r,['age','age_days','ageDays']),actual:a,target:t,gapPercent:g===null?null:g*100,reference:referenceMeta(r,m,strain)}}).filter(x=>x.gapPercent!==null).slice(-8)}
function adaptive(rows,m){const p=rows.map(r=>gap(actual(r,m),target(r,m),m)).filter(x=>x!==null).map(x=>x*100);if(p.length<4)return{available:false,reason:'برای خط پایه تطبیقی حداقل ۴ ارزیابی لازم است',pointsUsed:p.length,minimumEvaluations:4};const base=p.slice(0,-1),med=median(base),mad=median(base.map(x=>Math.abs(x-med)))||0,sigma=Math.max(.8,1.4826*mad),limit=Math.max(3,3*sigma),cur=p.at(-1),residual=cur-med;let ewma=base[0];const lambda=.3;for(let i=1;i<base.length;i++)ewma=lambda*base[i]+(1-lambda)*ewma;const ewmaNow=lambda*cur+(1-lambda)*ewma,ewmaAnomaly=Math.abs(ewmaNow-med)>2.5*sigma;let pos=0,neg=0;const k=.5*sigma;for(const v of p.slice(-Math.min(6,p.length))){const z=v-med;pos=Math.max(0,pos+z-k);neg=Math.min(0,neg+z+k)}const cusumLimit=Math.max(3*sigma,4),cusumAnomaly=Math.max(pos,Math.abs(neg))>cusumLimit;return{available:true,currentGapPercent:cur,baselineMedianPercent:med,mad,robustSigma:sigma,controlLimitPercent:limit,anomaly:Math.abs(residual)>limit,ewma,ewmaCurrent:ewmaNow,ewmaAnomaly,cusumPositive:pos,cusumNegative:neg,cusumLimit,cusumAnomaly,pointsUsed:base.length,minimumEvaluations:4,mode:p.length>=5?'stable-adaptive':'early-adaptive',method:'robust-baseline + EWMA + CUSUM'}}
function explainTrend(s){
 const out=[];
 const f=s.fcr?.official,w=s.weight?.official,c=s.cv?.official,u=s.u10?.official,m=s.mortality?.official;
 if(w&&f&&w.status!=='unavailable'&&f.status!=='unavailable'){
   if((w.status==='good'||w.status==='excellent')&&(f.status==='watch'||f.status==='critical'))
     out.push({type:'tradeoff',severity:'watch',title:'رشد حفظ شده، اما کارایی خوراک تحت فشار است',evidence:['وزن','FCR'],text:'وزن فعلی نسبت به مرجع مناسب است، اما FCR در جهت نامطلوب قرار دارد؛ در صورت تداوم این الگو، فشار روی کارایی تجمعی می‌تواند افزایش یابد.'});
   else if((w.status==='watch'||w.status==='critical')&&(f.status==='good'||f.status==='excellent'))
     out.push({type:'tradeoff',severity:'watch',title:'فاصله وزن با وجود کارایی مناسب خوراک',evidence:['وزن','FCR'],text:'FCR فعلاً مناسب است اما وزن از مرجع عقب‌تر است؛ تمرکز تحلیل باید روی سرعت رشد و یکنواختی باشد، نه صرفاً مصرف خوراک.'});
 }
 if(c&&u&&['worse_farther','crossed_to_worse'].includes(c.trend?.movement)&&['worse_farther','crossed_to_worse'].includes(u.trend?.movement))
   out.push({type:'distribution',severity:'high',title:'کیفیت توزیع وزن در حال تضعیف است',evidence:['CV','U10'],text:'CV و U10 هر دو در جهت نامطلوب حرکت کرده‌اند؛ این هم‌جهتی، کاهش یکنواختی مؤثر گله را محتمل‌تر می‌کند.'});
 if(m&&f&&m.trend?.direction==='worsening'&&f.trend?.direction==='worsening')
   out.push({type:'survival-efficiency',severity:'high',title:'فشار همزمان بر بقا و کارایی',evidence:['تلفات','FCR'],text:'تلفات و FCR در جهت نامطلوب حرکت کرده‌اند؛ علت از این داده‌ها قابل تعیین نیست و بررسی همزمان سلامت، محیط، آب و خوراک لازم است.'});
 return out;
}
function classifyDirection(key,a,b){const d=(n(b)-n(a));if(!Number.isFinite(d))return'insufficient';if(Math.abs(d)<0.5)return'stable';return lower.has(key)?(d<0?'improving':'worsening'):(d>0?'improving':'worsening')}
function evidenceLevel(rows,keys){const usable=rows.filter(r=>keys.every(k=>actual(r,k)!==null&&target(r,k)!==null)).length;return usable>=6?'high':usable>=4?'medium':usable>=3?'limited':'low'}
function multivariateEvidence(rows,s,meta){ const metricCoverage=Object.fromEntries(Object.keys(meta).map(k=>{const u=rows.filter(r=>actual(r,k)!==null&&target(r,k)!==null).length;return[k,{usable:u,coverage:rows.length?u/rows.length:0}]})); const axisCoverage={}; for(const [axis,ms] of Object.entries({growth:['weight','adg'],efficiency:['fcr','cumulativeFcr'],survival:['mortality'],uniformity:['cv','u10','u15'],outcome:['epef']})){const present=ms.filter(k=>metricCoverage[k]?.usable>0).length;axisCoverage[axis]={present,total:ms.length,coverage:ms.reduce((a,k)=>a+(metricCoverage[k]?.coverage||0),0)/ms.length};} const volatility={}; for(const k of Object.keys(meta)){const v=rows.slice(-5).map(r=>gap(actual(r,k),target(r,k),k)).filter(Number.isFinite).map(x=>x*100);const d=v.slice(1).map((x,i)=>Math.abs(x-v[i]));const med=median(d)||0;volatility[k]={available:v.length>=3,score:med,level:med>=4?'high':med>=2?'moderate':'low'};} const turningPoints={}; for(const k of Object.keys(meta)){const v=rows.map(r=>gap(actual(r,k),target(r,k),k)).filter(Number.isFinite).map(x=>x*100).slice(-5);const d1=v.length>=3?v.at(-2)-v.at(-3):0,d2=v.length>=2?v.at(-1)-v.at(-2):0;turningPoints[k]={available:v.length>=4,detected:v.length>=4&&Math.sign(d1)!==0&&Math.sign(d2)!==0&&Math.sign(d1)!==Math.sign(d2),from:d1,to:d2};} return{metricCoverage,axisCoverage,volatility,turningPoints,recentRecords:Math.min(5,rows.length)};} function scenarioMatrix(rows,s,meta,evidence){
 const axes={growth:['weight','adg'],efficiency:['fcr','cumulativeFcr'],survival:['mortality'],uniformity:['cv','u10','u15'],outcome:['epef']};
 const stateProfile=Object.fromEntries(Object.keys(meta).map(k=>[k,s[k]?.official?.status||'unavailable']));
 const trendProfile=Object.fromEntries(Object.keys(meta).map(k=>[k,{direction:s[k]?.trend?.direction||'insufficient',movement:s[k]?.trend?.movement||'insufficient'}]));
 const available=Object.keys(meta).filter(k=>stateProfile[k]!=='unavailable');
 const completeAxes=Object.entries(evidence.axisCoverage).filter(([,x])=>x.coverage>=.67).map(([k])=>k);
 const insufficient=rows.length<3||completeAxes.length===0;
 const patterns=[];
 const bad=k=>['watch','critical'].includes(stateProfile[k]);
 const good=k=>['good','excellent','on_target'].includes(stateProfile[k]);
 const worsening=k=>trendProfile[k].direction==='worsening';
 const improving=k=>trendProfile[k].direction==='improving';
 const pair=(a,b)=>bad(a)&&bad(b);
 if(insufficient)patterns.push('insufficient_evidence');
 if(pair('weight','fcr'))patterns.push('growth_efficiency_pressure');
 else if(good('weight')&&bad('fcr'))patterns.push('growth_efficiency_tradeoff');
 else if(bad('weight')&&good('fcr'))patterns.push('growth_lag_efficiency_preserved');
 if(pair('weight','cv')||pair('weight','u10'))patterns.push('growth_uniformity_pressure');
 else if(good('weight')&&(bad('cv')||bad('u10')))patterns.push('growth_good_uniformity_pressure');
 else if(bad('weight')&&(good('cv')||good('u10')))patterns.push('growth_lag_uniformity_preserved');
 if(pair('mortality','fcr'))patterns.push('survival_efficiency_pressure');
 if(pair('mortality','weight'))patterns.push('survival_growth_pressure');
 if(pair('mortality','cv')||pair('mortality','u10'))patterns.push('survival_uniformity_pressure');
 if(bad('cv')&&bad('u10'))patterns.push('distribution_pressure');
 const pressuredMetrics=Object.keys(meta).filter(bad);
 const improvingUnderPressure=pressuredMetrics.filter(k=>improving(k));
 const crossedToBetter=Object.keys(meta).filter(k=>trendProfile[k].movement==='crossed_to_better');
 const historicalPressure=Object.keys(meta).filter(k=>rows.slice(0,-1).some(r=>{const q=state(actual(r,k),target(r,k),k);return q.status==='watch'||q.status==='critical';}));
 const worseningWhileGood=Object.keys(meta).filter(k=>good(k)&&worsening(k));
 const recoveringHistory=historicalPressure.filter(k=>improving(k));
 if(improvingUnderPressure.length||crossedToBetter.length||recoveringHistory.length)patterns.push('recovery_from_pressure');
 if(worseningWhileGood.length)patterns.push('early_warning');
 const pressureAxes=Object.values(evidence.axisCoverage).filter(x=>x.coverage>0).length?Object.keys(axes).filter(a=>{const ms=axes[a].filter(k=>bad(k));return ms.length>=Math.max(1,Math.ceil(axes[a].length/2))&&a!=='outcome'}):[];
 const recoveryAxes=Object.keys(axes).filter(a=>axes[a].some(improving)&&!axes[a].every(k=>!improving(k)));
 if(pressureAxes.length>=2)patterns.push('coherent_multiaxis_pressure');
 if(recoveryAxes.length>=2)patterns.push('coherent_recovery');
 if(pressureAxes.length===1&&recoveryAxes.length>=1)patterns.push('mixed_pressure_recovery');
 const contradictions=Object.keys(axes).filter(a=>axes[a].some(worsening)&&axes[a].some(improving));
 if(contradictions.length)patterns.push('axis_contradiction');
 const volatile=Object.entries(evidence.volatility).filter(([,v])=>v.level==='high').map(([k])=>k);
 if(volatile.length)patterns.push('high_volatility');
 const turning=Object.entries(evidence.turningPoints).filter(([,v])=>v.detected).map(([k])=>k);
 if(turning.length)patterns.push('turning_point');
 const epefPressure=bad('epef'),corePressure=['weight','fcr','cumulativeFcr','mortality','cv','u10','u15'].filter(bad);
 if(epefPressure&&corePressure.length===0)patterns.push('outcome_component_mismatch');
 if(epefPressure&&corePressure.length>=2)patterns.push('outcome_confirmed_by_components');
 if(!patterns.length)patterns.push(available.length? 'balanced_or_isolated':'insufficient_evidence');
 const relation=(name,keys)=>({name,states:Object.fromEntries(keys.map(k=>[k,stateProfile[k]])),trends:Object.fromEntries(keys.map(k=>[k,trendProfile[k]]))});
 const relations=[relation('growth_efficiency',['weight','adg','fcr','cumulativeFcr']),relation('growth_uniformity',['weight','cv','u10','u15']),relation('survival_efficiency',['mortality','fcr','cumulativeFcr']),relation('survival_uniformity',['mortality','cv','u10']),relation('outcome_components',['epef','weight','fcr','mortality'])];
 const dataSufficiency=rows.length>=6?'strong':rows.length>=4?'moderate':rows.length>=3?'limited':'state_only';
 const analysisConfidence=dataSufficiency==='strong'&&completeAxes.length>=3&&volatile.length<=1?'high':dataSufficiency==='moderate'&&completeAxes.length>=2?'medium':dataSufficiency==='limited'?'limited':'low';
 const causalConfidence=corePressure.length>=2&&dataSufficiency==='strong'?'limited':'low';
 return{version:'MATRIX-V1.0',stateProfile,trendProfile,patterns,relations,pressureAxes,recoveryAxes,contradictions,volatileMetrics:volatile,turningMetrics:turning,dataSufficiency,analysisConfidence,causalConfidence,recordCount:rows.length,completeAxes,metricCount:available.length,rule:'state × trend × cross-axis × data-quality; performance data support association and prioritization, not causal diagnosis'};
}
function inputFingerprint(flock,rows){
 const raw=JSON.stringify({flockId:flock?.id||null,strain:flock?.strain||flock?.genetics||null,rows:(Array.isArray(rows)?rows:[]).map(r=>({id:r?.id??null,week:first(r,['week','week_number','production_week']),age:first(r,['age','age_days','ageDays']),weight:actual(r,'weight'),fcr:actual(r,'fcr'),cumulativeFcr:actual(r,'cumulativeFcr'),adg:actual(r,'adg'),mortality:actual(r,'mortality'),cv:actual(r,'cv'),u10:actual(r,'u10'),u15:actual(r,'u15'),epef:actual(r,'epef'),feed:actual(r,'feed'),water:actual(r,'water'),wfr:actual(r,'wfr')}))});
 let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0');
}
function multivariateAnalysis(rows,s){
 const meta={weight:{label:'وزن',axis:'growth',weight:1.25,lower:false},adg:{label:'افزایش وزن',axis:'growth',weight:1.15,lower:false},fcr:{label:'FCR',axis:'efficiency',weight:1.2,lower:true},cumulativeFcr:{label:'FCR تجمعی',axis:'efficiency',weight:1.05,lower:true},mortality:{label:'تلفات',axis:'survival',weight:1.15,lower:true},cv:{label:'CV',axis:'uniformity',weight:1,lower:true},u10:{label:'U10',axis:'uniformity',weight:1,lower:false},u15:{label:'U15',axis:'uniformity',weight:.9,lower:false},epef:{label:'EPEF',axis:'outcome',weight:.55,lower:false,derived:true}};
 const axisMeta={growth:{label:'رشد',metrics:['weight','adg']},efficiency:{label:'کارایی خوراک',metrics:['fcr','cumulativeFcr']},survival:{label:'بقا و سلامت عملکردی',metrics:['mortality']},uniformity:{label:'کیفیت و یکنواختی گله',metrics:['cv','u10','u15']},outcome:{label:'خروجی ترکیبی عملکرد',metrics:['epef']}}; const evidence=multivariateEvidence(rows,s,meta); const matrix=scenarioMatrix(rows,s,meta,evidence);
 const usable=Object.keys(meta).map(k=>{const q=s[k]||{},o=q.official||{},t=q.trend||{};if(o.current===null||o.current===undefined||o.gapPercent===null||o.gapPercent===undefined)return null;const status=o.status||'unavailable',gap=Number(o.gapPercent),pressure=status==='critical'?3:status==='watch'?2:status==='on_target'?0:status==='good'?-1:status==='excellent'?-2:0,trend=t.direction==='worsening'?2:t.direction==='improving'?-2:0,movement=['worse_farther','crossed_to_worse'].includes(t.movement)?1:['better_farther','crossed_to_better'].includes(t.movement)?-1:0,burden=Math.max(-4,Math.min(4,pressure*.9+trend*.75+movement*.45));return{key:k,...meta[k],axis:meta[k].axis,status,gap,trend:t.direction||'insufficient',movement:t.movement||'insufficient',burden,reference:o.reference||null}}).filter(Boolean);
 const confidenceScore=Math.max(0,Math.min(100,Math.round(Math.min(1,rows.length/6)*40+Object.values(evidence.axisCoverage).filter(x=>x.coverage>=.5).length/5*35+(Object.values(evidence.volatility).filter(x=>x.available&&x.level!=='high').length/Math.max(1,Object.keys(evidence.volatility).length))*15+(evidence.recentRecords>=3?10:0)))); const confidence=confidenceScore>=75?'بالا':confidenceScore>=50?'متوسط':confidenceScore>=30?'محدود':'پایین';
 const axisScores={};Object.keys(axisMeta).forEach(axis=>{const ms=usable.filter(x=>x.axis===axis),den=ms.reduce((a,x)=>a+x.weight,0);const trendPart=x=>(x.trend==='worsening'?2:x.trend==='improving'?-2:0)*.75+(['worse_farther','crossed_to_worse'].includes(x.movement)?1:['better_farther','crossed_to_better'].includes(x.movement)?-1:0)*.45;axisScores[axis]={axis,label:axisMeta[axis].label,metrics:ms.map(x=>x.key),coverage:ms.length+'/'+axisMeta[axis].metrics.length,score:den?ms.reduce((a,x)=>a+x.burden*x.weight,0)/den:0,pressure:den?ms.reduce((a,x)=>a+Math.max(0,x.burden)*x.weight,0)/den:0,protective:den?ms.reduce((a,x)=>a+Math.max(0,-x.burden)*x.weight,0)/den:0,trendPressure:den?ms.reduce((a,x)=>a+Math.max(0,trendPart(x))*x.weight,0)/den:0,trendRecovery:den?ms.reduce((a,x)=>a+Math.max(0,-trendPart(x))*x.weight,0)/den:0,recovery:den?ms.reduce((a,x)=>a+Math.max(0,-trendPart(x))*x.weight,0)/den:0}});
 const axisPriority=a=>a.pressure*(.55+.45*(evidence.axisCoverage[a.axis]?.coverage||0))*(a.axis==='outcome'?.65:1); const pressured=Object.values(axisScores).filter(a=>a.pressure>=1.05).sort((a,b)=>axisPriority(b)-axisPriority(a)),improving=Object.values(axisScores).filter(a=>a.trendRecovery>=1.0).sort((a,b)=>b.trendRecovery*(.55+.45*(evidence.axisCoverage[b.axis]?.coverage||0))-a.trendRecovery*(.55+.45*(evidence.axisCoverage[a.axis]?.coverage||0))),supporting=usable.filter(x=>x.burden>=1.2).sort((a,b)=>b.burden-a.burden).slice(0,6),pressureEvidence=usable.filter(x=>['watch','critical'].includes(x.status)||x.trend==='worsening'||['worse_farther','crossed_to_worse'].includes(x.movement)).sort((a,b)=>b.burden-a.burden).slice(0,6),protective=usable.filter(x=>x.burden<=-1.2).sort((a,b)=>a.burden-b.burden).slice(0,6),mixed=usable.filter(x=>Math.abs(x.burden)<1.2),dominant=pressured[0]||null,secondary=pressured[1]||null,directionalSignals=usable.filter(x=>x.trend==='improving'||x.trend==='worsening'),directionalCoherence=directionalSignals.length?Math.round(Math.max(...['improving','worsening'].map(d=>directionalSignals.filter(x=>x.trend===d).length))/directionalSignals.length*100):0,referenceCoherence=usable.length?Math.round(usable.filter(x=>Math.abs(x.burden)>=1.2).length/usable.length*100):0,crossAxisCoherence=pressured.length>=2?Math.round(Math.min(100,pressured.slice(0,3).reduce((a,x)=>a+Math.min(1,x.pressure/3),0)/Math.min(3,pressured.length)*100)):0,coherence=Math.round(directionalCoherence*.35+referenceCoherence*.25+crossAxisCoherence*.4);
 const conclusions=[],add=(code,severity,title,text,evidence,checks,possibleCauses)=>conclusions.push({code,severity,title,text,evidence,checks,possibleCauses,confidence,type:'multivariate'});
 const causes={growth:['مصرف و دسترسی دان','مصرف و دسترسی آب','شرایط محیطی و تهویه','سلامت و عملکرد روده','تراکم و مدیریت دسترسی'],efficiency:['مصرف واقعی و کیفیت خوراک','آب و کیفیت/دسترسی آب','ترکیب و تغییرات جیره','محیط و تنش حرارتی','سلامت و جذب مواد مغذی'],survival:['سلامت و بیماری','شرایط محیطی و استرس','آب و خوراک','مدیریت و حذف/تلفات','روند رخدادهای اخیر'],uniformity:['توزیع و دسترسی دان','توزیع و دسترسی آب','تراکم و رقابت','اختلافات محیطی در سالن','شروع گله و کیفیت جوجه','سلامت ناهمگون'],outcome:['رشد، FCR و زنده‌مانی به‌صورت همزمان','بررسی شاخص‌های سازنده EPEF','روند عملکرد در ارزیابی‌های اخیر']};
 const checks={growth:['وزن و ADG','مصرف دان و آب','دما/RH/تهویه','یافته‌های سلامت و کالبدگشایی'],efficiency:['دان مصرفی و تغییرات جیره','آب/دان','FCR تجمعی','محیط و سلامت'],survival:['تلفات روزانه و تجمعی','علائم بالینی و کالبدگشایی','آب و خوراک','محیط'],uniformity:['توزیع خام وزن','feeder/drinker access','تراکم و اختلاف محیطی','گروه‌های عقب‌مانده/جلوتر'],outcome:['وزن، FCR و زنده‌مانی','روند سه ارزیابی اخیر','تطبیق با مرجع سنی']};
 if(dominant&&secondary){const axes=[dominant.axis,secondary.axis];add('cross_axis_pattern','high','الگوی چندمحوری عملکرد','دو یا چند محور عملکردی هم‌زمان تحت فشار هستند. شدت و جهت شاخص‌های درگیر نشان می‌دهد مسئله را نباید به یک شاخص منفرد تقلیل داد؛ علت اختصاصی از داده عملکردی به‌تنهایی قابل اثبات نیست.',supporting.map(x=>x.label),Array.from(new Set(axes.flatMap(a=>checks[a]||[]))).slice(0,8),Array.from(new Set(axes.flatMap(a=>causes[a]||[]))).slice(0,8));}
 else if(dominant){const ms=usable.filter(x=>x.axis===dominant.axis);add('dominant_axis','watch','محور غالب عملکردی','بیشترین فشار فعلی در محور «'+dominant.label+'» دیده می‌شود. شاخص‌های این محور باید قبل از نسبت دادن علت به یک عامل خاص، با داده‌های تکمیلی بررسی شوند.',ms.map(x=>x.label),checks[dominant.axis]||[],causes[dominant.axis]||[]);}
 if(improving.length>=2)add('coherent_recovery','positive','نشانه بهبود هم‌جهت','چند محور عملکردی هم‌زمان سیگنال بهبود دارند؛ این الگو با recovery عملکردی سازگار است، اما برای تأیید پایداری باید در ارزیابی‌های بعدی تکرار شود.',usable.filter(x=>x.burden<=-1.2).map(x=>x.label),Array.from(new Set(improving.slice(0,3).flatMap(x=>checks[x.axis]||[]))),['تداوم شرایط مدیریتی مناسب','پایداری مصرف و دسترسی آب/خوراک','پایش سلامت و محیط']);
 if(supporting.length===1&&protective.length>=2)add('isolated_deviation','watch','انحراف محدود با شواهد محافظ','یک شاخص از وضعیت مرجع فاصله دارد، در حالی که چند شاخص دیگر وضعیت محافظ یا مناسب دارند؛ بنابراین شواهد فعلی برای نتیجه‌گیری درباره افت عمومی گله کافی نیست.',supporting.map(x=>x.label),['ارزیابی مجدد همان شاخص','بررسی خطای اندازه‌گیری/ثبت','بررسی ارزیابی بعدی'],['نوسان طبیعی','خطای نمونه‌گیری یا ثبت','تفاوت زمانی شاخص‌ها']);
 if(axisScores.uniformity?.pressure>=1.05){const u=usable.filter(x=>x.axis==='uniformity');add('distribution_integrity','high','کیفیت توزیع وزن تحت فشار','شاخص‌های پراکندگی و یکنواختی در مجموع به سمت نامطلوب حرکت کرده‌اند؛ بنابراین میانگین وزن به‌تنهایی نماینده کیفیت کل گله نیست.',u.map(x=>x.label),checks.uniformity,causes.uniformity);}
 if(axisScores.outcome?.pressure>=1.05&&pressured.length>=1)add('composite_outcome','watch','خروجی ترکیبی عملکرد تحت فشار','EPEF همراه با حداقل یک محور اصلی دیگر نامطلوب است؛ افت خروجی ترکیبی با وضعیت شاخص‌های سازنده آن سازگار است، اما علت باید از اجزای سازنده تفکیک شود.',['EPEF',...supporting.filter(x=>x.key!=='epef').slice(0,4).map(x=>x.label)],checks.outcome,causes.outcome);
 const contradictionAxes=Object.values(axisScores).filter(a=>a.pressure>=1.05&&a.recovery>=1.05); if(contradictionAxes.length)add('axis_contradiction','watch','سیگنال‌های متعارض بین شاخص‌ها','در یک یا چند محور، هم‌زمان نشانه فشار و نشانه بهبود دیده می‌شود؛ بنابراین یک شاخص منفرد نباید نماینده کل محور تلقی شود.',contradictionAxes.flatMap(a=>usable.filter(x=>x.axis===a.axis).map(x=>x.label)).slice(0,6),['بررسی روند ارزیابی‌های اخیر','تفکیک وضعیت فعلی از جهت روند'],['تغییرات مدیریتی اخیر','تفاوت زمان شاخص‌ها','نوسان یا خطای ثبت/نمونه‌گیری']); const volatileMetrics=Object.entries(evidence.volatility).filter(([,v])=>v.level==='high').map(([k])=>meta[k].label); if(volatileMetrics.length)add('volatility','watch','نوسان بالا در بخشی از شاخص‌ها','برخی شاخص‌ها نوسان قابل توجه دارند؛ شدت سیگنال فعلی باید با احتیاط تفسیر شود.',volatileMetrics.slice(0,6),['تکرار اندازه‌گیری با روش ثابت','بررسی داده خام'],['نوسان واقعی عملکرد','نمونه‌گیری/ثبت']); const turning=Object.entries(evidence.turningPoints).filter(([,v])=>v.detected).map(([k])=>meta[k].label); if(turning.length)add('turning_point','watch','نقطه تغییر جهت مشاهده شد','در بخشی از شاخص‌ها جهت حرکت اخیر تغییر کرده است؛ این الگو باید در ارزیابی بعدی تأیید شود.',turning.slice(0,6),['مقایسه دو تا سه ارزیابی بعدی'],['تغییر واقعی روند','نوسان کوتاه‌مدت']); if(!conclusions.length)add('balanced_state','positive','الگوی غالب نامطلوب شناسایی نشد','شاخص‌ها در حال حاضر الگوی چندمحوری پررنگی برای افت نشان نمی‌دهند. این نتیجه به معنی سلامت قطعی گله نیست؛ کیفیت آن به پوشش داده، تعداد ارزیابی‌ها و کامل بودن شاخص‌ها وابسته است.',usable.map(x=>x.label),['تداوم پایش در ارزیابی بعدی'],['پایش روند رشد، کارایی، بقا و یکنواختی']);
 const signature=usable.map(x=>x.key+':'+x.status+':'+x.trend+':'+x.movement).join('|');
 const axisSummary=Object.values(axisScores).filter(a=>a.metrics.length).sort((a,b)=>Math.abs(b.score)-Math.abs(a.score)).map(a=>({axis:a.axis,label:a.label,score:Number(a.score.toFixed(2)),pressure:Number(a.pressure.toFixed(2)),protective:Number(a.protective.toFixed(2)),trendPressure:Number(a.trendPressure.toFixed(2)),trendRecovery:Number(a.trendRecovery.toFixed(2)),recovery:Number(a.trendRecovery.toFixed(2)),coverage:a.coverage}));
 return{items:conclusions,summary:{dominantAxis:dominant?.label||null,secondaryAxis:secondary?.label||null,pressuredAxes:pressured.map(x=>x.label),improvingAxes:improving.map(x=>x.label),coherencePercent:coherence,coverage:usable.length+'/'+Object.keys(meta).length,evidenceCoverage:Math.round(Object.values(evidence.metricCoverage).reduce((a,x)=>a+x.coverage,0)/Object.keys(evidence.metricCoverage).length*100),axisEvidence:evidence.axisCoverage,supporting:supporting.map(x=>x.label),pressureEvidence:pressureEvidence.map(x=>x.label),protective:protective.map(x=>x.label),mixed:mixed.map(x=>x.label),axisSummary,signature,interpretation:'تحلیل چندشاخصی بر پایه وضعیت فعلی، فاصله از مرجع سنی، جهت روند، حرکت فاصله و هم‌جهتی محورهای عملکرد انجام شده است؛ نتیجه تفسیری است و جایگزین تشخیص علت یا بررسی مزرعه‌ای نیست.'},metrics:usable,axisSummary,confidence,confidenceScore,evidence,matrix,type:'dynamic-multivariate'};
}
function differentialAnalysis(rows,s,patterns){return (patterns?.items||patterns||[]).map(p=>({...p,differential:(p.possibleCauses||[]).map(x=>({domain:'محور بررسی',check:x})),causality:'association-only'}));}
function forecastMultivariate(s){
 const candidates=['weight','fcr','cumulativeFcr','adg','mortality','cv','u10','u15'].map(k=>({key:k,f:s[k]?.forecast})).filter(x=>x.f?.available);
 const worsening=candidates.filter(x=>x.f.direction==='worsening').sort((a,b)=>Math.abs(b.f.projectedGapPercent)-Math.abs(a.f.projectedGapPercent));
 const improving=candidates.filter(x=>x.f.direction==='improving').sort((a,b)=>Math.abs(b.f.projectedGapPercent)-Math.abs(a.f.projectedGapPercent));
 const coherentW=worsening.filter(x=>['weight','adg','fcr','mortality','cv'].includes(x.key)).length>=2;
 return{available:candidates.length>0,conditional:true,dominantRisk:worsening[0]||null,dominantImprovement:improving[0]||null,coherentWorsening:coherentW,confidence:candidates.length>=5?'medium':candidates.length>=3?'limited':'low',note:'چشم‌انداز مشروط بر تداوم الگوی مشاهده‌شده است و پیش‌بینی قطعی یا تشخیص علت نیست.'};
}
function trajectoryProfile(rows,m){
 const usable=rows.map(r=>({actual:actual(r,m),gap:gap(actual(r,m),target(r,m),m)})).filter(x=>x.actual!==null&&x.gap!==null);
 const z=usable.slice(-5), vals=z.map(x=>x.gap*100);
 if(vals.length<3)return{available:false,regime:'insufficient',direction:'insufficient',performanceDirection:'insufficient',relation:'insufficient',crossed:'not_crossed',currentPosition:'unknown',projectedPosition:'unknown',turningPoint:'none',turningDirection:'none',persistence:0,persistenceLevel:'low',volatility:null,stability:'unknown',pointsUsed:vals.length,gapSeries:vals,evidenceLevel:vals.length>=3?'limited':'low',conditionalOutlook:null,scenarios:[]};
 const lowerIsBetter=['fcr','cumulativeFcr','mortality','cv'].includes(m);
 const directional=z.map(x=>lowerIsBetter?-x.actual:x.actual);
 const diffs=directional.slice(1).map((v,i)=>v-directional[i]);
 const reg=robustRegression(directional),gapReg=robustRegression(vals);
 const slope=reg?.slope??(diffs.at(-1)||0),noise=reg?.residualMad??0;
 const stepTol=Math.max(lowerIsBetter?.001:.35,noise*.65);
 const meaningful=diffs.filter(d=>Math.abs(d)>=stepTol),positive=meaningful.filter(d=>d>0).length,negative=meaningful.filter(d=>d<0).length;
 const persistence=meaningful.length?Math.max(positive,negative)/meaningful.length:.5;
 const direction=positive>negative?'improving':negative>positive?'worsening':'stable';
 const reversals=diffs.slice(1).filter((d,i)=>Math.abs(d)>=stepTol&&Math.abs(diffs[i])>=stepTol&&Math.sign(d)!==Math.sign(diffs[i])).length;
 const volatility=median(diffs.map(Math.abs))??0,residualVolatility=noise,volatilityScore=volatility+residualVolatility*.8;
 const highVolatility=z.length>=4&&(volatilityScore>=5||reversals>=2),moderateVolatility=volatilityScore>=3||reversals>=1;
 const current=vals.at(-1),previous=vals.at(-2),projected=gapReg?.nextGapPercent??current;
 const absCurrent=Math.abs(current),absProjected=Math.abs(projected),absDelta=absProjected-absCurrent;
 const relation=Math.abs(absDelta)<=.6?'stable':absDelta<0?'converging':'diverging';
 const gapEffect=Math.abs(absDelta)<=.6?'stable':(current>.6?(absDelta>0?'favorable_widening':'favorable_narrowing'):(current<-.6?(absDelta>0?'unfavorable_widening':'unfavorable_narrowing'):(projected>current?'toward_better':'toward_worse')));
 const semanticRelation=current>.6?(absDelta>0?'better_farther':absDelta<0?'better_closer':'stable'):current<-.6?(absDelta>0?'worse_farther':absDelta<0?'worse_closer':'stable'):(projected>current?'toward_better':'toward_worse');
 const crossed=current<0&&projected>=0?'crossed_to_better':current>0&&projected<=0?'crossed_to_worse':'not_crossed';
 const currentPosition=current>.6?'better':current<-.6?'weaker':'near_reference';
 const projectedPosition=projected>.6?'better':projected<-.6?'weaker':'near_reference';
 const turningPoint=diffs.length>=3&&Math.sign(diffs.at(-2))!==0&&Math.sign(diffs.at(-1))!==0&&Math.sign(diffs.at(-2))!==Math.sign(diffs.at(-1))?'recent_turning_point':'none';
 const turningDirection=turningPoint==='recent_turning_point'?(diffs.at(-1)>0?'toward_better':'toward_worse'):'none';
 const stabilityScore=Math.max(0,1-Math.min(1,volatilityScore/8));
 const persistenceLevel=z.length>=5&&persistence>=.8?'high':z.length>=4&&persistence>=.67?'medium':z.length>=3&&persistence>=.6?'limited':'low';
 const stability=highVolatility?'high_volatility':moderateVolatility?'moderate':'stable';
 const forecastConfidence=z.length>=5&&stability==='stable'?'high':z.length>=4&&stability!=='high_volatility'?'medium':'limited';
 const outlookStrength=forecastConfidence==='high'&&persistenceLevel==='high'?'strong':forecastConfidence==='medium'?'moderate':'limited';
 let regime='stable';
 if(highVolatility)regime='volatile';
 else if(turningPoint==='recent_turning_point'&&turningDirection==='toward_better')regime='recovering';
 else if(turningPoint==='recent_turning_point'&&turningDirection==='toward_worse')regime='deteriorating';
 else if(direction==='improving'&&current<0)regime='recovering';
 else if(direction==='worsening'&&current<0)regime='deteriorating';
 else if(direction==='improving'&&current>.6)regime='strengthening';
 else if(direction==='worsening'&&current>.6)regime='weakening';
 else if(direction==='improving'&&Math.abs(current)<=.6)regime='approaching_better';
 else if(direction==='worsening'&&Math.abs(current)<=.6)regime='approaching_worse';
 else if(relation==='converging')regime='converging';
 else if(relation==='diverging')regime='diverging';

 const pressure=current<-.6, favorable=current>.6, near=Math.abs(current)<=.6;
 const gapNarrowing=absDelta<-.7, gapWidening=absDelta>.7;
 const primaryScenario=direction==='worsening'
   ?(pressure?'continued_pressure':favorable?'deterioration_watch':'negative_drift')
   :direction==='improving'
     ?(pressure&&gapNarrowing?'recovery_path':favorable?'positive_continuation':'improvement_watch')
     :'stabilization';
 const scenarios=[
   {id:'continuation',label:'تداوم مسیر فعلی',eligible:direction!=='stable',basis:direction,conditional:true},
   {id:'stabilization',label:'تثبیت نزدیک وضعیت فعلی',eligible:true,basis:'stable',conditional:true},
   {id:'recovery',label:'چرخش و بازیابی',eligible:direction==='improving'&&pressure&&gapNarrowing||turningDirection==='toward_better',basis:'improving_or_turning',conditional:true},
   {id:'deterioration',label:'تشدید افت',eligible:direction==='worsening'&&(!favorable||gapWidening)||turningDirection==='toward_worse',basis:'worsening_or_turning',conditional:true}
 ];
 const conditionalOutlook={
   primaryScenario,
   direction,
   currentPosition,
   projectedPosition,
   referenceCrossing:crossed,
   confidence:forecastConfidence,
   strength:outlookStrength,
   evidenceLevel:z.length>=5?'high':z.length>=4?'medium':'limited',
   statement:direction==='worsening'
     ?(pressure?'در صورت تداوم مسیر فعلی، فشار نامطلوب احتمالاً حفظ یا تشدید می‌شود.':favorable?'در صورت تداوم افت، مزیت فعلی نسبت به مرجع می‌تواند کاهش یابد.':'در صورت تداوم مسیر، شاخص در جهت نامطلوب حرکت خواهد کرد.')
     :direction==='improving'
       ?(pressure&&gapNarrowing?'در صورت تداوم مسیر فعلی، فاصله نامطلوب از مرجع می‌تواند کاهش یابد.':favorable?'در صورت تداوم مسیر، موقعیت مطلوب می‌تواند حفظ شود.':'در صورت تداوم مسیر، شاخص به سمت وضعیت مطلوب‌تر حرکت می‌کند.')
       :'در صورت تداوم الگوی فعلی، تغییر بزرگ و پایدار در جهت شاخص از شواهد فعلی قابل استنباط نیست.'
 };
 return{available:true,regime,direction,performanceDirection:direction,relation,semanticRelation,gapEffect,crossed,currentPosition,projectedPosition,turningPoint,turningDirection,persistence:Number(persistence.toFixed(2)),persistenceLevel,volatility:Number(volatility.toFixed(2)),volatilityScore:Number(volatilityScore.toFixed(2)),reversals,stability,stabilityScore:Number(stabilityScore.toFixed(2)),slopePerEvaluation:Number(slope.toFixed(3)),slopeThresholdPercent:Number(stepTol.toFixed(3)),residualMadPercent:Number(noise.toFixed(3)),momentum:Number((diffs.at(-1)??0).toFixed(3)),currentGapPercent:current,previousGapPercent:previous,projectedGapPercent:projected,distanceToZeroPercent:Number(absCurrent.toFixed(2)),projectedDistanceToZeroPercent:Number(absProjected.toFixed(2)),distanceDeltaPercent:Number(absDelta.toFixed(2)),pointsUsed:z.length,uncertaintyPercent:gapReg?.residualBand??null,forecastConfidence,outlookStrength,evidenceLevel:z.length>=5?'high':z.length>=4?'medium':'limited',gapSeries:vals,rawSeries:z.map(x=>x.actual),directionalSeries:directional,conditionalOutlook,scenarios};
}
function buildForecastSummary(rows,s){
 const labels={weight:'وزن',fcr:'FCR',cumulativeFcr:'FCR تجمعی',adg:'افزایش وزن',mortality:'تلفات',cv:'CV',u10:'U10',u15:'U15'};
 const axisOf={weight:'growth',adg:'growth',fcr:'efficiency',cumulativeFcr:'efficiency',mortality:'survival',cv:'uniformity',u10:'uniformity',u15:'uniformity'};
 const metricKeys=Object.keys(labels);
 const candidates=metricKeys.map(key=>{
   const f=s[key]?.forecast,t=s[key]?.trajectory,o=s[key]?.official;
   if(!f?.available||!t?.available||!o||o.status==='unavailable')return null;
   const current=n(t.currentGapPercent),projected=n(t.projectedGapPercent),unc=n(t.uncertaintyPercent);
   const points=t.pointsUsed||0,persistence=t.persistence??0;
   if(current===null||projected===null)return null;
   const gapDelta=projected-current,distanceDelta=Math.abs(projected)-Math.abs(current);
   const underPressure=current<-.6,aboveReference=current>.6,nearReference=Math.abs(current)<=.6;
   const gapNarrowing=distanceDelta<-.7,gapWidening=distanceDelta>.7;
   const gapEffect=Math.abs(distanceDelta)<=.7?'stable':current>.6?(distanceDelta>0?'favorable_widening':'favorable_narrowing'):current<-.6?(distanceDelta>0?'unfavorable_widening':'unfavorable_narrowing'):(projected>current?'toward_better':'toward_worse');
   const gapImproving=gapEffect==='favorable_widening'||gapEffect==='favorable_narrowing'||gapEffect==='toward_better';
   const gapWorsening=gapEffect==='unfavorable_widening'||gapEffect==='unfavorable_narrowing'||gapEffect==='toward_worse';
   const actualImproving=t.direction==='improving',actualWorsening=t.direction==='worsening',stable=t.direction==='stable';
   const crossesNegative=current>=-.6&&projected<-.6;
   const crossesPositive=current<-.6&&projected>=-.6;
   const highVol=t.stability==='high_volatility',moderateVol=t.stability==='moderate';
   const evidenceBase=points>=6?90:points===5?78:points===4?64:points===3?48:25;
   const persistenceScore=Math.round(Math.max(0,Math.min(1,persistence))*100);
   const slopeMagnitude=Math.abs(Number(t.slopePerEvaluation)||0),slopeThreshold=Math.abs(Number(t.slopeThresholdPercent)||0);
   const slopeSignal=slopeThreshold>0?Math.min(1,slopeMagnitude/Math.max(slopeThreshold,0.001)):0;
   const slopeScore=Math.round(slopeSignal*100);
   const volatilityPenalty=highVol?22:moderateVol?10:0;
   const axisKeys=metricKeys.filter(k=>axisOf[k]===axisOf[key]&&k!==key);
   const corroborating=axisKeys.filter(k=>s[k]?.trajectory?.available&&s[k].trajectory.pointsUsed>=3&&s[k].trajectory.direction===t.direction).length;
   const axisSupport=Math.min(2,corroborating);
   const crossMetricSupport=axisSupport>=2?1:axisSupport===1?.5:0;
   const evidenceScore=Math.max(0,Math.min(100,Math.round(evidenceBase*.40+persistenceScore*.25+slopeScore*.15+crossMetricSupport*100*.20-volatilityPenalty)));
   const severityBase=Math.max(0,-current)*.45+Math.max(0,distanceDelta)*.25*(current<-.6?1:0)+(actualWorsening?12:0)+(crossesNegative?10:0);
   const recoveryBase=Math.max(0,-current)*.35+Math.max(0,-distanceDelta)*.30*(current<-.6?1:0)+(actualImproving?12:0)+(crossesPositive?8:0);
   let state='informational',signal='informational',reason='';
   if(actualWorsening){
     if(points>=5&&evidenceScore>=68&&(underPressure||gapWidening||crossesNegative)&&!highVol){
       state='confirmed_risk';signal='deterioration';
       reason=underPressure&&gapWidening?'شاخص هم در ناحیه نامطلوب قرار دارد و هم فاصله آن از مرجع در حال افزایش است؛ تداوم جهت واقعی شاخص نیز این فشار را تأیید می‌کند.':
         underPressure?'شاخص پایین‌تر از مرجع سنی قرار دارد و جهت ذاتی آن در حال بدترشدن است.':
         gapWidening?'جهت ذاتی شاخص نامطلوب است و فاصله از مرجع نیز در حال افزایش است.':
         crossesNegative?'مسیر شاخص در حال عبور از مرجع به سمت ناحیه نامطلوب است.':
         'تضعیف پایدار شاخص در چند ارزیابی مشاهده شده است.';
     }else if(points>=3&&evidenceScore>=42&&(underPressure||gapWidening||crossesNegative||aboveReference)){
       state='early_warning';signal='deterioration';
       reason=underPressure&&gapWidening?'هشدار زودهنگام: شاخص پایین‌تر از مرجع است و فاصله نامطلوب نیز در حال افزایش است.':
         underPressure?'هشدار زودهنگام: شاخص پایین‌تر از مرجع است و جهت ذاتی آن نامطلوب شده است.':
         gapWidening?'هشدار زودهنگام: جهت ذاتی شاخص نامطلوب است و فاصله از مرجع در حال افزایش است.':
         aboveReference?'هشدار زودهنگام: شاخص هنوز بالاتر از مرجع است، اما جهت ذاتی آن به سمت نامطلوب حرکت می‌کند.':
         'هشدار زودهنگام بر اساس تضعیف مشاهده‌شده؛ ارزیابی بعدی برای تأیید اهمیت مسیر لازم است.';
     }else{
       state='informational_warning';signal='monitor';
       reason=highVol?'تغییر نامطلوب دیده می‌شود اما نوسان بالا شدت هشدار را محدود می‌کند.':'نشانه تضعیف وجود دارد، اما شواهد فعلی برای شدت‌بخشی به هشدار کافی نیست.';
     }
   }else if(actualImproving){
     if(points>=3&&evidenceScore>=42&&underPressure&&gapNarrowing&&!highVol){
       state='recovery_opportunity';signal='recovery';
       reason='شاخص هنوز پایین‌تر از مرجع سنی است، اما مقدار واقعی آن در جهت مطلوب حرکت می‌کند و فاصله نامطلوب از مرجع در حال کاهش است؛ این یک مسیر بازیابی مشروط است، نه تضمین.';
     }else if(points>=3&&evidenceScore>=42){
       state='positive_momentum';signal='positive';
       reason=aboveReference?'شاخص در جهت ذاتی مطلوب حرکت می‌کند و همچنان بالاتر از مرجع قرار دارد؛ این مومنتوم مثبت است، نه «بازیابی».':
         nearReference?'شاخص در جهت ذاتی مطلوب حرکت می‌کند و موقعیت آن نزدیک مرجع است.':
         'شاخص در جهت مطلوب حرکت می‌کند؛ برای بازیابی واقعی، کاهش پایدار فاصله نامطلوب نیز باید ادامه یابد.';
     }else{
       state='informational';signal='informational';
       reason='جهت شاخص مطلوب است، اما عمق شواهد هنوز محدود است؛ مسیر فقط به‌صورت مشروط مثبت تفسیر می‌شود.';
     }
   }else{
     state='informational';signal='informational';
     reason=stable?'شاخص در ارزیابی‌های اخیر مسیر نسبتاً پایدار دارد؛ وضعیت فعلی و فاصله از مرجع باید در ارزیابی بعدی دوباره بررسی شود.':'الگوی حرکتی غالب به‌اندازه کافی مشخص نیست.';
   }
   const score=state==='confirmed_risk'?severityBase+evidenceScore*.35:state==='early_warning'?severityBase+evidenceScore*.25:state==='recovery_opportunity'?recoveryBase+evidenceScore*.25:state==='positive_momentum'?recoveryBase*.5+evidenceScore*.15:Math.abs(gapDelta);
   const semantic=current>.6?'بهتر از مرجع':current<-.6?'ضعیف‌تر از مرجع':'نزدیک به مرجع';
   const gapLabel=gapEffect==='favorable_widening'?'افزایش فاصله از مرجع • در مسیر بهبود':gapEffect==='favorable_narrowing'?'کاهش فاصله از مرجع • در مسیر بهبود':gapEffect==='unfavorable_widening'?'افزایش فاصله از مرجع • در مسیر تضعیف':gapEffect==='unfavorable_narrowing'?'کاهش فاصله از مرجع • در مسیر تضعیف':gapEffect==='toward_better'?'حرکت فاصله در مسیر بهبود':gapEffect==='toward_worse'?'حرکت فاصله در مسیر تضعیف':'فاصله نسبتاً پایدار';
   const directionLabel=actualImproving?'بهبود':actualWorsening?'تضعیف':'پایدار';
   const confidence=evidenceScore>=75?'قوی':evidenceScore>=55?'متوسط':evidenceScore>=40?'محدود':'کم';
   const scenario=t.conditionalOutlook||null;
   return{key,label:labels[key],axis:axisOf[key],forecast:f,trajectory:t,currentMeaning:semantic,rawDirection:directionLabel,gapRelation:gapLabel,gapEffect,gapChangePercent:Number(gapDelta.toFixed(2)),distanceChangePercent:Number(distanceDelta.toFixed(2)),signal,state,reason,score,evidenceScore,confidence,corroboratingMetrics:axisKeys.filter(k=>s[k]?.trajectory?.direction===t.direction).map(k=>labels[k]),conditionalOutlook:scenario,scenarios:t.scenarios||[],earlyWarningEligible:state==='early_warning'||state==='confirmed_risk'||state==='informational_warning',riskEligible:state==='confirmed_risk',recoveryEligible:state==='recovery_opportunity',capacityEligible:state==='recovery_opportunity',evidence:Math.min(1,evidenceScore/100),uncertaintyPercent:unc};
 }).filter(Boolean);
 const risks=candidates.filter(x=>x.state==='confirmed_risk').sort((a,b)=>b.score-a.score);
 const warnings=candidates.filter(x=>x.state==='early_warning'||x.state==='informational_warning').sort((a,b)=>b.score-a.score);
 const improvements=candidates.filter(x=>x.state==='recovery_opportunity'||x.state==='positive_momentum').sort((a,b)=>b.score-a.score);
 const informational=candidates.filter(x=>x.state==='informational').sort((a,b)=>Math.abs(b.currentMeaning==='ضعیف‌تر از مرجع'?1:0)-Math.abs(a.currentMeaning==='ضعیف‌تر از مرجع'?1:0));
 const risk=risks[0]||warnings[0]||null;
 const improve=improvements[0]||informational[0]||candidates[0]||null;
 const scenarioCounts={continuation:0,stabilization:0,recovery:0,deterioration:0};
 candidates.forEach(x=>(x.scenarios||[]).forEach(sc=>{if(sc.eligible&&scenarioCounts[sc.id]!==undefined)scenarioCounts[sc.id]++}));
 return{
   version:'SMART-TREND-V3.7',
   risk:risk?{...risk}:null,
   earlyWarning:warnings[0]?{...warnings[0]}:null,
   improve:improve?{...improve}:null,
   rankedRisks:risks.slice(0,5),rankedEarlyWarnings:warnings.slice(0,5),rankedImprovements:improvements.slice(0,5),
   rankedInformational:informational.slice(0,5),
   scenarioOverview:{counts:scenarioCounts,metricCount:candidates.length,dominantScenario:Object.entries(scenarioCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||null},
   method:'metric-direction-semantics + age-reference-position + raw-momentum + persistence + turning-point + volatility + conditional-scenarios + axis-corroboration + evidence-tier',
   note:'Smart Trend V3.7 جهت ذاتی هر شاخص را مستقل تفسیر می‌کند: وزن/ADG/U10/U15/EPEF با افزایش بهتر؛ FCR/FCR تجمعی/تلفات/CV با کاهش بهتر. فاصله از مرجع و مسیر واقعی جداگانه محاسبه می‌شوند و چشم‌انداز فقط به‌صورت شرطی و متناسب با شواهد ارائه می‌شود. این تحلیل پیش‌بینی قطعی یا تشخیص بیماری نیست.'
 };
}
function buildTrajectorySynthesis(s){
 const keys=['weight','fcr','cumulativeFcr','adg','mortality','cv','u10','u15'];
 const usable=keys.map(k=>s[k]?.trajectory).filter(t=>t?.available&&t.pointsUsed>=3);
 if(!usable.length)return{available:false,text:'برای جمع‌بندی مسیر، داده زمانی کافی وجود ندارد.',counts:{improving:0,worsening:0,stable:0}};
 const counts={improving:usable.filter(t=>t.direction==='improving').length,worsening:usable.filter(t=>t.direction==='worsening').length,stable:usable.filter(t=>t.direction==='stable').length};
 const dominant=Math.max(counts.improving,counts.worsening,counts.stable);
 const direction=counts.improving===dominant?'improving':counts.worsening===dominant?'worsening':'stable';
 const divergent=usable.filter(t=>t.relation==='diverging').length,converging=usable.filter(t=>t.relation==='converging').length;
 const volatile=usable.filter(t=>t.stability==='high_volatility').length;
 const text=direction==='improving'
   ? 'مسیر شاخص‌های دارای داده کافی عمدتاً رو به بهبود است؛ با این حال هر شاخص باید جداگانه نسبت به مرجع سنی تفسیر شود.'
   : direction==='worsening'
   ? 'مسیر شاخص‌های دارای داده کافی عمدتاً رو به افت است؛ برای تأیید تداوم، ارزیابی بعدی و کنترل کیفیت ثبت‌ها اهمیت دارد.'
   : 'مسیر شاخص‌های دارای داده کافی عمدتاً پایدار است و تغییر جهت غالبی مشاهده نمی‌شود.';
 return{available:true,direction,counts,converging,diverging:divergent,volatile,pointsUsed:usable.length,text};
}
function patterns(s){const o=[],bad=x=>x?.status==='watch'||x?.status==='critical',good=x=>x?.status==='good'||x?.status==='excellent';if(bad(s.weight)&&bad(s.fcr))o.push({severity:'high',code:'growth_efficiency_down',title:'افت همزمان رشد و کارایی خوراک',text:'وزن و FCR هر دو نسبت به مرجع استاندارد مشترک نامطلوب‌اند؛ خوراک، آب، محیط و سلامت باید هم‌زمان بررسی شوند.'});if(good(s.weight)&&bad(s.fcr))o.push({severity:'watch',code:'growth_efficiency_tradeoff',title:'رشد مناسب با کارایی ضعیف‌تر',text:'وزن مناسب است اما FCR نامطلوب است؛ وزن به‌تنهایی عملکرد کامل را تأیید نمی‌کند.'});if(bad(s.weight)&&good(s.fcr))o.push({severity:'watch',code:'weight_low_fcr_ok',title:'وزن عقب‌تر با کارایی فعلاً مناسب',text:'فاصله وزن وجود دارد اما FCR فعلاً نامطلوب نیست؛ ADG، مصرف، زمان‌بندی رشد و یکنواختی بررسی شوند.'});if(bad(s.cv)&&bad(s.u10))o.push({severity:'high',code:'distribution_deterioration',title:'افت کیفیت توزیع وزن',text:'CV و یکنواختی ±۱۰٪ هم‌زمان نامطلوب‌اند؛ میانگین وزن به‌تنهایی کافی نیست.'});if(bad(s.mortality)&&bad(s.fcr))o.push({severity:'high',code:'survival_efficiency_down',title:'افت همزمان بقا و کارایی',text:'تلفات و FCR هر دو نامطلوب‌اند؛ روند زمانی و رخدادهای سلامت/مدیریت بررسی شوند.'});if(['worse_farther','crossed_to_worse'].includes(s.weight.trend?.movement)&&['worse_farther','crossed_to_worse'].includes(s.fcr.trend?.movement))o.push({severity:'high',code:'accelerating_gap',title:'دورشدن هم‌زمان از مرجع',text:'فاصله وزن و FCR از مرجع در ارزیابی‌های اخیر بیشتر شده است.'});if(s.weight.status==='watch'&&s.adg.trend?.direction==='improving')o.push({severity:'positive',code:'recovery_signal',title:'نشانه جبران رشد',text:'وزن هنوز پایین‌تر از مرجع است اما مسیر هدف‌محور افزایش وزن در حال بهبود است.'});return o}
function build(flock,rows){const rs=(Array.isArray(rows)?rows:[]).filter(Boolean).sort((a,b)=>(first(a,['week','week_number','production_week'])??9999)-(first(b,['week','week_number','production_week'])??9999)),last=rs.at(-1);if(!last)return{version:'BROILER-PI-V6.3',ready:false,readOnly:true,insights:[]};const strain=String(flock?.strain??flock?.flock_strain??flock?.genetics??flock?.genetic_line??flock?.breed??'').trim();const s={},seriesOut={};for(const m of Object.keys(defs)){const ref=referenceMeta(last,m,strain);s[m]={official:{...state(actual(last,m),target(last,m),m),reference:ref},trend:trend(rs,m,strain),forecast:forecast(rs,m),trajectory:trajectoryProfile(rs,m)};seriesOut[m]=series(rs,m,strain)}const w=weights(last),b=band(last,w),d=distribution(w,b?.referenceWeight??target(last,'weight')),ad={};for(const m of ['weight','fcr','cumulativeFcr','adg','mortality','cv','u10','u15','epef'])ad[m]=adaptive(rs,m);const officialStates=Object.fromEntries(Object.keys(s).map(k=>[k,s[k].official])),p=patterns(officialStates),trendInsights=explainTrend(s),multivariate=multivariateAnalysis(rs,s),differential=differentialAnalysis(rs,s,multivariate),forecastSummary=buildForecastSummary(rs,s),trajectorySynthesis=buildTrajectorySynthesis(s),multivariateForecast=forecastMultivariate(s),confidence=rs.length>=6?'high':rs.length>=4?'medium':rs.length>=3?'limited':'low',dataQuality={records:rs.length,minimumForTrend:3,minimumForAdaptive:4,minimumForForecast:3,weightSamples:w.length,completeCore:Object.keys(defs).filter(m=>actual(last,m)!==null&&target(last,m)!==null).length};return Object.freeze({version:'BROILER-PI-V6.3',ready:true,readOnly:true,source:'weekly_records → canonical broiler report model → intelligence',targetAuthority:'canonical-broiler-standards-engine',flockId:flock?.id||null,strain:flock?.strain||flock?.genetics||null,age:first(last,['age','age_days']),week:first(last,['week','week_number','production_week']),states:Object.freeze(s),series:Object.freeze(seriesOut),profile:Object.freeze({growth:s.weight.official,efficiency:s.fcr.official,survival:s.mortality.official,uniformity:s.u10.official}),weightBand:b,weightDistribution:d,sampleWeights:Object.freeze(w),adaptive:Object.freeze(ad),insights:Object.freeze(p),trendInsights:Object.freeze(trendInsights),multivariate:Object.freeze(multivariate.items||[]),multivariateAnalysis:Object.freeze(multivariate),differential:Object.freeze(differential),forecastSummary:Object.freeze(forecastSummary),trajectorySynthesis:Object.freeze(trajectorySynthesis),multivariateForecast:Object.freeze(multivariateForecast),dataQuality:Object.freeze(dataQuality),coverage:Object.freeze({records:rs.length,weightSamples:w.length,canonicalTargets:Object.keys(defs).filter(m=>target(last,m)!==null).length}),inputFingerprint:inputFingerprint(flock,rs),analysisConfidence:multivariate.matrix?.analysisConfidence||'low',causalConfidence:multivariate.matrix?.causalConfidence||'low',scenarioMatrix:Object.freeze(multivariate.matrix||{}),confidence,status:p.some(x=>x.severity==='high')?'critical':p.some(x=>x.severity==='watch')?'watch':'good'})}
global.AdineBroilerPerformanceIntelligenceV2=Object.freeze({version:'BROILER-PI-V6.3',build});})(typeof window!=='undefined'?window:globalThis);