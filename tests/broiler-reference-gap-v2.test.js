const assert = require('assert');

function gapPct(actual, reference) {
  return (actual - reference) / Math.abs(reference) * 100;
}
function gapDelta(actualPrev, refPrev, actualNow, refNow) {
  return gapPct(actualNow, refNow) - gapPct(actualPrev, refPrev);
}
function scoreDelta(actualPrev, refPrev, actualNow, refNow, direction) {
  const d = gapDelta(actualPrev, refPrev, actualNow, refNow);
  return direction === 'higher' ? d : -d;
}
function wow(actualNow, actualPrev) {
  return (actualNow - actualPrev) / Math.abs(actualPrev) * 100;
}

// Weight: +5% vs reference -> +10% vs reference = 5 percentage-point improvement.
assert.strictEqual(Number(gapDelta(105, 100, 110, 100).toFixed(6)), 5);
assert(scoreDelta(105, 100, 110, 100, 'higher') > 0);

// Weight can rise while performance worsens if the reference rises faster.
assert(scoreDelta(120, 100, 130, 120, 'higher') < 0);

// FCR: -5% vs reference -> -10% = improvement because lower FCR is better.
assert(scoreDelta(95, 100, 90, 100, 'lower') > 0);

// FCR: -10% -> -5% = deterioration, even though actual FCR may still be better than reference.
assert(scoreDelta(90, 100, 95, 100, 'lower') < 0);

// If actual and reference move proportionally together, relative position is stable.
assert(Math.abs(gapDelta(120, 100, 132, 110)) < 1e-9);

// Week-over-week actual change is descriptive and must not determine performance direction.
assert.strictEqual(Number(wow(132, 120).toFixed(4)), 10);

console.log('reference-gap v2 tests: PASS');
