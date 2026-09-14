/* ADINE BROILER PERFORMANCE — REFERENCE TREND INTERPRETER V4
 * Pure, read-only interpretation layer.
 * Consumes canonical actual/reference values only.
 * Never writes to Supabase and never changes standards or canonical calculations.
 *
 * Semantic rule: current position, magnitude, and direction of movement are separate.
 * The wording is generated from the actual sign of the current gap and its change;
 * it never assumes that an improving gap means the flock is still below reference.
 */
(function(global){
  'use strict';
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null;};
  const round=(x,d=3)=>Number.isFinite(Number(x))?Number(Number(x).toFixed(d)):null;
  const absPct=(actual,reference)=>{const a=n(actual),r=n(reference);return a===null||r===null||r===0?null:(a-r)/Math.abs(r)*100;};
  function regression(points){const p=(points||[]).map(z=>({x:n(z.x),y:n(z.y)})).filter(z=>z.x!==null&&z.y!==null).sort((a,b)=>a.x-b.x);if(p.length<3)return{available:false,code:'insufficient_history',n:p.length,minimum_n:3};const mx=p.reduce((s,z)=>s+z.x,0)/p.length,my=p.reduce((s,z)=>s+z.y,0)/p.length,sxx=p.reduce((s,z)=>s+(z.x-mx)**2,0);if(!sxx)return{available:false,code:'zero_x_variance',n:p.length};const slope=p.reduce((s,z)=>s+(z.x-mx)*(z.y-my),0)/sxx,intercept=my-slope*mx,residuals=p.map(z=>z.y-(intercept+slope*z.x)),sse=residuals.reduce((s,x)=>s+x*x,0),sst=p.reduce((s,z)=>s+(z.y-my)**2,0);return{available:true,n:p.length,slope:round(slope,5),r2:round(sst>0?1-sse/sst:1,3),first:p[0],last:p[p.length-1]};}
  function sourceInfo(row,key){const raw=String(row?.[key+'Source']??row?.standardSource??'').trim().toLowerCase(),name=row?.[key+'SourceName']??row?.[key+'SourceLabel']??row?.standardSourceName??row?.standardSourceLabel??null,year=n(row?.[key+'SourceYear']??row?.standardSourceYear),value=n(row?.[key]);if(raw==='official'||raw==='official-derived')return{type:raw,label:raw==='official-derived'?'مرجع رسمی مشتق‌شده':'مرجع رسمی',name,year,available:value!==null};if(raw==='scientific')return{type:'scientific',label:'مرجع علمی',name,year,available:value!==null};if(raw==='management')return{type:'management',label:'مرجع مدیریتی',name,year,available:value!==null};if(value!==null)return{type:'numeric',label:'مرجع عددی موجود',name,year,available:true};return{type:'missing',label:'مرجع معتبر موجود نیست',name:null,year:null,available:false};}
  /* Position is based on the actual current gap. A small positive/negative gap is
     still on the corresponding side of the reference, but is labelled "slightly"
     rather than being incorrectly described as the opposite side. */
  function position(gap,direction){
    if(gap===null)return{key:'unknown',label:'قابل قضاوت نیست',favorable:false};
    const near=2;
    if(direction==='higher'){
      if(gap>=near)return{key:'above',label:'بالاتر از مرجع',favorable:true};
      if(gap>0)return{key:'above_near',label:'کمی بالاتر از مرجع',favorable:true};
      if(gap<=-5)return{key:'below_material',label:'پایین‌تر از مرجع',favorable:false};
      if(gap<0)return{key:'below_near',label:'کمی پایین‌تر از مرجع',favorable:false};
      return{key:'near',label:'مطابق مرجع',favorable:null};
    }
    if(gap<=-near)return{key:'better',label:'بهتر از مرجع',favorable:true};
    if(gap<0)return{key:'better_near',label:'کمی بهتر از مرجع',favorable:true};
    if(gap>=5)return{key:'worse_material',label:'بدتر از مرجع',favorable:false};
    if(gap>0)return{key:'worse_near',label:'کمی بدتر از مرجع',favorable:false};
    return{key:'near',label:'مطابق مرجع',favorable:null};
  }
  function trendClass(improvement,currentPosition){if(improvement===null)return{key:'unknown',label:'روند نسبت به مرجع قابل قضاوت نیست',arrow:'→',mode:'unknown'};const a=Math.abs(improvement);if(a<0.5)return{key:'stable',label:'وضعیت نسبت به مرجع پایدار',arrow:'→',mode:'stable'};const favorable=currentPosition?.favorable===true;if(improvement>0){if(a>=5)return{key:'strong_improvement',label:favorable?'افزایش محسوس برتری نسبت به مرجع':'بهبود محسوس فاصله تا مرجع',arrow:'↗',mode:favorable?'advantage_increased':'gap_improved'};if(a>=1.5)return{key:'improvement',label:favorable?'افزایش برتری نسبت به مرجع':'بهبود فاصله تا مرجع',arrow:'↗',mode:favorable?'advantage_increased':'gap_improved'};return{key:'slight_improvement',label:favorable?'افزایش خفیف برتری نسبت به مرجع':'بهبود خفیف فاصله تا مرجع',arrow:'↗',mode:favorable?'advantage_increased':'gap_improved'};}if(a>=5)return{key:'strong_worsening',label:favorable?'کاهش محسوس برتری نسبت به مرجع':'بدتر شدن محسوس فاصله از مرجع',arrow:'↘',mode:favorable?'advantage_reduced':'gap_worsened'};if(a>=1.5)return{key:'worsening',label:favorable?'کاهش برتری نسبت به مرجع':'بدتر شدن فاصله از مرجع',arrow:'↘',mode:favorable?'advantage_reduced':'gap_worsened'};return{key:'slight_worsening',label:favorable?'کاهش خفیف برتری نسبت به مرجع':'بدتر شدن خفیف فاصله از مرجع',arrow:'↘',mode:favorable?'advantage_reduced':'gap_worsened'};}
  function build(metric,rows,opts){const direction=opts?.direction==='lower'?'lower':'higher',actualKey=opts?.actualKey||metric,referenceKey=opts?.referenceKey||'standard',label=opts?.label||metric,unit=opts?.unit||'',ordered=(rows||[]).slice().sort((a,b)=>(n(a.age)||0)-(n(b.age)||0)),points=ordered.map(r=>({age:n(r.age),actual:n(r[actualKey]),reference:n(r[referenceKey]),row:r})).filter(p=>p.age!==null&&p.actual!==null&&p.reference!==null);if(points.length<2)return{available:false,code:'insufficient_reference_history',n:points.length,minimum_n:2};const cur=points[points.length-1],prev=points[points.length-2],currentGap=absPct(cur.actual,cur.reference),previousGap=absPct(prev.actual,prev.reference),gapChange=currentGap!==null&&previousGap!==null?round(currentGap-previousGap,2):null,improvement=gapChange===null?null:(direction==='higher'?gapChange:-gapChange),actualChange=absPct(cur.actual,prev.actual),referenceChange=absPct(cur.reference,prev.reference),actualSlope=regression(points.map(p=>({x:p.age,y:p.actual}))),referenceSlope=regression(points.map(p=>({x:p.age,y:p.reference}))),gapSlope=regression(points.map(p=>({x:p.age,y:currentSignedGap(p,direction)}))),pos=position(currentGap,direction),trend=trendClass(improvement,pos),src=sourceInfo(cur.row,referenceKey),favorable=improvement!==null&&improvement>0.5,unfavorable=improvement!==null&&improvement<-0.5;
    let outlook='';
    if(trend.mode==='advantage_increased'){
      outlook=trend.key==='strong_improvement'?'گله در حال حاضر بالاتر/بهتر از مرجع قرار دارد و برتری آن نسبت به مرجع به‌طور محسوسی افزایش یافته است؛ جهت حرکت مطلوب است.':'گله در حال حاضر بالاتر/بهتر از مرجع قرار دارد و برتری آن نسبت به مرجع در حال افزایش است؛ جهت حرکت مثبت است.';
    }else if(trend.mode==='gap_improved'){
      if(pos.key==='above'||pos.key==='above_near') outlook=trend.key==='strong_improvement'?'گله در حال حاضر بالاتر از مرجع قرار دارد و فاصله مطلوب آن به‌طور محسوسی افزایش یافته است؛ عملکرد فعلی مطلوب و روند نیز مثبت است.':'گله در حال حاضر بالاتر از مرجع قرار دارد و فاصله مطلوب آن در حال افزایش است؛ عملکرد فعلی مطلوب و روند مثبت است.';
      else if(pos.key==='near') outlook='گله در حال حاضر تقریباً مطابق مرجع است و فاصله در جهت مطلوب حرکت کرده است؛ روند مثبت است.';
      else outlook=trend.key==='strong_improvement'?'گله هنوز پایین‌تر از مرجع قرار دارد، اما فاصله آن به‌طور محسوسی در جهت مطلوب کاهش یافته است؛ روند جبرانی مثبت است.':'گله هنوز پایین‌تر از مرجع قرار دارد، اما فاصله آن در جهت مطلوب در حال کاهش است؛ روند جبرانی مثبت است.';
    }else if(trend.mode==='advantage_reduced'){
      outlook=trend.key==='strong_worsening'?'گله همچنان بهتر از مرجع است، اما برتری آن به‌طور محسوسی کاهش یافته است؛ وضعیت فعلی مطلوب است ولی جهت حرکت نیازمند توجه است.':'گله همچنان بهتر از مرجع است، اما بخشی از برتری نسبت به ثبت قبلی کاهش یافته است؛ روند بعدی باید پایش شود.';
    }else if(trend.mode==='gap_worsened'){
      if(pos.key==='above'||pos.key==='above_near') outlook=trend.key==='strong_worsening'?'گله همچنان بالاتر از مرجع است، اما فاصله مطلوب آن به‌طور محسوسی کاهش یافته است؛ وضعیت فعلی هنوز مطلوب است ولی روند نیازمند توجه است.':'گله همچنان بالاتر از مرجع است، اما بخشی از برتری نسبت به ثبت قبلی کاهش یافته است؛ روند بعدی باید پایش شود.';
      else if(pos.key==='near') outlook='گله نزدیک به مرجع است، اما فاصله در جهت نامطلوب حرکت کرده است؛ لازم است ثبت بعدی با دقت پایش شود.';
      else outlook=trend.key==='strong_worsening'?'گله پایین‌تر از مرجع قرار دارد و فاصله در جهت نامطلوب به‌طور محسوسی بیشتر شده است؛ بررسی مدیریتی و عملکردی توصیه می‌شود.':'گله نسبت به مرجع نامطلوب‌تر شده و فاصله در جهت نامناسب حرکت کرده است؛ پایش نزدیک‌تر توصیه می‌شود.';
    }else if(trend.mode==='stable'){
      outlook=pos.favorable===true?'گله در حال حاضر بهتر از مرجع است و این برتری تقریباً حفظ شده است.':pos.favorable===false?'گله در حال حاضر از مرجع عقب‌تر است، اما فاصله فعلاً تغییر محسوسی نکرده است.':'گله تقریباً مطابق مرجع است و تغییر محسوسی در فاصله آن دیده نمی‌شود.';
    }else{
      outlook=pos.favorable===true?'گله در حال حاضر بهتر از مرجع است، اما برای قضاوت درباره جهت روند داده کافی در دسترس نیست.':pos.favorable===false?'گله در حال حاضر از مرجع عقب‌تر است، اما برای قضاوت درباره جهت روند داده کافی در دسترس نیست.':'گله نزدیک به مرجع است، اما برای قضاوت درباره جهت روند داده کافی در دسترس نیست.';
    }
    return{available:true,metric,label,unit,direction,n:points.length,currentGap,previousGap,gapChange,improvement,actualChange,referenceChange,actualSlope,referenceSlope,gapSlope,trend,position:pos,source:src,favorable,unfavorable,outlook,points,currentAge:cur.age,previousAge:prev.age,currentValue:cur.actual,currentReference:cur.reference,previousValue:prev.actual,previousReference:prev.reference};
  }
  function currentSignedGap(p,direction){const g=absPct(p.actual,p.reference);return direction==='lower'?-g:g;}
  function narrative(ev){if(!ev?.available)return'داده مرجع کافی برای تفسیر روند در دسترس نیست.';const gapNow=ev.currentGap===null?'نامشخص':`${ev.currentGap>0?'+':''}${ev.currentGap.toFixed(1)}٪`,gapPrev=ev.previousGap===null?'نامشخص':`${ev.previousGap>0?'+':''}${ev.previousGap.toFixed(1)}٪`,change=ev.gapChange===null?'نامشخص':`${ev.gapChange>0?'+':''}${ev.gapChange.toFixed(1)} واحد درصد`;return`${ev.label} در آخرین ثبت ${ev.position.label} قرار دارد (${gapNow}). در ثبت قبلی فاصله ${gapPrev} بود؛ بنابراین فاصله نسبت به مرجع ${change} تغییر کرده است. ${ev.outlook}`;}
  global.AdineBroilerReferenceInterpreterV1={version:'BROILER-REFERENCE-INTERPRETER-V4',build,narrative,sourceInfo};
})(typeof window!=='undefined'?window:globalThis);
