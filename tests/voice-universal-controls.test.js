const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('voice-universal-controls.js', 'utf8');
const listeners = {};
function makeEl(tag='div') {
  return {
    tagName: tag.toUpperCase(), disabled:false, readOnly:false, hidden:false,
    dataset:{}, classList:{contains(){return false},add(){},remove(){},toggle(){}},
    hasAttribute(){return false}, closest(){return null}, matches(){return false},
    querySelector(){return null}, querySelectorAll(){return []}, appendChild(){},
    insertBefore(){}, addEventListener(){}, dispatchEvent(){}, setAttribute(){},
    style:{}, parentNode:{insertBefore(){},appendChild(){}},
  };
}
const document = {
  readyState:'loading',
  documentElement:{appendChild(){}}, head:{appendChild(){}},
  addEventListener(name,fn){listeners[name]=fn},
  createElement(tag){return makeEl(tag)},
  getElementById(){return null}, querySelector(){return null}, querySelectorAll(){return []}
};
const sandbox = {
  window:{}, document, console, navigator:{mediaDevices:null}, MutationObserver:class{observe(){}},
  Event:class{constructor(type,opts){this.type=type;Object.assign(this,opts||{})}},
  setTimeout,clearTimeout,Promise,Float32Array,Blob,FormData,File,Date,Math,Error,Object,Array,String,Number,
};
sandbox.window=sandbox;
vm.runInNewContext(source,sandbox,{filename:'voice-universal-controls.js'});
assert(sandbox.window.AdineUniversalVoice);
assert.strictEqual(sandbox.window.AdineUniversalVoice.version,'6.0.0');
assert.strictEqual(sandbox.window.AdineUniversalVoice.normalize('۱۲۳۴ اف سی آر'), '۱۲۳۴ FCR');
console.log('Universal voice controller regression: PASS (API/version/normalization/syntax)');
