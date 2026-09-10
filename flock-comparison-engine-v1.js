/* ADINE — BROILER FLOCK COMPARISON ENGINE V1
   Read-only comparison domain. No writes. No benchmark logic.
   Source of truth: flocks + weekly_records.
*/
"use strict";
(function(global){
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  const s=v=>String(v??'').trim();
  const first=(r,keys)=>{for(const k of keys){const x=n(r?.[k]);if(x!==null)return x}return null};
  const weekOf=r=>{const w=first(r,['week_number','production_week']);if(w!==null&&w>0)return Math.round(w);const a=first(r,['age_days','production_day']);return a!==null&&a>0?Math.max(1,Math.round(a/7)):null};
  const ageOf=r=>first(r,['age_days','production_day']);
  const weight=r=>first(r,['average_weight_g','average_weight']);
  const fcr=r=>first(r,['fcr']);
  const cumFcr=r=>first(r,['cumulative_fcr']);
  const feed=r=>first(r,['feed_total_kg','feed']);
  const water=r=>first(r,['water_total_liter','water']);
  const cv=r=>first(r,['cv_percent','cv']);
  const u10=r=>first(r,['uniformity_10_percent','uniformity_10']);
  const u15=r=>first(r,['uniformity_15_percent','uniformity_15']);
  const mortCount=r=>first(r,['mortality_count']);
  const mortPct=r=>first(r,['mortality']);
  const live=r=>first(r,['live_birds','bird_count']);
  const ratio=r=>first(r,['water_feed_ratio']);
  const dateOf=r=>s(r?.evaluation_date||r?.record_date||'');
  function isBroiler(f){const x=s(f?.production_type).normalize('NFKC').replace(/[\u200c\u200f]/g,'').toLowerCase();return ['broiler','broilers','گوشتی','goshthi'].includes(x)}
  function normalizeFlock(f,houseMap,farmMap){return{...f,house_name:houseMap[f.house_id]?.name||houseMap[f.house_id]?.house_code||'—',farm_name:farmMap[f.farm_id]?.name||farmMap[f.farm_id]?.farm_code||'—'}}
  function normalizeRecord(r,index,flock){return{raw:r,index,week:weekOf(r),age:ageOf(r),date:dateOf(r),weight:weight(r),fcr:fcr(r),cumulativeFcr:cumFcr(r),feed:feed(r),water:water(r),cv:cv(r),uniformity10:u10(r),uniformity15:u15(r),mortalityCount:mortCount(r),mortalityPercent:mortPct(r),liveBirds:live(r),waterFeedRatio:ratio(r),flockInitialBirds:n(flock?.initial_bird_count),feedPerBird:first(r,['feed_per_bird_g']),waterPerBird:first(r,['water_per_bird_ml'])}}
  function prepareFlock(flock,records){const sorted=[...(records||[])].map((r,i)=>normalizeRecord(r,i,flock)).filter(r=>r.week!==null).sort((a,b)=>a.week-b.week||String(a.date).localeCompare(String(b.date)));const byWeek=new Map();for(const r of sorted){if(!byWeek.has(r.week))byWeek.set(r.week,r)}return{flock,records:sorted,byWeek}}
  function weeklyGain(prepared,w){const r=prepared.byWeek.get(w);if(!r||r.weight===null)return null;const prev=prepared.byWeek.get(w-1);const initial=n(prepared.flock?.initial_average_weight_g);const base=prev?.weight??(w===1?initial:null);return base===null||base===undefined?null:r.weight-base}
  function cumulativeMortality(prepared,w){const initial=n(prepared.flock?.initial_bird_count);if(initial===null||initial<=0)return null;let total=0,found=false;for(const r of prepared.records){if(r.week>w)break;const m=r.mortalityCount;if(m!==null){total+=m;found=true}}return found?total/initial*100:null}
  function cumulativeMortalityCount(prepared,w){let total=0,found=false;for(const r of prepared.records){if(r.week>w)break;const m=r.mortalityCount;if(m!==null){total+=m;found=true}}return found?total:null}
  function commonWeeks(items){const set=new Set();items.forEach(p=>p.records.forEach(r=>set.add(r.week)));return [...set].sort((a,b)=>a-b)}
  function snapshot(prepared,week){const r=prepared.byWeek.get(week);return{week,age:r?.age??week*7,date:r?.date||null,weight:r?.weight??null,weeklyGain:weeklyGain(prepared,week),fcr:r?.fcr??null,cumulativeFcr:r?.cumulativeFcr??null,feed:r?.feed??null,water:r?.water??null,cv:r?.cv??null,uniformity10:r?.uniformity10??null,uniformity15:r?.uniformity15??null,mortalityCount:r?.mortalityCount??null,mortalityPercent:r?.mortalityPercent??null,cumulativeMortality:cumulativeMortality(prepared,week),cumulativeMortalityCount:cumulativeMortalityCount(prepared,week),liveBirds:r?.liveBirds??null,waterFeedRatio:r?.waterFeedRatio??null,recorded:!!r}}
  function compare(items){const weeks=commonWeeks(items);return{weeks,series:items.map(p=>({flock:p.flock,points:weeks.map(w=>snapshot(p,w))}))}}
  global.AdineBroilerFlockComparisonEngine={version:'BROILER-FLOCK-COMPARISON-V1',isBroiler,normalizeFlock,prepareFlock,compare,snapshot,commonWeeks};
})(typeof window!=='undefined'?window:globalThis);