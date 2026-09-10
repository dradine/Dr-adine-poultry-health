/* ADINE — Comparison landing screen V1
   The top-level comparison report intentionally shows only two large choices.
   The existing flock-comparison UI/engine remains untouched and is opened only
   after the user explicitly chooses "مقایسه گله‌ها".
*/
(function (global) {
  'use strict';

  let active = false;

  function root() { return document.getElementById('root'); }

  function showLanding() {
    const r = root();
    if (!r) return;
    active = true;
    r.classList.remove('is-compare-empty');
    r.innerHTML = `
      <section class="fc-landing" dir="rtl" aria-label="گزارش مقایسه‌ای">
        <div class="fc-landing-heading">
          <h2>گزارش مقایسه‌ای</h2>
          <p>نوع مقایسه را انتخاب کنید</p>
        </div>
        <div class="fc-landing-grid">
          <button type="button" class="fc-landing-card fc-landing-flocks" data-fc-landing="flocks">
            <span class="fc-landing-icon" aria-hidden="true">⇄</span>
            <strong>مقایسه گله‌ها</strong>
            <span>مقایسه عملکرد دو یا سه گله در سنین مشترک</span>
          </button>
          <button type="button" class="fc-landing-card fc-landing-benchmark" data-fc-landing="benchmark">
            <span class="fc-landing-icon" aria-hidden="true">◎</span>
            <strong>مقایسه با معیار مرجع</strong>
            <span>مقایسه عملکرد گله با شاخص‌ها و اهداف مرجع</span>
          </button>
        </div>
      </section>`;
  }

  function showBenchmark() {
    const r = root();
    if (!r) return;
    r.innerHTML = `
      <section class="fc-panel" dir="rtl">
        <div class="fc-panel-head">
          <button type="button" class="fc-back" data-fc-landing-back>← بازگشت</button>
          <div><h2>مقایسه با معیار مرجع</h2><p class="fc-muted">موتور مستقل Benchmark در مرحله بعد به این بخش متصل می‌شود.</p></div>
        </div>
        <div class="fc-coming"><h3>این بخش آماده اتصال به موتور Benchmark است.</h3><p>استانداردهای رسمی، اهداف مدیریتی و سایر معیارهای مرجع در این بخش قرار خواهند گرفت.</p></div>
      </section>`;
  }

  function click(e) {
    const card = e.target.closest && e.target.closest('[data-fc-landing]');
    if (card && active) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (card.dataset.fcLanding === 'benchmark') showBenchmark();
      else {
        active = false;
        if (global.AdineBroilerFlockComparisonUI && typeof global.AdineBroilerFlockComparisonUI.start === 'function') {
          global.AdineBroilerFlockComparisonUI.start();
        } else {
          const r = root();
          if (r) r.innerHTML = '<section class="fc-panel"><div class="fc-error">موتور مقایسه گله‌ها هنوز بارگذاری نشده است.</div></section>';
        }
      }
      return;
    }
    if (e.target.closest && e.target.closest('[data-fc-landing-back]') && active) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showLanding();
    }
  }

  function activate(e) {
    const tab = e.target && e.target.closest && e.target.closest('.report-tab');
    if (!tab || tab.dataset.tab !== 'compare-empty') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    document.querySelectorAll('.report-tab').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    showLanding();
  }

  document.addEventListener('click', click, true);
  document.addEventListener('click', activate, true);

  // If reports.js selected the comparison tab before this script receives the click,
  // keep the landing screen authoritative without touching weekly/comprehensive.
  function sync() {
    const tab = document.querySelector('.report-tab.active');
    if (tab && tab.dataset.tab === 'compare-empty' && !active) showLanding();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync);
  else sync();
})(window);
