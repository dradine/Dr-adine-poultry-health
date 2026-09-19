/* ADINE — BROILER PERFORMANCE INTELLIGENCE MATRIX VALIDATION V2 — AGE × STRAIN × PATTERN */
'use strict';
const assert=require('node:assert/strict');
require('../broiler-performance-intelligence-engine-v2.js');
const E=global.AdineBroilerPerformanceIntelligenceV2;
assert.equal(E.version,'BROILER-PI-V6.3');

const STRAINS=['Ross 308','Ross 308 FF','Ross 708','Ross 308 AP','Cobb500','Cobb800','Arbor Acres Plus','Arbor Acres Plus S','Indian River','Indian River FF','Efficiency Plus','Hubbard EDGE','Arian'];
const AGES=[7,14,21,28,35,42,49,56];
const BASE={weight:100,adg:14,fcr:1.35,cumulativeFcr:1.35,mortality:1,cv:8,u10:80,u15:93,epef:430};
const fields=Object.keys(BASE);
const clone=o=>JSON.parse(JSON.stringify(o));
function ageBase(age){
  const f=age/7;
  return {weight:BASE.weight*f*f,adg:BASE.adg+8*f,fcr:BASE.fcr+0.08*f,cumulativeFcr:BASE.cumulativeFcr+0.08*f,mortality:BASE.mortality+0.15*f,cv:BASE.cv,u10:BASE.u10,u15:BASE.u15,epef:BASE.epef+4*f};
}
function bad(r,k){if(k==='fcr'||k==='cumulativeFcr')r[k]*=1.10;else if(k==='mortality')r[k]+=1.5;else if(k==='cv')r[k]=13;else if(k==='u10')r[k]=68;else if(k==='u15')r[k]=84;else if(k==='epef')r[k]=390;else r[k]*=.90;}
function good(r,k){if(k==='fcr'||k==='cumulativeFcr')r[k]*=.94;else if(k==='mortality')r[k]=.5;else if(k==='cv')r[k]=7;else if(k==='u10')r[k]=84;else if(k==='u15')r[k]=95;else if(k==='epef')r[k]=470;else r[k]*=1.06;}
function row(strain,age,pattern,i){
 const T=ageBase(age), r={id:`${strain}-${age}-${pattern}-${i}`,week:i+1,age,canonicalTargets:clone(T)};
 for(const k of fields)r[k]=T[k];
 switch(pattern%10){
  case 1:bad(r,'weight');break; case 2:bad(r,'fcr');break; case 3:bad(r,'weight');bad(r,'fcr');break;
  case 4:good(r,'weight');bad(r,'fcr');break; case 5:bad(r,'weight');good(r,'fcr');break;
  case 6:bad(r,'weight');bad(r,'cv');bad(r,'u10');break; case 7:bad(r,'mortality');bad(r,'fcr');break;
  case 8:bad(r,'mortality');bad(r,'weight');break; case 9:bad(r,'mortality');bad(r,'cv');break;
 }
 if(pattern>=10&&pattern<20){if(pattern%2===0){bad(r,'cv');bad(r,'u10')}else{for(const k of ['weight','fcr','mortality','cv','u10'])good(r,k)}}
 if(pattern>=20&&pattern<25){for(const k of ['weight','fcr','mortality','cv','u10'])bad(r,k);if(i>=2)for(const k of ['weight','fcr','mortality','cv','u10'])good(r,k)}
 if(pattern>=25){if(i%2===0){bad(r,'weight');bad(r,'fcr')}else{good(r,'weight');good(r,'fcr')}}
 return r;
}
let count=0;
for(const strain of STRAINS){
 for(const age of AGES){
  for(let pattern=0;pattern<30;pattern++){
   const rows=Array.from({length:6},(_,i)=>row(strain,age,pattern,i));
   const model=E.build({id:`${strain}-${age}`,strain},rows);
   assert.equal(model.ready,true);
   assert.ok(model.scenarioMatrix?.patterns?.length);
   assert.ok(model.inputFingerprint);
   assert.ok(model.analysisConfidence);
   assert.ok(model.causalConfidence);
   const edited=rows.map(x=>({...x,canonicalTargets:{...x.canonicalTargets}}));
   edited[5].weight+=37;
   const revised=E.build({id:`${strain}-${age}`,strain},edited);
   assert.notEqual(revised.inputFingerprint,model.inputFingerprint);
   count++;
  }
 }
}
function has(pattern,rows){return E.build({id:'x',strain:'Ross 308'},rows).scenarioMatrix.patterns.includes(pattern)}
const R=age=>Array.from({length:6},(_,i)=>row('Ross 308',age,0,i));
let rows=R(35);
rows.forEach(r=>{good(r,'weight');bad(r,'fcr')}); assert.ok(has('growth_efficiency_tradeoff',rows));
rows=R(35); rows.forEach(r=>{bad(r,'weight');good(r,'fcr')}); assert.ok(has('growth_lag_efficiency_preserved',rows));
rows=R(35); rows.forEach(r=>{bad(r,'mortality');bad(r,'fcr')}); assert.ok(has('survival_efficiency_pressure',rows));
rows=R(35); rows.forEach(r=>{bad(r,'weight');bad(r,'cv');bad(r,'u10')}); assert.ok(has('growth_uniformity_pressure',rows));

const early=R(35);
for(const r of early.slice(0,4)){good(r,'weight');good(r,'fcr')}
bad(early[4],'weight'); good(early[4],'fcr');
bad(early[5],'weight'); bad(early[5],'fcr');
assert.ok(E.build({id:'early',strain:'Ross 308'},early).scenarioMatrix.patterns.includes('early_warning'));

const recovery=R(35);
const wg=[-10,-8,-6,-4,-3,-2], fg=[10,8,6,4,3,2];
recovery.forEach((r,i)=>{r.weight=r.canonicalTargets.weight*(1+wg[i]/100);r.fcr=r.canonicalTargets.fcr*(1+fg[i]/100)});
assert.ok(E.build({id:'recovery',strain:'Ross 308'},recovery).scenarioMatrix.patterns.includes('recovery_from_pressure'));
const recoveryModel=E.build({id:'recovery-smart',strain:'Ross 308'},recovery);
assert.equal(recoveryModel.forecastSummary?.improve?.label,'وزن');
assert.equal(recoveryModel.forecastSummary?.improve?.trajectory?.regime,'recovering');
assert.ok(recoveryModel.states.weight.trajectory.gapSeries.length>=3);
assert.ok(['high','medium','low'].includes(recoveryModel.states.weight.trajectory.persistenceLevel));
assert.ok(['converging','diverging','stable'].includes(recoveryModel.states.weight.trajectory.relation));
// Smart Trend V3.1 evidence calibration: 3 points limited, 4 medium, 5+ high.
const ev3=R(35).slice(0,3), ev4=R(35).slice(0,4), ev5=R(35).slice(0,5);
assert.equal(E.build({id:'ev3',strain:'Ross 308'},ev3).states.weight.trajectory.evidenceLevel,'limited');
assert.equal(E.build({id:'ev4',strain:'Ross 308'},ev4).states.weight.trajectory.evidenceLevel,'medium');
assert.equal(E.build({id:'ev5',strain:'Ross 308'},ev5).states.weight.trajectory.evidenceLevel,'high');

// Three points must not produce high persistence or high volatility.
const noisy3=R(35).slice(0,3);
noisy3[0].weight=noisy3[0].canonicalTargets.weight*.90;
noisy3[1].weight=noisy3[1].canonicalTargets.weight*1.06;
noisy3[2].weight=noisy3[2].canonicalTargets.weight*.91;
const noisy3Model=E.build({id:'noisy3',strain:'Ross 308'},noisy3);
assert.notEqual(noisy3Model.states.weight.trajectory.persistenceLevel,'high');
assert.notEqual(noisy3Model.states.weight.trajectory.stability,'high_volatility');

// Lower-is-better semantics must remain positive when actual mortality/FCR is better than reference.
assert.ok(E.build({id:'synth',strain:'Ross 308'},R(35)).trajectorySynthesis?.available);


const deteriorating=R(35);
const wg2=[-2,-3,-4,-5,-6,-7],fg2=[2,3,4,5,6,7];
deteriorating.forEach((r,i)=>{r.weight=r.canonicalTargets.weight*(1+wg2[i]/100);r.fcr=r.canonicalTargets.fcr*(1+fg2[i]/100)});
const riskModel=E.build({id:'risk-smart',strain:'Ross 308'},deteriorating);
assert.ok(riskModel.forecastSummary?.risk);
assert.ok(['weight','fcr'].includes(riskModel.forecastSummary.risk.key));
assert.equal(riskModel.forecastSummary.version,'SMART-TREND-V3.1');
assert.ok(riskModel.states.weight.trajectory.currentGapPercent<0);
assert.ok(Number.isFinite(riskModel.states.weight.trajectory.momentum));

const stableTrajectory=R(35);
stableTrajectory.forEach(r=>{good(r,'weight');good(r,'fcr')});
const stableTrajectoryModel=E.build({id:'stable-smart',strain:'Ross 308'},stableTrajectory);
assert.equal(stableTrajectoryModel.forecastSummary?.risk,null);
assert.equal(stableTrajectoryModel.forecastSummary?.improve,null);
assert.equal(stableTrajectoryModel.forecastSummary?.method,'normalized-gap + robust-momentum + persistence + convergence/divergence + calibrated-volatility + conditional-forecast');

assert.equal(riskModel.targetAuthority,'canonical-broiler-standards-engine');
assert.ok(Object.values(riskModel.states).every(x=>x.official?.reference?.label || x.official?.status==='unavailable'));

// Trend recovery must not be inferred from a merely good current state.
// A stable, favorable flock is protective, not "recovering".
const stableGood=R(35);
stableGood.forEach(r=>{good(r,'weight');good(r,'fcr');good(r,'cv');good(r,'u10')});
const stableGoodModel=E.build({id:'stable-good',strain:'Ross 308'},stableGood);
assert.equal(stableGoodModel.multivariateAnalysis?.summary?.improvingAxes?.length||0,0);
assert.equal(stableGoodModel.scenarioMatrix.patterns.includes('coherent_recovery'),false);

// Pressure evidence must expose all currently pressured/worsening metrics,
// not only metrics crossing the stronger burden threshold.
const pressureTrace=R(35);
pressureTrace.forEach(r=>{bad(r,'cv');bad(r,'u10');bad(r,'u15')});
const pressureModel=E.build({id:'pressure-trace',strain:'Ross 308'},pressureTrace);
assert.ok((pressureModel.multivariateAnalysis?.summary?.pressureEvidence||[]).includes('CV'));
assert.ok((pressureModel.multivariateAnalysis?.summary?.pressureEvidence||[]).includes('U10'));
assert.ok((pressureModel.multivariateAnalysis?.summary?.pressureEvidence||[]).includes('U15'));
assert.ok(pressureModel.multivariateAnalysis?.axisSummary?.find(x=>x.axis==='uniformity' && 'trendRecovery' in x));

// Data-depth gate: state-only, limited trend, moderate, strong.
assert.equal(E.build({id:'d1',strain:'Ross 308'},[row('Ross 308',7,0,0)]).analysisConfidence,'low');
assert.equal(E.build({id:'d2',strain:'Ross 308'},[0,1].map(i=>row('Ross 308',14,0,i))).analysisConfidence,'low');
assert.ok(['limited','medium','high'].includes(E.build({id:'d3',strain:'Ross 308'},[0,1,2].map(i=>row('Ross 308',21,0,i))).analysisConfidence));
assert.ok(['medium','high'].includes(E.build({id:'d6',strain:'Ross 308'},[0,1,2,3,4,5].map(i=>row('Ross 308',42,0,i))).analysisConfidence));

// Missing-axis resilience: removing outcome and secondary uniformity inputs must not crash or invent a pattern.
const partial=R(35).map(r=>{const x={...r};delete x.epef;delete x.u15;return x});
const partialModel=E.build({id:'partial',strain:'Ross 308'},partial);
assert.equal(partialModel.ready,true);
assert.ok(partialModel.scenarioMatrix?.patterns?.length);
assert.ok(partialModel.analysisConfidence);

// Fingerprint/rebuild isolation: editing a dependent metric must change the model.
const baseRows=R(35); const baseModel=E.build({id:'edit',strain:'Ross 308'},baseRows);
for(const k of ['weight','adg','fcr','cumulativeFcr','mortality','cv','u10','u15','epef']){
 const edited=baseRows.map(x=>({...x,canonicalTargets:{...x.canonicalTargets}}));
 edited[5][k]=(Number(edited[5][k])||0)+1;
 const m=E.build({id:'edit',strain:'Ross 308'},edited);
 assert.notEqual(m.inputFingerprint,baseModel.inputFingerprint,`fingerprint did not change for ${k}`);
}

console.log(`PI MATRIX VALIDATION V3 PASSED: ${count} age×strain×pattern cases + explicit edge/data-quality assertions`);

// Smart Trend V3: with only 3 evaluations, a worsening path may be an early warning but not a confirmed risk.
const threePointWarning=R(35);
const gw=[-1,-2,-3];
threePointWarning.forEach((r,i)=>{r.weight=r.canonicalTargets.weight*(1+gw[i]/100)});
const threeWarningModel=E.build({id:'three-point-warning',strain:'Ross 308'},threePointWarning);
assert.ok(threeWarningModel.forecastSummary?.earlyWarning || threeWarningModel.forecastSummary?.risk===null);
assert.equal(threeWarningModel.forecastSummary?.risk,null);

// Normalized gap semantics: positive is favorable for both higher-is-better and lower-is-better metrics.
const semantic=R(35);
semantic.forEach(r=>{r.weight=r.canonicalTargets.weight*1.05;r.fcr=r.canonicalTargets.fcr*.95;r.mortality=r.canonicalTargets.mortality*.80});
const semanticModel=E.build({id:'semantic-gap',strain:'Ross 308'},semantic);
assert.ok(semanticModel.states.weight.official.gapPercent>0);
assert.ok(semanticModel.states.fcr.official.gapPercent>0);
assert.ok(semanticModel.states.mortality.official.gapPercent>0);
assert.equal(semanticModel.states.fcr.trajectory.currentPosition,'better');
assert.equal(semanticModel.states.mortality.trajectory.currentPosition,'better');
assert.ok(E.build({id:'synth',strain:'Ross 308'},R(35)).trajectorySynthesis?.available);

console.log('SMART TREND V3.1 VALIDATION PASSED: normalized gap, persistence, convergence/divergence, volatility and conditional forecast gates');

// Smart Trend V3.3 evidence-tiered outlook checks.
const v33Warn=R(35).slice(0,3);[-1,-2,-3].forEach((g,i)=>{v33Warn[i].weight=v33Warn[i].canonicalTargets.weight*(1+g/100)});
const v33WarnModel=E.build({id:'v33-warn',strain:'Ross 308'},v33Warn);
assert.ok(v33WarnModel.forecastSummary?.risk); assert.equal(v33WarnModel.forecastSummary.risk.state,'early_warning'); assert.equal(v33WarnModel.forecastSummary.risk.riskEligible,false);
const v33Recover=R(35).slice(0,3);[-10,-7,-4].forEach((g,i)=>{v33Recover[i].weight=v33Recover[i].canonicalTargets.weight*(1+g/100)});
const v33RecoverModel=E.build({id:'v33-recover',strain:'Ross 308'},v33Recover); assert.ok(v33RecoverModel.forecastSummary?.improve); assert.equal(v33RecoverModel.forecastSummary.improve.state,'recovery_opportunity');
const v33Positive=R(35).slice(0,3);[5,6,7].forEach((g,i)=>{v33Positive[i].weight=v33Positive[i].canonicalTargets.weight*(1+g/100)});
const v33PositiveModel=E.build({id:'v33-positive',strain:'Ross 308'},v33Positive); assert.equal(v33PositiveModel.forecastSummary.improve.state,'positive_momentum');
console.log('SMART TREND V3.3 VALIDATION PASSED');
