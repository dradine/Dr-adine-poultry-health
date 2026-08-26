/* ADINE MORTALITY BENCHMARK V2 — weekly broiler mortality management curve
   Evidence hierarchy:
   - Cobb: cumulative 7-day mortality should not exceed 1%.
   - Commercial broiler references show week 1 is highest, week 2 should fall,
     weeks 3–4 are very low, and mortality may rise again in finishing weeks.
   This is a MANAGEMENT benchmark, not a genetic performance claim.
*/
(function(g){"use strict";
const VERSION="2026.2-mortality-weekly";
const BROILER_WEEKLY={1:1.00,2:1.00,3:0.30,4:0.20,5:0.20,6:0.30,7:0.30,8:0.30};
function n(v){if(v===null||v===undefined||v==="")return null;const x=Number(String(v).replace(/,/g,"").trim());return Number.isFinite(x)?x:null}
function weekOf(r){const w=n(r?.weekNumber);if(w!=null&&w>0)return Math.min(8,Math.ceil(w));const age=n(r?.ageDays);return age!=null&&age>0?Math.min(8,Math.ceil(age/7)):null}
function targetForRecord(r){const w=weekOf(r);return w==null?null:BROILER_WEEKLY[w]??null}
function weeklyMortalityPercent(record,flock){const initial=n(flock?.initial_bird_count??flock?.initial_birds??flock?.placement_birds??flock?.bird_count);if(initial==null||initial<=0)return null;const deaths=n(record?.mortality);if(deaths==null)return null;return deaths/initial*100}
g.AdineMortalityBenchmarkV2={VERSION,BROILER_WEEKLY,targetForRecord,weeklyMortalityPercent};
})(window);