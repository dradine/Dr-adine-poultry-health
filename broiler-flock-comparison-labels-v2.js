/* ADINE — direct comparison header company-name sanitizer v2
   Presentation-only. Directly sanitizes the actual comparison table headers.
   Does not touch calculations, data, Supabase or report structure.
*/
"use strict";
(function(){
  const companies=/\b(?:Aviagen(?:\s+Group)?|Cobb[-\s]+Vantress|Cobb[-\s]+Broilers|Hubbard|Sasso|Lohmann|Hendrix(?:\s+Genetics)?|H&N|Novogen|Hy[-\s]?Line|ISA(?:\s+Brown)?|Dekalb|Bovans|Hisex|Shaver|Ross[-\s]+Breeders|Ross[-\s]+Poultry)\b/gi;

  function clean(text){
    let s=String(text||'');
    s=s.replace(companies,'');
    s=s.replace(/\s*[-—|:]\s*/g,' — ');
    s=s.replace(/(?:\s*—\s*){2,}/g,' — ');
    s=s.replace(/^\s*—\s*|\s*—\s*$/g,'');
    return s.replace(/\s+/g,' ').trim();
  }

  function sanitizeDirectTable(){
    const root=document.getElementById('root');
    if(!root)return;

    // This is the exact table headed «مقایسه مستقیم عملکرد در سن مشترک».
    root.querySelectorAll('.fc-side-table thead tr').forEach(tr=>{
      Array.from(tr.children).slice(1).forEach(th=>{
        const textEl=th.querySelector('.adine-inline-flock-text,.fc-flock-index');
        const source=textEl ? textEl.textContent : th.textContent;
        const cleaned=clean(source);
        if(textEl){
          if(textEl.textContent!==cleaned)textEl.textContent=cleaned;
        }else if(th.textContent!==cleaned){
          th.textContent=cleaned;
        }
      });
    });

    // Safety net for any comparison header rendered without the known classes.
    root.querySelectorAll('.fc-side-table thead th').forEach((th,i)=>{
      if(i===0)return;
      const textEl=th.querySelector('.adine-inline-flock-text,.fc-flock-index');
      const source=textEl ? textEl.textContent : th.textContent;
      const cleaned=clean(source);
      if(textEl){
        if(textEl.textContent!==cleaned)textEl.textContent=cleaned;
      }else if(th.textContent!==cleaned){
        th.textContent=cleaned;
      }
    });
  }

  function sanitizeAllComparisonHeaders(){
    const root=document.getElementById('root');
    if(!root)return;
    sanitizeDirectTable();

    // Also keep the already-correct result labels free of company-only text.
    root.querySelectorAll('.fc-flock-head,.fc-table thead th').forEach((th,i)=>{
      if(th.closest('.fc-side-table'))return;
      const textEl=th.querySelector('.adine-inline-flock-text,.fc-flock-index');
      if(!textEl)return;
      const cleaned=clean(textEl.textContent);
      if(cleaned && textEl.textContent!==cleaned)textEl.textContent=cleaned;
    });
  }

  function init(){
    const root=document.getElementById('root');
    if(!root)return;
    let busy=false;
    const run=()=>{
      if(busy)return;
      busy=true;
      requestAnimationFrame(()=>{
        busy=false;
        sanitizeAllComparisonHeaders();
      });
    };
    new MutationObserver(run).observe(root,{subtree:true,childList:true});
    root.addEventListener('change',run);
    sanitizeAllComparisonHeaders();
    [100,300,750,1500,2500].forEach(ms=>setTimeout(sanitizeAllComparisonHeaders,ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
