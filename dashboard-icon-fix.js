/* DASHBOARD ICON RENDERER — OUTLINE TEST
   Keeps the approved dashboard concepts and navigation.
   Uses the existing AdinePoultryIcons SVG artwork in line-art mode:
   no filled bodies, one consistent stroke, same icon slots/sizing.
*/
(function(){
  'use strict';

  var VERSION = '20260925.72';
  var allowed = {
    accounting:1, professionals:1, farm:1, flock:1, weeklyReport:1,
    healthcare:1, mortality:1, report:1, archive:1, settings:1
  };

  var css = document.createElement('style');
  css.id = 'dashboard-outline-icon-css';
  css.textContent = `
    .dashboard-page .adi-exact-icon{
      --icon-box:62px;
      position:relative!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:var(--icon-box)!important;
      height:var(--icon-box)!important;
      min-width:var(--icon-box)!important;
      min-height:var(--icon-box)!important;
      flex:0 0 var(--icon-box)!important;
      margin:0 0 8px 0!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      background:transparent!important;
      overflow:visible!important;
      opacity:1!important;
      visibility:visible!important;
      line-height:0!important;
      color:#536879!important;
    }

    .dashboard-page .adi-exact-icon .adi-svg-icon{
      width:100%!important;
      height:100%!important;
      min-width:0!important;
      min-height:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      color:#536879!important;
      line-height:0!important;
      filter:drop-shadow(0 1px 2px rgba(54,72,88,.14))!important;
    }

    .dashboard-page .adi-exact-icon .adi-svg-icon svg{
      width:100%!important;
      height:100%!important;
      max-width:100%!important;
      max-height:100%!important;
      display:block!important;
      overflow:visible!important;
      fill:none!important;
      stroke:currentColor!important;
      stroke-width:2.05!important;
      stroke-linecap:round!important;
      stroke-linejoin:round!important;
      color:#536879!important;
      vector-effect:non-scaling-stroke!important;
    }

    /* The wide farm/flock drawings keep their own proportions inside the same box. */
    .dashboard-page .adi-exact-icon[data-exact-icon="farm"] .adi-svg-icon svg,
    .dashboard-page .adi-exact-icon[data-exact-icon="flock"] .adi-svg-icon svg{
      width:100%!important;
      height:100%!important;
    }

    .dashboard-page .bottom-nav button > .adi-exact-icon{
      --icon-box:30px;
      width:30px!important;
      height:30px!important;
      min-width:30px!important;
      min-height:30px!important;
      flex:0 0 30px!important;
      margin:0!important;
      color:#536879!important;
    }

    .dashboard-page .bottom-nav button > .adi-exact-icon .adi-svg-icon{
      width:30px!important;
      height:30px!important;
      color:#536879!important;
    }

    .dashboard-page .bottom-nav button > .adi-exact-icon .adi-svg-icon svg{
      width:30px!important;
      height:30px!important;
      stroke-width:2.05!important;
    }

    @media(max-width:600px){
      .dashboard-page .adi-exact-icon{
        --icon-box:50px;
        width:50px!important;
        height:50px!important;
        min-width:50px!important;
        min-height:50px!important;
        flex-basis:50px!important;
      }
    }

    @media(max-width:380px){
      .dashboard-page .adi-exact-icon{
        --icon-box:56px;
        width:56px!important;
        height:56px!important;
        min-width:56px!important;
        min-height:56px!important;
        flex-basis:56px!important;
      }
    }
  `;

  document.head.appendChild(css);

  function holder(name){
    var s=document.createElement('span');
    s.className='adi-exact-icon';
    s.setAttribute('data-exact-icon',name);
    s.setAttribute('aria-hidden','true');

    if(window.AdiPoultryIcons && typeof window.AdiPoultryIcons.make==='function'){
      s.innerHTML=window.AdiPoultryIcons.make(name,'adi-menu-svg');
    }

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

  function replaceBottom(){
    document.querySelectorAll('.dashboard-page .bottom-nav button').forEach(function(btn){
      var nav=btn.getAttribute('data-nav')||'';
      var name =
        nav.indexOf('Dashboard.html')!==-1 ? 'home' :
        nav.indexOf('Farms.html')!==-1 ? 'farm' :
        nav.indexOf('weekly.html')!==-1 ? 'weeklyReport' :
        nav.indexOf('reports.html')!==-1 ? 'report' : null;

      if(!name) return;

      var label=btn.querySelector('small');
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
    repair();
    [100,300,700,1200,2000].forEach(function(t){setTimeout(repair,t);});

    var grid=document.querySelector('.dashboard-page .dashboard-grid');
    if(grid && !grid.__adiOutlineIconObserver){
      var observer=new MutationObserver(repair);
      observer.observe(grid,{childList:true,subtree:true});
      grid.__adiOutlineIconObserver=observer;
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();
