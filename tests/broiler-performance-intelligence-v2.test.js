const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('broiler-performance-intelligence-engine-v2.js','utf8');
const sandbox={console};vm.createContext(sandbox);vm.runInContext(code,sandbox);
const E=sandbox.AdineBroilerPerformanceIntelligenceV2;
assert(E&&E.version==='BROILER-PI-V6.4');

const base={standardWeight:1000,standardWeeklyFcr:1.30,standardCumulativeFcr:1.30,standardWeeklyWeightGain:60,standardMortalityPercent:1,standardCv:10,standardUniformity10:80,standardUniformity15:90,standardFeed:100,standardWater:180,standardWaterFeedRatio:1.8,standardEpef:400};
function row(x){return Object.assign({age:35,week:5,weight:1000,fcr:1.30,cumulativeFcr:1.30,weeklyWeightGain:60,mortalityPercent:1,cv:10,uniformity10:80,uniformity15:90,feed:100,water:180,waterFeedRatio:1.8,epef:400},base,x)}

let m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({}),row({})]);
assert.strictEqual(m.status,'good');
assert(m.states.weight.official.status==='on_target'||m.states.weight.official.status==='good');
assert.notStrictEqual(m.states.fcr.official.status,'unavailable');

m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({weight:900,fcr:1.45}),row({weight:900,fcr:1.45})]);
assert.strictEqual(m.states.weight.official.status,'critical');
assert.strictEqual(m.states.fcr.official.status,'critical');
assert(m.insights.some(x=>x.code==='growth_efficiency_down'));

m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({weight:1050,fcr:1.45}),row({weight:1050,fcr:1.45})]);
assert(['good','excellent'].includes(m.states.weight.official.status));
assert(['watch','critical'].includes(m.states.fcr.official.status));
assert(m.insights.some(x=>x.code==='growth_efficiency_tradeoff'));

m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({cv:10,uniformity10:80}),row({cv:18,uniformity10:70})]);
assert.strictEqual(m.states.cv.official.status,'critical');
assert.strictEqual(m.states.u10.official.status,'critical');
assert(m.insights.some(x=>x.code==='distribution_deterioration'));

m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({canonicalTargets:{weight:1017,fcr:1.30,cumulativeFcr:1.30,adg:60,mortality:1,cv:10,u10:80,u15:90,feed:100,water:180,wfr:1.8,epef:400},weight:1017})]);
assert.strictEqual(m.states.weight.official.target,1017);
assert.strictEqual(m.states.epef.official.target,400);

m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({standardWeight:null,standardWeeklyFcr:null,standardCumulativeFcr:null,standardWeeklyWeightGain:null,standardMortalityPercent:null,standardCv:null,standardUniformity10:null,standardUniformity15:null,standardFeed:null,standardWater:null,standardWaterFeedRatio:null,standardEpef:null,canonicalTargets:{}})]);
for(const k of ['weight','fcr','cumulativeFcr','adg','mortality','cv','u10','u15','feed','water','wfr','epef'])assert.strictEqual(m.states[k].official.status,'unavailable');

m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({week:4,weight:920,standardWeight:1000}),row({week:5,weight:970,standardWeight:1000})]);
assert.strictEqual(m.states.weight.trend.movement,'closer');
assert.strictEqual(m.states.weight.trend.direction,'improving');

m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({week:4,fcr:1.34,standardWeeklyFcr:1.30}),row({week:5,fcr:1.40,standardWeeklyFcr:1.30})]);
assert.strictEqual(m.states.fcr.trend.movement,'farther');
assert.strictEqual(m.states.fcr.trend.direction,'worsening');

console.log('BROILER PERFORMANCE INTELLIGENCE V6.4 TESTS: PASS');
