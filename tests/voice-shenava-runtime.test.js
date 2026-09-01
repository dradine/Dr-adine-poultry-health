const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('voice-shenava-runtime.js', 'utf8');
const listeners = {};
const document = {
  addEventListener(name, fn) { listeners[name] = fn; },
  createElement() { return { setAttribute(){}, appendChild(){}, addEventListener(){}, dataset:{}, className:'', textContent:'' }; },
  head: { appendChild(){} },
  documentElement: { appendChild(){} },
};
const sandbox = {
  window: {}, document, console,
  navigator: { mediaDevices: { getUserMedia: async()=>({ getTracks:()=>[] }) } },
  Float32Array, Uint16Array, Uint32Array, BigInt64Array,
  setTimeout, clearTimeout,
  fetch: async (url) => ({
    ok:true,
    async json(){
      if (String(url).includes('tokens.json')) {
        const tokens = Array.from({length:1025},()=>'<unk>');
        tokens[10] = 'سلام';
        return { tokens };
      }
      return Array.from({length:80},()=>Array(257).fill(0));
    }
  }),
};
sandbox.window = sandbox;
let lastInput = null;
sandbox.ort = {
  env:{wasm:{numThreads:1,simd:true}},
  Tensor: class {
    constructor(type,data,dims){ this.type=type; this.data=data; this.dims=dims; lastInput=this; }
  },
  InferenceSession:{
    async create(){
      return { async run(inputs){
        assert.strictEqual(Array.from(inputs.processed_signal.dims).join(','),'1,80,2005');
        assert.strictEqual(inputs.processed_signal.type,'float16');
        assert.strictEqual(inputs.processed_signal.data.length,80*2005);
        assert.strictEqual(Array.from(inputs.processed_signal_length.dims).join(','),'1');
        assert.strictEqual(Number(inputs.processed_signal_length.data[0]),201);
        const data = new Float32Array(252*1025);
        for(let t=0;t<252;t++) data[t*1025+10]=10;
        return {logits:{type:'float32',data,dims:[1,252,1025]},encoded_lengths:{data:BigInt64Array.from([BigInt(252)]),dims:[1]}};
      }};
    }
  }
};
vm.runInNewContext(source, sandbox, {filename:'voice-shenava-runtime.js'});
assert(sandbox.window.AdineShenavaRuntime);
(async()=>{
  const pcm = new Float32Array(32000);
  for(let i=0;i<pcm.length;i++) pcm[i] = Math.sin(i/17) * 0.05;
  const text = await sandbox.window.AdineShenavaRuntime.inferPCM(pcm,16000);
  assert.strictEqual(text,'سلام');
  assert(lastInput);
  assert.strictEqual(sandbox.window.AdineShenavaRuntime.version,'4.0.0');
  console.log('Shenava raw-PCM runtime smoke: PASS (PCM/resample/fbank/tensor/CTC)');
})().catch(err=>{console.error(err);process.exitCode=1;});
