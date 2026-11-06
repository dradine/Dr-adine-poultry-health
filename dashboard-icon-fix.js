/* FINAL DASHBOARD ICON RENDERER — APPROVED 10-ICON SET
   Source: tightly-cropped 5x2 square sprite (360x144), one exact 72x72 cell per icon.
   Deliberately avoids the old 720x186/6x2 WebP sprite and percentage positioning.
*/
(function(){
  'use strict';

  var allowed = {
    accounting:1, professionals:1, farm:1, flock:1, weeklyReport:1,
    healthcare:1, mortality:1, report:1, archive:1, settings:1
  };

  var css = document.createElement('style');
  css.id = 'dashboard-inline-icon-css';
  css.textContent = [
    '.dashboard-page .adi-exact-icon{width:62px!important;height:62px!important;min-width:62px!important;min-height:62px!important;flex:0 0 62px!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0 0 8px 0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;line-height:0!important;color:#5E786C!important}',
    '.dashboard-page .adi-exact-icon::before,.bottom-nav button > .adi-exact-icon::before{display:none!important;background-image:none!important;content:none!important}',
    '.dashboard-page .adi-exact-icon svg{display:block!important;width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.4!important;stroke-linecap:round!important;stroke-linejoin:round!important;overflow:visible!important;filter:drop-shadow(0 2px 4px rgba(54,72,88,.16))!important}',
    '.bottom-nav button > .adi-exact-icon{width:30px!important;height:30px!important;min-width:30px!important;min-height:30px!important;flex:0 0 30px!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;color:#5E786C!important}',
    '.bottom-nav button > .adi-exact-icon svg{display:block!important;width:30px!important;height:30px!important;min-width:30px!important;min-height:30px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.5!important;stroke-linecap:round!important;stroke-linejoin:round!important}',
    '.bottom-nav button{cursor:pointer!important;pointer-events:auto!important;-webkit-tap-highlight-color:transparent!important}',
    '@media(max-width:600px){.dashboard-page .adi-exact-icon{width:50px!important;height:50px!important;min-width:50px!important;min-height:50px!important;flex-basis:50px!important}.dashboard-page .adi-exact-icon svg{width:42px!important;height:42px!important}}',
    '@media(max-width:380px){.dashboard-page .adi-exact-icon{width:56px!important;height:56px!important;min-width:56px!important;min-height:56px!important;flex-basis:56px!important}}'
  ].join('');
  document.head.appendChild(css);

  var glyphs = {
    accounting:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 6h22l6 6v30H10z"/><path d="M32 6v7h6M16 19h16M16 24h9M16 39V30h5v9M23 39V27h5v12M30 39V23h5v16M14 42h23"/></svg>',
    professionals:'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="18" cy="15" r="7"/><path d="M5 39c1-8 5-12 13-12s12 4 13 12M33 10a6 6 0 0 1 0 12M34 28c5 1 8 5 9 11"/></svg>',
    farm:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 21 24 7l19 14M9 19v22h30V19M19 41V28h10v13M15 24h6M27 24h6"/></svg>',
    flock:'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="22" cy="17" r="8"/><path d="M8 40c1-9 6-14 14-14s13 5 14 14M30 17l8 2-8 2M19 36v5M26 36v5M9 12c-2-4 1-7 5-7"/></svg>',
    weeklyReport:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 41V8M7 41h36M12 32l9-9 7 5 12-15"/><circle cx="12" cy="32" r="2"/><circle cx="21" cy="23" r="2"/><circle cx="28" cy="28" r="2"/><circle cx="40" cy="13" r="2"/></svg>',
    healthcare:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 6h22l5 5v31H11zM33 6v7h5M17 20h15M17 26h7M29 27v10M24 32h10"/></svg>',
    mortality:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5 44 41H4zM24 17v11M24 34h.01"/></svg>',
    report:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 5h19l8 8v30H11zM30 5v9h8M17 22h15M17 28h15M17 34h10"/></svg>',
    archive:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 9h38v9H5zM9 18h30v24H9zM18 25h12M18 31h12"/></svg>',
    settings:'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="7"/><path d="M20 5h8l2 6 5 2 5-3 5 7-4 5v5l4 5-5 7-6-2-5 3-2 6h-8l-2-6-5-3-5 2-5-7 4-5v-5l-4-5 5-7 6 3 5-2z"/></svg>',
    home:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 22 24 7l18 15M10 20v21h28V20M19 41V29h10v12"/></svg>'
  };

  function holder(name){
    var s=document.createElement('span');
    s.className='adi-exact-icon';
    s.setAttribute('data-exact-icon',name);
    s.setAttribute('aria-hidden','true');
    s.innerHTML=glyphs[name]||glyphs.report;
    return s;
  }

  function replaceMain(){
    document.querySelectorAll('.dashboard-page .menu-icon[data-icon]').forEach(function(el){
      var name=el.getAttribute('data-icon');
      if(!allowed[name]) return;
      var current=el.querySelector('.adi-exact-icon');
      if(current && current.getAttribute('data-exact-icon')===name) return;
      el.replaceChildren(holder(name));
      el.classList.add('adi-icon-ready');
    });
  }

  function installBottomNavigation(){
    if(window.__ADI_BOTTOM_NAV_HANDLER__) return;
    window.__ADI_BOTTOM_NAV_HANDLER__=true;
    document.addEventListener('click',function(e){
      var btn=e.target.closest ? e.target.closest('.bottom-nav button[data-nav]') : null;
      if(!btn) return;
      var target=btn.getAttribute('data-nav');
      if(!target) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.assign(target);
    },true);
  }

  function replaceBottom(){
    document.querySelectorAll('.bottom-nav button').forEach(function(btn){
      var nav=btn.getAttribute('data-nav')||'';
      var name =
        nav.indexOf('Dashboard.html')!==-1 ? 'home' :
        nav.indexOf('Farms.html')!==-1 ? 'farm' :
        nav.indexOf('weekly.html')!==-1 ? 'weeklyReport' :
        nav.indexOf('reports.html')!==-1 ? 'report' :
        btn.querySelector('[data-icon]')?.getAttribute('data-icon') || null;
      if(!name) return;
      var label=btn.querySelector('small');
      if(label){
        var labels={home:'خانه',farm:'فارم‌ها',weeklyReport:'هفتگی',report:'گزارش‌ها'};
        if(labels[name]) label.textContent=labels[name];
      }
      var icon=holder(name);
      btn.replaceChildren(icon);
      if(label) btn.appendChild(label);
      btn.classList.add('adi-icon-ready');
    });
  }

  function repair(){
    replaceMain();
    replaceBottom();
  }

  function boot(){
    installBottomNavigation();
    repair();
    var grid=document.querySelector('.dashboard-page .dashboard-grid');
    if(grid && !grid.__adiApprovedIconObserver){
      var observer=new MutationObserver(repair);
      observer.observe(grid,{childList:true,subtree:true});
      grid.__adiApprovedIconObserver=observer;
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();