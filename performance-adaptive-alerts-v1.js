/* ADINE ADAPTIVE ALERTS V1
   No arbitrary universal 5/10/15% thresholds.
   Baseline = the flock's own prior normalized deviations; robust limits use median + 3*MAD.
   Benchmark deviation remains a compact informational signal until enough history exists.
*/
(function(){'use strict';
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const med=a=>{const x=a.map(n).filter(v=>v!=null).sort((a,b)=>a-b);if(!x.length)return null;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2};
function baseline(values){const clean=values.map(n).filter(v=>v!=null);if(clean.length<4)return {ready:false,n:clean.length};const m=med(clean);const mad=med(clean.map(v=>Math.abs(v-m)));return {ready:true,n:clean.length,median:m,mad,madSigma:mad*1.4826,upper:m+3*mad*1.4826,lower:m-3*mad*1.4826}}
function classify(current,history,metric){const c=n(current),b=baseline(history);if(c==null)return {state:'insufficient_data',severity:'none'};if(!b.ready)return {state:'monitor_only',severity:'info',n:b.n};const lowerBetter=['fcr','cumulative_fcr','fcr_weekly','fcr_cumulative','mortality','cv'].includes(String(metric||'').toLowerCase());const breach=lowerBetter?c>b.upper:c<b.lower;const near=lowerBetter?c>b.median+2*b.madSigma:c<b.median-2*b.madSigma;return {state:breach?'action':near?'watch':'normal',severity:breach?'high':near?'medium':'none',n:b.n,baseline_median:b.median,mad:b.mad,upper:b.upper,lower:b.lower,current:c}}
window.AdineAdaptiveAlerts={baseline,classify};
})();
