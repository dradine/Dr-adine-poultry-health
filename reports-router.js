/* ADINE REPORTS — ROUTER / DATA PROVIDER V1
   Shared shell only. Production-specific calculations stay inside domain engines.
*/
"use strict";
(function(global){
  const ROUTES=Object.freeze({broiler:{label:'گوشتی',engine:'AdineBroilerReportEngine'},breeder:{label:'مرغ مادر',engine:null},layer:{label:'تخم‌گذار',engine:null},pullet:{label:'پولت',engine:null}});
  const normalize=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/[\u200c\u200f\u202a-\u202e]/g,'').trim();
  function productionType(v){const x=normalize(v);if(['broiler','broilers','گوشتی','goshthi'].includes(x))return'broiler';if(['breeder','breeders','parent','parent stock','مادر','مرغ مادر'].includes(x))return'breeder';if(['layer','layers','laying','تخمگذار','تخم گذار','تخم‌گذار'].includes(x))return'layer';if(['pullet','pullets','پولت'].includes(x))return'pullet';return x||'broiler'}
  function currentFlockId(){const p=new URLSearchParams(location.search),id=p.get('flockId')||p.get('flock_id');if(id)return id;try{const raw=localStorage.getItem('adine_poultry_current_selection');if(raw){const s=JSON.parse(raw);return s?.flockId||s?.flock_id||null}}catch(e){}return null}
  async function requireUser(){const {data,error}=await global.supabaseClient.auth.getUser();if(error||!data?.user)throw new Error('AUTH_REQUIRED');return data.user}
  async function getFlock(flockId){if(!flockId)throw new Error('FLOCK_REQUIRED');const {data,error}=await global.supabaseClient.from('flocks').select('id,farm_id,house_id,owner_id,flock_name,flock_code,production_type,genetics,strain,placement_date,start_age_days,initial_average_weight_g,status,program,sex').eq('id',flockId).maybeSingle();if(error)throw error;if(!data)throw new Error('FLOCK_NOT_FOUND');return data}
  async function getWeeklyRecords(flockId){const {data,error}=await global.supabaseClient.from('weekly_records').select('id,flock_id,record_date,evaluation_date,age_days,week_number,bird_count,live_birds,mortality_count,mortality,livability,sample_count,average_weight,average_weight_g,sd,sd_weight_g,cv,cv_percent,uniformity_10,uniformity_10_percent,uniformity_15,uniformity_15_percent,min_weight,min_weight_g,max_weight,max_weight_g,feed,feed_total_kg,feed_per_bird_g,water,water_total_liter,water_per_bird_ml,fcr,cumulative_fcr,standard_weight,standard_difference,standard_difference_percent,water_feed_ratio,production_metrics,notes,created_at,updated_at,production_day,production_week,flock_phase,timeline_version').eq('flock_id',flockId).order('week_number',{ascending:true});if(error)throw error;return data||[]}
  function getEngine(type){const route=ROUTES[type];if(!route)return null;return route.engine?global[route.engine]||null:null}
  function buildModel(flock,rows){const type=productionType(flock.production_type),engine=getEngine(type);if(!engine)return{type,ready:false,label:ROUTES[type]?.label||type,engine:null,rows:rows||[]};return{type,ready:true,label:ROUTES[type].label,engine:engine.version,rows:engine.build(flock,rows).rows}}
  function syncBottomNavigation(){
    const nav=document.querySelector('.bottom-nav');
    if(!nav)return;
    nav.innerHTML=`
<button type="button" onclick="window.location.href='Dashboard.html'" aria-label="خانه"><span class="farms-nav-icon" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M7 22 24 8l17 14v19H29V29H19v12H7z"/><path d="M7 22 24 8l17 14M11 20v21h26V20M19 41V29h10v12"/></svg></span><small>خانه</small></button>
<button type="button" onclick="window.location.href='Farms.html'" aria-label="فارم‌ها"><span class="farms-nav-icon" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M7 40V22l17-12 17 12v18H31V28H17v12z"/><path d="M7 40h34M7 22 24 10l17 12M17 40V28h14v12M19 22h10M24 16v6"/></svg></span><small>فارم‌ها</small></button>
<button type="button" onclick="window.location.href='weekly.html'" aria-label="هفتگی"><span class="farms-nav-icon" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M24 8v28M10 15h28M7 15h10l-5 10H9zM31 15h10l-5 10h-3zM14 36h20M18 40h12M20 15a4 4 0 0 1 8 0"/></svg></span><small>هفتگی</small></button>
<button class="active" type="button" onclick="window.location.href='reports.html'" aria-label="گزارش‌ها"><span class="farms-nav-icon" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M9 6h30v36H9zM15 13h18M15 19h18M15 35v-8M22 35V22M29 35v-5M36 35V23"/></svg></span><small>گزارش</small></button>`;
  }
  global.AdineReportRouter={version:'REPORT-ROUTER-V1',routes:ROUTES,productionType,currentFlockId,requireUser,getFlock,getWeeklyRecords,getEngine,buildModel};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncBottomNavigation,{once:true});else syncBottomNavigation();
})(window);