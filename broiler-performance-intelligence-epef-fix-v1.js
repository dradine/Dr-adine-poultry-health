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
    const liv=n(ctx?.livability ?? last?.raw?.livability ?? last?.livability);
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
  if(!install()){
    let tries=0;
    const timer=setInterval(function(){
      if(install()||++tries>=100) clearInterval(timer);
    },50);
  }
})(typeof window!=='undefined'?window:globalThis);
