/* Exact approved PNG artwork renderer.
   IMPORTANT: this file never redraws the artwork. It only crops the approved
   180x72 PNG sprite (5 columns x 2 rows, 36x36 cells) and presents it in a
   modern green tile. Pixel positioning is intentional: no percentage crop.
*/
(function(){
  'use strict';

  var SRC='https://raw.githubusercontent.com/dradine/Dr-adine-poultry-health/main/assets/dashboard-icons-green.png?v=20260925.12';
  var icons={accounting:1,professionals:1,farm:1,flock:1,weeklyReport:1,healthcare:1,mortality:1,report:1,archive:1,settings:1};

  function inject(){
    if(document.getElementById('approved-png-icon-style-v12')) return;
    var css=document.createElement('style');
    css.id='approved-png-icon-style-v12';
    css.textContent=`
      .dashboard-page .adi-approved-png{
        --tile:64px!important;
        width:var(--tile)!important;height:var(--tile)!important;
        min-width:var(--tile)!important;min-height:var(--tile)!important;
        flex:0 0 var(--tile)!important;
        display:block!important;box-sizing:border-box!important;
        margin:0!important;padding:0!important;
        border:0!important;border-radius:14px!important;
        background-color:transparent!important;
        background-image:url('${SRC}')!important;
        background-repeat:no-repeat!important;
        background-size:320px 128px!important;
        background-origin:padding-box!important;
        box-shadow:none!important;
        opacity:1!important;visibility:visible!important;
        overflow:hidden!important;line-height:0!important;
      }

      /* exact 5x2 sprite cells: each source cell = 36x36, displayed at 64x64 */
      .dashboard-page .adi-approved-png[data-approved-icon="accounting"]{background-position:0 0!important}
      .dashboard-page .adi-approved-png[data-approved-icon="professionals"]{background-position:-64px 0!important}
      .dashboard-page .adi-approved-png[data-approved-icon="farm"]{background-position:-128px 0!important}
      .dashboard-page .adi-approved-png[data-approved-icon="flock"]{background-position:-192px 0!important}
      .dashboard-page .adi-approved-png[data-approved-icon="weeklyReport"]{background-position:-256px 0!important}
      .dashboard-page .adi-approved-png[data-approved-icon="healthcare"]{background-position:0 -64px!important}
      .dashboard-page .adi-approved-png[data-approved-icon="mortality"]{background-position:-64px -64px!important}
      .dashboard-page .adi-approved-png[data-approved-icon="report"]{background-position:-128px -64px!important}
      .dashboard-page .adi-approved-png[data-approved-icon="archive"]{background-position:-192px -64px!important}
      .dashboard-page .adi-approved-png[data-approved-icon="settings"]{background-position:-256px -64px!important}

      /* modern presentation is on the CARD, never on the artwork */
      .dashboard-page .menu-card .menu-icon{
        width:76px!important;height:76px!important;min-width:76px!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        background:linear-gradient(145deg,#ffffff,#e7f3ed)!important;
        border:1px solid rgba(8,82,55,.16)!important;
        border-radius:21px!important;
        box-shadow:0 9px 22px rgba(4,54,36,.15),inset 0 1px 0 rgba(255,255,255,.95)!important;
      }
      .dashboard-page .menu-card .menu-icon .adi-approved-png{--tile:64px!important}

      /* bottom navigation: same approved artwork, scaled to 29px */
      .dashboard-page .bottom-nav .adi-approved-png{
        --tile:29px!important;width:29px!important;height:29px!important;
        min-width:29px!important;min-height:29px!important;flex:0 0 29px!important;
        border-radius:7px!important;
        background-size:145px 58px!important;
      }
      .dashboard-page .bottom-nav .adi-approved-png[data-approved-icon="farm"]{background-position:-58px 0!important}
      .dashboard-page .bottom-nav .adi-approved-png[data-approved-icon="weeklyReport"]{background-position:-116px 0!important}
      .dashboard-page .bottom-nav .adi-approved-png[data-approved-icon="report"]{background-position:-58px -29px!important}

      @media(max-width:600px){
        .dashboard-page .menu-card .menu-icon{width:72px!important;height:72px!important;min-width:72px!important}
        .dashboard-page .menu-card .menu-icon .adi-approved-png{
          --tile:60px!important;width:60px!important;height:60px!important;
          background-size:300px 120px!important;
        }
        .dashboard-page .menu-card .menu-icon .adi-approved-png[data-approved-icon="accounting"]{background-position:0 0!important}
        .dashboard-page .menu-card .menu-icon .adi-approved-png[data-approved-icon="professionals"]{background-position:-60px 0!important}
        .dashboard-page .menu-card .menu-icon .adi-approved-png[data-approved-icon="farm"]{background-position:-120px 0!important}
        .dashboard-page .menu-card .menu-icon .adi-approved-png[data-approved-icon="flock"]{background-position:-180px 0!important}
        .dashboard-page .menu-card .menu-icon .adi-approved-png[data-approved-icon="weeklyReport"]{background-position:-240px 0!important}
        .dashboard-page .menu-card .menu-icon .adi-approved-png[data-approved-icon="healthcare"]{background-position:0 -60px!important}
        .dashboard-page .menu-card .menu-icon .adi-approved-png[data-approved-icon="mortality"]{background-position:-60px -60px!important}
        .dashboard-page .menu-card .menu-icon .adi-approved-png[data-approved-icon="report"]{background-position:-120px -60px!important}
        .dashboard-page .menu-card .menu-icon .adi-approved-png[data-approved-icon="archive"]{background-position:-180px -60px!important}
        .dashboard-page .menu-card .menu-icon .adi-approved-png[data-approved-icon="settings"]{background-position:-240px -60px!important}
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

  function main(){
    document.querySelectorAll('.dashboard-page .menu-icon[data-icon]').forEach(function(box){
      var n=box.getAttribute('data-icon');
      if(!icons[n]) return;
      if(box.querySelector('.adi-approved-png[data-approved-icon="'+n+'"]')) return;
      box.innerHTML='';
      box.appendChild(holder(n));
    });
  }

  function bottom(){
    document.querySelectorAll('.dashboard-page .bottom-nav button').forEach(function(btn){
      var icon=btn.querySelector('[data-icon]');
      if(!icon) return;
      var n=icon.getAttribute('data-icon');
      if(n==='scale') n='weeklyReport';
      if(n==='home') return; /* preserve the existing approved home icon */
      if(!icons[n]) return;
      if(icon.classList.contains('adi-approved-png')) return;
      icon.replaceWith(holder(n));
    });
  }

  function repair(){inject();main();bottom();}
  function boot(){repair();[100,350,900,1800,3000].forEach(function(ms){setTimeout(repair,ms);});}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();