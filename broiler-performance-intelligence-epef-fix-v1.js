/* ADINE BROILER PERFORMANCE INTELLIGENCE — EPEF FIX V1 + REFERENCE-GAP PRESENTATION FIX
 * Surgical compatibility/presentation layer. Does not alter canonical weekly calculations,
 * FCR engines, official/management standards, reports or stored data.
 */
(function(global){
  'use strict';
  function n(v){
    if(v===null||v===undefined||v==='') return null;
    const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));
    return Number.isFinite(x)?x:null;
  }
  function calc(last, ctx){
    const weight=n(last?.weight);
    const bw=weight===null?null:weight/1000;
    const liv=n(ctx?.livability ?? ctx?.liv ?? last?.raw?.livability ?? last?.livability);
    const age=n(last?.age ?? last?.raw?.age_days ?? last?.raw?.ageDays);
    const fcr=n(last?.cumulativeFcr ?? last?.raw?.cumulative_fcr ?? last?.raw?.cumulativeFcr);
    if([bw,liv,age,fcr].some(v=>v===null)||bw<=0||liv<0||liv>100||age<=0||fcr<=0) return null;
    return {available:true,value:Number(((bw*liv*100)/(age*fcr)).toFixed(1)),formula:'(Livability % × live weight kg × 100) / (age days × cumulative FCR)',provenance:'calculated'};
  }
  function install(){
    const A=global.AdineBroilerPerformanceIntelligenceV3;
    if(!A||A.__epefFixV1Installed||typeof A.build!=='function') return false;
    const original=A.build;
    A.build=function(ctx){
      const out=original.apply(this,arguments);
      const ep=calc(out?.latest,ctx);
      if(ep) out.epef=ep;
      return out;
    };
    A.__epefFixV1Installed=true;
    return true;
  }
  const LEVELS=[
    {min:505,key:'excellent',label:'ممتاز',cls:'epef-excellent',ref:505},
    {min:470,key:'very-good',label:'بسیار خوب',cls:'epef-very-good',ref:470},
    {min:440,key:'good',label:'خوب',cls:'good',ref:440},
    {min:400,key:'acceptable',label:'قابل قبول',cls:'warn',ref:400},
    {min:350,key:'needs-improvement',label:'نیازمند بهبود',cls:'epef-needs-improvement',ref:350},
    {min:-Infinity,key:'poor',label:'نامطلوب',cls:'epef-poor',ref:350}
  ];
  function level(value){const x=n(value);if(x===null)return null;return LEVELS.find(z=>x>=z.min)||LEVELS[LEVELS.length-1]}
  function parseDisplayedNumber(text){if(!text)return null;const s=String(text).replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٬,]/g,'').replace('٫','.');return n(s.replace(/[^0-9.\-]/g,''))}
  function ensureStyle(){
    if(document.getElementById('adine-epef-rating-style'))return;
    const style=document.createElement('style');style.id='adine-epef-rating-style';style.textContent=`
      .bpi3-card.epef-excellent,.bpi3-card.epef-very-good,.bpi3-card.good{border-color:rgba(22,163,74,.45)!important;background:linear-gradient(180deg,rgba(240,253,244,.98),rgba(255,255,255,.98))!important}
      .bpi3-card.epef-excellent .bpi3-card-value,.bpi3-card.epef-very-good .bpi3-card-value,.bpi3-card.good .bpi3-card-value{color:#15803d!important}
      .bpi3-card.warn{border-color:rgba(202,138,4,.45)!important;background:linear-gradient(180deg,rgba(254,252,232,.98),rgba(255,255,255,.98))!important}
      .bpi3-card.epef-needs-improvement{border-color:rgba(234,88,12,.45)!important;background:linear-gradient(180deg,rgba(255,247,237,.98),rgba(255,255,255,.98))!important}
      .bpi3-card.epef-poor{border-color:rgba(220,38,38,.48)!important;background:linear-gradient(180deg,rgba(254,242,242,.98),rgba(255,255,255,.98))!important}
      .bpi3-epef-rating{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:5px;font-size:.78rem;font-weight:700}.bpi3-epef-rating .label{white-space:nowrap}.bpi3-epef-rating .delta{font-weight:600;opacity:.82;direction:rtl}.bpi3-epef-reference{display:block;margin-top:3px;font-size:.7rem;opacity:.72}
      .bpi3-reference-card .bpi3-card-sub{line-height:1.75}.bpi3-reference-card.ref-good{border-color:rgba(22,163,74,.42)!important}.bpi3-reference-card.ref-watch{border-color:rgba(202,138,4,.48)!important}.bpi3-reference-card.ref-bad{border-color:rgba(220,38,38,.45)!important}.bpi3-reference-card.ref-neutral{border-color:rgba(100,116,139,.35)!important}`;document.head.appendChild(style)
  }
  function paintRating(){
    const cards=[...document.querySelectorAll('.bpi3-card')],card=cards.find(c=>c.querySelector('.bpi3-card-label')?.textContent.trim()==='EPEF');if(!card)return;
    const valueEl=card.querySelector('.bpi3-card-value'),subEl=card.querySelector('.bpi3-card-sub'),value=parseDisplayedNumber(valueEl?.textContent),lv=level(value);if(!lv)return;
    const stamp=String(value);if(card.dataset.epefRating===stamp)return;ensureStyle();card.classList.remove('good','warn','epef-excellent','epef-very-good','epef-needs-improvement','epef-poor');card.classList.add(lv.cls);
    const delta=value-lv.ref,sign=delta>0?'+':'';if(subEl)subEl.innerHTML=`<span>شاخص بهره‌وری تولید</span><div class="bpi3-epef-rating"><span class="label">${lv.label}</span><span class="delta">${sign}${delta.toFixed(1)}</span></div><span class="bpi3-epef-reference">مرجع سطح: ${lv.ref.toLocaleString('fa-IR')} · مرجع عملکردی، نه استاندارد رسمی جهانی</span>`;card.dataset.epefRating=stamp
  }

  const REF_METRICS={
    weight:{metric:'body_weight',key:'weight',standard:'standardWeight',direction:'higher',label:'وزن'},
    fcr:{metric:'fcr_cumulative',key:'cumulativeFcr',standard:'standardCumulativeFcr',direction:'lower',label:'FCR تجمعی'},
    cv:{metric:'cv',key:'cv',standard:'standardCv',direction:'lower',label:'CV'},
    mortality:{metric:'mortality',key:'mortalityPercent',standard:'standardMortality',direction:'lower',label:'تلفات'},
    uniformity:{metric:'uniformity10',key:'uniformity10',standard:'standardUniformity10',direction:'higher',label:'یکنواختی ±۱۰٪'}
  };
  function sourceLabel(row,key){const s=row?.[key+'Source']||row?.standardSource||null;return s==='official'?'مرجع رسمی':s==='management'?'مرجع مدیریتی':s?String(s):'مرجع موجود نیست'}
  function signed(v,d=1){if(n(v)===null)return'—';const x=Number(v);return(x>0?'+':'')+x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})}
  function gap(actual,ref){const a=n(actual),r=n(ref);if(a===null||r===null||r===0)return null;return{absolute:a-r,pct:(a-r)/Math.abs(r)*100}}
  function changePct(current,previous){const c=n(current),p=n(previous);return c!==null&&p!==null&&p!==0?(c-p)/Math.abs(p)*100:null}
  function evaluate(rows,def){
    const valid=(rows||[]).filter(r=>n(r[def.key])!==null&&n(r[def.standard])!==null&&n(r.age)!==null).sort((a,b)=>n(a.age)-n(b.age));if(!valid.length)return null;
    const cur=valid[valid.length-1],prev=valid[valid.length-2]||null,cg=gap(cur[def.key],cur[def.standard]),pg=prev?gap(prev[def.key],prev[def.standard]):null;if(!cg)return null;
    const gapDeltaPP=cg.pct-(pg?.pct??cg.pct),scoreDelta=def.direction==='higher'?gapDeltaPP:-gapDeltaPP,actualChangePct=prev?changePct(cur[def.key],prev[def.key]):null,referenceChangePct=prev?changePct(cur[def.standard],prev[def.standard]):null;
    const improving=prev?scoreDelta>0.15:false,worsening=prev?scoreDelta<-0.15:false;
    let position='نزدیک به مرجع';if(def.direction==='higher'){if(cg.pct>=2)position='بالاتر از مرجع';else if(cg.pct<=-2)position='پایین‌تر از مرجع'}else{if(cg.pct<=-2)position='بهتر از مرجع';else if(cg.pct>=2)position='بدتر از مرجع'}
    let status='ref-neutral',title='پایدار نسبت به مرجع',arrow='→';if(improving){status='ref-good';title='بهبود نسبت به مرجع';arrow='↗'}else if(worsening){status='ref-bad';title='بدتر شدن نسبت به مرجع';arrow='↘'}
    return{cur,prev,cg,pg,gapDeltaPP,scoreDelta,actualChangePct,referenceChangePct,improving,worsening,status,title,arrow,position,source:sourceLabel(cur,def.standard)}
  }
  async function enrichReferences(rows,flock,flockId){
    const out=(rows||[]).map(r=>({...r}));if(!global.supabaseClient||!flockId)return out;const genetics=flock?.genetics??flock?.genetic_line??null,strain=flock?.strain??null;
    for(const r of out)for(const name of Object.keys(REF_METRICS)){const d=REF_METRICS[name],sk=d.standard;if(n(r[sk])!==null)continue;const current=n(r[d.key]);if(current===null||n(r.age)===null)continue;try{const date=r.raw?.evaluation_date||r.raw?.record_date||new Date().toISOString().slice(0,10);const {data,error}=await global.supabaseClient.rpc('calculate_performance_intelligence',{p_flock_id:flockId,p_evaluation_date:date,p_age_days:Number(r.age),p_metric:d.metric,p_current_value:current,p_production_type:'broiler',p_genetics:genetics,p_strain:strain});if(!error&&data?.ok&&n(data.target)!==null){r[sk]=n(data.target);r[sk+'Source']=data.source_type||null;r[sk+'SourceLabel']=data.source_name||null;r[sk+'SourceYear']=data.source_year||null;r[sk+'StandardAge']=data.standard_age_days||null}}catch(_){} }
    return out
  }
  function findCard(label){const target=String(label).trim();return[...document.querySelectorAll('.bpi3-card')].find(c=>String(c.querySelector('.bpi3-card-label')?.textContent||'').trim()===target)||null}
  function renderRefCard(card,ev,def){if(!card||!ev)return;ensureStyle();card.classList.add('bpi3-reference-card');card.classList.remove('ref-good','ref-watch','ref-bad','ref-neutral');card.classList.add(ev.status);const value=card.querySelector('.bpi3-card-value'),sub=card.querySelector('.bpi3-card-sub');if(value)value.textContent=ev.arrow+' '+ev.title;const lines=[`فاصله فعلی از ${ev.source}: ${signed(ev.cg.pct,1)}٪`];if(ev.pg)lines.push(`فاصله هفته قبل: ${signed(ev.pg.pct,1)}٪`);if(ev.pg)lines.push(`تغییر فاصله: ${signed(ev.gapDeltaPP,1)} واحد درصد`);if(ev.actualChangePct!==null)lines.push(`تغییر ${def.label} واقعی: ${signed(ev.actualChangePct,1)}٪`);if(ev.referenceChangePct!==null)lines.push(`تغییر مرجع: ${signed(ev.referenceChangePct,1)}٪`);lines.push(`وضعیت فعلی: ${ev.position}`);if(sub)sub.innerHTML=lines.map(x=>`<span>${x}</span>`).join('<br>');card.dataset.referenceGapModel='v2'}
  async function paintReferenceCards(){
    const panel=document.querySelector('#broiler-performance-intelligence-v3-shell [data-bpi3-panel="intelligence"]');if(!panel||panel.querySelector('.bpi3-loading'))return;if(panel.dataset.referenceGapBusy==='1')return;panel.dataset.referenceGapBusy='1';
    try{const r=global.AdineReportRouter;if(!r)return;const flockId=r.currentFlockId();if(!flockId)return;const[flock,raw]=await Promise.all([r.getFlock(flockId),r.getWeeklyRecords(flockId)]);const model=r.buildModel(flock,raw);const rows=await enrichReferences(model?.rows||[],flock,flockId);for(const name of Object.keys(REF_METRICS)){const d=REF_METRICS[name],label=name==='fcr'?'روند FCR':name==='cv'?'روند CV':name==='weight'?'روند وزن':name==='mortality'?'روند تلفات':'روند یکنواختی';const ev=evaluate(rows,d);if(ev)renderRefCard(findCard(label),ev,d)}}catch(_){}finally{panel.dataset.referenceGapBusy='0'}
  }
  function hookReferenceGap(){let tries=0;const run=()=>{paintReferenceCards();if(++tries>=180)clearInterval(timer)},timer=setInterval(run,100);const observer=new MutationObserver(()=>{const panel=document.querySelector('#broiler-performance-intelligence-v3-shell [data-bpi3-panel="intelligence"]');if(panel&&!panel.querySelector('.bpi3-loading'))paintReferenceCards()});observer.observe(document.body,{subtree:true,childList:true,characterData:true});setTimeout(()=>observer.disconnect(),20000)}
  if(!install()){let tries=0;const timer=setInterval(function(){if(install()||++tries>=100)clearInterval(timer)},50)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{paintRating();hookReferenceGap()});else{paintRating();hookReferenceGap()}
})(typeof window!=='undefined'?window:globalThis);
