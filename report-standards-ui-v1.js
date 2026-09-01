/* ADINE REPORTS — STRAIN-AWARE STANDARD LABELS V2
   UI-only layer. Does not alter calculations or canonical weekly records.
*/
"use strict";
(function(){
  const $=s=>document.querySelector(s);
  const fa1=v=>Number(v).toLocaleString('fa-IR',{minimumFractionDigits:1,maximumFractionDigits:1});
  const fa3=v=>Number(v).toLocaleString('fa-IR',{minimumFractionDigits:3,maximumFractionDigits:3});
  const pct=v=>Number(v).toLocaleString('fa-IR',{minimumFractionDigits:0,maximumFractionDigits:0})+'٪';
  function identity(){const xs=[...document.querySelectorAll('#identity .identity-item strong')].map(x=>x.textContent.trim());return{genetics:xs[2]||'',strain:xs[3]||''}}
  function age(){const m=document.querySelector('#root h2')?.textContent.match(/سن\s*([0-9۰-۹٬,٫]+)/);if(!m)return null;return Number(m[1].replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٬,]/g,'').replace('٫','.'))||null}
  function setRef(card,text){let r=card.querySelector('.metric-ref');if(!r){r=document.createElement('div');r.className='metric-ref';card.appendChild(r)}if(r.textContent!==text)r.textContent=text}
  function refresh(){
    const root=$('#root');if(!root)return;
    const id=identity(),a=age();
    let s=null;try{s=window.resolvePoultryStandard?.({productionType:'broiler',genetics:id.genetics,strain:id.strain,ageDays:a})||null}catch(_){}
    root.querySelectorAll('.metric').forEach(card=>{
      const label=card.querySelector('.metric-label')?.textContent.trim();if(!label)return;
      if(label==='میانگین وزن'&&s?.weight!=null)setRef(card,`استاندارد رسمی: ${fa1(s.weight)} گرم`);
      else if(label==='FCR تجمعی'&&s?.fcr!=null)setRef(card,`استاندارد رسمی تجمعی: ${fa3(s.fcr)}`);
      else if(label==='FCR هفتگی'&&s?.fcr!=null){const old=card.querySelector('.metric-ref')?.textContent||'';const mg=old.match(/هدف مدیریتی:\s*([^ ]+)/)?.[1];setRef(card,`استاندارد رسمی: ${fa3(s.fcr)} — هدف مدیریتی: ${mg||fa3(s.fcr)}`)}
      else if(label==='CV')setRef(card,'هدف مدیریتی: ≤ '+pct(10)+' — کمتر بهتر است');
      else if(label==='یکنواختی ±10')setRef(card,'هدف مدیریتی: ≥ '+pct(80)+' — بیشتر بهتر است');
      else if(label==='یکنواختی ±15')setRef(card,'هدف مدیریتی: ≥ '+pct(90)+' — بیشتر بهتر است');
    });
  }
  function boot(){refresh();const root=$('#root');if(root)new MutationObserver(()=>refresh()).observe(root,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));else setTimeout(boot,0);
})();
