/* ADINE BROILER PERFORMANCE INTELLIGENCE — EPEF COMPATIBILITY ONLY
 * Read-only compatibility layer. EPEF calculation/rating only.
 * Reference-relative trend presentation is handled by the dedicated reference-gap layer.
 *
 * IMPORTANT: this layer must not observe its own DOM mutations indefinitely.
 * Once the EPEF card is rated, the observer disconnects immediately to avoid
 * a mutation -> rating -> mutation feedback loop.
 */
(function(global){
'use strict';
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
function epef(last,ctx){const w=n(last?.weight),liv=n(ctx?.livability??ctx?.liv??last?.raw?.livability??last?.livability),age=n(last?.age??last?.raw?.age_days),fcr=n(last?.cumulativeFcr??last?.raw?.cumulative_fcr);if([w,liv,age,fcr].some(v=>v===null)||w<=0||liv<0||liv>100||age<=0||fcr<=0)return null;return{available:true,value:Number(((w/1000*liv*100)/(age*fcr)).toFixed(1)),formula:'(Livability % × live weight kg × 100) / (age days × cumulative FCR)',provenance:'calculated'}}
function install(){const A=global.AdineBroilerPerformanceIntelligenceV3;if(!A||A.__epefCompatInstalled||typeof A.build!=='function')return false;const original=A.build;A.build=function(ctx){const out=original.apply(this,arguments);const ep=epef(out?.latest,ctx);if(ep)out.epef=ep;return out};A.__epefCompatInstalled=true;return true}
const LEVELS=[{min:505,label:'ممتاز',cls:'epef-excellent',ref:505},{min:470,label:'بسیار خوب',cls:'epef-very-good',ref:470},{min:440,label:'خوب',cls:'good',ref:440},{min:400,label:'قابل قبول',cls:'warn',ref:400},{min:350,label:'نیازمند بهبود',cls:'epef-needs-improvement',ref:350},{min:-Infinity,label:'نامطلوب',cls:'epef-poor',ref:350}];
const fmt=(v,d=1)=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
const signed=(v,d=1)=>{const x=n(v);return x===null?'—':(x>0?'+':'')+fmt(x,d)};
function epefRating(){const card=[...document.querySelectorAll('.bpi3-card')].find(c=>c.querySelector('.bpi3-card-label')?.textContent.trim()==='EPEF');if(!card)return false;const text=card.querySelector('.bpi3-card-value')?.textContent||'',s=text.replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace('٫','.').replace(/[٬,]/g,'').replace(/[^0-9.\-]/g,''),v=n(s);if(v===null)return false;const lv=LEVELS.find(x=>v>=x.min)||LEVELS.at(-1);card.classList.remove('good','warn','epef-excellent','epef-very-good','epef-needs-improvement','epef-poor');card.classList.add(lv.cls);const sub=card.querySelector('.bpi3-card-sub');if(sub)sub.innerHTML=`<span>شاخص بهره‌وری تولید</span><b>${lv.label} · ${signed(v-lv.ref,1)} امتیاز نسبت به مرجع سطحی</b><span>مرجع سطح عملکردی، نه استاندارد رسمی جهانی</span>`;return true}
function start(){
  if(epefRating())return;
  const root=document.getElementById('root')||document.body;
  if(typeof MutationObserver==='undefined'){
    let i=0;const timer=setInterval(()=>{if(epefRating()||++i>=120)clearInterval(timer)},250);
    return;
  }
  const mo=new MutationObserver(()=>{if(epefRating())mo.disconnect()});
  mo.observe(root,{subtree:true,childList:true});
  setTimeout(()=>mo.disconnect(),30000);
}
if(!install()){let i=0;const t=setInterval(()=>{if(install()||++i>=100)clearInterval(t)},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})(typeof window!=='undefined'?window:globalThis);
