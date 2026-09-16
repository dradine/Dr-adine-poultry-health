/* ADINE — WEEKLY REPORT SUBTABS V1 */
(function(){
  'use strict';
  const ID='weekly-report-subtabs-v1';
  function asset(tag,attrs){return new Promise(resolve=>{const el=document.createElement(tag);Object.keys(attrs).forEach(k=>el[k]=attrs[k]);el.onload=resolve;el.onerror=resolve;document.head.appendChild(el)})}
  async function loadAssets(){
    if(!document.getElementById('f7-report-css')){const l=document.createElement('link');l.id='f7-report-css';l.rel='stylesheet';l.href='broiler-daily-first7-report-v1.css?v=20260916.1';document.head.appendChild(l)}
    if(!window.ADINE_BROILER_DAILY_STANDARDS_V1)await asset('script',{src:'broiler-daily-standards-v1.js?v=20260916.2'});
    if(!window.ADINE_BROILER_FIRST7_REPORT_ENGINE_V1)await asset('script',{src:'broiler-daily-first7-report-engine-v1.js?v=20260916.1'});
    if(!window.ADINE_BROILER_FIRST7_REPORT_UI_V1)await asset('script',{src:'broiler-daily-first7-report-ui-v1.js?v=20260916.1'});
  }
  function load(){
    if(document.getElementById(ID))return;
    const top=document.querySelector('.report-tabs');
    if(!top)return;
    const weekly=top.querySelector('[data-tab="weekly"]);
    if(!weekly)return;
    const shell=document.createElement('section');shell.id=ID;shell.className='weekly-report-subtabs-shell report-card';
    shell.innerHTML='<nav class="weekly-report-subtabs" aria-label="زیرگزارش‌های گزارش هفتگی"><button type="button" class="report-tab weekly-subtab active" data-weekly-subtab="daily">گزارش روزانه — هفت روز اول</button><button type="button" class="report-tab weekly-subtab" data-weekly-subtab="weekly">گزارش هفتگی</button></nav><section id="weeklyDailyPlaceholder" class="weekly-daily-placeholder" aria-live="polite"></section>';
    top.insertAdjacentElement('afterend',shell);bind(shell);setMode('daily');
  }
  function bind(shell){shell.addEventListener('click',async function(e){const btn=e.target.closest('[data-weekly-subtab]');if(!btn)return;const mode=btn.getAttribute('data-weekly-subtab');setMode(mode);if(mode==='daily'){await loadAssets();window.ADINE_BROILER_FIRST7_REPORT_UI_V1?.showDaily()}});document.querySelectorAll('.report-tab[data-tab]').forEach(btn=>btn.addEventListener('click',function(){requestAnimationFrame(function(){if(btn.getAttribute('data-tab')==='weekly'){setMode('daily');loadAssets().then(()=>window.ADINE_BROILER_FIRST7_REPORT_UI_V1?.showDaily())}else hideShell()})}))}
  function hideShell(){const shell=document.getElementById(ID);if(shell)shell.style.display='none'}
  function setMode(mode){const shell=document.getElementById(ID);if(!shell)return;const top=document.querySelector('.report-tabs'),weekly=top?.querySelector('[data-tab="weekly"]');if(!weekly?.classList.contains('active')){hideShell();return}shell.style.display='block';shell.querySelectorAll('[data-weekly-subtab]').forEach(btn=>btn.classList.toggle('active',btn.getAttribute('data-weekly-subtab')===mode));const selector=document.getElementById('weeklyWeekSelectorSlot'),root=document.getElementById('root');const showWeekly=mode==='weekly';if(selector)selector.style.display=showWeekly?'':'none';if(root)root.style.display='block'}
  function observe(){load();const top=document.querySelector('.report-tabs');if(!top)return setTimeout(observe,100);const observer=new MutationObserver(function(){const shell=document.getElementById(ID),weekly=top.querySelector('[data-tab="weekly"]');if(!shell){load();return}if(weekly?.classList.contains('active'))shell.style.display='block';else hideShell()});observer.observe(top,{subtree:true,attributes:true,attributeFilter:['class']})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();
