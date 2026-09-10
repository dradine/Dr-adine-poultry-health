/* ADINE — BROILER COMPREHENSIVE REPORT FIXES V1
   Presentation-only compatibility/fix layer for the isolated broiler comprehensive report.
   RED LINES: no weekly-record writes; no weekly-report calculations; no official-standard changes;
   no navigation changes; no layer/pullet/breeder behavior changes.
*/
"use strict";
(function(global){
  const $=id=>document.getElementById(id);
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  const fmt=(v,d=1)=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
  let cumulativeGainChart=null;
  function captureModel(){const api=global.AdineBroilerComprehensiveReportEngineV2;if(!api?.build||api.__fixWrapped)return;const original=api.build;api.build=function(){const model=original.apply(this,arguments);if(model?.domain==='broiler')global.__adineBroilerComprehensiveModel=model;return model};api.__fixWrapped=true}
  captureModel();
  function patchTrendUnit(){document.querySelectorAll('.cr2-card-sub').forEach(el=>{if(el.textContent.includes('٪/گام'))el.textContent=el.textContent.replace('٪/گام','٪ در هر هفته')})}
  function ensureCumulativeGainChart(){
    const canvas=$('cr2CumulativeGain'),model=global.__adineBroilerComprehensiveModel;if(!canvas||!model||!global.Chart||!model.rows?.length)return;
    if(cumulativeGainChart){try{cumulativeGainChart.destroy()}catch(e){}cumulativeGainChart=null}
    const labels=model.rows.map(r=>'هفته '+fmt(r.week,0));
    cumulativeGainChart=new Chart(canvas,{type:'line',data:{labels,datasets:[{label:'افزایش وزن تجمعی واقعی',data:model.rows.map(r=>n(r.cumulativeWeightGain)),borderWidth:2,tension:.25,pointRadius:3,fill:false,spanGaps:true},{label:'مرجع رسمی افزایش وزن تجمعی',data:model.rows.map(r=>n(r.standardCumulativeWeightGain)),borderWidth:2,tension:.25,pointRadius:2,fill:false,spanGaps:true,borderDash:[6,4]}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top',rtl:true,labels:{font:{family:'Tahoma',size:10},usePointStyle:true}},tooltip:{rtl:true,bodyFont:{family:'Tahoma'},titleFont:{family:'Tahoma'}}},scales:{x:{grid:{display:false},ticks:{font:{family:'Tahoma',size:9}}},y:{beginAtZero:true,title:{display:true,text:'گرم',font:{family:'Tahoma',size:9}},ticks:{font:{family:'Tahoma',size:9}}}}}});
  }
  function injectChart(){
    if($('cr2CumulativeGain')){patchTrendUnit();ensureCumulativeGainChart();return}
    const gain=$('cr2Gain');if(!gain)return;
    const host=gain.closest('.cr2-chart-card')||gain.closest('.chart-card')||gain.parentElement?.parentElement||gain.parentElement;if(!host?.parentNode)return;
    const section=document.createElement('section');section.className='cr2-chart-card cr2-cumulative-gain-fix';section.style.cssText='margin-top:16px;padding:16px;border-radius:14px;background:var(--card-bg,#fff);border:1px solid rgba(0,0,0,.08);';
    section.innerHTML='<div class="cr2-chart-head" style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px"><div><div class="eyebrow">رشد تجمعی</div><h3>افزایش وزن تجمعی</h3></div><span class="scope-badge">واقعی در برابر مرجع رسمی</span></div><div class="cr2-chart-wrap" style="position:relative;height:280px"><canvas id="cr2CumulativeGain"></canvas></div>';
    host.parentNode.insertBefore(section,host.nextSibling);patchTrendUnit();ensureCumulativeGainChart();
  }
  function schedule(){setTimeout(()=>{captureModel();patchTrendUnit();injectChart()},80)}
  function init(){schedule();if(global.MutationObserver)new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  global.AdineBroilerComprehensiveReportFixesV1={version:'BROILER-COMPREHENSIVE-REPORT-FIXES-V1'};
})(typeof window!=='undefined'?window:globalThis);