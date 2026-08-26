/* ADINE FARM SCORE V4 — STRICT SCIENTIFIC DEVIATION ENGINE
   Reads the real weekly schema through reports-data.js.
   Does not alter weekly calculations or UI. */
(function(g){"use strict";
const VERSION="4.0.0-strict-scientific";
const MAX_WEEKS=4;
const WEIGHTS={
 broiler:{weight:25,fcr:30,mortality:20,uniformity:10,cv:10,feed:5},
 pullet:{weight:30,uniformity:20,cv:15,mortality:15,feed:15,water:5},
 layer:{production:25,fcr:20,mortality:15,weight:15,eggWeight:10,uniformity:5,cv:5,feed:5},
 breeder:{production:20,fertility:20,hatchability:20,weight:15,mortality:10,uniformity:5,fcr:10}
};
const CURVES={
 higher:[[-10,0],[-8,10],[-6,25],[-4,40],[-3,50],[-2,60],[-1,70],[0,80],[1,86],[2,90],[3,96],[4,100]],
 lower:[[-4,100],[-3,96],[-2,92],[-1,87],[0,82],[1,70],[2,58],[3,46],[4,34],[5,24],[6,15],[8,5],[10,0]],
 target:[[-8,0],[-6,15],[-4,35],[-3,50],[-2,68],[-1,78],[0,82],[1,90],[2,96],[3,100],[4,96],[5,88],[6,75],[8,50],[10,20],[12,0]]
};
function n(v){if(v===null||v===undefined||v==="")return null;const x=Number(String(v).replace(/,/g,"").trim());return Number.isFinite(x)?x:null}
function clamp(x,a=0,b=100){return Math.max(a,Math.min(b,x))}
function interp(p,x){if(x<=p[0][0])return p[0][1];for(let i=1;i<p.length;i++){const [x1,y1]=p[i-1],[x2,y2]=p[i];if(x<=x2)return y1+(y2-y1)*(x-x1)/(x2-x1)}return p[p.length-1][1]}
function dev(a,s){return n(a)!==null&&n(s)!==null&&n(s)!==0?(n(a)-n(s))/Math.abs(n(s))*100:null}
function scoreDeviation(a,s,dir){const d=dev(a,s);if(d===null)return null;return clamp(interp(CURVES[dir||"higher"],d))}
function type(f){return typeof normalizeReportProductionType==="function"?normalizeReportProductionType(f?.production_type):String(f?.production_type||"broiler")}
function meta(std,key,age){if(!std||typeof getReportStandardMeta!=="function")return null;try{return n(getReportStandardMeta(std,key,age)?.value)}catch(e){return null}}
function specialized(r,key){const m=r?.productionMetrics||{};return n(({production:m.hen_day_pct??m.egg_production,fertility:m.fertility_pct,hatchability:m.hatchability_pct,eggWeight:m.egg_weight_g,productionHoused:m.hen_housed_pct}[key]))}
function actualFcr(r,t){if(n(r.fcr)!=null)return n(r.fcr);const feed=n(r.feedTotalKg);if(feed==null||feed<=0)return null;if((t==="layer"||t==="breeder")){const em=n(r.productionMetrics?.egg_mass_kg);return em&&em>0?feed/em:null}return null}
function cumulativeMortality(records,flock){
 let initial=n(flock?.initial_bird_count??flock?.initial_birds??flock?.placement_birds??flock?.bird_count);
 const sorted=[...records].sort((a,b)=>n(a.ageDays)-n(b.ageDays));
 const first=sorted[0];
 if(initial==null&&first){const live=n(first.liveBirds),dead=n(first.mortality);if(live!=null&&dead!=null)initial=live+dead}
 if(initial==null||initial<=0)return {value:null,quality:"unknown"};
 const dead=sorted.reduce((s,r)=>s+(n(r.mortality)||0),0);
 return {value:dead/initial*100,quality:(first&&n(first.weekNumber)===1)?"good":"partial"};
}
function metric(record,records,flock,std,k){const age=n(record.ageDays),t=type(flock);
 if(k==="weight")return scoreDeviation(record.averageWeight,meta(std,"bodyWeight",age),"target");
 if(k==="fcr")return scoreDeviation(actualFcr(record,t),meta(std,"fcr",age),"lower");
 if(k==="mortality"){const cm=cumulativeMortality(records,flock).value;let s=meta(std,"mortality",age);if(s==null){const liv=meta(std,"livability",age);if(liv!=null)s=100-liv}return scoreDeviation(cm,s,"lower")}
 if(k==="uniformity")return scoreDeviation(record.uniformity10,meta(std,"uniformity10",age),"higher");
 if(k==="cv"){let s=meta(std,"cv",age);if(s==null){const u=meta(std,"uniformity10",age);if(u!=null){const table={95:5,90:6,85:7,79:8,73:9,68:10,64:11,60:12,56:13,52:14,50:15,47:16};const nearest=Object.keys(table).sort((a,b)=>Math.abs(a-u)-Math.abs(b-u))[0];s=table[nearest]}}return scoreDeviation(record.cv,s,"lower")}
 if(k==="feed")return scoreDeviation(record.feedPerBirdG,meta(std,"dailyFeed",age),"target");
 if(k==="water")return scoreDeviation(record.waterPerBirdMl,meta(std,"dailyWater",age),"target");
 if(k==="production")return scoreDeviation(specialized(record,"production"),meta(std,t==="layer"?"henDayProduction":"henDayProduction",age),"higher");
 if(k==="fertility")return scoreDeviation(specialized(record,"fertility"),meta(std,"fertility",age),"higher");
 if(k==="hatchability")return scoreDeviation(specialized(record,"hatchability"),meta(std,"hatchability",age),"higher");
 if(k==="eggWeight")return scoreDeviation(specialized(record,"eggWeight"),meta(std,"eggWeight",age),"target");
 return null}
function geometric(items){const v=items.filter(x=>Number.isFinite(x)&&x>0);return v.length?clamp(Math.exp(v.reduce((s,x)=>s+Math.log(x),0)/v.length)):null}
function cap(t,s){const keys=t==="broiler"?["fcr","mortality","weight"]:t==="pullet"?["weight","uniformity","mortality"]:t==="layer"?["production","fcr","mortality"]:["production","fertility","hatchability","mortality"];const v=keys.map(k=>s[k]).filter(Number.isFinite);if(!v.length)return 100;const w=Math.min(...v);return w<25?49:w<40?59:w<55?69:w<70?79:w<80?84:100}
function evaluate({flock,records,standardObj}){const t=type(flock),rs=(records||[]).map(r=>typeof normalizeReportRecord==="function"?normalizeReportRecord(r):r).filter(r=>n(r.ageDays)!=null).sort((a,b)=>n(a.ageDays)-n(b.ageDays)).slice(-MAX_WEEKS);if(!rs.length)return {version:VERSION,score:null,grade:"داده کافی نیست"};const rows=[];for(const r of rs){const sc={};for(const k of Object.keys(WEIGHTS[t]||WEIGHTS.broiler))sc[k]=metric(r,rs,flock,standardObj,k);const vals=[];for(const [k,w] of Object.entries(WEIGHTS[t]||{})){if(Number.isFinite(sc[k])){const reps=Math.max(1,Math.round(w/5));for(let i=0;i<reps;i++)vals.push(sc[k])}}let ws=geometric(vals);if(ws!=null)ws=Math.min(ws,cap(t,sc));rows.push({score:ws,scores:sc,week:r.weekNumber,ageDays:r.ageDays})}
 const valid=rows.filter(x=>x.score!=null);if(!valid.length)return {version:VERSION,score:null,grade:"استاندارد/داده کافی نیست"};
 const q=valid.length===1?{factor:.82,cap:69}:valid.length===2?{factor:.90,cap:79}:valid.length===3?{factor:.96,cap:89}:{factor:1,cap:100};
 const weights=valid.length===4?[.10,.15,.25,.50]:valid.length===3?[.15,.25,.60]:valid.length===2?[.30,.70]:[1];let final=valid.reduce((s,r,i)=>s+r.score*weights[i],0)*q.factor;final=Math.min(final,q.cap);
 const latest=valid.at(-1),critical=Object.keys(WEIGHTS[t]||{}).filter(k=>["weight","fcr","mortality","production","fertility","hatchability"].includes(k)).map(k=>latest.scores[k]).filter(Number.isFinite);if(final>=90&&critical.some(x=>x<80))final=89;if(final>=95&&critical.some(x=>x<90))final=94;
 const grade=final>=95?"استثنایی":final>=90?"ممتاز":final>=85?"بسیار خوب":final>=80?"خوب":final>=70?"قابل قبول":final>=60?"متوسط":final>=50?"ضعیف":"بحرانی";
 return {version:VERSION,type:t,score:Number(clamp(final).toFixed(1)),grade,weekly:valid,latest,coverage:valid.length/4*100,mortalityBasis:cumulativeMortality(rs,flock).quality};}
function render(r){const c=document.getElementById("farmScoreCard");if(!c||!r||r.score==null)return;c.style.display="block";const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set("farmScoreValue",r.score.toFixed(1));set("farmScoreGrade",r.grade);set("farmScoreStars",r.score>=90?"★★★★★":r.score>=80?"★★★★☆":r.score>=70?"★★★☆☆":r.score>=60?"★★☆☆☆":"★☆☆☆☆");set("farmScoreSubtitle",`انحراف از استاندارد + وزن‌دهی تخصصی | ${r.type} | ${VERSION}`);set("farmScoreCoverage",`پوشش داده: ${Math.round(r.coverage)}٪ | مبنای تلفات: ${r.mortalityBasis}`);const b=document.getElementById("farmScoreBreakdown");if(b)b.innerHTML=Object.entries(r.latest.scores).filter(([,v])=>Number.isFinite(v)).map(([k,v])=>`<div class="farm-score-item"><span>${({weight:"میانگین وزن",fcr:"FCR",mortality:"تلفات تجمعی",uniformity:"یکنواختی ±10%",cv:"CV",production:"تولید",fertility:"نطفه‌داری",hatchability:"جوجه‌درآوری",eggWeight:"وزن تخم",feed:"دان",water:"آب"}[k]||k)}</span><strong>${v.toFixed(1)}</strong></div>`).join("")}
async function refresh(){try{const id=document.getElementById("flockSelect")?.value;if(!id||typeof getReportFlock!=="function")return;const f=await getReportFlock(id),rs=await getReportWeeklyRecords(id),std=typeof getReportStandardSafely==="function"?getReportStandardSafely(f):null;render(evaluate({flock:f,records:rs,standardObj:std}))}catch(e){console.warn("Farm Score V4",e)}}
g.AdineFarmScoreV4={VERSION,WEIGHTS,CURVES,scoreDeviation,evaluate,render,refresh};
document.addEventListener("DOMContentLoaded",()=>{const s=document.getElementById("flockSelect");if(s)s.addEventListener("change",()=>setTimeout(refresh,300));setTimeout(refresh,800)});
})(window);