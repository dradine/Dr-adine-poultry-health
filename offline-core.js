/* Adine Offline Core v1
 * Local-first persistence and safe, ordered, idempotent insert synchronization.
 * No passwords or service-role credentials are stored locally.
 */
(function (g) {
  'use strict';
  if (g.AdineOffline) return;

  const DB_NAME = 'adine-offline-v1';
  const DB_VERSION = 1;
  const MAX_OFFLINE_DAYS = 7;
  const ALLOWED_TABLES = new Set([
    'farms', 'houses', 'flocks',
    'broiler_daily_monitoring', 'layer_daily_monitoring',
    'weekly_records', 'layer_weekly_monitoring', 'layer_monthly_monitoring',
    'farm_accounting_transactions', 'layer_accounting_transactions'
  ]);
  let dbPromise = null;
  let syncPromise = null;
  let primePromise = null;
  let lastPrimeAt = 0;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!g.indexedDB) { reject(new Error('INDEXEDDB_UNAVAILABLE')); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains('profiles')) db.createObjectStore('profiles', { keyPath: 'userId' });
        if (!db.objectStoreNames.contains('snapshots')) {
          const s = db.createObjectStore('snapshots', { keyPath: 'key' });
          s.createIndex('byUserTable', ['userId', 'table'], { unique: false });
        }
        if (!db.objectStoreNames.contains('records')) {
          const s = db.createObjectStore('records', { keyPath: 'key' });
          s.createIndex('byUserTable', ['userId', 'table'], { unique: false });
        }
        if (!db.objectStoreNames.contains('queue')) {
          const s = db.createObjectStore('queue', { keyPath: 'opId' });
          s.createIndex('byUserCreated', ['userId', 'createdAt'], { unique: false });
        }
      };
      req.onsuccess = function () {
        const db = req.result;
        db.onversionchange = function () { db.close(); dbPromise = null; };
        resolve(db);
      };
      req.onerror = function () { dbPromise = null; reject(req.error || new Error('INDEXEDDB_OPEN_FAILED')); };
      req.onblocked = function () { console.warn('[AdineOffline] Database upgrade blocked by another open tab.'); };
    });
    return dbPromise;
  }

  function requestResult(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('INDEXEDDB_REQUEST_FAILED')); };
    });
  }

  async function transact(storeName, mode, callback) {
    const db = await openDB();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(storeName, mode);
      let result;
      try { result = callback(tx.objectStore(storeName)); }
      catch (e) { try { tx.abort(); } catch (_) {} reject(e); return; }
      tx.oncomplete = function () { resolve(result); };
      tx.onerror = function () { reject(tx.error || new Error('INDEXEDDB_TRANSACTION_FAILED')); };
      tx.onabort = function () { reject(tx.error || new Error('INDEXEDDB_TRANSACTION_ABORTED')); };
    });
  }

  function keyOf(userId, table, id) { return String(userId) + ':' + String(table) + ':' + String(id); }
  function uuid() {
    if (g.crypto && typeof g.crypto.randomUUID === 'function') return g.crypto.randomUUID();
    if (!g.crypto || typeof g.crypto.getRandomValues !== 'function') throw new Error('SECURE_UUID_UNAVAILABLE');
    const b = new Uint8Array(16); g.crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
  }
  function currentUserId() {
    try { return g.supabaseClient?.auth?.getSession; } catch (_) { return null; }
  }
  async function getUserId() {
    try {
      if (g.AdineAuth && typeof g.AdineAuth.getSession === 'function') {
        const session = await g.AdineAuth.getSession();
        if (session?.user?.id) return String(session.user.id);
      }
      const r = await g.supabaseClient.auth.getSession();
      return r && !r.error ? (r.data?.session?.user?.id || null) : null;
    } catch (_) { return null; }
  }
  async function withTimeout(promise, milliseconds, label) {
    let timer;
    try {
      return await Promise.race([
        Promise.resolve(promise),
        new Promise(function(_, reject) {
          timer = setTimeout(function() { reject(new Error((label || 'REQUEST') + '_TIMEOUT')); }, Math.max(1000, Number(milliseconds) || 8000));
        })
      ]);
    } catch (error) {
      // Match Supabase's {data,error} shape so callers can reliably fall back
      // to local IndexedDB when a network request stalls or rejects.
      return { data:null, error:error || new Error((label || 'REQUEST') + '_FAILED') };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function isNetworkFailure(error) {
    const m = String(error && (error.message || error.name) || error || '').toLowerCase();
    return !navigator.onLine || /failed to fetch|networkerror|network error|load failed|timeout|timed out|err_internet_disconnected|connection|offline|fetch failed/.test(m);
  }
  function showBanner(message, kind) {
    let el = document.getElementById('adineOfflineStatus');
    if (!el) {
      el = document.createElement('div');
      el.id = 'adineOfflineStatus';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.style.cssText = 'position:sticky;top:0;z-index:2147483000;padding:9px 12px;text-align:center;font:700 13px/1.7 system-ui,sans-serif;direction:rtl;box-shadow:0 2px 10px rgba(0,0,0,.12)';
      document.body.insertBefore(el, document.body.firstChild);
    }
    el.replaceChildren();
    const label = document.createElement('span');
    label.textContent = message;
    el.appendChild(label);
    el.style.background = kind === 'error' ? '#7f1d1d' : kind === 'pending' ? '#fff3cd' : '#e6f4ea';
    el.style.color = kind === 'error' ? '#fff' : '#1f3b2c';
    el.style.display = 'block';
    if (kind === 'pending') {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = navigator.onLine ? 'همگام‌سازی اکنون' : 'پس از اتصال همگام‌سازی کنید';
      button.disabled = !navigator.onLine;
      button.style.cssText = 'margin:4px 8px;padding:5px 10px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer';
      button.onclick = async function () {
        button.disabled = true; button.textContent = 'در حال همگام‌سازی…';
        try { await sync(true); } catch (e) { console.warn('[AdineOffline] manual sync:',e); }
        await updateStatus();
      };
      el.appendChild(button);
      const backup = document.createElement('button');
      backup.type = 'button';
      backup.textContent = 'دریافت نسخه پشتیبان';
      backup.style.cssText = button.style.cssText;
      backup.onclick = function () { exportPendingBackup().catch(function(e){ console.error(e); alert('تهیه نسخه پشتیبان انجام نشد.'); }); };
      el.appendChild(backup);
      const restore = document.createElement('button');
      restore.type = 'button';
      restore.textContent = 'بازیابی نسخه پشتیبان';
      restore.style.cssText = button.style.cssText;
      restore.onclick = function () {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'application/json,.json';
        input.onchange = async function () {
          if (!input.files || !input.files[0]) return;
          try {
            const count = await importPendingBackup(input.files[0]);
            alert('بازیابی انجام شد؛ ' + count + ' مورد به صف همگام‌سازی اضافه شد.');
            await updateStatus();
          } catch (e) {
            console.error('[AdineOffline] backup restore:', e);
            alert('بازیابی انجام نشد. فایل باید متعلق به همین حساب کاربری باشد و قالب پشتیبان معتبر داشته باشد.');
          }
        };
        input.click();
      };
      el.appendChild(restore);
    }
  }
  function hideBanner() {
    const el = document.getElementById('adineOfflineStatus');
    if (el) el.style.display = 'none';
  }
  async function saveProfile(profile) {
    if (!profile || !profile.id) throw new Error('PROFILE_REQUIRED');
    const minimalProfile = {
      id: String(profile.id),
      full_name: profile.full_name || '',
      email: profile.email || '',
      role: profile.role || '',
      status: profile.status || '',
      is_active: profile.is_active,
      access_status: profile.access_status || '',
      user_type: profile.user_type || profile.userType || ''
    };
    const row = { userId: String(profile.id), profile: minimalProfile, validatedAt: Date.now() };
    await transact('profiles', 'readwrite', s => s.put(row));
    if (navigator.onLine) prime().catch(e => console.warn('[AdineOffline] pre-cache skipped:', e));
    return true;
  }
  async function getCachedProfile(userId) {
    const db = await openDB();
    const row = await requestResult(db.transaction('profiles', 'readonly').objectStore('profiles').get(String(userId)));
    if (!row || !row.profile) return null;
    const age = Date.now() - Number(row.validatedAt || 0);
    if (!Number.isFinite(age) || age < 0 || age > MAX_OFFLINE_DAYS * 86400000) return { expired: true, profile: row.profile, validatedAt: row.validatedAt };
    return { expired: false, profile: row.profile, validatedAt: row.validatedAt };
  }
  async function getLastCachedProfile() {
    const db = await openDB();
    const rows = await requestResult(db.transaction('profiles', 'readonly').objectStore('profiles').getAll());
    if (!rows || !rows.length) return null;
    rows.sort((a,b) => Number(b.validatedAt || 0) - Number(a.validatedAt || 0));
    return getCachedProfile(rows[0].userId);
  }
  async function clearCachedProfile(userId) {
    if (!userId) return false;
    const db = await openDB();
    await new Promise(function(resolve,reject) {
      const tx = db.transaction('profiles','readwrite');
      tx.objectStore('profiles').delete(String(userId));
      tx.oncomplete = function(){resolve();};
      tx.onerror = function(){reject(tx.error || new Error('OFFLINE_PROFILE_CLEAR_FAILED'));};
    });
    return true;
  }
  async function cacheRows(table, rows, userId) {
    if (!ALLOWED_TABLES.has(table) || !Array.isArray(rows) || !userId) return false;
    const db = await openDB();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction('snapshots', 'readwrite');
      const store = tx.objectStore('snapshots');
      rows.forEach(function (row) {
        if (!row || row.id == null) return;
        store.put({ key: keyOf(userId, table, row.id), userId: String(userId), table: table, id: String(row.id), data: row, cachedAt: Date.now() });
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('SNAPSHOT_WRITE_FAILED'));
      tx.onabort = () => reject(tx.error || new Error('SNAPSHOT_WRITE_ABORTED'));
    });
  }
  async function getRows(table, userId) {
    if (!ALLOWED_TABLES.has(table) || !userId) return [];
    const db = await openDB();
    const [snapshots, local] = await Promise.all([
      requestResult(db.transaction('snapshots', 'readonly').objectStore('snapshots').index('byUserTable').getAll([String(userId), table])),
      requestResult(db.transaction('records', 'readonly').objectStore('records').index('byUserTable').getAll([String(userId), table]))
    ]);
    const merged = new Map();
    (snapshots || []).forEach(x => merged.set(String(x.id), x.data));
    (local || []).forEach(x => { if (x.data) merged.set(String(x.id), x.data); });
    return Array.from(merged.values());
  }
  async function getPendingForUser(userId) {
    const db = await openDB();
    const rows = await requestResult(db.transaction('queue', 'readonly').objectStore('queue').index('byUserCreated').getAll());
    return (rows || []).filter(x => String(x.userId) === String(userId)).sort((a,b) => a.createdAt - b.createdAt);
  }
  async function hasPendingParent(userId, table, payload) {
    const parentFields = table === 'houses' ? [['farms', 'farm_id']]
      : table === 'flocks' ? [['farms', 'farm_id'], ['houses', 'house_id']]
      : ['broiler_daily_monitoring','layer_daily_monitoring','weekly_records','layer_weekly_monitoring','layer_monthly_monitoring','farm_accounting_transactions','layer_accounting_transactions'].includes(table)
        ? [['farms','farm_id'],['houses','house_id'],['flocks','flock_id']] : [];
    const pending = await getPendingForUser(userId);
    for (const [parentTable, field] of parentFields) {
      const id = payload[field];
      if (!id) continue;
      if (pending.some(op => op.table === parentTable && String(op.payload.id) === String(id))) return true;
    }
    return false;
  }
  async function saveLocal(table, payload, options) {
    if (!ALLOWED_TABLES.has(table)) throw new Error('OFFLINE_TABLE_NOT_ALLOWED');
    const userId = String(options?.userId || await getUserId() || '');
    if (!userId) throw new Error('OFFLINE_AUTH_REQUIRED');
    const data = Object.assign({}, payload || {});
    if (!data.id) data.id = uuid();
    if (data.owner_id && String(data.owner_id) !== userId) throw new Error('OFFLINE_OWNER_MISMATCH');
    if (!data.owner_id && ['farms','houses','flocks','broiler_daily_monitoring','layer_daily_monitoring','weekly_records','layer_weekly_monitoring','layer_monthly_monitoring','farm_accounting_transactions','layer_accounting_transactions'].includes(table)) data.owner_id = userId;
    const key = keyOf(userId, table, data.id);
    const now = Date.now();
    const op = { opId: uuid(), userId: userId, table: table, action: 'insert', payload: data, createdAt: now, status: 'pending', attempts: 0, lastError: null };
    const db = await openDB();
    try {
      await new Promise(function (resolve, reject) {
        const tx = db.transaction(['records','queue'], 'readwrite');
        tx.objectStore('records').put({ key:key, userId:userId, table:table, id:String(data.id), data:data, syncStatus:'pending', updatedAt:now });
        tx.objectStore('queue').put(op);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('OFFLINE_SAVE_FAILED'));
        tx.onabort = () => reject(tx.error || new Error('OFFLINE_SAVE_ABORTED'));
      });
    } catch (storageError) {
      console.error('[AdineOffline] local write failed:', storageError);
      showBanner('ذخیره روی دستگاه انجام نشد؛ فرم را نبندید و از اطلاعات واردشده نسخه‌ای تهیه کنید. خطا: ' + String(storageError?.name || storageError?.message || 'فضای ذخیره‌سازی'), 'error');
      throw storageError;
    }
    try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch (_) {}
    updateStatus();
    if (navigator.onLine) sync().catch(e => console.warn('[AdineOffline] sync after save:', e));
    return { data:data, error:null, offline:true, pending:true, opId:op.opId };
  }
  async function prime(force) {
    if (!navigator.onLine || !g.supabaseClient?.from) return { skipped:true };
    if (primePromise) return primePromise;
    if (!force && Date.now() - lastPrimeAt < 10 * 60 * 1000) return { skipped:true, reason:'RECENTLY_PRIMED' };
    primePromise = (async function () {
      const userId = await getUserId();
      if (!userId) return { skipped:true, reason:'NO_SESSION' };
      const client = g.supabaseClient;
      const queries = await Promise.all([
        withTimeout(client.from('farms').select('*').order('created_at',{ascending:false}).limit(1000),8000,'PRIME_FARMS'),
        withTimeout(client.from('houses').select('*').order('created_at',{ascending:false}).limit(1000),8000,'PRIME_HOUSES'),
        withTimeout(client.from('flocks').select('*').order('created_at',{ascending:false}).limit(1000),8000,'PRIME_FLOCKS')
      ]);
      const tables = ['farms','houses','flocks'];
      let count = 0;
      for (let i=0;i<queries.length;i++) {
        const result = queries[i];
        if (!result.error && Array.isArray(result.data)) {
          await cacheRows(tables[i], result.data, userId);
          count += result.data.length;
        } else if (result.error) {
          console.warn('[AdineOffline] pre-cache table skipped:', tables[i], result.error.message);
        }
      }
      // Pre-cache the active flock's recent history so cumulative values can be
      // calculated from known data when the user goes offline.
      try {
        const selection = JSON.parse(localStorage.getItem('adine_poultry_current_selection') || '{}');
        const flockId = selection.flockId || selection.flock_id;
        const flock = (queries[2].data || []).find(x => String(x.id) === String(flockId));
        if (flockId && flock) {
          const type = String(flock.production_type || '').toLowerCase();
          const layer = type.includes('layer') || type.includes('تخم');
          const dailyTable = layer ? 'layer_daily_monitoring' : 'broiler_daily_monitoring';
          const daily = await withTimeout(client.from(dailyTable).select('*').eq('flock_id', flockId).order('record_date',{ascending:false}).limit(1000),8000,'PRIME_DAILY');
          if (!daily.error && Array.isArray(daily.data)) { await cacheRows(dailyTable, daily.data, userId); count += daily.data.length; }
          const weekly = await withTimeout(client.from('weekly_records').select('*').eq('flock_id', flockId).order('week_number',{ascending:true}).limit(300),8000,'PRIME_WEEKLY');
          if (!weekly.error && Array.isArray(weekly.data)) { await cacheRows('weekly_records', weekly.data, userId); count += weekly.data.length; }
        }
        const selectedFarmId = selection.farmId || selection.farm_id || (flock && flock.farm_id) || localStorage.getItem('adine_accounting_farm');
        if (selectedFarmId) {
          const transactions = await withTimeout(client.from('farm_accounting_transactions').select('*').eq('farm_id', selectedFarmId).order('event_date',{ascending:false}).limit(1000),8000,'PRIME_ACCOUNTING');
          if (!transactions.error && Array.isArray(transactions.data)) { await cacheRows('farm_accounting_transactions', transactions.data, userId); count += transactions.data.length; }
        }
      } catch (e) { console.warn('[AdineOffline] active flock history pre-cache skipped:', e); }
      lastPrimeAt = Date.now();
      return { cached:count };
    })().finally(function () { primePromise = null; });
    return primePromise;
  }
  async function isPendingRecord(table, id, userId) {
    const uid = String(userId || await getUserId() || '');
    if (!uid || !id) return false;
    const queue = await getPendingForUser(uid);
    return queue.some(op => op.table === table && String(op.payload?.id) === String(id));
  }
  async function updatePending(table, payload, userId) {
    if (!ALLOWED_TABLES.has(table) || !payload?.id) throw new Error('PENDING_RECORD_REQUIRED');
    const uid = String(userId || await getUserId() || '');
    if (!uid) throw new Error('OFFLINE_AUTH_REQUIRED');
    const queue = await getPendingForUser(uid);
    const op = queue.find(x => x.table === table && String(x.payload?.id) === String(payload.id));
    if (!op) return false;
    const key = keyOf(uid, table, payload.id), now = Date.now();
    op.payload = Object.assign({}, payload);
    op.lastError = null; op.status = 'pending';
    const db = await openDB();
    await new Promise(function(resolve,reject){
      const tx = db.transaction(['records','queue'],'readwrite');
      tx.objectStore('records').put({key:key,userId:uid,table:table,id:String(payload.id),data:payload,syncStatus:'pending',updatedAt:now});
      tx.objectStore('queue').put(op);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('OFFLINE_UPDATE_FAILED'));
      tx.onabort=()=>reject(tx.error||new Error('OFFLINE_UPDATE_ABORTED'));
    });
    updateStatus();
    return true;
  }
  async function cacheSyncedRecord(userId, table, payload) {
    const db = await openDB(), key = keyOf(userId, table, payload.id);
    await new Promise(function (resolve, reject) {
      const tx = db.transaction(['snapshots','records'], 'readwrite');
      tx.objectStore('snapshots').put({ key:key, userId:userId, table:table, id:String(payload.id), data:payload, cachedAt:Date.now() });
      tx.objectStore('records').delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('LOCAL_SYNC_COMMIT_FAILED'));
      tx.onabort = () => reject(tx.error || new Error('LOCAL_SYNC_COMMIT_ABORTED'));
    });
  }
  async function exportPendingBackup() {
    const userId = await getUserId();
    if (!userId) throw new Error('AUTH_REQUIRED');
    const operations = await getPendingForUser(userId);
    if (!operations.length) { alert('موردی در انتظار همگام‌سازی نیست.'); return false; }
    const backupData = { format:'adine-offline-backup-v1', userId:userId, exportedAt:new Date().toISOString(), operations:operations };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adine-offline-backup-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
    alert('این فایل شامل اطلاعات ثبت‌نشده فارم و/یا مالی است؛ آن را در جای امن نگهداری کنید.');
    return true;
  }
  async function importPendingBackup(file) {
    if (!file) throw new Error('BACKUP_FILE_REQUIRED');
    const userId = await getUserId();
    if (!userId) throw new Error('AUTH_REQUIRED');
    const backupData = JSON.parse(await file.text());
    if (backupData?.format !== 'adine-offline-backup-v1' || String(backupData.userId) !== String(userId) || !Array.isArray(backupData.operations)) throw new Error('BACKUP_FORMAT_OR_USER_MISMATCH');
    const valid = backupData.operations.filter(function(op) {
      return op && ALLOWED_TABLES.has(op.table) && op.action === 'insert' && op.payload && op.payload.id && String(op.payload.owner_id || '') === String(userId);
    });
    if (!valid.length) throw new Error('NO_VALID_OPERATIONS');
    const db = await openDB();
    await new Promise(function(resolve,reject) {
      const tx = db.transaction(['records','queue'],'readwrite');
      valid.forEach(function(op) {
        const id = String(op.payload.id), key = keyOf(userId, op.table, id), now = Date.now();
        const payload = Object.assign({}, op.payload);
        tx.objectStore('records').put({key:key,userId:userId,table:op.table,id:id,data:payload,syncStatus:'pending',updatedAt:now});
        tx.objectStore('queue').put({opId:String(op.opId || uuid()),userId:userId,table:op.table,action:'insert',payload:payload,createdAt:Number(op.createdAt)||now,status:'pending',attempts:0,lastError:null});
      });
      tx.oncomplete = function(){resolve();};
      tx.onerror = function(){reject(tx.error || new Error('BACKUP_IMPORT_FAILED'));};
      tx.onabort = function(){reject(tx.error || new Error('BACKUP_IMPORT_ABORTED'));};
    });
    await updateStatus();
    return valid.length;
  }
  async function sync(forceRetry) {
    if (syncPromise) return syncPromise;
    if (!navigator.onLine || !g.supabaseClient?.auth) return { synced:0, pending:0, skipped:true };
    syncPromise = (async function () {
      const userId = await getUserId();
      if (!userId) return { synced:0, pending:0, skipped:true, reason:'NO_SESSION' };
      const auth = g.supabaseClient;
      let profile;
      try {
        const r = await withTimeout(auth.from('profiles').select('id,role,status,is_active').eq('id', userId).maybeSingle(),8000,'SYNC_PROFILE');
        if (r.error || !r.data) return { synced:0, pending:0, skipped:true, reason:'PROFILE_UNVERIFIED' };
        profile = r.data;
      } catch (_) { return { synced:0, pending:0, skipped:true, reason:'PROFILE_UNVERIFIED' }; }
      const status = String(profile.status || '').toLowerCase();
      if (['blocked','suspended','removed','pending'].includes(status) || profile.is_active === false) {
        showBanner('همگام‌سازی متوقف شد؛ وضعیت حساب باید توسط پشتیبانی بررسی شود.', 'error');
        return { synced:0, pending:0, skipped:true, reason:'ACCOUNT_NOT_ACTIVE' };
      }
      const queue = await getPendingForUser(userId);
      const dependencyRank = table => table === 'farms' ? 0 : table === 'houses' ? 1 : table === 'flocks' ? 2 : 3;
      queue.sort((a,b) => dependencyRank(a.table) - dependencyRank(b.table) || a.createdAt - b.createdAt);
      let synced = 0;
      for (const op of queue) {
        if (!navigator.onLine) break;
        if (op.status === 'error' && !forceRetry) continue;
        if (await hasPendingParent(userId, op.table, op.payload)) continue;
        try {
          const result = await withTimeout(auth.from(op.table).upsert(op.payload, { onConflict:'id', ignoreDuplicates:true }),8000,'SYNC_WRITE');
          if (result.error) {
            op.attempts = Number(op.attempts || 0) + 1;
            op.lastError = String(result.error.message || 'SERVER_REJECTED');
            const networkFailure = isNetworkFailure(result.error);
            op.status = networkFailure ? 'pending' : 'error';
            await transact('queue','readwrite',s=>s.put(op));
            console.warn('[AdineOffline] record not synchronized; kept locally', op.table, op.opId, op.lastError);
            if (networkFailure) break;
            continue;
          }
          await cacheSyncedRecord(userId, op.table, op.payload);
          await transact('queue','readwrite',s=>s.delete(op.opId));
          synced++;
        } catch (e) {
          op.attempts = Number(op.attempts || 0) + 1;
          op.lastError = String(e?.message || e || 'NETWORK_ERROR');
          op.status = 'pending';
          await transact('queue','readwrite',s=>s.put(op));
          break;
        }
      }
      const remaining = (await getPendingForUser(userId)).length;
      if (remaining) showBanner('اطلاعات روی دستگاه محفوظ است؛ ' + remaining + ' مورد در انتظار همگام‌سازی یا بررسی است.', 'pending');
      else if (synced) showBanner('همگام‌سازی انجام شد؛ اطلاعات ثبت‌شده به سرور ارسال شد.', 'ok');
      return { synced:synced, pending:remaining };
    })().finally(function () { syncPromise = null; });
    return syncPromise;
  }
  async function updateStatus() {
    try {
      const id = await getUserId();
      if (!id) return;
      const pendingRows = await getPendingForUser(id);
      const n = pendingRows.length;
      const errors = pendingRows.filter(row => row.status === 'error').length;
      const detail = errors ? '؛ ' + errors + ' مورد نیازمند بررسی یا اصلاح است' : '';
      let durabilityNote = '';
      try {
        if (n && navigator.storage?.persisted && !(await navigator.storage.persisted())) durabilityNote = '؛ برای کاهش خطر حذف داده‌ها، نسخه پشتیبان بگیرید';
      } catch (_) {}
      if (!navigator.onLine) showBanner(n ? 'بدون اینترنت؛ ' + n + ' مورد روی این دستگاه ذخیره شده و منتظر همگام‌سازی است' + detail + durabilityNote + '.' : 'بدون اینترنت؛ فقط اطلاعات قبلاً ذخیره‌شده در دسترس است.', n ? 'pending' : 'ok');
      else if (n) showBanner(n + ' مورد در انتظار همگام‌سازی است' + detail + durabilityNote + '.', 'pending');
      else hideBanner();
    } catch (e) { console.warn('[AdineOffline] status:', e); }
  }
  async function registerSW() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return false;
    try {
      const r = await navigator.serviceWorker.register('/sw.js', { scope:'/' });
      if (r.update) r.update().catch(()=>{});
      return true;
    } catch (e) { console.warn('[AdineOffline] Service Worker registration failed:', e); return false; }
  }
  async function init() {
    registerSW();
    try { await openDB(); } catch (e) { console.warn('[AdineOffline] Local storage unavailable:', e); }
    try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch (_) {}
    if (navigator.onLine) prime().catch(e => console.warn('[AdineOffline] initial pre-cache skipped:', e));
    window.addEventListener('online', function () { sync().then(updateStatus).catch(()=>updateStatus()); });
    window.addEventListener('offline', updateStatus);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && navigator.onLine) sync().then(updateStatus).catch(()=>updateStatus()); });
    window.addEventListener('pageshow', function () { updateStatus(); if (navigator.onLine) sync().catch(()=>{}); });
    updateStatus();
  }

  g.AdineOffline = {
    version: 1, maxOfflineDays: MAX_OFFLINE_DAYS, prime:prime,
    init:init, registerSW:registerSW, saveProfile:saveProfile, getCachedProfile:getCachedProfile, getLastCachedProfile:getLastCachedProfile, clearCachedProfile:clearCachedProfile,
    cacheRows:cacheRows, getRows:getRows, saveLocal:saveLocal, updatePending:updatePending, isPendingRecord:isPendingRecord, sync:sync, updateStatus:updateStatus, exportPendingBackup:exportPendingBackup, importPendingBackup:importPendingBackup,
    isNetworkFailure:isNetworkFailure, withTimeout:withTimeout, isAllowedTable:table=>ALLOWED_TABLES.has(table), showBanner:showBanner, hideBanner:hideBanner,
    getPending:async function(){const id=await getUserId();return id?getPendingForUser(id):[];},
    uuid:uuid
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})(window);
