/* DASHBOARD ICON FIX — EXACT APPROVED ARTWORK */
(function(){
  'use strict';
  var pos={accounting:0,professionals:1,farm:2,flock:3,weeklyReport:4,healthcare:5,mortality:6,report:7,archive:8,settings:9};
  function install(){
    if(!window.ADI_DASHBOARD_ICON_SPRITE) return false;
    if(document.getElementById('dashboard-exact-approved-icon-css')) return true;
    var css=document.createElement('style'); css.id='dashboard-exact-approved-icon-css';
    var sprite=window.ADI_DASHBOARD_ICON_SPRITE;
    css.textContent=
      '.dashboard-page .dashboard-grid .adi-exact-icon{--icon-box:72px!important;position:relative!important;display:block!important;width:var(--icon-box)!important;height:var(--icon-box)!important;min-width:var(--icon-box)!important;min-height:var(--icon-box)!important;flex:0 0 var(--icon-box)!important;margin:0 0 10px 0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;overflow:hidden!important;opacity:1!important;visibility:visible!important;line-height:0!important}'+
      '.dashboard-page .dashboard-grid .adi-exact-icon::before{content:""!important;position:absolute!important;left:0!important;top:50%!important;transform:translateY(-50%)!important;width:100%!important;height:77.5%!important;background-image:url("data:image/webp;base64,'+sprite+'");background-repeat:no-repeat!important;background-size:600% auto!important;background-color:transparent!important;pointer-events:none!important}'+
      '.dashboard-page .dashboard-grid .adi-exact-icon[data-exact-icon="accounting"]::before{background-position:0% 0%!important}'+
      '.dashboard-page .dashboard-grid .adi-exact-icon[data-exact-icon="professionals"]::before{background-position:20% 0%!important}'+
      '.dashboard-page .dashboard-grid .adi-exact-icon[data-exact-icon="farm"]::before{background-position:40% 0%!important}'+
      '.dashboard-page .dashboard-grid .adi-exact-icon[data-exact-icon="flock"]::before{background-position:60% 0%!important}'+
      '.dashboard-page .dashboard-grid .adi-exact-icon[data-exact-icon="weeklyReport"]::before{background-position:80% 0%!important}'+
      '.dashboard-page .dashboard-grid .adi-exact-icon[data-exact-icon="healthcare"]::before{background-position:100% 0%!important}'+
      '.dashboard-page .dashboard-grid .adi-exact-icon[data-exact-icon="mortality"]::before{background-position:0% 100%!important}'+
      '.dashboard-page .dashboard-grid .adi-exact-icon[data-exact-icon="report"]::before{background-position:20% 100%!important}'+
      '.dashboard-page .dashboard-grid .adi-exact-icon[data-exact-icon="archive"]::before{background-position:40% 100%!important}'+
      '.dashboard-page .dashboard-grid .adi-exact-icon[data-exact-icon="settings"]::before{background-position:60% 100%!important}'+
      '@media(max-width:600px){.dashboard-page .dashboard-grid .adi-exact-icon{--icon-box:64px!important;width:64px!important;height:64px!important;min-width:64px!important;min-height:64px!important;flex-basis:64px!important}}'+
      '@media(max-width:380px){.dashboard-page .dashboard-grid .adi-exact-icon{--icon-box:56px!important;width:56px!important;height:56px!important;min-width:56px!important;height:56px!important;flex-basis:56px!important}}';
    document.head.appendChild(css); return true;
  }
  function holder(name){var s=document.createElement('span');s.className='adi-exact-icon';s.setAttribute('data-exact-icon',name);s.setAttribute('aria-hidden','true');return s;}
  function apply(){
    if(!install()) return;
    document.querySelectorAll('.dashboard-page .dashboard-grid .menu-icon[data-icon]').forEach(function(el){
      var name=el.getAttribute('data-icon'); if(!Object.prototype.hasOwnProperty.call(pos,name)) return;
      var current=el.querySelector('.adi-exact-icon'); if(current && current.getAttribute('data-exact-icon')===name) return;
      el.replaceChildren(holder(name)); el.classList.add('adi-icon-ready');
    });
  }
  function boot(){apply();[100,300,700,1200,2000].forEach(function(t){setTimeout(apply,t);});var grid=document.querySelector('.dashboard-page .dashboard-grid');if(grid&&!grid.__adiExactApprovedObserver){var observer=new MutationObserver(apply);observer.observe(grid,{childList:true,subtree:true});grid.__adiExactApprovedObserver=observer;}}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();