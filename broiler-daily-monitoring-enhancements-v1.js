/* ADINE — DAILY MONITORING ENHANCEMENTS V4
   UI additions + derived daily consumption.
   Average live population is an internal calculation only.
   Does not alter weekly engines/calculations.
*/
(function(){
'use strict';
if(window.__ADINE_DAILY_ENHANCEMENTS_V4)return;
window.__ADINE_DAILY_ENHANCEMENTS_V4=true;
const $=id=>document.getElementById(id);
const n=v=>{if(v==null||v==='')return null;const x=Number(String(v).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٬،,]/g,''));return Number.isFinite(x)?x:null};
const set=(id,v)=>{const e=$(id);if(e)e.value=v==null?'':v};
function addGroup(grid,id,label,unit,readonly){if(!grid||$(id))return;const g=document.createElement('div');g.className='group';g.dataset.dailyDerivedMetric=id;g.innerHTML='<label>'+label+(unit?' ('+unit+')':'')+'</label><input id="'+id+'" '+(readonly?'class="readonly" readonly':'type="number" step="0.1" min="0"')+'>';grid.appendChild(g)}
function inject(){
 if(!$('dailyForm'))return false;
 const first=[...document.querySelectorAll('.sub.first-week-only')].find(x=>x.textContent.includes('ورود و کیفیت اولیه جوجه'));
 if(first){const grid=first.nextElementSibling;if(grid&&grid.classList.contains('form-grid'))addGroup(grid,'ventTemperature','دمای ونت جوجه','°C',false)}
 const feed=$('feedQuantity')?.closest('.group')?.parentElement;
 if(feed){addGroup(feed,'feedPerBird','مصرف دان هر پرنده','گرم',true);addGroup(feed,'waterPerBird','مصرف آب هر پرنده','میلی‌لیتر',true)}
 document.querySelectorAll('[data-daily-derived-metric="avgLivePopulation"],#avgLivePopulation').forEach(e=>{const g=e.closest('.group');(g||e).remove()});
 const wt=$('weightTarget');if(wt){const label=wt.closest('.group')?.querySelector('label');if(label)label.textContent='مرجع وزن روزانه'}
 return true;
}
function selectedFlockId(){
 try{if(typeof getCurrentSelection==='function'){const s=getCurrentSelection()||{};const id=s.flockId||s.flock_id||s.id;if(id)return String(id)}}catch(e){}
 const keys=['adine_poultry_current_selection','adine_selected_flock'];
 for(const k of keys){try{const raw=localStorage.getItem(k);if(!raw)continue;try{const o=JSON.parse(raw);const id=o?.flockId||o?.flock_id||o?.id;if(id)return String(id)}catch(e){}if(!raw.startsWith('{'))return String(raw)}catch(e){}}
 try{const p=new URLSearchParams(location.search);return p.get('flock_id')||p.get('flockId')||''}catch(e){return ''}
}
function activeDay(){
 const status=$('dayStatus')?.textContent||'';
 const m=status.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).match(/\d+/);
 if(m)return Number(m[0]);
 const active=document.querySelector('#daySwitch .day-btn.active,[data-day].active');
 if(active){const d=n(active.dataset.day);if(d)return d;const mm=(active.textContent||'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).match(/\d+/);if(mm)return Number(mm[0])}
 return Number(new URLSearchParams(location.search).get('day'))||1;
}
async function getContext(){
 if(!window.supabaseClient)return null;
 const flockId=selectedFlockId();if(!flockId)return null;
 const day=activeDay();
 const [fq,rq]=await Promise.all([
  supabaseClient.from('flocks').select('initial_bird_count').eq('id',flockId).maybeSingle(),
  supabaseClient.from('broiler_daily_monitoring').select('age_days,doa_count,mortality_count,cull_count').eq('flock_id',flockId).order('age_days',{ascending:true})
 ]);
 if(fq.error||rq.error||!fq.data)return null;
 return {flockId,day,initial:n(fq.data.initial_bird_count),rows:rq.data||[]};
}
function calcAvg(ctx){
 if(!ctx?.initial)return null;
 let opening=ctx.initial;
 ctx.rows.filter(r=>Number(r.age_days)<ctx.day).forEach(r=>{opening-=(n(r.doa_count)||0)+(n(r.mortality_count)||0)+(n(r.cull_count)||0)});
 if(ctx.day===1)opening-=n($('doaCount')?.value)||0;
 opening=Math.max(0,opening);
 const closing=Math.max(0,opening-(n($('mortalityCount')?.value)||0)-(n($('cullCount')?.value)||0));
 return (opening+closing)/2;
}
async function preview(){
 inject();
 const ctx=await getContext();if(!ctx)return false;
 const avg=calcAvg(ctx);if(!(avg>0))return false;
 const feed=n($('feedQuantity')?.value),water=n($('waterQuantity')?.value);
 set('feedPerBird',feed!=null?((feed*1000)/avg).toFixed(2):'');
 set('waterPerBird',water!=null?((water*1000)/avg).toFixed(2):'');
 return true;
}
async function persistBridge(){
 if(!window.supabaseClient||!$('dailyForm'))return;
 const flockId=selectedFlockId();if(!flockId)return;
 const requestedDate=new URLSearchParams(location.search).get('date');
 const requestedDay=activeDay();
 const q=await supabaseClient.from('broiler_daily_monitoring').select('id,age_days,record_date,mortality_count,cull_count,doa_count,feed_quantity_kg,water_quantity_l').eq('flock_id',flockId).order('age_days',{ascending:true});
 if(q.error)return;
 const rows=q.data||[];const target=requestedDate?rows.find(r=>String(r.record_date)===requestedDate):rows.find(r=>Number(r.age_days)===requestedDay)||rows[rows.length-1];if(!target)return;
 const fq=await supabaseClient.from('flocks').select('initial_bird_count').eq('id',flockId).maybeSingle();const base=n(fq.data?.initial_bird_count);if(!base)return;
 let opening=base;rows.filter(r=>Number(r.age_days)<Number(target.age_days)).forEach(r=>{opening-=(n(r.doa_count)||0)+(n(r.mortality_count)||0)+(n(r.cull_count)||0)});
 opening=Math.max(0,opening);const closing=Math.max(0,opening-(n(target.mortality_count)||0)-(n(target.cull_count)||0));const avg=(opening+closing)/2;
 const feed=n(target.feed_quantity_kg),water=n(target.water_quantity_l);
 const payload={vent_temperature_c:n($('ventTemperature')?.value),feed_per_bird_g:feed!=null&&avg>0?Number(((feed*1000)/avg).toFixed(4)):null,water_per_bird_ml:water!=null&&avg>0?Number(((water*1000)/avg).toFixed(4)):null};
 await supabaseClient.from('broiler_daily_monitoring').update(payload).eq('id',target.id);
}
function start(){
 if(!inject())return setTimeout(start,150);
 const bind=['feedQuantity','waterQuantity','mortalityCount','cullCount','doaCount'];
 bind.forEach(id=>$(id)?.addEventListener('input',preview));
 ['daySwitch','dayStatus'].forEach(id=>$(id)?.addEventListener('click',()=>setTimeout(preview,120)));
 let tries=0;
 const wait=async()=>{tries++;if(await preview())return;if(tries<80)setTimeout(wait,250)};
 wait();
 document.querySelector('#dailyForm')?.addEventListener('submit',()=>setTimeout(persistBridge,1200),true);
 const mo=new MutationObserver(()=>{if(!$('dailyForm'))return;inject();preview()});
 mo.observe(document.getElementById('dailyForm')||document.body,{subtree:true,childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
