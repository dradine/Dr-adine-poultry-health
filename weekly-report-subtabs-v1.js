/* ADINE — WEEKLY REPORT SUBTABS V1
   Presentation-only shell for the weekly report.
   It does not alter calculations, data loading, standards, navigation, or the
   existing weekly report renderer. The existing weekly report stays intact;
   this layer only places it behind a second-level tab and adds an empty daily tab.
*/
(function(){
  'use strict';
  const ID='weekly-report-subtabs-v1';
  function load(){
    if(document.getElementById(ID))return;
    const top=document.querySelector('.report-tabs');
    if(!top)return;
    const weekly=top.querySelector('[data-tab="weekly"]');
    if(!weekly)return;
    const shell=document.createElement('section');
    shell.id=ID;
    shell.className='weekly-report-subtabs-shell report-card';
    shell.innerHTML='<nav class="weekly-report-subtabs" aria-label="زیرگزارش‌های گزارش هفتگی"><button type="button" class="report-tab weekly-subtab active" data-weekly-subtab="daily">گزارش روزانه — هفت روز اول</button><button type="button" class="report-tab weekly-subtab" data-weekly-subtab="weekly">گزارش هفتگی</button></nav><section id="weeklyDailyPlaceholder" class="weekly-daily-placeholder" aria-live="polite"></section>';
    top.insertAdjacentElement('afterend',shell);
    bind(shell);
    setMode('daily');
  }
  function bind(shell){
    shell.addEventListener('click',function(e){
      const btn=e.target.closest('[data-weekly-subtab]');
      if(!btn)return;
      setMode(btn.getAttribute('data-weekly-subtab'));
    });
    document.querySelectorAll('.report-tab[data-tab]').forEach(btn=>btn.addEventListener('click',function(){
      if(btn.getAttribute('data-tab')==='weekly'){
        requestAnimationFrame(function(){setMode('daily')});
      }else{
        requestAnimationFrame(function(){hideShell()});
      }
    }));
  }
  function hideShell(){
    const shell=document.getElementById(ID);
    if(shell)shell.style.display='none';
  }
  function setMode(mode){
    const shell=document.getElementById(ID);
    if(!shell)return;
    const top=document.querySelector('.report-tabs');
    const weekly=top?.querySelector('[data-tab="weekly"]');
    const isWeeklyActive=weekly?.classList.contains('active');
    if(!isWeeklyActive){hideShell();return}
    shell.style.display='block';
    shell.querySelectorAll('[data-weekly-subtab]').forEach(btn=>btn.classList.toggle('active',btn.getAttribute('data-weekly-subtab')===mode));
    const placeholder=document.getElementById('weeklyDailyPlaceholder');
    const selector=document.getElementById('weeklyWeekSelectorSlot');
    const root=document.getElementById('root');
    const showWeekly=mode==='weekly';
    if(placeholder)placeholder.style.display=showWeekly?'none':'block';
    if(selector)selector.style.display=showWeekly?'':'none';
    if(root)root.style.display=showWeekly?'':'none';
  }
  function observe(){
    load();
    const top=document.querySelector('.report-tabs');
    if(!top)return setTimeout(observe,100);
    const observer=new MutationObserver(function(){
      const shell=document.getElementById(ID);
      const weekly=top.querySelector('[data-tab="weekly"]');
      if(!shell){load();return}
      if(weekly?.classList.contains('active')){
        if(!shell.dataset.userSelected)scheduleDefault();
      }else hideShell();
    });
    observer.observe(top,{subtree:true,attributes:true,attributeFilter:['class']});
  }
  function scheduleDefault(){
    const shell=document.getElementById(ID);
    if(!shell)return;
    shell.dataset.userSelected='1';
    setMode('daily');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();