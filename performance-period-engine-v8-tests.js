(function(g){
"use strict";
function assert(name,condition,detail){if(!condition)throw new Error("FAIL: "+name+(detail?" | "+detail:""));}
function approx(a,b,e){return Math.abs(a-b)<=e;}
function runAdinePeriodEngineTests(){
 const E=g.AdinePerformancePeriodEngineV8;
 if(!E)throw new Error("Canonical engine not loaded");
 const flock={production_type:"broiler",initial_average_weight_g:48};
 const standard={official:{records:[{ageDays:0,bodyWeight:40},{ageDays:7,bodyWeight:120},{ageDays:14,bodyWeight:280},{ageDays:21,bodyWeight:500}]},management:{records:[]}};
 const records=[
  {weekNumber:2,ageDays:14,averageWeight:350,liveBirds:995,mortality:5},
  {weekNumber:1,ageDays:7,averageWeight:199,liveBirds:1000,mortality:0},
  {weekNumber:3,ageDays:21,averageWeight:500,liveBirds:990,mortality:5}
 ];
 const rows=E.enrichRecords(records,flock,standard);
 assert("week 1 boundary",rows[0].weekNumber===1);
 assert("week 2 boundary",rows[1].weekNumber===2);
 assert("week 3 boundary",rows[2].weekNumber===3);
 assert("week 1 period start",rows[0].periodStartAgeDays===1);
 assert("week 1 period end",rows[0].periodEndAgeDays===7);
 assert("week 2 period start",rows[1].periodStartAgeDays===8);
 assert("week 2 period end",rows[1].periodEndAgeDays===14);
 assert("week 1 actual gain",approx(rows[0].weeklyGainG,151,1e-9),String(rows[0].weeklyGainG));
 assert("week 2 actual gain",approx(rows[1].weeklyGainG,151,1e-9),String(rows[1].weeklyGainG));
 assert("week 3 actual gain",approx(rows[2].weeklyGainG,150,1e-9),String(rows[2].weeklyGainG));
 assert("cumulative gain week 2",approx(rows[1].cumulativeGainG,302,1e-9),String(rows[1].cumulativeGainG));
 assert("cumulative gain week 3",approx(rows[2].cumulativeGainG,452,1e-9),String(rows[2].cumulativeGainG));
 assert("week 2 standard absolute weight",approx(rows[1].standardWeightG,280,1e-9),String(rows[1].standardWeightG));
 assert("week 2 standard weekly gain",approx(rows[1].standardWeeklyGainG,160,1e-9),String(rows[1].standardWeeklyGainG));
 assert("week 2 never uses next-week standard",rows[1].standardWeightG!==500);
 assert("week 1 standard gain uses day 0",approx(rows[0].standardWeeklyGainG,80,1e-9),String(rows[0].standardWeeklyGainG));
 assert("week 2 weight deviation",approx(rows[1].weightDeviationPercent,25,1e-9),String(rows[1].weightDeviationPercent));
 assert("week 2 growth deviation",approx(rows[1].growthDeviationPercent,-5.625,1e-9),String(rows[1].growthDeviationPercent));
 const ev=E.evaluate(flock,records,standard);
 assert("evaluation has latest",!!ev.latest);
 assert("evaluation strict score <=100",ev.score<=100);
 assert("evaluation covers 3 weeks",ev.weekly.length===3);
 const missing=E.enrichRecords([{weekNumber:1,ageDays:7,averageWeight:199}],{production_type:"broiler"},standard);
 assert("missing initial does not invent gain",missing[0].weeklyGainG===null);
 const boundary=E.enrichRecords([{ageDays:1,averageWeight:60},{ageDays:8,averageWeight:120}],flock,standard);
 assert("day 1 is week 1",boundary[0].weekNumber===1);
 assert("day 8 is week 2",boundary[1].weekNumber===2);
 return {passed:true,count:23,version:E.VERSION};
}
g.runAdinePeriodEngineTests=runAdinePeriodEngineTests;
})(window);