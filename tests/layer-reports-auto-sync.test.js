/* Run with: node tests/layer-reports-auto-sync.test.js */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'layer-reports.html'), 'utf8');
const scriptTags = [...html.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi)];
const inlineScripts = scriptTags.filter(m => !/\\bsrc\\s*=/.test(m[1])).map(m => m[2]);

assert.ok(html.includes('src="layer-calculation-engine-v1.js"'), 'reports load the canonical layer calculation engine');
assert.ok(html.includes('src="layer-period-engine-v1.js"'), 'reports load the canonical layer period engine');
assert.ok(html.indexOf('layer-calculation-engine-v1.js') < html.indexOf('layer-daily-standards-v1.js'));
assert.ok(html.indexOf('layer-daily-standards-v1.js') < html.indexOf('layer-period-engine-v1.js'));

for (const table of ['layer_daily_monitoring', 'layer_weekly_monitoring', 'layer_monthly_monitoring']) {
  assert.ok(html.includes(table), 'reports read persisted table: ' + table);
}
const syncAt = html.indexOf('window.ADINE_LAYER_PERIOD_ENGINE_V1.sync(flock,reportUser,supabaseClient,daily)');
const weeklyReadAt = html.indexOf("supabaseClient.from('layer_weekly_monitoring').select('*')");
const monthlyReadAt = html.indexOf("supabaseClient.from('layer_monthly_monitoring').select('*')");
assert.ok(syncAt >= 0, 'report boot rebuilds weekly/monthly summaries from saved daily records');
assert.ok(syncAt < weeklyReadAt && syncAt < monthlyReadAt, 'reports read period tables after automatic sync');

assert.ok(html.includes('data-nav="layer-weekly-core.html"'), 'weekly navigation remains within the layer module');
assert.ok(html.includes('data-nav="layer-reports.html"'), 'report navigation remains within the layer module');
assert.doesNotMatch(html, /Broiler|گوشتی/i, 'report page contains no broiler references');
assert.doesNotMatch(html, /(?:href|data-nav)=["'](?:reports|weekly|daily-core)\\.html/i, 'report page contains no generic broiler route');
assert.ok(!html.includes("location.href='reports.html'"), 'non-layer flock does not redirect into the generic report route');

for (const [i, script] of inlineScripts.entries()) {
  // Parse each inline script without executing it or contacting Supabase.
  try { new Function(script); }
  catch (error) { throw new Error('Inline report script #' + i + ' has a syntax error: ' + error.message); }
}
console.log('Layer reports auto-sync and isolation tests passed.');
