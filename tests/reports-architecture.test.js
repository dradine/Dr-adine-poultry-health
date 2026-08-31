"use strict";
const fs=require("fs"),vm=require("vm"),assert=require("assert");
function load(path,context){vm.runInNewContext(fs.readFileSync(path,"utf8"),context,{filename:path})}
const context={console};context.window=context;context.resolvePoultryStandard=({ageDays})=>({weight:ageDays===7?209:ageDays===14?537:null,fcr:ageDays===7?.766:ageDays===14?1.1131:null,weightSource:"official",weightSourceLabel:"test official",fcrSource:"official",fcrSourceLabel:"test official"});
load("broiler-report-engine.js",context);
assert.ok(context.AdineBroilerReportEngine,"broiler engine must register");
const flock={production_type:"broiler",genetics:"Aviagen",strain:"Indian River FF",initial_average_weight_g:42};
const rows=[{week_number:1,age_days:7,average_weight_g:209,fcr:.766,cumulative_fcr:.766},{week_number:2,age_days:14,average_weight_g:537,fcr:1.1131,cumulative_fcr:.996,feed_total_kg:3650.98,water_total_liter:6024.12,live_birds:10000}];
const out=context.AdineBroilerReportEngine.build(flock,rows);
assert.strictEqual(out.domain,"broiler");assert.strictEqual(out.rows.length,2);
assert.strictEqual(out.rows[0].fcr,.766);assert.strictEqual(out.rows[1].cumulativeFcr,.996);
assert.strictEqual(out.rows[0].managementWeightGain,167);
assert.ok(Math.abs(out.rows[1].managementWeeklyFcr-1.3352)<0.0002);
assert.strictEqual(out.rows[0].fcrSource,"canonical-record");
console.log("reports architecture tests: PASS");