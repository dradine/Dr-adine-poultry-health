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
  {week_number:1,age_days:7,average_weight_g:214,fcr:.772,cumulative_fcr:.772},
  {week_number:2,age_days:14,average_weight_g:540,fcr:.995,cumulative_fcr:.995}
];
const out=context.AdineBroilerReportEngine.build(flock,rows);
assert.strictEqual(out.domain,"broiler");
assert.strictEqual(out.rows.length,2);

// Actual gain must be separated: week 2 = 540-214 = 326; cumulative = 540-44 = 496.
assert.strictEqual(out.rows[0].weeklyWeightGain,170);
assert.strictEqual(out.rows[0].cumulativeWeightGain,170);
assert.strictEqual(out.rows[1].weeklyWeightGain,326);
assert.strictEqual(out.rows[1].cumulativeWeightGain,496);
assert.notStrictEqual(out.rows[1].weeklyWeightGain,out.rows[1].cumulativeWeightGain);

// Exact Ross 308 AP official registry must resolve by strain + age.
assert.strictEqual(out.rows[0].standardWeight,214);
assert.strictEqual(out.rows[1].standardWeight,540);
assert.strictEqual(out.rows[0].standardCumulativeFcr,.772);
assert.strictEqual(out.rows[1].standardCumulativeFcr,.995);
assert.strictEqual(out.rows[0].standardWeeklyWeightGain,170);
assert.strictEqual(out.rows[1].standardWeeklyWeightGain,326);

// Weekly official FCR is derived from consecutive official cumulative points.
const expectedWeek2=(.995*540-.772*214)/(540-214);
assert.ok(Math.abs(out.rows[1].standardWeeklyFcr-expectedWeek2)<1e-12);
assert.ok(Math.abs(out.rows[1].standardWeeklyFcr-1.1411104294)<1e-9);

assert.strictEqual(out.rows[0].fcr,.772);
assert.strictEqual(out.rows[1].cumulativeFcr,.995);
assert.strictEqual(out.rows[0].fcrSource,"canonical-record");
console.log("reports architecture tests: PASS");
