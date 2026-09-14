const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('broiler-performance-intelligence-engine-v2.js','utf8');
const sandbox={console};vm.createContext(sandbox);vm.runInContext(code,sandbox);const E=sandbox.AdineBroilerPerformanceIntelligenceV2;
assert(E&&E.version==='BROILER-PI-V3');
const base={standardWeight:1000,standardWeeklyFcr:1.05,standardCumulativeFcr:1.05,standardWeeklyWeightGain:60,standardMortalityPercent:1,standardCv:10,standardUniformity10:80,standardUniformity15:90};
const mgmt={managementWeight:1000,managementWeeklyFcr:1.05,managementCumulativeFcr:1.05,managementWeeklyWeightGain:60,managementMortalityPercent:1,managementCv:10,managementUniformity10:80,managementUniformity15:90};
function row(x){return Object.assign({week:1,age:7,weight:1000,fcr:1.05,cumulativeFcr:1.05,weeklyWeightGain:60,mortalityPercent:1,cv:10,uniformity10:80,uniformity15:90,epef:null},base,mgmt,x)}
// 1 raw FCR worsens but target-relative FCR improves: 1.00/1.05 -> 1.02/1.08.
let m=E.build({genetics:'Ross',strain:'Ross 308 AP'},[row({week:4,age:28,fcr:1.00,standardWeeklyFcr:1.05,managementWeeklyFcr:1.05}),row({week:5,age:35,fcr:1.02,standardWeeklyFcr:1.08,managementWeeklyFcr:1.08})]);
assert(Math.abs(m.states.fcr.rawChange-0.02)<1e-12);assert.strictEqual(m.states.fcr.official.trend.direction,'improving');assert(m.states.fcr.official.trend.changePp>0);assert.strictEqual(m.states.fcr.management.trend.direction,'improving');
// 2 raw weight increases but target-relative weight deteriorates.
m=E.build({},[row({week:4,age:28,weight:1000,standardWeight:1000,managementWeight:1000}),row({week:5,age:35,weight:1020,standardWeight:1100,managementWeight:1100})]);assert(m.states.weight.rawChange>0);assert.strictEqual(m.states.weight.official.trend.direction,'deteriorating');
// 3 target-relative weight improves.
m=E.build({},[row({week:4,age:28,weight:900,standardWeight:1000,managementWeight:1000}),row({week:5,age:35,weight:1080,standardWeight:1100,managementWeight:1100})]);assert.strictEqual(m.states.weight.official.trend.direction,'improving');
// 4 official and management trends are independent.
m=E.build({},[row({week:4,age:28,weight:1000,standardWeight:1000,managementWeight:900}),row({week:5,age:35,weight:1020,standardWeight:1000,managementWeight:1100})]);assert.strictEqual(m.states.weight.official.trend.direction,'improving');assert.strictEqual(m.states.weight.management.trend.direction,'deteriorating');
// 5 disagreement remains visible in current state.
assert.strictEqual(m.states.weight.official.relativeStatus,'better');assert.strictEqual(m.states.weight.management.relativeStatus,'below_target');
// 6 three-week trajectory is target-relative, not raw.
m=E.build({},[row({week:1,age:7,weight:1000,standardWeight:1000,managementWeight:1000}),row({week:2,age:14,weight:1040,standardWeight:1060,managementWeight:1060}),row({week:3,age:21,weight:1090,standardWeight:1120,managementWeight:1120})]);assert.strictEqual(m.states.weight.official.trend.pointsUsed,3);assert.strictEqual(m.states.weight.official.trend.direction,'deteriorating');assert(m.states.weight.official.trend.trajectoryChangePp<0);
// 7 missing target => unavailable, never guessed.
m=E.build({},[row({week:1,standardWeight:null,managementWeight:null}),row({week:2,standardWeight:null,managementWeight:null})]);assert.strictEqual(m.states.weight.official.status,'unavailable');assert.strictEqual(m.states.weight.official.trend.direction,'unavailable');
// 8 missing EPEF is not synthesized.
assert.strictEqual(m.epef,null);assert.strictEqual(m.epefInfo.status,'unavailable');
// 9 duplicate weeks/ages and 10 out-of-order input are reported before sorting.
m=E.build({},[row({week:2,age:14}),row({week:2,age:7}),row({week:1,age:21})]);assert(m.validation.some(x=>x.type==='duplicate_week'));assert(m.validation.some(x=>x.type==='duplicate_age'));assert(m.validation.some(x=>x.type==='out_of_order_age'));
// 11 negative values are invalid data.
m=E.build({},[row({week:1,age:7,weight:-1})]);assert(m.validation.some(x=>x.type==='negative_value'));
// 12 cumulative FCR uses its own current/previous targets.
m=E.build({},[row({week:4,age:28,cumulativeFcr:1.20,standardCumulativeFcr:1.30,managementCumulativeFcr:1.28}),row({week:5,age:35,cumulativeFcr:1.25,standardCumulativeFcr:1.40,managementCumulativeFcr:1.36})]);assert.strictEqual(m.states.cumulativeFcr.official.trend.direction,'improving');assert.strictEqual(m.states.cumulativeFcr.management.trend.direction,'improving');
// 13 raw change is descriptive only and never determines trend.
assert.strictEqual(m.rawTrendIsDescriptiveOnly,true);assert(Object.prototype.hasOwnProperty.call(m.states.fcr,'rawChange'));
// 14 exact target is on-target and presentation status must not be a warning.
m=E.build({},[row({week:1,age:7,weight:1000,standardWeight:1000,managementWeight:1000})]);assert.strictEqual(m.states.weight.official.relativeStatus,'on_target');assert.strictEqual(m.states.weight.official.status,'good');
// 15 current/previous target fields are paired to the same row.
m=E.build({},[row({week:1,age:7,weight:900,standardWeight:1000}),row({week:2,age:14,weight:1100,standardWeight:1200})]);assert.strictEqual(m.states.weight.official.trend.previous,900);assert.strictEqual(m.states.weight.official.trend.previousTarget,1000);assert.strictEqual(m.states.weight.official.trend.current,1100);assert.strictEqual(m.states.weight.official.trend.currentTarget,1200);
// 16 duplicate evaluation dates are a data-quality issue.
m=E.build({},[row({week:1,age:7,evaluation_date:'2026-09-01'}),row({week:2,age:14,evaluation_date:'2026-09-01'})]);assert(m.validation.some(x=>x.type==='duplicate_evaluation_date'));
// 17 management target is unavailable when canonical management data is absent; it is never copied from official.
m=E.build({},[row({week:1,age:7,standardWeight:1100,managementWeight:null})]);assert.strictEqual(m.states.weight.official.target,1100);assert.strictEqual(m.states.weight.management.target,null);assert.strictEqual(m.states.weight.management.status,'unavailable');
console.log('BROILER PERFORMANCE INTELLIGENCE V3 TESTS: PASS');
