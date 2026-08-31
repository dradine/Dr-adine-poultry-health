/* Weekly reports chart removal ONLY. Does not read/write or alter calculations, standards, weekly data, FCR engines, or Supabase data. */
(function(){
  'use strict';
  if(String(location.pathname||'').toLowerCase().split('/').pop()!=='reports.html') return;

  function removeCharts(){
    const root=document.getElementById('root')||document.body;
    if(!root) return;
    root.querySelectorAll('canvas, .chart, [data-chart], [id*="chart" i], [id^="wWeight"], [id^="wGain"], [id^="wFcr"], [id^="o1"], [id^="o2"]').forEach(el=>{
      const box=el.closest('.box');
      if(box) box.remove(); else el.remove();
    });
    root.querySelectorAll('.section').forEach(section=>{
      const text=String(section.textContent||'');
      if(/میانگین وزن.*استاندارد رسمی|افزایش وزن هفتگی.*استاندارد رسمی|FCR تجمعی.*استاندارد رسمی|FCR هفتگی.*هدف مدیریتی|تحلیل واقعی و نمودارهای ارزیابی|نمودارهای ارزیابی/.test(text)){
        if(section.querySelector('canvas,.chart,[data-chart]')) section.remove();
      }
    });
  }

  function start(){
    removeCharts();
    const root=document.getElementById('root');
    if(!root) return;
    if(window.__adineWeeklyChartRemovalObserver) return;
    const observer=new MutationObserver(removeCharts);
    window.__adineWeeklyChartRemovalObserver=observer;
    observer.observe(root,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
