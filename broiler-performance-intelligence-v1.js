/* ADINE BROILER PERFORMANCE INTELLIGENCE V1
 * Isolated, read-only analytics layer for broiler reports.
 * Does not mutate or replace canonical weight/FCR/mortality/uniformity engines.
 * Every output carries provenance and data-quality state where applicable.
 */
(function (global) {
  "use strict";

  const n = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const x = Number(String(v).replace(/[٬,]/g, "").replace("٫", "."));
    return Number.isFinite(x) ? x : null;
  };
  const clamp = (x, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x));
  const round = (x, d = 3) => Number(Number(x).toFixed(d));

  function epef({ bodyWeightKg, livabilityPct, ageDays, fcr }) {
    const bw = n(bodyWeightKg), liv = n(livabilityPct), age = n(ageDays), f = n(fcr);
    if ([bw, liv, age, f].some(v => v === null) || age <= 0 || f <= 0) return { available: false, code: "insufficient_data" };
    return { available: true, value: round((bw * liv * 100) / (age * f), 1), formula: "BW_kg × livability_% × 100 / (age_days × FCR)", provenance: "calculated" };
  }

  function livability({ placed, mortalityPct, cullPct, livabilityPct }) {
    const suppliedLivability = n(livabilityPct);
    if (suppliedLivability !== null) {
      return { available: true, value: clamp(suppliedLivability, 0, 100), provenance: "measured_or_calculated" };
    }
    const p = n(placed), m = n(mortalityPct), c = n(cullPct);
    if (m !== null || c !== null) {
      return { available: true, value: clamp(100 - ((m ?? 0) + (c ?? 0)), 0, 100), provenance: "calculated" };
    }
    if (p !== null && p > 0) return { available: false, code: "insufficient_data" };
    return { available: false, code: "insufficient_data" };
  }

  function processing({ liveWeightKg, carcassWeightKg, breastWeightKg, legWeightKg, condemnationPct }) {
    const live = n(liveWeightKg), carcass = n(carcassWeightKg);
    const out = { available: false, provenance: "measured" };
    if (live !== null && live > 0 && carcass !== null && carcass >= 0) {
      out.available = true;
      out.carcassYieldPct = round((carcass / live) * 100, 2);
      out.carcassWeightKg = carcass;
    }
    const breast = n(breastWeightKg), leg = n(legWeightKg);
    if (out.available && breast !== null) out.breastYieldPct = round((breast / live) * 100, 2);
    if (out.available && leg !== null) out.legYieldPct = round((leg / live) * 100, 2);
    if (n(condemnationPct) !== null) out.condemnationPct = clamp(n(condemnationPct), 0, 100);
    return out;
  }

  function economics({ birdCount, liveWeightKg, carcassWeightKg, fcr, feedPricePerKg, chickCostPerBird, otherCostPerBird, livePricePerKg, carcassPricePerKg, processingCostPerBird }) {
    const count = n(birdCount), bw = n(liveWeightKg), f = n(fcr), feedPrice = n(feedPricePerKg);
    const out = { available: false, provenance: "calculated", confidence: "low" };
    if ([count, bw, f, feedPrice].every(v => v !== null) && count > 0 && bw > 0 && f > 0 && feedPrice >= 0) {
      out.available = true;
      out.feedCostPerBird = round(bw * f * feedPrice, 2);
      out.feedCostPerKgLive = round(f * feedPrice, 2);
      out.totalFeedCost = round(out.feedCostPerBird * count, 2);
    }
    const revenuePerBird = (() => {
      const cp = n(carcassPricePerKg), cw = n(carcassWeightKg), lp = n(livePricePerKg);
      if (cw !== null && cp !== null && cw >= 0 && cp >= 0) return cw * cp;
      if (bw !== null && lp !== null && bw >= 0 && lp >= 0) return bw * lp;
      return null;
    })();
    const hasAnyCost = out.feedCostPerBird !== undefined || [chickCostPerBird, otherCostPerBird, processingCostPerBird].some(v => n(v) !== null);
    const variableCostPerBird = hasAnyCost
      ? (out.feedCostPerBird ?? 0) + (n(chickCostPerBird) ?? 0) + (n(otherCostPerBird) ?? 0) + (n(processingCostPerBird) ?? 0) : null;
    if (revenuePerBird !== null && variableCostPerBird !== null) {
      out.revenuePerBird = round(revenuePerBird, 2);
      out.variableCostPerBird = round(variableCostPerBird, 2);
      out.marginPerBird = round(revenuePerBird - variableCostPerBird, 2);
      out.totalMargin = count !== null ? round(out.marginPerBird * count, 2) : null;
      out.confidence = "medium";
    }
    return out;
  }

  function normalizeHigher(value, target) {
    const v = n(value), t = n(target);
    if (v === null || t === null || t <= 0) return null;
    return clamp(100 * (v / t));
  }
  function normalizeLower(value, target) {
    const v = n(value), t = n(target);
    if (v === null || t === null || v <= 0 || t <= 0) return null;
    return clamp(100 * (t / v));
  }

  /* ABPI deliberately excludes EPEF: EPEF already contains weight, livability and FCR.
     This prevents double-counting correlated/derived inputs. */
  function abpi({ growthScore, fcrScore, livabilityScore, uniformityScore, processingScore, economicScore, weights }) {
    const domains = {
      growth: n(growthScore), fcr: n(fcrScore), livability: n(livabilityScore),
      uniformity: n(uniformityScore), processing: n(processingScore), economics: n(economicScore)
    };
    const defaultWeights = { growth: 0.22, fcr: 0.22, livability: 0.16, uniformity: 0.12, processing: 0.14, economics: 0.14 };
    const w = Object.assign({}, defaultWeights, weights || {});
    let sum = 0, denom = 0;
    Object.keys(domains).forEach(k => {
      if (domains[k] !== null && Number.isFinite(w[k]) && w[k] > 0) { sum += clamp(domains[k]) * w[k]; denom += w[k]; }
    });
    if (!denom) return { available: false, code: "insufficient_data", confidence: "low", calibrationStatus: "provisional" };
    const value = round(sum / denom, 1);
    const coverage = denom / Object.values(w).reduce((a, b) => a + b, 0);
    return { available: true, value, coverage: round(coverage, 3), confidence: coverage >= 0.85 ? "high" : coverage >= 0.65 ? "medium" : "limited", calibrationStatus: "provisional", domains, weights: w, methodology: "weighted domain score; EPEF excluded to prevent double counting", provenance: "calculated" };
  }

  function percentile(value, population, direction = "higher") {
    const v = n(value), a = (population || []).map(n).filter(x => x !== null);
    if (v === null || a.length < 30) return { available: false, code: a.length ? "population_too_small" : "insufficient_data", n: a.length, minimum_n: 30 };
    const better = direction === "lower" ? a.filter(x => x >= v).length : a.filter(x => x <= v).length;
    return { available: true, percentile: round((better / a.length) * 100, 1), n: a.length, direction, provenance: "population" };
  }

  function conditionalBenchmark(value, peers, metric, minN = 30) {
    const v = n(value), rows = Array.isArray(peers) ? peers.filter(Boolean) : [];
    if (v === null || rows.length < minN) return { available: false, code: rows.length ? "population_too_small" : "insufficient_data", n: rows.length, minimum_n: minN };
    const vals = rows.map(x => n(typeof x === "object" ? x.value : x)).filter(x => x !== null);
    if (vals.length < minN) return { available: false, code: "population_too_small", n: vals.length, minimum_n: minN };
    const direction = ["fcr", "mortality", "cv"].includes(String(metric).toLowerCase()) ? "lower" : "higher";
    const sorted = vals.slice().sort((a, b) => a - b);
    const q = p => sorted[Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * p)))];
    const pctl = percentile(v, vals, direction);
    return { available: true, metric, n: vals.length, p10: round(q(.10), 3), p25: round(q(.25), 3), p50: round(q(.50), 3), p75: round(q(.75), 3), p90: round(q(.90), 3), percentile: pctl.percentile, direction, provenance: "population" };
  }

  function healthPerformanceAssociation(events, performance, windowDays = 7) {
    const ev = (events || []).map(e => ({ day: n(e.day ?? e.ageDays), severity: n(e.severity) })).filter(e => e.day !== null && e.severity !== null);
    const perf = (performance || []).map(p => ({ day: n(p.day ?? p.ageDays), value: n(p.value) })).filter(p => p.day !== null && p.value !== null).sort((a, b) => a.day - b.day);
    if (ev.length < 3 || perf.length < 4) return { available: false, code: "insufficient_history", minimum_events: 3, minimum_performance_points: 4 };
    const pairs = [];
    ev.forEach(e => {
      const after = perf.filter(p => p.day > e.day && p.day <= e.day + windowDays);
      if (after.length) pairs.push({ x: e.severity, y: after.reduce((s, p) => s + p.value, 0) / after.length });
    });
    if (pairs.length < 3) return { available: false, code: "insufficient_matched_windows", matched_windows: pairs.length };
    const mx = pairs.reduce((s, p) => s + p.x, 0) / pairs.length, my = pairs.reduce((s, p) => s + p.y, 0) / pairs.length;
    const num = pairs.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
    const dx = Math.sqrt(pairs.reduce((s, p) => s + (p.x - mx) ** 2, 0)), dy = Math.sqrt(pairs.reduce((s, p) => s + (p.y - my) ** 2, 0));
    const r = dx && dy ? num / (dx * dy) : 0;
    return { available: true, n: pairs.length, correlation: round(r, 3), windowDays, interpretation: Math.abs(r) >= .7 ? "strong_association" : Math.abs(r) >= .4 ? "moderate_association" : "weak_association", note: "Association only; not causal inference.", provenance: "calculated" };
  }

  function marketOptimization({ candidates, targetWeightKg, livePricePerKg, feedPricePerKg, fcrByAge, yieldByAge, carcassPricePerKg }) {
    const ages = Array.isArray(candidates) ? candidates : [];
    const tp = n(targetWeightKg), lp = n(livePricePerKg), fp = n(feedPricePerKg), cp = n(carcassPricePerKg);
    const out = ages.map(c => {
      const age = n(c.ageDays), bw = n(c.bodyWeightKg), fcr = n(c.fcr ?? fcrByAge?.[age]), y = n(c.carcassYieldPct ?? yieldByAge?.[age]);
      if ([age, bw].some(v => v === null)) return null;
      const feedCost = fcr !== null && fp !== null ? bw * fcr * fp : null;
      const revenue = y !== null && cp !== null ? bw * y / 100 * cp : lp !== null ? bw * lp : null;
      const marginProxy = revenue !== null && feedCost !== null ? revenue - feedCost : null;
      return { ageDays: age, bodyWeightKg: bw, fcr, carcassYieldPct: y, feedCostPerBird: feedCost === null ? null : round(feedCost, 2), revenuePerBird: revenue === null ? null : round(revenue, 2), marginProxy: marginProxy === null ? null : round(marginProxy, 2), distanceToTargetKg: tp === null ? null : round(Math.abs(bw - tp), 3) };
    }).filter(Boolean);
    if (!out.length) return { available: false, code: "insufficient_data" };
    const ranked = out.filter(x => x.marginProxy !== null).sort((a, b) => b.marginProxy - a.marginProxy);
    return { available: true, targetWeightKg: tp, candidates: out, recommended: ranked[0] || null, methodology: "marginal/partial economic comparison; add full farm costs before using as final profit forecast", provenance: "calculated" };
  }

  const API = { version: "BROILER-PI-V1", epef, livability, processing, economics, normalizeHigher, normalizeLower, abpi, percentile, conditionalBenchmark, healthPerformanceAssociation, marketOptimization };
  global.AdineBroilerPerformanceIntelligence = API;
})(typeof window !== "undefined" ? window : globalThis);
