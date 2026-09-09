/* ADINE POULTRY HEALTH — WEIGHT BAND ENGINE V2
   Additive statistical engine for broiler Weight Band analysis.
   Core weekly calculations are intentionally untouched.

   Design:
   1) Management band = official strain target BW ± management tolerance.
   2) Processing band = optional user/slaughterhouse-defined range.
   3) Estimated flock percentage = Normal CDF interval using actual mean + CV.
   4) Observed sample percentage is reported separately.

   IMPORTANT:
   - Minimum/maximum sample weights are NEVER used as a target band.
   - ±10% is an ADINE management rule, not an Aviagen official tolerance.
   - Official strain target is read through the existing standards resolver.
*/
"use strict";

(function (global) {
  const VERSION = "2.0.2";
  const DEFAULT_MANAGEMENT_TOLERANCE = 10;

  function erf(x) {
    if (!Number.isFinite(x)) return x < 0 ? -1 : 1;
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    if (ax === 0) return 0;
    if (ax > 3.5) {
      const z = ax * ax;
      let term = 1;
      let sum = 1;
      for (let n = 1; n < 80; n++) {
        term *= -((2 * n - 1) / (2 * z));
        sum += term;
        if (Math.abs(term) < 1e-16 * Math.abs(sum)) break;
      }
      return sign * (1 - Math.exp(-z) * sum / (Math.sqrt(Math.PI) * ax));
    }
    let sum = 0;
    let term = ax;
    for (let n = 0; n < 100; n++) {
      sum += term / (2 * n + 1);
      term *= -(ax * ax) / (n + 1);
      if (Math.abs(term) < 1e-18) break;
    }
    return sign * (2 / Math.sqrt(Math.PI)) * sum;
  }

  function normalCDF(x, mean, sd) {
    const v = Number(x), m = Number(mean), s = Number(sd);
    if (![v, m, s].every(Number.isFinite) || s < 0) return null;
    if (s === 0) return v < m ? 0 : 1;
    return 0.5 * (1 + erf((v - m) / (s * Math.SQRT2)));
  }

  function sdFromMeanCv(mean, cv) {
    const m = Number(mean), c = Number(cv);
    if (!Number.isFinite(m) || !Number.isFinite(c) || m <= 0 || c < 0) return null;
    return m * c / 100;
  }

  function normalInterval(lower, upper, mean, sd) {
    const lo = Number(lower), hi = Number(upper), m = Number(mean), s = Number(sd);
    if (![lo, hi, m, s].every(Number.isFinite) || lo > hi || m <= 0 || s < 0) return null;
    if (lo === hi) return 0;
    if (s === 0) return (m > lo && m <= hi) ? 1 : 0;
    return Math.max(0, Math.min(1, normalCDF(hi, m, s) - normalCDF(lo, m, s)));
  }

  function observedBand(weights, lower, upper) {
    const ws = Array.isArray(weights)
      ? weights.map(Number).filter(v => Number.isFinite(v) && v > 0)
      : [];
    const lo = Number(lower), hi = Number(upper);
    if (!ws.length || !Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) {
      return { count: 0, percent: null };
    }
    const count = ws.filter(v => v >= lo && v <= hi).length;
    return { count, percent: 100 * count / ws.length };
  }

  function estimateFlockCount(percent, flockSize) {
    const p = Number(percent), n = Number(flockSize);
    if (!Number.isFinite(p) || !Number.isFinite(n) || n < 0) return null;
    return Math.round((p / 100) * n);
  }

  function makeBand(center, tolerancePercent) {
    const c = Number(center), t = Number(tolerancePercent);
    if (!Number.isFinite(c) || c <= 0 || !Number.isFinite(t) || t < 0 || t >= 100) return null;
    return {
      lower: c * (1 - t / 100),
      upper: c * (1 + t / 100),
      tolerancePercent: t
    };
  }

  function analyseBand({ weights, lower, upper, mean, cv, flockSize }) {
    const observed = observedBand(weights, lower, upper);
    const sd = sdFromMeanCv(mean, cv);
    const probability = sd == null ? null : normalInterval(lower, upper, mean, sd);
    const predictedPercent = probability == null ? null : probability * 100;
    return {
      lower: Number(lower),
      upper: Number(upper),
      observedCount: observed.count,
      observedPercent: observed.percent,
      predictedPercent,
      estimatedFlockCount: estimateFlockCount(predictedPercent, flockSize),
      sd
    };
  }

  function calculate(options) {
    const o = options || {};
    const weights = Array.isArray(o.weights)
      ? o.weights.map(Number).filter(v => Number.isFinite(v) && v > 0)
      : [];
    if (weights.length < 2) return { ok: false, reason: "insufficient-sample" };

    const mean = Number(o.mean), cv = Number(o.cv);
    if (!Number.isFinite(mean) || mean <= 0 || !Number.isFinite(cv) || cv < 0) {
      return { ok: false, reason: "invalid-statistics" };
    }

    /* Preserve an absent official target as null. Number(null) would incorrectly become 0. */
    const rawTarget = o.officialTargetWeight;
    const target = rawTarget === null || rawTarget === undefined || rawTarget === ""
      ? null
      : Number(rawTarget);
    const safeTarget = Number.isFinite(target) && target > 0 ? target : null;

    const tolerance = Number.isFinite(Number(o.managementTolerance))
      ? Number(o.managementTolerance)
      : DEFAULT_MANAGEMENT_TOLERANCE;
    const managementBand = makeBand(safeTarget, tolerance);

    const customLower = Number(o.processingLower);
    const customUpper = Number(o.processingUpper);
    const hasCustom = Number.isFinite(customLower) && Number.isFinite(customUpper) &&
      customLower > 0 && customUpper > 0 && customLower <= customUpper;

    const flockSize = Number(o.flockSize);
    const management = managementBand
      ? analyseBand({
          weights,
          lower: managementBand.lower,
          upper: managementBand.upper,
          mean,
          cv,
          flockSize
        })
      : null;
    const processing = hasCustom
      ? analyseBand({
          weights,
          lower: customLower,
          upper: customUpper,
          mean,
          cv,
          flockSize
        })
      : null;

    return {
      ok: true,
      engine: "Adine Weight Band Engine",
      version: VERSION,
      method: "normal-cdf-single-population",
      mean,
      cv,
      sd: sdFromMeanCv(mean, cv),
      sampleCount: weights.length,
      flockSize: Number.isFinite(flockSize) ? flockSize : null,
      officialTargetWeight: safeTarget,
      managementTolerance: tolerance,
      managementBand,
      management,
      processing: processing ? { ...processing, lower: customLower, upper: customUpper } : null,
      processingEnabled: Boolean(processing),
      observedSampleRange: {
        lower: Math.min(...weights),
        upper: Math.max(...weights)
      },
      note: "محدوده مدیریتی از وزن هدف رسمی سویه و تلرانس مدیریتی آدینه ساخته می‌شود؛ محدوده کشتارگاه در صورت ورود کاربر مستقل است. حداقل/حداکثر نمونه هرگز به‌عنوان Target Band استفاده نمی‌شود. درصد برآوردی با CDF نرمال و بر پایه Mean و CV محاسبه می‌شود."
    };
  }

  global.AdineWeightBandEngine = {
    VERSION,
    DEFAULT_MANAGEMENT_TOLERANCE,
    erf,
    normalCDF,
    sdFromMeanCv,
    normalInterval,
    observedBand,
    estimateFlockCount,
    makeBand,
    analyseBand,
    calculate
  };

  /* UI-only refinement: preserve all calculations and update the existing Weight Band card. */
  function refineWeightBandUI() {
    const sec = document.getElementById("adineWeightBandSection");
    if (!sec) return false;

    const title = sec.querySelector("h3");
    if (title) title.textContent = "تحلیل محدوده وزنی سلامت طیور آدینه";

    const note = sec.querySelector(".awb-note");
    if (note) note.textContent = "محاسبات آماری این بخش بر پایه مدل تک‌جمعیتی و توزیع نرمال انجام می‌شود و با استفاده از میانگین و CV واقعی گله، درصد برآوردی داخل هر محدوده محاسبه می‌گردد. ±۱۰٪ و ±۱۵٪ در این صفحه قواعد مدیریتی آدینه‌اند و استاندارد رسمی سویه محسوب نمی‌شوند. حداقل و حداکثر وزن نمونه هرگز به‌عنوان محدوده هدف استفاده نمی‌شوند.";

    const pctBox = document.getElementById("awbMgmt10Pct")?.closest(".awb-box");
    if (!pctBox) return true;

    let countEl = document.getElementById("awbMgmt10Count");
    if (!countEl) {
      countEl = document.createElement("div");
      countEl.id = "awbMgmt10Count";
      countEl.style.cssText = "font-size:12px;font-weight:700;margin-top:8px;opacity:.82";
      pctBox.appendChild(countEl);
    }

    const refreshCount = () => {
      try {
        const r = window.AdineWeightBandRuntime?.calculate?.();
        const n = r?.management?.estimatedFlockCount;
        countEl.textContent = n == null ? "تعداد برآوردی در گله: —" : "تعداد برآوردی در گله: " + Number(n).toLocaleString("fa-IR") + " قطعه";
      } catch (_) {
        countEl.textContent = "تعداد برآوردی در گله: —";
      }
    };

    refreshCount();
    if (!countEl.dataset.bound) {
      countEl.dataset.bound = "1";
      ["liveBirds", "weekNumber"].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener("input", refreshCount); el.addEventListener("change", refreshCount); }
      });
      const oldSync = window.AdineWeightBandRuntime?.sync;
      if (typeof oldSync === "function" && !oldSync.__adineCountRefined) {
        const wrappedSync = function () {
          const result = oldSync.apply(this, arguments);
          setTimeout(refreshCount, 0);
          return result;
        };
        wrappedSync.__adineCountRefined = true;
        window.AdineWeightBandRuntime.sync = wrappedSync;
      }
    }
    return true;
  }

  if (typeof document !== "undefined") {
    const startUIRefinement = () => {
      if (refineWeightBandUI()) return;
      const observer = new MutationObserver(() => {
        if (refineWeightBandUI()) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startUIRefinement, { once: true });
    else startUIRefinement();
  }
})(window);
