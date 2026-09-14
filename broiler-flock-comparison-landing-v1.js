/* ADINE — Comparison landing screen V6
   Back button exists only inside comparison child views.
   Weekly report and the comparison landing screen never receive this button.
   Benchmark uses the same shared return button as flock comparison.
*/
(function(global){'use strict';
let active=false;
const root=()=>document.getElementById('root');
const compareTab=()=>document.querySelector('.report-tab[data-tab="compare-empty"]');
const compareIsActive=()=>compareTab()?.classList.contains('active');
function showLanding(){const r=root();if(!r)return;active=true;r.classList.remove('is-compare-empty');r.innerHTML='<section class="fc-landing" dir="rtl" aria-label="گزارش مقایسه‌ای"><div class="fc-landing-heading"><h2>گزارش مقایسه‌ای</h2><p>نوع مقایسه را انتخاب کنید</p></div><div class="fc-landing-grid"><button type="button" class="fc-landing-card fc-landing-flocks" data-fc-landing="flocks"><span class="fc-landing-icon">⇄</span><span class="fc-landing-title">مقایسه گله‌ها</span><span class="fc-landing-desc">مقایسه عملکرد دو یا سه گله در سنین مشترک</span></button><button type="button" class="fc-landing-card fc-landing-benchmark" data-fc-landing="benchmark"><span class="fc-landing-icon">◎</span><span class="fc-landing-title">Benchmark گله گوشتی</span><span class="fc-landing-desc">جایگاه گله در بین گله‌های واقعی هم‌سن و مشابه</span></button></div></section>'}
function getFlockId(){try{const routerId=global.AdineReportRouter?.currentFlockId?.();if(routerId)return routerId}catch(_){}const q=new URLSearchParams(location.search),id=q.get('flockId')||q.get('flock_id');if(id)return id;try{return localStorage.getItem('adine_selected_flock')||''}catch(_){return ''}}
function addChildBack(){const r=root();if(!r||active||!compareIsActive())return;
  /* The Benchmark engine has its own legacy .bb-back button. Remove it so
     every comparison child uses exactly one shared return button. */
  r.querySelectorAll('.bb-back').forEach(x=>x.remove());
  if(r.querySelector('.fc-child-back'))return;
  const b=document.createElement('button');b.type='button';b.className='fc-child-back';b.textContent='بازگشت';b.setAttribute('aria-label','بازگشت به انتخاب گزارش مقایسه‌ای');b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showLanding()});r.insertBefore(b,r.firstChild)
}
function showBenchmark(){const r=root();if(!r)return;active=false;const id=getFlockId();if(!id||!global.AdineBroilerBenchmark){r.innerHTML='<section class="fc-panel" dir="rtl"><div class="fc-error">گله فعال یا موتور Benchmark در دسترس نیست.</div></section>';return}r.innerHTML='<section class="fc-panel bb-host" dir="rtl"></section>';const host=r.querySelector('.bb-host');global.AdineBroilerBenchmark.mount(host,id,null);setTimeout(addChildBack,100)}
function showFlocks(){active=false;const ui=global.AdineBroilerFlockComparisonUI;const r=root();if(!r)return;if(ui?.start)ui.start();else r.innerHTML='<section class="fc-panel"><div class="fc-error">موتور مقایسه گله‌ها بارگذاری نشده است.</div></section>';setTimeout(addChildBack,150)}
function handler(e){const el=e.target?.closest?.('[data-fc-landing],[data-fc-landing-back],.fc-child-back,.bb-back');if(!el)return;if(el.classList.contains('fc-child-back')||el.classList.contains('bb-back')){e.preventDefault();e.stopImmediatePropagation();if(compareIsActive())showLanding();return}if(!active)return;e.preventDefault();e.stopImmediatePropagation();if(el.hasAttribute('data-fc-landing-back'))return showLanding();if(el.dataset.fcLanding==='benchmark')return showBenchmark();return showFlocks()}
function top(e){const tab=e.target?.closest?.('.report-tab');if(!tab||tab.dataset.tab!=='compare-empty')return;e.preventDefault();e.stopImmediatePropagation();document.querySelectorAll('.report-tab').forEach(x=>x.classList.remove('active'));tab.classList.add('active');showLanding()}
const observer=new MutationObserver(()=>{if(!compareIsActive()){active=false;return}if(active){if(!root()?.querySelector('.fc-landing'))setTimeout(showLanding,0);return}addChildBack()});
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-fc-landing],[data-fc-landing-back],.fc-child-back,.bb-back'))handler(e);else top(e)},true);
function sync(){if(compareIsActive()){if(!active)showLanding()}}
function start(){const r=root();if(r)observer.observe(r,{childList:true,subtree:true});sync()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
global.AdineComparisonLanding={showLanding,showBenchmark};
})(window);
