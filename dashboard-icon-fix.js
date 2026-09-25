/* FINAL DASHBOARD ICON RENDERER
   Uses the approved icon artwork, tightly cropped into a 5x2 square PNG sprite.
   No CSS percentage background positioning, no WebP, no data-URI sprite.
   This avoids the Safari/WebKit sprite-positioning problems. */
(function(){
  'use strict';

  var SRC = 'assets/dashboard-icons-green.png?v=20260925.2';

  var allowed = {
    accounting:1, professionals:1, farm:1, flock:1, weeklyReport:1,
    healthcare:1, mortality:1, report:1, archive:1, settings:1
  };

  var css = document.createElement('style');
  css.id = 'dashboard-exact-icon-css';
  css.textContent = `
    .dashboard-page .adi-exact-icon{
      --icon-box:72px;
      --icon-scale:1;
      position:relative!important;
      display:block!important;
      width:var(--icon-box)!important;
      height:var(--icon-box)!important;
      min-width:var(--icon-box)!important;
      min-height:var(--icon-box)!important;
      flex:0 0 var(--icon-box)!important;
      margin:0!important;
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
      --icon-box:32px;
      --icon-scale:.8888888889;
      width:32px!important;
      height:32px!important;
      min-width:32px!important;
      min-height:32px!important;
      flex:0 0 32px!important;
      margin:0!important;
    }

    @media(max-width:600px){
      .dashboard-page .adi-exact-icon{
        --icon-box:64px;
        --icon-scale:.8888888889;
        width:64px!important;
        height:64px!important;
        min-width:64px!important;
        min-height:64px!important;
        flex-basis:64px!important;
      }
    }

    @media(max-width:380px){
      .dashboard-page .adi-exact-icon{
        --icon-box:56px;
        --icon-scale:.7777777778;
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
    return s;
  }

  function replaceMain(){
    document.querySelectorAll('.dashboard-page .menu-icon[data-icon]').forEach(function(el){
      var name=el.getAttribute('data-icon');
      if(!allowed[name]) return;
      if(el.querySelector('.adi-exact-icon')) return;
      el.replaceChildren(holder(name));
      el.classList.add('adi-icon-ready');
    });
  }

  function replaceBottom(){
    document.querySelectorAll('.dashboard-page .bottom-nav button').forEach(function(btn){
      var nav=btn.getAttribute('data-nav')||'';
      var name =
        nav.indexOf('Farms.html')!==-1 ? 'farm' :
        nav.indexOf('weekly.html')!==-1 ? 'weeklyReport' :
        nav.indexOf('reports.html')!==-1 ? 'report' : null;
      if(!name || btn.querySelector('.adi-exact-icon')) return;
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
    setTimeout(repair,100);
    setTimeout(repair,500);
    setTimeout(repair,1000);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();