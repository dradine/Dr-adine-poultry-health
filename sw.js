/* Adine offline shell service worker v1. Cache static app files only; never cache Supabase API responses. */
'use strict';
const VERSION = 'adine-shell-v11';
const SHELL = [
  '/','/index.html','/login.html','/Dashboard.html','/offline-dashboard.html','/offline-dashboard.js','/manifest.json','/offline-core.js',
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
  '/dashboard-icon-assets.js','/dashboard-icon-fix.js','/assets/dashboard-icons-tight.png','/offline-dashboard.html','/offline-dashboard.js','/flocks-genetics-fix-v1.js',
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
  '/dashboard-icon-assets.js','/dashboard-icon-fix.js','/assets/dashboard-icons-tight.png','/offline-dashboard.html','/offline-dashboard.js','/IMG_4309.png'
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
    // Keep the public entry point independent from optional auth/CDN resources.
    // The homepage must remain available even when jsDelivr/Supabase is blocked.
    const requiredEntry = ['/', '/index.html', '/login.html', '/login.js', '/auth.js', '/style.css', '/auth-compact.css', '/seo.css', '/offline-dashboard.html', '/offline-dashboard.js', '/offline.html', '/manifest.json', '/offline-core.js', '/dashboard-icon-fix.js', '/assets/dashboard-icons-tight.png', '/IMG_4309.png'];
    const missingEntry = [];
    for (const path of requiredEntry) if (!(await cache.match(path))) missingEntry.push(path);
    if (missingEntry.length) throw new Error('OFFLINE_ENTRY_CACHE_INCOMPLETE: ' + missingEntry.join(','));
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
    const required = assets.filter(path => WARM_REQUIRED.includes(path));
    const optional = assets.filter(path => !WARM_REQUIRED.includes(path));
    let cached = 0;
    const failed = [];
    async function fetchAsset(path, attempts, timeoutMs) {
      for (let attempt = 0; attempt < attempts; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(new Request(path, { cache:'reload', signal:controller.signal }));
          if (response && response.ok) {
            await cache.put(new URL(path, self.location.origin).pathname, response.clone());
            cached++;
            return true;
          }
          if (attempt === attempts - 1) failed.push(path + ':' + (response?.status || 'NO_RESPONSE'));
        } catch (_) {
          if (attempt === attempts - 1) failed.push(path + ':NETWORK_OR_TIMEOUT');
        } finally {
          clearTimeout(timer);
        }
        // Brief backoff helps mobile connections recover after transient failures.
        if (attempt < attempts - 1) await new Promise(resolve => setTimeout(resolve, 900));
      }
      return false;
    }
    async function runPool(list, concurrency, attempts, timeoutMs) {
      let cursor = 0;
      async function worker() {
        while (true) {
          const index = cursor++;
          if (index >= list.length) return;
          await fetchAsset(list[index], attempts, timeoutMs);
        }
      }
      await Promise.all(Array.from({length:Math.min(concurrency,list.length)}, () => worker()));
    }
    // Required pages get priority, two attempts and a longer timeout. Optional
    // assets are best-effort and must never make an otherwise usable offline app fail.
    await runPool(required, 2, 2, 12000);
    await runPool(optional, 4, 1, 10000);
    const missing = [];
    for (const path of WARM_REQUIRED) if (!(await cache.match(path))) missing.push(path);
    const result = { complete:missing.length===0, cached, total:assets.length, failed:failed.length, failedPaths:failed.slice(0,20), missing };
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
      const cache = await caches.open(VERSION);
      const isHome = url.pathname === '/' || url.pathname === '/index.html';
      const path = url.pathname === '/' ? '/index.html' : url.pathname;
      const cached = await cache.match(req) || await cache.match(url.pathname) || await cache.match(path);

      // The installed iOS PWA must render its public home screen without waiting
      // for DNS, VPN, a TLS handshake, or a slow/filtered network request.
      if (isHome && cached) return cached;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), isHome ? 5000 : 2500);
      try {
        const response = await fetch(new Request(req, { signal:controller.signal }));
        if (response && response.ok) {
          cache.put(req, response.clone()).catch(()=>{});
          cache.put(url.pathname, response.clone()).catch(()=>{});
          if (url.pathname === '/') cache.put('/index.html', response.clone()).catch(()=>{});
        }
        return response;
      } catch (_) {
        if (cached) return cached;
        if (isHome) {
          return new Response(`<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#1f3b2c"><title>مرکز تخصصی سلامت طیور آدینه</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b2118;color:#f3f8f4;font:16px/2 Tahoma,Arial,sans-serif;padding:22px;box-sizing:border-box"><main style="max-width:520px;text-align:center"><h1>مرکز تخصصی سلامت طیور آدینه</h1><p>در حال حاضر اتصال اینترنت در دسترس نیست.</p><p>اگر قبلاً برنامه را در حالت آنلاین باز کرده‌اید، صفحه ورود و اطلاعات ذخیره‌شده این دستگاه را بررسی کنید.</p><p><a href="/login.html" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#a8d65e;color:#10200f;text-decoration:none;font-weight:bold">ورود به سامانه</a></p><p><a href="tel:+989131278085" style="color:#c8e99a">تماس مستقیم با دکتر</a></p></main></body></html>`, {status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});
        }
        return await cache.match('/offline.html') || Response.error();
      } finally {
        clearTimeout(timer);
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
