/*
 * DASHBOARD APPROVED ICON RENDERER — FINAL
 *
 * Single source of truth: window.AdiPoultryIcons.ICON from poultry-icons.js.
 * No PNG sprite, no CSS mask, no external icon library, no replacement artwork.
 * The dashboard must render the exact approved SVG artwork already stored in
 * poultry-icons.js. This file only gives those SVGs a stable dashboard box and
 * re-renders them if another script replaces the dashboard DOM.
 */
(function () {
    'use strict';

    var APPROVED = [
        'accounting',
        'professionals',
        'farm',
        'flock',
        'weeklyReport',
        'healthcare',
        'mortality',
        'report',
        'archive',
        'settings'
    ];

    function installStyle() {
        if (document.getElementById('adine-dashboard-approved-icons-final')) return;

        var style = document.createElement('style');
        style.id = 'adine-dashboard-approved-icons-final';
        style.textContent = '\n' +
            '.dashboard-page .dashboard-grid .menu-icon{\n' +
            '  width:72px!important;height:72px!important;min-width:72px!important;min-height:72px!important;\n' +
            '  flex:0 0 72px!important;display:flex!important;align-items:center!important;justify-content:center!important;\n' +
            '  box-sizing:border-box!important;padding:0!important;margin:0 0 10px!important;\n' +
            '  overflow:hidden!important;position:relative!important;\n' +
            '}\n' +
            '.dashboard-page .dashboard-grid .menu-icon > .adi-svg-icon{\n' +
            '  width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;\n' +
            '  display:flex!important;align-items:center!important;justify-content:center!important;\n' +
            '  flex:0 0 auto!important;line-height:0!important;\n' +
            '}\n' +
            '.dashboard-page .dashboard-grid .menu-icon > .adi-svg-icon > svg{\n' +
            '  width:44px!important;height:44px!important;max-width:44px!important;max-height:44px!important;\n' +
            '  min-width:0!important;min-height:0!important;display:block!important;\n' +
            '  overflow:visible!important;preserve-aspect-ratio:xMidYMid meet;\n' +
            '}\n' +
            '@media(max-width:600px){\n' +
            ' .dashboard-page .dashboard-grid .menu-icon{width:64px!important;height:64px!important;min-width:64px!important;min-height:64px!important;flex-basis:64px!important}\n' +
            ' .dashboard-page .dashboard-grid .menu-icon > .adi-svg-icon > svg{width:40px!important;height:40px!important;max-width:40px!important;max-height:40px!important}\n' +
            '}\n' +
            '@media(max-width:380px){\n' +
            ' .dashboard-page .dashboard-grid .menu-icon{width:56px!important;height:56px!important;min-width:56px!important;min-height:56px!important;flex-basis:56px!important}\n' +
            ' .dashboard-page .dashboard-grid .menu-icon > .adi-svg-icon > svg{width:36px!important;height:36px!important;max-width:36px!important;max-height:36px!important}\n' +
            '}';
        document.head.appendChild(style);
    }

    function render(box) {
        if (!box) return;

        var name = box.getAttribute('data-icon');
        if (APPROVED.indexOf(name) === -1) return;

        var icons = window.AdiPoultryIcons && window.AdiPoultryIcons.ICON;
        var source = icons && icons[name];
        if (!source) return;

        var current = box.querySelector('.adi-svg-icon');
        if (current && current.getAttribute('data-dashboard-approved') === name) {
            return;
        }

        /* Parse the exact approved SVG string; do not alter its artwork. */
        var holder = document.createElement('div');
        holder.innerHTML = source.trim();
        var svg = holder.querySelector('svg');
        if (!svg) return;

        var wrapper = document.createElement('span');
        wrapper.className = 'adi-svg-icon adi-dashboard-approved-svg';
        wrapper.setAttribute('data-dashboard-approved', name);
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(svg);

        /* Preserve the source viewBox/fill/stroke/path attributes exactly. */
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.display = 'block';
        svg.style.overflow = 'visible';

        box.replaceChildren(wrapper);
        box.classList.add('adi-icon-ready');
    }

    function renderAll() {
        if (!window.AdiPoultryIcons || !window.AdiPoultryIcons.ICON) return;
        document.querySelectorAll('.dashboard-page .dashboard-grid .menu-icon[data-icon]').forEach(render);
    }

    function boot() {
        installStyle();
        renderAll();

        var grid = document.querySelector('.dashboard-page .dashboard-grid');
        if (grid && !grid.__adineApprovedIconObserver) {
            var observer = new MutationObserver(function () {
                renderAll();
            });
            observer.observe(grid, { childList: true, subtree: true });
            grid.__adineApprovedIconObserver = observer;
        }

        [50, 150, 350, 700, 1200].forEach(function (delay) {
            window.setTimeout(renderAll, delay);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
