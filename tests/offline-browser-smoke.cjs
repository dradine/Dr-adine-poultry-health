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

    const cacheBehavior = await page.evaluate(async () => {
      const api = window.AdineOffline;
      if (!api || typeof api.cacheRows !== 'function' || typeof api.getRows !== 'function') {
        return { available:false };
      }
      const uid = '__offline_cache_reconciliation_smoke__';
      await api.cacheRows('farms', [{id:'farm-a',name:'A'},{id:'farm-b',name:'B'}], uid, {complete:true,limit:10});
      await api.cacheRows('farms', [{id:'farm-a',name:'A2'}], uid, {complete:true,limit:10});
      const completeIds = (await api.getRows('farms',uid)).map(x=>String(x.id)).sort();
      await api.cacheRows('farms', [{id:'farm-c',name:'C'}], uid, {complete:false,limit:10});
      const partialIds = (await api.getRows('farms',uid)).map(x=>String(x.id)).sort();
      await api.cacheRows('broiler_daily_monitoring', [
        {id:'daily-a1',flock_id:'flock-a'},
        {id:'daily-b1',flock_id:'flock-b'}
      ], uid, {complete:true,limit:10});
      await api.cacheRows('broiler_daily_monitoring', [
        {id:'daily-a2',flock_id:'flock-a'}
      ], uid, {scope:{flock_id:'flock-a'},complete:true,limit:10});
      const scopedRows = await api.getRows('broiler_daily_monitoring',uid);
      const scopedIds = scopedRows.map(x=>String(x.id)).sort();
      await api.cacheRows('flocks', [{id:'flock-a'}], uid, {complete:true,limit:10});
      const afterFlockAccessRefresh = (await api.getRows('broiler_daily_monitoring',uid)).map(x=>String(x.id)).sort();
      await api.cacheRows('houses', [{id:'house-a'},{id:'house-b'}], uid, {complete:true,limit:10});
      await api.cacheRows('houses', [{id:'house-c'}], uid, {complete:true,limit:1});
      const cappedIds = (await api.getRows('houses',uid)).map(x=>String(x.id)).sort();
      return {
        available:true,
        completeIds,
        partialIds,
        scopedIds,
        scopedFlocks:scopedRows.map(x=>String(x.flock_id)).sort(),
        afterFlockAccessRefresh,
        cappedIds
      };
    }).catch(error => ({available:false,error:String(error)}));
    check(cacheBehavior.available, 'offline core exposes snapshot cache APIs for behavioral tests');
    if (cacheBehavior.available) {
      check(JSON.stringify(cacheBehavior.completeIds) === JSON.stringify(['farm-a']), 'complete snapshot removes stale rows from the same table');
      check(JSON.stringify(cacheBehavior.partialIds) === JSON.stringify(['farm-a','farm-c']), 'incomplete snapshot preserves rows that may be outside a truncated result');
      check(JSON.stringify(cacheBehavior.scopedIds) === JSON.stringify(['daily-a2','daily-b1']), 'scoped snapshot removes stale rows only for the refreshed flock');
      check(JSON.stringify(cacheBehavior.scopedFlocks) === JSON.stringify(['flock-a','flock-b']), 'scoped refresh preserves another flock’s cached history');
      check(JSON.stringify(cacheBehavior.afterFlockAccessRefresh) === JSON.stringify(['daily-a2']), 'complete authoritative flock refresh purges child snapshots for flocks no longer authorized');
      check(JSON.stringify(cacheBehavior.cappedIds) === JSON.stringify(['house-a','house-b','house-c']), 'result at query limit never triggers destructive reconciliation');
    } else {
      failures.push('snapshot cache behavior: ' + (cacheBehavior.error || 'offline API unavailable'));
    }

    const syncBehavior = await page.evaluate(async () => {
      const api = window.AdineOffline;
      if (!api) return { available:false };
      const uid = '__offline_sync_smoke_user__';
      const serverRows = new Map();
      const attempts = {};
      let loseFirstFarmResponse = true;
      window.AdineAuth.getSession = async () => ({ user:{ id:uid } });
      window.supabaseClient = {
        auth: { getSession: async () => ({ data:{ session:{ user:{ id:uid } } }, error:null }) },
        from(table) {
          const query = {
            select() { return this; },
            order() { return this; },
            limit() { return this; },
            eq() { return this; },
            maybeSingle() {
              return Promise.resolve({
                data: table === 'profiles' ? { id:uid, role:'farm_manager', status:'active', is_active:true } : null,
                error:null
              });
            },
            upsert(payload, options) {
              attempts[table] = (attempts[table] || 0) + 1;
              if (!options || options.ignoreDuplicates !== true || options.onConflict !== 'id') {
                return Promise.resolve({ data:null, error:{ message:'IDEMPOTENCY_OPTIONS_MISSING' } });
              }
              const key = table + ':' + String(payload.id);
              if (!serverRows.has(key)) serverRows.set(key, Object.assign({}, payload));
              // Simulate a lost network response after the server accepted the first farm insert.
              if (table === 'farms' && loseFirstFarmResponse) {
                loseFirstFarmResponse = false;
                return Promise.resolve({ data:null, error:{ message:'Failed to fetch' } });
              }
              return Promise.resolve({ data:null, error:null });
            },
            then(resolve, reject) {
              return Promise.resolve({ data:[], error:null }).then(resolve, reject);
            }
          };
          return query;
        }
      };
      try {
        await api.saveLocal('farms', { id:'sync-farm-1', owner_id:uid, name:'Test farm' }, { userId:uid });
        await api.saveLocal('houses', { id:'sync-house-1', owner_id:uid, farm_id:'sync-farm-1', name:'Test house' }, { userId:uid });
        await api.saveLocal('flocks', { id:'sync-flock-1', owner_id:uid, farm_id:'sync-farm-1', house_id:'sync-house-1', name:'Test flock' }, { userId:uid });
        await api.saveLocal('broiler_daily_monitoring', { id:'sync-daily-1', owner_id:uid, farm_id:'sync-farm-1', house_id:'sync-house-1', flock_id:'sync-flock-1', record_date:'2026-10-28' }, { userId:uid });
        await api.saveLocal('layer_daily_monitoring', { id:'sync-layer-daily-1', owner_id:uid, farm_id:'sync-farm-1', house_id:'sync-house-1', flock_id:'sync-flock-1', record_date:'2026-10-28' }, { userId:uid });
        await api.saveLocal('weekly_records', { id:'sync-weekly-1', owner_id:uid, farm_id:'sync-farm-1', house_id:'sync-house-1', flock_id:'sync-flock-1', week_number:1 }, { userId:uid });
        await api.saveLocal('farm_accounting_transactions', { id:'sync-accounting-1', owner_id:uid, farm_id:'sync-farm-1', amount:100, transaction_type:'income', event_date:'2026-10-28' }, { userId:uid });
        const pendingOffline = (await api.getPending()).length;
        Object.defineProperty(navigator, 'onLine', { configurable:true, get:() => true });
        const first = await api.sync(true);
        const pendingAfterLostResponse = (await api.getPending()).length;
        const second = await api.sync(true);
        const pendingAfterRetry = (await api.getPending()).length;
        return {
          available:true,
          pendingOffline,
          firstPending:first.pending,
          pendingAfterLostResponse,
          secondSynced:second.synced,
          pendingAfterRetry,
          serverCount:serverRows.size,
          farmAttempts:attempts.farms,
          tables:Array.from(serverRows.keys()).map(key=>key.split(':')[0]).sort()
        };
      } catch (error) {
        return { available:false, error:String(error) };
      }
    });
    check(syncBehavior.available, 'offline queue and sync behavior can be exercised with an isolated mock server');
    if (syncBehavior.available) {
      check(syncBehavior.pendingOffline === 7, 'farm, house, flock, broiler/layer daily, weekly and accounting records persist locally while offline');
      check(syncBehavior.firstPending === 7 && syncBehavior.pendingAfterLostResponse === 7, 'network response loss keeps the operation queue intact');
      check(syncBehavior.secondSynced === 7 && syncBehavior.pendingAfterRetry === 0, 'retry synchronizes the dependency chain and clears the queue');
      check(syncBehavior.serverCount === 7, 'retry after an accepted-but-lost response does not duplicate server records');
      check(syncBehavior.farmAttempts === 2, 'the farm insert is retried idempotently after simulated response loss');
      check(JSON.stringify(syncBehavior.tables) === JSON.stringify(['broiler_daily_monitoring','farm_accounting_transactions','farms','flocks','houses','layer_daily_monitoring','weekly_records']), 'broiler/layer daily, weekly and accounting records reach the mock server');
    } else {
      failures.push('offline sync behavior: ' + (syncBehavior.error || 'mock sync unavailable'));
    }

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
