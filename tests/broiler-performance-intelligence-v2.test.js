const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('broiler-performance-intelligence-engine-v2.js','utf8');
const sandbox={console};vm.createContext(sandbox);vm.runInContext(code,sandbox);const E=sandbox.AdineBroilerPerformanceIntelligenceV2;
assert(E&&E.version==='BROILER-PI-V3.2');
const base={standardWeight:1000,standardWeeklyFcr:1.30,standardCumulativeFcr:1.30,standardWeeklyWeightGain:60,standardMortalityPercent:1,standardCv:10,standardUniformity10:80,standardUniformity15:90,standardFeed:100,standardWater:180,standardWaterFeedRatio:1.8};
function row(x){return Object.assign({age:35,week:5,weight:1000,fcr:1.30,cumulativeFcr:1.30,weeklyWeightGain:60,mortalityPercent:1,cv:10,uniformity10:80,uniformity15:90,feed:100,water:180,waterFeedRatio:1.8,epef:400},base,x)}
let m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({}),row({})]);assert.strictEqual(m.status,'good');assert(m.insights.some(x=>x.code==='balanced_growth'));
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({weight:900,fcr:1.45}),row({weight:900,fcr:1.45})]);assert(m.insights.some(x=>x.code==='growth_efficiency_down'));
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({weight:1050,fcr:1.45}),row({weight:1050,fcr:1.45})]);assert(m.insights.some(x=>x.code==='growth_efficiency_tradeoff'));
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({weight:900,weeklyWeightGain:55}),row({weight:900,weeklyWeightGain:65})]);assert(m.insights.some(x=>x.code==='recovery'));
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({cv:10,uniformity10:80}),row({cv:18,uniformity10:70})]);assert(m.insights.some(x=>x.code==='uniformity_deterioration'));
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({epef:505}),row({epef:505})]);assert.strictEqual(m.epefInfo.status,'context_only');
m=E.build({genetics:'Cobb',strain:'Cobb 500'},[row({epef:505}),row({epef:505})]);assert.strictEqual(m.epefInfo.status,'context_only');
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({canonicalTargets:{weight:1017,fcr:1.30,cumulativeFcr:1.30,adg:60,mortality:1,cv:10,u10:80,u15:90,feed:100,water:180,wfr:1.8},weight:1017})]);assert.strictEqual(m.states.weight.target,1017);assert.strictEqual(m.states.weight.targetAuthority,'canonical-weekly-report');
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({standardWeight:null,standardWeeklyFcr:null,standardCumulativeFcr:null,standardWeeklyWeightGain:null,standardMortalityPercent:null,standardCv:null,standardUniformity10:null,standardUniformity15:null,standardFeed:null,standardWater:null,standardWaterFeedRatio:null,canonicalTargets:{}})]);for(const k of ['weight','fcr','cumulativeFcr','adg','mortality','cv','u10','u15','feed','water','wfr'])assert.strictEqual(m.states[k].official.status,'unavailable');assert.strictEqual(m.states.weight.status,'unavailable');
// Immediate previous-week comparison: current distance to the current weekly target is smaller,
// so the engine must report both "closer" and target-relative "improving".
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[
  row({week:4,weight:920,standardWeight:1000}),
  row({week:5,weight:970,standardWeight:1000})
]);
assert.strictEqual(m.states.weight.official.trend.movement,'closer');
assert.strictEqual(m.states.weight.official.trend.performanceDirection,'improving');
assert(m.states.weight.official.trend.currentDistancePercent < m.states.weight.official.trend.previousDistancePercent);
assert.strictEqual(m.states.weight.official.trend.pointsUsed,2);
// Moving farther from a lower-is-better target must be reported as worsening.
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[
  row({week:4,fcr:1.34,standardWeeklyFcr:1.30}),
  row({week:5,fcr:1.40,standardWeeklyFcr:1.30})
]);
assert.strictEqual(m.states.fcr.official.trend.movement,'farther');
assert.strictEqual(m.states.fcr.official.trend.performanceDirection,'worsening');
// A changing weekly target is handled against each week's own canonical target,
// not against a fixed target copied from the previous week.
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[
  row({week:4,weight:950,standardWeight:1000}),
  row({week:5,weight:1000,standardWeight:1050})
]);
assert.strictEqual(m.states.weight.official.trend.movement,'stable');
console.log('BROILER PERFORMANCE INTELLIGENCE V3.2 TESTS: PASS');