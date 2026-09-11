// BROILER BENCHMARK V1 — deterministic logic tests (no DB writes)
const assert=require('node:assert/strict');
function percentile(values,current,direction){const v=values.filter(Number.isFinite);if(!v.length||!Number.isFinite(current))return null;const hit=direction==='lower'?v.filter(x=>x>=current).length:v.filter(x=>x<=current).length;return hit/v.length*100}
function nearestAge(records,target,window=3){return records.filter(r=>Math.abs(r.age-target)<=window).sort((a,b)=>Math.abs(a.age-target)-Math.abs(b.age-target)||b.created.localeCompare(a.created))[0]||null}
function status(n){return n<10?'low':n<20?'initial':n<50?'reliable':'stable'}
assert.equal(percentile([1,2,3,4,5],5,'higher'),100);
assert.equal(percentile([1,2,3,4,5],1,'lower'),100);
assert.equal(percentile([1,2,3,4,5],3,'higher'),60);
assert.equal(nearestAge([{age:19,created:'2026-01-01'},{age:22,created:'2026-01-02'},{age:21,created:'2026-01-03'}],21,3).age,21);
assert.equal(nearestAge([{age:18,created:'2026-01-01'},{age:24,created:'2026-01-02'}],21,2),null);
assert.equal(status(9),'low');assert.equal(status(10),'initial');assert.equal(status(20),'reliable');assert.equal(status(50),'stable');
console.log('BROILER BENCHMARK V1 TESTS: PASS');
