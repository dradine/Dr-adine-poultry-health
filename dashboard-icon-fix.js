/* FINAL DASHBOARD ICON RENDERER — APPROVED 10-ICON SET
   Source: tightly-cropped 5x2 square sprite (360x144), one exact 72x72 cell per icon.
   Deliberately avoids the old 720x186/6x2 WebP sprite and percentage positioning.
*/
(function(){
  'use strict';

  var SRC = 'assets/dashboard-icons-tight.png?v=20260925.79';

  var allowed = {
    accounting:1, professionals:1, farm:1, flock:1, weeklyReport:1,
    healthcare:1, mortality:1, report:1, archive:1, settings:1
  };

  var css = document.createElement('style');
  css.id = 'dashboard-exact-icon-css';
  css.textContent = `
    .dashboard-page .adi-exact-icon{
      --icon-box:62px;
      --icon-scale:.78;
      position:relative!important;
      display:block!important;
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
      overflow:hidden!important;
      opacity:1!important;
      visibility:visible!important;
      line-height:0!important;
    }
    .dashboard-page .adi-exact-icon::before{
      content:""!important;
      position:absolute!important;
      left:50%!important;
      top:50%!important;
      transform:translate(-50%,-50%) scale(var(--icon-scale))!important;
      transform-origin:center center!important;
      width:72px!important;
      height:72px!important;
      background-image:url("__SPRITE__")!important;
      background-repeat:no-repeat!important;
      background-size:360px 144px!important;
      background-position:0 0!important;
      background-color:transparent!important;
      pointer-events:none!important;
      filter:brightness(0) saturate(100%) invert(46%) sepia(10%) saturate(700%) hue-rotate(167deg) brightness(92%) contrast(84%) drop-shadow(0 1px 3px rgba(54,72,88,.14))!important;
    }
    /* Only these two special icons use the approved inline artwork:
       accounting = dedicated accounting/finance chart icon
       home = dashboard home icon
       All other approved icons remain on the exact sprite cells above. */
    .dashboard-page .adi-exact-icon.adi-special-icon{
      overflow:visible!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      background:transparent!important;
    }
    .dashboard-page .adi-exact-icon.adi-special-icon::before{display:none!important}
    .dashboard-page .adi-exact-icon.adi-special-icon svg{
      width:52px!important;
      height:52px!important;
      min-width:52px!important;
      min-height:52px!important;
      display:block!important;
      overflow:visible!important;
      fill:none!important;
      stroke:currentColor!important;
      stroke-width:2.4!important;
      stroke-linecap:round!important;
      stroke-linejoin:round!important;
      color:#71808a!important;
      filter:drop-shadow(0 2px 4px rgba(54,72,88,.20))!important;
    }
    .dashboard-page .bottom-nav button > .adi-exact-icon.adi-special-icon svg{
      width:30px!important;
      height:30px!important;
      min-width:30px!important;
      min-height:30px!important;
      stroke-width:2.5!important;
    }
    /* Targeted visual sizing: keep farm at its approved size; enlarge flock slightly;
       keep accounting compact and optically centered. */
    .dashboard-page .adi-exact-icon[data-exact-icon="farm"]{--icon-scale:.8611111111!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="flock"]{--icon-scale:.8611111111!important}
    @media(max-width:600px){
      .dashboard-page .adi-exact-icon[data-exact-icon="farm"]{--icon-scale:.6944444444!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="flock"]{--icon-scale:.6944444444!important}
    }
    @media(max-width:380px){
      .dashboard-page .adi-exact-icon[data-exact-icon="farm"]{--icon-scale:.7777777778!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="flock"]{--icon-scale:.7777777778!important}
    }
    .dashboard-page .adi-exact-icon[data-exact-icon="accounting"]::before{background-position:0 0!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="professionals"]::before{background-position:-72px 0!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="farm"]::before{background-position:-144px 0!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="flock"]::before{background-position:-216px 0!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="weeklyReport"]::before{background-position:-288px 0!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="healthcare"]::before{background-position:0 -72px!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="mortality"]::before{background-position:-72px -72px!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="report"]::before{background-position:-144px -72px!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="archive"]::before{background-position:-216px -72px!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="settings"]::before{background-position:-288px -72px!important}

    .dashboard-page .bottom-nav button > .adi-exact-icon{
      --icon-box:30px;
      --icon-scale:.4166666667;
      width:30px!important;
      height:30px!important;
      min-width:30px!important;
      min-height:30px!important;
      flex:0 0 30px!important;
      margin:0!important;
    }
    @media(max-width:600px){
      .dashboard-page .adi-exact-icon{
        --icon-box:50px;
        --icon-scale:.63;
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
        --icon-scale:.70;
        width:56px!important;
        height:56px!important;
        min-width:56px!important;
        min-height:56px!important;
        flex-basis:56px!important;
      }
    }
  `.replace(/__SPRITE__/g, SRC);

  document.head.appendChild(css);

  function holder(name){
    var s=document.createElement('span');
    s.className='adi-exact-icon';
    s.setAttribute('data-exact-icon',name);
    s.setAttribute('aria-hidden','true');

    /* Targeted correction: only accounting and bottom-nav home use
       dedicated approved inline artwork. No other icon is altered. */
    if(name==='accounting'){
      s.classList.add('adi-special-icon');
      s.innerHTML='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 7h23a3 3 0 0 1 3 3v31H12a3 3 0 0 1-3-3z"/><path d="M15 14h13M15 20h9M15 26h6"/><path d="M25 41V31h5v10M32 41V25h5v16M39 41V19h3v22M12 41h30"/></svg>';
    }else if(name==='home'){
      s.classList.add('adi-special-icon');
      s.innerHTML='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 22 24 7l18 15"/><path d="M10 20v21h28V20"/><path d="M19 41V29h10v12"/><path d="M15 25h5M28 25h5"/></svg>';
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