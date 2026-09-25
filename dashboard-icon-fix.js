/* DASHBOARD ICON FIX — external PNG sprite, CSS background crop
   Purpose: render the exact approved icon artwork without data-URI/WebP
   and without subpixel <img> positioning. */
(function(){
  'use strict';

  var SRC = 'assets/dashboard-icons.png?v=20260925.3';

  // Sprite: 6 columns x 2 rows, each cell 120x93.
  // Main dashboard uses the first 10 approved assets.
  var pos = {
    accounting: [0,0],
    professionals: [20,0],
    farm: [40,0],
    flock: [60,0],
    weeklyReport: [80,0],
    healthcare: [100,0],
    mortality: [0,100],
    report: [20,100],
    archive: [40,100],
    settings: [60,100]
  };

  var css = document.createElement('style');
  css.id = 'dashboard-exact-icon-css';
  css.textContent = `
    /* Main icon holder: background crop, no nested image positioning. */
    .dashboard-page .adi-exact-icon{
      position:relative!important;
      display:block!important;
      width:58px!important;
      height:58px!important;
      min-width:58px!important;
      min-height:58px!important;
      flex:0 0 58px!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      background-color:transparent!important;
      background-image:url("${SRC}")!important;
      background-repeat:no-repeat!important;
      background-size:600% 200%!important;
      background-position:0% 0%!important;
      overflow:hidden!important;
      opacity:1!important;
      visibility:visible!important;
      line-height:0!important;
    }

    .dashboard-page .adi-exact-icon[data-exact-icon="accounting"]{background-position:0% 0%!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="professionals"]{background-position:20% 0%!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="farm"]{background-position:40% 0%!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="flock"]{background-position:60% 0%!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="weeklyReport"]{background-position:80% 0%!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="healthcare"]{background-position:100% 0%!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="mortality"]{background-position:0% 100%!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="report"]{background-position:20% 100%!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="archive"]{background-position:40% 100%!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="settings"]{background-position:60% 100%!important}

    /* Bottom nav: keep خانه semantic home SVG from poultry-icons.
       Replace only فارم‌ها / هفتگی / گزارش with exact approved artwork. */
    .dashboard-page .bottom-nav .adi-exact-icon{
      width:32px!important;
      height:32px!important;
      min-width:32px!important;
      min-height:32px!important;
      flex:0 0 32px!important;
    }
    .dashboard-page .bottom-nav .adi-exact-icon[data-exact-icon="farm"]{background-position:40% 0%!important}
    .dashboard-page .bottom-nav .adi-exact-icon[data-exact-icon="weeklyReport"]{background-position:80% 0%!important}
    .dashboard-page .bottom-nav .adi-exact-icon[data-exact-icon="report"]{background-position:20% 100%!important}

    @media(max-width:600px){
      .dashboard-page .adi-exact-icon{
        width:52px!important;
        height:52px!important;
        min-width:52px!important;
        min-height:52px!important;
        flex-basis:52px!important;
      }
    }

    @media(max-width:380px){
      .dashboard-page .adi-exact-icon{
        width:48px!important;
        height:48px!important;
        min-width:48px!important;
        min-height:48px!important;
        flex-basis:48px!important;
      }
    }
  `;
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
      if(!Object.prototype.hasOwnProperty.call(pos,name)) return;
      if(el.querySelector('.adi-exact-icon')) return;
      el.innerHTML='';
      el.appendChild(holder(name));
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

      // خانه intentionally stays on the semantic home icon.
      if(!name || btn.querySelector('.adi-exact-icon')) return;

      var label=btn.querySelector('small');
      btn.innerHTML='';
      btn.appendChild(holder(name));
      if(label) btn.appendChild(label);
      btn.classList.add('adi-icon-ready');
    });
  }

  function repair(){
    replaceMain();
    replaceBottom();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){
      repair();
      setTimeout(repair,100);
      setTimeout(repair,500);
      setTimeout(repair,1000);
    },{once:true});
  }else{
    repair();
    setTimeout(repair,100);
    setTimeout(repair,500);
    setTimeout(repair,1000);
  }
})();