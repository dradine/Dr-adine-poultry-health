/* ADINE — Comparison landing screen V3: benchmark connected independently. */
(function(global){'use strict';let active=false;const root=()=>document.getElementById('root');
function showLanding(){const r=root();if(!r)return;active=true;r.classList.remove('is-compare-empty');r.innerHTML='<section class="fc-landing" dir="rtl" aria-label="گزارش مقایسه‌ای"><div class="fc-landing-heading"><h2>گزارش مقایسه‌ای</h2><p>نوع مقایسه را انتخاب کنید</p></div><div class="fc-landing-grid"><button type="button" class="fc-landing-card fc-landing-flocks" data-fc-landing="flocks"><span class="fc-landing-icon">⇄</span><span class="fc-landing-title">مقایسه گله‌ها</span><span class="fc-landing-desc">مقایسه عملکرد دو یا سه گله در سنین مشترک</span></button><button type="button" class="fc-landing-card fc-landing-benchmark" data-fc-landing="benchmark"><span class="fc-landing-icon">◎</span><span class="fc-landing-title">Benchmark گله گوشتی</span><span class="fc-landing-desc">جایگاه گله در بین گله‌های واقعی هم‌سن و مشابه</span></button></div></section>'}
function getFlockId(){
  try{
    const routerId=global.AdineReportRouter?.currentFlockId?.();
    if(routerId)return routerId;
  }catch(_){ }
  const q=new URLSearchParams(location.search),id=q.get('flockId')||q.get('flock_id');
  if(id)return id;
  try{return localStorage.getItem('adine_selected_flock')||''}catch(_){return ''}
}
function showBenchmark(){const r=root();if(!r)return;active=true;const id=getFlockId();if(!id||!global.AdineBroilerBenchmark){r.innerHTML='<section class="fc-panel" dir="rtl"><div class="fc-error">گله فعال یا موتور Benchmark در دسترس نیست.</div></section>';return}r.innerHTML='<section class="fc-panel bb-host" dir="rtl"></section>';const host=r.querySelector('.bb-host');global.AdineBroilerBenchmark.mount(host,id,null)}
function handler(e){const el=e.target?.closest?.('[data-fc-landing],[data-fc-landing-back]');if(!el||!active)return;e.preventDefault();e.stopImmediatePropagation();if(el.hasAttribute('data-fc-landing-back'))return showLanding();if(el.dataset.fcLanding==='benchmark')return showBenchmark();active=false;const ui=global.AdineBroilerFlockComparisonUI;if(ui?.start)ui.start();else{const r=root();if(r)r.innerHTML='<section class="fc-panel"><div class="fc-error">موتور مقایسه گله‌ها بارگذاری نشده است.</div></section>'}}
function top(e){const tab=e.target?.closest?.('.report-tab');if(!tab||tab.dataset.tab!=='compare-empty')return;e.preventDefault();e.stopImmediatePropagation();document.querySelectorAll('.report-tab').forEach(x=>x.classList.remove('active'));tab.classList.add('active');showLanding()}
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-fc-landing],[data-fc-landing-back]'))handler(e);else top(e)},true);
function sync(){const t=document.querySelector('.report-tab.active');if(t?.dataset.tab==='compare-empty'&&!active)showLanding()}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();global.AdineComparisonLanding={showLanding,showBenchmark}})(window);
