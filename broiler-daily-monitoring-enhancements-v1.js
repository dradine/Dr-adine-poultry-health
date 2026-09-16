/* ADINE — DAILY MONITORING ENHANCEMENTS V1
   UI-only additions + persistence bridge for new daily metrics.
   Does not alter weekly engines/calculations.
*/
(function(){
'use strict';
if(window.__ADINE_DAILY_ENHANCEMENTS_V1)return;
window.__ADINE_DAILY_ENHANCEMENTS_V1=true;
const $=id=>document.getElementById(id);
const n=v=>{if(v==null||v==='')return null;const x=Number(String(v).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٬،,]/g,''));return Number.isFinite(x)?x:null};
const set=(id,v)=>{const e=$(id);if(e)e.value=v==null?'':v};
function addGroup(grid,id,label,unit,readonly){
  if(!grid||$(id))return;
  const g=document.createElement('div');g.className='group';
  g.innerHTML='<label>'+label+(unit?' ('+unit+')':'')+'</label><input id="'+id+'" '+(readonly?'class="readonly" readonly':'type="number" step="0.1" min="0"')+'>';
  grid.appendChild(g);
}
function inject(){
  if(!$('dailyForm'))return false;
  const first=[...document.querySelectorAll('.sub.first-week-only')].find(x=>x.textContent.includes('ورود و کیفیت اولیه جوجه'));
  if(first){const grid=first.nextElementSibling;if(grid&&grid.classList.contains('form-grid'))addGroup(grid,'ventTemperature','دمای ونت جوجه','°C',false)}
  const feed=$('feedQuantity')?.closest('.group')?.parentElement;
  if(feed){addGroup(feed,'feedPerBird','مصرف دان هر پرنده','گرم',true);addGroup(feed,'waterPerBird','مصرف آب هر پرنده','میلی‌لیتر',true);addGroup(feed,'avgLivePopulation','میانگین جمعیت زنده روز','پرنده',true)}
  return true;
}
function livePopulationFromRows(flockId,age,current){
  const rows=Array.isArray(window.__ADINE_DAILY_RECORDS__) ? window.__ADINE_DAILY_RECORDS__ : [];
  const base=n(window.__ADINE_DAILY_INITIAL_COUNT__);
  if(!base)return null;
  let opening=base;
  rows.filter(r=>Number(r.age_days)<Number(age)).sort((a,b)=>Number(a.age_days)-Number(b.age_days)).forEach(r=>{opening-=(n(r.doa_count)||0)+(n(r.mortality_count)||0)+(n(r.cull_count)||0)});
  const closing=Math.max(0,opening-(n(current?.mortality_count)||0)-(n(current?.cull_count)||0));
  return (opening+closing)/2;
}
async function persistBridge(){
  if(!window.supabaseClient||!window.getCurrentSelection||!$('dailyForm'))return;
  const s=window.getCurrentSelection()||{};const flockId=s.flockId;if(!flockId)return;
  const date=(new URLSearchParams(location.search).get('date'))||null;
  const day=Number(new URLSearchParams(location.search).get('day'))||1;
  const q=await supabaseClient.from('broiler_daily_monitoring').select('id,age_days,record_date,flock_id,mortality_count,cull_count,doa_count,feed_quantity_kg,water_quantity_l').eq('flock_id',flockId).order('age_days',{ascending:true});
  if(q.error)return;
  const rows=q.data||[];const target=date?rows.find(r=>String(r.record_date)===date):rows.find(r=>Number(r.age_days)===day)||rows[rows.length-1];if(!target)return;
  const flockQ=await supabaseClient.from('flocks').select('initial_bird_count').eq('id',flockId).maybeSingle();
  const base=n(flockQ.data?.initial_bird_count);if(!base)return;
  let opening=base;
  rows.filter(r=>Number(r.age_days)<Number(target.age_days)).forEach(r=>{opening-=(n(r.doa_count)||0)+(n(r.mortality_count)||0)+(n(r.cull_count)||0)});
  opening=Math.max(0,opening);const closing=Math.max(0,opening-(n(target.mortality_count)||0)-(n(target.cull_count)||0));const avg=(opening+closing)/2;
  const feed=n(target.feed_quantity_kg),water=n(target.water_quantity_l);
  const payload={vent_temperature_c:n($('ventTemperature')?.value),avg_live_population:avg>0?Number(avg.toFixed(3)):null,feed_per_bird_g:feed!=null&&avg>0?Number(((feed*1000)/avg).toFixed(4)):null,water_per_bird_ml:water!=null&&avg>0?Number(((water*1000)/avg).toFixed(4)):null};
  await supabaseClient.from('broiler_daily_monitoring').update(payload).eq('id',target.id);
}
function livePreview(){
  const feed=n($('feedQuantity')?.value),water=n($('waterQuantity')?.value),initial=n($('initialCount')?.value),mort=n($('mortalityCount')?.value)||0,cull=n($('cullCount')?.value)||0,doa=n($('doaCount')?.value)||0;
  if(initial){const age=Number(new URLSearchParams(location.search).get('day'))||1;let opening=initial-(age===1?doa:0);const rows=window.__ADINE_DAILY_RECORDS__||[];rows.filter(r=>Number(r.age_days)<age).forEach(r=>{opening-=(n(r.doa_count)||0)+(n(r.mortality_count)||0)+(n(r.cull_count)||0)});const avg=Math.max(0,(opening+Math.max(0,opening-mort-cull))/2);set('avgLivePopulation',avg>0?avg.toFixed(1):'');set('feedPerBird',feed!=null&&avg>0?((feed*1000)/avg).toFixed(2):'');set('waterPerBird',water!=null&&avg>0?((water*1000)/avg).toFixed(2):'')}
}
function start(){if(!inject())return setTimeout(start,100);['feedQuantity','waterQuantity','mortalityCount','cullCount','doaCount'].forEach(id=>$(id)?.addEventListener('input',livePreview));document.querySelector('#dailyForm')?.addEventListener('submit',()=>setTimeout(persistBridge,1200),true);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
