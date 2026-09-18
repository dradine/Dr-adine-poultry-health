/* ADINE — BROILER PERFORMANCE INTELLIGENCE ENGINE V4.3 */
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
function gap(a,t,m){a=n(a);t=n(t);if(a===null||t===null||t===0)return null;return lower.has(m)?(t-a)/Math.abs(t):(a-t)/Math.abs(t)}
function state(a,t,m){const g=gap(a,t,m);if(g===null)return{status:'unavailable',current:n(a),target:n(t),gap:null,gapPercent:null,deviation:null,direction:lower.has(m)?'lower':'higher'};if(m==='epef'){const x=n(a);let status='critical';if(x>=505)status='excellent';else if(x>=450)status='good';else if(x>=430)status='on_target';else if(x>=400)status='watch';return{status,current:x,target:n(t),gap:g,gapPercent:g*100,deviation:(x-n(t))/Math.abs(n(t))*100,direction:'higher',thresholds:{excellent:505,good:450,on_target:430,watch:400}}}const p=g*100;return{status:p>7?'excellent':p>3?'good':p>=-3?'on_target':p>=-7?'watch':'critical',current:n(a),target:n(t),gap:g,gapPercent:p,deviation:(n(a)-n(t))/Math.abs(n(t))*100,direction:lower.has(m)?'lower':'higher'}}
function trend(rows,m){const p=rows.map(r=>gap(actual(r,m),target(r,m),m)).filter(x=>x!==null);if(p.length<2)return{available:false,direction:'insufficient',movement:'insufficient',pointsUsed:p.length};const z=p.slice(-Math.min(5,p.length)),a=z.at(-1)*100,b=z.at(-2)*100,d=a-b,da=Math.abs(a)-Math.abs(b);return{available:true,pointsUsed:z.length,direction:Math.abs(d)<.5?'stable':d>0?'improving':'worsening',performanceDirection:Math.abs(d)<.5?'stable':d>0?'improving':'worsening',movement:Math.abs(da)<.5?'stable':da<0?'closer':'farther',currentGapPercent:a,previousGapPercent:b,distanceDeltaPercent:da}}
function weights(r){const c=[r?.weights,r?.sample_weights,r?.sampleWeights,r?.weight_samples,r?.raw?.weights,r?.raw?.sample_weights,r?.raw?.sampleWeights,r?.raw?.weight_samples,r?.production_metrics?.weights,r?.raw?.production_metrics?.weights];for(let v of c){if(typeof v==='string'){try{v=JSON.parse(v)}catch(_){v=null}}if(v&&typeof v==='object'&&!Array.isArray(v))v=v.weights||v.values||v.samples;if(Array.isArray(v)){const o=v.map(n).filter(x=>x!==null&&x>0);if(o.length)return o}}return[]}
function band(r,w){const t=target(r,'weight');if(t===null||!w.length)return null;const c10=w.filter(x=>x>=t*.9&&x<=t*1.1).length,c15=w.filter(x=>x>=t*.85&&x<=t*1.15).length;return{referenceWeight:t,sampleCount:w.length,within10:c10,between10and15:Math.max(0,c15-c10),outside15:Math.max(0,w.length-c15),within10Percent:c10*100/w.length,between10and15Percent:Math.max(0,c15-c10)*100/w.length,outside15Percent:Math.max(0,w.length-c15)*100/w.length}}
function distribution(w,t){if(!w.length)return null;const s=[...w].sort((a,b)=>a-b),mean=w.reduce((a,b)=>a+b,0)/w.length,sd=Math.sqrt(w.reduce((a,b)=>a+(b-mean)**2,0)/w.length),q=p=>{const i=(s.length-1)*p,b=Math.floor(i),f=i-b;return s[b]+(s[b+1]-s[b]||0)*f};return{mean,sd,cv:mean?sd/mean*100:null,min:s[0],max:s.at(-1),median:q(.5),p10:q(.1),p90:q(.9),centerGapPercent:t?(mean-t)/t*100:null}}
function adaptive(rows,m){const p=rows.map(r=>gap(actual(r,m),target(r,m),m)).filter(x=>x!==null).map(x=>x*100);if(p.length<4)return{available:false,reason:'برای هشدار تطبیقی اولیه حداقل ۴ ارزیابی لازم است',pointsUsed:Math.max(0,p.length-1),minimumEvaluations:4};const h=p.slice(0,-1).sort((a,b)=>a-b),med=h[Math.floor(h.length/2)],dev=h.map(x=>Math.abs(x-med)).sort((a,b)=>a-b),mad=dev[Math.floor(dev.length/2)]||0,limit=Math.max(3,3*1.4826*mad),cur=p.at(-1);return{available:true,currentGapPercent:cur,baselineMedianPercent:med,mad,controlLimitPercent:limit,anomaly:Math.abs(cur-med)>limit,pointsUsed:h.length,minimumEvaluations:4,mode:p.length>=5?'stable-adaptive':'early-adaptive'}}
function regression(values){
 const y=values.filter(v=>Number.isFinite(v)); if(y.length<3)return null;
 const n=y.length, xbar=(n-1)/2, ybar=y.reduce((a,b)=>a+b,0)/n;
 let num=0,den=0; for(let i=0;i<n;i++){num+=(i-xbar)*(y[i]-ybar);den+=(i-xbar)**2}
 const slope=den?num/den:0, intercept=ybar-slope*xbar;
 const fitted=y.map((_,i)=>intercept+slope*i);
 const rmse=Math.sqrt(y.reduce((a,v,i)=>a+(v-fitted[i])**2,0)/n);
 return {slope,rmse,points:n,nextGapPercent:intercept+slope*n};
}
function forecast(rows,m){
 const vals=rows.map(r=>gap(actual(r,m),target(r,m),m)).filter(x=>x!==null).slice(-5).map(x=>x*100);
 const reg=regression(vals); if(!reg)return{available:false,reason:'برای چشم‌انداز حداقل ۳ ارزیابی معتبر لازم است'};
 const cur=vals.at(-1),next=reg.nextGapPercent,delta=next-cur;
 const direction=Math.abs(delta)<0.7?'stable':delta>0?'improving':'worsening';
 const uncertainty=Math.max(0.8,reg.rmse*1.96);
 let risk='stable';
 if(Math.abs(next)>=7)risk=next<0?'high-negative':'high-positive';
 else if(Math.abs(next)>=3)risk=next<0?'moderate-negative':'moderate-positive';
 return {available:true,pointsUsed:reg.points,slopePerEvaluation:reg.slope,currentGapPercent:cur,projectedGapPercent:next,changePercent:delta,uncertaintyPercent:uncertainty,direction,risk,conditional:true};
}
function explainTrend(s){
 const out=[];
 const f=s.fcr?.official,w=s.weight?.official,c=s.cv?.official,u=s.u10?.official,m=s.mortality?.official;
 if(w&&f&&w.status!=='unavailable'&&f.status!=='unavailable'){
   if((w.status==='good'||w.status==='excellent')&&(f.status==='watch'||f.status==='critical'))
     out.push({type:'tradeoff',severity:'watch',title:'رشد حفظ شده، اما کارایی خوراک تحت فشار است',evidence:['وزن','FCR'],text:'وزن فعلی نسبت به مرجع مناسب است، اما FCR در جهت نامطلوب قرار دارد؛ در صورت تداوم این الگو، فشار روی کارایی تجمعی می‌تواند افزایش یابد.'});
   else if((w.status==='watch'||w.status==='critical')&&(f.status==='good'||f.status==='excellent'))
     out.push({type:'tradeoff',severity:'watch',title:'فاصله وزن با وجود کارایی مناسب خوراک',evidence:['وزن','FCR'],text:'FCR فعلاً مناسب است اما وزن از مرجع عقب‌تر است؛ تمرکز تحلیل باید روی سرعت رشد و یکنواختی باشد، نه صرفاً مصرف خوراک.'});
 }
 if(c&&u&&c.trend?.movement==='farther'&&u.trend?.movement==='farther')
   out.push({type:'distribution',severity:'high',title:'کیفیت توزیع وزن در حال تضعیف است',evidence:['CV','U10'],text:'CV از مرجع دورتر و U10 نیز نامطلوب‌تر شده است؛ این هم‌جهتی، کاهش یکنواختی مؤثر گله را محتمل‌تر می‌کند.'});
 if(m&&f&&m.trend?.direction==='worsening'&&f.trend?.direction==='worsening')
   out.push({type:'survival-efficiency',severity:'high',title:'فشار همزمان بر بقا و کارایی',evidence:['تلفات','FCR'],text:'تلفات و FCR در جهت نامطلوب حرکت کرده‌اند؛ علت از این داده‌ها قابل تعیین نیست و بررسی همزمان سلامت، محیط، آب و خوراک لازم است.'});
 return out;
}
function buildForecastSummary(s){
 const candidates=[];
 for(const [key,label] of [['weight','وزن'],['fcr','FCR'],['cumulativeFcr','FCR تجمعی'],['adg','افزایش وزن'],['mortality','تلفات'],['cv','CV'],['u10','U10'],['u15','U15']]){
   const f=s[key]?.forecast; if(!f?.available)continue;
   const worsening=f.direction==='worsening';
   candidates.push({key,label,forecast:f,priority:(worsening?2:0)+Math.abs(f.projectedGapPercent)/10});
 }
 candidates.sort((a,b)=>b.priority-a.priority);
 const risk=candidates.find(x=>x.forecast.direction==='worsening');
 const improve=candidates.find(x=>x.forecast.direction==='improving');
 return {risk:risk||null,improve:improve||null,ranked:candidates.slice(0,5)};
}
function patterns(s){const o=[],bad=x=>x?.status==='watch'||x?.status==='critical',good=x=>x?.status==='good'||x?.status==='excellent';if(bad(s.weight)&&bad(s.fcr))o.push({severity:'high',code:'growth_efficiency_down',title:'افت همزمان رشد و کارایی خوراک',text:'وزن و FCR هر دو نسبت به مرجع کاننیکال نامطلوب‌اند؛ خوراک، آب، محیط و سلامت باید هم‌زمان بررسی شوند.'});if(good(s.weight)&&bad(s.fcr))o.push({severity:'watch',code:'growth_efficiency_tradeoff',title:'رشد مناسب با کارایی ضعیف‌تر',text:'وزن مناسب است اما FCR نامطلوب است؛ وزن به‌تنهایی عملکرد کامل را تأیید نمی‌کند.'});if(bad(s.weight)&&good(s.fcr))o.push({severity:'watch',code:'weight_low_fcr_ok',title:'وزن عقب‌تر با کارایی فعلاً مناسب',text:'فاصله وزن وجود دارد اما FCR فعلاً نامطلوب نیست؛ ADG، مصرف، زمان‌بندی رشد و یکنواختی بررسی شوند.'});if(bad(s.cv)&&bad(s.u10))o.push({severity:'high',code:'distribution_deterioration',title:'افت کیفیت توزیع وزن',text:'CV و یکنواختی ±۱۰٪ هم‌زمان نامطلوب‌اند؛ میانگین وزن به‌تنهایی کافی نیست.'});if(bad(s.mortality)&&bad(s.fcr))o.push({severity:'high',code:'survival_efficiency_down',title:'افت همزمان بقا و کارایی',text:'تلفات و FCR هر دو نامطلوب‌اند؛ روند زمانی و رخدادهای سلامت/مدیریت بررسی شوند.'});if(s.weight.trend?.movement==='farther'&&s.fcr.trend?.movement==='farther')o.push({severity:'high',code:'accelerating_gap',title:'دورشدن هم‌زمان از مرجع',text:'فاصله وزن و FCR از مرجع در ارزیابی‌های اخیر بیشتر شده است.'});if(s.weight.status==='watch'&&s.adg.trend?.direction==='improving')o.push({severity:'positive',code:'recovery_signal',title:'نشانه جبران رشد',text:'وزن هنوز پایین‌تر از مرجع است اما مسیر هدف‌محور افزایش وزن در حال بهبود است.'});return o}
function build(flock,rows){const rs=(Array.isArray(rows)?rows:[]).filter(Boolean).sort((a,b)=>(first(a,['week','week_number','production_week'])??9999)-(first(b,['week','week_number','production_week'])??9999)),last=rs.at(-1);if(!last)return{version:'BROILER-PI-V4.0',ready:false,readOnly:true,insights:[]};const s={};for(const m of Object.keys(defs)){s[m]={official:state(actual(last,m),target(last,m),m),trend:trend(rs,m),forecast:forecast(rs,m)}}const w=weights(last),b=band(last,w),d=distribution(w,b?.referenceWeight??target(last,'weight')),ad={};for(const m of ['weight','fcr','cumulativeFcr','adg','mortality','cv','u10','u15','epef'])ad[m]=adaptive(rs,m);const officialStates=Object.fromEntries(Object.keys(s).map(k=>[k,s[k].official]));const p=patterns(officialStates);const trendInsights=explainTrend(s);const forecastSummary=buildForecastSummary(s);return Object.freeze({version:'BROILER-PI-V4.3',ready:true,readOnly:true,source:'weekly_records → canonical broiler report model → intelligence',targetAuthority:'canonical-broiler-standards-engine',flockId:flock?.id||null,strain:flock?.strain||flock?.genetics||null,age:first(last,['age','age_days']),week:first(last,['week','week_number','production_week']),states:Object.freeze(s),profile:Object.freeze({growth:s.weight.official,efficiency:s.fcr.official,survival:s.mortality.official,uniformity:s.u10.official}),weightBand:b,weightDistribution:d,sampleWeights:Object.freeze(w),adaptive:Object.freeze(ad),insights:Object.freeze(p),trendInsights:Object.freeze(trendInsights),forecastSummary:Object.freeze(forecastSummary),coverage:Object.freeze({records:rs.length,weightSamples:w.length,canonicalTargets:Object.keys(defs).filter(m=>target(last,m)!==null).length}),confidence:rs.length>=5?'high':rs.length>=2?'medium':'low',status:p.some(x=>x.severity==='high')?'critical':p.some(x=>x.severity==='watch')?'watch':'good'})}
global.AdineBroilerPerformanceIntelligenceV2=Object.freeze({version:'BROILER-PI-V4.3',build});})(typeof window!=='undefined'?window:globalThis);