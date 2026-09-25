/* FINAL DASHBOARD ICON RENDER FIX
   Fixes sprite scaling without CSS calc multiplication.
   The previous implementation used calc(length * number), which is not reliably
   supported and can invalidate width/position declarations. This override uses
   explicit pixel geometry for every approved sprite cell.
*/
(function(){
  'use strict';

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
    .dashboard-page .adi-exact-icon[data-exact-icon="accounting"] img{left:0!important;top:0!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="professionals"] img{left:-52px!important;top:0!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="farm"] img{left:-104px!important;top:0!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="flock"] img{left:-156px!important;top:0!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="weeklyReport"] img{left:-208px!important;top:0!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="healthcare"] img{left:-260px!important;top:0!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="mortality"] img{left:0!important;top:-40.3px!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="report"] img{left:-52px!important;top:-40.3px!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="archive"] img{left:-104px!important;top:-40.3px!important}
    .dashboard-page .adi-exact-icon[data-exact-icon="settings"] img{left:-156px!important;top:-40.3px!important}

    .dashboard-page .bottom-nav .adi-exact-icon{
      width:29px!important;height:22.475px!important;min-width:29px!important;min-height:22.475px!important;
      flex:0 0 29px!important;
    }
    .dashboard-page .bottom-nav .adi-exact-icon img{width:174px!important;height:auto!important}
    .dashboard-page .bottom-nav .adi-exact-icon[data-exact-icon="flock"] img{left:-87px!important;top:0!important}
    .dashboard-page .bottom-nav .adi-exact-icon[data-exact-icon="farm"] img{left:-58px!important;top:0!important}
    .dashboard-page .bottom-nav .adi-exact-icon[data-exact-icon="weekly"] img{left:-116px!important;top:0!important}
    .dashboard-page .bottom-nav .adi-exact-icon[data-exact-icon="report"] img{left:-29px!important;top:-22.475px!important}

    @media(max-width:600px){
      .dashboard-page .adi-exact-icon{
        width:46px!important;height:35.65px!important;min-width:46px!important;min-height:35.65px!important;flex-basis:46px!important;
      }
      .dashboard-page .adi-exact-icon img{width:276px!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="accounting"] img{left:0!important;top:0!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="professionals"] img{left:-46px!important;top:0!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="farm"] img{left:-92px!important;top:0!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="flock"] img{left:-138px!important;top:0!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="weeklyReport"] img{left:-184px!important;top:0!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="healthcare"] img{left:-230px!important;top:0!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="mortality"] img{left:0!important;top:-35.65px!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="report"] img{left:-46px!important;top:-35.65px!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="archive"] img{left:-92px!important;top:-35.65px!important}
      .dashboard-page .adi-exact-icon[data-exact-icon="settings"] img{left:-138px!important;top:-35.65px!important}
    }
  `;
  document.head.appendChild(css);

  function repair(){
    var main = document.querySelectorAll('.dashboard-page .menu-icon[data-icon]');
    main.forEach(function(el){
      var n=el.getAttribute('data-icon');
      if(!n) return;
      var holder=el.querySelector('.adi-exact-icon');
      if(!holder && window.ADI_DASHBOARD_ICON_SPRITE){
        el.innerHTML='<span class="adi-exact-icon" data-exact-icon="'+n+'" aria-hidden="true"><img alt="" draggable="false" src="data:image/webp;base64,'+window.ADI_DASHBOARD_ICON_SPRITE+'"></span>';
        el.classList.add('adi-icon-ready');
      }
    });

    document.querySelectorAll('.dashboard-page .bottom-nav button').forEach(function(btn){
      var nav=btn.getAttribute('data-nav')||'';
      var n=nav.indexOf('Dashboard.html')!==-1?'flock':
            nav.indexOf('Farms.html')!==-1?'farm':
            nav.indexOf('weekly.html')!==-1?'weekly':
            nav.indexOf('reports.html')!==-1?'report':null;
      if(!n || btn.querySelector('.adi-exact-icon')) return;
      var sprite=window.ADI_DASHBOARD_ICON_SPRITE;
      if(!sprite) return;
      var label=btn.querySelector('small');
      btn.innerHTML='<span class="adi-exact-icon" data-exact-icon="'+n+'" aria-hidden="true"><img alt="" draggable="false" src="data:image/webp;base64,'+sprite+'"></span>'+(label?label.outerHTML:'');
      btn.classList.add('adi-icon-ready');
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){repair();setTimeout(repair,50);},{once:true});
  }else{
    repair();
    setTimeout(repair,50);
  }
})();