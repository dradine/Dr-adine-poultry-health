/* ADINE POULTRY HEALTH — WEIGHT BAND UI / STORAGE BRIDGE V1.1
   Safe additive bridge.
   IMPORTANT: This file NEVER replaces calculateWeekly() or saveWeeklyRecord().
   Existing weight, SD, CV, uniformity, FCR and standards engines remain untouched.
*/
(function () {
  "use strict";

  const ENGINE = () => window.AdineWeightBandEngine;
  const state = { lastResult: null, bound: false };

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
    return n === null ? "—" : n.toLocaleString("fa-IR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function pct(v, digits = 1) {
    const n = num(v);
    return n === null ? "—" : n.toLocaleString("fa-IR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }) + "٪";
  }

  function weights() {
    return Array.from(document.querySelectorAll("#weightsContainer .bird-weight"))
      .map(el => num(el.value))
      .filter(v => Number.isFinite(v) && v > 0);
  }

  function statistics() {
    try {
      if (typeof getWeights === "function" && typeof calculateWeightStatistics === "function") {
        const ws = getWeights();
        if (Array.isArray(ws) && ws.length >= 2) {
          const s = calculateWeightStatistics(ws);
          if (s && Number.isFinite(Number(s.mean)) && Number.isFinite(Number(s.cv))) {
            return { mean: Number(s.mean), cv: Number(s.cv) };
          }
        }
      }
    } catch (e) {
      console.warn("Adine weight-band statistics bridge:", e);
    }
    return null;
  }

  function flockSize() {
    return num(document.getElementById("liveBirds")?.value);
  }

  function current() {
    const e = ENGINE();
    const s = statistics();
    const ws = weights();
    if (!e || !s || ws.length < 2) return null;
    return e.calculate({
      weights: ws,
      mean: s.mean,
      cv: s.cv,
      flockSize: flockSize()
    });
  }

  function ensureStyles() {
    if (document.getElementById("adine-weight-band-style")) return;
    const style = document.createElement("style");
    style.id = "adine-weight-band-style";
    style.textContent = `
      .adine-weight-band{margin-top:16px;border:1px solid rgba(15,23,42,.10);border-radius:16px;padding:16px;background:var(--card,#fff);box-shadow:0 4px 16px rgba(15,23,42,.05)}
      .adine-weight-band .awb-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}
      .adine-weight-band h3{margin:0;font-size:16px}.adine-weight-band .awb-sub{margin:5px 0 0;font-size:12px;opacity:.72;line-height:1.8}
      .adine-weight-band .awb-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .adine-weight-band .awb-box{border:1px solid rgba(15,23,42,.08);border-radius:12px;padding:11px;min-height:62px}.adine-weight-band .awb-label{font-size:11px;opacity:.68}.adine-weight-band .awb-value{font-size:18px;font-weight:800;margin-top:5px}
      .adine-weight-band .awb-note{margin:12px 0 0;font-size:11px;line-height:1.9;opacity:.72}
      @media(max-width:680px){.adine-weight-band .awb-grid{grid-template-columns:1fr}.adine-weight-band .awb-head{display:block}}
      .adine-weight-band-report{margin-top:14px}.adine-weight-band-report .chart-area{height:260px;position:relative}
    `;
    document.head.appendChild(style);
  }

  function ensureWeeklySection() {
    const container = document.getElementById("weightsContainer");
    if (!container || document.getElementById("adineWeightBandSection")) return;
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
      <p class="awb-note">این تحلیل افزونه‌ای است و جایگزین CV، یکنواختی ±۱۰/±۱۵ یا استاندارد رسمی سویه نیست. درصد مشاهده‌شده نمونه از حداقل تا حداکثر، با هر دو کران، ۱۰۰٪ است؛ درصد برآوردی گله با CDF و کران پایین L&lt;X محاسبه می‌شود.</p>
    `;
    container.insertAdjacentElement("afterend", section);
  }

  function renderWeekly(result) {
    ensureWeeklySection();
    const ids = ["awbMin", "awbMax", "awbPredicted", "awbFlockCount", "awbMean", "awbCv"];
    if (!ids.every(id => document.getElementById(id))) return;
    if (!result || !result.ok) {
      ids.forEach(id => { document.getElementById(id).textContent = "—"; });
      return;
    }
    document.getElementById("awbMin").textContent = fa(result.lower, 0);
    document.getElementById("awbMax").textContent = fa(result.upper, 0);
    document.getElementById("awbPredicted").textContent = pct(result.predictedPercent, 1);
    document.getElementById("awbFlockCount").textContent = result.estimatedFlockCount === null ? "—" : fa(result.estimatedFlockCount, 0) + " قطعه";
    document.getElementById("awbMean").textContent = fa(result.mean, 1) + " گرم";
    document.getElementById("awbCv").textContent = pct(result.cv, 2);
  }

  function sync() {
    const result = current();
    state.lastResult = result;
    renderWeekly(result);
    return result;
  }

  function isoDate() {
    const value = String(document.getElementById("evaluationDate")?.value || "").trim();
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    try {
      const iso = window.AdineDateSystem?.jalaliToISO?.(value);
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return iso;
    } catch (_) {}
    return null;
  }

  async function persist(result) {
    if (!result || !result.ok || !window.supabaseClient) return;
    const flockId = window.currentFlock?.id || window.currentFlockForSpecialized?.id;
    const date = isoDate();
    if (!flockId || !date) return;

    try {
      let row = null;
      const q = await window.supabaseClient.from("weekly_records")
        .select("id,production_metrics,updated_at")
        .eq("flock_id", flockId)
        .eq("evaluation_date", date)
        .order("updated_at", { ascending: false })
        .limit(1);
      row = q.data?.[0] || null;

      if (!row) {
        const q2 = await window.supabaseClient.from("weekly_records")
          .select("id,production_metrics,updated_at")
          .eq("flock_id", flockId)
          .eq("record_date", date)
          .order("updated_at", { ascending: false })
          .limit(1);
        row = q2.data?.[0] || null;
      }

      if (!row) return;
      const pm = row.production_metrics && typeof row.production_metrics === "object" ? row.production_metrics : {};
      const band = {
        version: result.version,
        method: result.method,
        lower_g: Number(result.lower),
        upper_g: Number(result.upper),
        mean_g: Number(result.mean),
        cv_percent: Number(result.cv),
        sd_g: Number(result.sd),
        predicted_percent: Number(result.predictedPercent),
        estimated_flock_count: result.estimatedFlockCount === null ? null : Number(result.estimatedFlockCount),
        sample_count: Number(result.sampleCount),
        observed_percent: Number(result.observedPercent),
        observed_count: Number(result.observedCount)
      };

      const { error } = await window.supabaseClient.from("weekly_records")
        .update({ production_metrics: { ...pm, _weightBand: band } })
        .eq("id", row.id)
        .eq("flock_id", flockId);
      if (error) console.warn("Adine weight-band persistence error:", error);
    } catch (error) {
      console.warn("Adine weight-band persistence skipped:", error);
    }
  }

  function findCalculateButton(target) {
    const el = target?.closest?.("button, input[type='button'], input[type='submit']");
    if (!el) return false;
    const action = String(el.getAttribute("onclick") || "").replace(/\s/g, "");
    return action.includes("calculateWeekly()") || action.includes("calculateWeekly(");
  }

  function findSaveButton(target) {
    const el = target?.closest?.("button, input[type='button'], input[type='submit']");
    if (!el) return false;
    const action = String(el.getAttribute("onclick") || "").replace(/\s/g, "");
    return action.includes("saveWeeklyRecord()") || action.includes("saveWeeklyRecord(");
  }

  function bindActions() {
    if (state.bound) return;
    state.bound = true;

    document.addEventListener("click", event => {
      if (findCalculateButton(event.target)) {
        window.setTimeout(sync, 0);
        window.setTimeout(sync, 150);
        return;
      }

      if (findSaveButton(event.target)) {
        const result = sync();
        window.setTimeout(async () => {
          try {
            await persist(result || current());
          } catch (e) {
            console.warn("Adine weight-band save bridge:", e);
          }
        }, 700);
      }
    }, false);

    const c = document.getElementById("weightsContainer");
    if (c) {
      c.addEventListener("input", () => { ensureWeeklySection(); sync(); }, false);
      c.addEventListener("change", () => { ensureWeeklySection(); sync(); }, false);
    }

    const live = document.getElementById("liveBirds");
    if (live) live.addEventListener("input", sync, false);
  }

  function installWeekly() {
    if (!ENGINE()) return false;
    ensureStyles();
    ensureWeeklySection();
    bindActions();
    sync();
    return true;
  }

  async function reportData() {
    if (!window.supabaseClient) return [];
    const params = new URLSearchParams(location.search);
    let flockId = params.get("flockId");
    if (!flockId) {
      try {
        flockId = JSON.parse(localStorage.getItem("adine_poultry_current_selection") || "{}").flockId;
      } catch (_) {}
    }
    if (!flockId) return [];

    const { data, error } = await window.supabaseClient.from("weekly_records")
      .select("week_number,production_week,age_days,evaluation_date,record_date,production_metrics")
      .eq("flock_id", flockId)
      .order("age_days", { ascending: true });
    if (error || !Array.isArray(data)) return [];

    return data.map(r => {
      const b = r.production_metrics?._weightBand;
      if (!b || !Number.isFinite(Number(b.predicted_percent))) return null;
      return {
        week: Number(r.week_number ?? r.production_week),
        age: Number(r.age_days),
        date: r.evaluation_date || r.record_date,
        band: b
      };
    }).filter(Boolean);
  }

  let reportCache = null;
  let reportChart = null;

  async function renderReportBand() {
    const root = document.getElementById("root");
    if (!root || !document.querySelector('.report-tab.active[data-tab="overall"]')) return;
    if (document.getElementById("adineWeightBandReport")) return;

    const rows = reportCache || await reportData();
    reportCache = rows;
    if (!rows.length) return;

    const charts = root.querySelector(".charts");
    if (!charts) return;

    const box = document.createElement("div");
    box.id = "adineWeightBandReport";
    box.className = "chart-box wide adine-weight-band-report";
    box.innerHTML = `<h3>روند پرندگان در محدوده وزن هدف</h3><div class="chart-area"><canvas id="adineWeightBandTrend"></canvas></div>`;
    charts.appendChild(box);

    const canvas = document.getElementById("adineWeightBandTrend");
    if (!canvas || typeof Chart === "undefined") return;
    if (reportChart) {
      try { reportChart.destroy(); } catch (_) {}
    }

    reportChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: rows.map(r => `هفته ${fa(r.week, 0)}`),
        datasets: [{
          label: "آدینه — درصد برآوردی داخل محدوده",
          data: rows.map(r => Number(r.band.predicted_percent)),
          borderWidth: 2,
          pointRadius: 3,
          tension: .25,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "top", labels: { font: { family: "Tahoma", size: 10 } } },
          tooltip: {
            rtl: true,
            callbacks: {
              afterBody: function(items) {
                const i = items?.[0]?.dataIndex;
                const r = rows[i];
                if (!r) return [];
                return [`محدوده نمونه: ${fa(r.band.lower_g,0)} تا ${fa(r.band.upper_g,0)} گرم`];
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { callback: v => v + "٪", font: { family: "Tahoma", size: 9 } } },
          x: { ticks: { font: { family: "Tahoma", size: 9 } } }
        }
      }
    });
  }

  function installReportObserver() {
    const root = document.getElementById("root");
    if (!root || root.dataset.awbReportObserver) return;
    root.dataset.awbReportObserver = "1";

    const observer = new MutationObserver(() => {
      window.setTimeout(renderReportBand, 0);
    });
    observer.observe(root, { childList: true, subtree: true });

    document.addEventListener("click", e => {
      if (e.target?.closest?.('.report-tab[data-tab="overall"]')) {
        window.setTimeout(renderReportBand, 100);
      }
    }, true);

    window.setTimeout(renderReportBand, 250);
  }

  function boot() {
    if (location.pathname.toLowerCase().endsWith("reports.html")) {
      ensureStyles();
      installReportObserver();
      return;
    }

    if (!installWeekly()) {
      let n = 0;
      const timer = setInterval(() => {
        n++;
        if (installWeekly() || n >= 120) clearInterval(timer);
      }, 100);
    }
  }

  window.AdineWeightBand = {
    calculate: current,
    sync,
    persist,
    version: "1.1.0"
  };

  boot();
})();
