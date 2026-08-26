/* =========================================================
   ADINE FARM SCORE V3 — STRICT DEVIATION ENGINE
   Scientific/management scoring layer. UI and existing calculations are untouched.
   Version: 2026.08.26
========================================================= */
(function (global) {
  "use strict";

  const VERSION = "3.0.0-strict-deviation";
  const MIN_WEEKLY_SAMPLE = 1;
  const MAX_WEEKS = 4;

  // Weights are intentionally production-type specific.
  const WEIGHTS = {
    broiler: { weight:25, fcr:30, mortality:20, uniformity:15, cv:10 },
    pullet:  { weight:30, uniformity:25, cv:15, mortality:15, feedEfficiency:15 },
    layer:   { production:30, fcr:25, mortality:15, eggWeight:10, uniformity:10, feed:10 },
    breeder: { production:20, fertility:20, hatchability:20, fcr:10, mortality:10, uniformity:10, weight:10 }
  };

  // The standard itself is not treated as excellence. 0% deviation = 80.
  // This deliberately makes 90+ difficult and 95+ rare.
  const CURVES = {
    more: [
      [-10,0],[-8,10],[-6,25],[-4,40],[-3,50],[-2,60],[-1,70],[0,80],
      [1,86],[2,90],[3,96],[4,100]
    ],
    less: [
      [-4,100],[-3,96],[-2,92],[-1,87],[0,82],[1,70],[2,58],[3,46],
      [4,34],[5,24],[6,15],[8,5],[10,0]
    ],
    target: [
      [-8,0],[-6,15],[-4,35],[-3,50],[-2,68],[-1,78],[0,82],[1,90],[2,96],[3,100],
      [4,96],[5,88],[6,75],[8,50],[10,20],[12,0]
    ]
  };

  function n(v) {
    if (v === null || v === undefined || v === "") return null;
    const x = Number(String(v).replace(/,/g, "").trim());
    return Number.isFinite(x) ? x : null;
  }
  function clamp(x,a=0,b=100){ return Math.max(a,Math.min(b,x)); }
  function interp(points, x) {
    if (x <= points[0][0]) return points[0][1];
    for (let i=1;i<points.length;i++) {
      const [x1,y1] = points[i-1], [x2,y2] = points[i];
      if (x <= x2) {
        const t=(x-x1)/(x2-x1);
        return y1+t*(y2-y1);
      }
    }
    return points[points.length-1][1];
  }

  function deviationPct(actual, standard) {
    if (!Number.isFinite(actual) || !Number.isFinite(standard) || standard === 0) return null;
    return ((actual-standard)/Math.abs(standard))*100;
  }

  function scoreDeviation(actual, standard, direction) {
    const d=deviationPct(actual,standard);
    if (d===null) return null;
    if (direction === "target") return clamp(interp(CURVES.target,d));
    if (direction === "less") return clamp(interp(CURVES.less,d));
    return clamp(interp(CURVES.more,d));
  }

  function geometricMean(items) {
    const valid=items.filter(x=>Number.isFinite(x) && x>0);
    if (!valid.length) return null;
    const mean=Math.exp(valid.reduce((s,x)=>s+Math.log(x),0)/valid.length);
    return clamp(mean);
  }

  function getType(flock) {
    if (typeof normalizeReportProductionType === "function") return normalizeReportProductionType(flock?.production_type);
    const r=String(flock?.production_type||"").toLowerCase();
    if (r.includes("broil")||r.includes("گوشتی")) return "broiler";
    if (r.includes("layer")||r.includes("تخم")) return "layer";
    if (r.includes("breed")||r.includes("مادر")) return "breeder";
    return "pullet";
  }

  function standard(standardObj, metric, age) {
    if (typeof getReportStandardMeta !== "function") return null;
    try { return n(getReportStandardMeta(standardObj,metric,age)?.value); } catch (_) { return null; }
  }

  function specialized(record, metric, stdObj, age) {
    const actual = typeof getActualSpecializedMetric === "function" ? n(getActualSpecializedMetric(record,metric)) : null;
    const std = standard(stdObj,metric,age);
    return {actual,std,score: actual!=null&&std!=null ? scoreDeviation(actual,std,metric === "fcr" ? "less" : "more") : null};
  }

  function mortalityActual(record) {
    const direct=n(record?.mortality_percent ?? record?.mortality_rate_percent ?? record?.mortalityRate);
    if (direct!=null) return direct;
    const dead=n(record?.mortality);
    const live=n(record?.liveBirds);
    if (dead!=null && live!=null && live+dead>0) return (dead/(live+dead))*100;
    return null;
  }

  function uniformityActual(record) { return n(record?.uniformity10 ?? record?.uniformity_10_percent); }
  function cvActual(record) { return n(record?.cv ?? record?.cv_percent); }
  function weightActual(record) { return n(record?.averageWeight ?? record?.average_weight_g); }
  function fcrActual(record) { return n(record?.fcr ?? record?.cumulativeFCR); }

  function metricScore(record, stdObj, metric) {
    const age=n(record.ageDays);
    if (metric==="weight") return scoreDeviation(weightActual(record),standard(stdObj,"weight",age),"target");
    if (metric==="fcr") return scoreDeviation(fcrActual(record),standard(stdObj,"fcr",age),"less");
    if (metric==="mortality") return scoreDeviation(mortalityActual(record),standard(stdObj,"mortality",age),"less");
    if (metric==="uniformity") return scoreDeviation(uniformityActual(record),standard(stdObj,"uniformity10",age),"more");
    if (metric==="cv") return scoreDeviation(cvActual(record),standard(stdObj,"cv",age),"less");
    if (metric==="feed") return scoreDeviation(n(record.feedPerBirdG),standard(stdObj,"feedPerBird",age),"less");
    if (metric==="feedEfficiency") return scoreDeviation(n(record.feedPerBirdG),standard(stdObj,"feedPerBird",age),"less");
    if (metric==="production") return specialized(record,"eggProduction",stdObj,age).score;
    if (metric==="eggWeight") return specialized(record,"eggWeight",stdObj,age).score;
    if (metric==="fertility") return specialized(record,"fertility",stdObj,age).score;
    if (metric==="hatchability") return specialized(record,"hatchability",stdObj,age).score;
    return null;
  }

  function criticalCap(type, scores) {
    const critical = type === "broiler" ? ["fcr","mortality","weight"] :
      type === "pullet" ? ["weight","uniformity","cv","mortality"] :
      type === "layer" ? ["production","fcr","mortality"] :
      ["production","fertility","hatchability","mortality"];
    const vals=critical.map(k=>scores[k]).filter(Number.isFinite);
    if (!vals.length) return 100;
    const worst=Math.min(...vals);
    if (worst < 25) return 49;
    if (worst < 40) return 59;
    if (worst < 55) return 69;
    if (worst < 70) return 79;
    if (worst < 80) return 84;
    return 100;
  }

  function dataQuality(validWeeks, requestedWeeks) {
    const completeness=clamp((validWeeks/Math.max(requestedWeeks,1))*100);
    // A farm with only one observation cannot legitimately earn an elite score.
    if (validWeeks<=1) return {factor:0.82,cap:69,coverage:completeness};
    if (validWeeks===2) return {factor:0.90,cap:79,coverage:completeness};
    if (validWeeks===3) return {factor:0.96,cap:89,coverage:completeness};
    return {factor:1,cap:100,coverage:100};
  }

  function trendPenalty(weeklyScores) {
    if (weeklyScores.length<3) return 0;
    const first=weeklyScores[0], last=weeklyScores[weeklyScores.length-1];
    if (!Number.isFinite(first)||!Number.isFinite(last)) return 0;
    const delta=last-first;
    if (delta>=0) return 0;
    if (delta>=-3) return 1;
    if (delta>=-7) return 3;
    if (delta>=-12) return 6;
    return 10;
  }

  function buildWeeklyScore(record,stdObj,type) {
    const weights=WEIGHTS[type]||WEIGHTS.broiler;
    const scores={};
    const used=[];
    for (const [metric,w] of Object.entries(weights)) {
      const s=metricScore(record,stdObj,metric);
      scores[metric]=s;
      if (Number.isFinite(s)) used.push({metric,score:s,weight:w});
    }
    const totalWeight=used.reduce((a,x)=>a+x.weight,0);
    if (!totalWeight) return {score:null,scores,coverage:0};
    // Weighted geometric mean punishes weak critical components more than arithmetic mean.
    const expanded=[];
    used.forEach(x=>{ const reps=Math.max(1,Math.round(x.weight/5)); for(let i=0;i<reps;i++) expanded.push(x.score); });
    let base=geometricMean(expanded);
    const cap=criticalCap(type,scores);
    base=Math.min(base,cap);
    return {score:base,scores,coverage:(totalWeight/Object.values(weights).reduce((a,x)=>a+x,0))*100};
  }

  function evaluate({flock,records,standardObj}) {
    const type=getType(flock);
    const normalized=(records||[]).map(r=>typeof normalizeReportRecord === "function" ? normalizeReportRecord(r) : r).filter(Boolean);
    const usable=normalized.filter(r=>Number.isFinite(n(r.ageDays)) || Number.isFinite(n(r.weekNumber)));
    const recent=usable.slice(-MAX_WEEKS);
    const weekly=[];
    recent.forEach(r=>{
      const st=standardObj || (typeof getReportStandardSafely === "function" ? getReportStandardSafely(flock) : null);
      const row=buildWeeklyScore(r,st,type);
      if (row.score!=null) weekly.push({...row,week:r.weekNumber,ageDays:r.ageDays});
    });
    if (!weekly.length) return {version:VERSION,type,score:null,grade:"داده کافی نیست",weekly:[],coverage:0,quality:{factor:0,cap:0}};
    const weights=[0.50,0.25,0.15,0.10].slice(-weekly.length);
    const wsum=weights.reduce((a,b)=>a+b,0);
    let final=weekly.reduce((sum,row,i)=>sum+row.score*(weights[i]/wsum),0);
    const q=dataQuality(weekly.length,MAX_WEEKS);
    final*=q.factor;
    final=Math.min(final,q.cap);
    final-=trendPenalty(weekly.map(x=>x.score));
    final=clamp(final);

    // Extra strictness for elite ranges: 90+ requires every critical metric to be >=80.
    const latest=weekly[weekly.length-1];
    const critical=Object.entries(latest.scores).filter(([k])=>(WEIGHTS[type]||{})[k]).map(([,v])=>v).filter(Number.isFinite);
    if (final>=90 && critical.some(v=>v<80)) final=89;
    if (final>=95 && critical.some(v=>v<90)) final=94;

    let grade = final>=95?"استثنایی":final>=90?"ممتاز":final>=85?"بسیار خوب":final>=80?"خوب":final>=70?"قابل قبول":final>=60?"متوسط":final>=50?"ضعیف":"بحرانی";
    return {version:VERSION,type,score:Number(final.toFixed(1)),grade,weekly,latest,coverage:q.coverage,quality:q};
  }

  function stars(score){
    if (!Number.isFinite(score)) return "☆☆☆☆☆";
    const full=score>=95?5:score>=90?5:score>=85?4:score>=75?4:score>=65?3:score>=50?2:1;
    return "★".repeat(full)+"☆".repeat(5-full);
  }

  function labelMetric(k){
    return ({weight:"وزن",fcr:"FCR",mortality:"تلفات",uniformity:"یکنواختی",cv:"CV",production:"تولید",eggWeight:"وزن تخم",fertility:"نطفه‌داری",hatchability:"جوجه‌درآوری",feed:"مصرف دان",feedEfficiency:"کارایی دان"}[k]||k); }

  function render(result){
    const card=document.getElementById("farmScoreCard");
    if(!card||!result||result.score==null)return;
    card.style.display="block";
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    set("farmScoreValue",result.score.toFixed(1));
    set("farmScoreStars",stars(result.score));
    set("farmScoreGrade",result.grade);
    set("farmScoreSubtitle",`امتیاز سختگیرانه بر پایه درصد انحراف از استاندارد | ${result.type} | موتور ${VERSION}`);
    set("farmScoreCoverage",`پوشش داده: ${Math.round(result.coverage)}٪ | ${result.weekly.length} هفته معتبر | استاندارد مرجع در هر سن محاسبه شده است`);
    const breakdown=document.getElementById("farmScoreBreakdown");
    if(breakdown){
      breakdown.innerHTML=Object.entries(result.latest.scores).filter(([,v])=>Number.isFinite(v)).map(([k,v])=>`<div class="farm-score-item"><span>${labelMetric(k)}</span><strong>${v.toFixed(1)}</strong></div>`).join("");
    }
    const strengths=document.getElementById("farmScoreStrengths");
    const actions=document.getElementById("farmScoreActions");
    const entries=Object.entries(result.latest.scores).filter(([,v])=>Number.isFinite(v)).sort((a,b)=>b[1]-a[1]);
    if(strengths) strengths.innerHTML=entries.slice(0,3).map(([k,v])=>`<li>${labelMetric(k)}: ${v.toFixed(1)} از 100</li>`).join("") || "<li>داده کافی نیست</li>";
    if(actions) actions.innerHTML=entries.slice().reverse().slice(0,3).map(([k,v])=>`<li>${labelMetric(k)}: ${v.toFixed(1)} — اولویت اصلاح</li>`).join("") || "<li>داده کافی نیست</li>";
    card.dataset.scoreEngineVersion=VERSION;
  }

  async function refresh(){
    try{
      const select=document.getElementById("flockSelect");
      const id=select?.value;
      if(!id || typeof getReportFlock!=="function" || typeof getReportWeeklyRecords!=="function") return;
      const flock=await getReportFlock(id);
      const records=await getReportWeeklyRecords(id);
      const std=typeof getReportStandardSafely==="function"?getReportStandardSafely(flock):null;
      render(evaluate({flock,records,standardObj:std}));
    }catch(e){console.warn("Farm Score V3 refresh failed",e);}
  }

  global.AdineFarmScoreV3={VERSION,evaluate,scoreDeviation,refresh,render,WEIGHTS,CURVES};

  // Run after existing report logic and re-run when the flock changes.
  document.addEventListener("DOMContentLoaded",()=>{
    const select=document.getElementById("flockSelect");
    if(select) select.addEventListener("change",()=>setTimeout(refresh,500));
    let tries=0;
    const timer=setInterval(()=>{ refresh(); if(++tries>=20) clearInterval(timer); },750);
  });
})(window);
