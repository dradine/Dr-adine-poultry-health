/* Core regression tests. Run in browser after loading performance-engine-v2.js + normalizer. */
(function(){'use strict';const A=window.AdinePerformance,S=window.AdineStandardNormalizer,E=window.AdineFourEngines;const eq=(a,b,m)=>{if(Math.abs(a-b)>1e-9)throw new Error(m+': '+a+' != '+b)};
// User's critical invariant: deviation is relative to the age-specific standard.
const p=S.project(1.2,1.0,2.0);eq(p.relativeDeviationPct,20,'relative deviation');eq(p.projectedValue,2.4,'future standard projection');
// FCR direction: lower is better.
if(!(S.performanceRatio(1.2,1.0,'fcr')<1))throw new Error('FCR direction');
if(!(S.performanceRatio(1.0,1.2,'fcr')>1))throw new Error('FCR inverse direction');
// Phase separation.
if(E.engine('broiler')!=='broiler'||E.engine('layer')!=='layer'||E.engine('breeder')!=='breeder'||E.engine('pullet')!=='pullet')throw new Error('engine classification');
if(E.phase('broiler',35)!=='finisher')throw new Error('broiler phase');
if(E.phase('pullet',15)!=='developer')throw new Error('pullet phase');
// Biological sanity: negative/zero gain must not yield a valid FCR.
if(A.broilerWeeklyFCR({feedKg:100,openBirds:100,openWeight:2000,closeBirds:100,closeWeight:1900})!==null)throw new Error('negative gain accepted');
// FCR increases can be normal with age; engine must not label age-related increase as a forecast error by itself.
console.log('ADINE performance engine v4 regression tests: PASS');
})();
