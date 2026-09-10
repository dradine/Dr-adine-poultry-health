/* ADINE — COMPREHENSIVE REPORT ISOLATION V1
   Prevents the legacy reports.js view from flashing over the isolated V2 comprehensive report.
   The weekly and comparison views remain owned by the existing reports orchestrator.
*/
"use strict";
(function(){
  const ROOT_ID='root';
  const TOOLBAR_SELECTOR='.report-toolbar';
  const STYLE_ID='adine-comprehensive-isolation-style-v1';

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      body.adine-comprehensive-active #${ROOT_ID}{visibility:hidden;}
      body.adine-comprehensive-active ${TOOLBAR_SELECTOR}{display:none;}
      body.adine-comprehensive-ready #${ROOT_ID}{visibility:visible;}
    `;
    document.head.appendChild(s);
  }

  function setMode(tab){
    const overall=tab==='overall';
    document.body.classList.toggle('adine-comprehensive-active',overall);
    document.body.classList.toggle('adine-comprehensive-ready',!overall);
    if(!overall){
      const root=document.getElementById(ROOT_ID);
      if(root) root.style.visibility='visible';
    }
  }

  function markReadyWhenV2Appears(){
    if(document.querySelector('#root .cr2-hero')){
      document.body.classList.remove('adine-comprehensive-active');
      document.body.classList.add('adine-comprehensive-ready');
      return true;
    }
    return false;
  }

  function hook(){
    installStyle();
    setMode(document.querySelector('.report-tab.active')?.dataset?.tab||'weekly');

    document.addEventListener('click',e=>{
      const tab=e.target.closest?.('.report-tab');
      if(!tab) return;
      setMode(tab.dataset.tab);
    },true);

    const observer=new MutationObserver(()=>{
      const active=document.querySelector('.report-tab.active')?.dataset?.tab;
      if(active==='overall'){
        if(markReadyWhenV2Appears()) return;
        document.body.classList.add('adine-comprehensive-active');
        document.body.classList.remove('adine-comprehensive-ready');
      }else{
        setMode(active||'weekly');
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});

    window.addEventListener('adine:report-ready',()=>{
      if(document.querySelector('.report-tab.active')?.dataset?.tab==='overall'){
        setTimeout(markReadyWhenV2Appears,0);
      }
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});
  else hook();
})();
