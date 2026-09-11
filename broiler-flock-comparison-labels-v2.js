/* ADINE — direct comparison header company-name sanitizer
   Presentation-only. Does not touch calculations, data, Supabase or report structure.
*/
"use strict";
(function(){
  const companies=/\b(?:Aviagen(?:\s+Group)?|Cobb[-\s]+Vantress|Cobb[-\s]+Broilers|Hubbard|Sasso|Lohmann|Hendrix(?:\s+Genetics)?|H&N|Novogen|Hy[-\s]?Line|ISA(?:\s+Brown)?|Dekalb|Bovans|Hisex|Shaver|Ross[-\s]+Breeders|Ross[-\s]+Poultry)\b/gi;
  function clean(text){
    let s=String(text||'').replace(companies,'').replace(/\s*[-—|:]\s*/g,' — ').replace(/(?:\s*—\s*){2,}/g,' — ').replace(/^\s*—\s*|\s*—\s*$/g,'').replace(/\s+/g,' ').trim();
    return s;
  }
  function apply(){
    const root=document.getElementById('root'); if(!root)return;
    root.querySelectorAll('.fc-table thead th.aligned,.fc-table thead th.adine-inline-flock-label,.fc-side-table .fc-flock-head').forEach(th=>{
      if(th.children.length===1 && th.firstElementChild.classList.contains('fc-flock-index')){
        const el=th.firstElementChild, cleaned=clean(el.textContent);
        if(cleaned && el.textContent!==cleaned)el.textContent=cleaned;
      }
    });
    root.querySelectorAll('.fc-table thead th').forEach(th=>{
      if(th.querySelector('.adine-inline-flock-text'))return;
      const t=clean(th.textContent);
      if(t && !/^هفته$/.test(t))th.textContent=t;
    });
  }
  function init(){const root=document.getElementById('root');if(!root)return;new MutationObserver(()=>requestAnimationFrame(apply)).observe(root,{subtree:true,childList:true});apply();setTimeout(apply,250);setTimeout(apply,750);setTimeout(apply,1500);setTimeout(apply,2500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
