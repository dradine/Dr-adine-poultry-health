/* ADINE BROILER PERFORMANCE INTELLIGENCE V1 — REPORT ADAPTER
 * Read-only adapter. Consumes canonical report data and the existing peer
 * benchmark RPC. It never replaces canonical calculations or writes data.
 */
(function (global) {
  'use strict';
  const $ = id => document.getElementById(id);
  const n = v => { if (v === null || v === undefined || v === '') return null; const x = Number(String(v).replace(/[٬,]/g, '').replace('٫', '.')); return Number.isFinite(x) ? x : null; };
  const fmt = (v, d = 1) => { const x = n(v); return x === null ? '—' : x.toLocaleString('fa-IR', { minimumFractionDigits:d, maximumFractionDigits:d }); };
  const pct = (v, d = 1) => { const x = n(v); return x === null ? '—' : fmt(x, d) + '٪'; };
  const esc = s => String(s ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let rendering = false;
  let observerStarted = false;

  async function loadContext() {
    const router = global.AdineReportRouter;
    if (!router) throw new Error('REPORT_ROUTER_UNAVAILABLE');
    const flockId = router.currentFlockId();
    if (!flockId) throw new Error('FLOCK_REQUIRED');
    await router.requireUser();
    const [flock, raw] = await Promise.all([router.getFlock(flockId), router.getWeeklyRecords(flockId)]);
    let placed = null;
    const client = global.supabaseClient;
    if (client) {
      const { data } = await client.from('flocks').select('initial_bird_count').eq('id', flockId).maybeSingle();
      placed = n(data?.initial_bird_count);
    }
    return { flock, raw, placed, flockId, model: router.buildModel(flock, raw) };
  }

  async function loadPeerBenchmark(flockId, ageDays) {
    const client = global.supabaseClient;
    if (!client) return null;
    try {
      const { data, error } = await client.rpc('get_broiler_benchmark_v1', { p_flock_id: flockId, p_age_days: ageDays ?? null, p_age_window_days: 3, p_recent_limit: 30 });
      return error || !data?.ok ? null : data;
    } catch (_) { return null; }
  }

  function scoreGrowth(weight, target) { const A=global.AdineBroilerPerformanceIntelligence; return A?A.normalizeHigher(n(weight)/1000,n(target)/1000):null; }
  function scoreFcr(fcr, target) { const A=global.AdineBroilerPerformanceIntelligence; return A?A.normalizeLower(fcr,target):null; }
  function scoreUniformity(u10,u15) { const a=n(u10),b=n(u15); if(a===null&&b===null)return null; const s10=a===null?null:Math.min(100,(a/80)*100),s15=b===null?null:Math.min(100,(b/90)*100); return s10===null?s15:b===null?s10:(s10+s15)/2; }
  function card(title,value,detail,state) { return `<article class="bpi-card ${state||''}"><div class="bpi-card-title">${esc(title)}</div><div class="bpi-card-value">${value}</div><div class="bpi-card-detail">${esc(detail)}</div></article>`; }
  function statusForABPI(a) { if(!a||!a.available)return 'اطلاعات ناکافی'; return a.calibrationStatus==='provisional'?'شاخص آزمایشی':'قابل گزارش'; }

  function makeShell(root) {
    if (root.querySelector('#broiler-performance-intelligence-v1-shell')) return root.querySelector('#broiler-performance-intelligence-v1-shell');
    const existing = Array.from(root.childNodes);
    const shell = document.createElement('div');
    shell.id = 'broiler-performance-intelligence-v1-shell';
    shell.className = 'bpi-tabs-shell';
    const tabs = document.createElement('div');
    tabs.className = 'bpi-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = '<button type="button" class="bpi-tab active" data-bpi-tab="overall" role="tab" aria-selected="true">تحلیل جامع عملکرد</button><button type="button" class="bpi-tab" data-bpi-tab="intelligence" role="tab" aria-selected="false">هوش عملکرد گله</button>';
    const overall = document.createElement('div');
    overall.className = 'bpi-panel active';
    overall.dataset.bpiPanel = 'overall';
    existing.forEach(node => overall.appendChild(node));
    const intelligence = document.createElement('div');
    intelligence.className = 'bpi-panel';
    intelligence.dataset.bpiPanel = 'intelligence';
    intelligence.innerHTML = '<section class="section broiler-performance-intelligence-v1"><div class="empty">در حال آماده‌سازی هوش عملکرد گله…</div></section>';
    shell.appendChild(tabs);
    shell.appendChild(overall);
    shell.appendChild(intelligence);
    root.appendChild(shell);
    return shell;
  }

  function setBpiTab(shell, name) {
    shell.querySelectorAll('.bpi-tab').forEach(btn => {
      const active = btn.dataset.bpiTab === name;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    shell.querySelectorAll('.bpi-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.bpiPanel === name));
  }

  async function render() {
    if (rendering) return;
    const root=$('root'); if(!root)return;
    rendering = true;
    try {
      const ctx=await loadContext();
      if(ctx.model.type!=='broiler'||!ctx.model.ready||!ctx.model.rows?.length)return;
      const A=global.AdineBroilerPerformanceIntelligence; if(!A)throw new Error('BROILER_PI_ENGINE_UNAVAILABLE');
      const shell=makeShell(root);
      const panel=shell.querySelector('[data-bpi-panel="intelligence"]');
      panel.innerHTML='<section class="section broiler-performance-intelligence-v1"><div class="empty">در حال محاسبه شاخص‌های هوش عملکرد گله…</div></section>';
      const rows=ctx.model.rows,r=rows[rows.length-1],bwKg=n(r.weight)===null?null:n(r.weight)/1000;
      const live=n(r.liveBirds),placed=n(ctx.placed),canonicalLiv=n(r.raw?.livability);
      const liv=canonicalLiv!==null?Math.max(0,Math.min(100,canonicalLiv)):(placed!==null&&placed>0&&live!==null?Math.max(0,Math.min(100,(live/placed)*100)):null);
      const fcr=n(r.cumulativeFcr),age=n(r.age);
      const peerBenchmark=await loadPeerBenchmark(ctx.flockId,age);
      const epef=A.epef({bodyWeightKg:bwKg,livabilityPct:liv,ageDays:age,fcr});
      const processing=A.processing({liveWeightKg:bwKg});
      const economics=A.economics({birdCount:live,liveWeightKg:bwKg,fcr,feedPricePerKg:null,livePricePerKg:null,carcassPricePerKg:null});
      const growthScore=scoreGrowth(r.weight,r.standardWeight),fcrScore=scoreFcr(r.cumulativeFcr,r.standardCumulativeFcr),livScore=liv===null?null:liv,uniScore=scoreUniformity(r.uniformity10,r.uniformity15);
      const abpi=A.abpi({growthScore,fcrScore,livabilityScore:livScore,uniformityScore:uniScore});
      const health=A.healthPerformanceAssociation([],[]),market=A.marketOptimization({candidates:[]});
      const cohortKey=peerBenchmark?.default_cohort||'all';
      const cohort=(peerBenchmark?.cohorts||[]).find(c=>c.key===cohortKey)||(peerBenchmark?.cohorts||[]).find(c=>c.key==='all')||(peerBenchmark?.cohorts||[])[0];
      const bm=cohort?.metrics?.body_weight;
      const benchmark=bm&&n(bm.percentile)!==null&&n(bm.n)>=10?{available:true,percentile:n(bm.percentile),n:n(bm.n),label:cohort.label||'جامعه همتا'}:{available:false,n:n(bm?.n)};
      const section=document.createElement('section'); section.id='broiler-performance-intelligence-v1'; section.className='section broiler-performance-intelligence-v1';
      section.innerHTML=`<div class="bpi-header"><div><div class="eyebrow">Broiler Performance Intelligence V1</div><h2>هوش عملکرد گله</h2><p>این لایه فقط در گزارش جامع گوشتی فعال است و داده‌های canonical گزارش را می‌خواند؛ هیچ محاسبه اصلی یا استاندارد برنامه را جایگزین نمی‌کند.</p></div><div class="bpi-badge">${esc(statusForABPI(abpi))}</div></div><div class="bpi-grid">
        ${card('EPEF',epef.available?fmt(epef.value,1):'—',epef.available?'وزن، زنده‌مانی، سن و FCR تجمعی':'وزن، زنده‌مانی، سن یا FCR تجمعی کافی نیست',epef.available?'good':'neutral')}
        ${card('زنده‌مانی',liv===null?'—':pct(liv,2),liv===null?'درصد زنده‌مانی معتبر موجود نیست':canonicalLiv!==null?'از مقدار canonical ثبت هفتگی':'از تعداد اولیه و پرندگان زنده',liv===null?'neutral':'good')}
        ${card('ABPI',abpi.available?fmt(abpi.value,1):'—',abpi.available?`پوشش داده: ${pct((abpi.coverage||0)*100,0)} — ${statusForABPI(abpi)}`:'داده کافی برای امتیازدهی وجود ندارد',abpi.available?'watch':'neutral')}
        ${card('Processing Yield',processing.available?pct(processing.carcassYieldPct,2):'—',processing.available?'بازده لاشه اندازه‌گیری‌شده':'داده کشتار/وزن لاشه موجود نیست؛ برآورد فرضی ساخته نمی‌شود',processing.available?'good':'neutral')}
        ${card('Economics',economics.available&&economics.revenuePerBird!=null?fmt(economics.marginPerBird,0):'—',economics.available?'اقتصاد جزئی بر اساس ورودی‌های واقعی':'برای تحلیل اقتصادی قیمت خوراک/فروش و هزینه‌ها لازم است',economics.available?'watch':'neutral')}
        ${card('Benchmark',benchmark.available?`P${fmt(benchmark.percentile,1)}`:'—',benchmark.available?`${benchmark.label} · N=${fmt(benchmark.n,0)}`:'جامعه همتای معتبر برای این سن در دسترس نیست',benchmark.available?'good':'neutral')}
        ${card('Health–Performance',health.available?fmt(health.correlation,3):'—',health.available?'همبستگی زمانی؛ نه رابطه علّی':'سابقه سلامت و عملکرد برای تحلیل کافی نیست',health.available?'watch':'neutral')}
        ${card('Market Optimization',market.available&&market.recommended?`سن ${fmt(market.recommended.ageDays,0)} روز`:'—',market.available?'مقایسه اقتصادی سناریوهای ارائه‌شده':'سناریوهای وزن/خوراک/قیمت برای بهینه‌سازی موجود نیست',market.available?'watch':'neutral')}
      </div><div class="bpi-note"><strong>مرزبندی:</strong> EPEF و ABPI شاخص‌های تحلیلی این لایه‌اند. Benchmark از سرویس Benchmark موجود پروژه خوانده می‌شود. استاندارد رسمی، FCR، وزن، تلفات، CV و یکنواختی از مسیر canonical قبلی می‌آیند و این لایه آن‌ها را تغییر نمی‌دهد.</div>`;
      panel.replaceChildren(section);
    } catch (e) {
      console.error('[Adine BPI V1 adapter]', e);
      const root=$('root');
      if(root && isComprehensiveBroilerTab()) {
        const shell=makeShell(root);
        const panel=shell.querySelector('[data-bpi-panel="intelligence"]');
        if(panel) panel.innerHTML='<section class="section broiler-performance-intelligence-v1"><div class="error">هوش عملکرد گله فعلاً قابل بارگذاری نیست. گزارش جامع عملکرد بدون تغییر در دسترس است.</div></section>';
      }
    } finally {
      rendering = false;
    }
  }

  function isComprehensiveBroilerTab(){const active=document.querySelector('.report-tab.active');return active?.getAttribute('data-tab')==='overall';}
  function schedule(){if(!isComprehensiveBroilerTab()||rendering)return;setTimeout(()=>render().catch(e=>console.error('[Adine BPI V1 adapter]',e)),0);}

  document.addEventListener('click',e=>{
    const reportTab=e.target.closest?.('.report-tab');
    if(reportTab){schedule();return;}
    const bpiTab=e.target.closest?.('.bpi-tab');
    if(bpiTab){const shell=bpiTab.closest('.bpi-tabs-shell');if(shell)setBpiTab(shell,bpiTab.dataset.bpiTab);}
  },true);

  function startObserver(){
    if(observerStarted)return;
    const root=$('root');
    if(!root||typeof MutationObserver==='undefined')return;
    observerStarted=true;
    const observer=new MutationObserver(()=>{ if(!rendering && isComprehensiveBroilerTab() && !root.querySelector('#broiler-performance-intelligence-v1-shell')) schedule(); });
    observer.observe(root,{childList:true,subtree:true});
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  }

  document.addEventListener('DOMContentLoaded',()=>{startObserver();schedule();}, {once:true});
  setTimeout(()=>{startObserver();schedule();},0);
  global.AdineBroilerPerformanceIntelligenceAdapterV1=Object.freeze({version:'BPI-ADAPTER-V1',render});
})(window);
