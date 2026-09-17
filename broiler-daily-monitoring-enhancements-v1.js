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
function inject(){if(!$('dailyForm'))return false;
 const first=[...document.querySelectorAll('.sub.first-week-only')].find(x=>x.textContent.includes('ورود و کیفیت اولیه جوجه'));
 if(first){const grid=first.nextElementSibling;if(grid&&grid.classList.contains('form-grid'))addGroup(grid,'ventTemperature','دمای ونت جوجه','°C',false)}
 const feed=$('feedQuantity')?.closest('.group')?.parentElement;
 if(feed){addGroup(feed,'feedPerBird','مصرف دان هر پرنده','گرم',true);addGroup(feed,'waterPerBird','مصرف آب هر پرنده','میلی‌لیتر',true)}
 const oldAvg=$('avgLivePopulation');if(oldAvg){const g=oldAvg.closest('.group');if(g)g.remove()}
 return true}
function selectedFlockId(){
 try{const s=typeof getCurrentSelection==='function'?getCurrentSelection()||{}:{};if(s.flockId)return String(s.flockId);if(s.flock_id)return String(s.flock_id)}catch(e){}
 try{const p=new URLSearchParams(location.search);const q=p.get('flock_id')||p.get('flockId');if(q)return q}catch(e){}
 for(const k of ['current_selection','adine_poultry_current_selection','adine_selected_flock']){try{const raw=localStorage.getItem(k);if(!raw)continue;const o=JSON.parse(raw);const id=o?.flockId||o?.flock_id;if(id)return String(id)}catch(e){}}
 return null;
}
function selectedDay(){const p=new URLSearchParams(location.search);const d=Number(p.get('day'));if(d>0)return d;const m=String($('dayStatus')?.textContent||'').match(/\d+/);return m?Number(m[0]):1}
async function context(){
 if(!window.supabaseClient)return null;const id=selectedFlockId();if(!id)return null;const day=selectedDay();
 const [f,r]=await Promise.all([
  supabaseClient.from('flocks').select('initial_bird_count').eq('id',id).maybeSingle(),
  supabaseClient.from('broiler_daily_monitoring').select('id,age_days,record_date,doa_count,mortality_count,cull_count,feed_quantity_kg,water_quantity_l').eq('flock_id',id).order('age_days',{ascending:true})
 ]);
 if(f.error||r.error||!f.data)return null;return {id,day,initial:n(f.data.initial_bird_count),rows:r.data||[]};
}
function averageLive(ctx){
 if(!(ctx?.initial>0))return null;let opening=ctx.initial;
 ctx.rows.filter(r=>Number(r.age_days)<ctx.day).forEach(r=>{opening-=(n(r.doa_count)||0)+(n(r.mortality_count)||0)+(n(r.cull_count)||0)});
 opening=Math.max(0,opening);
 if(ctx.day===1)opening=Math.max(0,opening-(n($('doaCount')?.value)||0));
 const closing=Math.max(0,opening-(n($('mortalityCount')?.value)||0)-(n($('cullCount')?.value)||0));
 return (opening+closing)/2;
}
async function preview(){
 const ctx=await context();if(!ctx)return false;const avg=averageLive(ctx);if(!(avg>0))return false;
 const feed=n($('feedQuantity')?.value),water=n($('waterQuantity')?.value);
 set('feedPerBird',feed!=null?((feed*1000)/avg).toFixed(2):'');
 set('waterPerBird',water!=null?((water*1000)/avg).toFixed(2):'');
 return true;
}
async function persistBridge(){
 const ctx=await context();if(!ctx)return;const rows=ctx.rows;const target=rows.find(r=>Number(r.age_days)===ctx.day);if(!target?.id)return;
 const avg=averageLive(ctx);if(!(avg>0))return;const feed=n(target.feed_quantity_kg),water=n(target.water_quantity_l);
 const payload={vent_temperature_c:n($('ventTemperature')?.value),feed_per_bird_g:feed!=null?Number(((feed*1000)/avg).toFixed(4)):null,water_per_bird_ml:water!=null?Number(((water*1000)/avg).toFixed(4)):null};
 await supabaseClient.from('broiler_daily_monitoring').update(payload).eq('id',target.id);
}
function start(){
 if(!inject())return setTimeout(start,150);
 ['feedQuantity','waterQuantity','mortalityCount','cullCount','doaCount'].forEach(id=>$(id)?.addEventListener('input',preview));
 let ticks=0;const timer=setInterval(async()=>{ticks++;const ok=await preview();if(ok||ticks>=100)clearInterval(timer)},250);
 document.querySelector('#dailyForm')?.addEventListener('change',preview);
 document.querySelector('#dailyForm')?.addEventListener('submit',()=>setTimeout(persistBridge,1000),true);
 preview();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();