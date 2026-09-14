/* ADINE BROILER PERFORMANCE — REFERENCE-AWARE TREND LAYER V5
 * Presentation adapter for the isolated reference interpreter.
 * Read-only: canonical weekly data, official standards and management benchmarks remain authoritative.
 */
(function(global){
'use strict';
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
const fmt=(v,d=1)=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
const signed=(v,d=1)=>{const x=n(v);return x===null?'—':(x>0?'+':'')+fmt(x,d)};
const pct=(v,d=1)=>n(v)===null?'—':fmt(v,d)+'٪';
const card=label=>[...document.querySelectorAll('.bpi3-card')].find(c=>c.querySelector('.bpi3-card-label')?.textContent.trim()===label);
const releaseCard=c=>c?.classList.remove('bpi3-ref-pending');
function pendingCards(){['روند وزن','روند FCR','روند CV'].forEach(label=>card(label)?.classList.add('bpi3-ref-pending'))}
function injectStyle(){if(document.getElementById('bpi3-reference-layer-style'))return;const s=document.createElement('style');s.id='bpi3-reference-layer-style';s.textContent='.bpi3-ref-pending{visibility:hidden!important}';(document.head||document.documentElement).appendChild(s)}
function sourceLabel(row,key){
  const v=n(row?.[key]),s=String(row?.[key+'Source']??'').trim().toLowerCase(),name=row?.[key+'SourceName']??row?.[key+'SourceLabel'],year=n(row?.[key+'SourceYear']);
  let base='';
  if(s==='official')base='مرجع رسمی';
  else if(s==='official-derived')base='مرجع رسمی مشتق‌شده';
  else if(s==='scientific')base='مرجع علمی';
  else if(s==='management')base='مرجع مدیریتی';
  else if(v!==null)base='مرجع عددی موجود';
  else base='مرجع معتبر موجود نیست';
  if(name)base+=` · ${name}`;
  if(year)base+=` (${fmt(year,0)})`;
  return base;
}
async function resolveRows(rows,flock,id){
  const out=(rows||[]).map(r=>({...r}));
  if(!global.supabaseClient||!id)return out;
  const genetics=flock?.genetics??flock?.genetic_line??null,strain=flock?.strain??null;
  for(const r of out){
    const date=r.raw?.evaluation_date||r.raw?.record_date||new Date().toISOString().slice(0,10);
    for(const [metric,key,std] of [['body_weight','weight','standardWeight'],['fcr_cumulative','cumulativeFcr','standardCumulativeFcr'],['cv','cv','standardCv']]){
      const current=n(r[key]),age=n(r.age);
      if(current===null||age===null)continue;
      const hasRef=n(r[std])!==null,hasSource=!!r[std+'Source'];
      if(hasRef&&hasSource)continue;
      try{
        const q=await global.supabaseClient.rpc('calculate_performance_intelligence',{p_flock_id:id,p_evaluation_date:date,p_age_days:Number(age),p_metric:metric,p_current_value:current,p_production_type:'broiler',p_genetics:genetics,p_strain:strain});
        if(q.error||!q.data?.ok)continue;
        if(n(q.data.target)!==null)r[std]=n(q.data.target);
        if(q.data.source_type)r[std+'Source']=q.data.source_type;
        if(q.data.source_name)r[std+'SourceName']=q.data.source_name;
        if(q.data.source_year)r[std+'SourceYear']=q.data.source_year;
        if(q.data.standard_age_days)r[std+'StandardAge']=q.data.standard_age_days;
        r[std+'ExactAge']=q.data.is_exact_age!==false;
      }catch(_){/* read-only enrichment failure: keep canonical value */}
    }
  }
  return out;
}
function paint(c,ev,d){
  if(!c)return;
  if(!ev){releaseCard(c);return}
  c.classList.remove('good','warn','bad','ref-good','ref-watch','ref-bad','ref-neutral');
  const cls=ev.trend.key.includes('improvement')?'ref-good':ev.trend.key.includes('worsening')?'ref-bad':'ref-neutral';
  c.classList.add('bpi3-reference-card',cls);releaseCard(c);
  const value=c.querySelector('.bpi3-card-value'),sub=c.querySelector('.bpi3-card-sub');
  if(value)value.textContent=`${ev.trend.arrow} ${ev.trend.label}`;
  const slopeText=ev.actualSlope?.available?`${fmt(ev.actualSlope.slope,d.slope)} ${d.unit}`:'برای شیب حداقل ۳ نقطه لازم است';
  const lines=[
    `${sourceLabel(ev.currentRow,d.referenceKey)}${ev.source?.available&&ev.source.type!=='missing'&&ev.source.type!=='numeric'&&ev.source.name?'':' '}`,
    `شیب واقعی: ${slopeText}`,
    `فاصله فعلی از مرجع: ${signed(ev.currentGap,1)}٪`,
    `فاصله هفته قبل: ${signed(ev.previousGap,1)}٪`,
    `تغییر فاصله: ${signed(ev.gapChange,1)} واحد درصد`,
    `تغییر ${d.label} واقعی: ${signed(ev.actualChange,1)}٪`,
    `تغییر مرجع: ${signed(ev.referenceChange,1)}٪`,
    `وضعیت: ${ev.position.label}`,
    `تفسیر: ${ev.outlook}`
  ];
  if(sub)sub.innerHTML=lines.map(x=>`<span>${x}</span>`).join('<br>');
}
function paintCv(c,rows,Interpreter){
  if(!c)return;
  const a=(rows||[]).filter(r=>n(r.cv)!==null&&n(r.age)!==null).sort((x,y)=>n(x.age)-n(y.age));
  if(a.length<2){releaseCard(c);return}
  const hasRef=n(a[a.length-1].standardCv)!==null;
  if(hasRef){
    const ev=Interpreter.build('cv',a,{actualKey:'cv',referenceKey:'standardCv',direction:'lower',label:'CV',unit:'/ روز'});
    if(ev?.available){
      ev.currentRow=ev.points[ev.points.length-1].row;
      paint(c,ev,{label:'CV',referenceKey:'standardCv',slope:4,unit:'/ روز'});
      return;
    }
  }
  const cur=a[a.length-1],prev=a[a.length-2],ch=n(cur.cv)!==null&&n(prev.cv)!==null?(cur.cv-prev.cv)/Math.abs(prev.cv)*100:null;
  c.classList.remove('good','warn','bad','ref-good','ref-watch','ref-bad','ref-neutral');c.classList.add('bpi3-reference-card',ch!==null&&ch<0?'ref-good':ch!==null&&ch>0?'ref-watch':'ref-neutral');releaseCard(c);
  const v=c.querySelector('.bpi3-card-value'),sub=c.querySelector('.bpi3-card-sub');
  if(v)v.textContent=ch===null?'→ پراکندگی نامشخص':ch>0?'↗ پراکندگی بیشتر':'↘ پراکندگی کمتر';
  if(sub)sub.innerHTML=[
    '<span>مرجع معتبر CV برای این ثبت در دسترس نیست؛ این بخش فقط توصیفی است.</span>',
    `<span>تغییر CV واقعی نسبت به هفته قبل: ${signed(ch,1)}٪</span>`
  ].join('<br>');
}
let running=false,lastKey='';
async function render(){
  const panel=document.querySelector('#broiler-performance-intelligence-v3-shell [data-bpi3-panel="intelligence"]');
  if(!panel||panel.querySelector('.bpi3-loading'))return;
  const router=global.AdineReportRouter,Interpreter=global.AdineBroilerReferenceInterpreterV1;
  if(!router||!Interpreter)return;
  const id=router.currentFlockId();if(!id||running)return;
  pendingCards();running=true;
  try{
    const[flock,raw]=await Promise.all([router.getFlock(id),router.getWeeklyRecords(id)]);
    const model=router.buildModel(flock,raw),rows=await resolveRows(model?.rows||[],flock,id);
    const key=JSON.stringify(rows.map(r=>[r.age,r.weight,r.cumulativeFcr,r.cv,r.standardWeight,r.standardCumulativeFcr,r.standardCv,r.standardWeightSource,r.standardCumulativeFcrSource,r.standardCvSource]));
    if(key===lastKey){['روند وزن','روند FCR','روند CV'].forEach(x=>releaseCard(card(x)));return}
    lastKey=key;
    const w=Interpreter.build('weight',rows,{actualKey:'weight',referenceKey:'standardWeight',direction:'higher',label:'وزن',unit:'g/day'});
    const f=Interpreter.build('fcr',rows,{actualKey:'cumulativeFcr',referenceKey:'standardCumulativeFcr',direction:'lower',label:'FCR تجمعی',unit:'واحد FCR/day'});
    if(w?.available)w.currentRow=w.points[w.points.length-1].row;
    if(f?.available)f.currentRow=f.points[f.points.length-1].row;
    paint(card('روند وزن'),w,{label:'وزن',referenceKey:'standardWeight',slope:1,unit:'g/day'});
    paint(card('روند FCR'),f,{label:'FCR تجمعی',referenceKey:'standardCumulativeFcr',slope:4,unit:'واحد FCR/day'});
    paintCv(card('روند CV'),rows,Interpreter);
  }catch(e){console.warn('[Adine PI reference interpreter]',e);['روند وزن','روند FCR','روند CV'].forEach(x=>releaseCard(card(x)))}finally{running=false}
}
function start(){injectStyle();let tries=0;const timer=setInterval(()=>{render();if(++tries>=120)clearInterval(timer)},250);let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render()})}).observe(document.body,{subtree:true,childList:true,characterData:true});render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})(typeof window!=='undefined'?window:globalThis);
