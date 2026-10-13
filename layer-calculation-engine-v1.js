/* ADINE — CANONICAL LAYER CALCULATION ENGINE V1
   One source of truth for layer production, egg mass, feed conversion and period aggregates.
   Isolated from all Broiler code.
*/
(function(g){
'use strict';
const VERSION='2026-10-13.layer-calculation.v1';
const num=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(String(v).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٬،,]/g,''));return Number.isFinite(n)?n:null;};
const sum=(rows,key)=>rows.reduce((s,r)=>s+(num(r[key])??0),0);
const avg=(rows,key)=>{const a=rows.map(r=>num(r[key])).filter(v=>v!==null);return a.length?a.reduce((s,v)=>s+v,0)/a.length:null;};
function aggregate(rows=[],flock={}){
 const rs=[...rows].sort((a,b)=>String(a.record_date||'').localeCompare(String(b.record_date||'')));
 const birdDays=rs.reduce((s,r)=>{const p=num(r.opening_birds);return s+(p!==null&&p>0?p:0);},0);
 const hasAll=key=>rs.length>0&&rs.every(r=>num(r[key])!==null);
 const totalEggs=hasAll('egg_count')?sum(rs,'egg_count'):null;
 const totalFeed=hasAll('feed_quantity_kg')?sum(rs,'feed_quantity_kg'):null;
 const totalWater=hasAll('water_quantity_l')?sum(rs,'water_quantity_l'):null;
 let totalEggMassG=0,eggMassRows=0,missingEggMass=false;
 for(const r of rs){
  const eggs=num(r.egg_count),ew=num(r.average_egg_weight_g),massPerHen=num(r.egg_mass_g_hen_day),pop=num(r.opening_birds);
  if(eggs!==null&&eggs>0&&ew!==null&&ew>=0){totalEggMassG+=eggs*ew;eggMassRows++;}
  else if(massPerHen!==null&&pop!==null&&pop>0){totalEggMassG+=massPerHen*pop;eggMassRows++;}
  else if(eggs===null||eggs>0){missingEggMass=true;}
 }
 const allEggDaysHaveMass=rs.length>0&&!missingEggMass&&rs.every(r=>{const eggs=num(r.egg_count);return eggs!==null&&(eggs===0||num(r.average_egg_weight_g)!==null||(num(r.egg_mass_g_hen_day)!==null&&num(r.opening_birds)>0));});
 const placed=num(flock.initial_bird_count)||num(flock.placed_birds)||null;
 const last=rs.at(-1)||{};
 const totalEggMassKg=allEggDaysHaveMass?totalEggMassG/1000:null;
 return {
  mortality_count:sum(rs,'mortality_count'),cull_count:sum(rs,'cull_count'),
  total_eggs:totalEggs,total_saleable_eggs:sum(rs,'saleable_egg_count'),total_cracked_eggs:sum(rs,'cracked_egg_count'),
  total_dirty_eggs:sum(rs,'dirty_egg_count'),total_floor_eggs:sum(rs,'floor_egg_count'),
  avg_hen_day_production:birdDays>0&&totalEggs!==null?totalEggs/birdDays*100:null,
  avg_hen_housed_production:placed&&rs.length&&totalEggs!==null?totalEggs/(placed*rs.length)*100:null,
  avg_feed_per_hen_g:birdDays>0&&totalFeed!==null?totalFeed*1000/birdDays:null,
  avg_water_per_hen_ml:birdDays>0&&totalWater!==null?totalWater*1000/birdDays:null,
  avg_water_feed_ratio:totalFeed!==null&&totalFeed>0&&totalWater!==null?totalWater/totalFeed:null,
  avg_egg_weight_g:totalEggs!==null&&totalEggs>0&&totalEggMassKg!==null?totalEggMassG/totalEggs:null,
  avg_egg_mass_g:birdDays>0&&totalEggMassKg!==null?totalEggMassG/birdDays:null,
  feed_per_egg_g:totalEggs!==null&&totalEggs>0&&totalFeed!==null?totalFeed*1000/totalEggs:null,
  feed_per_egg_mass:totalEggMassKg!==null&&totalEggMassKg>0&&totalFeed!==null?totalFeed/totalEggMassKg:null,
  avg_body_weight_g:avg(rs,'body_weight_g'),avg_uniformity_10:avg(rs,'uniformity_10_percent'),
  avg_uniformity_15:avg(rs,'uniformity_15_percent'),avg_cv:avg(rs,'cv_percent'),
  avg_temperature_c:avg(rs,'house_temperature_c'),avg_humidity_pct:avg(rs,'humidity_percent'),
  avg_ammonia_ppm:avg(rs,'ammonia_ppm'),avg_co2_ppm:avg(rs,'co2_ppm'),
  avg_haugh_unit:avg(rs,'haugh_unit'),avg_albumen_height_mm:avg(rs,'albumen_height_mm'),
  avg_shell_strength_g:avg(rs,'egg_shell_strength_g'),avg_shell_thickness_mm:avg(rs,'egg_shell_thickness_mm'),
  avg_egg_color_score:avg(rs,'egg_color_score'),
  livability:last.livability_percent??null,health_status:last.health_status||null
 };
}
function dailyMetrics(input={}){
 const live=num(input.liveBirds),placed=num(input.placedBirds),eggs=num(input.eggCount),feed=num(input.feedKg),water=num(input.waterL),ew=num(input.averageEggWeightG);
 const validPop=live!==null&&live>0,validPlaced=placed!==null&&placed>0;
 const eggMassG=eggs!==null&&ew!==null&&eggs>=0&&ew>=0?eggs*ew:null;
 const eggMassKg=eggMassG!==null?eggMassG/1000:null;
 return {
  liveBirds:validPop?live:null,placedBirds:validPlaced?placed:null,eggCount:eggs,
  henDayProductionPercent:validPop&&eggs!==null?eggs/live*100:null,
  henHousedProductionPercent:validPlaced&&eggs!==null?eggs/placed*100:null,
  feedPerHenG:validPop&&feed!==null&&feed>=0?feed*1000/live:null,
  waterPerHenMl:validPop&&water!==null&&water>=0?water*1000/live:null,
  waterFeedRatio:feed!==null&&feed>0&&water!==null&&water>=0?water/feed:null,
  eggMassGPerHenDay:validPop&&eggMassG!==null?eggMassG/live:null,
  totalEggMassG:eggMassG,totalEggMassKg:eggMassKg,
  feedPerEggG:eggs!==null&&eggs>0&&feed!==null&&feed>=0?feed*1000/eggs:null,
  feedPerEggMass:eggMassKg!==null&&eggMassKg>0&&feed!==null&&feed>=0?feed/eggMassKg:null
 };
}
g.ADINE_LAYER_CALCULATION_ENGINE_V1=Object.freeze({version:VERSION,dailyMetrics,aggregate});
})(window);
