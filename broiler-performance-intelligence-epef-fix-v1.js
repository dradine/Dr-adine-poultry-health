/* ADINE BROILER PERFORMANCE INTELLIGENCE — EPEF FIX V1
 * Surgical compatibility layer. Does not alter canonical weekly calculations,
 * FCR engines, official/management standards, reports or stored data.
 * Ensures the V3 intelligence layer can recover EPEF inputs from the canonical
 * latest row when the adapter context does not expose livability/FCR directly.
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
    // The V3 adapter currently exposes the derived livability as `liv`.
    // Prefer an explicit livability value, then the adapter's derived value,
    // then the canonical latest-row value. No new estimate is introduced here.
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

  /* Strict, user-facing EPEF interpretation.
   * These are performance-reference bands, not official universal EPEF standards.
   * The 400/440/470/505 thresholds are intentionally conservative so a flock
   * is not labeled "good" too easily. 400 is a recognized Aviagen club-level
   * reference in some programs; 505 is a current elite Ross Club threshold in UK.
   * They are not claimed as Iran-specific or strain-specific official cutoffs.
   */
  const LEVELS=[
    {min:505,key:'excellent',label:'ممتاز',cls:'epef-excellent',ref:505},
    {min:470,key:'very-good',label:'بسیار خوب',cls:'epef-very-good',ref:470},
    {min:440,key:'good',label:'خوب',cls:'good',ref:440},
    {min:400,key:'acceptable',label:'قابل قبول',cls:'warn',ref:400},
    {min:350,key:'needs-improvement',label:'نیازمند بهبود',cls:'epef-needs-improvement',ref:350},
    {min:-Infinity,key:'poor',label:'نامطلوب',cls:'epef-poor',ref:350}
  ];
  function level(value){
    const x=n(value);
    if(x===null) return null;
    return LEVELS.find(z=>x>=z.min)||LEVELS[LEVELS.length-1];
  }
  function parseDisplayedNumber(text){
    if(!text) return null;
    const s=String(text)
      .replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٬,]/g,'')
      .replace('٫','.');
    return n(s.replace(/[^0-9.\-]/g,''));
  }
  function ensureStyle(){
    if(document.getElementById('adine-epef-rating-style')) return;
    const style=document.createElement('style');
    style.id='adine-epef-rating-style';
    style.textContent=`
      .bpi3-card.epef-excellent,.bpi3-card.epef-very-good,.bpi3-card.good{border-color:rgba(22,163,74,.45)!important;background:linear-gradient(180deg,rgba(240,253,244,.98),rgba(255,255,255,.98))!important}
      .bpi3-card.epef-excellent .bpi3-card-value,.bpi3-card.epef-very-good .bpi3-card-value,.bpi3-card.good .bpi3-card-value{color:#15803d!important}
      .bpi3-card.warn{border-color:rgba(202,138,4,.45)!important;background:linear-gradient(180deg,rgba(254,252,232,.98),rgba(255,255,255,.98))!important}
      .bpi3-card.epef-needs-improvement{border-color:rgba(234,88,12,.45)!important;background:linear-gradient(180deg,rgba(255,247,237,.98),rgba(255,255,255,.98))!important}
      .bpi3-card.epef-poor{border-color:rgba(220,38,38,.48)!important;background:linear-gradient(180deg,rgba(254,242,242,.98),rgba(255,255,255,.98))!important}
      .bpi3-epef-rating{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:5px;font-size:.78rem;font-weight:700}
      .bpi3-epef-rating .label{white-space:nowrap}
      .bpi3-epef-rating .delta{font-weight:600;opacity:.82;direction:rtl}
      .bpi3-epef-reference{display:block;margin-top:3px;font-size:.7rem;opacity:.72}
    `;
    document.head.appendChild(style);
  }
  function paintRating(){
    const cards=[...document.querySelectorAll('.bpi3-card')];
    const card=cards.find(c=>c.querySelector('.bpi3-card-label')?.textContent.trim()==='EPEF');
    if(!card) return;
    const valueEl=card.querySelector('.bpi3-card-value');
    const subEl=card.querySelector('.bpi3-card-sub');
    const value=parseDisplayedNumber(valueEl?.textContent);
    const lv=level(value);
    if(!lv) return;
    ensureStyle();
    card.classList.remove('good','warn','epef-excellent','epef-very-good','epef-needs-improvement','epef-poor');
    card.classList.add(lv.cls);
    const ref=lv.ref;
    const delta=value-ref;
    const sign=delta>0?'+':'';
    if(subEl){
      subEl.innerHTML=`<span>شاخص بهره‌وری تولید</span><div class="bpi3-epef-rating"><span class="label">${lv.label}</span><span class="delta">${sign}${delta.toFixed(1)}</span></div><span class="bpi3-epef-reference">مرجع سطح: ${ref.toLocaleString('fa-IR')} · مرجع عملکردی، نه استاندارد رسمی جهانی</span>`;
    }
  }
  function hookRating(){
    let tries=0;
    const run=()=>{paintRating();if(++tries>=120)clearInterval(timer)};
    const timer=setInterval(run,100);
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',paintRating);
    const observer=new MutationObserver(()=>paintRating());
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    setTimeout(()=>observer.disconnect(),15000);
  }

  if(!install()){
    let tries=0;
    const timer=setInterval(function(){
      if(install()||++tries>=100) clearInterval(timer);
    },50);
  }
  hookRating();
})(typeof window!=='undefined'?window:globalThis);
