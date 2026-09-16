/* ADINE — DAILY CONSUMPTION UI V5
   Hard-mounted by weekly.html into the daily iframe.
   Average live population is internal only.
*/
(function(){'use strict';
if(window.__ADINE_DAILY_CONSUMPTION_UI_V5)return;window.__ADINE_DAILY_CONSUMPTION_UI_V5=true;
const $=id=>document.getElementById(id);
const num=v=>{if(v==null||v==='')return null;const x=Number(String(v).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٬،,]/g,''));return Number.isFinite(x)?x:null};
function day(){const s=$('dayStatus')?.textContent||'';const z=s.replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).match(/\d+/);return z?Number(z[0]):Number(new URLSearchParams(location.search).get('day'))||1}
function flockId(){try{if(typeof getCurrentSelection==='function'){const s=getCurrentSelection()||{};const id=s.flockId||s.flock_id||s.id;if(id)return String(id)}}catch(e){}for(const k of ['adine_poultry_current_selection','adine_selected_flock']){try{const r=localStorage.getItem(k);if(!r)continue;try{const o=JSON.parse(r);const id=o?.flockId||o?.flock_id||o?.id;if(id)return String(id)}catch(e){}if(!r.startsWith('{'))return String(r)}catch(e){}}return ''}
function mount(){const form=$('dailyForm');if(!form)return false;
 document.querySelectorAll('#avgLivePopulation,[id*="avgLivePopulation"],[data-daily-derived-metric="avgLivePopulation"]').forEach(e=>(e.closest('.group')||e).remove());
 document.querySelectorAll('.group').forEach(g=>{const t=(g.querySelector('label')?.textContent||'').trim();if(t.includes('میانگین جمعیت زنده'))g.remove()});
 const grid=$('feedQuantity')?.closest('.group')?.parentElement;if(!grid)return false;
 function add(id,label,unit){if($(id))return;const g=document.createElement('div');g.className='group';g.dataset.dailyConsumptionV5='1';g.innerHTML='<label>'+label+' ('+unit+')</label><input id="'+id+'" class="readonly" readonly>';grid.appendChild(g)}
 add('feedPerBirdV5','مصرف دان هر پرنده','گرم');add('waterPerBirdV5','مصرف آب هر پرنده','میلی‌لیتر');
 const wt=$('weightTarget');if(wt){const l=wt.closest('.group')?.querySelector('label');if(l)l.textContent='مرجع وزن روزانه'}return true}
async function calc(){if(!mount()||!window.supabaseClient)return false;const id=flockId();if(!id)return false;const a=day();
 const [fq,rq]=await Promise.all([supabaseClient.from('flocks').select('initial_bird_count').eq('id',id).maybeSingle(),supabaseClient.from('broiler_daily_monitoring').select('age_days,doa_count,mortality_count,cull_count,feed_quantity_kg,water_quantity_l').eq('flock_id',id).order('age_days',{ascending:true})]);
 if(fq.error||rq.error||!fq.data)return false;const rows=rq.data||[];const base=num(fq.data.initial_bird_count);if(!(base>0))return false;let opening=base;
 for(const r of rows){if(Number(r.age_days)<a)opening-=(num(r.doa_count)||0)+(num(r.mortality_count)||0)+(num(r.cull_count)||0)}
 const current=rows.find(r=>Number(r.age_days)===a)||null;if(a===1)opening-=num($('doaCount')?.value)??(current?num(current.doa_count)||0:0);opening=Math.max(0,opening);
 const mort=num($('mortalityCount')?.value)??(current?num(current.mortality_count)||0:0),cull=num($('cullCount')?.value)??(current?num(current.cull_count)||0:0);const avg=(opening+Math.max(0,opening-mort-cull))/2;
 const feed=num($('feedQuantity')?.value)??(current?num(current.feed_quantity_kg):null),water=num($('waterQuantity')?.value)??(current?num(current.water_quantity_l):null);if($('feedPerBirdV5'))$('feedPerBirdV5').value=feed!=null&&avg>0?((feed*1000)/avg).toFixed(2):'';if($('waterPerBirdV5'))$('waterPerBirdV5').value=water!=null&&avg>0?((water*1000)/avg).toFixed(2):'';return true}
function start(){let tries=0;const run=()=>{tries++;calc().catch(()=>{});if(tries<120)setTimeout(run,250)};run();new MutationObserver(()=>{mount();calc().catch(()=>{})}).observe(document.body,{subtree:true,childList:true});['feedQuantity','waterQuantity','mortalityCount','cullCount','doaCount'].forEach(id=>document.addEventListener('input',e=>{if(e.target?.id===id)calc().catch(()=>{})}))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
