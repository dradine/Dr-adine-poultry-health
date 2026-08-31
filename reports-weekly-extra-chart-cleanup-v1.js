/* WEEKLY REPORT VISUAL BOOTSTRAP — FINAL V2. Visual layer only. */
(function(){
'use strict';
if(String(location.pathname||'').toLowerCase().split('/').pop()!=='reports.html')return;
function boot(){try{
var root=document.getElementById('root');if(!root)return;
root.querySelectorAll('canvas').forEach(function(x){var b=x.closest('.box');if(b)b.remove();else x.remove()});
if(document.querySelector('script[data-adine-final-weekly-analysis-v2]'))return;
var s=document.createElement('script');s.src='reports-weekly-analysis-final-v2.js?v=20260831-4';s.async=false;s.dataset.adineFinalWeeklyAnalysisV2='true';document.body.appendChild(s);
}catch(e){console.error('Weekly visual bootstrap',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,2200)},{once:true});else setTimeout(boot,2200);
})();
