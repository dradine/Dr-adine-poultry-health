/* Run with: node tests/layer-reports-auto-sync.test.js */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'layer-reports.html'), 'utf8');
const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const inlineScripts = scriptTags.filter(m => !/\bsrc\s*=/.test(m[1])).map(m => m[2]);

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
assert.ok(html.includes('class="bottom-nav"'), 'reports use the same application bottom-nav component');
assert.ok(html.includes('href="app.css?v=20260925.11"'), 'reports use the shared application stylesheet');
assert.ok(html.includes('dashboard-icon-fix.js?v=20261006.2'), 'reports use the approved dashboard icon renderer');
assert.ok(html.includes('poultry-icons.js?v=20260925.16'), 'shared app icons remain available for non-navigation controls');
assert.ok(html.indexOf('dashboard-icon-fix.js?v=20261006.2') < html.indexOf('poultry-icons.js?v=20260925.16'), 'approved dashboard sprite runs before generic icon enhancement');
assert.ok(html.includes('src="IMG_4309.png"'), 'reports use the shared clinic logo');
assert.ok(!html.includes('class="bottom-navigation"'), 'reports do not define a duplicate custom navigation');
assert.ok(html.includes('data-nav="layer-weekly-core.html"'), 'weekly navigation stays on the dedicated layer page');
for (const view of ['overview','daily','weekly','monthly','trend']) {
  assert.ok(html.includes('id="view-' + view + '"'), 'dedicated report view exists: ' + view);
}
assert.ok(html.includes('id="flockSelect"'), 'page allows selecting a layer flock instead of showing a blank page');
assert.ok(html.includes('id="productionChart"'), 'page contains a production trend chart');
assert.ok(html.includes('weeklyNav.setAttribute(\'data-nav\',\'layer-weekly-core.html?flock_id=\''), 'weekly navigation preserves the selected layer flock');

assert.doesNotMatch(html, /Broiler|گوشتی/i, 'report page contains no broiler references');
assert.doesNotMatch(html, /(?:href|data-nav)=["'](?:reports|weekly|daily-core)\.html/i, 'report page contains no generic broiler route');
assert.ok(!html.includes("location.href='reports.html'"), 'non-layer flock does not redirect into the generic report route');

for (const [i, script] of inlineScripts.entries()) {
  // Parse each inline script without executing it or contacting Supabase.
  try { new Function(script); }
  catch (error) { throw new Error('Inline report script #' + i + ' has a syntax error: ' + error.message); }
}
console.log('Layer reports auto-sync and isolation tests passed.');
