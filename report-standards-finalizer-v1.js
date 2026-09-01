/* ADINE REPORTS — FINAL STANDARD PRESENTATION GUARD
   Runs after every report render/runtime. Presentation-only: never changes actual values.
   Exact selected strain -> exact age -> official registry.
*/
"use strict";
(function(){
  const root=()=>document.getElementById('root');
  const fa=(v,d)=>v==null?'—':Number(v).toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d});
  const num=v=>{if(v==null||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  const age=()=>{const m=root()?.querySelector('h2')?.textContent.match(/سن\s*([0-9۰-۹٬,٫]+)/);if(!m)return null;return num(m[1].replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))};
  const strain=()=>{const x=[...document.querySelectorAll('#identity .identity-item strong')];return x[3]?.textContent.trim()||''};
  function ref(r,text){let x=r.querySelector('.metric-ref');if(!x){x=document.createElement('div');x.className='metric-ref';r.appendChild(x)}x.textContent=text}
  function get(){const s=window.BROILER_OFFICIAL_STANDARDS_V1?.strains?.[strain()];const a=age();if(!s||a==null)return null;const i=(s.records||[]).findIndex(x=>Number(x[0])===a);if(i<0)return null;const x=s.records[i],p=i?s.records[i-1]:null;let wf=null;if(x[1]!=null&&x[2]!=null){if(!p||p[1]==null||p[2]==null)wf=x[2];else if(Number(x[1])>Number(p[1]))wf=(Number(x[2])*Number(x[1])-Number(p[2])*Number(p[1]))/(Number(x[1])-Number(p[1]));}return{w:x[1],gain:p&&p[1]!=null&&x[1]!=null?Number(x[1])-Number(p[1]):null,wf,cum:x[2]}}
  function apply(){const s=get(),r=root();if(!s||!r)return;r.querySelectorAll('.metric').forEach(c=>{const l=c.querySelector('.metric-label')?.textContent.trim();if(l==='میانگین وزن')ref(c,`استاندارد رسمی: ${fa(s.w,1)} گرم`);else if(l==='افزایش وزن هفتگی')ref(c,`هدف مدیریتی: ${fa(s.gain,1)} گرم — بر پایه استاندارد رسمی`);else if(l==='CV')ref(c,'هدف مدیریتی: ≤ ۱۰٪ — کمتر بهتر است');else if(l==='یکنواختی ±10')ref(c,'هدف مدیریتی: ≥ ۸۰٪ — بیشتر بهتر است');else if(l==='یکنواختی ±15')ref(c,'هدف مدیریتی: ≥ ۹۰٪ — بیشتر بهتر است');else if(l==='FCR هفتگی')ref(c,`استاندارد رسمی هفتگی: ${fa(s.wf,3)}`);else if(l==='FCR تجمعی')ref(c,`استاندارد رسمی تجمعی: ${fa(s.cum,3)}`);});}
  function boot(){let last='';const tick=()=>{const r=root();const sig=(r?.innerText||'').slice(0,400);if(sig!==last){last=sig;apply()}};tick();new MutationObserver(tick).observe(document.body,{childList:true,subtree:true,characterData:true});setInterval(apply,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();