"use strict";
const fs=require("fs"),vm=require("vm"),assert=require("assert");
function load(path,context){vm.runInNewContext(fs.readFileSync(path,"utf8"),context,{filename:path})}
const context={console};context.window=context;
load("broiler-official-standards-v1.js",context);
load("broiler-report-engine.js",context);
assert.ok(context.BROILER_OFFICIAL_STANDARDS_V1,"canonical broiler standards engine must be exposed");
assert.ok(context.broilerCanonicalMetricTarget,"canonical metric resolver must be exposed");
assert.strictEqual(context.BROILER_OFFICIAL_STANDARDS_V1.version,"BROILER-CANONICAL-STANDARDS-V4");
assert.ok(context.AdineBroilerReportEngine,"broiler engine must register");
const flock={production_type:"broiler",genetics:"Ross",strain:"Ross 308 AP",initial_average_weight_g:44};
const rows=[
  {week_number:1,age_days:7,average_weight_g:214,fcr:.772,cumulative_fcr:.772},
  {week_number:2,age_days:14,average_weight_g:540,fcr:.995,cumulative_fcr:.995}
];
const out=context.AdineBroilerReportEngine.build(flock,rows);
assert.strictEqual(out.domain,"broiler");
assert.strictEqual(out.rows.length,2);
assert.strictEqual(out.rows[0].standardWeight,214);
assert.strictEqual(out.rows[1].standardWeight,540);
assert.strictEqual(out.rows[0].standardCumulativeFcr,.772);
assert.strictEqual(out.rows[1].standardCumulativeFcr,.995);
assert.strictEqual(out.rows[0].standardWeeklyWeightGain,170);
assert.strictEqual(out.rows[1].standardWeeklyWeightGain,326);
const expectedWeek2=(.995*540-.772*214)/(540-326+326-214);
assert.ok(Math.abs(out.rows[1].standardWeeklyFcr-expectedWeek2)<1e-12);
assert.ok(Math.abs(out.rows[1].standardWeeklyFcr-1.1112883436)<1e-9);
assert.strictEqual(out.rows[0].mortalityTarget,1);
assert.strictEqual(out.rows[0].cvStandard,8);
assert.strictEqual(out.rows[0].uniformity10Standard,79);
assert.strictEqual(out.rows[0].uniformity15Standard,94);
assert(out.rows[0].feedTarget>0);
assert(out.rows[0].waterTarget>0);
assert.strictEqual(out.rows[0].waterFeedRatioTarget,1.8);
assert(out.rows[0].epefTarget>0);
assert.strictEqual(out.rows[0].weightSource,"canonical-broiler-standards-engine");
assert.strictEqual(out.rows[0].targetAuthority,"canonical-broiler-standards-engine");
console.log("reports architecture single-source tests: PASS");
