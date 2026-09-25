/* ADINE REPORTS — ROUTER / DATA PROVIDER V2
   Shared shell only. Production-specific calculations stay inside domain engines.
   Broiler target enrichment is read-only and uses the same canonical FCR report
   reader consumed by weekly monitoring. No KPI or target is calculated here.
*/
"use strict";
(function(global){
  const ROUTES=Object.freeze({broiler:{label:'گوشتی',engine:'AdineBroilerReportEngine'},breeder:{label:'مرغ مادر',engine:null},layer:{label:'تخم‌گذار',engine:null},pullet:{label:'پولت',engine:null}});
  const normalize=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/[\u200c\u200f\u202a-\u202e]/g,'').trim();
  function productionType(v){const x=normalize(v);if(['broiler','broilers','گوشتی','goshthi'].includes(x))return'broiler';if(['breeder','breeders','parent','parent stock','مادر','مرغ مادر'].includes(x))return'breeder';if(['layer','layers','laying','تخمگذار','تخم گذار','تخم‌گذار'].includes(x))return'layer';if(['pullet','pullets','پولت'].includes(x))return'pullet';return x||'broiler'}
  function currentFlockId(){const p=new URLSearchParams(location.search),id=p.get('flockId')||p.get('flock_id');if(id)return id;try{const raw=localStorage.getItem('adine_poultry_current_selection');if(raw){const s=JSON.parse(raw);return s?.flockId||s?.flock_id||null}}catch(e){}return null}
  async function requireUser(){const {data,error}=await global.supabaseClient.auth.getUser();if(error||!data?.user)throw new Error('AUTH_REQUIRED');return data.user}
  async function getFlock(flockId){if(!flockId)throw new Error('FLOCK_REQUIRED');const {data,error}=await global.supabaseClient.from('flocks').select('id,farm_id,house_id,owner_id,flock_name,flock_code,production_type,genetics,strain,sex,placement_date,start_age_days,initial_average_weight_g,status,program').eq('id',flockId).maybeSingle();if(error)throw error;if(!data)throw new Error('FLOCK_NOT_FOUND');return data}
  async function getCanonicalFcrTargets(){return{byRecord:new Map(),available:false,error:null}}
  async function getWeeklyRecords(flockId){const {data,error}=await global.supabaseClient.from('weekly_records').select('id,flock_id,record_date,evaluation_date,age_days,week_number,bird_count,live_birds,mortality_count,mortality,livability,sample_count,average_weight,average_weight_g,sd,sd_weight_g,cv,cv_percent,uniformity_10,uniformity_10_percent,uniformity_15,uniformity_15_percent,min_weight,min_weight_g,max_weight,max_weight_g,weights,feed,feed_total_kg,feed_per_bird_g,water,water_total_liter,water_per_bird_ml,fcr,cumulative_fcr,standard_weight,standard_difference,standard_difference_percent,water_feed_ratio,production_metrics,notes,created_at,updated_at,production_day,production_week,flock_phase,timeline_version').eq('flock_id',flockId).order('week_number',{ascending:true});if(error)throw error;const rows=data||[];const targetResult=await getCanonicalFcrTargets(flockId);if(!targetResult.available)return rows;return rows.map(r=>{const t=targetResult.byRecord.get(String(r.id));if(!t)return r;return Object.freeze({...r,officialWeeklyFcr:t.official_weekly_fcr??null,officialCumulativeFcr:t.official_cumulative_fcr??null,managementWeeklyFcr:t.management_weekly_fcr??null,managementCumulativeFcr:t.management_cumulative_fcr??null,officialFcrSource:t.official_source??null,officialFcrYear:t.official_year??null,managementFcrSource:t.management_cohort??null,managementFcrSourceVersion:t.calculation_version??null,targetAuthority:'canonical-weekly-report',targetRecordId:t.record_id??r.id})})}
  function getEngine(type){const route=ROUTES[type];if(!route)return null;return route.engine?global[route.engine]||null:null}
  function buildModel(flock,rows){const type=productionType(flock.production_type),engine=getEngine(type);if(!engine)return{type,ready:false,label:ROUTES[type]?.label||type,engine:null,rows:rows||[]};return{type,ready:true,label:ROUTES[type].label,engine:engine.version,rows:engine.build(flock,rows).rows}}
  function syncBottomNavigation(){
    const nav=document.querySelector('.bottom-nav');
    if(!nav)return;
    nav.innerHTML=`
      <button type="button" data-nav="Dashboard.html" onclick="window.location.href='Dashboard.html'" aria-label="خانه"><span data-icon="home" aria-hidden="true"></span><small>خانه</small></button>
      <button type="button" data-nav="Farms.html" onclick="window.location.href='Farms.html'" aria-label="فارم‌ها"><span data-icon="farm" aria-hidden="true"></span><small>فارم‌ها</small></button>
      <button type="button" data-nav="weekly.html" onclick="window.location.href='weekly.html'" aria-label="هفتگی"><span data-icon="weeklyReport" aria-hidden="true"></span><small>هفتگی</small></button>
      <button type="button" class="active" data-nav="reports.html" onclick="window.location.href='reports.html'" aria-label="گزارش‌ها"><span data-icon="report" aria-hidden="true"></span><small>گزارش‌ها</small></button>
    `;
  }
  global.AdineReportRouter={version:'REPORT-ROUTER-V2',routes:ROUTES,productionType,currentFlockId,requireUser,getFlock,getWeeklyRecords,getCanonicalFcrTargets,getEngine,buildModel};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncBottomNavigation,{once:true});else syncBottomNavigation();
})(window);