/* ADINE POULTRY HEALTH — WEEKLY GROWTH MANAGEMENT TARGET V1 */
"use strict";
(function(global){
  const page=String(location.pathname||"").toLowerCase().split("/").pop();
  if(page!=="reports.html"&&page!=="reports-v2.html")return;
  const db=global.supabaseClient;if(!db)return;
  const num=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null;};
  const fmt=v=>v==null?'—':Number(v).toLocaleString('fa-IR',{minimumFractionDigits:1,maximumFractionDigits:1});
  let cache=null,busy=false;
  function selectedId(){const p=new URLSearchParams(location.search);const direct=p.get('flock_id')||p.get('flockId')||p.get('id');if(direct)return direct;try{const raw=localStorage.getItem('adine_poultry_current_selection');if(raw){const o=JSON.parse(raw);return o?.flockId||o?.flock_id||null;}}catch(e){}return null;}
  async function load(){const id=selectedId();if(!id||busy)return;busy=true;try{
    const {data:f,error:fe}=await db.from('flocks').select('id,production_type,genetics,strain').eq('id',id).maybeSingle();if(fe||!f)return;
    const {data:w,error:we}=await db.from('weekly_records').select('id,week_number,age_days,live_birds,average_weight_g').eq('flock_id',id).order('age_days',{ascending:true});if(we)throw we;
    const {data:m,error:me}=await db.from('poultry_management_benchmarks').select('age_days,target_value,source_type,method,notes').eq('production_type','broiler').eq('strain',f.strain).eq('metric_code','weekly_weight_gain').eq('active',true).order('age_days',{ascending:true});if(me)throw me;
    cache={flock:f,rows:(w||[]).map(x=>({...x,age_days:num(x.age_days),week_number:num(x.week_number),live_birds:num(x.live_birds),average_weight_g:num(x.average_weight_g)})),targets:(m||[]).map(x=>({...x,age_days:num(x.age_days),target_value:num(x.target_value)}))};patch();
  }catch(e){console.error('Weekly growth management error:',e);}finally{busy=false;}}
  function actualGain(r){if(!cache)return null;const idx=cache.rows.findIndex(x=>x.id===r.id);if(idx<0)return null;const prev=cache.rows[idx-1];if(!prev)return r.average_weight_g!=null&&cache.flock?null:null;const cw=r.average_weight_g,pw=prev.average_weight_g,cb=r.live_birds,pb=prev.live_birds;if(![cw,pw,cb,pb].every(Number.isFinite))return null;/* per-bird weekly gain after accounting for depletion */const openingMass=pb*pw,closingMass=cb*cw;if(openingMass<=0||closingMass<=0)return null;return (closingMass/Math.max(cb,1))-(openingMass/Math.max(pb,1));}
  function targetGain(r){if(!cache)return null;const exact=cache.targets.find(x=>x.age_days===r.age_days);return exact?.target_value??null;}
  function metric(label){return [...document.querySelectorAll('.metric')].find(x=>String(x.querySelector('.label')?.textContent||'').trim()===label)||null;}
  function addCardAfterWeight(r){const mean=metric('میانگین وزن');if(!mean)return;let card=metric('افزایش وزن هفتگی');if(!card){card=document.createElement('div');card.className='metric';const cards=mean.closest('.cards');if(!cards)return;cards.insertBefore(card,mean.nextSibling);}const a=actualGain(r),t=targetGain(r);card.innerHTML='<div class="label">افزایش وزن هفتگی</div><div class="value">'+fmt(a)+' گرم</div><div class="ref">هدف مدیریتی: '+fmt(t)+' گرم</div>'+(t!=null?'<div class="ref">روش: اختلاف وزن مرجع این هفته و هفته قبل</div>':'');}
  function patch(){if(!cache)return;const sel=document.getElementById('week');const r=cache.rows[Number(sel?.value)||0];if(r)addCardAfterWeight(r);}
  function start(){load();const w=document.getElementById('week');if(w&&!w.__adineGrowthBound){w.addEventListener('change',()=>setTimeout(patch,50));w.__adineGrowthBound=true;}const root=document.getElementById('root')||document.body;if(root&&!root.__adineGrowthGrowthObs){new MutationObserver(()=>setTimeout(patch,30)).observe(root,{childList:true,subtree:true});root.__adineGrowthGrowthObs=true;}setInterval(()=>{if(cache)patch();},800);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
