/* ADINE BROILER PERFORMANCE INTELLIGENCE — REFERENCE GAP V1
 * Post-render, read-only presentation layer.
 * Uses actual-vs-reference normalized gaps for trend interpretation.
 * Does not modify weekly records, report engines, standards tables or stored data.
 */
(function(global){
'use strict';
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
const fmt=(v,d=1)=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
const pct=(v,d=1)=>n(v)===null?'—':fmt(v,d)+'٪';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const METRICS={
 weight:{key:'weight',standard:'standardWeight',metric:'body_weight',direction:'higher',card:'روند وزن',label:'وزن',unit:'g/day',decimals:1},
 fcr:{key:'cumulativeFcr',standard:'standardCumulativeFcr',metric:'fcr_cumulative',direction:'lower',card:'روند FCR',label:'FCR تجمعی',unit:'واحد FCR/day',decimals:4},
 cv:{key:'cv',standard:'standardCv',metric:'cv',direction:'lower',card:'روند CV',label:'CV',unit:'واحد درصد/day',decimals:4},
 mortality:{key:'mortalityPercent',standard:'standardMortality',metric:'mortality',direction:'lower',card:'روند تلفات',label:'تلفات',unit:'واحد درصد/day',decimals:4},
 uniformity:{key:'uniformity10',standard:'standardUniformity10',metric:'uniformity10',direction:'higher',card:'روند یکنواختی',label:'یکنواختی ±۱۰٪',unit:'واحد درصد/day',decimals:4}
};
function sourceLabel(row,key){const s=row?.[key+'Source'];return s==='official'?'مرجع رسمی':s==='management'?'مرجع مدیریتی':s?String(s):'مرجع موجود نیست'}
function gap(actual,reference){const a=n(actual),r=n(reference);if(a===null||r===null||r===0)return null;return{absolute:a-r,percent:(a-r)/Math.abs(r)*100}}
function changePct(current,previous){const c=n(current),p=n(previous);return c!==null&&p!==null&&p!==0?(c-p)/Math.abs(p)*100:null}
function slope(rows,key){const pts=(rows||[]).map(r=>({x:n(r.age),y:n(r[key])})).filter(p=>p.x!==null&&p.y!==null);if(pts.length<2)return null;const mx=pts.reduce((s,p)=>s+p.x,0)/pts.length,my=pts.reduce((s,p)=>s+p.y,0)/pts.length;const den=pts.reduce((s,p)=>s+(p.x-mx)*(p.x-mx),0);return den?pts.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0)/den:null}
function signed(v,d=1){const x=n(v);if(x===null)return'—';return(x>0?'+':'')+fmt(x,d)}
function evaluate(rows,def){
 const valid=(rows||[]).filter(r=>n(r.age)!==null&&n(r[def.key])!==null&&n(r[def.standard])!==null).sort((a,b)=>n(a.age)-n(b.age));
 if(!valid.length)return null;
 const cur=valid[valid.length-1],prev=valid[valid.length-2]||null,cg=gap(cur[def.key],cur[def.standard]),pg=prev?gap(prev[def.key],prev[def.standard]):null;if(!cg)return null;
 const gapDeltaPP=pg?cg.percent-pg.percent:null;
 const performanceDelta=gapDeltaPP===null?null:(def.direction==='higher'?gapDeltaPP:-gapDeltaPP);
 const actualChangePct=prev?changePct(cur[def.key],prev[def.key]):null;
 const referenceChangePct=prev?changePct(cur[def.standard],prev[def.standard]):null;
 const meaningful=performanceDelta!==null&&Math.abs(performanceDelta)>=0.25;
 const improving=meaningful&&performanceDelta>0,worsening=meaningful&&performanceDelta<0;
 let trend=improving?'بهبود نسبت به مرجع':worsening?'بدتر شدن نسبت به مرجع':'پایدار/تغییر ناچیز';
 let arrow=improving?'↗':worsening?'↘':'→';
 let position='نزدیک به مرجع';
 if(def.direction==='higher'){if(cg.percent>=2)position='بالاتر از مرجع';else if(cg.percent<=-5)position='پایین‌تر از مرجع'}
 else {if(cg.percent<=-2)position='بهتر از مرجع';else if(cg.percent>=5)position='بدتر از مرجع'}
 return{cur,prev,cg,pg,gapDeltaPP,performanceDelta,actualChangePct,referenceChangePct,improving,worsening,trend,arrow,position,source:sourceLabel(cur,def.standard),slope:slope(valid,def.key)}
}
async function resolve(rows,flock,flockId){
 const out=(rows||[]).map(r=>({...r}));if(!global.supabaseClient||!flockId)return out;
 const genetics=flock?.genetics??flock?.genetic_line??null,strain=flock?.strain??null;
 for(const r of out){
  const date=r.raw?.evaluation_date||r.raw?.record_date||new Date().toISOString().slice(0,10);
  for(const name of Object.keys(METRICS)){
   const d=METRICS[name];if(n(r[d.standard])!==null)continue;const current=n(r[d.key]);if(current===null||n(r.age)===null)continue;
   try{const {data,error}=await global.supabaseClient.rpc('calculate_performance_intelligence',{p_flock_id:flockId,p_evaluation_date:date,p_age_days:Number(r.age),p_metric:d.metric,p_current_value:current,p_production_type:'broiler',p_genetics:genetics,p_strain:strain});if(error||!data?.ok||n(data.target)===null)continue;r[d.standard]=n(data.target);r[d.standard+'Source']=data.source_type||null;r[d.standard+'SourceLabel']=data.source_name||null;r[d.standard+'SourceYear']=data.source_year||null;r[d.standard+'StandardAge']=data.standard_age_days||null;r[d.standard+'ExactAge']=data.is_exact_age!==false}catch(_){}
  }
 }
 return out;
}
function ensureStyle(){if(document.getElementById('adine-reference-gap-style'))return;const s=document.createElement('style');s.id='adine-reference-gap-style';s.textContent=`
.bpi3-reference-card.ref-good{border-color:rgba(22,163,74,.45)!important}.bpi3-reference-card.ref-watch{border-color:rgba(202,138,4,.48)!important}.bpi3-reference-card.ref-bad{border-color:rgba(220,38,38,.45)!important}.bpi3-reference-card.ref-neutral{border-color:rgba(100,116,139,.35)!important}
.bpi3-reference-card .bpi3-card-sub{line-height:1.75}
`;document.head.appendChild(s)}
function findCard(label){return[...document.querySelectorAll('.bpi3-card')].find(c=>String(c.querySelector('.bpi3-card-label')?.textContent||'').trim()===label)||null}
function render(card,ev,def){if(!card||!ev)return;ensureStyle();card.classList.add('bpi3-reference-card');card.classList.remove('ref-good','ref-watch','ref-bad','ref-neutral');card.classList.add(ev.improving?'ref-good':ev.worsening?'ref-bad':'ref-neutral');const value=card.querySelector('.bpi3-card-value'),sub=card.querySelector('.bpi3-card-sub');if(value)value.textContent=`${ev.arrow} ${ev.trend}`;const lines=[];lines.push(`${ev.position} · ${ev.source}`);lines.push(`شیب واقعی ${fmt(ev.slope,def.decimals)} ${def.unit}`);lines.push(`فاصله فعلی از مرجع: ${signed(ev.cg.percent,1)}٪`);if(ev.pg)lines.push(`فاصله هفته قبل: ${signed(ev.pg.percent,1)}٪`);if(ev.gapDeltaPP!==null)lines.push(`تغییر فاصله: ${signed(ev.gapDeltaPP,1)} واحد درصد`);if(ev.actualChangePct!==null)lines.push(`تغییر ${def.label} واقعی: ${signed(ev.actualChangePct,1)}٪`);if(ev.referenceChangePct!==null)lines.push(`تغییر مرجع: ${signed(ev.referenceChangePct,1)}٪`);if(sub)sub.innerHTML=lines.map(x=>`<span>${x}</span>`).join('<br>');card.dataset.referenceGapModel='v1'}
async function run(){const panel=document.querySelector('#broiler-performance-intelligence-v3-shell [data-bpi3-panel="intelligence"]');if(!panel||panel.querySelector('.bpi3-loading'))return;if(panel.dataset.referenceGapRunning==='1')return;panel.dataset.referenceGapRunning='1';try{const r=global.AdineReportRouter;if(!r)return;const flockId=r.currentFlockId();if(!flockId)return;const[flock,raw]=await Promise.all([r.getFlock(flockId),r.getWeeklyRecords(flockId)]);const model=r.buildModel(flock,raw);const rows=await resolve(model?.rows||[],flock,flockId);for(const def of Object.values(METRICS)){const ev=evaluate(rows,def);if(ev)render(findCard(def.card),ev,def)}}catch(_){}finally{panel.dataset.referenceGapRunning='0'}}
function hook(){let tries=0;const timer=setInterval(()=>{run();if(++tries>=200)clearInterval(timer)},100);const observer=new MutationObserver(()=>{const p=document.querySelector('#broiler-performance-intelligence-v3-shell [data-bpi3-panel="intelligence"]');if(p&&!p.querySelector('.bpi3-loading'))run()});observer.observe(document.body,{subtree:true,childList:true,characterData:true});setTimeout(()=>observer.disconnect(),25000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
})(typeof window!=='undefined'?window:globalThis);
