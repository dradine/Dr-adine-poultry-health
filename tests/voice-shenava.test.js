const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('voice-shenava.js', 'utf8');
const listeners = {};
const document = {
  readyState: 'loading',
  addEventListener(name, fn) { listeners[name] = fn; },
  getElementById() { return null; },
  createElement() { return { setAttribute(){}, appendChild(){}, addEventListener(){}, style:{}, dataset:{}, className:'', textContent:'' }; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  head: { appendChild() {} },
  documentElement: { appendChild() {}, },
};
const sandbox = {
  window: {},
  document,
  navigator: { mediaDevices: null },
  MutationObserver: class { observe(){} disconnect(){} },
  Event: class { constructor(type, opts){ this.type=type; Object.assign(this, opts||{}); } },
  console,
  setTimeout,
  clearTimeout,
  BigInt64Array,
  Float32Array,
  Float64Array,
  Float16Array: global.Float16Array,
};
sandbox.window = sandbox;
vm.runInNewContext(source, sandbox, { filename: 'voice-shenava.js' });
const api = sandbox.window.AdineVoiceInput;
assert(api && api.ready === true);
assert.strictEqual(api.engine, 'Shenava-Rizeh-v1.0-ONNX-fp16');

const cases = [
  ['۱۲۳۴', '۱۲۳۴'],
  ['سه هزار و پانصد قطعه', '۳۵۰۰ قطعه'],
  ['دو میلیون و سیصد هزار', '۲۳۰۰۰۰۰'],
  ['مایکو پلازما و کیسه های هوایی', 'مایکوپلاسما و کیسه‌های هوایی'],
  ['اف سی آر و سی وی', 'FCR و CV'],
  ['پی سی آر و ال ای زا', 'PCR و ELISA'],
  ['کیو پی سی آر و آر تی پی سی آر', 'qPCR و RT-PCR'],
  ['مرغ مادر و مرغ تخم گذار و جوجه گوشتی و پولت', 'مرغ مادر و مرغ تخم‌گذار و جوجه گوشتی و پولت'],
  ['آنتی بیوگرام، تیتر آنتی بادی و بورس فابریسیوس', 'آنتی‌بیوگرام، تیتر آنتی‌بادی و بورس فابریسیوس'],
  ['تولید تخم، درصد تولید، وزن تخم و قابلیت جوجه در آوری', 'تولید تخم، درصد تولید، وزن تخم و قابلیت جوجه‌درآوری'],
];
for (const [input, expected] of cases) {
  assert.strictEqual(api.normalize(input), expected, `normalize failed: ${input}`);
}

assert.strictEqual(api.local, true);
assert.strictEqual(typeof api.preload, 'function');
assert.strictEqual(api.supported(), false);

console.log(`Shenava local voice regression: PASS (${cases.length + 5} assertions)`);
