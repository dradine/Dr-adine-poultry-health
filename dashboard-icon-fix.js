/* DASHBOARD ICON RENDERER v12
   Uses the existing approved inline SVG icon system.
   No PNG sprite, no background-position, no external icon image.
*/
(function () {
  'use strict';

  var MAP = {
    accounting: 'accounting',
    professionals: 'professionals',
    farm: 'farm',
    flock: 'flock',
    weeklyReport: 'weeklyReport',
    healthcare: 'healthcare',
    mortality: 'mortality',
    report: 'report',
    archive: 'archive',
    settings: 'settings'
  };

  function installCSS() {
    if (document.getElementById('dashboard-inline-svg-css')) return;

    var css = document.createElement('style');
    css.id = 'dashboard-inline-svg-css';
    css.textContent = `
      .dashboard-page .menu-icon.adi-icon-ready {
        width:72px!important;height:72px!important;
        min-width:72px!important;min-height:72px!important;
        flex:0 0 72px!important;display:flex!important;
        align-items:center!important;justify-content:center!important;
        overflow:visible!important;opacity:1!important;visibility:visible!important;
        line-height:0!important;
      }
      .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon {
        width:68px!important;height:68px!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        flex:0 0 68px!important;overflow:visible!important;
        color:#55b95a!important;opacity:1!important;visibility:visible!important;
      }
      .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon svg {
        width:68px!important;height:68px!important;
        min-width:68px!important;min-height:68px!important;
        max-width:none!important;max-height:none!important;
        display:block!important;overflow:visible!important;
        fill:none!important;stroke:currentColor!important;
        stroke-width:2.15!important;stroke-linecap:round!important;stroke-linejoin:round!important;
        color:#55b95a!important;
      }
      .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon svg .icon-fill {
        fill:currentColor!important;fill-opacity:.14!important;stroke:none!important;
      }
      .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon svg circle[fill="currentColor"] {
        fill:currentColor!important;stroke:none!important;
      }
      .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon svg path,
      .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon svg circle,
      .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon svg rect,
      .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon svg line,
      .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon svg polyline,
      .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon svg polygon { vector-effect:non-scaling-stroke; }

      .dashboard-page .bottom-nav button .adi-svg-icon {
        width:30px!important;height:30px!important;min-width:30px!important;min-height:30px!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        flex:0 0 30px!important;overflow:visible!important;
        color:#55b95a!important;opacity:1!important;visibility:visible!important;
      }
      .dashboard-page .bottom-nav button .adi-svg-icon svg {
        width:29px!important;height:29px!important;min-width:29px!important;min-height:29px!important;
        max-width:none!important;max-height:none!important;display:block!important;overflow:visible!important;
        fill:none!important;stroke:currentColor!important;stroke-width:2.15!important;
        stroke-linecap:round!important;stroke-linejoin:round!important;color:#55b95a!important;
      }
      .dashboard-page .bottom-nav button .adi-svg-icon svg .icon-fill {
        fill:currentColor!important;fill-opacity:.14!important;stroke:none!important;
      }
      .dashboard-page .bottom-nav button .adi-svg-icon svg circle[fill="currentColor"] {
        fill:currentColor!important;stroke:none!important;
      }

      @media(max-width:600px){
        .dashboard-page .menu-icon.adi-icon-ready { width:64px!important;height:64px!important;min-width:64px!important;min-height:64px!important;flex-basis:64px!important; }
        .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon,
        .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon svg { width:60px!important;height:60px!important;min-width:60px!important;min-height:60px!important; }
      }
      @media(max-width:380px){
        .dashboard-page .menu-icon.adi-icon-ready { width:56px!important;height:56px!important;min-width:56px!important;min-height:56px!important;flex-basis:56px!important; }
        .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon,
        .dashboard-page .menu-icon.adi-icon-ready .adi-svg-icon svg { width:52px!important;height:52px!important;min-width:52px!important;min-height:52px!important; }
      }
    `;
    document.head.appendChild(css);
  }

  function makeIcon(name, className) {
    if (!window.AdiPoultryIcons || typeof window.AdiPoultryIcons.make !== 'function') return null;
    try { return window.AdiPoultryIcons.make(name, className || 'adi-menu-svg'); } catch (e) { return null; }
  }

  function renderMain() {
    document.querySelectorAll('.dashboard-page .menu-icon[data-icon]').forEach(function (el) {
      var name = MAP[el.getAttribute('data-icon')];
      if (!name) return;
      var svg = makeIcon(name, 'adi-menu-svg');
      if (!svg) return;
      el.innerHTML = svg;
      el.classList.add('adi-icon-ready');
      el.setAttribute('aria-hidden', 'true');
    });
  }

  function renderBottom() {
    document.querySelectorAll('.dashboard-page .bottom-nav button').forEach(function (btn) {
      var nav = btn.getAttribute('data-nav') || '';
      var name = nav.indexOf('Dashboard.html') !== -1 ? 'home' :
                 nav.indexOf('Farms.html') !== -1 ? 'farm' :
                 nav.indexOf('weekly.html') !== -1 ? 'scale' :
                 nav.indexOf('reports.html') !== -1 ? 'report' : null;
      if (!name) return;
      var svg = makeIcon(name, 'adi-bottom-svg');
      if (!svg) return;
      var label = btn.querySelector('small');
      btn.innerHTML = svg;
      if (label) btn.appendChild(label);
      btn.classList.add('adi-icon-ready');
    });
  }

  function repair() { installCSS(); renderMain(); renderBottom(); }
  function boot() { repair(); setTimeout(repair,100); setTimeout(repair,400); setTimeout(repair,1000); setTimeout(repair,2000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();