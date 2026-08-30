/* ADINE POULTRY HEALTH — BROILER FCR CANONICAL ENGINE V13.2 */
(function(global){'use strict';
const VERSION='BROILER-FCR-V13.2';
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const norm=v=>String(v??'').trim().toLowerCase();
const isBroiler=f=>['broiler','broilers','گوشتی','meat'].includes(norm(f?.production_type||f?.productionType));
function canonical(records,flock){
  if(!Array.isArray(records))return[];
  const sorted=[...records].sort((a,b)=>Number(a.ageDays??a.age_days)-Number(b.ageDays??b.age_days));
  const iw=n(flock?.initial_average_weight_g??flock?.initialAverageWeightG),ib=n(flock?.initial_bird_count??flock?.initialBirdCount);
  let prev=null,cumFeed=0;
  return sorted.map((r,index)=>{
    const weight=n(r.average_weight_g??r.averageWeight),live=n(r.live_birds??r.liveBirds),feed=n(r.feed_total_kg??r.feedTotalKg??r.feed);
    const openingLive=index===0?ib:n(prev?.live_birds??prev?.liveBirds),openingWeight=index===0?iw:n(prev?.average_weight_g??prev?.averageWeight);
    let weekly=null;
    if(live>0&&weight>0&&openingLive>0&&openingWeight!==null){const gain=(live*weight-openingLive*openingWeight)/1000;if(feed>0&&gain>0)weekly=feed/gain;}
    if(feed!==null&&feed>=0)cumFeed+=feed;
    const cumulativeGain=(live>0&&weight>0&&ib>0&&iw!==null)?(live*weight-ib*iw)/1000:null;
    let cumulative=null;if(index===0)cumulative=weekly;else if(cumFeed>0&&cumulativeGain>0)cumulative=cumFeed/cumulativeGain;
    return {...r,ageDays:n(r.ageDays??r.age_days),weeklyFcr:weekly==null?null:Number(weekly.toFixed(4)),cumulativeFcr:cumulative==null?null:Number(cumulative.toFixed(4)),fcr:weekly==null?null:Number(weekly.toFixed(4)),calculationVersion:VERSION};
  });
}
function status(actual,target){if(actual==null||target==null)return{key:'none',label:'قابل مقایسه نیست'};const d=(actual-target)/target*100;if(d<=0)return{key:'good',label:'بهتر از معیار'};if(d<=5)return{key:'near',label:'نزدیک به معیار'};if(d<=10)return{key:'warning',label:'نیازمند توجه'};return{key:'bad',label:'نامطلوب'};}
async function analysis(flockId){if(!global.supabaseClient||!flockId)return{ok:false,rows:[]};const{data,error}=await global.supabaseClient.rpc('get_flock_fcr_analysis_v4',{p_flock_id:flockId});if(error)throw error;const rows=(data||[]).map(r=>({...r,weeklyFcr:n(r.weekly_fcr),cumulativeFcr:n(r.cumulative_fcr),officialWeekly:n(r.official_weekly_fcr),officialCumulative:n(r.official_cumulative_fcr),managementWeekly:n(r.management_weekly_fcr),managementCumulative:n(r.management_cumulative_fcr),weeklyOfficialStatus:status(r.weekly_fcr,r.official_weekly_fcr),cumulativeOfficialStatus:status(r.cumulative_fcr,r.official_cumulative_fcr),weeklyManagementStatus:status(r.weekly_fcr,r.management_weekly_fcr),cumulativeManagementStatus:status(r.cumulative_fcr,r.management_cumulative_fcr)}));return{ok:true,rows,latest:rows.at(-1)||null};}
global.AdineBroilerFCR={VERSION,canonical,analysis,status,isBroiler};
})(typeof window!=='undefined'?window:globalThis);