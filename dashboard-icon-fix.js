/* APPROVED ICON SPRITE — presentation only. Reuses the previously approved 10-icon sheet and the same four navigation symbols. */
(function(){
'use strict';

var SRC='https://raw.githubusercontent.com/dradine/Dr-adine-poultry-health/main/assets/dashboard-icons-green.png?v=20260925.13';

var icons={
  accounting:1, professionals:1, farm:1, flock:1, weeklyReport:1,
  healthcare:1, mortality:1, report:1, archive:1, settings:1
};

function css(){
  if(document.getElementById('approved-png-icon-style-v14')) return;

  var s=document.createElement('style');
  s.id='approved-png-icon-style-v14';

  s.textContent=`
/* ===== APPROVED ICON FAMILY =====
   White body + approved green artwork.
   No new SVG artwork, no emoji, no mixed icon families.
*/
.dashboard-page .menu-card .menu-icon{
  width:76px!important;
  height:76px!important;
  min-width:76px!important;
  min-height:76px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  background:#fff!important;
  border:1px solid rgba(31,96,75,.18)!important;
  border-radius:20px!important;
  box-shadow:
    0 8px 20px rgba(15,61,48,.10),
    inset 0 0 0 1px rgba(255,255,255,.95)!important;
  overflow:hidden!important;
}

.dashboard-page .adi-approved-png{
  display:block!important;
  width:36px!important;
  height:36px!important;
  min-width:36px!important;
  min-height:36px!important;
  flex:0 0 36px!important;
  background-image:url('${SRC}')!important;
  background-repeat:no-repeat!important;
  background-size:180px 72px!important;
  background-color:transparent!important;
  border:0!important;
  border-radius:0!important;
  box-shadow:none!important;
  opacity:1!important;
  visibility:visible!important;
  overflow:hidden!important;
  line-height:0!important;
  transform:scale(1.72)!important;
  transform-origin:center center!important;
}

/* Exact positions from the approved 10-icon sheet */
.dashboard-page .adi-approved-png[data-approved-icon="accounting"]{background-position:0 0!important}
.dashboard-page .adi-approved-png[data-approved-icon="professionals"]{background-position:-36px 0!important}
.dashboard-page .adi-approved-png[data-approved-icon="farm"]{background-position:-72px 0!important}
.dashboard-page .adi-approved-png[data-approved-icon="flock"]{background-position:-108px 0!important}
.dashboard-page .adi-approved-png[data-approved-icon="weeklyReport"]{background-position:-144px 0!important}
.dashboard-page .adi-approved-png[data-approved-icon="healthcare"]{background-position:0 -36px!important}
.dashboard-page .adi-approved-png[data-approved-icon="mortality"]{background-position:-36px -36px!important}
.dashboard-page .adi-approved-png[data-approved-icon="report"]{background-position:-72px -36px!important}
.dashboard-page .adi-approved-png[data-approved-icon="archive"]{background-position:-108px -36px!important}
.dashboard-page .adi-approved-png[data-approved-icon="settings"]{background-position:-144px -36px!important}

/* Bottom navigation uses the same approved family.
   The home symbol remains the existing approved home mark. */
.dashboard-page .bottom-nav [data-icon]{
  width:42px!important;
  height:42px!important;
  min-width:42px!important;
  min-height:42px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  background:#fff!important;
  border:1px solid rgba(31,96,75,.14)!important;
  border-radius:13px!important;
  box-shadow:0 4px 12px rgba(15,61,48,.07)!important;
}

.dashboard-page .bottom-nav .adi-approved-png{
  width:36px!important;
  height:36px!important;
  background-size:180px 72px!important;
  transform:scale(.80)!important;
  transform-origin:center center!important;
}

@media(max-width:600px){
  .dashboard-page .menu-card .menu-icon{
    width:72px!important;
    height:72px!important;
    min-width:72px!important;
    min-height:72px!important;
    border-radius:19px!important;
  }

  .dashboard-page .menu-card .menu-icon .adi-approved-png{
    transform:scale(1.62)!important;
  }
}
`;

  document.head.appendChild(s);
}

function holder(n){
  var e=document.createElement('span');
  e.className='adi-approved-png';
  e.setAttribute('data-approved-icon',n);
  e.setAttribute('aria-hidden','true');
  return e;
}

function main(){
  document.querySelectorAll('.dashboard-page .menu-icon[data-icon]').forEach(function(b){
    var n=b.getAttribute('data-icon');
    if(!icons[n]) return;
    if(b.querySelector('.adi-approved-png')) return;
    b.replaceChildren(holder(n));
  });
}

function bottom(){
  document.querySelectorAll('.dashboard-page .bottom-nav button').forEach(function(b){
    var e=b.querySelector('[data-icon]');
    if(!e) return;

    var n=e.getAttribute('data-icon');

    if(n==='home'){
      /* Keep the approved home navigation symbol from the existing icon system. */
      return;
    }

    if(n==='scale') n='weeklyReport';

    if(!icons[n]) return;

    if(e.classList.contains('adi-approved-png')) return;
    e.replaceWith(holder(n));
  });
}

function repair(){
  css();
  main();
  bottom();
}

function boot(){
  repair();
  [100,300,700,1500,3000].forEach(function(t){
    setTimeout(repair,t);
  });
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',boot,{once:true});
}else{
  boot();
}

})();