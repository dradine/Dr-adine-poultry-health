/* ADINE — Broiler Performance Intelligence Source Adapter V1
   Normalizes already-computed weekly/comprehensive values for intelligence.
   It does not query Supabase and does not recalculate FCR, weight, CV,
   uniformity, mortality or any source KPI. EPEF is exposed only as a
   transparent composite derived from already-available evaluated values.
*/
(function(global){'use strict';
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace(/٫/g,'.'));return Number.isFinite(x)?x:null};
function enrich(flock,rows){return (Array.isArray(rows)?rows:[]).map(r=>{const raw=r.raw||r;const pm=raw.production_metrics||{};const weight=n(r.weight??r.average_weight_g??r.average_weight);const age=n(r.age??r.age_days);const fcr=n(r.cumulativeFcr??r.cumulative_fcr??raw.cumulative_fcr);const liv=n(r.livability??raw.livability??pm.livability_cumulative_percent);const epef=n(r.epef??raw.epef??pm.epef);const calculated=epef===null&&weight!==null&&age!==null&&age>0&&fcr!==null&&fcr>0&&liv!==null?Number((liv*(weight/1000)*100/(age*fcr)).toFixed(3)):null;return Object.freeze({...r,weeklyWeightGain:r.weeklyWeightGain??n(pm.weekly_gain_g),livability:liv,epef:epef??calculated,epef_source:epef!==null?'weekly_or_comprehensive_record':'derived_from_evaluated_kpis'});});}
global.AdineBroilerPerformanceIntelligenceSourceV1=Object.freeze({version:'BROILER-PI-SOURCE-V1',enrich});
})(typeof window!=='undefined'?window:globalThis);