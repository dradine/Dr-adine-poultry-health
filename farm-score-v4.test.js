global.window=global;global.document={addEventListener(){}};
global.normalizeReportProductionType=v=>v;
global.normalizeReportRecord=r=>r;
global.getReportStandardMeta=(std,key)=>({value:std[key]??null});
require('./farm-score-v4.js');const e=global.AdineFarmScoreV4;
function ok(x,m){if(!x)throw Error(m)}
function near(a,b,m){ok(Math.abs(a-b)<.01,m+': '+a)}
near(e.scoreDeviation(100,100,'higher'),80,'higher standard');near(e.scoreDeviation(102,100,'higher'),90,'higher +2');near(e.scoreDeviation(104,100,'higher'),100,'higher +4');near(e.scoreDeviation(104,100,'lower'),34,'lower +4');near(e.scoreDeviation(98,100,'target'),68,'target -2');near(e.scoreDeviation(102,100,'target'),96,'target +2');
const std={bodyWeight:1000,fcr:2,mortality:1,livability:99,uniformity10:80,cv:10,dailyFeed:110,dailyWater:160,henDayProduction:90,eggWeight:60,fertility:90,hatchability:85};
function rec(a={}){return {weekNumber:a.weekNumber||1,ageDays:a.ageDays||7,liveBirds:a.liveBirds??990,mortality:a.mortality??10,averageWeight:a.weight??1000,cv:a.cv??10,uniformity10:a.uniformity??80,feedPerBirdG:a.feed??110,waterPerBirdMl:a.water??160,fcr:a.fcr??2,productionMetrics:{hen_day_pct:a.production??90,egg_weight_g:a.eggWeight??60,fertility_pct:a.fertility??90,hatchability_pct:a.hatchability??85,egg_mass_kg:a.eggMass??10}}}
for(const type of ['broiler','pullet','layer','breeder']){const rs=[1,2,3,4].map(i=>rec({weekNumber:i,ageDays:i*7}));const r=e.evaluate({flock:{production_type:type},records:rs,standardObj:std});ok(r.score!==null,type+' score missing');ok(r.score<90,type+' exact standard became elite: '+r.score);}
const bad=e.evaluate({flock:{production_type:'broiler'},records:[1,2,3,4].map(i=>rec({weekNumber:i,ageDays:i*7,weight:900,fcr:2.2,mortality:30,uniformity:60,cv:15,feed:125})),standardObj:std});ok(bad.score<50,'bad flock not sufficiently penalized: '+bad.score);
const elite=e.evaluate({flock:{production_type:'broiler'},records:[1,2,3,4].map(i=>rec({weekNumber:i,ageDays:i*7,weight:1030,fcr:1.9,mortality:1,uniformity:84,cv:8,feed:108})),standardObj:std});ok(elite.score>=90,'elite flock failed 90+: '+elite.score);
const one=e.evaluate({flock:{production_type:'broiler'},records:[rec()],standardObj:std});ok(one.score<=69,'one-week cap failed: '+one.score);
const weightPenalty=e.evaluate({flock:{production_type:'broiler'},records:[1,2,3,4].map(i=>rec({weekNumber:i,ageDays:i*7,weight:900})),standardObj:std});ok(weightPenalty.score<70,'weight deviation not penalized: '+weightPenalty.score);
console.log('PASS: V4 deviation curves + all 4 production types + mortality + weight + FCR + uniformity/CV + data-quality caps');