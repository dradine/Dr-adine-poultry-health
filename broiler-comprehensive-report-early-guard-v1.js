/* ADINE — COMPREHENSIVE REPORT EARLY GUARD V1
   Runs before the legacy reports orchestrator so the old weekly renderer can never flash
   when the Comprehensive Performance Report tab is selected.
*/
"use strict";
(function(){
  const STYLE_ID='adine-comprehensive-early-guard-style-v1';
  function install(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent='body.adine-comprehensive-pending #root{visibility:hidden!important}body.adine-comprehensive-pending .report-toolbar{display:none!important}';
    (document.head||document.documentElement).appendChild(s);
  }
  function setPending(on){document.body.classList.toggle('adine-comprehensive-pending',!!on);}
  function hook(){
    install();
    document.addEventListener('click',function(e){
      const tab=e.target.closest&&e.target.closest('.report-tab[data-tab="overall"]');
      if(tab) setPending(true);
    },true);
    document.addEventListener('click',function(e){
      const tab=e.target.closest&&e.target.closest('.report-tab');
      if(tab&&tab.dataset.tab!=='overall') setPending(false);
    },true);
    const obs=new MutationObserver(function(){
      const active=document.querySelector('.report-tab.active')?.dataset?.tab;
      if(active==='overall'){
        const ready=document.querySelector('#root .cr2-hero');
        setPending(!ready);
      }else setPending(false);
    });
    obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  hook();
})();
