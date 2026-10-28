import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const core = read('offline-core.js');
const sw = read('sw.js');
const auth = read('auth.js');
const requiredPages = ['login.html','Dashboard.html','Farms.html','flocks.html','daily-core.html','layer-daily-core.html','daily-router.html','weekly-router.html','weekly.html','weekly-core.html','accounting-v14.html'];
for (const page of requiredPages) assert.match(read(page), /offline-core\.js/, page + ' must load offline core');
for (const token of ['indexedDB.open','saveLocal','updatePending','isPendingRecord','exportPendingBackup','importPendingBackup','getLastCachedProfile','clearAllCachedProfiles','withTimeout','onConflict:\'id\'','ignoreDuplicates:true','MAX_OFFLINE_DAYS']) assert.ok(core.includes(token), 'offline core missing ' + token);
assert.ok(core.includes("select('id,role,status,is_active,access_status')"), 'sync must fetch access_status before authorization');
assert.ok(core.includes("deniedAccessStatus = ['blocked','suspended','removed','pending','rejected','inactive','disabled','revoked','denied']"), 'sync must reject revoked/denied access states');
assert.ok(auth.includes('access_status,approved_at'), 'shared auth must fetch access_status from the profile row');
for (const token of ['broiler_daily_monitoring','layer_daily_monitoring','weekly_records','farm_accounting_transactions','farms','houses','flocks']) assert.ok(core.includes(token), 'offline table allowlist missing ' + token);
assert.ok(sw.includes("url.hostname.includes('supabase.co')"), 'service worker must not cache Supabase API');
assert.ok(sw.includes("'/offline.html'"), 'offline fallback page must be precached');
assert.ok(sw.includes("'/Dashboard.html'"), 'dashboard must be included in offline shell cache');
for (const path of ["'/daily-router.html'","'/weekly-router.html'","'/layer-weekly-core.html'","'/layer-monthly-core.html'"]) {
  assert.ok(sw.includes(path), path + ' must be included in offline shell cache');
}
for (const file of ['daily-router.html','weekly-router.html']) {
  const router = read(file);
  assert.ok(router.includes("offline-core.js"), file + ' must load offline cache before auth routing');
  assert.ok(router.includes("AdineOffline.getRows('flocks'"), file + ' must resolve flock type from authorized offline snapshots');
  assert.ok(router.includes('routeUnavailable()'), file + ' must not silently route unknown flock type to broiler engine');
}
assert.ok(auth.includes('getCachedProfile'), 'auth fallback must use the bounded cached profile');
assert.ok(auth.includes('getOfflineSession'), 'expired/missing online session must be handled through a bounded offline grant');
assert.ok(!auth.includes('if(navigator.onLine!==false||!window.AdineOffline?.getLastCachedProfile)return null;'), 'cached offline grant must also be considered when the network is online but Supabase is unreachable');
assert.ok(auth.includes('clearAllCachedProfiles'), 'sign-out must clear offline grants');
assert.ok(auth.includes('p.is_active===false'), 'explicitly inactive profiles must not receive offline access');
assert.ok(core.includes('opts.complete === true'), 'snapshot reconciliation must require an explicitly complete result');
assert.ok(core.includes('matchesScope(saved.data)'), 'snapshot reconciliation must be limited to the requested data scope');
assert.ok(core.includes('store.delete(saved.key)'), 'complete snapshots must remove stale rows from the local snapshot cache');
assert.ok(core.includes('pruneSnapshotsByParent'), 'complete parent snapshots must prune stale child snapshots when access lists change');
assert.ok(core.includes('allowedFlocks'), 'flock child-cache pruning must use the authoritative complete flock list');
assert.ok(read('login.js').includes('offlineResumeButton'), 'login must expose offline resume for eligible accounts');
assert.ok(!/service_role/i.test(core), 'service role credentials must never appear in offline core');
for (const [file, token] of [
  ['Farms.js','saveLocal("farms"'],
  ['flocks.js','saveLocal("houses"'],
  ['flocks.js','saveLocal("flocks"'],
  ['broiler-daily-monitoring-v1.js',"saveLocal('broiler_daily_monitoring'"],
  ['layer-daily-monitoring-v1.js',"saveLocal('layer_daily_monitoring'"],
  ['weekly.js','saveLocal("weekly_records"'],
  ['accounting-v14.js',"saveLocal('farm_accounting_transactions'"]
]) assert.ok(read(file).includes(token), file + ' missing offline integration ' + token);
console.log('Offline static contract checks passed.');
