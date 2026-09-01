"use strict";
const fs=require("fs"),vm=require("vm"),assert=require("assert");
const context={console};context.window=context;
for(const file of ["broiler-official-standards-v1.js","broiler-official-standards-global-bridge.js","broiler-report-engine.js","performance-intelligence-v1.js"]){vm.runInNewContext(fs.readFileSync(file,"utf8"),context,{filename:file})}
const engine=context.AdineBroilerReportEngine,A=context.AdinePerformanceIntelligence;
const flock={production_type:"broiler",genetics:"Aviagen",strain:"Arbor Acres Plus S",initial_average_weight_g:42};
const rows=[
 {week_number:1,age_days:7,average_weight_g:214,fcr:.780,cumulative_fcr:.780},
 {week_number:2,age_days:14,average_weight_g:540,fcr:1.005,cumulative_fcr:1.005},
 {week_number:3,age_days:21,average_weight_g:1006,fcr:1.142,cumulative_fcr:1.142},
 {week_number:4,age_days:28,average_weight_g:1611,fcr:1.489,cumulative_fcr:1.285}
];
const model=engine.build(flock,rows),r=model.rows[3];
assert.equal(r.weight,1611);assert.equal(r.standardWeight,1611);assert.equal(r.weeklyWeightGain,605);assert.equal(r.cumulativeWeightGain,1569);assert.equal(r.fcr,1.489);assert.equal(r.cumulativeFcr,1.285);assert.ok(Math.abs(r.standardWeeklyFcr-1.498)<0.002);assert.equal(r.standardCumulativeFcr,1.285);
(async()=>{
 const weight=await A.analyze({ageDays:28,metric:"body_weight",currentValue:r.weight,targetOverride:r.standardWeight,targetSourceType:"official",targetSourceName:r.weightSourceLabel,history:model.rows.slice(0,3).map(x=>({x:x.age,y:x.weight,standard:x.standardWeight}))});
 const weekly=await A.analyze({ageDays:28,metric:"fcr",currentValue:r.fcr,targetOverride:r.standardWeeklyFcr,targetSourceType:"official",targetSourceName:r.fcrSourceLabel,history:model.rows.slice(0,3).map(x=>({x:x.age,y:x.fcr,standard:x.standardWeeklyFcr}))});
 const cumulative=await A.analyze({ageDays:28,metric:"cumulative_fcr",currentValue:r.cumulativeFcr,targetOverride:r.standardCumulativeFcr,targetSourceType:"official",targetSourceName:r.fcrSourceLabel,history:model.rows.slice(0,3).map(x=>({x:x.age,y:x.cumulativeFcr,standard:x.standardCumulativeFcr}))});
 assert.equal(weight.status,"excellent");assert.equal(weight.score,100);assert.equal(weekly.status,"excellent");assert(weekly.target>1.49&&weekly.target<1.50);assert.equal(cumulative.status,"excellent");assert.equal(cumulative.score,100);
 console.log("Arbor Acres Plus S broiler intelligence integration: PASS");
})().catch(e=>{console.error(e);process.exit(1)});
