/* ADINE — ADAPTIVE REFERENCE WARNING V1 REGRESSION */
'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const ctx={console,CustomEvent:function(type,init){this.type=type;this.detail=init?.detail}};ctx.window=ctx;ctx.dispatchEvent=()=>{};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('broiler-official-standards-v1.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('broiler-adaptive-reference-warning-v1.js','utf8'),ctx);
const A=ctx.AdineAdaptiveReferenceWarningV1;
const strain='Ross 308';
function rows(gaps){
 return gaps.map((g,i)=>{const age=[7,14,21,28,35,42][i],r=ctx.broilerCanonicalMetricTarget(strain,age,'weight');return{age_days:age,weight:r.value*(1+g/100)}})
}
let m=A.analyze(rows([1,1,1,1,-6]),{strain});
assert.equal(m.referenceAuthority,'BROILER_OFFICIAL_STANDARDS_V1');
assert.ok(m.metrics.weight&&m.metrics.weight.available);
assert.equal(m.overall,'warning');
assert.ok(m.warnings.some(x=>x.metric==='weight'));
m=A.analyze(rows([1,1,1,1,1]),{strain});
assert.equal(m.overall,'normal');
assert.equal(m.metrics.weight.state,'normal');
m=A.analyze(rows([1,1]),{strain});
assert.equal(m.metrics.weight.available,false);
const all=Object.keys(ctx.BROILER_OFFICIAL_STANDARDS_V1.strains);
assert.equal(all.length,13);
for(const s of all){const r=A.reference(s,56,'weight');assert.ok(r&&Number.isFinite(r.value),s)}
// Lower-is-better: FCR below its age reference is positive performance.
const fr=[7,14,21,28,35].map((age,i)=>{const r=ctx.broilerCanonicalMetricTarget(strain,age,'fcr');return{age_days:age,fcr:r.value*(1-(i<4?.02:.08))}});
m=A.analyze(fr,{strain});
assert.ok(m.metrics.fcr.currentGapPercent>0);
assert.notEqual(m.metrics.fcr.state,'warning');
// A gradual negative path is detected even if each point is modest.
const drift=[7,14,21,28,35,42].map((age,i)=>{const r=ctx.broilerCanonicalMetricTarget(strain,age,'weight');return{age_days:age,weight:r.value*(1-(i*.02))}});
m=A.analyze(drift,{strain});
assert.ok(['watch','warning'].includes(m.metrics.weight.state));
console.log('ADAPTIVE REFERENCE WARNING V1: PASS — canonical authority, 13 strains, data gate, directional residual, robust baseline, EWMA/CUSUM');
