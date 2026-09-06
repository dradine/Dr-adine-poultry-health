/* ADINE POULTRY HEALTH — WEIGHT BAND RUNTIME V1.2.1
   Safe additive integration.
   NEVER replaces calculateWeekly(), saveWeeklyRecord(), weekly-engine.js,
   FCR engines, standards, or existing calculation functions.
*/
(function () {
  "use strict";

  const ENGINE = () => window.AdineWeightBandEngine;
  const state = { bound: false, reportBound: false, lastResult: null };

  function num(v) {
    if (v === null || v === undefined || v === "") return null;
    const s = String(v)
      .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[٬,]/g, "")
      .replace("٫", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function fa(v, digits = 0) {
    const n = num(v);
    return n === null ? "—" : n.toLocaleString("fa-IR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function pct(v, digits = 1) {
    const n = num(v);
    return n === null ? "—" : n.toLocaleString("fa-IR", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + "٪";
  }

  function getSampleWeights() {
    return Array.from(document.querySelectorAll("#weightsContainer .bird-weight"))
      .map(el => num(el.value)).filter(v => Number.isFinite(v) && v > 0);
  }

  function getStats() {
    try {
      if (typeof getWeights !== "function" || typeof calculateWeightStatistics !== "function") return null;
      const ws = getWeights();
      if (!Array.isArray(ws) || ws.length < 2) return null;
      const s = calculateWeightStatistics(ws);
      if (!s || !Number.isFinite(Number(s.mean)) || !Number.isFinite(Number(s.cv))) return null;
      return { mean: Number(s.mean), cv: Number(s.cv) };
    } catch (e) {
      console.warn("Adine weight-band statistics bridge:", e);
      return null;
    }
  }

  function calculate() {
    const engine = ENGINE();
    const stats = getStats();
    const weights = getSampleWeights();
    if (!engine || !stats || weights.length < 2) return null;
    return engine.calculate({
      weights,
      mean: stats.mean,
      cv: stats.cv,
      flockSize: num(document.getElementById("liveBirds")?.value)
    });
  }

  function styles() {
    if (document.getElementById("adine-weight-band-style")) return;
    const s = document.createElement("style");
    s.id = "adine-weight-band-style";
    s.textContent = `
      .adine-weight-band{margin-top:16px;border:1px solid rgba(15,23,42,.10);border-radius:16px;padding:16px;background:#fff;box-shadow:0 4px 16px rgba(15,23,42,.05)}
      .adine-weight-band .awb-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}
      .adine-weight-band h3{margin:0;font-size:16px}.adine-weight-band .awb-sub{margin:5px 0 0;font-size:12px;opacity:.72;line-height:1.8}
      .adine-weight-band .awb-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .adine-weight-band .awb-box{border:1px solid rgba(15,23,42,.08);border-radius:12px;padding:11px;min-height:62px}
      .adine-weight-band .awb-label{font-size:11px;opacity:.68}.adine-weight-band .awb-value{font-size:18px;font-weight:800;margin-top:5px}
      .adine-weight-band .awb-note{margin:12px 0 0;font-size:11px;line-height:1.9;opacity:.72}
      .adine-weight-band-report{margin-top:14px}.adine-weight-band-report .chart-area{height:260px;position:relative}
      @media(max-width:680px){.adine-weight-band .awb-grid{grid-template-columns:1fr}.adine-weight-band .awb-head{display:block}}
    `;
    document.head.appendChild(s);
  }

  function ensureWeeklySection() {
    const c = document.getElementById("weightsContainer");
    if (!c) return false;
    if (document.getElementById("adineWeightBandSection")) return true;
    const section = document.createElement("section");
    section.id = "adineWeightBandSection";
    section.className = "adine-weight-band";
    section.innerHTML = `
      <div class="awb-head"><div><h3>سلامت طیور آدینه — تحلیل محدوده وزنی</h3><p class="awb-sub">محدوده هدف به‌صورت خودکار از حداقل و حداکثر وزن همین نمونه تعیین می‌شود.</p></div></div>
      <div class="awb-grid">
        <div class="awb-box"><div class="awb-label">حداقل محدوده نمونه (گرم)</div><div id="awbMin" class="awb-value">—</div></div>
        <div class="awb-box"><div class="awb-label">حداکثر محدوده نمونه (گرم)</div><div id="awbMax" class="awb-value">—</div></div>
        <div class="awb-box"><div class="awb-label">تحلیل آدینه — درصد برآوردی داخل محدوده</div><div id="awbPredicted" class="awb-value">—</div></div>
      </div>
      <div class="awb-grid" style="margin-top:10px">
        <div class="awb-box"><div class="awb-label">تعداد برآوردی در گله</div><div id="awbFlockCount" class="awb-value">—</div></div>
        <div class="awb-box"><div class="awb-label">میانگین وزن از موتور موجود</div><div id="awbMean" class="awb-value">—</div></div>
        <div class="awb-box"><div class="awb-label">CV از موتور موجود</div><div id="awbCv" class="awb-value">—</div></div>
      </div>
      <p class="awb-note">این تحلیل افزونه‌ای است و جایگزین CV، یکنواختی ±۱۰/±۱۵ یا استاندارد رسمی سویه نیست. درصد مشاهده‌شده نمونه از حداقل تا حداکثر با هر دو کران ۱۰۰٪ است؛ درصد برآوردی گله با CDF و کران پایین L&lt;X محاسبه می‌شود.</p>`;
    c.insertAdjacentElement("afterend", section);
    return true;
  }

  function renderWeekly(result) {
    if (!ensureWeeklySection()) return;
    const ids = ["awbMin","awbMax","awbPredicted","awbFlockCount","awbMean","awbCv"];
    if (!result || !result.ok) {
      ids.forEach(id => { const e = document.getElementById(id); if (e) e.textContent = "—"; });
      return;
    }
    document.getElementById("awbMin").textContent = fa(result.lower);
    document.getElementById("awbMax").textContent = fa(result.upper);
    document.getElementById("awbPredicted").textContent = pct(result.predictedPercent);
    document.getElementById("awbFlockCount").textContent = result.estimatedFlockCount === null ? "—" : fa(result.estimatedFlockCount) + " قطعه";
    document.getElementById("awbMean").textContent = fa(result.mean, 1) + " گرم";
    document.getElementById("awbCv").textContent = pct(result.cv, 2);
  }

  function sync() {
    const result = calculate();
    state.lastResult = result;
    renderWeekly(result);
    return result;
  }

  function repairCoreResultsIfNeeded() {
    const card = document.getElementById("resultsCard");
    const results = document.getElementById("results");
    if (!card || !results) return;

    const hidden = getComputedStyle(card).display === "none";
    const hasResults = results.children && results.children.length > 0;

    // If the original inline handler did not fire, retry the ORIGINAL function only.
    // No formulas are duplicated or replaced here.
    if (hidden && !hasResults && typeof window.calculateWeekly === "function") {
      try { window.calculateWeekly(); } catch (e) { console.error("Weekly calculation fallback:", e); }
    }

    // If calculation rendered correctly but a later chart/UI operation interrupted
    // before the original function could reveal the card, reveal the already-rendered results.
    if (getComputedStyle(card).display === "none" && results.children && results.children.length > 0) {
      card.style.display = "block";
    }
  }

  function isoDate() {
    const value = String(document.getElementById("evaluationDate")?.value || "").trim();
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    try {
      const iso = window.AdineDateSystem?.jalaliToISO?.(value);
      return /^\d{4}-\d{2}-\d{2}$/.test(String(iso || "")) ? iso : null;
    } catch (_) { return null; }
  }

  async function persist(result) {
    if (!result?.ok || !window.supabaseClient) return;
    const flockId = window.currentFlock?.id || window.currentFlockForSpecialized?.id;
    const date = isoDate();
    if (!flockId || !date) return;
    try {
      let row = null;
      const q1 = await window.supabaseClient.from("weekly_records").select("id,production_metrics,updated_at").eq("flock_id",flockId).eq("evaluation_date",date).order("updated_at",{ascending:false}).limit(1);
      row = q1.data?.[0] || null;
      if (!row) {
        const q2 = await window.supabaseClient.from("weekly_records").select("id,production_metrics,updated_at").eq("flock_id",flockId).eq("record_date",date).order("updated_at",{ascending:false}).limit(1);
        row = q2.data?.[0] || null;
      }
      if (!row) return;
      const pm = row.production_metrics && typeof row.production_metrics === "object" ? row.production_metrics : {};
      const band = {version:result.version,method:result.method,lower_g:Number(result.lower),upper_g:Number(result.upper),mean_g:Number(result.mean),cv_percent:Number(result.cv),sd_g:Number(result.sd),predicted_percent:Number(result.predictedPercent),estimated_flock_count:result.estimatedFlockCount===null?null:Number(result.estimatedFlockCount),sample_count:Number(result.sampleCount),observed_percent:Number(result.observedPercent),observed_count:Number(result.observedCount)};
      const {error} = await window.supabaseClient.from("weekly_records").update({production_metrics:{...pm,_weightBand:band}}).eq("id",row.id).eq("flock_id",flockId);
      if (error) console.warn("Adine weight-band persistence error:",error);
    } catch(e) { console.warn("Adine weight-band persistence skipped:",e); }
  }

  function bindWeekly() {
    if (state.bound) return true;
    const c = document.getElementById("weightsContainer");
    if (!c) return false;
    state.bound = true;
    c.addEventListener("input", () => { ensureWeeklySection(); sync(); });
    c.addEventListener("change", () => { ensureWeeklySection(); sync(); });
    document.addEventListener("click", event => {
      const el = event.target?.closest?.("button,input[type='button'],input[type='submit']");
      if (!el) return;
      const action = String(el.getAttribute("onclick") || "").replace(/\s/g, "");
      if (action.includes("calculateWeekly(")) {
        setTimeout(repairCoreResultsIfNeeded, 80);
        setTimeout(repairCoreResultsIfNeeded, 220);
        setTimeout(sync, 0);
        setTimeout(sync, 150);
      } else if (action.includes("saveWeeklyRecord(")) {
        const result = state.lastResult || sync();
        setTimeout(() => persist(result || calculate()),900);
      }
    });
    const live = document.getElementById("liveBirds");
    if (live) live.addEventListener("input", sync);
    sync();
    return true;
  }

  async function reportRows() {
    if (!window.supabaseClient) return [];
    let flockId = new URLSearchParams(location.search).get("flockId");
    if (!flockId) flockId = new URLSearchParams(location.search).get("flock");
    if (!flockId) { try { flockId = JSON.parse(localStorage.getItem("adine_poultry_current_selection")||"{}").flockId; } catch(_){} }
    if (!flockId) return [];
    const {data,error} = await window.supabaseClient.from("weekly_records").select("week_number,production_week,age_days,evaluation_date,record_date,production_metrics").eq("flock_id",flockId).order("age_days",{ascending:true});
    if (error || !Array.isArray(data)) return [];
    return data.map(r => { const b=r.production_metrics?._weightBand; return b && Number.isFinite(Number(b.predicted_percent)) ? {week:Number(r.week_number??r.production_week),band:b} : null; }).filter(Boolean);
  }

  async function renderReport() {
    const root=document.getElementById("root");
    const active=document.querySelector('.report-tab.active[data-tab="overall"]');
    if(!root || !active || document.getElementById("adineWeightBandReport")) return;
    const rows=await reportRows();
    if(!rows.length) return;
    const charts=root.querySelector(".charts");
    if(!charts) return;
    const box=document.createElement("div");
    box.id="adineWeightBandReport"; box.className="chart-box wide adine-weight-band-report";
    box.innerHTML='<h3>روند پرندگان در محدوده وزن هدف</h3><div class="chart-area"><canvas id="adineWeightBandTrend"></canvas></div>';
    charts.appendChild(box);
    const canvas=document.getElementById("adineWeightBandTrend");
    if(!canvas || typeof Chart==="undefined") return;
    new Chart(canvas,{type:"line",data:{labels:rows.map(r=>`هفته ${fa(r.week)}`),datasets:[{label:"آدینه — درصد برآوردی داخل محدوده",data:rows.map(r=>Number(r.band.predicted_percent)),borderWidth:2,pointRadius:3,tension:.25,fill:false}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+"٪"}}}}});
  }

  function bootWeekly() {
    styles();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => { bindWeekly(); }, {once:true});
    } else if (!bindWeekly()) {
      let n=0; const t=setInterval(()=>{if(bindWeekly()||++n>=120)clearInterval(t);},100);
    }
  }

  function bootReport() {
    styles();
    const root=document.getElementById("root");
    if(!root) { setTimeout(bootReport,100); return; }
    if(state.reportBound) return;
    state.reportBound=true;
    const run=()=>setTimeout(renderReport,100);
    new MutationObserver(run).observe(root,{childList:true,subtree:true});
    document.addEventListener("click",e=>{if(e.target?.closest?.('.report-tab[data-tab="overall"]')) run();},true);
    run();
  }

  window.AdineWeightBand={calculate:calculate,sync:sync,persist:persist,version:"1.2.1"};

  if (location.pathname.toLowerCase().endsWith("reports.html")) bootReport();
  else bootWeekly();
})();
