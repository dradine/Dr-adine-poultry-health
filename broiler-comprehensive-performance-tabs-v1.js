/* ADINE — Comprehensive report two-tab controller V3
   Owns only the landing/selection state for the comprehensive report.
   V3 also owns a dedicated visual state on the parent tabs container so
   legacy report listeners cannot leave the comprehensive tab visually inactive. */
(function(global){'use strict';
const root=()=>document.getElementById('root');
let landingActive=false;
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
function landing(){const r=root();if(!r)return;landingActive=true;syncParentTab();r.innerHTML=`<section class="pi-landing" dir="rtl" aria-label="گزارش جامع عملکرد گله"><div class="pi-landing-heading"><h2>گزارش جامع عملکرد گله</h2><p>نوع تحلیل را انتخاب کنید</p></div><div class="pi-landing-grid"><button type="button" class="pi-landing-card" data-pi-tab="comprehensive"><span class="pi-landing-icon">▦</span><span class="pi-landing-title">تحلیل جامع عملکرد گله</span><span class="pi-landing-desc">روند کامل عملکرد، شاخص‌ها، نمودارها و جدول عملکرد هفتگی</span></button><button type="button" class="pi-landing-card" data-pi-tab="intelligence"><span class="pi-landing-icon">✦</span><span class="pi-landing-title">هوش عملکرد گله گوشتی</span><span class="pi-landing-desc">تحلیل تصمیم‌یار، امتیازدهی، هشدارهای روند و چشم‌انداز کوتاه‌مدت</span></button></div></section>`}
function selectMain(){landingActive=false;const id=getId();location.href='reports.html?flockId='+encodeURIComponent(id)+'&reportMode=comprehensive'}
async function intelligence(){const r=root();if(!r)return;landingActive=false;syncParentTab();r.innerHTML='<section class="section"><div class="empty">در حال آماده‌سازی هوش عملکرد گله گوشتی…</div></section>';try{if(!global.AdinePerformanceIntelligence){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://raw.githubusercontent.com/dradine/Dr-adine-poultry-health/feature/broiler-performance-intelligence-v3/performance-intelligence-v1.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}await global.AdineReportRouter.requireUser();const id=getId();const flock=await global.AdineReportRouter.getFlock(id);const rows=await global.AdineReportRouter.getWeeklyRecords(id);const model=global.AdineReportRouter.buildModel(flock,rows);global.__adineReportFlock=flock;global.__adineReportRows=model?.rows||rows||[];global.AdineBroilerPerformanceIntelligenceReport?.render()}catch(e){console.error(e);r.innerHTML=`<section class="section"><div class="error">${String(e?.message||'خطا در بارگذاری هوش عملکرد گله')}</div></section>`}}
function handler(e){const el=e.target?.closest?.('[data-pi-tab]');if(!el||!landingActive)return;e.preventDefault();e.stopImmediatePropagation();el.dataset.piTab==='intelligence'?intelligence():selectMain()}
function top(e){const tab=e.target?.closest?.('.report-tab');if(!tab)return;if(tab.dataset.tab==='overall'){if(new URLSearchParams(location.search).get('reportMode')==='comprehensive')return;e.preventDefault();e.stopImmediatePropagation();syncParentTab();setTimeout(landing,0);return}if(tab.dataset.tab==='weekly'||tab.dataset.tab==='compare-empty')clearParentVisual()}
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pi-tab]'))handler(e);else top(e)},true);
document.addEventListener('DOMContentLoaded',()=>{const mode=new URLSearchParams(location.search).get('reportMode');if(mode==='comprehensive'){syncParentTab();setTimeout(landing,0)}else if(document.querySelector('.report-tab.active')?.dataset.tab==='overall'){setTimeout(landing,0)}});
global.AdineComprehensivePerformanceTabs={landing,intelligence,syncParentTab};
})(window);
