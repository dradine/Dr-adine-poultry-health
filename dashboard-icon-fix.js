/* DASHBOARD EXACT APPROVED PNG RENDERER
   Restore the previously approved artwork exactly.
   No new SVG artwork. No generated icons. No sprite recreation.
*/
(function(){
  'use strict';

  // This is the exact approved sprite from the commit where the PNG artwork
  // was first installed. It is intentionally pinned so later redesigns cannot
  // silently replace the approved artwork.
  var SRC = 'https://raw.githubusercontent.com/dradine/Dr-adine-poultry-health/5d2e679227d4642c9fe702ed71437bd247fcada8/assets/dashboard-icons.png';

  var approved = {
    accounting: true,
    professionals: true,
    farm: true,
    flock: true,
    weeklyReport: true,
    healthcare: true,
    mortality: true,
    report: true,
    archive: true,
    settings: true
  };

  function installCSS(){
    if(document.getElementById('dashboard-exact-approved-png-css')) return;
    var css=document.createElement('style');
    css.id='dashboard-exact-approved-png-css';
    css.textContent=`
      .dashboard-page .adi-approved-png{
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
      .dashboard-page .adi-approved-png[data-approved-icon="accounting"]{background-position:0% 0%!important}
      .dashboard-page .adi-approved-png[data-approved-icon="professionals"]{background-position:20% 0%!important}
      .dashboard-page .adi-approved-png[data-approved-icon="farm"]{background-position:40% 0%!important}
      .dashboard-page .adi-approved-png[data-approved-icon="flock"]{background-position:60% 0%!important}
      .dashboard-page .adi-approved-png[data-approved-icon="weeklyReport"]{background-position:80% 0%!important}
      .dashboard-page .adi-approved-png[data-approved-icon="healthcare"]{background-position:100% 0%!important}
      .dashboard-page .adi-approved-png[data-approved-icon="mortality"]{background-position:0% 100%!important}
      .dashboard-page .adi-approved-png[data-approved-icon="report"]{background-position:20% 100%!important}
      .dashboard-page .adi-approved-png[data-approved-icon="archive"]{background-position:40% 100%!important}
      .dashboard-page .adi-approved-png[data-approved-icon="settings"]{background-position:60% 100%!important}

      .dashboard-page .bottom-nav .adi-approved-png{
        width:29px!important;
        height:22.475px!important;
        min-width:29px!important;
        min-height:22.475px!important;
        flex:0 0 29px!important;
      }
      .dashboard-page .bottom-nav .adi-approved-png[data-approved-icon="farm"]{background-position:40% 0%!important}
      .dashboard-page .bottom-nav .adi-approved-png[data-approved-icon="weeklyReport"]{background-position:80% 0%!important}
      .dashboard-page .bottom-nav .adi-approved-png[data-approved-icon="report"]{background-position:20% 100%!important}

      @media(max-width:600px){
        .dashboard-page .adi-approved-png{
          width:52px!important;height:52px!important;
          min-width:52px!important;min-height:52px!important;
          flex-basis:52px!important;
        }
      }
      @media(max-width:380px){
        .dashboard-page .adi-approved-png{
          width:48px!important;height:48px!important;
          min-width:48px!important;min-height:48px!important;
          flex-basis:48px!important;
        }
      }
    `;
    document.head.appendChild(css);
  }

  function holder(name){
    var s=document.createElement('span');
    s.className='adi-approved-png';
    s.setAttribute('data-approved-icon',name);
    s.setAttribute('aria-hidden','true');
    return s;
  }

  function replaceMain(){
    document.querySelectorAll('.dashboard-page .menu-icon[data-icon]').forEach(function(el){
      var name=el.getAttribute('data-icon');
      if(!approved[name]) return;
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
      if(!name) return;
      var label=btn.querySelector('small');
      btn.innerHTML='';
      btn.appendChild(holder(name));
      if(label) btn.appendChild(label);
      btn.classList.add('adi-icon-ready');
    });
  }

  function repair(){
    installCSS();
    replaceMain();
    replaceBottom();
  }

  function boot(){
    repair();
    setTimeout(repair,100);
    setTimeout(repair,400);
    setTimeout(repair,1000);
    setTimeout(repair,2000);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();