import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const core = read('offline-core.js');
const sw = read('sw.js');
const auth = read('auth.js');
const requiredPages = ['login.html','Dashboard.html','Farms.html','flocks.html','daily-core.html','layer-daily-core.html','weekly.html','weekly-core.html','accounting-v14.html'];
for (const page of requiredPages) assert.match(read(page), /offline-core\.js/, page + ' must load offline core');
for (const token of ['indexedDB.open','saveLocal','updatePending','isPendingRecord','exportPendingBackup','importPendingBackup','onConflict:\'id\'','ignoreDuplicates:true','MAX_OFFLINE_DAYS']) assert.ok(core.includes(token), 'offline core missing ' + token);
for (const token of ['broiler_daily_monitoring','layer_daily_monitoring','weekly_records','farm_accounting_transactions','farms','houses','flocks']) assert.ok(core.includes(token), 'offline table allowlist missing ' + token);
assert.ok(sw.includes("url.hostname.includes('supabase.co')"), 'service worker must not cache Supabase API');
assert.ok(sw.includes("'/offline.html'"), 'offline fallback page must be precached');
assert.ok(auth.includes('getCachedProfile'), 'auth fallback must use the bounded cached profile');
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
