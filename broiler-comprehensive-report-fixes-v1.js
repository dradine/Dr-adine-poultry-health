/* ADINE — BROILER COMPREHENSIVE REPORT FIXES V3
   Presentation-only compatibility/fix layer for the isolated broiler comprehensive report.
   RED LINES: no weekly-record writes; no weekly-report calculations; no official-standard changes;
   no navigation changes; no layer/pullet/breeder behavior changes.
*/
"use strict";
(function(global){
  const $=id=>document.getElementById(id);
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  const fmt=(v,d=1)=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
  let cumulativeFcrChart=null;
  function patchMortalityModel(model){
    if(!model?.rows?.length)return model;
    const initial=n(model.initialBirds);
    let cumulativeCount=0;
    let previousLive=null;
    const rows=model.rows.map((r,i)=>{
      const deaths=n(r.mortalityCount);
      const live=n(r.liveBirds);
      cumulativeCount += deaths??0;
      let weeklyPercent=null;
      if(deaths!==null){
        let atRisk=null;
        if(i===0){
          atRisk=initial;
        }else if(previousLive!==null){
          atRisk=previousLive;
        }else if(initial!==null&&initial>0){
          atRisk=initial-(cumulativeCount-deaths);
        }
        if(atRisk!==null&&atRisk>0)weeklyPercent=deaths/atRisk*100;
      }
      const cumulativePercent=initial!==null&&initial>0?cumulativeCount/initial*100:null;
      if(live!==null)previousLive=live;
      return Object.freeze({...r,mortalityPercent:weeklyPercent,cumulativeMortalityCount:cumulativeCount,cumulativeMortalityPercent:cumulativePercent});
    });
    const latest=rows.at(-1)||null;
    const count=rows.reduce((s,r)=>s+(n(r.mortalityCount)??0),0);
    const percent=initial!==null&&initial>0?count/initial*100:null;
    return Object.freeze({...model,rows:Object.freeze(rows),last:latest,cumulativeMortalityCount:count,cumulativeMortalityPercent:percent,mortalityMethod:'sum-weekly-mortality-counts'});
  }
  function captureModel(){
    const api=global.AdineBroilerComprehensiveReportEngineV2;
    if(!api?.build||api.__fixWrapped)return;
    const original=api.build;
    api.build=function(){
      let model=original.apply(this,arguments);
      if(model?.domain==='broiler'){
        model=patchMortalityModel(model);
        global.__adineBroilerComprehensiveModel=model;
      }
      return model;
    };
    api.__fixWrapped=true;
  }
  captureModel();
  function patchTrendUnit(){document.querySelectorAll('.cr2-card-sub').forEach(el=>{if(el.textContent.includes('٪/گام'))el.textContent=el.textContent.replace('٪/گام','٪ در هر هفته')})}
  function ensureCumulativeFcrChart(){
    const canvas=$('cr2CumulativeFcr'),model=global.__adineBroilerComprehensiveModel;if(!canvas||!model||!global.Chart||!model.rows?.length)return;
    if(cumulativeFcrChart){try{cumulativeFcrChart.destroy()}catch(e){}cumulativeFcrChart=null}
    const labels=model.rows.map(r=>'هفته '+fmt(r.week,0));
    cumulativeFcrChart=new Chart(canvas,{type:'line',data:{labels,datasets:[
      {label:'FCR تجمعی واقعی',data:model.rows.map(r=>n(r.cumulativeFcr)),borderWidth:2,tension:.25,pointRadius:3,fill:false,spanGaps:true},
      {label:'مرجع رسمی FCR تجمعی',data:model.rows.map(r=>n(r.standardCumulativeFcr)),borderWidth:2,tension:.25,pointRadius:2,fill:false,spanGaps:true,borderDash:[6,4]}
    ]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top',rtl:true,labels:{font:{family:'Tahoma',size:10},usePointStyle:true}},tooltip:{rtl:true,bodyFont:{family:'Tahoma'},titleFont:{family:'Tahoma'}}},scales:{x:{grid:{display:false},ticks:{font:{family:'Tahoma',size:9}}},y:{beginAtZero:false,title:{display:true,text:'FCR',font:{family:'Tahoma',size:9}},ticks:{font:{family:'Tahoma',size:9}}}}}});
  }
  function ensureMortalityChart(){
    const canvas=$('cr2Mort'),model=global.__adineBroilerComprehensiveModel;
    if(!canvas||!model||!global.Chart||!model.rows?.length)return;
    const existing=global.__adineBroilerMortalityChart;
    if(existing){try{existing.destroy()}catch(e){}}
    const labels=model.rows.map(r=>'هفته '+fmt(r.week,0));
    global.__adineBroilerMortalityChart=new Chart(canvas,{type:'bar',data:{labels,datasets:[
      {label:'تلفات هفتگی (%)',data:model.rows.map(r=>n(r.mortalityPercent)),backgroundColor:'rgba(183,78,78,.55)',borderColor:'rgba(183,78,78,1)',borderWidth:1},
      {type:'line',label:'تلفات تجمعی (%)',data:model.rows.map(r=>n(r.cumulativeMortalityPercent)),borderColor:'rgba(120,70,70,1)',backgroundColor:'rgba(120,70,70,1)',borderWidth:2,tension:.25,pointRadius:3,fill:false,spanGaps:true}
    ]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top',rtl:true,labels:{font:{family:'Tahoma',size:10},usePointStyle:true}},tooltip:{rtl:true,bodyFont:{family:'Tahoma'},titleFont:{family:'Tahoma'}}},scales:{x:{grid:{display:false},ticks:{font:{family:'Tahoma',size:9}}},y:{beginAtZero:true,title:{display:true,text:'درصد',font:{family:'Tahoma',size:9}},ticks:{font:{family:'Tahoma',size:9}}}}}});
  }
  function injectChart(){
    patchTrendUnit();
    if($('cr2CumulativeFcr'))ensureCumulativeFcrChart();
    else{
      const fcr=$('cr2Fcr');
      if(fcr){
        const host=fcr.closest('.cr2-chart-card')||fcr.closest('.chart-card')||fcr.parentElement?.parentElement||fcr.parentElement;
        if(host?.parentNode){
          const section=document.createElement('section');section.className='cr2-chart-card cr2-cumulative-fcr-fix';section.style.cssText='margin-top:16px;padding:16px;border-radius:14px;background:var(--card-bg,#fff);border:1px solid rgba(0,0,0,.08);';
          section.innerHTML='<div class="cr2-chart-head" style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px"><div><div class="eyebrow">راندمان تجمعی</div><h3>FCR تجمعی</h3></div><span class="scope-badge">واقعی در برابر مرجع رسمی</span></div><div class="cr2-chart-wrap" style="position:relative;height:280px"><canvas id="cr2CumulativeFcr"></canvas></div>';
          host.parentNode.insertBefore(section,host.nextSibling);
        }
      }
      ensureCumulativeFcrChart();
    }
    ensureMortalityChart();
  }
  function schedule(){setTimeout(()=>{captureModel();patchTrendUnit();injectChart()},80)}
  function init(){schedule();if(global.MutationObserver)new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  global.AdineBroilerComprehensiveReportFixesV1={version:'BROILER-COMPREHENSIVE-REPORT-FIXES-V3'};
})(typeof window!=='undefined'?window:globalThis);