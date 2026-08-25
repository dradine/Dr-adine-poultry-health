/* ADINE AGE-NORMALIZED FORECAST V2
   Forecasts the deviation from the age-specific benchmark, then maps that deviation
   onto the future benchmark. This prevents the classic error of carrying an absolute
   FCR difference across ages. Example: 1.2 vs 1.0 = +20%; future standard 2.0 => 2.4.
*/
(function(){'use strict';
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const lowerBetter=m=>['fcr','cumulative_fcr','mortality','cv','feed_per_egg_mass'].includes(String(m||'').toLowerCase());
function robustSlope(points){const p=(points||[]).map((v,i)=>({x:n(v.ageDays??v.x),y:n(v.deviation??v.y)})).filter(v=>v.x!=null&&v.y!=null).sort((a,b)=>a.x-b.x);if(p.length<4)return null;const slopes=[];for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){const dx=p[j].x-p[i].x;if(dx)slopes.push((p[j].y-p[i].y)/dx)}if(!slopes.length)return null;slopes.sort((a,b)=>a-b);return slopes[Math.floor(slopes.length/2)]}
function median(a){const x=[...a].sort((m,n)=>m-n);return x.length?x[Math.floor(x.length/2)]:null}
function forecast({history=[],futureStandard,metric,horizonDays=7}={}){const h=history.map(x=>({...x,deviation:n(x.deviation)})).filter(x=>x.deviation!=null&&n(x.ageDays)!=null);if(h.length<4)return {ok:false,code:'insufficient_history',required:4,available:h.length};const slope=robustSlope(h);if(slope==null)return {ok:false,code:'trend_unavailable'};const last=h.sort((a,b)=>a.ageDays-b.ageDays).at(-1);const residuals=h.map(x=>x.deviation-(last.deviation+slope*(x.ageDays-last.ageDays)));const mad=median(residuals.map(Math.abs))||0;const predictedDeviation=last.deviation+slope*horizonDays;const projected=n(futureStandard)==null?null:n(futureStandard)*(1+predictedDeviation);const interval=n(futureStandard)==null?null:{low:n(futureStandard)*Math.max(0,1+predictedDeviation-2.5*mad),high:n(futureStandard)*Math.max(0,1+predictedDeviation+2.5*mad)};const conf=Math.min(0.95,0.45+0.06*h.length+Math.max(0,0.2-Math.min(0.2,mad))*1.5);return {ok:true,metric,points:h.length,lastDeviationPct:last.deviation*100,predictedDeviationPct:predictedDeviation*100,predictedValue:projected,predictionInterval:interval,robustSlopePerDay:slope,mad,confidence:Number(conf.toFixed(2)),benchmarkNormalized:true,interpretation:lowerBetter(metric)?'deviation above zero means worse efficiency':'deviation above zero means above target'} }
window.AdineAgeNormalizedForecast={forecast,robustSlope};
})();
