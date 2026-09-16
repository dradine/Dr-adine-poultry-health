/* ADINE — WEEKLY REPORT SUBTABS V2
   Weekly report is the canonical renderer. Daily first-7 is an isolated view.
   IMPORTANT: entering reports.html keeps the weekly report visible; daily is opt-in.
*/
(function(){
  'use strict';
  const ID='weekly-report-subtabs-v1';
  const $=id=>document.getElementById(id);
  function asset(src){return new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=resolve;document.body.appendChild(s)})}
  async function loadDaily(){
    if(!window.ADINE_BROILER_DAILY_STANDARDS_V1)await asset('broiler-daily-standards-v1.js?v=20260916.3');
    if(!window.ADINE_BROILER_FIRST7_REPORT_ENGINE_V1)await asset('broiler-daily-first7-report-engine-v1.js?v=20260916.3');
    if(!window.ADINE_BROILER_FIRST7_DAYVIEW_V1)await asset('broiler-daily-first7-dayview-v1.js?v=20260916.1');
  }
  function ensureShell(){
    let shell=$(ID);if(shell)return shell;
    const top=document.querySelector('.report-tabs');if(!top)return null;
    shell=document.createElement('section');shell.id=ID;shell.className='weekly-report-subtabs-shell report-card';
    shell.innerHTML='<nav class="weekly-report-subtabs" aria-label="زیرگزارش‌های گزارش هفتگی"><button type="button" class="report-tab weekly-subtab" data-weekly-subtab="daily">گزارش روزانه — هفت روز اول</button><button type="button" class="report-tab weekly-subtab active" data-weekly-subtab="weekly">گزارش هفتگی</button></nav>';
    top.insertAdjacentElement('afterend',shell);return shell;
  }
  function setMode(mode){const shell=ensureShell();if(!shell)return;shell.style.display='block';shell.querySelectorAll('[data-weekly-subtab]').forEach(b=>b.classList.toggle('active',b.dataset.weeklySubtab===mode));}
  function rerenderWeekly(){
    const tabs=document.querySelector('.report-tabs');if(!tabs)return;
    const weekly=tabs.querySelector('[data-tab="weekly"]'),overall=tabs.querySelector('[data-tab="overall"]');
    if(!weekly)return;
    if(overall){overall.click();requestAnimationFrame(()=>weekly.click());}else weekly.click();
  }
  function bind(shell){
    if(shell.dataset.bound==='1')return;shell.dataset.bound='1';
    shell.addEventListener('click',async e=>{
      const b=e.target.closest('[data-weekly-subtab]');if(!b)return;
      const mode=b.dataset.weeklySubtab;
      if(mode==='daily'){
        setMode('daily');
        await loadDaily();
        window.ADINE_BROILER_FIRST7_DAYVIEW_V1?.showDaily?.();
      }else{
        setMode('weekly');
        rerenderWeekly();
      }
    });
  }
  function bindTopTabs(shell){
    document.querySelectorAll('.report-tab[data-tab]').forEach(btn=>{
      if(btn.dataset.weeklySubtabsBound==='2')return;btn.dataset.weeklySubtabsBound='2';
      btn.addEventListener('click',()=>requestAnimationFrame(()=>{
        if(btn.dataset.tab==='weekly')setMode('weekly');else shell.style.display='none';
      }));
    });
  }
  function start(){
    const shell=ensureShell();if(!shell)return setTimeout(start,100);
    bind(shell);bindTopTabs(shell);
    const weekly=document.querySelector('.report-tabs [data-tab="weekly"]');
    if(weekly?.classList.contains('active'))setMode('weekly');else shell.style.display='none';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
