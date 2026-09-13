"use strict";
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const src = fs.readFileSync("broiler-performance-intelligence-v1.js", "utf8");
const ctx = { console, Number, String, Math, JSON };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const A = ctx.AdineBroilerPerformanceIntelligence;
assert.ok(A, "broiler PI API must load");
assert.strictEqual(A.version, "BROILER-PI-V1");

// EPEF: 2.5 kg, 97% livability, 42 d, FCR 1.55 => 372.0
const e = A.epef({ bodyWeightKg: 2.5, livabilityPct: 97, ageDays: 42, fcr: 1.55 });
assert.ok(e.available);
assert.strictEqual(e.value, 372.0);
assert.strictEqual(A.epef({ bodyWeightKg: 2.5, livabilityPct: 105, ageDays: 42, fcr: 1.55 }).value, 383.5);
assert.strictEqual(A.epef({ bodyWeightKg: 0, livabilityPct: 97, ageDays: 42, fcr: 1.55 }).available, false);
assert.strictEqual(A.epef({ bodyWeightKg: 2.5, livabilityPct: 97, ageDays: 0, fcr: 1.55 }).available, false);

// Livability must work from percentages without requiring placed count and never exceed biological bounds.
assert.strictEqual(A.livability({ mortalityPct: 3.2, cullPct: 0.4 }).value, 96.4);
assert.strictEqual(A.livability({ mortalityPct: 3.2 }).value, 96.8);
assert.strictEqual(A.livability({ livabilityPct: 105 }).value, 100);
assert.strictEqual(A.livability({ mortalityPct: -2 }).value, 100);
assert.strictEqual(A.livability({}).available, false);

// Processing must be measured, not invented.
const p = A.processing({ liveWeightKg: 2.7, carcassWeightKg: 1.98 });
assert.ok(p.available);
assert.strictEqual(p.carcassYieldPct, 73.33);
assert.strictEqual(A.processing({ liveWeightKg: 2.7 }).available, false);

// Economics is partial unless enough prices/costs are supplied.
const eco = A.economics({ birdCount: 1000, liveWeightKg: 2.5, fcr: 1.5, feedPricePerKg: 0.5, livePricePerKg: 1.5, chickCostPerBird: 0.3, otherCostPerBird: 0.1 });
assert.ok(eco.available);
assert.ok(eco.marginPerBird > 0);
const ecoNoInputs = A.economics({ birdCount: 1000, liveWeightKg: 2.5, fcr: 1.5 });
assert.strictEqual(ecoNoInputs.available, false);
assert.strictEqual(ecoNoInputs.marginPerBird, undefined);

// ABPI must not double-count EPEF and must declare its provisional calibration status.
const abpi = A.abpi({ growthScore: 90, fcrScore: 90, livabilityScore: 90, uniformityScore: 90, processingScore: 90, economicScore: 90 });
assert.ok(abpi.available);
assert.strictEqual(abpi.value, 90);
assert.strictEqual(abpi.calibrationStatus, "provisional");
assert.ok(abpi.methodology.includes("EPEF excluded"));
const abpiPartial = A.abpi({ growthScore: 90, fcrScore: 90 });
assert.ok(abpiPartial.available);
assert.ok(abpiPartial.coverage < 0.5);
assert.strictEqual(abpiPartial.confidence, "limited");

// Population benchmark must refuse tiny populations and handle metric direction correctly.
const small = A.conditionalBenchmark(1.5, Array.from({ length: 10 }, () => 1.5), "fcr");
assert.strictEqual(small.available, false);
assert.strictEqual(small.code, "population_too_small");

const pop = Array.from({ length: 50 }, (_, i) => 1.4 + i * 0.005);
const b = A.conditionalBenchmark(1.55, pop, "fcr");
assert.ok(b.available);
assert.strictEqual(b.n, 50);
assert.strictEqual(b.direction, "lower");
assert.ok(b.percentile >= 0 && b.percentile <= 100);

// Health-performance association uses a forward window and explicitly reports association, not causation.
const health = [
  { day: 7, severity: 1 }, { day: 14, severity: 2 }, { day: 21, severity: 3 }, { day: 28, severity: 4 }
];
const perf = [
  { day: 8, value: 100 }, { day: 15, value: 90 }, { day: 22, value: 80 }, { day: 29, value: 70 }
];
const hp = A.healthPerformanceAssociation(health, perf, 7);
assert.ok(hp.available);
assert.ok(hp.interpretation);
assert.ok(hp.note.includes("not causal"));
assert.strictEqual(A.healthPerformanceAssociation(health.slice(0, 2), perf).available, false);

// Market optimization must choose from supplied candidate ages only.
const market = A.marketOptimization({
  candidates: [
    { ageDays: 35, bodyWeightKg: 2.2, fcr: 1.45 },
    { ageDays: 42, bodyWeightKg: 2.7, fcr: 1.55 }
  ],
  targetWeightKg: 2.5,
  livePricePerKg: 1.5,
  feedPricePerKg: 0.5
});
assert.ok(market.available);
assert.ok([35, 42].includes(market.recommended.ageDays));
assert.strictEqual(A.marketOptimization({ candidates: [] }).available, false);

console.log("broiler-performance-intelligence-v1: all checks passed");
