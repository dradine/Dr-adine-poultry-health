/* ADINE — BROILER PERFORMANCE INTELLIGENCE MATRIX VALIDATION V1 */
'use strict';
const assert=require('node:assert/strict');
require('../broiler-performance-intelligence-engine-v2.js');
const E=global.AdineBroilerPerformanceIntelligenceV2;
assert.equal(E.version,'BROILER-PI-V6.1');
const T={weight:2000,adg:100,fcr:1.60,cumulativeFcr:1.60,mortality:2,cv:9,u10:75,u15:90,epef:430};
const strains=['Ross 308','Ross 308 AP','Indian River','Arbor Acres Plus','Ross 708'];
const fields=Object.keys(T);
function row(strain,pattern,i){
 const r={id:`${strain}-${pattern}-${i}`,week:i+1,age:35,canonicalTargets:{...T}};
 for(const k of fields)r[k]=T[k];
 const bad=k=>{if(k==='fcr'||k==='cumulativeFcr')r[k]=T[k]*1.10;else if(k==='mortality')r[k]=T[k]+1.5;else if(k==='cv')r[k]=13;else if(k==='u10')r[k]=68;else if(k==='u15')r[k]=84;else if(k==='epef')r[k]=390;else r[k]=T[k]*.90};
 const good=k=>{if(k==='fcr'||k==='cumulativeFcr')r[k]=T[k]*.94;else if(k==='mortality')r[k]=1;else if(k==='cv')r[k]=8;else if(k==='u10')r[k]=82;else if(k==='u15')r[k]=94;else if(k==='epef')r[k]=470;else r[k]=T[k]*1.06};
 switch(pattern%10){case 1:bad('weight');break;case 2:bad('fcr');break;case 3:bad('weight');bad('fcr');break;case 4:good('weight');bad('fcr');break;case 5:bad('weight');good('fcr');break;case 6:bad('weight');bad('cv');bad('u10');break;case 7:bad('mortality');bad('fcr');break;case 8:bad('mortality');bad('weight');break;case 9:bad('mortality');bad('cv');break;}
 if(pattern>=10&&pattern<20){if(pattern%2===0){bad('cv');bad('u10')}else{good('weight');good('fcr');good('mortality');good('cv');good('u10')}}
 if(pattern>=20&&pattern<25){['weight','fcr','mortality','cv','u10'].forEach(bad);if(i>=2)['weight','fcr','mortality','cv','u10'].forEach(good)}
 if(pattern>=25){if(i%2===0){bad('weight');bad('fcr')}else{good('weight');good('fcr')}}
 return r;
}
let count=0;
for(const strain of strains){for(let pattern=0;pattern<30;pattern++){const rows=Array.from({length:6},(_,i)=>row(strain,pattern,i));const model=E.build({id:`${strain}-F`,strain},rows);assert.equal(model.ready,true);assert.ok(model.scenarioMatrix?.patterns?.length);assert.ok(model.inputFingerprint);assert.ok(model.analysisConfidence);assert.ok(model.causalConfidence);const edited=rows.map(x=>({...x}));edited[5]={...edited[5],weight:edited[5].weight+37};const revised=E.build({id:`${strain}-F`,strain},edited);assert.notEqual(revised.inputFingerprint,model.inputFingerprint);count++;}}
function has(pattern,rows){return E.build({id:'x',strain:'Ross 308'},rows).scenarioMatrix.patterns.includes(pattern)}
assert.ok(has('growth_efficiency_tradeoff',Array.from({length:6},(_,i)=>row('Ross 308',4,i))));
assert.ok(has('growth_lag_efficiency_preserved',Array.from({length:6},(_,i)=>row('Ross 308',5,i))));
assert.ok(has('survival_efficiency_pressure',Array.from({length:6},(_,i)=>row('Ross 308',7,i))));
assert.ok(has('growth_uniformity_pressure',Array.from({length:6},(_,i)=>row('Ross 308',6,i))));
const earlyRows=Array.from({length:6},(_,i)=>row('Ross 308',0,i));
['weight','fcr'].forEach(k=>{earlyRows[4][k]=k==='fcr'?T[k]*0.94:T[k]*1.06;earlyRows[5][k]=k==='fcr'?T[k]*1.06:T[k]*0.94;});
assert.ok(E.build({id:'early',strain:'Ross 308'},earlyRows).scenarioMatrix.patterns.includes('early_warning'));
const recoveryRows=Array.from({length:6},(_,i)=>row('Ross 308',0,i));
const recoveryWeightGap=[-10,-7,-3,0,3,6],recoveryFcrGap=[10,7,3,0,-3,-6];
recoveryRows.forEach((r,i)=>{r.weight=T.weight*(1+recoveryWeightGap[i]/100);r.fcr=T.fcr*(1+recoveryFcrGap[i]/100);});
assert.ok(E.build({id:'recovery',strain:'Ross 308'},recoveryRows).scenarioMatrix.patterns.includes('recovery_from_pressure'));
console.log(`PI MATRIX VALIDATION PASSED: ${count} multi-strain cases + 4 explicit rule assertions`);
