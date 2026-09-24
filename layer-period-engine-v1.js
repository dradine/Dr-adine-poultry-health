/* ADINE — LAYER PERIOD ENGINE V1
   Daily -> automatic weekly/monthly aggregation.
   Gregorian dates remain internal DB keys; all user-facing labels are Jalali.
*/
(function(g){
'use strict';
const MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
function digits(v){return String(v??'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));}
function gregorianToJalali(gy,gm,gd){const gdm=[0,31,59,90,120,151,181,212,243,273,304,334];let jy=gy>1600?979:0;gy=gy>1600?gy-1600:gy-621;const gy2=gm>2?gy+1:gy;let days=365*gy+Math.floor((gy2+3)/4)-Math.floor((gy2+99)/100)+Math.floor((gy2+399)/400)-80+gd+gdm[gm-1];jy+=33*Math.floor(days/12053);days%=12053;jy+=4*Math.floor(days/1461);days%=1461;if(days>365){jy+=Math.floor((days-1)/365);days=(days-1)%365;}const jm=days<186?1+Math.floor(days/31):7+Math.floor((days-186)/30);const jd=1+(days<186?days%31:(days-186)%30);return {year:jy,month:jm,day:jd,label:fa(jy)+'/'+fa(jm)+'/'+fa(jd),monthLabel:MONTHS[jm-1]};}
function jalaliToGregorian(jy,jm,jd){jy=Number(jy)-979;const jmd=[31,31,31,31,31,31,30,30,30,30,30,29];let days=365*jy+Math.floor(jy/33)*8+Math.floor((jy%33+3)/4)+jd-1;for(let i=0;i<jm-1;i++)days+=jmd[i];let gdNo=days+79,gy=1600+400*Math.floor(gdNo/146097);gdNo%=146097;let leap=true;if(gdNo>=36525){gdNo--;gy+=100*Math.floor(gdNo/36524);gdNo%=36524;if(gdNo>=365)gdNo++;else leap=false;}gy+=4*Math.floor(gdNo/1461);gdNo%=1461;if(gdNo>=366){leap=false;gdNo--;gy+=Math.floor(gdNo/365);gdNo%=365;}const gmd=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];let gm=1;while(gdNo>=gmd[gm-1]){gdNo-=gmd[gm-1];gm++;}return gy+'-'+String(gm).padStart(2,'0')+'-'+String(gdNo+1).padStart(2,'0');}
function parseIso(s){const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?{y:+m[1],m:+m[2],d:+m[3]}:null;}
function toJalali(iso){const p=parseIso(iso);return p?gregorianToJalali(p.y,p.m,p.d):null;}
function isoAdd(iso,days){const d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
function isoDiff(a,b){return Math.round((new Date(a+'T00:00:00Z')-new Date(b+'T00:00:00Z'))/86400000);}
function daysInJalaliMonth(y,m){if(m<=6)return 31;if(m<=11)return 30;return isLeapJalali(y)?30:29;} function jalaliMonthStartIso(y,m){return jalaliToGregorian(y,m,1)} function jalaliMonthEndIso(y,m){return jalaliToGregorian(y,m,daysInJalaliMonth(y,m))}
function isLeapJalali(jy){
  const r=((jy-474)%2820+2820)%2820;
  return (((r+38)*682)%2816)<682;
}
function avg(rows,k){const v=rows.map(r=>Number(r[k])).filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;}
function sum(rows,k){const v=rows.map(r=>Number(r[k])).filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0):0;}
function weightedAvg(rows,k,w){let a=0,b=0;for(const r of rows){const x=Number(r[k]),wt=Number(r[w]);if(Number.isFinite(x)&&Number.isFinite(wt)&&wt>0){a+=x*wt;b+=wt;}}return b?a/b:avg(rows,k);}
function monthKey(j){return j.year+'-'+String(j.month).padStart(2,'0');}
function expectedActiveDays(flock, year, month, fromIso, toIso){
  let start=fromIso, end=toIso;
  const allStart=fromIso, allEnd=toIso;
  const p0=parseIso(allStart), p1=parseIso(allEnd);
  if(!p0||!p1)return 0;
  let count=0;
  for(let iso=allStart; iso<=allEnd; iso=isoAdd(iso,1)){
    const j=toJalali(iso); if(j.year===year&&j.month===month)count++;
    if(iso===allEnd)break;
  }
  return count;
}
function baseAgg(rows){
  const last=[...rows].sort((a,b)=>String(a.record_date).localeCompare(String(b.record_date))).at(-1)||{};
  const totalEggs=sum(rows,'egg_count');
  const totalFeed=sum(rows,'feed_quantity_kg');
  const totalEggMass=rows.reduce((s,r)=>s+(Number(r.egg_mass_g_hen_day)||0),0);
  return {
    mortality_count:sum(rows,'mortality_count'),cull_count:sum(rows,'cull_count'),
    total_eggs:totalEggs,total_saleable_eggs:sum(rows,'saleable_egg_count'),total_cracked_eggs:sum(rows,'cracked_egg_count'),
    total_dirty_eggs:sum(rows,'dirty_egg_count'),total_floor_eggs:sum(rows,'floor_egg_count'),
    avg_hen_day_production:weightedAvg(rows,'hen_day_production_percent','opening_birds'),
    avg_hen_housed_production:weightedAvg(rows,'hen_housed_production_percent','opening_birds'),
    avg_feed_per_hen_g:weightedAvg(rows,'feed_per_hen_g','opening_birds'),
    avg_water_per_hen_ml:weightedAvg(rows,'water_per_hen_ml','opening_birds'),
    avg_water_feed_ratio:avg(rows,'water_feed_ratio'),avg_egg_weight_g:weightedAvg(rows,'average_egg_weight_g','egg_count'),
    avg_egg_mass_g:avg(rows,'egg_mass_g_hen_day'),feed_per_egg_g:totalEggs>0?totalFeed*1000/totalEggs:null,
    feed_per_egg_mass:totalEggMass>0?totalFeed*1000/totalEggMass:null,avg_body_weight_g:avg(rows,'body_weight_g'),
    avg_uniformity_10:avg(rows,'uniformity_10_percent'),avg_uniformity_15:avg(rows,'uniformity_15_percent'),avg_cv:avg(rows,'cv_percent'),
    avg_temperature_c:avg(rows,'house_temperature_c'),avg_humidity_pct:avg(rows,'humidity_percent'),
    avg_ammonia_ppm:avg(rows,'ammonia_ppm'),avg_co2_ppm:avg(rows,'co2_ppm'),avg_haugh_unit:avg(rows,'haugh_unit'),avg_albumen_height_mm:avg(rows,'albumen_height_mm'),avg_shell_strength_g:avg(rows,'egg_shell_strength_g'),avg_shell_thickness_mm:avg(rows,'egg_shell_thickness_mm'),avg_egg_color_score:avg(rows,'egg_color_score'),
    livability:last.livability_percent??null,health_status:last.health_status||null
  };
}
function welfareSummary(rows){
  const keys=['water_micro_status','manure_condition','feather_condition','keel_bone_score','locomotion_score','footpad_score','pecking_status','flock_activity_status','nest_use_status','egg_shell_quality_status','water_quality_status'];
  const o={};for(const k of keys){const vals=rows.map(r=>r[k]).filter(Boolean);if(vals.length)o[k]=vals.at(-1);}
  return o;
}
async function sync(flock, user, supabaseClient, dailyRows){
  if(!flock||!user||!supabaseClient)return;
  const rows=[...dailyRows].sort((a,b)=>String(a.record_date).localeCompare(String(b.record_date)));
  if(!rows.length)return;
  const first=rows[0].record_date;
  const byWeek=new Map(), byMonth=new Map();
  rows.forEach(r=>{
    const week=Math.floor(isoDiff(r.record_date,first)/7)+1;
    r.__week=week;
    if(!byWeek.has(week))byWeek.set(week,[]);byWeek.get(week).push(r);
    const j=toJalali(r.record_date);if(j){const key=monthKey(j);if(!byMonth.has(key))byMonth.set(key,{j,rows:[]});byMonth.get(key).rows.push(r);}
  });
  const weeks=[...byWeek.entries()].map(([week,rs])=>{
    const a=baseAgg(rs),s=rs[0],e=rs.at(-1),j=toJalali(s.record_date);
    return {...a,flock_id:flock.id,farm_id:flock.farm_id,house_id:flock.house_id,owner_id:user.id,week_no:week,
      period_start:s.record_date,period_end:e.record_date,age_start_days:s.age_days,age_end_days:e.age_days,
      jalali_year:j?.year||null,jalali_month:j?.month||null,jalali_week_label:'هفته '+fa(week),
      source_daily_count:rs.length,expected_daily_count:7,is_complete:rs.length>=7,source_daily_ids:rs.map(x=>x.id),
      welfare_summary:welfareSummary(rs),performance_summary:{peak_or_average:'daily-derived'},updated_at:new Date().toISOString()};
  });
  for(const w of weeks){await supabaseClient.from('layer_weekly_monitoring').upsert(w,{onConflict:'flock_id,week_no'});}
  const months=[...byMonth.values()].map(({j,rows:rs})=>{
    const a=baseAgg(rs),s=rs[0],e=rs.at(-1);
    const monthStart=rs.find(x=>{const q=toJalali(x.record_date);return q?.year===j.year&&q?.month===j.month;})?.record_date||s.record_date;
    const expected=daysInJalaliMonth(j.year,j.month);
    const complete=rs.length>=expected;
    return {...a,flock_id:flock.id,farm_id:flock.farm_id,house_id:flock.house_id,owner_id:user.id,
      jalali_year:j.year,jalali_month:j.month,jalali_month_key:monthKey(j),jalali_month_label:j.monthLabel,
      period_start:monthStart,period_end:e.record_date,age_start_days:s.age_days,age_end_days:e.age_days,
      source_daily_count:rs.length,expected_daily_count:expected,is_complete:complete,source_daily_ids:rs.map(x=>x.id),
      welfare_summary:welfareSummary(rs),performance_summary:{calendar_month:true},updated_at:new Date().toISOString()};
  });
  for(const m of months){await supabaseClient.from('layer_monthly_monitoring').upsert(m,{onConflict:'flock_id,jalali_month_key'});}
  return {weeks,months};
}
g.ADINE_LAYER_PERIOD_ENGINE_V1={fa,toJalali,jalaliToGregorian,monthKey,daysInJalaliMonth,sync};
})(window);
