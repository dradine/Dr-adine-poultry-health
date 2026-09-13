/* ADINE BROILER PERFORMANCE INTELLIGENCE V1 — REPORT ADAPTER
 * Read-only adapter. It consumes existing report-router/model data and calls
 * the isolated PI engine. It does not replace or mutate canonical calculations.
 * UI is intentionally limited to the comprehensive broiler report tab.
 */
(function (global) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const n = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const x = Number(String(v).replace(/[٬,]/g, '').replace('٫', '.'));
    return Number.isFinite(x) ? x : null;
  };
  const fmt = (v, d = 1) => {
    const x = n(v);
    return x === null ? '—' : x.toLocaleString('fa-IR', { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  const pct = (v, d = 1) => {
    const x = n(v);
    return x === null ? '—' : fmt(x, d) + '٪';
  };
  const esc = (s) => String(s ?? '—').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  function latestModel() {
    const router = global.AdineReportRouter;
    if (!router) throw new Error('REPORT_ROUTER_UNAVAILABLE');
    const flockId = router.currentFlockId();
    if (!flockId) throw new Error('FLOCK_REQUIRED');
    return router.requireUser().then(() => Promise.all([
      router.getFlock(flockId),
      router.getWeeklyRecords(flockId)
    ])).then(([flock, raw]) => ({ flock, raw, model: router.buildModel(flock, raw) }));
  }

  function scoreGrowth(weight, target) {
    const A = global.AdineBroilerPerformanceIntelligence;
    return A ? A.normalizeHigher(n(weight) / 1000, n(target) / 1000) : null;
  }
  function scoreFcr(fcr, target) {
    const A = global.AdineBroilerPerformanceIntelligence;
    return A ? A.normalizeLower(fcr, target) : null;
  }
  function scoreUniformity(u10, u15) {
    const a = n(u10), b = n(u15);
    if (a === null && b === null) return null;
    const s10 = a === null ? null : Math.min(100, (a / 80) * 100);
    const s15 = b === null ? null : Math.min(100, (b / 90) * 100);
    return s10 === null ? s15 : b === null ? s10 : (s10 + s15) / 2;
  }

  function card(title, value, detail, state) {
    return `<article class="bpi-card ${state || ''}"><div class="bpi-card-title">${esc(title)}</div><div class="bpi-card-value">${value}</div><div class="bpi-card-detail">${esc(detail)}</div></article>`;
  }

  function statusForABPI(a) {
    if (!a || !a.available) return 'اطلاعات ناکافی';
    if (a.calibrationStatus === 'provisional') return 'شاخص آزمایشی';
    return 'قابل گزارش';
  }

  async function render() {
    const root = $('root');
    if (!root) return;
    document.getElementById('broiler-performance-intelligence-v1')?.remove();

    const ctx = await latestModel();
    if (ctx.model.type !== 'broiler' || !ctx.model.ready || !ctx.model.rows?.length) return;

    const A = global.AdineBroilerPerformanceIntelligence;
    if (!A) throw new Error('BROILER_PI_ENGINE_UNAVAILABLE');

    const rows = ctx.model.rows;
    const r = rows[rows.length - 1];
    const bwKg = n(r.weight) === null ? null : n(r.weight) / 1000;
    const liv = n(r.livability);
    const fcr = n(r.cumulativeFcr);
    const age = n(r.age);
    const epef = A.epef({ bodyWeightKg: bwKg, livabilityPct: liv, ageDays: age, fcr });
    const live = n(r.liveBirds);
    const processing = A.processing({ liveWeightKg: bwKg });
    const economics = A.economics({
      birdCount: live,
      liveWeightKg: bwKg,
      fcr,
      feedPricePerKg: null,
      livePricePerKg: null,
      carcassPricePerKg: null
    });

    const growthScore = scoreGrowth(r.weight, r.standardWeight);
    const fcrScore = scoreFcr(r.cumulativeFcr, r.standardCumulativeFcr);
    const livScore = liv === null ? null : Math.max(0, Math.min(100, liv));
    const uniScore = scoreUniformity(r.uniformity10, r.uniformity15);
    const abpi = A.abpi({ growthScore, fcrScore, livabilityScore: livScore, uniformityScore: uniScore });
    const benchmark = A.conditionalBenchmark(r.weight, [], 'body_weight');
    const health = A.healthPerformanceAssociation([], []);
    const market = A.marketOptimization({ candidates: [] });

    const epefText = epef.available ? fmt(epef.value, 1) : '—';
    const liveText = liv === null ? '—' : pct(liv, 2);
    const abpiText = abpi.available ? fmt(abpi.value, 1) : '—';

    const section = document.createElement('section');
    section.id = 'broiler-performance-intelligence-v1';
    section.className = 'section broiler-performance-intelligence-v1';
    section.innerHTML = `
      <div class="bpi-header">
        <div>
          <div class="eyebrow">Broiler Performance Intelligence V1</div>
          <h2>تحلیل هوشمند عملکرد گوشتی</h2>
          <p>این بخش فقط در گزارش جامع گله گوشتی فعال است و مقادیر واقعی را از مدل گزارش موجود می‌خواند؛ محاسبات اصلی و استانداردهای برنامه را جایگزین نمی‌کند.</p>
        </div>
        <div class="bpi-badge">${esc(statusForABPI(abpi))}</div>
      </div>
      <div class="bpi-grid">
        ${card('EPEF', epefText, epef.available ? 'محاسبه از وزن، ماندگاری، سن و FCR تجمعی' : 'برای محاسبه داده کافی نیست', epef.available ? 'good' : 'neutral')}
        ${card('ماندگاری', liveText, liv === null ? 'در رکورد انتخاب‌شده موجود نیست' : 'از داده ثبت‌شده گله', liv === null ? 'neutral' : 'good')}
        ${card('ABPI', abpiText, abpi.available ? `پوشش داده: ${pct((abpi.coverage || 0) * 100, 0)} — ${statusForABPI(abpi)}` : 'داده کافی برای امتیازدهی وجود ندارد', abpi.available ? 'watch' : 'neutral')}
        ${card('Processing Yield', processing.available ? pct(processing.carcassYieldPct, 2) : '—', processing.available ? 'بازده لاشه از داده کشتار اندازه‌گیری‌شده' : 'داده کشتار/لاشه ثبت نشده است؛ مقدار تخمینی ساخته نمی‌شود', processing.available ? 'good' : 'neutral')}
        ${card('Economics', economics.available && economics.revenuePerBird != null ? fmt(economics.marginPerBird, 0) : '—', economics.available ? 'اقتصاد جزئی؛ قیمت/هزینه کامل باید وارد شود' : 'داده قیمت/هزینه لازم موجود نیست', economics.available ? 'watch' : 'neutral')}
        ${card('Benchmark', benchmark.available ? `P${fmt(benchmark.percentile, 1)}` : '—', benchmark.available ? `N=${fmt(benchmark.n, 0)}` : 'بنچمارک جمعیتی بدون حداقل ۳۰ رکورد نمایش داده نمی‌شود', benchmark.available ? 'good' : 'neutral')}
        ${card('Health–Performance', health.available ? fmt(health.correlation, 3) : '—', health.available ? 'همبستگی زمانی؛ نه رابطه علّی' : 'سابقه کافی برای تحلیل ارتباط سلامت و عملکرد موجود نیست', health.available ? 'watch' : 'neutral')}
        ${card('Market Optimization', market.available && market.recommended ? `سن ${fmt(market.recommended.ageDays, 0)} روز` : '—', market.available ? 'مقایسه اقتصادی سن کشتار با داده‌های ارائه‌شده' : 'قیمت بازار/خوراک و سناریوهای کشتار موجود نیست', market.available ? 'watch' : 'neutral')}
      </div>
      <div class="bpi-note"><strong>مرزبندی:</strong> EPEF، ABPI و تحلیل‌های این بخش مشتق‌شده و تحلیلی‌اند. استاندارد رسمی، FCR، وزن، تلفات، CV و یکنواختیِ برنامه از مسیر canonical قبلی خوانده می‌شوند و این لایه آن‌ها را تغییر نمی‌دهد.</div>
    `;
    root.appendChild(section);
  }

  function isComprehensiveBroilerTab() {
    const active = document.querySelector('.report-tab.active');
    return active?.getAttribute('data-tab') === 'overall';
  }

  function schedule() {
    if (!isComprehensiveBroilerTab()) return;
    setTimeout(() => render().catch(e => console.error('[Adine BPI V1 adapter]', e)), 0);
  }

  document.addEventListener('click', e => {
    if (e.target.closest?.('.report-tab')) schedule();
  }, true);

  global.AdineBroilerPerformanceIntelligenceAdapterV1 = Object.freeze({ version: 'BPI-ADAPTER-V1', render });
})(window);
