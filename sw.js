/* Adine offline shell service worker v1. Cache static app files only; never cache Supabase API responses. */
'use strict';
const VERSION = 'adine-shell-v1';
const SHELL = [
  '/','/index.html','/login.html','/manifest.json','/offline-core.js',
  '/config.js','/supabase-config.js','/auth.js','/app-core.js',
  '/style.css','/app.css','/auth-compact.css','/seo.css',
  '/Farms.html','/flocks.html','/daily-core.html','/layer-daily-core.html',
  '/weekly.html','/weekly-core.html','/accounting-v14.html'
];
const API_PARTS = ['/rest/v1/','/auth/v1/','/storage/v1/','/realtime/v1/','/functions/v1/'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(SHELL.map(async path => {
      try {
        const response = await fetch(path, { cache:'reload' });
        if (response && (response.ok || response.type === 'opaque')) await cache.put(path, response);
      } catch (_) { /* A non-core optional page can be cached when visited online. */ }
    }));
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
    const cached = await cache.match(req);
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
