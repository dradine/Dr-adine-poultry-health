/* DASHBOARD APPROVED ICON RESET — only the 10 management cards.
   Exact previously approved icon artwork is embedded locally for reliable iOS rendering.
   Logo, logout, status icon and bottom navigation are intentionally untouched. */
(function(){
'use strict';
var SPRITE='data:image/png;base64,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';
var ICONS={accounting:1,professionals:1,farm:1,flock:1,weeklyReport:1,healthcare:1,mortality:1,report:1,archive:1,settings:1};

function injectStyle(){
  if(document.getElementById('adine-approved-dashboard-icons-v4')) return;
  var s=document.createElement('style');
  s.id='adine-approved-dashboard-icons-v3';
  s.textContent=`
.dashboard-page .dashboard-grid .menu-card .menu-icon{
  width:76px!important;height:76px!important;min-width:76px!important;min-height:76px!important;
  display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 76px!important;
  padding:0!important;margin-bottom:10px!important;box-sizing:border-box!important;overflow:hidden!important;
  background:#fff!important;border:1px solid rgba(24,92,69,.16)!important;border-radius:20px!important;
  box-shadow:0 10px 24px rgba(16,58,46,.12),inset 0 1px 0 rgba(255,255,255,.98)!important;
}
.dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon{
  display:block!important;width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;
  flex:0 0 36px!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;
  background-image:url(${SPRITE})!important;background-repeat:no-repeat!important;background-size:180px 72px!important;
  background-color:transparent!important;transform:scale(1.72)!important;transform-origin:center center!important;
  filter:drop-shadow(0 3px 3px rgba(17,82,62,.20))!important;opacity:1!important;
}
.dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon[data-approved-icon="accounting"]{background-position:0 0!important}
.dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon[data-approved-icon="professionals"]{background-position:-36px 0!important}
.dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon[data-approved-icon="farm"]{background-position:-72px 0!important}
.dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon[data-approved-icon="flock"]{background-position:-108px 0!important}
.dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon[data-approved-icon="weeklyReport"]{background-position:-144px 0!important}
.dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon[data-approved-icon="healthcare"]{background-position:0 -36px!important}
.dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon[data-approved-icon="mortality"]{background-position:-36px -36px!important}
.dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon[data-approved-icon="report"]{background-position:-72px -36px!important}
.dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon[data-approved-icon="archive"]{background-position:-108px -36px!important}
.dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon[data-approved-icon="settings"]{background-position:-144px -36px!important}
.dashboard-page .dashboard-grid .menu-card:hover .menu-icon{transform:translateY(-2px)!important;box-shadow:0 14px 30px rgba(16,58,46,.16),inset 0 1px 0 rgba(255,255,255,.98)!important}
.dashboard-page .dashboard-grid .menu-card .menu-icon{transition:transform .18s ease,box-shadow .18s ease!important}
@media(max-width:600px){
 .dashboard-page .dashboard-grid .menu-card .menu-icon{width:68px!important;height:68px!important;min-width:68px!important;min-height:68px!important;flex-basis:68px!important;border-radius:18px!important}
 .dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon{transform:scale(1.56)!important}
}
@media(max-width:380px){
 .dashboard-page .dashboard-grid .menu-card .menu-icon{width:60px!important;height:60px!important;min-width:60px!important;min-height:60px!important;flex-basis:60px!important;border-radius:17px!important}
 .dashboard-page .dashboard-grid .menu-card .menu-icon .adine-approved-icon{transform:scale(1.42)!important}
}`;
  document.head.appendChild(s);
}
function makeIcon(name){
 var e=document.createElement('span');
 e.className='adine-approved-icon';
 e.setAttribute('data-approved-icon',name);
 e.setAttribute('aria-hidden','true');
 var img=document.createElement('img');
 img.className='adine-approved-sprite';
 img.alt='';
 img.draggable=false;
 img.src=SPRITE;
 var pos={
  accounting:[0,0],professionals:[-36,0],farm:[-72,0],flock:[-108,0],weeklyReport:[-144,0],
  healthcare:[0,-36],mortality:[-36,-36],report:[-72,-36],archive:[-108,-36],settings:[-144,-36]
 }[name]||[0,0];
 img.style.left=pos[0]+'px';
 img.style.top=pos[1]+'px';
 e.appendChild(img);
 return e;
}
function apply(){
 document.querySelectorAll('.dashboard-page .dashboard-grid .menu-card .menu-icon[data-icon]').forEach(function(box){
  var name=box.getAttribute('data-icon'); if(!Object.prototype.hasOwnProperty.call(ICONS,name)) return;
  var current=box.querySelector('.adine-approved-icon');
  if(current && current.getAttribute('data-approved-icon')===name && box.children.length===1) return;
  box.replaceChildren(makeIcon(name));
 });
}
function boot(){
 injectStyle(); apply();
 var grid=document.querySelector('.dashboard-page .dashboard-grid');
 if(grid){new MutationObserver(function(){apply()}).observe(grid,{subtree:true,childList:true});}
 [150,500,1200,2500].forEach(function(ms){setTimeout(apply,ms)});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();