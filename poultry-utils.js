/* =========================================================
   ADINE POULTRY HEALTH CENTER
   POULTRY CALCULATION UTILITIES
========================================================= */

function calculateMean(values){const numbers=values.map(Number).filter(Number.isFinite);if(!numbers.length)return null;return numbers.reduce((sum,value)=>sum+value,0)/numbers.length;}
function calculateSD(values){const numbers=values.map(Number).filter(Number.isFinite);if(numbers.length<2)return null;const mean=calculateMean(numbers);const variance=numbers.reduce((sum,value)=>sum+Math.pow(value-mean,2),0)/(numbers.length-1);return Math.sqrt(variance);}
function calculateCV(values){const mean=calculateMean(values),sd=calculateSD(values);if(mean===null||sd===null||mean===0)return null;return(sd/mean)*100;}
function calculateUniformity(values,percent=10){const numbers=values.map(Number).filter(Number.isFinite);if(!numbers.length)return null;const mean=calculateMean(numbers);if(mean===null||mean===0)return null;const lower=mean*(1-percent/100),upper=mean*(1+percent/100);const inside=numbers.filter(value=>value>=lower&&value<=upper);return(inside.length/numbers.length)*100;}
function calculateWeightAnalysis(weights){const numbers=weights.map(Number).filter(Number.isFinite);if(!numbers.length)return{count:0,mean:null,sd:null,cv:null,uniformity10:null,uniformity15:null,min:null,max:null};return{count:numbers.length,mean:calculateMean(numbers),sd:calculateSD(numbers),cv:calculateCV(numbers),uniformity10:calculateUniformity(numbers,10),uniformity15:calculateUniformity(numbers,15),min:Math.min(...numbers),max:Math.max(...numbers)};}
function calculateFCR(feedGrams,weightGainGrams){const feed=Number(feedGrams),gain=Number(weightGainGrams);if(!Number.isFinite(feed)||!Number.isFinite(gain)||gain<=0)return null;return feed/gain;}
function calculateMortalityRate(deaths,initialBirds){const d=Number(deaths),n=Number(initialBirds);if(!Number.isFinite(d)||!Number.isFinite(n)||n<=0)return null;return(d/n)*100;}
function calculateLivability(mortalityPercent){const mortality=Number(mortalityPercent);if(!Number.isFinite(mortality))return null;return Math.max(0,100-mortality);}
function calculateWaterFeedRatio(waterLiters,feedKg){const water=Number(waterLiters),feed=Number(feedKg);if(!Number.isFinite(water)||!Number.isFinite(feed)||feed<=0)return null;return water/feed;}
function calculateEggMass(productionPercent,eggWeight){const production=Number(productionPercent),weight=Number(eggWeight);if(!Number.isFinite(production)||!Number.isFinite(weight))return null;return(production/100)*weight;}
function toPersianDigits(value){return String(value).replace(/\d/g,digit=>"۰۱۲۳۴۵۶۷۸۹"[digit]);}
function formatNumber(value,decimals=1){if(value===null||value===undefined||!Number.isFinite(Number(value)))return"—";return Number(value).toLocaleString("fa-IR",{minimumFractionDigits:decimals,maximumFractionDigits:decimals});}

/* Shared Jalali calendar theme. UI only; date calculations are untouched. */
(function(){
  if(document.querySelector('link[data-adine-calendar-theme="1"]'))return;
  const link=document.createElement("link");link.rel="stylesheet";link.href="calendar-theme.css";link.dataset.adineCalendarTheme="1";document.head.appendChild(link);
})();
