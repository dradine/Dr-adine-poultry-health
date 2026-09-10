"use strict";
const fs=require("fs"),vm=require("vm"),assert=require("assert");
function load(path,ctx={}){const c={console,...ctx};c.window=c;c.globalThis=c;vm.runInNewContext(fs.readFileSync(path,"utf8"),c,{filename:path});return c;}
const c=load("broiler-comprehensive-report-engine-v1.js");
assert.ok(c.AdineBroilerComprehensiveReportEngine,"comprehensive engine must register");
const domain={build:(flock,rows)=>({rows:rows.map(r=>({raw:r,week:r.week_number,age:r.age_days,weight:r.average_weight_g,standardWeight:r.standard_weight,weeklyWeightGain:r.weekly_gain,fcr:r.fcr,cumulativeFcr:r.cumulative_fcr,standardWeeklyFcr:r.standard_weekly_fcr,standardCumulativeFcr:r.standard_cumulative_fcr,liveBirds:r.live_birds,cv:r.cv,uniformity10:r.uniformity_10,uniformity15:r.uniformity_15}))})};
const flock={id:"f1",production_type:"broiler",initial_birds:10000,initial_average_weight_g:45};
const raw=[
 {week_number:3,age_days:21,average_weight_g:900,standard_weight:910,weekly_gain:410,fcr:1.20,cumulative_fcr:1.10,standard_weekly_fcr:1.18,standard_cumulative_fcr:1.08,mortality_count:40,mortality:0.40,live_birds:9850,cv:9.5,uniformity_10:82,uniformity_15:92},
 {week_number:1,age_days:7,average_weight_g:190,standard_weight:195,weekly_gain:145,fcr:0.90,cumulative_fcr:0.90,standard_weekly_fcr:0.88,standard_cumulative_fcr:0.88,mortality_count:80,mortality:0.80,live_birds:9920,cv:11,uniformity_10:78,uniformity_15:88},
 {week_number:2,age_days:14,average_weight_g:490,standard_weight:500,weekly_gain:300,fcr:1.05,cumulative_fcr:1.00,standard_weekly_fcr:1.02,standard_cumulative_fcr:0.99,mortality_count:30,mortality:0.30,live_birds:9890,cv:10,uniformity_10:80,uniformity_15:90}
];
const before=JSON.stringify(raw);const E=c.AdineBroilerComprehensiveReportEngine;const m=E.build(flock,raw,domain);
assert.strictEqual(m.rows.length,3,"rows must be sorted and retained");
assert.deepStrictEqual(Array.from(m.rows.map(x=>x.week)),[1,2,3],"weeks must sort ascending");
assert.strictEqual(m.cumulativeMortalityCount,150,"cumulative mortality must sum weekly mortality counts");
assert.strictEqual(Number(m.cumulativeMortalityPercent.toFixed(2)),1.5,"cumulative mortality percent must use placement denominator");
assert.strictEqual(m.latestLiveBirds,9850,"latest live birds must come from canonical row");
assert.strictEqual(Number(m.survivalPercent.toFixed(2)),98.5,"survival must use latest canonical live birds");
assert.strictEqual(Number(m.rows[2].weightDeviationPercent.toFixed(2)),-1.10,"weight deviation must be relative to official reference");
assert.strictEqual(JSON.stringify(raw),before,"engine must not mutate weekly input rows");
const missing=E.build({id:"f2",production_type:"broiler"},[{week_number:1,age_days:7,average_weight_g:190}],domain);
assert.ok(missing.missing.includes("تلفات قطعه‌ای در هیچ رکوردی ثبت نشده است"),"missing mortality must be explicit");
assert.ok(missing.missing.includes("تعداد پرنده زنده در رکوردها موجود نیست"),"missing live birds must be explicit");
assert.ok(missing.missing.includes("مرجع رسمی وزن برای این رکوردها بازیابی نشده است"),"missing official weight reference must be explicit");
const t=E.trend([1,2,3,4],"higher");assert.ok(t.available&&t.direction==="up","trend engine must detect increasing series");
console.log("BROILER_COMPREHENSIVE_REPORT_V1: PASS");