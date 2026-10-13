/* ADINE — CANONICAL LAYER CALCULATION ENGINE V1
   One source of truth for layer production, egg mass, feed conversion and period aggregates.
   Isolated from all Broiler code.
*/
(function(g){
'use strict';
const VERSION='2026-10-13.layer-calculation.v2';
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
 const qualityFlags=[];
 if(!hasAll('egg_count'))qualityFlags.push('missing_daily_egg_count');
 if(!hasAll('feed_quantity_kg'))qualityFlags.push('missing_daily_feed_quantity');
 if(!allEggDaysHaveMass)qualityFlags.push('missing_egg_mass_for_one_or_more_days');
 if(!hasAll('opening_birds'))qualityFlags.push('missing_live_population_for_one_or_more_days');
 if(!placed)qualityFlags.push('missing_initial_housed_bird_count');
 if(!rs.every(r=>num(r.average_egg_weight_g)!==null||num(r.egg_count)===0))qualityFlags.push('egg_mass_uses_fallback_or_is_incomplete');
 return {
  mortality_count:sum(rs,'mortality_count'),cull_count:sum(rs,'cull_count'),
  total_eggs:totalEggs,total_saleable_eggs:hasAll('saleable_egg_count')?sum(rs,'saleable_egg_count'):null,
  total_cracked_eggs:hasAll('cracked_egg_count')?sum(rs,'cracked_egg_count'):null,
  total_dirty_eggs:hasAll('dirty_egg_count')?sum(rs,'dirty_egg_count'):null,
  total_floor_eggs:hasAll('floor_egg_count')?sum(rs,'floor_egg_count'):null,
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
  livability:last.livability_percent??null,health_status:last.health_status||null,
  data_quality_flags:qualityFlags,fcr_available:totalFeed!==null&&totalEggMassKg!==null&&totalEggMassKg>0
 };
}
function assessDaily(input={}){
 const a=input.actual||{},r=input.reference||{},p=input.previous||{},t={feedRelative:0.05,waterReferenceRelative:0.10,productionAbsolutePP:3,eggWeightRelative:0.03,productionTrendRelative:0.03,feedTrendRelative:0.05,waterTrendRelative:0.15,defectTrendPP:0.5,...(input.thresholds||{})};
 const reasons=[],dataQualityFlags=[];let adverse=0;
 const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
 const delta=(x,y)=>finite(x)&&finite(y)&&Number(y)!==0?(Number(x)-Number(y))/Number(y):null;
 const countKeys=['crackedEggCount','dirtyEggCount','softShellEggCount','misshapenEggCount','floorEggCount'];
 for(const k of ['eggCount','saleableEggCount',...countKeys,'feedKg','waterL','liveBirds','placedBirds','mortalityCount','cullCount']){
  if(finite(a[k])&&Number(a[k])<0)dataQualityFlags.push(k+':negative');
 }
 if(finite(a.saleableEggCount)&&finite(a.eggCount)&&Number(a.saleableEggCount)>Number(a.eggCount))dataQualityFlags.push('saleable_eggs_exceed_total');
 const defects=countKeys.reduce((s,k)=>s+(finite(a[k])?Number(a[k]):0),0);
 if(finite(a.eggCount)&&defects>Number(a.eggCount))dataQualityFlags.push('defect_categories_exceed_total');
 if(finite(a.eggCount)&&Number(a.eggCount)>0&&a.saleableEggCount==null&&countKeys.some(k=>finite(a[k])))dataQualityFlags.push('saleable_count_missing');
 const add=(msg)=>{adverse++;reasons.push(msg);};
 const compare=(actual,reference,rel,label,lowBad=true)=>{
  if(!finite(actual)||!finite(reference)||Number(reference)<=0)return;
  const d=delta(actual,reference);
  if(d===null||Math.abs(d)<=rel)return;
  if(lowBad&&d<0)add(label+' بیش از '+Math.round(rel*100)+'٪ پایین‌تر از مرجع است');
  else add(label+' بیش از '+Math.round(rel*100)+'٪ بالاتر/متفاوت از مرجع است؛ علت بررسی شود');
 };
 compare(a.feedPerHenG,r.feed,t.feedRelative,'مصرف دان',true);
 compare(a.waterPerHenMl,r.water,t.waterReferenceRelative,'مصرف آب',true);
 if(finite(a.henDayProductionPercent)&&finite(r.henDayProductionPercent)&&Number(a.henDayProductionPercent)<Number(r.henDayProductionPercent)-t.productionAbsolutePP)add('تولید Hen-Day بیش از '+t.productionAbsolutePP+' واحد درصد زیر مرجع است');
 if(finite(a.eggWeightG)&&finite(r.eggWeightG)&&Number(r.eggWeightG)>0&&Math.abs(delta(a.eggWeightG,r.eggWeightG))>t.eggWeightRelative)add('وزن تخم بیش از '+Math.round(t.eggWeightRelative*100)+'٪ با مرجع اختلاف دارد؛ توزیع اندازه و جیره بررسی شود');
 if(finite(a.henDayProductionPercent)&&finite(p.production)&&Number(p.production)>0&&Number(a.henDayProductionPercent)<Number(p.production)*(1-t.productionTrendRelative))add('افت تولید نسبت به میانگین روزهای اخیر');
 if(finite(a.feedPerHenG)&&finite(p.feed)&&Number(p.feed)>0&&Number(a.feedPerHenG)<Number(p.feed)*(1-t.feedTrendRelative))add('افت مصرف دان نسبت به میانگین روزهای اخیر');
 if(finite(a.waterPerHenMl)&&finite(p.water)&&Number(p.water)>0&&Math.abs(Number(a.waterPerHenMl)-Number(p.water))/Number(p.water)>t.waterTrendRelative)add('تغییر سریع مصرف آب نسبت به میانگین روزهای اخیر');
 if(finite(a.eggDefectPercent)&&finite(p.defect)&&Number(a.eggDefectPercent)>Number(p.defect)+t.defectTrendPP)add('افزایش درصد تخم معیوب نسبت به روزهای اخیر');
 const range=(v,lim,label)=>{if(finite(v)&&lim&&((finite(lim.min)&&Number(v)<Number(lim.min))||(finite(lim.max)&&Number(v)>Number(lim.max))))add(label+' خارج از بازهٔ پایش است');};
 range(a.waterFeedRatio,r.waterFeed,'نسبت آب به دان');
 range(a.humidityPercent,r.humidity,'رطوبت سالن');
 range(a.temperatureC,r.temperature,'دمای سالن');
 if(finite(a.mortalityPercent)&&finite(r.mortalityMax)&&Number(a.mortalityPercent)>Number(r.mortalityMax))add('تلفات روزانه از سقف هشدار تنظیم‌شده بالاتر است');
 const health=(a.healthSignals||[]).filter(x=>x&&x!=='طبیعی'&&x!=='normal');
 if(health.length)add('شاخص سلامت/رفتار غیرطبیعی ثبت شده است: '+health.slice(0,3).join('، '));
 const hasError=dataQualityFlags.length>0;
 const state=hasError?'investigate':adverse>=2?'investigate':adverse===1?'watch':'stable';
 const reason=[...dataQualityFlags.map(x=>'خطای/نقص داده: '+x),...reasons].slice(0,5).join(' • ')||(state==='stable'?'در شاخص‌های ثبت‌شده انحرافی از آستانه‌های فعال مشاهده نشد.':'نیازمند بررسی');
 const source=input.referenceSource||'unknown';
 return {state,reason,reasons,dataQualityFlags,adverseCount:adverse,referenceSource:source,thresholds:t,score:null,scoreStatus:'not_calibrated'};
}
function livabilityPercent(initialBirds,cumulativeMortality,cumulativeCulls){
 const placed=num(initialBirds),mort=num(cumulativeMortality)||0,culls=num(cumulativeCulls)||0;
 return placed!==null&&placed>0?Math.max(0,placed-mort-culls)/placed*100:null;
}
function dailyMetrics(input={}){
 const live=num(input.liveBirds),placed=num(input.placedBirds),eggs=num(input.eggCount),feed=num(input.feedKg),water=num(input.waterL),ew=num(input.averageEggWeightG),saleable=num(input.saleableEggCount);
 const cracked=num(input.crackedEggCount),dirty=num(input.dirtyEggCount),soft=num(input.softShellEggCount),misshapen=num(input.misshapenEggCount),floor=num(input.floorEggCount);
 const validPop=live!==null&&live>0,validPlaced=placed!==null&&placed>0;
 const eggMassG=eggs!==null&&ew!==null&&eggs>=0&&ew>=0?eggs*ew:null;
 const eggMassKg=eggMassG!==null?eggMassG/1000:null;
 const saleableEggPercent=eggs!==null&&eggs>0&&saleable!==null?saleable/eggs*100:null;
 // Defect categories may overlap (e.g., a floor egg may also be dirty/cracked).
 // Never sum them into a flock-level defect rate; require an explicit saleable-egg count.
 const eggDefectPercent=saleableEggPercent!==null?Math.max(0,100-saleableEggPercent):null;
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
  feedPerEggMass:eggMassKg!==null&&eggMassKg>0&&feed!==null&&feed>=0?feed/eggMassKg:null,
  saleableEggPercent,eggDefectPercent
 };
}
g.ADINE_LAYER_CALCULATION_ENGINE_V1=Object.freeze({version:VERSION,dailyMetrics,aggregate,livabilityPercent,assessDaily});
})(window);
