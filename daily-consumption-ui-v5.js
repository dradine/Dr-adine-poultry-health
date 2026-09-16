/* ADINE — DAILY CONSUMPTION UI V7
   Lightweight UI-only layer. No Supabase queries, polling, or MutationObserver.
   Uses the same displayed survival value as the daily engine.
*/
(function(){
'use strict';
if(window.__ADINE_DAILY_CONSUMPTION_UI_V7)return;
window.__ADINE_DAILY_CONSUMPTION_UI_V7=true;
const $=id=>document.getElementById(id);
const num=v=>{
  if(v==null||v==='')return null;
  const x=Number(String(v).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٬،,]/g,''));
  return Number.isFinite(x)?x:null;
};
function removeOldAveragePopulation(){
  document.querySelectorAll('#avgLivePopulation,[id*="avgLivePopulation"],[data-daily-derived-metric="avgLivePopulation"]').forEach(el=>(el.closest('.group')||el).remove());
  document.querySelectorAll('.group').forEach(g=>{const label=(g.querySelector('label')?.textContent||'').trim();if(label.includes('میانگین جمعیت زنده'))g.remove()});
}
function mountFields(){
  const form=$('dailyForm'); if(!form)return false;
  removeOldAveragePopulation();
  const grid=$('feedQuantity')?.closest('.group')?.parentElement; if(!grid)return false;
  function add(id,label,unit){
    if($(id))return;
    const g=document.createElement('div');g.className='group';g.dataset.dailyConsumptionV7='1';
    const l=document.createElement('label');l.textContent=label+' ('+unit+')';
    const input=document.createElement('input');input.id=id;input.className='readonly';input.readOnly=true;input.inputMode='decimal';
    g.append(l,input);grid.appendChild(g);
  }
  add('feedPerBirdV5','مصرف دان هر پرنده','گرم');
  add('waterPerBirdV5','مصرف آب هر پرنده','میلی‌لیتر');
  const wt=$('weightTarget');const wtLabel=wt?.closest('.group')?.querySelector('label');if(wtLabel)wtLabel.textContent='مرجع وزن روزانه';
  return true;
}
function calculate(){
  if(!mountFields())return false;
  const feed=num($('feedQuantity')?.value),water=num($('waterQuantity')?.value);
  let live=num($('survivalCount')?.value);
  if(!(live>0)){
    const initial=num($('initialCount')?.value),cumMort=num($('cumMortalityCount')?.value)||0;
    const cumCull=num($('cumCullCount')?.value),cull=cumCull!=null?cumCull:(num($('cullCount')?.value)||0);
    if(initial>0)live=Math.max(0,initial-cumMort-cull);
  }
  if($('feedPerBirdV5'))$('feedPerBirdV5').value=feed!=null&&live>0?((feed*1000)/live).toFixed(2):'';
  if($('waterPerBirdV5'))$('waterPerBirdV5').value=water!=null&&live>0?((water*1000)/live).toFixed(2):'';
  return true;
}
function start(){
  let tries=0;
  const retry=()=>{calculate();tries++;if(tries<12 && (!num($('survivalCount')?.value)||!$('feedPerBirdV5')||!$('waterPerBirdV5')))setTimeout(retry,300)};
  retry();
  ['feedQuantity','waterQuantity','survivalCount','doaCount','mortalityCount','cullCount','cumMortalityCount','cumCullCount'].forEach(id=>{
    const el=$(id);if(el){el.addEventListener('input',calculate);el.addEventListener('change',calculate)}
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
