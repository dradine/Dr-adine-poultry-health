/* Weekly reports visual bootstrap — FINAL. Visual layer only. */
(function(){
'use strict';
if(String(location.pathname||'').toLowerCase().split('/').pop()!=='reports.html')return;
function boot(){
  try{
    document.querySelectorAll('#root canvas').forEach(function(x){var b=x.closest('.box');if(b)b.remove();else x.remove();});
    document.querySelectorAll('#root .section').forEach(function(s){if(s.classList.contains('wa-final'))return;var t=String(s.textContent||'');if(/میانگین وزن.*استاندارد رسمی|افزایش وزن هفتگی.*استاندارد رسمی|FCR تجمعی.*استاندارد رسمی|FCR هفتگی.*هدف مدیریتی|تحلیل واقعی و نمودارهای ارزیابی/.test(t))s.remove();});
    if(document.querySelector('script[data-adine-final-weekly-analysis]'))return;
    var s=document.createElement('script');s.src='reports-weekly-analysis-final-v1.js?v=20260831-3';s.async=false;s.dataset.adineFinalWeeklyAnalysis='true';document.body.appendChild(s);
  }catch(e){console.error('Weekly visual bootstrap',e);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,1400)},{once:true});else setTimeout(boot,1400);
})();
