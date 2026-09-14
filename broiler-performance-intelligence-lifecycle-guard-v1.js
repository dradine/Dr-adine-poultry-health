/* ADINE BROILER PERFORMANCE — LIFECYCLE GUARD V9
 * Presentation/lifecycle cleanup only.
 * Never hides #root and never gates Weekly/Comparison/Comprehensive rendering.
 * Only parks/restores the BPI shell between report tabs and removes legacy panel DOM.
 */
(function(global){
'use strict';
if(global.__ADINE_BPI_LIFECYCLE_GUARD_V9__)return;
global.__ADINE_BPI_LIFECYCLE_GUARD_V9__=true;
const ROOT_ID='root',SHELL_ID='broiler-performance-intelligence-v3-shell',PARK_ID='adine-bpi-shell-parking-v1';
let lastShell=null,rehydrating=false;
const $=id=>document.getElementById(id);
const root=()=>$(ROOT_ID);
const activeTab=()=>document.querySelector('.report-tab.active')?.getAttribute('data-tab')||null;
function parking(){let p=$(PARK_ID);if(!p){p=document.createElement('div');p.id=PARK_ID;p.hidden=true;p.setAttribute('aria-hidden','true');document.body.appendChild(p)}return p}
function shellInRoot(){return root()?.querySelector('#'+SHELL_ID)||null}
function park(){const s=shellInRoot();if(s)parking().appendChild(s)}
function restore(){const r=root(),p=$(PARK_ID);if(!r||!p)return null;const s=p.querySelector('#'+SHELL_ID);if(!s)return null;r.appendChild(s);return s}
function quarantineLegacy(){document.querySelectorAll('#broiler-intelligence-panel').forEach(x=>x.remove())}
function rehydrateReferenceLayer(shell){if(!shell||shell===lastShell||rehydrating)return;lastShell=shell;rehydrating=true;try{global.__ADINE_REFERENCE_LAYER_V11__=false;const s=document.createElement('script');s.src='broiler-performance-intelligence-reference-gap-v1.js?v=20260914.13';s.async=false;s.onload=()=>{rehydrating=false};s.onerror=()=>{rehydrating=false};document.head.appendChild(s)}catch(_){rehydrating=false}}
function reconcile(){quarantineLegacy();if(activeTab()==='overall'){const s=shellInRoot()||restore();if(s)rehydrateReferenceLayer(s)}else park()}
document.addEventListener('click',function(e){if(e.target?.closest?.('.report-tab'))setTimeout(reconcile,0);if(e.target?.closest?.('.bpi3-tab'))setTimeout(()=>{quarantineLegacy();reconcile()},0)},true);
if(typeof MutationObserver!=='undefined'){const mo=new MutationObserver(()=>{quarantineLegacy();if(activeTab()==='overall'){const s=shellInRoot()||restore();if(s)rehydrateReferenceLayer(s)}else park()});mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})}
window.addEventListener('pageshow',()=>setTimeout(reconcile,0));
window.addEventListener('popstate',()=>setTimeout(reconcile,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(reconcile,0),{once:true});else setTimeout(reconcile,0);
})(window);
