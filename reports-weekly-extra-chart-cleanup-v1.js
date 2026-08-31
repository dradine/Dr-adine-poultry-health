/* WEEKLY REPORT VISUAL BOOTSTRAP — FCR CHART ONLY. No calculation or standard changes. */
(function(){
'use strict';
if(String(location.pathname||'').toLowerCase().split('/').pop()!=='reports.html')return;
function boot(){try{
 var root=document.getElementById('root');if(!root)return;
 root.querySelectorAll('canvas').forEach(function(x){var b=x.closest('.box');if(b)b.remove();else x.remove()});
 root.querySelectorAll('.chart').forEach(function(x){x.remove()});
 var old=document.querySelector('script[data-adine-final-weekly-analysis-v2]');
 if(!old){var s=document.createElement('script');s.src='reports-weekly-analysis-final-v2.js?v=20260831-stat-fcr-v3';s.async=false;s.dataset.adineFinalWeeklyAnalysisV2='true';document.body.appendChild(s)}
}catch(e){console.error('Weekly visual bootstrap',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,1200)},{once:true});else setTimeout(boot,1200);
})();
