/* WEEKLY REPORTS VISUAL BOOTSTRAP ONLY.
   Removes the legacy chart block once, then starts the single final analytical renderer.
   Never writes data and never changes calculations or standards. */
(function(){
  'use strict';
  if(String(location.pathname||'').toLowerCase().split('/').pop()!=='reports.html') return;
  function removeLegacyCharts(){
    const root=document.getElementById('root')||document.body;
    if(!root)return;
    root.querySelectorAll('canvas').forEach(el=>{const box=el.closest('.box');if(box)box.remove();else el.remove();});
    root.querySelectorAll('.section').forEach(section=>{
      if(section.classList.contains('wa-final'))return;
      const text=String(section.textContent||'');
      if(/میانگین وزن.*استاندارد رسمی|افزایش وزن هفتگی.*استاندارد رسمی|FCR تجمعی.*استاندارد رسمی|FCR هفتگی.*هدف مدیریتی|تحلیل واقعی و نمودارهای ارزیابی/.test(text)) section.remove();
    });
  }
  function boot(){
    removeLegacyCharts();
    if(document.querySelector('script[data-adine-final-weekly-analysis]'))return;
    const s=document.createElement('script');
    s.src='reports-weekly-analysis-final-v1.js?v=20260831-1';
    s.async=false;
    s.dataset.adineFinalWeeklyAnalysis='true';
    (document.head||document.documentElement).appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,900),{once:true});
  else setTimeout(boot,900);
})();
