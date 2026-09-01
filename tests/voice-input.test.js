const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function makeElement(tag) {
  const el = {
    tagName: tag.toUpperCase(), nodeType: 1, dataset: {}, classList: { contains: () => false },
    disabled: false, readOnly: false, hidden: false, id: '', name: '', value: '', parentElement: null,
    getAttribute(name) { return name === 'type' ? 'text' : name === 'inputmode' ? '' : null; },
    hasAttribute() { return false; }, closest() { return null; }, dispatchEvent() {},
    appendChild(child) { child.parentElement = this; }, insertBefore(child) { child.parentElement = this; },
    setAttribute() {}, addEventListener(type, fn) { this[`on_${type}`] = fn; },
    querySelectorAll() { return []; }, textContent: '', style: {}, innerHTML: ''
  };
  return el;
}

let lastButton = null;
const body = makeElement('body');
const document = {
  readyState: 'complete', documentElement: { dataset: {} }, head: { appendChild() {} }, body,
  getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
  addEventListener() {},
  createElement(tag) { const e = makeElement(tag); if (tag === 'button') lastButton = e; return e; }
};
class MutationObserver { constructor() {} observe() {} disconnect() {} }
class MockRecognition {
  constructor() { MockRecognition.instance = this; }
  start() { this.started = true; }
  stop() { this.stopped = true; if (this.onend) this.onend(); }
  abort() { this.aborted = true; }
}

const context = {
  window: { SpeechRecognition: MockRecognition, addEventListener() {} }, document, MutationObserver,
  console, Event: function () {}, CSS: { escape: x => x }
};
context.window.window = context.window;
context.window.document = document;
context.window.MutationObserver = MutationObserver;
context.window.CSS = context.CSS;

vm.runInNewContext(fs.readFileSync('voice-input.js', 'utf8'), context, { filename: 'voice-input.js' });
const api = context.window.AdineVoiceInput;
assert(api && api.version === '1.0.1');

const normalizationCases = [
  ['1234', '۱۲۳۴'],
  ['٣٤٥', '۳۴۵'],
  ['سه درصد', '۳ درصد'],
  ['سه هزار و پانصد قطعه', '۳۵۰۰ قطعه'],
  ['دو میلیون و سیصد هزار قطعه', '۲۳۰۰۰۰۰ قطعه'],
  ['مایکو پلازما و کیسه های هوایی', 'مایکوپلاسما و کیسه‌های هوایی'],
  ['پی سی آر و ال ای زا', 'PCR و ELISA'],
  ['اف سی آر و سی وی', 'FCR و CV']
];
for (const [input, expected] of normalizationCases) {
  assert.strictEqual(api.normalize(input), expected, `${input} => ${api.normalize(input)}`);
}

const parent = makeElement('div');
const field = makeElement('textarea');
field.parentElement = parent;
api.attach(field);
assert.strictEqual(field.dataset.adineVoiceAttached, '1');
assert(lastButton && typeof lastButton.on_click === 'function');
lastButton.on_click();
const recognition = MockRecognition.instance;
assert.strictEqual(recognition.lang, 'fa-IR');
assert.strictEqual(recognition.continuous, true);
assert.strictEqual(recognition.interimResults, true);
recognition.onresult({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: 'سه هزار قطعه' } }] });
assert.strictEqual(field.value, '۳۰۰۰ قطعه');
recognition.onresult({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: ' درگیری تنفسی' } }] });
assert(field.value.includes('درگیری تنفسی'));
lastButton.on_click();
assert.strictEqual(recognition.stopped, true);

const numeric = makeElement('input');
numeric.getAttribute = name => name === 'type' ? 'text' : name === 'inputmode' ? 'decimal' : null;
numeric.parentElement = parent;
api.attach(numeric);
assert.notStrictEqual(numeric.dataset.adineVoiceAttached, '1');

const code = makeElement('input');
code.id = 'farmCode';
code.parentElement = parent;
api.attach(code);
assert.notStrictEqual(code.dataset.adineVoiceAttached, '1');

console.log(`voice-input tests passed: ${normalizationCases.length + 5}`);
