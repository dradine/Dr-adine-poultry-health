/* ADINE REPORTS — STRAIN-AWARE STANDARD LABELS V3
   UI-only layer. Uses the exact selected strain registry and the report engine's
   weekly-FCR derivation. Does not alter canonical weekly records.
*/
"use strict";
(function(){
  const $=s=>document.querySelector(s);
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  const fa1=v=>n(v)===null?'—':n(v).toLocaleString('fa-IR',{minimumFractionDigits:1,maximumFractionDigits:1});
  const fa3=v=>n(v)===null?'—':n(v).toLocaleString('fa-IR',{minimumFractionDigits:3,maximumFractionDigits:3});
  const pct=v=>n(v)===null?'—':n(v).toLocaleString('fa-IR',{minimumFractionDigits:0,maximumFractionDigits:0})+'٪';
  function identity(){const xs=[...document.querySelectorAll('#identity .identity-item strong')].map(x=>x.textContent.trim());return{genetics:xs[2]||'',strain:xs[3]||''}}
  function age(){const m=document.querySelector('#root h2')?.textContent.match(/سن\s*([0-9۰-۹٬,٫]+)/);if(!m)return null;return n(m[1].replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))}
  function setRef(card,text){let r=card.querySelector('.metric-ref');if(!r){r=document.createElement('div');r.className='metric-ref';card.appendChild(r)}if(r.textContent!==text)r.textContent=text}
  function official(strain,a){const s=window.BROILER_OFFICIAL_STANDARDS_V1?.strains?.[strain];if(!s||a===null)return null;const i=(s.records||[]).findIndex(x=>Number(x[0])===a);if(i<0)return null;const x=s.records[i],prev=i>0?s.records[i-1]:null;const weekly=(x[1]!=null&&x[2]!=null&&(!prev||prev[1]==null||prev[2]==null))?x[2]:(x[1]!=null&&x[2]!=null&&prev&&prev[1]!=null&&prev[2]!=null&&x[1]>prev[1]?(x[2]*x[1]-prev[2]*prev[1])/(x[1]-prev[1]):null);return{weight:x[1],cumFcr:x[2],weeklyFcr:weekly,gain:prev&&prev[1]!=null&&x[1]!=null?x[1]-prev[1]:null}}
  function refresh(){
    const root=$('#root');if(!root)return;
    const id=identity(),a=age(),s=official(id.strain,a);if(!s)return;
    root.querySelectorAll('.metric').forEach(card=>{
      const label=card.querySelector('.metric-label')?.textContent.trim();if(!label)return;
      if(label==='میانگین وزن')setRef(card,`استاندارد رسمی: ${fa1(s.weight)} گرم`);
      else if(label==='افزایش وزن هفتگی')setRef(card,`هدف مدیریتی: ${fa1(s.gain)} گرم — بر پایه استاندارد رسمی`);
      else if(label==='FCR هفتگی')setRef(card,`استاندارد رسمی هفتگی: ${fa3(s.weeklyFcr)} — هدف مدیریتی: ${fa3(s.weeklyFcr)}`);
      else if(label==='FCR تجمعی')setRef(card,`استاندارد رسمی تجمعی: ${fa3(s.cumFcr)}`);
      else if(label==='CV')setRef(card,'هدف مدیریتی: ≤ '+pct(10)+' — کمتر بهتر است');
      else if(label==='یکنواختی ±10')setRef(card,'هدف مدیریتی: ≥ '+pct(80)+' — بیشتر بهتر است');
      else if(label==='یکنواختی ±15')setRef(card,'هدف مدیریتی: ≥ '+pct(90)+' — بیشتر بهتر است');
    });
  }
  function boot(){refresh();const root=$('#root');if(root)new MutationObserver(()=>refresh()).observe(root,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));else setTimeout(boot,0);
})();
