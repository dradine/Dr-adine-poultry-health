const { createRequire } = require('node:module');
const requireFromEnv = createRequire(__filename);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');

const baseURL = process.env.OFFLINE_TEST_BASE_URL || 'http://127.0.0.1:4173';
const failures = [];
function check(condition, message) {
  if (!condition) failures.push(message);
  console.log((condition ? 'PASS ' : 'FAIL ') + message);
}

const accessBridgeSource = fs.readFileSync(path.join(__dirname, '..', 'access-control.js'), 'utf8');
const weeklySource = fs.readFileSync(path.join(__dirname, '..', 'weekly.js'), 'utf8');
check(/if\s*\(typeof window\.loadCurrentFlock\s*!==\s*['"]function['"]\)/.test(accessBridgeSource), 'access bridge preserves the native weekly flock loader when it exists');
check(/if\s*\(typeof window\.loadHistory\s*!==\s*['"]function['"]\)/.test(accessBridgeSource), 'access bridge preserves the native weekly history loader when it exists');
check(/const rpcResults=await Promise\.all/.test(accessBridgeSource), 'farm access RPC lookups run in parallel rather than serially');
check(/async canAccessFarm\(id\)\{if\(!id\)return false;const rows=await this\.farmAccessRows\(\);return rows\.some/.test(accessBridgeSource), 'farm access checks reuse the RLS-authorized farm list instead of issuing duplicate reads');
check(/navigator\.onLine===false&&window\.AdineOffline\)return window\.AdineOffline\.getRows\('farms',uid\)/.test(accessBridgeSource), 'farm chooser can use the cached authorized farm list without internet');
check(/if\s*\(!navigator\.onLine\s*&&\s*window\.AdineOffline\)/.test(weeklySource), 'native weekly loader retains its offline snapshot fallback');

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
          dailyRouter: !!(await cache.match('/daily-router.html')),
          weeklyRouter: !!(await cache.match('/weekly-router.html')),
          layerWeekly: !!(await cache.match('/layer-weekly-core.html')),
          layerMonthly: !!(await cache.match('/layer-monthly-core.html')),
          supabaseSdk: !!(await cache.match('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')),
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
    check(state.cacheNames.some(name => state.cached[name]?.dailyRouter), 'daily router is stored in the app-shell cache');
    check(state.cacheNames.some(name => state.cached[name]?.weeklyRouter), 'weekly router is stored in the app-shell cache');
    check(state.cacheNames.some(name => state.cached[name]?.layerWeekly), 'Layer weekly route is stored in the app-shell cache');
    check(state.cacheNames.some(name => state.cached[name]?.layerMonthly), 'Layer monthly route is stored in the app-shell cache');
    check(state.cacheNames.some(name => state.cached[name]?.supabaseSdk), 'Supabase client SDK is cached for offline auth initialization');
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

    const primeBehavior = await page.evaluate(async () => {
      const api = window.AdineOffline;
      if (!api || typeof api.prime !== 'function' || typeof api.saveProfile !== 'function') return { available:false };
      const uid = '__offline_layer_prime_smoke__';
      const calls = {};
      let failFirstFlockSnapshot = true;
      const rows = {
        farms:[{id:'prime-layer-farm',owner_id:uid}],
        houses:[{id:'prime-layer-house',farm_id:'prime-layer-farm'}],
        flocks:[
          {id:'prime-layer-flock',farm_id:'prime-layer-farm',house_id:'prime-layer-house',production_type:'layer'},
          {id:'prime-layer-flock-2',farm_id:'prime-layer-farm',house_id:'prime-layer-house',production_type:'layer'}
        ],
        layer_daily_monitoring:[{id:'prime-layer-daily',flock_id:'prime-layer-flock',record_date:'2026-11-01'}],
        layer_weekly_monitoring:[{id:'prime-layer-weekly',flock_id:'prime-layer-flock',week_no:1}],
        layer_monthly_monitoring:[{id:'prime-layer-monthly',flock_id:'prime-layer-flock',jalali_year:1405,jalali_month:8}],
        farm_accounting_transactions:[{id:'prime-layer-accounting',farm_id:'prime-layer-farm',flock_id:'prime-layer-flock',farm_type:'layer',event_date:'2026-11-01'}]
      };
      Object.defineProperty(navigator, 'onLine', { configurable:true, get:() => true });
      localStorage.setItem('adine_poultry_current_selection', JSON.stringify({flockId:'prime-layer-flock',farmId:'prime-layer-farm'}));
      window.AdineAuth.getSession = async () => ({ user:{id:uid} });
      window.supabaseClient = {
        auth:{},
        from(table) {
          calls[table] = (calls[table] || 0) + 1;
          return {
            select(){return this;},
            eq(){return this;},
            order(){return this;},
            limit(){
              if(table==='flocks' && failFirstFlockSnapshot){
                failFirstFlockSnapshot=false;
                return Promise.resolve({data:null,error:{message:'SIMULATED_TRANSIENT_FAILURE'}});
              }
              return Promise.resolve({data:rows[table] || [],error:null});
            }
          };
        }
      };
      try {
        await api.saveProfile({id:uid,full_name:'Offline test',role:'farm_manager',status:'active',is_active:true,user_type:'farm_manager'});
        const callsAfterProfileSave = Object.values(calls).reduce((sum,n)=>sum+n,0);
        const first = await api.prime(true);
        const second = await api.prime(false);
        const layerTables = ['layer_daily_monitoring','layer_weekly_monitoring','layer_monthly_monitoring','farm_accounting_transactions'];
        const cached = {};
        for (const table of layerTables) cached[table] = (await api.getRows(table,uid)).map(row=>String(row.id));
        localStorage.setItem('adine_poultry_current_selection', JSON.stringify({flockId:'prime-layer-flock-2',farmId:'prime-layer-farm'}));
        const afterSelectionChange = await api.prime(false);
        return {
          available:true,
          callsAfterProfileSave,
          firstPartial:first.partial===true,
          secondComplete:second.complete===true,
          selectionChangeComplete:afterSelectionChange.complete===true,
          flockFetches:calls.flocks || 0,
          cached
        };
      } catch(error) {
        return {available:false,error:String(error)};
      } finally {
        localStorage.removeItem('adine_poultry_current_selection');
        Object.defineProperty(navigator, 'onLine', { configurable:true, get:() => false });
      }
    });
    check(primeBehavior.available, 'offline snapshot preparation can be tested with an isolated mock Supabase client');
    if (primeBehavior.available) {
      check(primeBehavior.callsAfterProfileSave === 0, 'saving a verified profile does not start bulk network reads during login');
      check(primeBehavior.firstPartial && primeBehavior.secondComplete, 'a transient snapshot failure remains retryable instead of setting a false success throttle');
      check(primeBehavior.flockFetches === 3, 'failed snapshot is retried and switching the selected flock triggers a fresh snapshot');
      check(primeBehavior.selectionChangeComplete, 'a newly selected flock receives its own offline snapshot without waiting for the previous flock throttle');
      check(JSON.stringify(primeBehavior.cached.layer_daily_monitoring) === JSON.stringify(['prime-layer-daily']), 'layer daily history is cached for offline use');
      check(JSON.stringify(primeBehavior.cached.layer_weekly_monitoring) === JSON.stringify(['prime-layer-weekly']), 'layer weekly history is cached for offline use');
      check(JSON.stringify(primeBehavior.cached.layer_monthly_monitoring) === JSON.stringify(['prime-layer-monthly']), 'layer monthly history is cached for offline use');
      check(JSON.stringify(primeBehavior.cached.farm_accounting_transactions) === JSON.stringify(['prime-layer-accounting']), 'shared layer accounting history is cached for offline use');
    } else {
      failures.push('offline prime behavior: ' + (primeBehavior.error || 'offline prime API unavailable'));
    }

    const layerSeed = await page.evaluate(async () => {
      const api=window.AdineOffline;
      if(!api)return {available:false};
      const uid='__offline_layer_view_smoke__',flockId='offline-layer-flock';
      const flock={id:flockId,owner_id:uid,farm_id:'offline-layer-farm',house_id:'offline-layer-house',flock_name:'گله آزمایشی',strain:'Hy-Line Brown',production_type:'layer'};
      const weekly={id:'offline-layer-week-3',flock_id:flockId,week_no:3,age_start_days:15,age_end_days:21,avg_hen_day_production:91,avg_feed_per_hen_g:112,avg_water_per_hen_ml:205,avg_egg_weight_g:62,avg_egg_mass_g:56.4,feed_per_egg_g:123,mortality_count:12,source_daily_count:7,is_complete:true};
      const monthly={id:'offline-layer-month-1405-08',flock_id:flockId,jalali_year:1405,jalali_month:8,jalali_month_key:'1405-08',jalali_month_label:'آبان ۱۴۰۵',age_start_days:15,age_end_days:44,avg_hen_day_production:91,avg_feed_per_hen_g:112,avg_water_per_hen_ml:205,avg_egg_weight_g:62,avg_egg_mass_g:56.4,feed_per_egg_mass:1.99,mortality_count:30,livability:99,total_eggs:12000,total_saleable_eggs:11800,source_daily_count:30,is_complete:true};
      try{
        await api.saveProfile({id:uid,full_name:'Offline layer test',email:'offline@example.invalid',role:'farm_manager',status:'active',is_active:true,user_type:'farm_manager'});
        await api.cacheRows('flocks',[flock],uid,{complete:false,limit:10});
        await api.cacheRows('layer_weekly_monitoring',[weekly],uid,{scope:{flock_id:flockId},complete:true,limit:300});
        await api.cacheRows('layer_monthly_monitoring',[monthly],uid,{scope:{flock_id:flockId},complete:true,limit:120});
        return {available:true,flockId};
      }catch(error){return {available:false,error:String(error)}}
    });
    check(layerSeed.available, 'offline layer profile, flock, weekly and monthly snapshots can be seeded');
    if(layerSeed.available){
      const dashboardResponse=await page.goto(baseURL+'/Dashboard.html?offline-smoke=1',{waitUntil:'domcontentloaded',timeout:15000}).catch(()=>null);
      await page.waitForFunction(()=>document.querySelector('#offlinePrepCard')?.style.display==='flex',{timeout:10000}).catch(()=>{});
      const dashboardOfflineState=await page.evaluate(()=>({card:document.querySelector('#offlinePrepCard')?.style.display||'',button:!!document.querySelector('#offlineRefreshButton'),status:document.querySelector('#offlinePrepStatus')?.textContent||''}));
      check(!!dashboardResponse&&dashboardResponse.status()===200,'dashboard opens from the offline app shell');
      check(dashboardOfflineState.card==='flex'&&dashboardOfflineState.button,'dashboard exposes the manual offline data preparation control for farm users');
      if(dashboardOfflineState.button){
        await page.click('#offlineRefreshButton');
        const offlineButtonStatus=await page.locator('#offlinePrepStatus').textContent();
        check(offlineButtonStatus.includes('به‌روزرسانی')||offlineButtonStatus.includes('اینترنت'),'manual offline refresh gives a clear message when the device is offline');
      }

      const weeklyResponse=await page.goto(baseURL+'/layer-weekly-core.html?flock_id='+encodeURIComponent(layerSeed.flockId),{waitUntil:'domcontentloaded',timeout:15000}).catch(()=>null);
      await page.waitForFunction(()=>document.querySelector('#prod')?.textContent?.includes('91'),{timeout:10000}).catch(()=>{});
      const weeklyState=await page.evaluate(()=>({flock:document.querySelector('#flockInfo')?.textContent||'',production:document.querySelector('#prod')?.textContent||'',week:document.querySelector('#weekSelect')?.options?.length||0,note:document.querySelector('#note')?.textContent||''}));
      check(!!weeklyResponse&&weeklyResponse.status()===200,'layer weekly page opens from the offline app shell');
      check(weeklyState.flock.includes('نمایش آفلاین')&&weeklyState.production.includes('91')&&weeklyState.week>0,'layer weekly metrics render from IndexedDB without internet');

      const monthlyResponse=await page.goto(baseURL+'/layer-monthly-core.html?flock_id='+encodeURIComponent(layerSeed.flockId),{waitUntil:'domcontentloaded',timeout:15000}).catch(()=>null);
      await page.waitForFunction(()=>document.querySelector('#prod')?.textContent?.includes('91'),{timeout:10000}).catch(()=>{});
      const monthlyState=await page.evaluate(()=>({flock:document.querySelector('#flockInfo')?.textContent||'',production:document.querySelector('#prod')?.textContent||'',eggs:document.querySelector('#eggs')?.textContent||'',months:document.querySelector('#monthSelect')?.options?.length||0}));
      check(!!monthlyResponse&&monthlyResponse.status()===200,'layer monthly page opens from the offline app shell');
      check(monthlyState.flock.includes('نمایش آفلاین')&&monthlyState.production.includes('91')&&monthlyState.eggs.includes('12')&&monthlyState.months>0,'layer monthly metrics render from IndexedDB without internet');
    }else{
      failures.push('offline layer page behavior: '+(layerSeed.error||'seed unavailable'));
    }

    const syncBehavior = await page.evaluate(async () => {
      const api = window.AdineOffline;
      if (!api) return { available:false };
      const uid = '__offline_sync_smoke_user__';
      Object.defineProperty(navigator, 'onLine', { configurable:true, get:() => false });
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
