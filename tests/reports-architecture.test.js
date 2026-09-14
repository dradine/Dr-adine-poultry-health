"use strict";
const fs=require("fs"),vm=require("vm"),assert=require("assert");
function load(path,context){vm.runInNewContext(fs.readFileSync(path,"utf8"),context,{filename:path})}
const context={console};context.window=context;
load("broiler-official-standards-v1.js",context);
load("broiler-official-standards-global-bridge.js",context);
load("broiler-report-engine.js",context);
assert.ok(context.BROILER_OFFICIAL_STANDARDS_V1,"official registry must be exposed on window");
assert.ok(context.AdineBroilerReportEngine,"broiler engine must register");
const flock={production_type:"broiler",genetics:"Ross",strain:"Ross 308 AP",initial_average_weight_g:44};
const rows=[
  {week_number:1,age_days:7,average_weight_g:214,fcr:.772,cumulative_fcr:.772,standard_weight:214,official_weekly_fcr:.772,official_cumulative_fcr:.772,management_weekly_fcr:0.80,targetAuthority:"canonical-weekly-report"},
  {week_number:2,age_days:14,average_weight_g:540,fcr:.995,cumulative_fcr:.995,standard_weight:540,official_weekly_fcr:1.1411104294478528,official_cumulative_fcr:.995,management_weekly_fcr:1.10,targetAuthority:"canonical-weekly-report"}
];
const out=context.AdineBroilerReportEngine.build(flock,rows);
assert.strictEqual(out.domain,"broiler");
assert.strictEqual(out.rows.length,2);
assert.strictEqual(out.engineVersion,"BROILER-REPORT-V8");
assert.strictEqual(out.standardAuthority,"canonical-weekly-report");

// Actual gain must be separated: week 2 = 540-214 = 326; cumulative = 540-44 = 496.
assert.strictEqual(out.rows[0].weeklyWeightGain,170);
assert.strictEqual(out.rows[0].cumulativeWeightGain,170);
assert.strictEqual(out.rows[1].weeklyWeightGain,326);
assert.strictEqual(out.rows[1].cumulativeWeightGain,496);
assert.notStrictEqual(out.rows[1].weeklyWeightGain,out.rows[1].cumulativeWeightGain);

// Official weight and FCR targets are read directly from the canonical weekly row.
assert.strictEqual(out.rows[0].standardWeight,214);
assert.strictEqual(out.rows[1].standardWeight,540);
assert.strictEqual(out.rows[0].standardCumulativeFcr,.772);
assert.strictEqual(out.rows[1].standardCumulativeFcr,.995);
assert.strictEqual(out.rows[0].standardWeeklyFcr,.772);
assert.ok(Math.abs(out.rows[1].standardWeeklyFcr-1.1411104294478528)<1e-12);
assert.strictEqual(out.rows[0].managementWeeklyFcr,.80);
assert.strictEqual(out.rows[1].managementWeeklyFcr,1.10);
assert.strictEqual(out.rows[0].targetAuthority,"canonical-weekly-report");

// No management target is invented for metrics for which the canonical weekly model has none.
assert.strictEqual(out.rows[0].managementWeight,null);
assert.strictEqual(out.rows[0].managementWeightGain,null);

assert.strictEqual(out.rows[0].fcr,.772);
assert.strictEqual(out.rows[1].cumulativeFcr,.995);
assert.strictEqual(out.rows[0].fcrSource,"canonical-record");
console.log("reports architecture tests: PASS");
