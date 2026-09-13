const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'reports.html'), 'utf8');
const adapter = fs.readFileSync(path.join(root, 'broiler-performance-intelligence-adapter-v1.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'broiler-performance-intelligence-adapter-v1.css'), 'utf8');
const engine = fs.readFileSync(path.join(root, 'broiler-performance-intelligence-v1.js'), 'utf8');

assert(html.includes('broiler-performance-intelligence-v1.js?v=20260913.1'));
assert(html.includes('broiler-performance-intelligence-adapter-v1.js?v=20260913.1'));
assert(html.includes('broiler-performance-intelligence-adapter-v1.css?v=20260913.1'));
assert(adapter.includes("data-tab') === 'overall"));
assert(adapter.includes("ctx.model.type !== 'broiler'"));
assert(adapter.includes('AdineBroilerPerformanceIntelligence'));
assert(adapter.includes('healthPerformanceAssociation'));
assert(adapter.includes('marketOptimization'));
assert(!adapter.includes('.from('));
assert(!adapter.includes('update('));
assert(!adapter.includes('insert('));
assert(!adapter.includes('upsert('));
assert(!adapter.includes('delete('));
assert(engine.includes('const API = { version: "BROILER-PI-V1"'));
assert(engine.includes('global.AdineBroilerPerformanceIntelligence = API'));
assert(css.includes('.broiler-performance-intelligence-v1'));

console.log('Broiler Performance Intelligence adapter isolation regression: PASS');
