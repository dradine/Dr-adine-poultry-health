/* ADINE — BROILER PERFORMANCE INTELLIGENCE ENGINE V1
   Read-only decision-support layer.
   INPUT CONTRACT: only the canonical broiler comprehensive/weekly evaluation model.
   RED LINES: no Supabase calls, no external standards lookup, no production writes,
   no recalculation of source KPIs, no changes to weekly calculations or standards.
*/
(function(global){'use strict';
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace(/٫/g,'.'));return Number.isFinite(x)?x:null};
  const pct=(a,b)=>a!==null&&b!==null&&b!==0?(a-b)/Math.abs(b)*100:null;
  const last=a=>Array.isArray(a)&&a.length?a[a.length-1]:null;
  const val=(r,keys)=>{for(const k of keys){const x=n(r?.[k]);if(x!==null)return x}return null};
  const standard=(r,keys)=>{for(const k of keys){const x=n(r?.[k]);if(x!==null)return x}return null};
  const dir=m=>['fcr','cumulative_fcr','mortality','mortality_rate','cv','water_feed_ratio'].includes(m)?'lower':'higher';
  const label={excellent:'ممتاز',good:'مطلوب',watch:'نیازمند پایش',critical:'نیازمند اقدام',unavailable:'قابل ارزیابی نیست'};
  function classify(deviation,direction){
    if(deviation===null)return 'unavailable';
    const adverse=direction==='lower'?Math.max(0,deviation):Math.max(0,-deviation);
    if(adverse<=1)return 'excellent';
    if(adverse<=3)return 'good';
    if(adverse<=7)return 'watch';
    return 'critical';
  }
  function metricState(metric,current,target){
    const c=n(current),t=n(target); if(c===null||t===null)return {status:'unavailable',deviation:null};
    const d=pct(c,t); return {status:classify(d,dir(metric)),deviation:d,direction:dir(metric)};
  }
  function trend(rows,metric){
    const a=(rows||[]).map(r=>val(r,metric.keys)).filter(x=>x!==null);if(a.length<2)return {available:false,direction:'insufficient'};
    const recent=a.slice(-3);const first=recent[0],lastv=recent[recent.length-1];const delta=pct(lastv,first);const worsening=metric.direction==='lower'?delta>1:delta<-1;
    const improving=metric.direction==='lower'?delta<-1:delta>1;
    return {available:true,direction:Math.abs(delta||0)<=1?'stable':worsening?'worsening':'improving',deltaPercent:delta};
  }
  function epefClass(v,genetics,strain){
    const x=n(v);if(x===null)return {status:'unavailable',text:'EPEF در ارزیابی هفتگی موجود نیست.'};
    const g=String(genetics||'').toLowerCase(),s=String(strain||'').toLowerCase();
    const ross=/ross/.test(g+' '+s);
    if(ross&&x>=505)return {status:'excellent',text:'در سطح 505+؛ این آستانه در برنامه Ross 505 Club آویژن برای سطح ممتاز صنعت بریتانیا استفاده می‌شود.'};
    if(ross&&x>=470)return {status:'good',text:'بالاتر از آستانه تاریخی 470 و نزدیک به سطح ممتاز مدرن Ross؛ تفسیر نهایی باید با مرجع همان سویه و سن انجام شود.'};
    return {status:'watch',text:'برای این EPEF مرجع مطلق مشترک و مستقل از سن/سویه وجود ندارد؛ مقایسه اصلی باید با مرجع همان گله انجام شود.'};
  }
  function relationship(current){
    const c=current||{};const out=[];
    const bw=c.weightState,adg=c.adgState,fcr=c.fcrState,cf=c.cumFcrState,mort=c.mortalityState,cv=c.cvState,u10=c.u10State,feed=c.feedState,water=c.waterState;
    if(bw?.status==='critical'&&fcr?.status==='critical')out.push({severity:'high',code:'growth_efficiency_down',title:'افت همزمان رشد و کارایی خوراک',text:'وزن نسبت به مرجع پایین و FCR نسبت به مرجع نامطلوب است. این الگو با کاهش کارایی رشد سازگار است و بررسی تغذیه، کیفیت خوراک، سلامت گوارشی، آب و شرایط محیطی را توجیه می‌کند؛ تشخیص بیماری از این الگو به‌تنهایی ممکن نیست.'});
    if(bw?.status==='excellent'&&fcr?.status==='critical')out.push({severity:'watch',code:'growth_efficiency_tradeoff',title:'رشد خوب با هزینه خوراک نامطلوب',text:'وزن نسبت به مرجع مطلوب است اما FCR نامطلوب‌تر از مرجع است؛ بنابراین رشد حاصل شده ولی کارایی تبدیل خوراک ضعیف‌تر است.'});
    if(bw?.status==='critical'&&fcr?.status==='good')out.push({severity:'watch',code:'growth_low_efficiency_not_primary',title:'وزن پایین بدون افت واضح FCR',text:'وزن پایین‌تر از مرجع است ولی FCR فعلاً در محدوده مطلوب قرار دارد؛ ابتدا روند ADG، سن/مرجع ژنتیکی و کفایت دریافت خوراک و آب بررسی شود.'});
    if(bw?.status==='excellent'&&adg?.trend?.direction==='worsening')out.push({severity:'watch',code:'future_growth_risk',title:'وزن فعلی خوب است اما روند رشد تضعیف شده',text:'وزن فعلی مناسب است، ولی روند ADG در ارزیابی‌های اخیر نامطلوب شده؛ این یک هشدار روندی است، نه پیش‌بینی قطعی افت آینده.'});
    if(bw?.status==='critical'&&adg?.trend?.direction==='improving')out.push({severity:'watch',code:'recovery',title:'گله در مسیر جبران است',text:'وزن فعلی پایین‌تر از مرجع است اما روند ADG بهبود یافته؛ وضعیت فعلی هنوز عقب‌ماندگی دارد ولی جهت حرکت مثبت است.'});
    if(cv?.status==='critical'&&(u10?.status==='critical'||u10?.status==='watch'))out.push({severity:'high',code:'uniformity_deterioration',title:'افت یکنواختی',text:'افزایش پراکندگی وزن همراه با افت یکنواختی نشان می‌دهد میانگین وزن به‌تنهایی نماینده وضعیت کل گله نیست.'});
    if(bw?.status==='excellent'&&cv?.status==='critical')out.push({severity:'watch',code:'good_mean_bad_distribution',title:'میانگین خوب با پراکندگی نامطلوب',text:'میانگین وزن مطلوب است اما CV بالا است؛ بخشی از گله می‌تواند از هدف فاصله داشته باشد.'});
    if(mort?.status==='critical'&&fcr?.status==='critical')out.push({severity:'high',code:'survival_efficiency_down',title:'افت همزمان بقا و کارایی',text:'افزایش تلفات همراه با FCR نامطلوب، کاهش واقعی کارایی گله را نشان می‌دهد و بررسی سلامت، مدیریت، آب، خوراک و محیط را ضروری می‌کند.'});
    if(feed?.current!==null&&bw?.current!==null&&feed?.target!==null){if(feed.deviation>5&&bw.deviation<0)out.push({severity:'watch',code:'feed_up_weight_down',title:'مصرف خوراک بالاتر با وزن پایین‌تر',text:'افزایش مصرف خوراک بدون دستیابی به وزن هدف، از نظر کارایی نیازمند بررسی است؛ کیفیت خوراک، سلامت گوارشی، محیط و صحت داده‌ها باید بررسی شوند.'});if(feed.deviation< -5&&bw.deviation<0)out.push({severity:'watch',code:'feed_down_weight_down',title:'کاهش دریافت خوراک همراه با افت رشد',text:'کاهش دریافت خوراک همراه با عقب‌ماندگی وزن با محدود شدن دریافت انرژی/مواد مغذی سازگار است؛ عوامل محیطی، آب، خوراک و سلامت باید بررسی شوند.'});}
    if(water?.current!==null&&feed?.current!==null&&water?.target!==null&&feed?.target!==null){if(water.deviation>10&&Math.abs(feed.deviation||0)<=5)out.push({severity:'watch',code:'water_up_feed_stable',title:'افزایش نامتناسب مصرف آب',text:'افزایش مصرف آب بدون افزایش متناظر خوراک یک سیگنال پشتیبان است و باید همراه با دما، رطوبت، کیفیت آب و وضعیت سلامت تفسیر شود.'});if(water.deviation< -10&&feed.deviation< -5)out.push({severity:'watch',code:'water_feed_down',title:'کاهش همزمان آب و خوراک',text:'کاهش همزمان آب و خوراک می‌تواند با کاهش دریافت همراه باشد و نیازمند بررسی دسترسی و کیفیت آب، خوراک و شرایط محیطی است.'});}
    if(cf?.status==='critical'&&fcr?.status!=='critical')out.push({severity:'watch',code:'cumulative_efficiency_gap',title:'فاصله تجمعی از هدف',text:'FCR تجمعی نامطلوب‌تر از مرجع است، حتی اگر FCR آخرین دوره هنوز بحرانی نباشد؛ بنابراین بخشی از افت کارایی مربوط به دوره‌های قبلی است.'});
    return out;
  }
  function build(flock,rows){
    const rws=Array.isArray(rows)?rows.filter(Boolean):[];const l=last(rws);if(!l)return {version:'BROILER-PI-V1',ready:false,reason:'no_weekly_data',insights:[],cards:[]};
    const age=val(l,['age','age_days']);
    const weight=val(l,['weight','average_weight_g','average_weight']);
    const fcr=val(l,['fcr']);const cumFcr=val(l,['cumulativeFcr','cumulative_fcr']);
    const cv=val(l,['cv','cv_percent']);const u10=val(l,['uniformity10','uniformity_10_percent','uniformity_10']);const u15=val(l,['uniformity15','uniformity_15_percent','uniformity_15']);
    const mort=val(l,['mortalityPercent','mortality','mortality_rate']);const liv=val(l,['livability']);
    const feed=val(l,['feed','feed_total_kg']);const water=val(l,['water','water_total_liter']);const wfr=val(l,['waterFeedRatio','water_feed_ratio']);
    const adg=val(l,['weeklyWeightGain','weekly_gain_g','average_daily_gain','adg']);
    const targets={weight:standard(l,['standardWeight','standard_weight']),fcr:standard(l,['standardWeeklyFcr','standard_fcr']),cumFcr:standard(l,['standardCumulativeFcr','standard_cumulative_fcr']),adg:standard(l,['standardWeeklyWeightGain','standard_adg','standardAverageDailyGain']),mort:standard(l,['standardMortalityPercent','standard_mortality','mortality_target']),cv:standard(l,['standardCv','standard_cv']),u10:standard(l,['standardUniformity10','standard_uniformity_10']),u15:standard(l,['standardUniformity15','standard_uniformity_15']),feed:standard(l,['standardFeed','standard_feed_total_kg']),water:standard(l,['standardWater','standard_water_total_liter']),wfr:standard(l,['standardWaterFeedRatio','standard_water_feed_ratio'])};
    const states={weightState:metricState('body_weight',weight,targets.weight),fcrState:metricState('fcr',fcr,targets.fcr),cumFcrState:metricState('cumulative_fcr',cumFcr,targets.cumFcr),adgState:metricState('weekly_weight_gain',adg,targets.adg),mortalityState:metricState('mortality',mort,targets.mort),cvState:metricState('cv',cv,targets.cv),u10State:metricState('uniformity_10',u10,targets.u10),u15State:metricState('uniformity_15',u15,targets.u15),feedState:metricState('feed',feed,targets.feed),waterState:metricState('water',water,targets.water),wfrState:metricState('water_feed_ratio',wfr,targets.wfr)};
    const trendDefs={weight:{keys:['weight','average_weight_g','average_weight'],direction:'higher'},adg:{keys:['weeklyWeightGain','weekly_gain_g','average_daily_gain','adg'],direction:'higher'},fcr:{keys:['fcr'],direction:'lower'},cumFcr:{keys:['cumulativeFcr','cumulative_fcr'],direction:'lower'},cv:{keys:['cv','cv_percent'],direction:'lower'},u10:{keys:['uniformity10','uniformity_10_percent','uniformity_10'],direction:'higher'},mortality:{keys:['mortalityPercent','mortality','mortality_rate'],direction:'lower'}};
    for(const [k,d] of Object.entries(trendDefs)){states[k+'Trend']=trend(rws,d);}
    states.weightState.trend=states.weightTrend;states.adgState.trend=states.adgTrend;states.fcrState.trend=states.fcrTrend;states.cvState.trend=states.cvTrend;states.u10State.trend=states.u10Trend;
    const epef=val(l,['epef','EPEF','pef','production_efficiency_factor']);const epefInfo=epefClass(epef,flock?.genetics,flock?.strain);
    const insights=relationship({...states});
    if(states.fcrState.status==='critical'&&states.cumFcrState.status==='critical')insights.unshift({severity:'high',code:'both_fcr_bad',title:'کارایی خوراک زیر فشار است',text:'هم FCR دوره و هم FCR تجمعی نسبت به مراجع ثبت‌شده نامطلوب‌اند؛ بنابراین مشکل فقط محدود به آخرین دوره نیست.'});
    if(states.weightState.status==='excellent'&&states.fcrState.status==='excellent'&&states.cvState.status==='excellent')insights.unshift({severity:'positive',code:'balanced_growth',title:'عملکرد متوازن',text:'رشد، کارایی خوراک و پراکندگی وزن همزمان در وضعیت مطلوب قرار دارند.'});
    const unique=[];for(const x of insights)if(!unique.some(y=>y.code===x.code))unique.push(x);
    const critical=Object.values(states).filter(x=>x&&x.status==='critical').length;
    const watch=Object.values(states).filter(x=>x&&x.status==='watch').length;
    const status=critical>=3?'critical':critical||watch>=2?'watch':'good';
    const missing=[];for(const [k,v] of Object.entries({weight,fcr,cumFcr,adg,cv,u10,u15,mort,feed,water,wfr,epef}))if(v===null)missing.push(k);
    return Object.freeze({version:'BROILER-PI-V1',ready:true,readOnly:true,source:'canonical weekly evaluation → comprehensive performance model',age,states:Object.freeze(states),targets:Object.freeze(targets),epef,epefInfo,insights:Object.freeze(unique.slice(0,8)),status,missing:Object.freeze(missing),coverage:Object.freeze({records:rws.length,latestDate:l.evaluationDate||l.evaluation_date||null})});
  }
  global.AdineBroilerPerformanceIntelligenceV1=Object.freeze({version:'BROILER-PI-V1',build,metricState,trend,epefClass,label});
})(typeof window!=='undefined'?window:globalThis);