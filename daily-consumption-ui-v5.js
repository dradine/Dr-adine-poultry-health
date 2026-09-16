/* ADINE — DAILY CONSUMPTION UI V6
   Mounted directly inside daily-core.html by weekly.html.
   Per-bird consumption uses the displayed current live population (زنده‌مانی).
   Average live population is never displayed or required for the UI calculation.
*/
(function(){
'use strict';
if(window.__ADINE_DAILY_CONSUMPTION_UI_V6)return;
window.__ADINE_DAILY_CONSUMPTION_UI_V6=true;

const $=id=>document.getElementById(id);
const num=v=>{
  if(v==null||v==='')return null;
  const x=Number(String(v)
    .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776))
    .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632))
    .replace(/[٬،,]/g,''));
  return Number.isFinite(x)?x:null;
};

function mount(){
  const form=$('dailyForm');
  if(!form)return false;

  // Remove any old average-live-population UI.
  document.querySelectorAll('#avgLivePopulation,[id*="avgLivePopulation"],[data-daily-derived-metric="avgLivePopulation"]').forEach(e=>(e.closest('.group')||e).remove());
  document.querySelectorAll('.group').forEach(g=>{
    const text=(g.querySelector('label')?.textContent||'').trim();
    if(text.includes('میانگین جمعیت زنده'))g.remove();
  });

  const anchor=$('feedQuantity')?.closest('.group');
  const grid=anchor?.parentElement;
  if(!grid)return false;

  function add(id,label,unit){
    if($(id))return;
    const g=document.createElement('div');
    g.className='group';
    g.dataset.dailyConsumptionV6='1';
    g.innerHTML='<label>'+label+' ('+unit+')</label><input id="'+id+'" class="readonly" readonly inputmode="decimal">';
    grid.appendChild(g);
  }
  add('feedPerBirdV5','مصرف دان هر پرنده','گرم');
  add('waterPerBirdV5','مصرف آب هر پرنده','میلی‌لیتر');

  const wt=$('weightTarget');
  const label=wt?.closest('.group')?.querySelector('label');
  if(label)label.textContent='مرجع وزن روزانه';
  return true;
}

function calculate(){
  if(!mount())return false;

  const feed=num($('feedQuantity')?.value);
  const water=num($('waterQuantity')?.value);

  // The main daily engine already calculates this field from:
  // initial birds - DOA - cumulative mortality - cumulative culls.
  // Use that exact live population as the denominator so the UI agrees
  // with the user's displayed زنده‌مانی figure.
  let live=num($('survivalCount')?.value);

  // Fallback for a very early render before survivalCount is populated.
  if(!(live>0)){
    const initial=num($('initialCount')?.value);
    const doa=num($('doaCount')?.value)||0;
    const mortality=num($('cumMortalityCount')?.value)||0;
    const culls=num($('cullCount')?.value)||0;
    if(initial>0)live=Math.max(0,initial-doa-mortality-culls);
  }

  if($('feedPerBirdV5'))$('feedPerBirdV5').value=feed!=null&&live>0?((feed*1000)/live).toFixed(2):'';
  if($('waterPerBirdV5'))$('waterPerBirdV5').value=water!=null&&live>0?((water*1000)/live).toFixed(2):'';
  return true;
}

function start(){
  let timer=null;
  const run=()=>{
    if(timer)clearTimeout(timer);
    timer=setTimeout(()=>{calculate();timer=null},60);
  };

  run();
  ['feedQuantity','waterQuantity','survivalCount','doaCount','mortalityCount','cullCount','cumMortalityCount','cumMortalityPercent'].forEach(id=>{
    document.addEventListener('input',e=>{if(e.target?.id===id)run()});
    document.addEventListener('change',e=>{if(e.target?.id===id)run()});
  });

  const observer=new MutationObserver(run);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});

  // Main daily engine populates values asynchronously after flock/record load.
  let tries=0;
  const poll=()=>{
    calculate();
    tries++;
    if(tries<100)setTimeout(poll,200);
  };
  poll();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
