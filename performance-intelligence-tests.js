/* deterministic unit checks for the intelligence layer */
(function(){'use strict';
if(typeof window==='undefined'||!window.AdinePerformanceIntelligence)return;
const A=window.AdinePerformanceIntelligence;const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
assert(A.metricDirection('fcr')==='lower','FCR direction');assert(A.metricDirection('body_weight')==='higher','weight direction');assert(A.score(1.6,1.5,'fcr')<100,'FCR penalty');assert(A.score(1600,1500,'body_weight')>100-0.01,'weight score');const f=A.forecast([1,1.1,1.2],4);assert(f&&f.projectedValue>1.2,'forecast');console.log('performance-intelligence-tests: PASS');
})();
