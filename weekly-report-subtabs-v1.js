/* ADINE — WEEKLY REPORT SUBTABS V1
   Presentation-only shell. Weekly report calculations remain untouched.
*/
(function(){
  'use strict';
  const ID='weekly-report-subtabs-v1';
  const $=id=>document.getElementById(id);
  function asset(tag,attrs){return new Promise(resolve=>{const el=document.createElement(tag);Object.keys(attrs).forEach(k=>el[k]=attrs[k]);el.onload=resolve;el.onerror=resolve;document.head.appendChild(el)})}
  async function loadAssets(){
    if(!$('f7-report-css')){const l=document.createElement('link');l.id='f7-report-css';l.rel='stylesheet';l.href='broiler-daily-first7-report-v1.css?v=20260916.3';document.head.appendChild(l)}
    if(!window.ADINE_BROILER_DAILY_STANDARDS_V1)await asset('script',{src:'broiler-daily-standards-v1.js?v=20260916.3'});
    if(!window.ADINE_BROILER_FIRST7_REPORT_ENGINE_V1)await asset('script',{src:'broiler-daily-first7-report-engine-v1.js?v=20260916.3'});
    if(!window.ADINE_BROILER_FIRST7_REPORT_UI_V1)await asset('script',{src:'broiler-daily-first7-report-ui-v1.js?v=20260916.3'});
  }
  function ensureShell(){
    let shell=$(ID);
    if(shell)return shell;
    const top=document.querySelector('.report-tabs');
    if(!top)return null;
    shell=document.createElement('section');
    shell.id=ID;
    shell.className='weekly-report-subtabs-shell report-card';
    shell.innerHTML='<nav class="weekly-report-subtabs" aria-label="زیرگزارش‌های گزارش هفتگی"><button type="button" class="report-tab weekly-subtab active" data-weekly-subtab="daily">گزارش روزانه — هفت روز اول</button><button type="button" class="report-tab weekly-subtab" data-weekly-subtab="weekly">گزارش هفتگی</button></nav><section id="weeklyDailyPlaceholder" class="weekly-daily-placeholder" aria-live="polite"></section>';
    top.insertAdjacentElement('afterend',shell);
    return shell;
  }
  function hideShell(){const shell=$(ID);if(shell)shell.style.display='none'}
  function setMode(mode){
    const shell=ensureShell();if(!shell)return;
    const top=document.querySelector('.report-tabs');
    const weekly=top?.querySelector('[data-tab="weekly"]');
    if(weekly && !weekly.classList.contains('active')){hideShell();return}
    shell.style.display='block';
    shell.querySelectorAll('[data-weekly-subtab]').forEach(btn=>btn.classList.toggle('active',btn.getAttribute('data-weekly-subtab')===mode));
    const selector=$('weeklyWeekSelectorSlot');
    const root=$('root');
    const showWeekly=mode==='weekly';
    if(selector)selector.style.display=showWeekly?'':'none';
    if(root)root.style.display='block';
  }
  function bind(shell){
    if(shell.dataset.bound==='1')return;
    shell.dataset.bound='1';
    shell.addEventListener('click',async e=>{
      const btn=e.target.closest('[data-weekly-subtab]');if(!btn)return;
      const mode=btn.getAttribute('data-weekly-subtab');
      setMode(mode);
      if(mode==='daily'){await loadAssets();window.ADINE_BROILER_FIRST7_REPORT_UI_V1?.showDaily()}
      else window.ADINE_BROILER_FIRST7_REPORT_UI_V1?.showWeekly();
    });
    document.querySelectorAll('.report-tab[data-tab]').forEach(btn=>{
      if(btn.dataset.weeklySubtabsBound==='1')return;
      btn.dataset.weeklySubtabsBound='1';
      btn.addEventListener('click',()=>requestAnimationFrame(async()=>{
        if(btn.getAttribute('data-tab')==='weekly'){
          setMode('daily');
          await loadAssets();
          window.ADINE_BROILER_FIRST7_REPORT_UI_V1?.showDaily();
        }else hideShell();
      }));
    });
  }
  async function start(){
    const shell=ensureShell();
    if(!shell)return setTimeout(start,100);
    bind(shell);
    const weekly=document.querySelector('.report-tabs [data-tab="weekly"]');
    if(!weekly || weekly.classList.contains('active')){
      setMode('daily');
      await loadAssets();
      window.ADINE_BROILER_FIRST7_REPORT_UI_V1?.showDaily();
    }else hideShell();
    const top=document.querySelector('.report-tabs');
    if(top && !top.dataset.weeklySubtabsObserver){
      top.dataset.weeklySubtabsObserver='1';
      const observer=new MutationObserver(()=>{
        const w=top.querySelector('[data-tab="weekly"]');
        if(w?.classList.contains('active'))setMode('daily');else hideShell();
      });
      observer.observe(top,{subtree:true,attributes:true,attributeFilter:['class']});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
