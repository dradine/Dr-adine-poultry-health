/* ADINE POULTRY HEALTH — BROILER FCR ENGINE V11.1 */
(function(global){
'use strict';
const VERSION='BROILER-FCR-V11.1';
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const norm=v=>String(v??'').trim().toLowerCase();
function isBroiler(f){return ['broiler','broilers','گوشتی','meat'].includes(norm(f?.production_type||f?.productionType));}
function canonical(records,flock){
 if(!Array.isArray(records)) return [];
 const sorted=[...records].sort((a,b)=>Number(a.ageDays??a.age_days)-Number(b.ageDays??b.age_days));
 const initialWeight=n(flock?.initial_average_weight_g??flock?.initialAverageWeightG);
 let prev=null,cumFeed=0;
 return sorted.map(r=>{
   const age=n(r.ageDays??r.age_days),weight=n(r.average_weight_g??r.averageWeight),live=n(r.live_birds??r.liveBirds),feed=n(r.feed_total_kg??r.feedTotalKg??r.feed);
   const prevWeight=prev? n(prev.average_weight_g??prev.averageWeight) : initialWeight;
   const prevLive=prev? n(prev.live_birds??prev.liveBirds) : n(flock?.initial_bird_count??flock?.initialBirdCount);
   const gain=weight!=null&&live!=null&&prevWeight!=null&&prevLive!=null ? (live*weight-prevLive*prevWeight)/1000 : null;
   const weekly=feed!=null&&feed>0&&gain!=null&&gain>0 ? feed/gain : null;
   if(feed!=null&&feed>=0) cumFeed+=feed;
   const cumulative=(cumFeed>0&&flock?.initial_bird_count>0&&weight>0)?cumFeed/(Number(flock.initial_bird_count)*weight/1000):null;
   const out={...r,ageDays:age,weeklyFcr:weekly==null?null:Number(weekly.toFixed(4)),cumulativeFcr:cumulative==null?null:Number(cumulative.toFixed(4)),fcr:weekly==null?null:Number(weekly.toFixed(4)),calculationVersion:VERSION};
   prev=r;return out;
 });
}
function status(actual,target){if(actual==null||target==null)return{key:'none',label:'قابل مقایسه نیست'};const d=(actual-target)/target*100;if(d<=0)return{key:'good',label:'بهتر از معیار'};if(d<=5)return{key:'near',label:'نزدیک به معیار'};if(d<=10)return{key:'warning',label:'نیازمند توجه'};return{key:'bad',label:'نامطلوب'};}
async function analysis(flockId){if(!global.supabaseClient||!flockId)return{ok:false,rows:[]};const {data,error}=await global.supabaseClient.rpc('get_flock_fcr_analysis_v1',{p_flock_id:flockId});if(error)throw error;const rows=(data||[]).map(r=>({...r,weeklyFcr:r.weekly_fcr==null?null:Number(r.weekly_fcr),cumulativeFcr:r.cumulative_fcr==null?null:Number(r.cumulative_fcr),officialWeekly:r.official_weekly_fcr==null?null:Number(r.official_weekly_fcr),officialCumulative:r.official_cumulative_fcr==null?null:Number(r.official_cumulative_fcr),managementWeekly:r.management_weekly_fcr==null?null:Number(r.management_weekly_fcr),managementCumulative:r.management_cumulative_fcr==null?null:Number(r.management_cumulative_fcr),weeklyOfficialStatus:status(r.weekly_fcr,r.official_weekly_fcr),cumulativeOfficialStatus:status(r.cumulative_fcr,r.official_cumulative_fcr),weeklyManagementStatus:status(r.weekly_fcr,r.management_weekly_fcr),cumulativeManagementStatus:status(r.cumulative_fcr,r.management_cumulative_fcr)}));return{ok:true,rows,latest:rows.at(-1)||null};}
function card(a){if(!a?.latest)return '';const r=a.latest;const f=v=>v==null?'—':Number(v).toFixed(3);const cell=(title,actual,official,management,ds,dm)=>`<div class="fcr-v11-cell"><b>${title}</b><div class="fcr-v11-main">${f(actual)}</div><small>رسمی: ${f(official)} | مدیریتی: ${f(management)}</small><small>اختلاف رسمی: ${ds==null?'—':Number(ds).toFixed(3)} | اختلاف مدیریتی: ${dm==null?'—':Number(dm).toFixed(3)}</small></div>`;return `<section class="fcr-v11-card"><div class="fcr-v11-title">🍽️ FCR گوشتی — موتور V11</div><div class="fcr-v11-grid">${cell('FCR هفتگی',r.weekly_fcr,r.official_weekly_fcr,r.management_weekly_fcr,r.weekly_official_delta,r.weekly_management_delta)}${cell('FCR تجمعی',r.cumulative_fcr,r.official_cumulative_fcr,r.management_cumulative_fcr,r.cumulative_official_delta,r.cumulative_management_delta)}</div><div class="fcr-v11-note">استاندارد رسمی از اهداف عملکرد سویه انتخاب شده و FCR هفتگی رسمی، در صورت نبود عدد منتشرشده هفتگی، از منحنی FCR تجمعی و وزن همان منبع به‌صورت مشتق‌شده محاسبه می‌شود. بنچمارک مدیریتی فقط وقتی جامعه قابل مقایسه کافی باشد نمایش داده می‌شود.</div></section>`;}
function injectCss(){if(document.getElementById('fcr-v11-css'))return;const s=document.createElement('style');s.id='fcr-v11-css';s.textContent='.fcr-v11-card{margin:14px 0;padding:14px;border:1px solid #dfe7e3;border-radius:14px;background:#fff;box-shadow:0 5px 18px rgba(0,0,0,.05);direction:rtl}.fcr-v11-title{font-weight:800;font-size:15px;margin-bottom:10px}.fcr-v11-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fcr-v11-cell{padding:11px;border-radius:10px;background:#f6f8f7}.fcr-v11-main{font-size:22px;font-weight:900;margin:4px 0}.fcr-v11-cell small,.fcr-v11-note{display:block;font-size:10px;line-height:1.8;color:#68736f}.fcr-v11-note{margin-top:10px}@media(max-width:700px){.fcr-v11-grid{grid-template-columns:1fr}}';document.head.appendChild(s);}
async function renderWeekly(){const flock=global.currentFlock||global.currentFlockForSpecialized;if(!flock||!isBroiler(flock)||!global.supabaseClient)return;try{const a=await analysis(flock.id);injectCss();const host=document.getElementById('results');if(host&&!document.getElementById('fcr-v11-card')){const d=document.createElement('div');d.id='fcr-v11-card';d.innerHTML=card(a);host.parentElement?.prepend(d);}}catch(e){console.warn('FCR V11 analysis unavailable',e);}}
function start(){if(document.body)new MutationObserver(()=>{if(global.currentFlock)renderWeekly()}).observe(document.body,{childList:true,subtree:true});setTimeout(renderWeekly,800);}
global.AdineBroilerFCR={VERSION,canonical,analysis,status,renderWeekly};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);