/* ADINE — Comprehensive report two-tab controller V1
   Mirrors the comparison-report landing pattern. Read-only UI orchestration. */
(function(global){'use strict';
const root=()=>document.getElementById('root');
let landingActive=false;
function getId(){try{return global.AdineReportRouter?.currentFlockId?.()||new URLSearchParams(location.search).get('flockId')||localStorage.getItem('adine_selected_flock')||''}catch(_){return ''}}
function landing(){const r=root();if(!r)return;landingActive=true;r.innerHTML=`<section class="pi-landing" dir="rtl" aria-label="گزارش جامع عملکرد گله"><div class="pi-landing-heading"><h2>گزارش جامع عملکرد گله</h2><p>نوع تحلیل را انتخاب کنید</p></div><div class="pi-landing-grid"><button type="button" class="pi-landing-card" data-pi-tab="comprehensive"><span class="pi-landing-icon">▦</span><span class="pi-landing-title">تحلیل جامع عملکرد گله</span><span class="pi-landing-desc">روند کامل عملکرد، شاخص‌ها، نمودارها و جدول عملکرد هفتگی</span></button><button type="button" class="pi-landing-card" data-pi-tab="intelligence"><span class="pi-landing-icon">✦</span><span class="pi-landing-title">هوش عملکرد گله گوشتی</span><span class="pi-landing-desc">تحلیل تصمیم‌یار، امتیازدهی، هشدارهای روند و چشم‌انداز کوتاه‌مدت</span></button></div></section>`}
function selectMain(){const b=document.querySelector('.report-tab[data-tab="overall"]');if(b)b.classList.add('active');document.querySelectorAll('.report-tab').forEach(x=>{if(x!==b)x.classList.remove('active')});landingActive=false;location.href='reports.html?flockId='+encodeURIComponent(getId())+'&reportMode=comprehensive';}
async function intelligence(){const r=root();if(!r)return;landingActive=false;r.innerHTML='<section class="section"><div class="empty">در حال آماده‌سازی هوش عملکرد گله گوشتی…</div></section>';
 try{if(!global.AdinePerformanceIntelligence){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://raw.githubusercontent.com/dradine/Dr-adine-poultry-health/feature/broiler-performance-intelligence-v3/performance-intelligence-v1.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
  await global.AdineReportRouter.requireUser();const id=getId();const flock=await global.AdineReportRouter.getFlock(id);const rows=await global.AdineReportRouter.getWeeklyRecords(id);const model=global.AdineReportRouter.buildModel(flock,rows);global.__adineReportFlock=flock;global.__adineReportRows=model?.rows||rows||[];global.AdineBroilerPerformanceIntelligenceReport?.render();
 }catch(e){console.error(e);r.innerHTML=`<section class="section"><div class="error">${String(e?.message||'خطا در بارگذاری هوش عملکرد گله')}</div></section>`}}
function handler(e){const el=e.target?.closest?.('[data-pi-tab]');if(!el||!landingActive)return;e.preventDefault();e.stopImmediatePropagation();if(el.dataset.piTab==='intelligence')intelligence();else selectMain()}
function top(e){const tab=e.target?.closest?.('.report-tab');if(!tab||tab.dataset.tab!=='overall')return;e.preventDefault();e.stopImmediatePropagation();setTimeout(()=>landing(),0)}
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pi-tab]'))handler(e);else top(e)},true);
document.addEventListener('DOMContentLoaded',()=>{const mode=new URLSearchParams(location.search).get('reportMode');if(mode==='comprehensive'){const b=document.querySelector('.report-tab[data-tab="overall"]');if(b){b.click();} }else if(document.querySelector('.report-tab.active')?.dataset.tab==='overall')landing()});
global.AdineComprehensivePerformanceTabs={landing,intelligence};
})(window);
