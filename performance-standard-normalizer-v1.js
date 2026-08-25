/* ADINE PERFORMANCE STANDARD NORMALIZER V1
   Converts deviation from a reference standard into a scale-free relative factor.
   Example: actual 1.2 vs standard 1.0 => +20%; projected standard 2.0 => 2.40, NOT 2.20.
*/
(function(){'use strict';
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function deviation(actual,standard){const a=n(actual),s=n(standard);if(a==null||s==null||s<=0)return null;return (a-s)/s}
function projectFromDeviation(futureStandard,relativeDeviation){const s=n(futureStandard),d=n(relativeDeviation);if(s==null||s<=0||d==null)return null;return s*(1+d)}
function project(actual,referenceStandard,futureStandard){const d=deviation(actual,referenceStandard);const value=projectFromDeviation(futureStandard,d);return {relativeDeviation:d,relativeDeviationPct:d==null?null:d*100,projectedValue:value};}
function performanceRatio(actual,standard,metric){const a=n(actual),s=n(standard);if(a==null||s==null||s<=0)return null;const lower=['fcr','cumulative_fcr','mortality','cv','feed_per_egg_mass'].includes(String(metric||'').toLowerCase());return lower?s/a:a/s}
function normalizedScore(actual,standard,metric){const ratio=performanceRatio(actual,standard,metric);if(ratio==null)return null;return clamp(ratio*100,0,100)}
window.AdineStandardNormalizer={deviation,projectFromDeviation,project,performanceRatio,normalizedScore};
})();
