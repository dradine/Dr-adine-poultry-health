/* ADINE — Broiler Performance Intelligence Source Adapter V2
   Read-only adapter. It normalizes values already computed by the canonical
   weekly/comprehensive engines. It never calculates EPEF or any KPI.
*/
(function(global){'use strict';
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace(/٫/g,'.'));return Number.isFinite(x)?x:null};
function enrich(flock,rows){return (Array.isArray(rows)?rows:[]).map(r=>{const raw=r.raw||r;const pm=raw.production_metrics||{};const liv=n(r.livability??raw.livability??pm.livability_cumulative_percent);const epef=n(r.epef??r.EPEF??r.pef??raw.epef??pm.epef??pm.pef);return Object.freeze({...r,weeklyWeightGain:r.weeklyWeightGain??n(pm.weekly_gain_g),livability:liv,epef:epef,epef_source:epef===null?'not_available_from_canonical_model':'canonical_weekly_or_comprehensive_record'});});}
global.AdineBroilerPerformanceIntelligenceSourceV1=Object.freeze({version:'BROILER-PI-SOURCE-V2',enrich});
})(typeof window!=='undefined'?window:globalThis);