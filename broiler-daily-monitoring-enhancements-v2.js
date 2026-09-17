/* ADINE — DAILY MONITORING ENHANCEMENTS V2
   Isolated daily monitoring calculation helper.
   Feed: kg/day -> grams/bird/day.
   Water: L/day -> ml/bird/day.
   Average live population is internal only.
*/
(function(){
'use strict';
if(window.__ADINE_DAILY_CONSUMPTION_V2)return;
window.__ADINE_DAILY_CONSUMPTION_V2=true;
const $=id=>document.getElementById(id);
const n=v=>{if(v==null||v==='')return null;const x=Number(String(v).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٬،,]/g,''));return Number.isFinite(x)?x:null};
const set=(id,v)=>{const e=$(id);if(e)e.value=v==null?'':v};
function flockId(){
 try{const s=typeof getCurrentSelection==='function'?getCurrentSelection()||{}:{};if(s.flockId)return String(s.flockId);if(s.flock_id)return String(s.flock_id);if(s.id&&s.farmId)return String(s.id)}catch(e){}
 try{const p=new URLSearchParams(location.search);const q=p.get('flock_id')||p.get('flockId');if(q)return q}catch(e){}
 for(const k of ['current_selection','adine_poultry_current_selection','adine_selected_flock']){try{const raw=localStorage.getItem(k);if(!raw)continue;const o=JSON.parse(raw);const id=o?.flockId||o?.flock_id;if(id)return String(id)}catch(e){try{const raw=localStorage.getItem(k);if(raw&&!raw.startsWith('{'))return raw}catch(_){} }}
 return null;
}
function targetAge(){const p=new URLSearchParams(location.search);const d=Number(p.get('day'));if(d>0)return d;return Number($('dayStatus')?.textContent?.match(/\d+/)?.[0])||1}
function addFields(){
 const fq=$('feedQuantity');if(!fq)return false;
 const grid=fq.closest('.group')?.parentElement;if(!grid)return false;
 const add=(id,label,unit)=>{if($(id))return;const g=document.createElement('div');g.className='group';g.innerHTML='<label>'+label+' ('+unit+')</label><input id="'+id+'" class="readonly" readonly>';grid.appendChild(g)};
 add('feedPerBird','مصرف دان هر پرنده','گرم');add('waterPerBird','مصرف آب هر پرنده','میلی‌لیتر');
 return true;
}
async function calculate(){
 if(!window.supabaseClient||!addFields())return false;
 const id=flockId();if(!id)return false;
 const age=targetAge();
 const [f,r]=await Promise.all([
  supabaseClient.from('flocks').select('initial_bird_count').eq('id',id).maybeSingle(),
  supabaseClient.from('broiler_daily_monitoring').select('age_days,record_date,doa_count,mortality_count,cull_count').eq('flock_id',id).order('age_days',{ascending:true})
 ]);
 if(f.error||r.error||!f.data)return false;
 const base=n(f.data.initial_bird_count);if(!(base>0))return false;
 const rows=r.data||[];
 let opening=base;
 rows.filter(x=>Number(x.age_days)<age).forEach(x=>{opening-=(n(x.doa_count)||0)+(n(x.mortality_count)||0)+(n(x.cull_count)||0)});
 opening=Math.max(0,opening);
 if(age===1)opening=Math.max(0,opening-(n($('doaCount')?.value)||0));
 const closing=Math.max(0,opening-(n($('mortalityCount')?.value)||0)-(n($('cullCount')?.value)||0));
 const avg=(opening+closing)/2;
 if(!(avg>0))return false;
 const feed=n($('feedQuantity')?.value),water=n($('waterQuantity')?.value);
 set('feedPerBird',feed!=null?((feed*1000)/avg).toFixed(2):'');
 set('waterPerBird',water!=null?((water*1000)/avg).toFixed(2):'');
 return true;
}
function bind(){
 ['feedQuantity','waterQuantity','mortalityCount','cullCount','doaCount'].forEach(id=>$(id)?.addEventListener('input',calculate));
 calculate();
 let ticks=0;const timer=setInterval(async()=>{ticks++;if(await calculate()||ticks>=80)clearInterval(timer)},250);
 const form=$('dailyForm');if(form)form.addEventListener('change',calculate);
}
function start(){if(addFields()){bind();return}setTimeout(start,200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();