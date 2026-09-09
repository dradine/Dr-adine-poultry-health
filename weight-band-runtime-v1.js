/* ADINE POULTRY HEALTH — WEIGHT BAND RUNTIME V2.1
   Additive integration only.
   Does not replace or modify weekly calculations, FCR, standards,
   navigation, layout, or existing save logic.

   Fixes:
   - robust flock/production-type resolution
   - robust Mean/CV bridge to existing weekly statistics
   - waits for official broiler registry before first calculation
   - recalculates after flock/week/weight changes
   - preserves official target values and Adine management rules
*/
(function () {
  "use strict";

  const ENGINE = () => window.AdineWeightBandEngine;
  const state = { bound: false, lastResult: null, registryPromise: null };
  const MANAGEMENT_TOLERANCE = 10;

  function num(v) {
    if (v === null || v === undefined || v === "") return null;
    const s = String(v)
      .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[٬,]/g, "")
      .replace("٫", ".")
      .trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function fa(v, d = 0) {
    const n = num(v);
    return n === null ? "—" : n.toLocaleString("fa-IR", { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function pct(v, d = 1) {
    const n = num(v);
    return n === null ? "—" : n.toLocaleString("fa-IR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "٪";
  }

  function getWeightsSafe() {
    if (typeof getWeights === "function") {
      try {
        const w = getWeights();
        if (Array.isArray(w)) return w.map(num).filter(v => Number.isFinite(v) && v > 0);
      } catch (_) {}
    }
    return Array.from(document.querySelectorAll("#weightsContainer .bird-weight"))
      .map(e => num(e.value)).filter(v => Number.isFinite(v) && v > 0);
  }

  function getStatsSafe(weights) {
    try {
      if (typeof calculateWeightStatistics === "function" && weights.length >= 2) {
        const s = calculateWeightStatistics(weights);
        if (s) {
          const mean = num(s.mean ?? s.average ?? s.avg ?? s.meanWeight ?? s.averageWeight);
          const cv = num(s.cv ?? s.CV ?? s.cvPercent ?? s.coefficientOfVariation);
          if (mean !== null && cv !== null) return { mean, cv };
        }
      }
    } catch (e) {
      console.warn("Adine Weight Band statistics bridge:", e);
    }
    if (weights.length < 2) return null;
    const mean = weights.reduce((a, b) => a + b, 0) / weights.length;
    const variance = weights.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / weights.length;
    const sd = Math.sqrt(variance);
    return mean > 0 ? { mean, cv: sd * 100 / mean } : null;
  }

  function getWeek() {
    const ids = ["weekNumber", "productionWeek", "week"];
    for (const id of ids) {
      const n = num(document.getElementById(id)?.value);
      if (n !== null && n > 0) return Math.round(n);
    }
    return null;
  }

  function getFlock() {
    try {
      if (typeof currentFlock !== "undefined" && currentFlock) return currentFlock;
    } catch (_) {}
    return window.currentFlockForSpecialized || window.currentFlock || null;
  }

  function flockProductionType(f) {
    return String(f?.production_type ?? f?.productionType ?? f?.type ?? f?.production ?? "")
      .trim().toLowerCase();
  }

  function isBroiler(f) {
    const t = flockProductionType(f);
    if (["broiler", "broilers", "گوشتی", "جوجه گوشتی", "meat", "meat chicken"].includes(t)) return true;
    /* If the production type is absent/legacy, a selectable official broiler strain is
       sufficient evidence for this additive module; non-broiler calculations are untouched. */
    const strain = String(f?.strain ?? f?.flockStrain ?? f?.strain_name ?? "").trim();
    const genetics = String(f?.genetics ?? "").trim();
    const known = [
      "Ross 308", "Ross 308 FF", "Ross 708", "Ross 308 AP",
      "Cobb500", "Cobb800", "Arbor Acres Plus", "Arbor Acres Plus S",
      "Indian River", "Indian River FF", "Efficiency Plus", "Hubbard EDGE", "Arian"
    ];
    return known.includes(strain) || known.includes(genetics);
  }

  function getStrainCandidates(f) {
    return [
      f?.strain,
      f?.flockStrain,
      f?.strain_name,
      f?.genetics,
      f?.genetics_name
    ].map(v => String(v ?? "").trim()).filter(Boolean);
  }

  function loadOfficialRegistry() {
    if (typeof window.getBroilerOfficialStandard === "function") return Promise.resolve(true);
    if (state.registryPromise) return state.registryPromise;

    state.registryPromise = new Promise(resolve => {
      const existing = document.querySelector('script[data-adine-official-broiler="1"]');
      if (existing) {
        if (typeof window.getBroilerOfficialStandard === "function") return resolve(true);
        existing.addEventListener("load", () => resolve(typeof window.getBroilerOfficialStandard === "function"), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = "broiler-official-standards-v1.js?v=20260907.1";
      s.async = false;
      s.dataset.adineOfficialBroiler = "1";
      s.onload = () => resolve(typeof window.getBroilerOfficialStandard === "function");
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
    return state.registryPromise;
  }

  function officialTarget(f, week) {
    if (!f || !isBroiler(f) || !week || typeof window.getBroilerOfficialStandard !== "function") return null;
    const ageDays = week * 7;
    for (const key of getStrainCandidates(f)) {
      try {
        const registry = window.getBroilerOfficialStandard(key);
        const hit = (registry?.records || []).find(x => Array.isArray(x) && Number(x[0]) === ageDays);
        if (hit && num(hit[1]) !== null && num(hit[1]) > 0) {
          return {
            weight: num(hit[1]),
            source: registry.sourceLabel || "استاندارد رسمی سویه",
            ageDays,
            strain: key,
            sourceType: registry.sourceType || "official-performance-objective"
          };
        }
      } catch (e) {
        console.warn("Adine official target lookup:", e);
      }
    }
    return null;
  }

  function customBand() {
    const l = num(document.getElementById("awbProcessingLower")?.value);
    const u = num(document.getElementById("awbProcessingUpper")?.value);
    return l !== null && u !== null && l > 0 && u > 0 && l <= u ? { lower: l, upper: u } : null;
  }

  function calculate() {
    const e = ENGINE();
    const w = getWeightsSafe();
    const s = getStatsSafe(w);
    const f = getFlock();
    const wk = getWeek();
    if (!e || !s || w.length < 2 || !isBroiler(f)) return null;

    const target = officialTarget(f, wk);
    const p = customBand();
    return e.calculate({
      weights: w,
      mean: s.mean,
      cv: s.cv,
      officialTargetWeight: target?.weight ?? null,
      managementTolerance: MANAGEMENT_TOLERANCE,
      processingLower: p?.lower ?? null,
      processingUpper: p?.upper ?? null,
      flockSize: num(document.getElementById("liveBirds")?.value)
    });
  }

  function ensure() {
    const c = document.getElementById("weightsContainer");
    if (!c) return false;
    if (document.getElementById("adineWeightBandSection")) return true;

    const sec = document.createElement("section");
    sec.id = "adineWeightBandSection";
    sec.className = "adine-weight-band";
    sec.innerHTML = `
      <div class="awb-head"><div><h3>تحلیل محدوده وزنی آدینه</h3>
      <p id="awbSub" class="awb-sub">برای گله گوشتی، وزن هدف رسمی سویه و محدوده مدیریتی مستقل از حداقل/حداکثر نمونه محاسبه می‌شوند.</p></div></div>
      <div class="awb-grid">
        <div class="awb-box"><div class="awb-label">وزن هدف رسمی سویه</div><div id="awbTarget" class="awb-value">—</div></div>
        <div class="awb-box"><div class="awb-label">محدوده مدیریتی آدینه ±۱۰٪</div><div id="awbMgmt10" class="awb-value">—</div></div>
        <div class="awb-box"><div class="awb-label">درصد برآوردی گله در ±۱۰٪</div><div id="awbMgmt10Pct" class="awb-value">—</div></div>
      </div>
      <div class="awb-grid" style="margin-top:10px">
        <div class="awb-box"><div class="awb-label">درصد مشاهده‌شده نمونه در ±۱۰٪</div><div id="awbMgmt10Obs" class="awb-value">—</div></div>
        <div class="awb-box"><div class="awb-label">محدوده توسعه‌یافته ±۱۵٪</div><div id="awbMgmt15" class="awb-value">—</div></div>
        <div class="awb-box"><div class="awb-label">درصد برآوردی گله در ±۱۵٪</div><div id="awbMgmt15Pct" class="awb-value">—</div></div>
      </div>
      <div class="awb-section-title">🏭 محدوده هدف کشتارگاه / فرآوری</div>
      <div class="awb-inputs">
        <div><label for="awbProcessingLower">حد پایین (گرم)</label><input id="awbProcessingLower" type="text" inputmode="decimal" placeholder="مثلاً ۱۹۰۰"></div>
        <div><label for="awbProcessingUpper">حد بالا (گرم)</label><input id="awbProcessingUpper" type="text" inputmode="decimal" placeholder="مثلاً ۲۱۰۰"></div>
      </div>
      <p class="awb-help">این محدوده مستقل از استاندارد سویه است و برای نیاز واقعی کشتارگاه/بازار وارد می‌شود. از هفته پنجم به بعد برای برنامه‌ریزی کشتار کاربرد ویژه دارد.</p>
      <div class="awb-grid" style="margin-top:10px">
        <div class="awb-box"><div class="awb-label">محدوده کشتارگاه</div><div id="awbProcessingBand" class="awb-value">—</div></div>
        <div class="awb-box"><div class="awb-label">درصد برآوردی گله در محدوده کشتار</div><div id="awbProcessingPct" class="awb-value">—</div></div>
        <div class="awb-box"><div class="awb-label">تعداد برآوردی گله در محدوده کشتار</div><div id="awbProcessingCount" class="awb-value">—</div></div>
      </div>
      <p class="awb-note">منطق آماری با روش تک‌جمعیتی UniPlus هم‌راستا است: درصد برآوردی با توزیع نرمال و با استفاده از میانگین و CV واقعی محاسبه می‌شود. ±۱۰٪ و ±۱۵٪ در این صفحه قواعد مدیریتی آدینه‌اند و استاندارد رسمی سویه محسوب نمی‌شوند. حداقل و حداکثر وزن نمونه هرگز به‌عنوان محدوده هدف استفاده نمی‌شوند.</p>`;
    c.insertAdjacentElement("afterend", sec);
    ["awbProcessingLower", "awbProcessingUpper"].forEach(id => document.getElementById(id)?.addEventListener("input", sync));
    return true;
  }

  function styles() {
    if (document.getElementById("adine-weight-band-style-v2")) return;
    const s = document.createElement("style");
    s.id = "adine-weight-band-style-v2";
    s.textContent = `.adine-weight-band{margin-top:16px;border:1px solid rgba(15,23,42,.10);border-radius:16px;padding:16px;background:#fff;box-shadow:0 4px 16px rgba(15,23,42,.05)}.adine-weight-band .awb-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.adine-weight-band h3{margin:0;font-size:16px}.adine-weight-band .awb-sub{margin:5px 0 0;font-size:12px;opacity:.72;line-height:1.9}.adine-weight-band .awb-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.adine-weight-band .awb-box{border:1px solid rgba(15,23,42,.08);border-radius:12px;padding:11px;min-height:62px}.adine-weight-band .awb-label{font-size:11px;opacity:.68}.adine-weight-band .awb-value{font-size:18px;font-weight:800;margin-top:5px}.adine-weight-band .awb-section-title{font-size:13px;font-weight:800;margin:15px 0 8px}.adine-weight-band .awb-inputs{display:grid;grid-template-columns:1fr 1fr;gap:10px}.adine-weight-band .awb-inputs label{font-size:11px;opacity:.72;display:block;margin-bottom:5px}.adine-weight-band .awb-inputs input{margin:0}.adine-weight-band .awb-help,.adine-weight-band .awb-note{font-size:11px;line-height:2;opacity:.72;margin:8px 0 0}@media(max-width:680px){.adine-weight-band .awb-grid{grid-template-columns:1fr}.adine-weight-band .awb-head{display:block}.adine-weight-band .awb-inputs{grid-template-columns:1fr}}`;
    document.head.appendChild(s);
  }

  function bandText(b) { return b ? `${fa(b.lower, 1)} تا ${fa(b.upper, 1)} گرم` : "—"; }

  function render(r) {
    if (!ensure()) return;
    const ids = ["awbTarget", "awbMgmt10", "awbMgmt10Pct", "awbMgmt10Obs", "awbMgmt15", "awbMgmt15Pct", "awbProcessingBand", "awbProcessingPct", "awbProcessingCount"];
    if (!r || !r.ok) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = "—"; }); return; }

    const target = r.officialTargetWeight;
    document.getElementById("awbTarget").textContent = target == null ? "استاندارد رسمی برای این سن/سویه یافت نشد" : fa(target) + " گرم";
    document.getElementById("awbMgmt10").textContent = bandText(r.managementBand);
    document.getElementById("awbMgmt10Pct").textContent = pct(r.management?.predictedPercent);
    document.getElementById("awbMgmt10Obs").textContent = pct(r.management?.observedPercent);

    const b15 = target == null ? null : ENGINE().makeBand(target, 15);
    const a15 = b15 ? ENGINE().analyseBand({ weights: getWeightsSafe(), lower: b15.lower, upper: b15.upper, mean: r.mean, cv: r.cv, flockSize: r.flockSize }) : null;
    document.getElementById("awbMgmt15").textContent = bandText(b15);
    document.getElementById("awbMgmt15Pct").textContent = pct(a15?.predictedPercent);

    if (r.processing) {
      document.getElementById("awbProcessingBand").textContent = bandText(r.processing);
      document.getElementById("awbProcessingPct").textContent = pct(r.processing.predictedPercent);
      document.getElementById("awbProcessingCount").textContent = r.processing.estimatedFlockCount == null ? "—" : fa(r.processing.estimatedFlockCount) + " قطعه";
    } else {
      document.getElementById("awbProcessingBand").textContent = "وارد نشده";
      document.getElementById("awbProcessingPct").textContent = "—";
      document.getElementById("awbProcessingCount").textContent = "—";
    }

    const wk = getWeek();
    const sub = document.getElementById("awbSub");
    if (sub) sub.textContent = target == null
      ? `هفته ${fa(wk)} — برای این سن/سویه وزن هدف رسمی در رجیستری موجود نیست؛ محدوده هدف خودکار ساخته نشد.`
      : `هفته ${fa(wk)} — وزن هدف رسمی سویه ${fa(target)} گرم؛ محدوده مدیریتی آدینه بر پایه ±۱۰٪ از همین هدف ساخته شده است.`;
  }

  function sync() {
    const r = calculate();
    state.lastResult = r;
    render(r);
    return r;
  }

  function repairCore() {
    const card = document.getElementById("resultsCard");
    const res = document.getElementById("results");
    if (!card || !res) return;
    if (getComputedStyle(card).display === "none" && !res.children.length && typeof window.calculateWeekly === "function") {
      try { window.calculateWeekly(); } catch (e) { console.error("Weekly calculation fallback:", e); }
    }
    if (getComputedStyle(card).display === "none" && res.children.length) card.style.display = "block";
  }

  function bindWeekly() {
    if (state.bound) return true;
    const c = document.getElementById("weightsContainer");
    if (!c) return false;
    state.bound = true;

    c.addEventListener("input", () => { ensure(); sync(); });
    c.addEventListener("change", () => { ensure(); sync(); });

    document.addEventListener("click", event => {
      const el = event.target?.closest?.("button,input[type='button'],input[type='submit']");
      if (!el) return;
      const a = String(el.getAttribute("onclick") || "").replace(/\s/g, "");
      if (a.includes("calculateWeekly(")) {
        setTimeout(repairCore, 80);
        setTimeout(repairCore, 220);
        setTimeout(sync, 0);
        setTimeout(sync, 180);
        setTimeout(sync, 600);
      } else if (a.includes("saveWeeklyRecord(")) {
        setTimeout(() => persist(state.lastResult || sync()), 900);
      }
    });

    ["liveBirds", "weekNumber"].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.addEventListener("input", sync); el.addEventListener("change", sync); }
    });
    return true;
  }

  async function persist(r) {
    if (!r?.ok || !window.supabaseClient) return;
    const flockId = getFlock()?.id;
    if (!flockId) return;
    const dateEl = document.getElementById("evaluationDate");
    const rawDate = String(dateEl?.value || "").trim();
    if (!rawDate) return;
    let date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
    if (!date) { try { date = window.AdineDateSystem?.jalaliToISO?.(rawDate) || null; } catch (_) {} }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return;

    try {
      let q = await window.supabaseClient.from("weekly_records").select("id,production_metrics,updated_at").eq("flock_id", flockId).eq("evaluation_date", date).order("updated_at", { ascending: false }).limit(1);
      let row = q.data?.[0] || null;
      if (!row) {
        q = await window.supabaseClient.from("weekly_records").select("id,production_metrics,updated_at").eq("flock_id", flockId).eq("record_date", date).order("updated_at", { ascending: false }).limit(1);
        row = q.data?.[0] || null;
      }
      if (!row) return;
      const pm = row.production_metrics && typeof row.production_metrics === "object" ? row.production_metrics : {};
      const b15 = r.officialTargetWeight == null ? null : ENGINE().makeBand(r.officialTargetWeight, 15);
      const a15 = b15 ? ENGINE().analyseBand({ weights: getWeightsSafe(), lower: b15.lower, upper: b15.upper, mean: r.mean, cv: r.cv, flockSize: r.flockSize }) : null;
      const p = r.processing;
      const wb = {
        version: r.version,
        method: r.method,
        official_target_g: r.officialTargetWeight == null ? null : Number(r.officialTargetWeight),
        management_tolerance_percent: MANAGEMENT_TOLERANCE,
        management_lower_g: r.managementBand ? Number(r.managementBand.lower) : null,
        management_upper_g: r.managementBand ? Number(r.managementBand.upper) : null,
        management_predicted_percent: r.management?.predictedPercent == null ? null : Number(r.management.predictedPercent),
        management_observed_percent: r.management?.observedPercent == null ? null : Number(r.management.observedPercent),
        management15_lower_g: b15 ? Number(b15.lower) : null,
        management15_upper_g: b15 ? Number(b15.upper) : null,
        management15_predicted_percent: a15?.predictedPercent == null ? null : Number(a15.predictedPercent),
        processing_lower_g: p ? Number(p.lower) : null,
        processing_upper_g: p ? Number(p.upper) : null,
        processing_predicted_percent: p?.predictedPercent == null ? null : Number(p.predictedPercent),
        processing_observed_percent: p?.observedPercent == null ? null : Number(p.observedPercent),
        processing_estimated_flock_count: p?.estimatedFlockCount == null ? null : Number(p.estimatedFlockCount),
        mean_g: Number(r.mean), cv_percent: Number(r.cv), sd_g: Number(r.sd), sample_count: Number(r.sampleCount)
      };
      const { error } = await window.supabaseClient.from("weekly_records").update({ production_metrics: { ...pm, _weightBand: wb } }).eq("id", row.id).eq("flock_id", flockId);
      if (error) console.warn("Adine weight-band persistence error:", error);
    } catch (e) { console.warn("Adine weight-band persistence skipped:", e); }
  }

  async function reportRows() {
    if (!window.supabaseClient) return [];
    let id = new URLSearchParams(location.search).get("flockId") || new URLSearchParams(location.search).get("flock");
    if (!id) { try { id = JSON.parse(localStorage.getItem("adine_poultry_current_selection") || "{}").flockId; } catch (_) {} }
    if (!id) return [];
    const { data, error } = await window.supabaseClient.from("weekly_records").select("week_number,production_week,age_days,evaluation_date,record_date,production_metrics").eq("flock_id", id).order("age_days", { ascending: true });
    if (error || !Array.isArray(data)) return [];
    return data.map(r => {
      const b = r.production_metrics?._weightBand;
      return b && (Number.isFinite(Number(b.management_predicted_percent)) || Number.isFinite(Number(b.processing_predicted_percent))) ? { week: Number(r.week_number ?? r.production_week), band: b } : null;
    }).filter(Boolean);
  }

  async function renderReport() {
    const root = document.getElementById("root");
    const active = document.querySelector('.report-tab.active[data-tab="overall"]');
    if (!root || !active || document.getElementById("adineWeightBandReport")) return;
    const rows = await reportRows();
    if (!rows.length) return;
    const charts = root.querySelector(".charts");
    if (!charts || typeof Chart === "undefined") return;
    const box = document.createElement("div");
    box.id = "adineWeightBandReport";
    box.className = "chart-box wide adine-weight-band-report";
    box.innerHTML = '<h3>روند محدوده وزنی آدینه</h3><div class="chart-area"><canvas id="adineWeightBandTrend"></canvas></div>';
    charts.appendChild(box);
    const canvas = document.getElementById("adineWeightBandTrend");
    const ds = [];
    if (rows.some(r => Number.isFinite(Number(r.band.management_predicted_percent)))) ds.push({ label: "محدوده مدیریتی ±۱۰٪ — برآورد گله", data: rows.map(r => Number.isFinite(Number(r.band.management_predicted_percent)) ? Number(r.band.management_predicted_percent) : null), borderWidth: 2, pointRadius: 3, tension: .25, fill: false });
    if (rows.some(r => Number.isFinite(Number(r.band.processing_predicted_percent)))) ds.push({ label: "محدوده کشتارگاه — برآورد گله", data: rows.map(r => Number.isFinite(Number(r.band.processing_predicted_percent)) ? Number(r.band.processing_predicted_percent) : null), borderWidth: 2, pointRadius: 3, tension: .25, fill: false });
    new Chart(canvas, { type: "line", data: { labels: rows.map(r => `هفته ${fa(r.week)}`), datasets: ds }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + "٪" } } } } });
  }

  function boot() {
    styles();
    const run = () => {
      ensure();
      bindWeekly();
      /* Important: first calculate only after the official registry is ready. */
      loadOfficialRegistry().then(() => { sync(); }).catch(() => { sync(); });
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run, { once: true });
    } else if (!bindWeekly()) {
      let n = 0;
      const timer = setInterval(() => {
        if (bindWeekly() || ++n >= 120) {
          clearInterval(timer);
          run();
        }
      }, 100);
    } else {
      run();
    }

    const page = String(location.pathname || "").toLowerCase().split("/").pop();
    if (page === "reports.html" || page === "reports-v2.html") {
      const rr = () => setTimeout(renderReport, 900);
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", rr, { once: true }); else rr();
      setTimeout(renderReport, 1800);
    }
  }

  window.AdineWeightBandRuntime = { VERSION: "2.1.0", sync, calculate, resolveOfficialTarget: officialTarget };
  boot();
})();