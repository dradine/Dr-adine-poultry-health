/* Adine offline shell service worker v1. Cache static app files only; never cache Supabase API responses. */
'use strict';
const VERSION = 'adine-shell-v8';
const SHELL = [
  '/','/index.html','/login.html','/Dashboard.html','/manifest.json','/offline-core.js',
  '/config.js','/supabase-config.js','/auth.js','/app-core.js',
  '/style.css','/app.css','/auth-compact.css','/seo.css',
  '/Farms.html','/flocks.html','/daily-core.html','/layer-daily-core.html',
  '/weekly.html','/daily-router.html','/weekly-router.html','/weekly-core.html','/layer-weekly-core.html','/layer-monthly-core.html','/accounting-v14.html','/offline.html',
  '/Farms.js','/flocks.js','/farm-region-runtime-v1.js','/app-core.js',
  '/standard-data.js','/standards.js','/poultry-utils.js','/weekly-storage.js',
  '/comparison-engine.js','/genetics-ui.js','/weekly-engine.js','/access-control.js',
  '/date-system.js','/broiler-daily-standards-v1.js','/broiler-daily-monitoring-v1.js',
  '/broiler-daily-history-actions-v1.js','/broiler-daily-monitoring-enhancements-v1.js',
  '/layer-daily-standards-v1.js','/layer-period-engine-v1.js','/layer-daily-monitoring-v1.js',
  '/weekly.js','/weekly-lazy-assets-v1.js','/weekly-specialized.js','/performance-engine-v2.js',
  '/performance-intelligence-v1.js','/adine-weight-band-engine-v1.js','/weight-band-runtime-v1.js',
  '/shared-jalali-calendar-v1.js','/accounting-v14.js','/dashboard-compact.css',
  '/dashboard-icon-assets.js','/dashboard-icon-fix.js','/flocks-genetics-fix-v1.js',
  '/flocks-genetics-final.js','/production-date-picker.js','/poultry-icons.js',
  '/app.css','/style.css','/auth-compact.css','/seo.css',
  '/login.js','/IMG_4309.png','/apple-touch-icon.png','/favicon.png',
  '/broiler-fcr-engine-v11.js','/edit-manager.js','/farm-house-flock-enhancements.js',
  '/guangming2-genetics-ui-fix-v1.js','/guangming2-integration-v1.js','/weekly-completion-restore-v1.js',
  '/flocks-genetics-selector-v2.js','/broiler-daily-alert-engine-v1.js','/layer-daily-alert-engine-v1.js'
];
const CORE_SHELL = [
  '/','/index.html','/login.html','/Dashboard.html','/manifest.json','/offline.html',
  '/daily-router.html','/weekly-router.html','/daily-core.html','/layer-daily-core.html',
  '/weekly-core.html','/layer-weekly-core.html','/layer-monthly-core.html',
  '/offline-core.js','/config.js','/supabase-config.js','/auth.js','/login.js',
  '/style.css','/auth-compact.css','/seo.css','/app.css','/dashboard-compact.css',
  '/dashboard-icon-assets.js','/dashboard-icon-fix.js','/IMG_4309.png'
];
const API_PARTS = ['/rest/v1/','/auth/v1/','/storage/v1/','/realtime/v1/','/functions/v1/'];
const SUPABASE_SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
const CDN_ASSETS = [
  SUPABASE_SDK_URL,
  'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
  'https://cdn.jsdelivr.net/npm/persian-date@1.1.0/dist/persian-date.min.js',
  'https://cdn.jsdelivr.net/npm/persian-datepicker@1.2.0/dist/js/persian-datepicker.min.js',
  'https://cdn.jsdelivr.net/npm/persian-datepicker@1.2.0/dist/css/persian-datepicker.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Keep installation deliberately small: the previous installer fetched the
    // entire application and several optional CDNs at once, competing with login
    // and dashboard requests on mobile connections.
    const installAssets = [...CORE_SHELL, SUPABASE_SDK_URL];
    await Promise.all(installAssets.map(async asset => {
      const isCdn = /^https:\/\//i.test(asset);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const request = isCdn
          ? new Request(asset, { mode:'no-cors', credentials:'omit', signal:controller.signal })
          : new Request(asset, { cache:'reload', signal:controller.signal });
        const response = await fetch(request);
        if (response && (response.ok || response.type === 'opaque')) {
          await cache.put(isCdn ? request : new URL(asset, self.location.origin).pathname, response);
        }
      } catch (_) {
        // A failed optional/core fetch must not hold up the interactive app.
      } finally {
        clearTimeout(timer);
      }
    }));
    // Do not activate a new offline worker unless its authentication and app-entry core is cached.
    // A transient install-time network failure must not advertise an offline-ready shell.
    const verifiedCore = await Promise.all(CORE_SHELL.map(path => cache.match(path)));
    const missingCore = CORE_SHELL.filter((path, index) => !verifiedCore[index]);
    // Offline authentication still needs the Supabase client to initialize the
    // shared auth/access helpers. Do not activate an incomplete offline shell.
    if (!(await cache.match(SUPABASE_SDK_URL))) missingCore.push('supabase-js CDN');
    if (missingCore.length) throw new Error('OFFLINE_CORE_CACHE_INCOMPLETE: ' + missingCore.join(','));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('adine-shell-') && k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
const WARM_REQUIRED = [
  '/Farms.html','/Farms.js','/flocks.html','/flocks.js',
  '/daily-core.html','/broiler-daily-monitoring-v1.js',
  '/layer-daily-core.html','/layer-daily-monitoring-v1.js',
  '/weekly-core.html','/weekly.js','/access-control.js',
  '/accounting-v14.html','/accounting-v14.js'
];
self.addEventListener('message', event => {
  if (event.data?.type !== 'ADINE_WARM_OFFLINE_SHELL') return;
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    const assets = [...new Set(SHELL)].filter(path => !CORE_SHELL.includes(path));
    let cursor = 0, cached = 0;
    const failed = [];
    async function worker() {
      while (true) {
        const index = cursor++;
        if (index >= assets.length) return;
        const path = assets[index];
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        try {
          const response = await fetch(new Request(path, { cache:'reload', signal:controller.signal }));
          if (response && response.ok) {
            await cache.put(new URL(path, self.location.origin).pathname, response.clone());
            cached++;
          } else failed.push(path + ':' + (response?.status || 'NO_RESPONSE'));
        } catch (_) {
          failed.push(path);
        } finally {
          clearTimeout(timer);
        }
      }
    }
    await Promise.all(Array.from({length:Math.min(4,assets.length)}, () => worker()));
    const missing = [];
    for (const path of WARM_REQUIRED) if (!(await cache.match(path))) missing.push(path);
    const result = { complete:missing.length===0, cached, total:assets.length, failed:failed.length, missing };
    try { event.ports?.[0]?.postMessage(result); } catch (_) {}
  })().catch(error => {
    try { event.ports?.[0]?.postMessage({complete:false,error:String(error?.message||error)}); } catch (_) {}
  }));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (API_PARTS.some(p => url.pathname.includes(p)) || url.hostname.includes('supabase.co')) return;
  const isScriptOrStyle = ['script','style','font','image'].includes(req.destination);
  const sameOrigin = url.origin === self.location.origin;
  const allowedCdn = ['cdn.jsdelivr.net','cdnjs.cloudflare.com','unpkg.com'].includes(url.hostname) && isScriptOrStyle;
  if (!sameOrigin && !allowedCdn) return;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(req);
        if (response && response.ok) {
          const cache = await caches.open(VERSION);
          cache.put(req, response.clone()).catch(()=>{});
        }
        return response;
      } catch (_) {
        const cache = await caches.open(VERSION);
        return (await cache.match(req)) || (await cache.match(url.pathname)) || (await cache.match('/offline.html')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req) || (sameOrigin ? await cache.match(url.pathname) : null);
    if (cached) return cached;
    try {
      const response = await fetch(req);
      if (response && (response.ok || response.type === 'opaque')) cache.put(req, response.clone()).catch(()=>{});
      return response;
    } catch (_) {
      return cached || Response.error();
    }
  })());
});
