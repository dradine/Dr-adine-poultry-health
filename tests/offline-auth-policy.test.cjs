const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const document = {
  querySelector: () => null,
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, classList: { contains: () => false } }),
  head: { appendChild() {} },
  documentElement: { appendChild() {} },
  getElementById: () => null,
  body: { classList: { contains: () => false } }
};
const window = {};
const navigator = { onLine: true };
vm.runInNewContext(fs.readFileSync('auth.js', 'utf8'), {
  window, document, navigator,
  console: { warn() {}, error() {}, log() {} },
  CustomEvent: function CustomEvent() {}
});

const isActive = window.AdineAuth.isActiveProfile;
const cases = [
  ['active profile with active flag', { status: 'active', is_active: true, role: 'farm_manager' }, true],
  ['legacy active profile without active flag', { status: 'active', role: 'farm_manager' }, true],
  ['explicit boolean inactive flag', { status: 'active', is_active: false, role: 'farm_manager' }, false],
  ['explicit string inactive flag', { status: 'active', is_active: 'false', role: 'farm_manager' }, false],
  ['numeric inactive flag', { status: 'active', is_active: 0, role: 'farm_manager' }, false],
  ['suspended profile', { status: 'suspended', is_active: true, role: 'farm_manager' }, false],
  ['pending profile', { status: 'pending', is_active: true, role: 'farm_manager' }, false],
  ['removed profile', { status: 'removed', is_active: true, role: 'farm_manager' }, false],
  ['unknown status fails closed for regular user', { status: '', is_active: true, role: 'farm_manager' }, false],
  ['inactive owner must not bypass flag', { status: 'active', is_active: false, role: 'owner' }, false],
  ['active owner profile', { status: 'active', is_active: true, role: 'owner' }, true]
];

for (const [name, profile, expected] of cases) {
  assert.equal(isActive(profile), expected, name);
  console.log('PASS ' + name);
}
console.log('Offline auth policy tests passed: ' + cases.length + ' cases.');
