const { createRequire } = require('node:module');
const requireFromEnv = createRequire(__filename);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const baseURL = process.env.OFFLINE_TEST_BASE_URL || 'http://127.0.0.1:4173';
const failures = [];
function check(condition, message) {
  if (!condition) failures.push(message);
  console.log((condition ? 'PASS ' : 'FAIL ') + message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  page.on('pageerror', error => console.log('PAGE ERROR (diagnostic): ' + error.message));

  try {
    const response = await page.goto(baseURL + '/login.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    check(!!response && response.status() === 200, 'login page serves over local secure-context origin');

    await page.waitForFunction(() => !!navigator.serviceWorker && navigator.serviceWorker.controller, { timeout: 30000 }).catch(() => {});
    await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) throw new Error('Service Worker API unavailable');
      await navigator.serviceWorker.ready;
    }).catch(error => failures.push('service worker registration/activation: ' + error.message));

    const state = await page.evaluate(async () => {
      const keys = await caches.keys();
      const cacheNames = keys.filter(k => k.startsWith('adine-shell-'));
      const cached = {};
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        cached[name] = {
          login: !!(await cache.match('/login.html')),
          dashboard: !!(await cache.match('/Dashboard.html')),
          offline: !!(await cache.match('/offline.html')),
          urls: (await cache.keys()).map(req => req.url)
        };
      }
      return {
        controller: !!navigator.serviceWorker.controller,
        cacheNames,
        cached,
        dbAvailable: typeof indexedDB !== 'undefined'
      };
    });

    check(state.controller, 'service worker controls the login page');
    check(state.cacheNames.some(name => state.cached[name]?.login), 'login page is stored in the app-shell cache');
    check(state.cacheNames.some(name => state.cached[name]?.dashboard), 'dashboard page is stored in the app-shell cache');
    check(state.cacheNames.some(name => state.cached[name]?.offline), 'offline fallback page is stored in the app-shell cache');
    check(state.dbAvailable, 'IndexedDB API is available for local records');

    await context.setOffline(true);
    const offlineResponse = await page.goto(baseURL + '/login.html?offline-smoke=1', {
      waitUntil: 'domcontentloaded', timeout: 15000
    }).catch(() => null);
    const offlineState = await page.evaluate(() => ({
      title: document.title,
      loginHeading: document.querySelector('#loginTitle')?.textContent?.trim() || '',
      bodyText: document.body?.innerText || ''
    }));
    check(!!offlineResponse && offlineResponse.status() === 200, 'cached login navigation succeeds with browser network disabled');
    check(offlineState.loginHeading.includes('مرکز تخصصی سلامت طیور آدینه'), 'cached login content is rendered offline');

    await context.setOffline(false);
    const apiCached = Object.values(state.cached).some(cache =>
      cache.urls.some(url => /supabase\.co\/(rest|auth|storage|realtime|functions)\//i.test(url))
    );
    check(!apiCached, 'no Supabase API URL is present in the service-worker cache');

    console.log('\nBrowser smoke summary: ' + (failures.length ? failures.length + ' failure(s)' : 'all checks passed'));
    if (failures.length) {
      failures.forEach(item => console.error(' - ' + item));
      process.exitCode = 1;
    }
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
