/* ADINE BROILER PERFORMANCE — LIFECYCLE GUARD V8
 * Presentation/lifecycle isolation only.
 *
 * This guard is allowed to control visibility only while entering/staying in
 * the Comprehensive/BPI report. Weekly and Comparison remain fully owned by
 * their existing renderers and are never hidden, parked, or gated here.
 * No calculations, standards, persistence, or canonical data are touched.
 */
(function(global){
'use strict';
if(global.__ADINE_BPI_LIFECYCLE_GUARD_V8__)return;
global.__ADINE_BPI_LIFECYCLE_GUARD_V8__=true;

const ROOT_ID='root',SHELL_ID='broiler-performance-intelligence-v3-shell',PARK_ID='adine-bpi-shell-parking-v1';
let lastShell=null,rehydrating=false,transitioning=false,bpiTransitioning=false,reportReady=false;
let staleHeroes=new WeakSet();
const $=id=>document.getElementById(id);
const root=()=>$(ROOT_ID);
const activeTab=()=>document.querySelector('.report-tab.active')?.getAttribute('data-tab')||null;
const bpiShell=()=>document.querySelector('#'+SHELL_ID);
const activeBpiPanel=()=>bpiShell()?.querySelector('.bpi3-panel.active')||null;
const heroes=()=>Array.from(document.querySelectorAll('#root .cr2-hero'));

function clearRootGate(){
  const r=root();
  if(!r)return;
  r.style.visibility='';
  r.removeAttribute('aria-busy');
  transitioning=false;
  reportReady=true;
}
function armOverallWait(){
  staleHeroes=new WeakSet(heroes());
  reportReady=false;
}
function hasFreshHero(){
  return heroes().some(h=>!staleHeroes.has(h));
}
function parking(){
  let p=$(PARK_ID);
  if(!p){
    p=document.createElement('div');
    p.id=PARK_ID;
    p.hidden=true;
    p.setAttribute('aria-hidden','true');
    document.body.appendChild(p);
  }
  return p;
}
function shellInRoot(){const r=root();return r?.querySelector('#'+SHELL_ID)||null}
function park(){const s=shellInRoot();if(s)parking().appendChild(s)}
function restore(){
  const r=root(),p=$(PARK_ID);
  if(!r||!p)return null;
  const s=p.querySelector('#'+SHELL_ID);
  if(!s)return null;
  r.appendChild(s);
  return s;
}
function quarantineLegacy(){document.querySelectorAll('#broiler-intelligence-panel').forEach(x=>x.remove())}

function conceal(){
  const r=root();
  if(!r)return;
  transitioning=true;
  r.style.visibility='hidden';
  r.setAttribute('aria-busy','true');
}
function reveal(){
  const r=root();
  if(!r||!transitioning||!reportReady)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(!transitioning||!reportReady||activeTab()!=='overall')return;
    r.style.visibility='';
    r.removeAttribute('aria-busy');
    transitioning=false;
  }));
}
function concealBpi(){
  const s=bpiShell();
  if(!s)return;
  bpiTransitioning=true;
  s.style.visibility='hidden';
  s.setAttribute('aria-busy','true');
}
function bpiReady(){
  const s=bpiShell(),p=activeBpiPanel();
  if(!s||!p)return false;
  const name=p.getAttribute('data-bpi3-panel');
  if(name==='intelligence')return !!p.querySelector('.bpi3-intro');
  return !p.querySelector('.bpi3-loading');
}
function revealBpi(){
  const s=bpiShell();
  if(!s||!bpiTransitioning||!bpiReady())return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(!bpiTransitioning||!bpiReady()||activeTab()!=='overall')return;
    s.style.visibility='';
    s.removeAttribute('aria-busy');
    bpiTransitioning=false;
  }));
}
function rehydrateReferenceLayer(shell){
  if(!shell||shell===lastShell)return;
  lastShell=shell;
  if(rehydrating)return;
  const src='broiler-performance-intelligence-reference-gap-v1.js?v=20260914.12';
  rehydrating=true;
  try{
    global.__ADINE_REFERENCE_LAYER_V11__=false;
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.onload=()=>{rehydrating=false};
    s.onerror=()=>{rehydrating=false};
    document.head.appendChild(s);
  }catch(_){rehydrating=false}
}
function reconcile(){
  quarantineLegacy();
  const tab=activeTab();
  if(tab==='overall'){
    const s=shellInRoot()||restore();
    if(s){
      rehydrateReferenceLayer(s);
      if(transitioning&&reportReady)reveal();
      if(bpiTransitioning)revealBpi();
    }
  }else{
    // Weekly/Comparison are not controlled by this guard.
    clearRootGate();
  }
}
function detectFreshReport(){
  if(activeTab()!=='overall'||reportReady)return false;
  if(hasFreshHero()){
    reportReady=true;
    return true;
  }
  return false;
}
function onTabCapture(e){
  const b=e.target?.closest?.('.report-tab');
  if(b){
    const next=b.getAttribute('data-tab');
    if(next==='overall'){
      conceal();
      armOverallWait();
      setTimeout(reconcile,0);
    }else{
      // Never hide or gate Weekly/Comparison.
      if(activeTab()==='overall')park();
      clearRootGate();
    }
    return;
  }
  const ib=e.target?.closest?.('.bpi3-tab');
  if(ib){
    concealBpi();
    setTimeout(()=>{quarantineLegacy();revealBpi()},0);
  }
}
document.addEventListener('click',onTabCapture,true);
if(typeof MutationObserver!=='undefined'){
  const mo=new MutationObserver(()=>{
    const tab=activeTab();
    if(tab==='overall'){
      const s=shellInRoot()||restore();
      if(s)rehydrateReferenceLayer(s);
      detectFreshReport();
      quarantineLegacy();
      if(transitioning&&reportReady)reconcile();
      if(bpiTransitioning)revealBpi();
    }else{
      // Do not interfere with Weekly/Comparison DOM.
      if(tab!=='overall')clearRootGate();
      quarantineLegacy();
    }
  });
  mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
}
window.addEventListener('pageshow',()=>{
  if(activeTab()==='overall'){
    conceal();
    armOverallWait();
    setTimeout(reconcile,0);
  }else clearRootGate();
});
window.addEventListener('popstate',()=>{
  if(activeTab()==='overall'){
    conceal();
    armOverallWait();
    setTimeout(reconcile,0);
  }else clearRootGate();
});
window.addEventListener('adine:report-ready',()=>{
  if(activeTab()==='overall'){
    setTimeout(()=>{
      if(hasFreshHero()||heroes().length===0)reportReady=true;
      reconcile();
    },0);
  }
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
  if(activeTab()==='overall'){
    conceal();
    staleHeroes=new WeakSet();
    reportReady=heroes().length>0;
    setTimeout(reconcile,0);
  }else clearRootGate();
},{once:true});
else{
  if(activeTab()==='overall'){
    conceal();
    staleHeroes=new WeakSet();
    reportReady=heroes().length>0;
    setTimeout(reconcile,0);
  }else clearRootGate();
}
})(window);
