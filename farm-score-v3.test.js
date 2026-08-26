global.window=global;
global.document={addEventListener(){}};
global.normalizeReportProductionType=(v)=>v;
global.getReportStandardMeta=(obj,metric)=>({value:obj[metric]??null});
global.getActualSpecializedMetric=(r,metric)=>r[metric]??null;
require('./farm-score-v3.js');
const e=global.AdineFarmScoreV3;
function assert(cond,msg){if(!cond)throw new Error(msg)}
function near(actual,expected,tol,msg){assert(Math.abs(actual-expected)<=tol,`${msg}: ${actual} != ${expected}`)}
near(e.scoreDeviation(100,100,'more'),80,0.01,'more @ 0%');
near(e.scoreDeviation(102,100,'more'),90,0.01,'more @ +2%');
near(e.scoreDeviation(104,100,'more'),100,0.01,'more @ +4%');
near(e.scoreDeviation(96,100,'more'),40,0.01,'more @ -4%');
near(e.scoreDeviation(100,100,'less'),82,0.01,'less @ 0%');
near(e.scoreDeviation(104,100,'less'),34,0.01,'less @ +4%');
near(e.scoreDeviation(98,100,'target'),68,0.01,'target @ -2%');
near(e.scoreDeviation(102,100,'target'),96,0.01,'target @ +2%');
const standards={weight:1000,fcr:2,mortality:1,uniformity10:80,cv:10,feedPerBird:110,eggProduction:90,eggWeight:60,fertility:90,hatchability:85};
function rows(actual={},extras={}){return Array.from({length:4},(_,i)=>({weekNumber:i+1,ageDays:7*(i+1),averageWeight:actual.weight??1000,fcr:actual.fcr??2,mortality:actual.mortality??1,liveBirds:999,uniformity10:actual.uniformity??80,cv:actual.cv??10,feedPerBirdG:actual.feed??110,...extras}));}
for(const type of ['broiler','pullet','layer','breeder']){const extras=type==='layer'?{eggProduction:90,eggWeight:60}:type==='breeder'?{eggProduction:90,fertility:90,hatchability:85}:{};const r=e.evaluate({flock:{production_type:type},records:rows({},extras),standardObj:standards});assert(r.score!==null,`${type}: score missing`);assert(r.score<90,`${type}: exact-standard performance must not be elite; got ${r.score}`);assert(r.score>=70,`${type}: exact-standard performance unexpectedly harsh; got ${r.score}`);}
const bad=e.evaluate({flock:{production_type:'broiler'},records:rows({weight:900,fcr:2.2,mortality:1.5,uniformity:65,cv:14,feed:125}),standardObj:standards});assert(bad.score<50,`bad broiler should be <50; got ${bad.score}`);
const elite=e.evaluate({flock:{production_type:'broiler'},records:rows({weight:1020,fcr:1.92,mortality:0.96,uniformity:83.2,cv:9.6,feed:105}),standardObj:standards});assert(elite.score>=90,`elite broiler should reach 90+; got ${elite.score}`);
const sparse=e.evaluate({flock:{production_type:'broiler'},records:[rows()[0]],standardObj:standards});assert(sparse.score<=69,`one-week data must be capped <=69; got ${sparse.score}`);
console.log('farm-score-v3: PASS — strict deviation curves, all 4 types, poor/elite/sparse cases');
