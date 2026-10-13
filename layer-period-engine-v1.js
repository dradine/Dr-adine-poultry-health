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
function engineVersion(){return g.ADINE_LAYER_CALCULATION_ENGINE_V1?.version||'unknown';}
function baseAgg(rows,flock){
 const engine=g.ADINE_LAYER_CALCULATION_ENGINE_V1;
 if(!engine||typeof engine.aggregate!=='function')throw new Error('Canonical Layer calculation engine is not loaded');
 return engine.aggregate(rows,flock||{});
}
function welfareSummary(rows){
  const keys=['water_micro_status','manure_condition','feather_condition','keel_bone_score','locomotion_score','footpad_score','pecking_status','flock_activity_status','nest_use_status','egg_shell_quality_status','water_quality_status'];
  const o={};for(const k of keys){const vals=rows.map(r=>r[k]).filter(Boolean);if(vals.length)o[k]=vals.at(-1);}
  return o;
}
async function sync(flock, user, supabaseClient, dailyRows){
  if(!flock||!user||!supabaseClient)throw new Error('Layer period sync requires flock, user and Supabase client');
  const rows=[...(dailyRows||[])].sort((a,b)=>String(a.record_date).localeCompare(String(b.record_date)));
  if(!rows.length){
    for(const table of ['layer_weekly_monitoring','layer_monthly_monitoring']){const del=await supabaseClient.from(table).delete().eq('flock_id',flock.id);if(del.error)throw new Error('Failed to clear stale '+table+': '+del.error.message);}
    return {weeks:[],months:[],cleared:true};
  }
  const first=rows[0].record_date;
  const byWeek=new Map(), byMonth=new Map();
  rows.forEach(r=>{
    const age=Number(r.age_days)||0; const week=age>0?Math.floor((age-1)/7)+1:null;
    if(!week)return;
    r.__week=week; r.__week_start_age=(week-1)*7+1; r.__week_end_age=week*7;
    if(!byWeek.has(week))byWeek.set(week,[]);byWeek.get(week).push(r);
    const j=toJalali(r.record_date);if(j){const key=monthKey(j);if(!byMonth.has(key))byMonth.set(key,{j,rows:[]});byMonth.get(key).rows.push(r);}
  });
  const weeks=[...byWeek.entries()].map(([week,rs])=>{
    const a=baseAgg(rs,flock),s=rs[0],e=rs.at(-1),j=toJalali(s.record_date); const consecutive=rs.length===7&&rs.every((x,i)=>i===0||isoDiff(x.record_date,rs[i-1].record_date)===1); const ageConsecutive=rs.every((x,i)=>i===0||(Number(x.age_days)===Number(rs[i-1].age_days)+1));
    return {...a,flock_id:flock.id,farm_id:flock.farm_id,house_id:flock.house_id,owner_id:user.id,week_no:week,
      period_start:s.record_date,period_end:e.record_date,age_start_days:s.age_days,age_end_days:e.age_days,
      jalali_year:j?.year||null,jalali_month:j?.month||null,jalali_week_label:'هفته '+fa(week),
      source_daily_count:rs.length,expected_daily_count:7,is_complete:consecutive&&ageConsecutive&&Number(s.age_days)===((week-1)*7+1)&&Number(e.age_days)===(week*7),source_daily_ids:rs.map(x=>x.id),
      welfare_summary:welfareSummary(rs),performance_summary:{aggregation_source:'layer_daily_monitoring',calculation_engine_version:engineVersion(),data_quality_flags:a.data_quality_flags||[],fcr_available:Boolean(a.fcr_available),average_body_weight_is_sample_weighted:true,uniformity_and_cv_are_means_of_daily_samples:true},updated_at:new Date().toISOString()};
  });
  for(const w of weeks){const {data_quality_flags,fcr_available,...row}=w;const result=await supabaseClient.from('layer_weekly_monitoring').upsert(row,{onConflict:'flock_id,week_no'});if(result.error)throw new Error('Layer weekly aggregation failed: '+result.error.message);}
  const months=[...byMonth.values()].map(({j,rows:rs})=>{
    const a=baseAgg(rs,flock),s=rs[0],e=rs.at(-1); const monthStartIso=jalaliToGregorian(j.year,j.month,1); const monthEndIso=jalaliToGregorian(j.year,j.month,daysInJalaliMonth(j.year,j.month)); const activeStart=flock.placement_date&&flock.placement_date>monthStartIso?flock.placement_date:monthStartIso; const expected=activeStart<=monthEndIso?isoDiff(monthEndIso,activeStart)+1:0; const todayIso=new Date().toISOString().slice(0,10); const contiguous=rs.length>0&&rs.every((x,i)=>i===0||isoDiff(x.record_date,rs[i-1].record_date)===1); const ageConsecutive=rs.every((x,i)=>i===0||(Number(x.age_days)===Number(rs[i-1].age_days)+1)); const complete=Boolean(flock.placement_date)&&todayIso>=monthEndIso&&rs.length===expected&&contiguous&&ageConsecutive&&s.record_date===activeStart&&e.record_date===monthEndIso;
    const monthStart=activeStart;
    return {...a,flock_id:flock.id,farm_id:flock.farm_id,house_id:flock.house_id,owner_id:user.id,
      jalali_year:j.year,jalali_month:j.month,jalali_month_key:monthKey(j),jalali_month_label:j.monthLabel,
      period_start:monthStart,period_end:e.record_date,age_start_days:s.age_days,age_end_days:e.age_days,
      source_daily_count:rs.length,expected_daily_count:expected,is_complete:complete,source_daily_ids:rs.map(x=>x.id),
      welfare_summary:welfareSummary(rs),performance_summary:{aggregation_source:'layer_daily_monitoring',calendar_month:true,calculation_engine_version:engineVersion(),data_quality_flags:a.data_quality_flags||[],fcr_available:Boolean(a.fcr_available),average_body_weight_is_sample_weighted:true,uniformity_and_cv_are_means_of_daily_samples:true},updated_at:new Date().toISOString()};
  });
  for(const m of months){const {data_quality_flags,fcr_available,...row}=m;const result=await supabaseClient.from('layer_monthly_monitoring').upsert(row,{onConflict:'flock_id,jalali_month_key'});if(result.error)throw new Error('Layer monthly aggregation failed: '+result.error.message);}
  // Remove derived period rows whose source period disappeared after a daily record was deleted or re-dated.
  const [oldWeeks,oldMonths]=await Promise.all([
    supabaseClient.from('layer_weekly_monitoring').select('week_no').eq('flock_id',flock.id),
    supabaseClient.from('layer_monthly_monitoring').select('jalali_month_key').eq('flock_id',flock.id)
  ]);
  if(oldWeeks.error)throw new Error('Cannot reconcile old weekly rows: '+oldWeeks.error.message);
  if(oldMonths.error)throw new Error('Cannot reconcile old monthly rows: '+oldMonths.error.message);
  const activeWeeks=new Set(weeks.map(x=>Number(x.week_no))),activeMonths=new Set(months.map(x=>String(x.jalali_month_key)));
  for(const x of (oldWeeks.data||[])){if(!activeWeeks.has(Number(x.week_no))){const del=await supabaseClient.from('layer_weekly_monitoring').delete().eq('flock_id',flock.id).eq('week_no',x.week_no);if(del.error)throw new Error('Cannot remove stale weekly row: '+del.error.message);}}
  for(const x of (oldMonths.data||[])){if(!activeMonths.has(String(x.jalali_month_key))){const del=await supabaseClient.from('layer_monthly_monitoring').delete().eq('flock_id',flock.id).eq('jalali_month_key',x.jalali_month_key);if(del.error)throw new Error('Cannot remove stale monthly row: '+del.error.message);}}
  return {weeks,months};
}
g.ADINE_LAYER_PERIOD_ENGINE_V1={fa,toJalali,jalaliToGregorian,monthKey,daysInJalaliMonth,sync};
})(window);
