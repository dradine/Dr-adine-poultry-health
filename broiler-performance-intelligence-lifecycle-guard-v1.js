/* ADINE BROILER PERFORMANCE — LIFECYCLE GUARD V3
 * Presentation/lifecycle isolation only.
 * Preserves the processed BPI shell across report-tab replacement and
 * rehydrates the reference presentation layer whenever a new shell instance
 * is created. No calculations, standards, persistence, or canonical data are touched.
 */
(function(global){
'use strict';
if(global.__ADINE_BPI_LIFECYCLE_GUARD_V3__)return;
global.__ADINE_BPI_LIFECYCLE_GUARD_V3__=true;

const ROOT_ID='root',SHELL_ID='broiler-performance-intelligence-v3-shell',PARK_ID='adine-bpi-shell-parking-v1';
let lastShell=null,rehydrating=false;
const $=id=>document.getElementById(id);
const root=()=>$(ROOT_ID);
const activeTab=()=>document.querySelector('.report-tab.active')?.getAttribute('data-tab')||null;

function parking(){let p=$(PARK_ID);if(!p){p=document.createElement('div');p.id=PARK_ID;p.hidden=true;p.setAttribute('aria-hidden','true');document.body.appendChild(p)}return p}
function shellInRoot(){const r=root();return r?.querySelector('#'+SHELL_ID)||null}
function park(){const s=shellInRoot();if(s)parking().appendChild(s);}
function restore(){const r=root(),p=$(PARK_ID);if(!r||!p)return null;const s=p.querySelector('#'+SHELL_ID);if(!s)return null;r.appendChild(s);return s}
function quarantineLegacy(){document.querySelectorAll('#broiler-intelligence-panel').forEach(x=>x.remove())}

function rehydrateReferenceLayer(shell){
  if(!shell||shell===lastShell)return;
  lastShell=shell;
  if(rehydrating)return;
  const src='broiler-performance-intelligence-reference-gap-v1.js?v=20260914.12';
  rehydrating=true;
  try{
    // V11 keeps a private lastKey closure. A newly-created shell can therefore
    // look identical to the old one and be skipped. Re-running the isolated
    // presentation layer gives that new DOM instance a fresh lifecycle state.
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
    if(s)rehydrateReferenceLayer(s);
  }else{
    park();
  }
}

function onTabCapture(e){
  const b=e.target?.closest?.('.report-tab');
  if(!b)return;
  const next=b.getAttribute('data-tab');
  if(activeTab()==='overall'&&next!=='overall')park();
  if(next==='overall')setTimeout(reconcile,0);
}

document.addEventListener('click',onTabCapture,true);
if(typeof MutationObserver!=='undefined'){
  const mo=new MutationObserver(()=>{
    const s=shellInRoot();
    if(activeTab()==='overall'){
      if(s)rehydrateReferenceLayer(s);
      else {const restored=restore();if(restored)rehydrateReferenceLayer(restored)}
    }else if(s)park();
    quarantineLegacy();
  });
  mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
}
window.addEventListener('pageshow',reconcile);
window.addEventListener('popstate',()=>setTimeout(reconcile,0));
window.addEventListener('adine:report-ready',()=>setTimeout(reconcile,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(reconcile,0),{once:true});
else setTimeout(reconcile,0);
})(window);
