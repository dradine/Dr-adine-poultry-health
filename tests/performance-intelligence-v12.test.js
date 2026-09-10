"use strict";
const fs=require("fs"),vm=require("vm"),assert=require("assert");
const context={console};context.window=context;
vm.runInNewContext(fs.readFileSync("performance-intelligence-v1.js","utf8"),context,{filename:"performance-intelligence-v1.js"});
const A=context.AdinePerformanceIntelligence;
assert.ok(A,"intelligence engine must register");
assert.equal(A.metricDirection("fcr"),"lower");
assert.equal(A.metricDirection("body_weight"),"higher");

/* Strict-score regression checks: adverse deviations must not be promoted
   into an unrealistically positive status. */
const fcr34=A.scoringMeta(1.034,1,"fcr");
assert.ok(fcr34.score<85,"3.4% adverse FCR must not score as good/excellent");
assert.equal(fcr34.status,"watch");
assert.equal(fcr34.labelFa,"قابل قبول");
assert.equal(fcr34.reasonFa.includes("بدتر از مرجع"),true);

const bw56=A.scoringMeta(0.944,1,"body_weight");
assert.ok(bw56.score<85,"5.6% low body weight must not score as good/excellent");
assert.equal(bw56.status,"watch");
assert.equal(bw56.labelFa,"قابل قبول");
assert.equal(bw56.reasonFa.includes("پایین‌تر از هدف"),true);

/* Boundary behavior: 8% adverse FCR remains a watch-level management
   concern, while a deviation beyond 8% becomes critical. */
assert.equal(A.scoringMeta(1.08,1,"fcr").status,"watch");
assert.equal(A.scoringMeta(1.081,1,"fcr").status,"critical");
assert.equal(A.scoringMeta(1,1,"fcr").status,"excellent");
assert.equal(A.scoringMeta(1,1,"body_weight").status,"excellent");

/* Metric-specific uniformity bands must exist so they do not fall through
   to an unrelated generic scoring curve. */
assert.ok(Array.isArray(A.BANDS.uniformity_10));
assert.ok(Array.isArray(A.BANDS.uniformity_15));
assert.equal(A.scoringMeta(80,80,"uniformity_10").status,"excellent");
assert.equal(A.scoringMeta(74,80,"uniformity_10").status,"watch");

assert.equal(A.status(96),"excellent");
assert.equal(A.status(90),"good");
assert.equal(A.status(80),"watch");
assert.equal(A.status(60),"critical");

assert.equal(A.robustTrend([1,1.1,1.2]),null);
assert.equal(A.forecast([1,1.1,1.2]).available,false);
const weightHistory=[{x:7,y:214,standard:214},{x:14,y:540,standard:540},{x:21,y:1012,standard:1012},{x:28,y:1611,standard:1611}];
const forecast=A.forecast(weightHistory,{targetAgeDays:35,futureStandard:2296});
assert.equal(forecast.available,true);
assert.equal(forecast.method,"Theil-Sen age-normalized trend");
assert.ok(Math.abs(forecast.projected_value-2296)<1);
assert.equal(A.adaptiveAlert(weightHistory.slice(0,3),1611,1611,"body_weight").available,false);
assert.equal(A.adaptiveAlert(weightHistory,1611,1611,"body_weight").alert,false);
assert.equal(A.adaptiveAlert(weightHistory,1400,1611,"body_weight").alert,true);
const fcrHistory=[{x:7,y:.772,standard:.772},{x:14,y:1.005,standard:1.005},{x:21,y:1.142,standard:1.142},{x:28,y:1.489,standard:1.498}];
const fcrForecast=A.forecast(fcrHistory,{targetAgeDays:35,futureStandard:1.63});
assert.equal(fcrForecast.available,true);
assert.ok(Number.isFinite(fcrForecast.projected_value));
assert.equal(A.adaptiveAlert(fcrHistory,1.489,1.498,"fcr").available,true);
console.log("performance intelligence strict v2.1 tests: PASS");
