/* ADINE POULTRY HEALTH — CANONICAL BROILER FCR REPORT ADAPTER V4 */
"use strict";
(function(global){
  const page=String(location.pathname||"").toLowerCase().split("/").pop();
  if(page!=="reports.html"&&page!=="reports-v2.html")return;
  const db=global.supabaseClient;if(!db)return;
  const num=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null;};
  const fmt=v=>v==null?'—':Number(v).toLocaleString('fa-IR',{minimumFractionDigits:3,maximumFractionDigits:3});
  function selectedId(){const p=new URLSearchParams(location.search);const direct=p.get('flock_id')||p.get('flockId')||p.get('id');if(direct)return direct;try{const raw=localStorage.getItem('adine_poultry_current_selection');if(raw){const o=JSON.parse(raw);return o?.flockId||o?.flock_id||null;}}catch(e){}return null;}
  let canonicalRows=[],busy=false,timer=null;
  function currentRow(){
    const s=document.getElementById('week');
    if(!canonicalRows.length)return null;
    const selected=Number(s?.value);
    if(Number.isInteger(selected)&&selected>=0&&selected<canonicalRows.length)return canonicalRows[selected];
    const requestedWeek=num(new URLSearchParams(location.search).get('week'));
    if(requestedWeek!=null){const byWeek=canonicalRows.find(r=>num(r.week_number)===requestedWeek);if(byWeek)return byWeek;}
    return canonicalRows[0]||null;
  }
  function metric(label){return [...document.querySelectorAll('.metric')].find(x=>String(x.querySelector('.label')?.textContent||'').trim()===label)||null;}
  function setMetric(label,value,ref){const el=metric(label);if(!el)return;const v=el.querySelector('.value');if(v)v.textContent=value==null?'—':fmt(value);let r=el.querySelector('.ref');if(!r){r=document.createElement('div');r.className='ref';el.appendChild(r);}r.textContent=ref||'';}
  function ensureManagementCard(){
    if(metric('FCR مدیریتی'))return;
    const cards=document.querySelector('.cards');if(!cards)return;
    const el=document.createElement('div');el.className='metric';
    el.innerHTML='<div class="label">FCR مدیریتی</div><div class="value">—</div><div class="ref"></div>';
    const cumulative=metric('FCR تجمعی');
    if(cumulative)cumulative.insertAdjacentElement('afterend',el);else cards.appendChild(el);
  }
  function patchCharts(week){if(!global.Chart)return;const rs=canonicalRows.filter(r=>num(r.week_number)<=num(week)),labels=rs.map(r=>'هفته '+num(r.week_number));document.querySelectorAll('canvas').forEach(canvas=>{const ch=global.Chart.getChart?.(canvas),box=canvas.closest('.box');if(!ch||!/FCR/i.test(String(box?.querySelector('h3')?.textContent||'')))return;ch.data.labels=labels;const put=(terms,data,label)=>{const ds=ch.data.datasets.find(d=>terms.some(t=>String(d.label||'').includes(t)));if(ds){ds.label=label;ds.data=data;}};put(['FCR هفتگی واقعی'],rs.map(r=>r.weekly_fcr),'FCR هفتگی واقعی');put(['هدف مدیریتی FCR هفتگی','استاندارد مدیریتی هفتگی'],rs.map(r=>r.management_weekly_fcr),'هدف مدیریتی FCR هفتگی');put(['FCR تجمعی واقعی'],rs.map(r=>r.cumulative_fcr),'FCR تجمعی واقعی');put(['استاندارد رسمی FCR تجمعی','استاندارد رسمی تجمعی'],rs.map(r=>r.official_cumulative_fcr),'استاندارد رسمی FCR تجمعی');ch.update('none');});}
  function patch(){const r=currentRow();if(!r)return;ensureManagementCard();setMetric('FCR هفتگی',r.weekly_fcr,`هدف مدیریتی: ${fmt(r.management_weekly_fcr)}`);setMetric('FCR تجمعی',r.cumulative_fcr,`استاندارد رسمی تجمعی: ${fmt(r.official_cumulative_fcr)}${r.official_source?' — '+r.official_source:''}`);setMetric('FCR مدیریتی',r.management_weekly_fcr,'هدف مدیریتی محاسبه‌شده');patchCharts(r.week_number);}
  async function load(){if(busy)return;const id=selectedId();if(!id)return;busy=true;try{const {data,error}=await db.rpc('get_flock_fcr_analysis_v4',{p_flock_id:id});if(error)throw error;canonicalRows=(data||[]).map(r=>({record_id:r.record_id,week_number:num(r.week_number),age_days:num(r.age_days),weekly_fcr:num(r.weekly_fcr),cumulative_fcr:num(r.cumulative_fcr),official_weekly_fcr:num(r.official_weekly_fcr),official_cumulative_fcr:num(r.official_cumulative_fcr),official_source:r.official_source||null,official_year:num(r.official_year),management_weekly_fcr:num(r.management_weekly_fcr),management_cumulative_fcr:num(r.management_cumulative_fcr)})).filter(r=>r.week_number!=null);patch();}catch(e){console.error('Canonical broiler FCR report error:',e);}finally{busy=false;}}
  function schedule(){clearTimeout(timer);timer=setTimeout(patch,80);}
  function start(){load();const w=document.getElementById('week');if(w&&!w.__adineCanonicalFcr){w.addEventListener('change',()=>{load();schedule();});w.__adineCanonicalFcr=true;}const root=document.getElementById('root')||document.body;if(root&&!root.__adineCanonicalFcrObs){new MutationObserver(schedule).observe(root,{childList:true,subtree:true});root.__adineCanonicalFcrObs=true;}setInterval(()=>{if(canonicalRows.length)patch();},750);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
