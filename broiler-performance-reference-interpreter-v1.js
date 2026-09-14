/* ADINE BROILER PERFORMANCE — REFERENCE TREND INTERPRETER V1
 * Pure, read-only interpretation layer.
 * Consumes canonical actual/reference values only.
 * Never writes to Supabase and never changes standards or canonical calculations.
 */
(function(global){
  'use strict';

  const n=v=>{
    if(v===null||v===undefined||v==='')return null;
    const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));
    return Number.isFinite(x)?x:null;
  };
  const round=(x,d=3)=>Number.isFinite(Number(x))?Number(Number(x).toFixed(d)):null;
  const absPct=(actual,reference)=>{
    const a=n(actual),r=n(reference);
    return a===null||r===null||r===0?null:(a-r)/Math.abs(r)*100;
  };
  const signed=(v,d=1)=>{
    const x=n(v);
    if(x===null)return null;
    return Number(x.toFixed(d));
  };

  function regression(points){
    const p=(points||[]).map(z=>({x:n(z.x),y:n(z.y)})).filter(z=>z.x!==null&&z.y!==null).sort((a,b)=>a.x-b.x);
    if(p.length<3)return{available:false,code:'insufficient_history',n:p.length,minimum_n:3};
    const mx=p.reduce((s,z)=>s+z.x,0)/p.length;
    const my=p.reduce((s,z)=>s+z.y,0)/p.length;
    const sxx=p.reduce((s,z)=>s+(z.x-mx)**2,0);
    if(!sxx)return{available:false,code:'zero_x_variance',n:p.length};
    const slope=p.reduce((s,z)=>s+(z.x-mx)*(z.y-my),0)/sxx;
    const intercept=my-slope*mx;
    const residuals=p.map(z=>z.y-(intercept+slope*z.x));
    const sse=residuals.reduce((s,x)=>s+x*x,0);
    const sst=p.reduce((s,z)=>s+(z.y-my)**2,0);
    return{
      available:true,n:p.length,slope:round(slope,5),r2:round(sst>0?1-sse/sst:1,3),first:p[0],last:p[p.length-1]
    };
  }

  function sourceInfo(row,key){
    const raw=String(row?.[key+'Source']??row?.standardSource??'').trim().toLowerCase();
    const name=row?.[key+'SourceName']??row?.[key+'SourceLabel']??row?.standardSourceName??row?.standardSourceLabel??null;
    const year=n(row?.[key+'SourceYear']??row?.standardSourceYear);
    const value=n(row?.[key]);
    if(raw==='official'||raw==='official-derived'){
      return{type:raw,label:raw==='official-derived'?'مرجع رسمی مشتق‌شده':'مرجع رسمی',name,year,available:value!==null};
    }
    if(raw==='scientific')return{type:'scientific',label:'مرجع علمی',name,year,available:value!==null};
    if(raw==='management')return{type:'management',label:'مرجع مدیریتی',name,year,available:value!==null};
    if(value!==null)return{type:'numeric',label:'مرجع عددی موجود',name,year,available:true};
    return{type:'missing',label:'مرجع معتبر موجود نیست',name:null,year:null,available:false};
  }

  function position(gap,direction){
    if(gap===null)return{key:'unknown',label:'قابل قضاوت نیست'};
    if(direction==='higher'){
      if(gap>=2)return{key:'above',label:'بالاتر از مرجع'};
      if(gap<=-5)return{key:'below_material',label:'پایین‌تر از مرجع'};
      if(gap<0)return{key:'below_near',label:'کمی پایین‌تر از مرجع'};
      return{key:'near',label:'نزدیک به مرجع'};
    }
    if(gap<=-2)return{key:'better',label:'بهتر از مرجع'};
    if(gap>=5)return{key:'worse_material',label:'بدتر از مرجع'};
    if(gap>0)return{key:'worse_near',label:'کمی بدتر از مرجع'};
    return{key:'near',label:'نزدیک به مرجع'};
  }

  function trendClass(improvement,delta){
    if(improvement===null)return{key:'unknown',label:'روند نسبت به مرجع قابل قضاوت نیست',arrow:'→'};
    const a=Math.abs(improvement);
    if(a<0.5)return{key:'stable',label:'پایدار نسبت به مرجع',arrow:'→'};
    if(improvement>=5)return{key:'strong_improvement',label:'بهبود معنادار نسبت به مرجع',arrow:'↗'};
    if(improvement>=1.5)return{key:'improvement',label:'بهبود نسبت به مرجع',arrow:'↗'};
    if(improvement>0)return{key:'slight_improvement',label:'بهبود خفیف نسبت به مرجع',arrow:'↗'};
    if(improvement<=-5)return{key:'strong_worsening',label:'بدتر شدن معنادار نسبت به مرجع',arrow:'↘'};
    if(improvement<=-1.5)return{key:'worsening',label:'فاصله نامطلوب‌تر نسبت به مرجع',arrow:'↘'};
    return{key:'slight_worsening',label:'بدتر شدن خفیف نسبت به مرجع',arrow:'↘'};
  }

  function build(metric,rows,opts){
    const direction=opts?.direction==='lower'?'lower':'higher';
    const actualKey=opts?.actualKey||metric;
    const referenceKey=opts?.referenceKey||'standard';
    const label=opts?.label||metric;
    const unit=opts?.unit||'';
    const ordered=(rows||[]).slice().sort((a,b)=>(n(a.age)||0)-(n(b.age)||0));
    const points=ordered.map(r=>({
      age:n(r.age),actual:n(r[actualKey]),reference:n(r[referenceKey]),row:r
    })).filter(p=>p.age!==null&&p.actual!==null&&p.reference!==null);
    if(points.length<2)return{available:false,code:'insufficient_reference_history',n:points.length,minimum_n:2};

    const cur=points[points.length-1];
    const prev=points[points.length-2];
    const currentGap=absPct(cur.actual,cur.reference);
    const previousGap=absPct(prev.actual,prev.reference);
    const gapChange=currentGap!==null&&previousGap!==null?round(currentGap-previousGap,2):null;
    const improvement=gapChange===null?null:(direction==='higher'?gapChange:-gapChange);
    const actualChange=absPct(cur.actual,prev.actual);
    const referenceChange=absPct(cur.reference,prev.reference);
    const actualSlope=regression(points.map(p=>({x:p.age,y:p.actual})));
    const referenceSlope=regression(points.map(p=>({x:p.age,y:p.reference})));
    const gapSlope=regression(points.map(p=>({x:p.age,y:currentSignedGap(p,direction)})));
    const trend=trendClass(improvement,gapChange);
    const pos=position(currentGap,direction);
    const src=sourceInfo(cur.row,referenceKey);
    const favorable=(improvement!==null&&improvement>0.5);
    const unfavorable=(improvement!==null&&improvement<-0.5);

    let outlook='';
    if(trend.key==='strong_improvement')outlook='روند بسیار امیدوارکننده است؛ فاصله نسبت به مرجع به‌طور محسوسی در حال بهبود است.';
    else if(trend.key==='improvement')outlook='روند امیدوارکننده است و گله نسبت به مسیر مرجع در جهت مطلوب حرکت کرده است.';
    else if(trend.key==='slight_improvement')outlook='جهت حرکت مطلوب است، اما شدت بهبود هنوز محدود است و ادامه پایش لازم است.';
    else if(trend.key==='stable')outlook='فاصله از مرجع تقریباً پایدار مانده و تغییر معنی‌داری نسبت به ثبت قبلی دیده نمی‌شود.';
    else if(trend.key==='slight_worsening')outlook='فاصله کمی نامطلوب‌تر شده است؛ هنوز به‌تنهایی نشانه افت جدی نیست، اما باید در ثبت بعدی پایش شود.';
    else if(trend.key==='worsening')outlook='فاصله از مرجع در جهت نامطلوب حرکت کرده و نیاز به پایش نزدیک‌تر دارد.';
    else if(trend.key==='strong_worsening')outlook='فاصله از مرجع به‌طور محسوسی بدتر شده و بررسی عوامل مدیریتی و عملکردی توصیه می‌شود.';
    else outlook='برای قضاوت روند، داده کافی در دسترس نیست.';

    return{
      available:true,metric,label,unit,direction,n:points.length,currentGap,previousGap,gapChange,improvement,actualChange,referenceChange,
      actualSlope,referenceSlope,gapSlope,trend,position:pos,source:src,favorable,unfavorable,outlook,points,
      currentAge:cur.age,previousAge:prev.age,currentValue:cur.actual,currentReference:cur.reference,previousValue:prev.actual,previousReference:prev.reference
    };
  }

  function currentSignedGap(p,direction){
    const g=absPct(p.actual,p.reference);
    return direction==='lower'?-g:g;
  }

  function narrative(ev){
    if(!ev?.available)return 'داده مرجع کافی برای تفسیر روند در دسترس نیست.';
    const g=ev.currentGap,pg=ev.previousGap,dc=ev.gapChange;
    const pos=ev.position.label.toLowerCase();
    const gapNow=g===null?'نامشخص':`${g>0?'+':''}${g.toFixed(1)}٪`;
    const gapPrev=pg===null?'نامشخص':`${pg>0?'+':''}${pg.toFixed(1)}٪`;
    const change=dc===null?'نامشخص':`${dc>0?'+':''}${dc.toFixed(1)} واحد درصد`;
    return `${ev.label} در آخرین ثبت ${pos} قرار دارد (${gapNow}). در ثبت قبلی فاصله ${gapPrev} بود؛ بنابراین فاصله نسبت به مرجع ${change} تغییر کرده است. ${ev.outlook}`;
  }

  global.AdineBroilerReferenceInterpreterV1={version:'BROILER-REFERENCE-INTERPRETER-V1',build,narrative,sourceInfo};
})(typeof window!=='undefined'?window:globalThis);
