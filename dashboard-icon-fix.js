/* Exact approved PNG artwork renderer — no new icon artwork.
   Approved green sprite: 180x72px, 5 columns x 2 rows, 36px cells.
   Modernization is presentation-only: shadow, border, green accent. */
(function(){
  'use strict';
  var SRC='assets/dashboard-icons-green.png?v=20260925.11';
  var icons={accounting:1,professionals:1,farm:1,flock:1,weeklyReport:1,healthcare:1,mortality:1,report:1,archive:1,settings:1};

  function inject(){
    if(document.getElementById('approved-png-icon-style'))return;
    var css=document.createElement('style');css.id='approved-png-icon-style';
    css.textContent=`
      .dashboard-page .adi-approved-png{--tile:64px!important;width:var(--tile)!important;height:var(--tile)!important;min-width:var(--tile)!important;min-height:var(--tile)!important;flex:0 0 var(--tile)!important;display:block!important;box-sizing:border-box!important;margin:0!important;padding:0!important;border:1px solid rgba(7,83,55,.24)!important;border-radius:18px!important;background-color:#f1f8f4!important;background-image:url('${SRC}')!important;background-repeat:no-repeat!important;background-size:500% 200%!important;background-origin:border-box!important;box-shadow:0 8px 20px rgba(5,55,37,.18),inset 0 1px 0 rgba(255,255,255,.95)!important;opacity:1!important;visibility:visible!important;overflow:hidden!important;line-height:0!important;}
      .dashboard-page .adi-approved-png[data-approved-icon="accounting"]{background-position:0% 0%!important}.dashboard-page .adi-approved-png[data-approved-icon="professionals"]{background-position:25% 0%!important}.dashboard-page .adi-approved-png[data-approved-icon="farm"]{background-position:50% 0%!important}.dashboard-page .adi-approved-png[data-approved-icon="flock"]{background-position:75% 0%!important}.dashboard-page .adi-approved-png[data-approved-icon="weeklyReport"]{background-position:100% 0%!important}.dashboard-page .adi-approved-png[data-approved-icon="healthcare"]{background-position:0% 100%!important}.dashboard-page .adi-approved-png[data-approved-icon="mortality"]{background-position:25% 100%!important}.dashboard-page .adi-approved-png[data-approved-icon="report"]{background-position:50% 100%!important}.dashboard-page .adi-approved-png[data-approved-icon="archive"]{background-position:75% 100%!important}.dashboard-page .adi-approved-png[data-approved-icon="settings"]{background-position:100% 100%!important}
      .dashboard-page .menu-card .menu-icon{width:76px!important;height:76px!important;min-width:76px!important;display:flex!important;align-items:center!important;justify-content:center!important;background:linear-gradient(145deg,#fff,#e9f5ef)!important;border-radius:21px!important;box-shadow:0 10px 24px rgba(5,55,37,.14)!important}.dashboard-page .menu-card .menu-icon .adi-approved-png{--tile:64px!important}
      .dashboard-page .bottom-nav .adi-approved-png{--tile:29px!important;width:29px!important;height:29px!important;min-width:29px!important;min-height:29px!important;flex:0 0 29px!important;border-radius:9px!important;box-shadow:0 4px 10px rgba(7,56,38,.13)!important}
      @media(max-width:600px){.dashboard-page .menu-card .menu-icon{width:72px!important;height:72px!important;min-width:72px!important}.dashboard-page .menu-card .menu-icon .adi-approved-png{--tile:60px!important}}
    `;document.head.appendChild(css);
  }
  function holder(name){var s=document.createElement('span');s.className='adi-approved-png';s.dataset.approvedIcon=name;s.setAttribute('aria-hidden','true');return s;}
  function main(){document.querySelectorAll('.dashboard-page .menu-icon[data-icon]').forEach(function(box){var n=box.getAttribute('data-icon');if(!icons[n])return;box.innerHTML='';box.appendChild(holder(n));});}
  function bottom(){document.querySelectorAll('.dashboard-page .bottom-nav button').forEach(function(btn){var icon=btn.querySelector('[data-icon]');if(!icon)return;var n=icon.getAttribute('data-icon');if(n==='scale')n='weeklyReport';if(!icons[n])return;icon.replaceWith(holder(n));});}
  function repair(){inject();main();bottom();}
  function boot(){repair();[100,350,900,1800].forEach(function(ms){setTimeout(repair,ms);});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();