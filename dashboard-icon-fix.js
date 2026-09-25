/* FINAL DASHBOARD ICON FIX — external PNG, no WebP/data-URI/sprite runtime */
(function(){
  'use strict';

  var SRC = 'assets/dashboard-icons.png?v=20260925.1';
  var names = {
    accounting:0, professionals:1, farm:2, flock:3, weeklyReport:4, healthcare:5,
    mortality:6, report:7, archive:8, settings:9
  };

  var css = document.createElement('style');
  css.textContent = `
    .dashboard-page .adi-exact-icon{
      position:relative!important;display:block!important;overflow:hidden!important;
      width:52px!important;height:40.3px!important;min-width:52px!important;min-height:40.3px!important;
      flex:0 0 52px!important;background:transparent!important;border:0!important;
      border-radius:0!important;box-shadow:none!important;padding:0!important;margin:0!important;
      opacity:1!important;line-height:0!important;
    }
    .dashboard-page .adi-exact-icon img{
      position:absolute!important;display:block!important;width:312px!important;height:auto!important;
      max-width:none!important;min-width:0!important;margin:0!important;padding:0!important;
      border:0!important;border-radius:0!important;box-shadow:none!important;opacity:1!important;
      visibility:visible!important;filter:none!important;
    }
    .dashboard-page .adi-exact-icon[data-exact-icon="accounting"] img{left:0;top:0}
    .dashboard-page .adi-exact-icon[data-exact-icon="professionals"] img{left:-52px;top:0}
    .dashboard-page .adi-exact-icon[data-exact-icon="farm"] img{left:-104px;top:0}
    .dashboard-page .adi-exact-icon[data-exact-icon="flock"] img{left:-156px;top:0}
    .dashboard-page .adi-exact-icon[data-exact-icon="weeklyReport"] img{left:-208px;top:0}
    .dashboard-page .adi-exact-icon[data-exact-icon="healthcare"] img{left:-260px;top:0}
    .dashboard-page .adi-exact-icon[data-exact-icon="mortality"] img{left:0;top:-40.3px}
    .dashboard-page .adi-exact-icon[data-exact-icon="report"] img{left:-52px;top:-40.3px}
    .dashboard-page .adi-exact-icon[data-exact-icon="archive"] img{left:-104px;top:-40.3px}
    .dashboard-page .adi-exact-icon[data-exact-icon="settings"] img{left:-156px;top:-40.3px}

    .dashboard-page .bottom-nav .adi-exact-icon{
      width:29px!important;height:22.475px!important;min-width:29px!important;min-height:22.475px!important;
      flex:0 0 29px!important;
    }
    .dashboard-page .bottom-nav .adi-exact-icon img{width:174px!important}
    .dashboard-page .bottom-nav .adi-exact-icon[data-exact-icon="flock"] img{left:-87px;top:0}
    .dashboard-page .bottom-nav .adi-exact-icon[data-exact-icon="farm"] img{left:-58px;top:0}
    .dashboard-page .bottom-nav .adi-exact-icon[data-exact-icon="weekly"] img{left:-116px;top:0}
    .dashboard-page .bottom-nav .adi-exact-icon[data-exact-icon="report"] img{left:-29px;top:-22.475px}

    @media(max-width:600px){
      .dashboard-page .adi-exact-icon{
        width:46px!important;height:35.65px!important;min-width:46px!important;min-height:35.65px!important;
        flex-basis:46px!important;
      }
      .dashboard-page .adi-exact-icon img{width:276px!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="accounting"] img{left:0;top:0}
      .dashboard-page .adi-exact-icon[data-exact-icon="professionals"] img{left:-46px;top:0}
      .dashboard-page .adi-exact-icon[data-exact-icon="farm"] img{left:-92px;top:0}
      .dashboard-page .adi-exact-icon[data-exact-icon="flock"] img{left:-138px;top:0}
      .dashboard-page .adi-exact-icon[data-exact-icon="weeklyReport"] img{left:-184px;top:0}
      .dashboard-page .adi-exact-icon[data-exact-icon="healthcare"] img{left:-230px;top:0}
      .dashboard-page .adi-exact-icon[data-exact-icon="mortality"] img{left:0;top:-35.65px}
      .dashboard-page .adi-exact-icon[data-exact-icon="report"] img{left:-46px;top:-35.65px}
      .dashboard-page .adi-exact-icon[data-exact-icon="archive"] img{left:-92px;top:-35.65px}
      .dashboard-page .adi-exact-icon[data-exact-icon="settings"] img{left:-138px;top:-35.65px}
    }
  `;
  document.head.appendChild(css);

  function holder(name,scale){
    var s=document.createElement('span');
    s.className='adi-exact-icon';
    s.setAttribute('data-exact-icon',name);
    s.setAttribute('aria-hidden','true');
    var im=document.createElement('img');
    im.alt='';
    im.draggable=false;
    im.decoding='sync';
    im.src=SRC;
    s.appendChild(im);
    return s;
  }

  function replaceMain(){
    document.querySelectorAll('.dashboard-page .menu-icon[data-icon]').forEach(function(el){
      var name=el.getAttribute('data-icon');
      if(!names.hasOwnProperty(name)) return;
      if(el.querySelector('.adi-exact-icon')) return;
      el.innerHTML='';
      el.appendChild(holder(name));
      el.classList.add('adi-icon-ready');
    });
  }

  function replaceBottom(){
    document.querySelectorAll('.dashboard-page .bottom-nav button').forEach(function(btn){
      var nav=btn.getAttribute('data-nav')||'';
      var name=nav.indexOf('Dashboard.html')!==-1?'flock':
                nav.indexOf('Farms.html')!==-1?'farm':
                nav.indexOf('weekly.html')!==-1?'weekly':
                nav.indexOf('reports.html')!==-1?'report':null;
      if(!name || btn.querySelector('.adi-exact-icon')) return;
      var label=btn.querySelector('small');
      btn.innerHTML='';
      btn.appendChild(holder(name));
      if(label) btn.appendChild(label);
      btn.classList.add('adi-icon-ready');
    });
  }

  function repair(){ replaceMain(); replaceBottom(); }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){repair();setTimeout(repair,100);setTimeout(repair,500);},{once:true});
  }else{
    repair();setTimeout(repair,100);setTimeout(repair,500);
  }
})();