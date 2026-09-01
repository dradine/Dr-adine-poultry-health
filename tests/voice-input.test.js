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
    querySelectorAll() { return []; }, textContent: '', style: {}, innerHTML: '', matches() { return false; }
  };
  return el;
}
let lastButton = null;
const body = makeElement('body');
const document = { readyState:'complete', documentElement:{dataset:{}}, head:{appendChild(){}}, body,
  getElementById(){return null;}, querySelector(){return null;}, querySelectorAll(){return [];}, addEventListener(){},
  createElement(tag){const e=makeElement(tag);if(tag==='button')lastButton=e;return e;}
};
class MutationObserver { constructor(){} observe(){} disconnect(){} }
class MockRecognition { constructor(){MockRecognition.instance=this;this.startCalls=0;} start(){this.started=true;this.startCalls++;} stop(){this.stopped=true;if(this.onend)this.onend();} abort(){this.aborted=true;} }
const context={window:{SpeechRecognition:MockRecognition,addEventListener(){}},document,MutationObserver,console,Event:function(){},CSS:{escape:x=>x},setTimeout,clearTimeout};
context.window.window=context.window;context.window.document=document;context.window.MutationObserver=MutationObserver;context.window.CSS=context.CSS;
vm.runInNewContext(fs.readFileSync('voice-input.js','utf8'),context,{filename:'voice-input.js'});
const api=context.window.AdineVoiceInput;
assert(api&&api.version==='1.1.1'); assert.strictEqual(api.supported,true);

const cases=[
 ['1234','۱۲۳۴'],['٣٤٥','۳۴۵'],['FCR 2.5','FCR ۲.۵'],['سه درصد','۳ درصد'],
 ['سه هزار و پانصد قطعه','۳۵۰۰ قطعه'],['دو میلیون و سیصد هزار قطعه','۲۳۰۰۰۰۰ قطعه'],
 ['صد و بیست و سه قطعه','۱۲۳ قطعه'],['یک میلیون و پانصد و بیست هزار','۱۵۲۰۰۰۰'],
 ['مایکو پلازما و کیسه های هوایی','مایکوپلاسما و کیسه‌های هوایی'],['پی سی آر و ال ای زا','PCR و ELISA'],
 ['اف سی آر و سی وی','FCR و CV'],['کیو پی سی آر و آر تی پی سی آر','qPCR و RT-PCR'],
 ['اچ وی تی و آی بی دی','HVT و IBD'],['پودو درماتیت و آنتی بیوگرام','پودودرماتیت و آنتی‌بیوگرام'],
 ['آنتی بادی و آنتی بیوتیک','آنتی‌بادی و آنتی‌بیوتیک']
];
for(const [input,expected] of cases)assert.strictEqual(api.normalize(input),expected,`${input} => ${api.normalize(input)}`);

const parent=makeElement('div'); const field=makeElement('textarea'); field.parentElement=parent; api.attach(field);
assert.strictEqual(field.dataset.adineVoiceAttached,'1'); assert(lastButton&&typeof lastButton.on_click==='function');
lastButton.on_click(); const r=MockRecognition.instance;
assert.strictEqual(r.lang,'fa-IR');assert.strictEqual(r.continuous,true);assert.strictEqual(r.interimResults,true);assert.strictEqual(r.maxAlternatives,1);assert.strictEqual(r.startCalls,1);
r.onresult({resultIndex:0,results:[{isFinal:false,0:{transcript:'سه هزار قطعه'}}]}); assert.strictEqual(field.value,'۳۰۰۰ قطعه');
r.onresult({resultIndex:0,results:[{isFinal:true,0:{transcript:' سه هزار قطعه'}},{isFinal:false,0:{transcript:' درگیری تنفسی'}}]});
assert(field.value.includes('۳۰۰۰ قطعه'));assert(field.value.includes('درگیری تنفسی'));
r.onresult({resultIndex:1,results:[{isFinal:true,0:{transcript:' سه هزار قطعه'}},{isFinal:true,0:{transcript:' درگیری تنفسی'}}]});
assert.strictEqual((field.value.match(/درگیری تنفسی/g)||[]).length,1);
lastButton.on_click(); assert.strictEqual(r.stopped,true); assert.strictEqual(field.value.includes('درگیری تنفسی'),true);

const numeric=makeElement('input'); numeric.getAttribute=n=>n==='type'?'text':n==='inputmode'?'decimal':null; numeric.parentElement=parent; api.attach(numeric); assert.notStrictEqual(numeric.dataset.adineVoiceAttached,'1');
for(const id of ['farmCode','flockCode','otp','password','phone','email','username','searchBox']){const blocked=makeElement('input');blocked.id=id;blocked.parentElement=parent;api.attach(blocked);assert.notStrictEqual(blocked.dataset.adineVoiceAttached,'1',`blocked ${id}`);}
const searchType=makeElement('input');searchType.getAttribute=n=>n==='type'?'search':n==='inputmode'?'':null;searchType.parentElement=parent;api.attach(searchType);assert.notStrictEqual(searchType.dataset.adineVoiceAttached,'1');
const readonly=makeElement('textarea');readonly.readOnly=true;readonly.parentElement=parent;api.attach(readonly);assert.notStrictEqual(readonly.dataset.adineVoiceAttached,'1');
const disabled=makeElement('textarea');disabled.disabled=true;disabled.parentElement=parent;api.attach(disabled);assert.notStrictEqual(disabled.dataset.adineVoiceAttached,'1');

console.log(`voice-input hardening tests passed: ${cases.length} normalization cases + lifecycle + transcript deduplication + eligibility`);
