const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("adine-weight-band-engine-v1.js", "utf8");
const context = { window: {}, console };
vm.createContext(context);
vm.runInContext(source, context, { filename: "adine-weight-band-engine-v1.js" });
const E = context.window.AdineWeightBandEngine;
assert.ok(E, "Weight Band engine must register");

const approx = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} !== ${b}`);

// Official target -> management band. Sample min/max must not define the band.
const result = E.calculate({
  weights: [171, 185, 192, 200, 205, 214, 220, 230, 235, 248],
  mean: 202.5,
  cv: 10.77,
  officialTargetWeight: 214,
  managementTolerance: 10,
  flockSize: 20000
});
assert.equal(result.ok, true);
approx(result.managementBand.lower, 192.6);
approx(result.managementBand.upper, 235.4);
approx(result.management.predictedPercent, 60.93535657332586, 1e-9);
assert.equal(result.observedSampleRange.lower, 171);
assert.equal(result.observedSampleRange.upper, 248);
assert.notEqual(Math.round(result.management.predictedPercent * 10) / 10, 90.7);
assert.equal(result.managementTolerance, 10);

// ±15% is a wider comparison band around the same official target.
const band15 = E.makeBand(214, 15);
approx(band15.lower, 181.9);
approx(band15.upper, 246.1);
const a15 = E.analyseBand({
  weights: result.observedSampleRange ? [171,185,192,200,205,214,220,230,235,248] : [],
  lower: band15.lower,
  upper: band15.upper,
  mean: 202.5,
  cv: 10.77,
  flockSize: 20000
});
approx(a15.predictedPercent, 80.47605524408254, 1e-9);

// Processing band is independent and user-defined.
const processing = E.calculate({
  weights: [171, 185, 192, 200, 205, 214, 220, 230, 235, 248],
  mean: 202.5,
  cv: 10.77,
  officialTargetWeight: 214,
  managementTolerance: 10,
  processingLower: 190,
  processingUpper: 220,
  flockSize: 20000
});
assert.equal(processing.processingEnabled, true);
assert.equal(processing.processing.lower, 190);
assert.equal(processing.processing.upper, 220);
assert.ok(processing.processing.predictedPercent > 0 && processing.processing.predictedPercent < 100);

// No official target => no automatic management band. Do not invent a fallback target.
const noTarget = E.calculate({
  weights: [171, 185, 192, 200],
  mean: 187,
  cv: 8,
  officialTargetWeight: null,
  managementTolerance: 10,
  flockSize: 1000
});
assert.equal(noTarget.managementBand, null);
assert.equal(noTarget.management, null);

// Mathematical guard: explicit normal interval still reproduces the old 171–248 estimate,
// proving the old 90.7% number was a distribution calculation, not a target-band definition.
approx(E.normalInterval(171, 248, 202.5, 202.5 * 10.77 / 100) * 100, 90.72014468422418, 1e-9);

console.log("Weight Band V2 regression tests: PASS");
