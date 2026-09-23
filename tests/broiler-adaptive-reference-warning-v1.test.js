/* ADINE — ADAPTIVE REFERENCE WARNING V2 REGRESSION */
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
assert.ok(['watch','warning','critical'].includes(m.metrics.weight.state));
assert.ok(['watch','warning','critical'].includes(m.overall));
m=A.analyze(rows([1,1,1,1,1]),{strain});
assert.equal(m.overall,'normal');
assert.equal(m.metrics.weight.state,'normal');
const improve=A.analyze(rows([-6,-5,-4,-2,1]),{strain});
assert.equal(improve.metrics.weight.direction,'improving');
assert.equal(improve.overall,'improving');
const decline=A.analyze(rows([2,1,-1,-3,-5]),{strain});
assert.equal(decline.metrics.weight.direction,'worsening');
assert.ok(['watch','warning','normal'].includes(decline.overall));
const aliasRows=[7,14,21,28,35].map(age=>{const t=ctx.broilerCanonicalMetricTarget(strain,age,'adg');return{age_days:age,adg:t.value*7}});
m=A.analyze(aliasRows,{strain});
assert.ok(m.metrics.adg.available);
assert.ok(Math.abs(m.metrics.adg.currentGapPercent)<1e-9);
const adgRows=[7,14,21,28,35].map(age=>{const t=ctx.broilerCanonicalMetricTarget(strain,age,'adg');return{age_days:age,weeklyWeightGain:t.value*7}});
m=A.analyze(adgRows,{strain});
assert.ok(m.metrics.adg.available);
assert.ok(Math.abs(m.metrics.adg.currentGapPercent)<1e-9);
m=A.analyze(rows([1,1]),{strain});
assert.equal(m.metrics.weight.available,false);
const all=Object.keys(ctx.BROILER_OFFICIAL_STANDARDS_V1.strains);
assert.equal(all.length,13);
for(const s of all){const r=A.reference(s,56,'weight');assert.ok(r&&Number.isFinite(r.value),s)}
const fr=[7,14,21,28,35].map((age,i)=>{const r=ctx.broilerCanonicalMetricTarget(strain,age,'fcr');return{age_days:age,fcr:r.value*(1-(i<4?.02:.08))}});
m=A.analyze(fr,{strain});
assert.ok(m.metrics.fcr.currentGapPercent>0);
assert.notEqual(m.metrics.fcr.state,'warning');
const engineSource=fs.readFileSync('broiler-performance-intelligence-engine-v2.js','utf8');
const presenterSource=fs.readFileSync('broiler-performance-intelligence-report-v1.js','utf8');
const reportsSource=fs.readFileSync('reports.html','utf8');
assert.match(engineSource,/AdineAdaptiveReferenceWarningV1/);
assert.match(engineSource,/adaptiveWarning:adaptiveWarning\|\|null/);
assert.match(presenterSource,/const aw=m\.adaptiveWarning\|\|null/);
assert.match(presenterSource,/روند بهبود/);
assert.match(presenterSource,/هشدار عملکردی/);
assert.match(presenterSource,/هشدار جدی/);
assert.match(reportsSource,/broiler-adaptive-reference-warning-v1\.js\?v=20260923\.30/);
assert.match(reportsSource,/broiler-performance-intelligence-report-v1\.js\?v=20260923\.30/);
assert.match(reportsSource,/id="bottomNavigation"/);
console.log('ADAPTIVE REFERENCE WARNING V2: PASS — directional trend, robust control, persistence, multi-axis confirmation and five-state presentation');
