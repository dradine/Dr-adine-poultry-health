/* ADINE — Comprehensive report two-tab controller V6
   Owns only the landing/selection state for the comprehensive report.
   V6 keeps the landing as the selector and opens the real comprehensive
   analysis in-place. It also protects the analysis view from the legacy
   reports.js async initialization/render race, without changing weekly
   calculations or the weekly report renderer itself.
*/
(function(global){'use strict';
const root=()=>document.getElementById('root');
let landingActive=false;
let analysisRepairScheduled=false;
function getId(){try{return global.AdineReportRouter?.currentFlockId?.()||new URLSearchParams(location.search).get('flockId')||localStorage.getItem('adine_selected_flock')||''}catch(_){return ''}}
function setParentVisual(active){
  const nav=document.querySelector('.report-tabs');
  const overall=document.querySelector('.report-tab[data-tab="overall"]');
  if(!nav||!overall)return;
  nav.classList.toggle('comprehensive-active',!!active);
  document.querySelectorAll('.report-tab').forEach(x=>{
    x.classList.toggle('active',!!active ? x===overall : x.dataset.tab==='weekly');
    x.setAttribute('aria-selected',!!active && x===overall?'true':x.dataset.tab==='weekly'&&!active?'true':'false');
  });
}
function syncParentTab(){
  const overall=document.querySelector('.report-tab[data-tab="overall"]');
  if(!overall)return;
  setParentVisual(true);
  const toolbar=document.querySelector('.report-toolbar');
  if(toolbar){toolbar.classList.add('week-selector-hidden');toolbar.classList.remove('is-weekly');toolbar.classList.add('is-comprehensive');}
  const slot=document.getElementById('latestWeekSlot');
  if(slot)slot.classList.add('latest-week-slot-hidden');
  const scope=document.getElementById('scope');
  if(scope)scope.textContent='گزارش جامع عملکرد گله';
}
function clearParentVisual(){
  const nav=document.querySelector('.report-tabs');
  if(nav)nav.classList.remove('comprehensive-active');
}
function landing(){
  const r=root();if(!r)return;
  landingActive=true;
  global.__adineComprehensiveLandingActive=true;
  syncParentTab();
  r.innerHTML=`<section class="pi-landing" dir="rtl" aria-label="گزارش جامع عملکرد گله"><div class="pi-landing-heading"><h2>گزارش جامع عملکرد گله</h2><p>نوع تحلیل را انتخاب کنید</p></div><div class="pi-landing-grid"><button type="button" class="pi-landing-card" data-pi-tab="comprehensive"><span class="pi-landing-icon">▦</span><span class="pi-landing-title">تحلیل جامع عملکرد گله</span><span class="pi-landing-desc">روند کامل عملکرد، شاخص‌ها، نمودارها و جدول عملکرد هفتگی</span></button><button type="button" class="pi-landing-card" data-pi-tab="intelligence"><span class="pi-landing-icon">✦</span><span class="pi-landing-title">هوش عملکرد گله گوشتی</span><span class="pi-landing-desc">تحلیل تصمیم‌یار، امتیازدهی، هشدارهای روند و چشم‌انداز کوتاه‌مدت</span></button></div></section>`;
}
function selectMain(){
  landingActive=false;
  global.__adineComprehensiveLandingActive=false;
  const id=getId();
  if(!id){root()?.replaceChildren(Object.assign(document.createElement('section'),{className:'section',innerHTML:'<div class="error">شناسه گله انتخاب‌شده پیدا نشد.</div>'}));return}
  try{
    const p=new URLSearchParams(location.search);
    p.set('flockId',id);p.set('reportMode','comprehensive');p.set('view','analysis');
    history.replaceState(history.state,'',location.pathname+'?'+p.toString());
  }catch(_){ }
  syncParentTab();
  setTimeout(()=>window.dispatchEvent(new Event('adine:report-ready')),0);
}
async function intelligence(){
  const r=root();if(!r)return;
  landingActive=false;
  global.__adineComprehensiveLandingActive=false;
  syncParentTab();
  r.innerHTML='<section class="section"><div class="empty">در حال آماده‌سازی هوش عملکرد گله گوشتی…</div></section>';
  try{
    if(!global.AdinePerformanceIntelligence){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://raw.githubusercontent.com/dradine/Dr-adine-poultry-health/feature/broiler-performance-intelligence-v3/performance-intelligence-v1.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
    await global.AdineReportRouter.requireUser();
    const id=getId();const flock=await global.AdineReportRouter.getFlock(id);const rows=await global.AdineReportRouter.getWeeklyRecords(id);const model=global.AdineReportRouter.buildModel(flock,rows);
    global.__adineReportFlock=flock;global.__adineReportRows=model?.rows||rows||[];global.AdineBroilerPerformanceIntelligenceReport?.render()
  }catch(e){console.error(e);r.innerHTML=`<section class="section"><div class="error">${String(e?.message||'خطا در بارگذاری هوش عملکرد گله')}</div></section>`}
}
function handler(e){const el=e.target?.closest?.('[data-pi-tab]');if(!el||!landingActive)return;e.preventDefault();e.stopImmediatePropagation();el.dataset.piTab==='intelligence'?intelligence():selectMain()}
function top(e){
  const tab=e.target?.closest?.('.report-tab');if(!tab)return;
  if(tab.dataset.tab==='overall'){
    e.preventDefault();e.stopImmediatePropagation();
    landing();
    return;
  }
  if(tab.dataset.tab==='weekly'||tab.dataset.tab==='compare-empty'){
    landingActive=false;
    global.__adineComprehensiveLandingActive=false;
    clearParentVisual();
  }
}
function enforceLanding(){
  const params=new URLSearchParams(location.search);
  if(params.get('reportMode')!=='comprehensive'||params.get('view')==='analysis')return;
  if(document.querySelector('.report-tab[data-tab="overall"]')){
    setParentVisual(true);
    if(!landingActive)landing();
  }
}
function isAnalysisMode(){
  const p=new URLSearchParams(location.search);
  return p.get('reportMode')==='comprehensive'&&p.get('view')==='analysis';
}
function repairAnalysis(){
  if(!isAnalysisMode()||landingActive)return;
  const r=root();
  const overall=document.querySelector('.report-tab[data-tab="overall"].active');
  if(!r||!overall)return;
  /* reports.js has an async init(). If it finishes after the user selected
     the comprehensive card, its local activeTab can still be "weekly" and
     it can overwrite #root. The real V2.2 report identifies itself with
     .cr2-hero; only repair when that report is absent. */
  if(r.querySelector('.cr2-hero'))return;
  if(analysisRepairScheduled)return;
  analysisRepairScheduled=true;
  setTimeout(()=>{
    analysisRepairScheduled=false;
    if(!isAnalysisMode()||landingActive)return;
    const rr=root();
    if(!rr||!document.querySelector('.report-tab[data-tab="overall"].active'))return;
    if(rr.querySelector('.cr2-hero'))return;
    window.dispatchEvent(new Event('adine:report-ready'));
  },0);
}
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pi-tab]'))handler(e);else top(e)},true);
document.addEventListener('DOMContentLoaded',()=>{setTimeout(enforceLanding,250)});
const rootObserver=new MutationObserver(()=>{
  const params=new URLSearchParams(location.search);
  if(params.get('reportMode')!=='comprehensive')return;
  if(params.get('view')==='analysis'){
    repairAnalysis();
    return;
  }
  if(!landingActive)return;
  if(document.querySelector('.report-tab[data-tab="overall"]')){
    setParentVisual(true);
    const r=root();
    if(r&&!r.querySelector('.pi-landing-card'))setTimeout(landing,0);
  }
});
function start(){const r=root();if(r)rootObserver.observe(r,{childList:true,subtree:true});setTimeout(enforceLanding,300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
global.AdineComprehensivePerformanceTabs={landing,intelligence,syncParentTab,selectMain};
})(window);
