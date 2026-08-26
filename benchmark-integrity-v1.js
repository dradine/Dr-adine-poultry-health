/* ADINE BENCHMARK INTEGRITY ENGINE v1.0.0
   Scientific guardrails for poultry performance standards.
   This module does NOT invent values. It validates age, source provenance,
   interpolation boundaries, metric direction and official/management precedence.
*/
(function(g){
'use strict';
const VERSION='1.0.0-benchmark-integrity';
const TYPES=['broiler','pullet','layer','breeder'];
const DIRECTIONS={bodyWeight:'higher',dailyGain:'higher',dailyFeed:'lower',cumulativeFeed:'lower',fcr:'lower',livability:'higher',mortality:'lower',uniformity10:'higher',uniformity15:'higher',cv:'lower',dailyWater:'lower',henHousedProduction:'higher',henDayProduction:'higher',eggWeight:'higher',haughUnit:'higher',shellStrength:'higher',eggMass:'higher',cumulativeEggs:'higher',fertility:'higher',hatchability:'higher'};
function num(v){if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/,/g,''));return Number.isFinite(x)?x:null;}
function weekOfAge(age){const a=num(age);return a&&a>0?Math.ceil(a/7):null;}
function validateCurve(records){
 const errors=[],warnings=[];const rows=Array.isArray(records)?records:[];
 const seen=new Set();let prev=-Infinity;
 rows.forEach((r,i)=>{const age=num(r.ageDays);if(age===null||age<=0)errors.push(`invalid age at row ${i}`);if(age!==null&&age<=prev)errors.push(`ages not strictly increasing at row ${i}`);if(age!==null)prev=age;if(age!==null&&seen.has(age))errors.push(`duplicate age ${age}`);if(age!==null)seen.add(age);});
 return {ok:errors.length===0,errors,warnings};
}
function validateSource(s){
 const errors=[],warnings=[];if(!s||typeof s!=='object')return{ok:false,errors:['missing source metadata'],warnings};
 if(!s.sourceType)errors.push('missing sourceType');
 if(!s.sourceLabel)errors.push('missing sourceLabel');
 if(s.sourceType==='official-performance-objective'||s.sourceType==='official-performance-standard'){
   if(!s.sourceUrl)errors.push('official source missing sourceUrl');
   if(num(s.sourceYear)===null)warnings.push('official source missing sourceYear');
 }
 if(s.sourceType==='management-standard'&&!s.version)warnings.push('management standard missing version');
 return{ok:errors.length===0,errors,warnings};
}
function auditStandard(standard){
 const errors=[],warnings=[],metrics={};
 if(!standard)return{version:VERSION,ok:false,errors:['standard missing'],warnings,metrics};
 const official=standard.official,management=standard.management;
 if(official){const sv=validateSource(official);errors.push(...sv.errors.map(x=>'official: '+x));warnings.push(...sv.warnings.map(x=>'official: '+x));const cv=validateCurve(official.records);errors.push(...cv.errors.map(x=>'official curve: '+x));warnings.push(...cv.warnings.map(x=>'official curve: '+x));}
 if(management){const sv=validateSource(management);errors.push(...sv.errors.map(x=>'management: '+x));warnings.push(...sv.warnings.map(x=>'management: '+x));const cv=validateCurve(management.records);errors.push(...cv.errors.map(x=>'management curve: '+x));warnings.push(...cv.warnings.map(x=>'management curve: '+x));}
 const all=[...(official?.records||[]),...(management?.records||[])];
 Object.keys(DIRECTIONS).forEach(metric=>{
   const op=(official?.records||[]).filter(r=>num(r[metric])!==null);const mp=(management?.records||[]).filter(r=>num(r[metric])!==null);metrics[metric]={officialPoints:op.length,managementPoints:mp.length,direction:DIRECTIONS[metric],officialAvailable:op.length>0,managementAvailable:mp.length>0};
   if(op.length===0&&mp.length===0) return;
   if(op.length===0&&mp.length>0) metrics[metric].fallback='management';
 });
 return{version:VERSION,ok:errors.length===0,errors,warnings,metrics};
}
function assertPeriod(age){const a=num(age);return a===null?null:{ageDays:a,weekNumber:weekOfAge(a),startAgeDays:(weekOfAge(a)-1)*7+1,endAgeDays:weekOfAge(a)*7};}
function compare(actual,target,metric){const a=num(actual),t=num(target);if(a===null||t===null||t===0)return null;const d=(a-t)/Math.abs(t)*100;return{actual:a,target:t,deviationPercent:d,direction:DIRECTIONS[metric]||'neutral',absoluteDeviationPercent:Math.abs(d)};}
g.AdineBenchmarkIntegrityV1={VERSION,TYPES,DIRECTIONS,num,weekOfAge,validateCurve,validateSource,auditStandard,assertPeriod,compare};
})(window);
