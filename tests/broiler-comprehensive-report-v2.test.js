const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context={console};context.window=context;
vm.runInNewContext(fs.readFileSync('broiler-comprehensive-report-engine-v2.js','utf8'),context);
const E=context.AdineBroilerComprehensiveReportEngineV2;
assert.ok(E&&E.version==='BROILER-COMPREHENSIVE-V2');
const flock={id:'test-flock',production_type:'broiler',strain:'Ross 308 AP',initial_bird_count:10000,initial_average_weight_g:44};
const rows=[
 {week_number:1,age_days:7,average_weight_g:214,fcr:.78,cumulative_fcr:.772,mortality_count:20,live_birds:9980,cv:12,uniformity_10:75,uniformity_15:88,feed_total_kg:1200,weights:[200,210,215,220,225]},
 {week_number:2,age_days:14,average_weight_g:540,fcr:1.13,cumulative_fcr:.995,mortality_count:25,live_birds:9955,cv:10,uniformity_10:80,uniformity_15:90,feed_total_kg:2200,weights:[500,520,540,560,580]},
 {week_number:3,age_days:21,average_weight_g:1033,fcr:1.27,cumulative_fcr:1.13,mortality_count:30,live_birds:9925,cv:9,uniformity_10:83,uniformity_15:92,feed_total_kg:3400,weights:[950,1000,1030,1060,1100]}
];
const canonical={rows:rows.map((x,i)=>({raw:x,index:i,week:i+1,age:x.age_days,benchmarkAgeDays:x.age_days,weight:x.average_weight_g,standardWeight:x.average_weight_g,weeklyWeightGain:i?x.average_weight_g-rows[i-1].average_weight_g:x.average_weight_g-44,standardWeeklyWeightGain:i?x.average_weight_g-rows[i-1].average_weight_g:x.average_weight_g-44,fcr:x.fcr,standardWeeklyFcr:x.fcr,cumulativeFcr:x.cumulative_fcr,standardCumulativeFcr:x.cumulative_fcr,mortalityCount:x.mortality_count,liveBirds:x.live_birds,cv:x.cv,uniformity10:x.uniformity_10,uniformity15:x.uniformity_15,feed:x.feed_total_kg}))};
const model=E.build(flock,rows,{build:()=>canonical});
assert.equal(model.domain,'broiler');assert.equal(model.rows.length,3);assert.equal(model.readOnly,true);assert.equal(model.sampleWeights.length,5);assert.equal(model.cumulativeMortalityCount,75);assert(Math.abs(model.cumulativeMortalityPercent-0.75)<1e-9);assert.equal(model.rows[2].weightGapPercent,0);assert.equal(model.rows[2].gainGapPercent,0);assert(model.trends.weight.available);assert(model.trends.fcr.available);assert(model.score!==null);
const layer=E.build({...flock,production_type:'layer'},rows,{build:()=>canonical});assert.equal(layer.rows.length,0);assert.equal(layer.domain,'broiler');
console.log('Broiler comprehensive V2 regression: PASS');