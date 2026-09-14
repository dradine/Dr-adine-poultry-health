/* ADINE BROILER PERFORMANCE — LIFECYCLE GUARD V12
 * Presentation/lifecycle coordination only.
 * Never hides #root and never gates Weekly/Comparison/Comprehensive rendering.
 *
 * Critical lifecycle rule:
 * The BPI shell is NOT reusable across top-level report tabs. The comprehensive
 * renderer replaces #root when Weekly/Comparison/Overall changes. Keeping the
 * old shell parked and restoring it later reuses stale intelligence cards/data.
 * Therefore a parked shell is discarded; the bootstrap creates a fresh shell
 * around the newly rendered comprehensive report, and the intelligence panel
 * is warmed once so its adapter reads a fresh canonical report model.
 *
 * Comparison rule:
 * reports.js has a legacy compare branch that clears #root. We intercept the
 * top-level comparison click here and hand it directly to the comparison
 * landing UI, preventing the comparison sub-tabs from being immediately wiped.
 */
(function(global){
'use strict';
if(global.__ADINE_BPI_LIFECYCLE_GUARD_V12__)return;
global.__ADINE_BPI_LIFECYCLE_GUARD_V12__=true;
const ROOT_ID='root',SHELL_ID='broiler-performance-intelligence-v3-shell',PARK_ID='adine-bpi-shell-parking-v1';
let refreshToken=0,refreshBusy=false;
const $=id=>document.getElementById(id);
const root=()=>$(ROOT_ID);
const activeTab=()=>document.querySelector('.report-tab.active')?.getAttribute('data-tab')||null;
function parking(){let p=$(PARK_ID);if(!p){p=document.createElement('div');p.id=PARK_ID;p.hidden=true;p.setAttribute('aria-hidden','true');document.body.appendChild(p)}return p}
function shellInRoot(){return root()?.querySelector('#'+SHELL_ID)||null}
function park(){const s=shellInRoot();if(s)parking().appendChild(s)}
function discardParked(){const p=$(PARK_ID);p?.querySelector('#'+SHELL_ID)?.remove()}
function freshShell(){discardParked();return shellInRoot()}
function comparisonLanding(){try{if(global.AdineComparisonLanding?.showLanding){global.AdineComparisonLanding.showLanding();return true}}catch(e){console.error(e)}return false}
function warmFreshIntelligence(shell){
  if(!shell||refreshBusy)return;
  const token=++refreshToken;refreshBusy=true;
  const intel=shell.querySelector('.bpi3-tab[data-bpi3-tab="intelligence"]');
  const overall=shell.querySelector('.bpi3-tab[data-bpi3-tab="overall"]');
  if(!intel||!overall){refreshBusy=false;return}
  intel.click();
  let n=0;
  const timer=setInterval(()=>{
    if(token!==refreshToken||activeTab()!=='overall'){clearInterval(timer);refreshBusy=false;return}
    const ready=!!shell.querySelector('.bpi3-intro,.bpi3-content,.bpi3-grid,.bpi3-card');
    const loading=!!shell.querySelector('.bpi3-loading');
    if((ready&&!loading)||++n>100){clearInterval(timer);overall.click();refreshBusy=false}
  },50);
}
function reconcile(){
  if(activeTab()==='overall'){
    const s=freshShell();
    if(s)warmFreshIntelligence(s);
  }else{
    refreshToken++;
    refreshBusy=false;
    park();
  }
}
document.addEventListener('click',function(e){
  const tab=e.target?.closest?.('.report-tab[data-tab="compare-empty"]');
  if(!tab)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  document.querySelectorAll('.report-tab').forEach(x=>x.classList.remove('active'));
  tab.classList.add('active');
  setTimeout(()=>comparisonLanding(),0);
},true);
document.addEventListener('click',function(e){
  if(e.target?.closest?.('.report-tab[data-tab="overall"]'))setTimeout(reconcile,0);
  if(e.target?.closest?.('.report-tab[data-tab="weekly"]'))setTimeout(reconcile,0);
  if(e.target?.closest?.('.bpi3-tab'))setTimeout(()=>{if(activeTab()==='overall')refreshBusy=false},0);
},true);
if(typeof MutationObserver!=='undefined'){
  const mo=new MutationObserver(()=>{
    if(activeTab()==='overall'){
      const s=shellInRoot();
      if(s&&!refreshBusy&&!s.querySelector('.bpi3-loading'))return;
      if(s&&!refreshBusy)warmFreshIntelligence(s);
    }else park();
  });
  mo.observe(document.getElementById(ROOT_ID)||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
}
window.addEventListener('pageshow',()=>setTimeout(reconcile,0));
window.addEventListener('popstate',()=>setTimeout(reconcile,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(reconcile,0),{once:true});else setTimeout(reconcile,0);
})(window);
