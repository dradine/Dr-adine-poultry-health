/* ADINE POULTRY HEALTH — WEIGHT BAND ENGINE V1
   Statistical model aligned with the Aviagen UniPlus single-population method:
   P(L < X <= U) = NORM.DIST(U, mean, SD, TRUE) - NORM.DIST(L, mean, SD, TRUE)
*/
"use strict";

(function (global) {
  const VERSION = "1.0.0";

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
    const m = Number(mean), s = Number(sd), v = Number(x);
    if (![v, m, s].every(Number.isFinite)) return null;
    if (s < 0) return null;
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
    const p = normalCDF(hi, m, s) - normalCDF(lo, m, s);
    return Math.max(0, Math.min(1, p));
  }

  function observedBand(weights, lower, upper) {
    const ws = Array.isArray(weights) ? weights.map(Number).filter(v => Number.isFinite(v) && v > 0) : [];
    if (!ws.length) return { count: 0, percent: null };
    const n = ws.filter(v => v > Number(lower) && v <= Number(upper)).length;
    return { count: n, percent: 100 * n / ws.length };
  }

  function estimateFlockCount(percent, flockSize) {
    const p = Number(percent), n = Number(flockSize);
    if (!Number.isFinite(p) || !Number.isFinite(n) || n < 0) return null;
    return Math.round((p / 100) * n);
  }

  function calculate(options) {
    const o = options || {};
    const weights = Array.isArray(o.weights) ? o.weights.map(Number).filter(v => Number.isFinite(v) && v > 0) : [];
    if (weights.length < 2) return { ok: false, reason: "insufficient-sample" };
    const mean = Number(o.mean), cv = Number(o.cv);
    if (!Number.isFinite(mean) || mean <= 0 || !Number.isFinite(cv) || cv < 0) return { ok: false, reason: "invalid-statistics" };
    const lower = Math.min(...weights), upper = Math.max(...weights);
    const sd = sdFromMeanCv(mean, cv);
    const probability = normalInterval(lower, upper, mean, sd);
    const percent = probability == null ? null : probability * 100;
    const observed = observedBand(weights, lower, upper);
    const flockSize = Number(o.flockSize);
    return {
      ok: true, engine: "Adine Weight Band Engine", version: VERSION,
      lower, upper, mean, cv, sd,
      predictedPercent: percent,
      estimatedFlockCount: estimateFlockCount(percent, flockSize),
      observedCount: observed.count,
      observedPercent: observed.percent,
      sampleCount: weights.length,
      method: "normal-cdf-single-population",
      note: "بازه هدف برابر حداقل تا حداکثر نمونه است؛ بنابراین درصد مشاهده‌شده نمونه ذاتاً ۱۰۰٪ است و شاخص اصلی، درصد برآوردی گله است."
    };
  }

  global.AdineWeightBandEngine = {
    VERSION, erf, normalCDF, sdFromMeanCv, normalInterval,
    observedBand, estimateFlockCount, calculate
  };
})(window);
