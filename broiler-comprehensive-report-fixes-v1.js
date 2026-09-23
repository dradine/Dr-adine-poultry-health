/* ADINE — BROILER COMPREHENSIVE REPORT FIXES V6
   Presentation-only compatibility layer. No weekly writes/calculation changes.
   IMPORTANT: no body-wide MutationObserver; fixes run once per comprehensive render.
*/
"use strict";
(function(global){
  const $=id=>document.getElementById(id),n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))));return Number.isFinite(x)?x:null};
  let cumulativeFcrChart=null,mortalityChart=null;
  function patchMortality(model){if(!model?.rows?.length)return model;const initial=n(model.initialBirds),first=model.rows[0],inferred=initial!==null&&initial>0?initial:(n(first?.mortalityCount)!==null&&n(first?.liveBirds)!==null?n(first.mortalityCount)+n(first.liveBirds):null);let cumulative=0,prevLive=null;const rows=model.rows.map((r,i)=>{const deaths=n(r.mortalityCount),live=n(r.liveBirds);cumulative+=deaths??0;let weekly=null,atRisk=null;if(deaths!==null){if(i===0)atRisk=inferred;else if(prevLive!==null&&prevLive>0)atRisk=prevLive;else if(inferred!==null)atRisk=inferred-(cumulative-deaths);if(atRisk!==null&&atRisk>0)weekly=deaths/atRisk*100}if(live!==null)prevLive=live;return Object.freeze({...r,mortalityPercent:weekly,cumulativeMortalityCount:cumulative,cumulativeMortalityPercent:inferred!==null&&inferred>0?cumulative/inferred*100:null})});const latest=rows.at(-1)||null;return Object.freeze({...model,rows:Object.freeze(rows),last:latest,cumulativeMortalityCount:cumulative,cumulativeMortalityPercent:inferred!==null&&inferred>0?cumulative/inferred*100:null,mortalityInitialBirds:inferred,mortalityMethod:initial!==null?'sum-weekly-mortality-counts':'first-week-live-plus-mortality'})}
  function capture(){const api=global.AdineBroilerComprehensiveReportEngineV2;if(!api?.build||api.__fixWrapped)return;const original=api.build;api.build=function(){let m=original.apply(this,arguments);if(m?.domain==='broiler'){m=patchMortality(m);global.__adineBroilerComprehensiveModel=m}return m};api.__fixWrapped=true}
  function inject(){const model=global.__adineBroilerComprehensiveModel;if(!model?.rows?.length||!global.Chart)return;const labels=model.rows.map(r=>'هفته '+n(r.week));const make=(id,type,datasets)=>{const c=$(id);if(!c)return null;return new Chart(c,{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top',rtl:true,labels:{font:{family:'Tahoma',size:10}}},tooltip:{rtl:true}},scales:{x:{grid:{display:false}},y:{beginAtZero:true}}}})};
    if($('cr2CumulativeFcr')){if(cumulativeFcrChart)try{cumulativeFcrChart.destroy()}catch(e){};cumulativeFcrChart=make('cr2CumulativeFcr','line',[{label:'FCR تجمعی واقعی',data:model.rows.map(r=>n(r.cumulativeFcr)),borderWidth:2,tension:.25,pointRadius:3,fill:false},{label:'مرجع رسمی FCR تجمعی',data:model.rows.map(r=>n(r.standardCumulativeFcr)),borderWidth:2,tension:.25,pointRadius:2,fill:false,borderDash:[6,4]}])}
    if($('cr2Mort')){if(mortalityChart)try{mortalityChart.destroy()}catch(e){};mortalityChart=make('cr2Mort','bar',[{label:'تلفات هفتگی (%)',data:model.rows.map(r=>n(r.mortalityPercent)),borderWidth:1},{type:'line',label:'تلفات تجمعی (%)',data:model.rows.map(r=>n(r.cumulativeMortalityPercent)),borderWidth:2,tension:.25,pointRadius:3,fill:false}])}
  }
  function fcrTrendReferenceClass(actual,target){if(actual===null||target===null||target===0)return'neutral';const gap=(actual-target)/Math.abs(target)*100;if(gap<=0)return Math.abs(gap)<=3?'excellent':'good';if(gap<=7)return'watch';if(gap<=15)return'watch';return'critical'}
  function patchFcrTrend(){
    const model=global.__adineBroilerComprehensiveModel;
    const root=$('root');
    const last=model?.last;
    if(!root||!last)return;
    const actual=n(last.fcr),target=n(last.standardWeeklyFcr);
    if(actual===null||target===null||target===0)return;
    const card=[...root.querySelectorAll('.cr2-trend-card')].find(x=>(x.querySelector('.cr2-card-label')?.textContent||'').trim()==='روند FCR');
    if(!card)return;
    const cls=fcrTrendReferenceClass(actual,target);
    card.classList.remove('neutral','good','excellent','watch','critical');
    card.classList.add(cls);
    const gap=(actual-target)/Math.abs(target)*100;
    const abs=Math.abs(gap).toLocaleString('fa-IR',{minimumFractionDigits:1,maximumFractionDigits:1});
    const oldSub=card.querySelector('.cr2-card-sub')?.textContent||'';
    const slopeMatch=oldSub.match(/شیب نسبی:\s*([^·]+)/);
    const slope=slopeMatch?.[1]?.trim()||'—';
    let meaning='هم‌سطح مرجع';
    if(gap<0)meaning=`مطلوب نسبت به مرجع · ${abs}٪ پایین‌تر از مرجع`;
    else if(gap>0)meaning=`نامطلوب نسبت به مرجع · ${abs}٪ بالاتر از مرجع`;
    const next=`${meaning} · شیب نسبی: ${slope}`;
    const sub=card.querySelector('.cr2-card-sub');
    if(sub&&sub.textContent!==next)sub.textContent=next;
    card.setAttribute('data-fcr-reference-gap',String(gap));
  }
  function run(){capture();setTimeout(()=>{inject();patchFcrTrend()},0);setTimeout(patchFcrTrend,50)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  document.addEventListener('click',e=>{if(e.target?.closest?.('.report-tab[data-tab="overall"]')){setTimeout(run,0);setTimeout(patchFcrTrend,100)}},true);
  const rootObserver=()=>{const root=$('root');if(!root)return;const obs=new MutationObserver(()=>patchFcrTrend());obs.observe(root,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',rootObserver,{once:true});else rootObserver();
  global.AdineBroilerComprehensiveReportFixesV1={version:'BROILER-COMPREHENSIVE-REPORT-FIXES-V6',run};
})(window);
