const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('broiler-performance-intelligence-engine-v2.js','utf8');
const sandbox={console};vm.createContext(sandbox);vm.runInContext(code,sandbox);const E=sandbox.AdineBroilerPerformanceIntelligenceV2;
assert(E&&E.version==='BROILER-PI-V2');
const base={standardWeight:1000,standardWeeklyFcr:1.30,standardCumulativeFcr:1.30,standardWeeklyWeightGain:60,standardMortalityPercent:1,standardCv:10,standardUniformity10:80,standardUniformity15:90,standardFeed:100,standardWater:180,standardWaterFeedRatio:1.8};
function row(x){return Object.assign({age:35,weight:1000,fcr:1.30,cumulativeFcr:1.30,weeklyWeightGain:60,mortalityPercent:1,cv:10,uniformity10:80,uniformity15:90,feed:100,water:180,waterFeedRatio:1.8,epef:400},base,x)}
let m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({}),row({})]);assert.strictEqual(m.status,'good');assert(m.insights.some(x=>x.code==='balanced_growth'));
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({weight:900,fcr:1.45}),row({weight:900,fcr:1.45})]);assert(m.insights.some(x=>x.code==='growth_efficiency_down'));
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({weight:1050,fcr:1.45}),row({weight:1050,fcr:1.45})]);assert(m.insights.some(x=>x.code==='growth_efficiency_tradeoff'));
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({weight:900,weeklyWeightGain:55}),row({weight:900,weeklyWeightGain:65})]);assert(m.insights.some(x=>x.code==='recovery'));
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({cv:10,uniformity10:80}),row({cv:18,uniformity10:70})]);assert(m.insights.some(x=>x.code==='uniformity_deterioration'));
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({epef:505}),row({epef:505})]);assert.strictEqual(m.epefInfo.status,'excellent');
m=E.build({genetics:'Cobb',strain:'Cobb 500'},[row({epef:505}),row({epef:505})]);assert.notStrictEqual(m.epefInfo.status,'excellent');
m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({standardWeight:null,standardWeeklyFcr:null,standardCumulativeFcr:null,standardWeeklyWeightGain:null,standardMortalityPercent:null,standardCv:null,standardUniformity10:null,standardUniformity15:null,standardFeed:null,standardWater:null,standardWaterFeedRatio:null})]);assert(m.missing.length>=10);assert.strictEqual(m.states.weight.status,'unavailable');
console.log('BROILER PERFORMANCE INTELLIGENCE V2 TESTS: PASS');