const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('voice-shenava-runtime.js', 'utf8');
const listeners = {};
const MODEL_BYTES = 58982673;
const document = {
  addEventListener(name, fn) { listeners[name] = fn; },
  createElement() { return { setAttribute(){}, appendChild(){}, addEventListener(){}, dataset:{}, className:'', textContent:'' }; },
  head: { appendChild(){} },
  documentElement: { appendChild(){} },
};
const sandbox = {
  window: {}, document, console,
  navigator: { userAgent:'Android Chrome', mediaDevices: { getUserMedia: async()=>({ getTracks:()=>[] }) } },
  Float32Array, Uint16Array, Uint32Array, BigInt64Array,
  setTimeout, clearTimeout, AbortController, Math, Number, String, Error, Object, Array, Promise,
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
        const data = new Uint16Array(252*1025);
        for(let t=0;t<252;t++) data[t*1025+10]=0x4900; // float16(10.0)
        return {logits:{type:'float16',data,dims:[1,252,1025]},encoded_lengths:{data:BigInt64Array.from([252n]),dims:[1]}};
      }};
    }
  }
};
sandbox.fetch = async (url) => ({
  ok:true,
  async arrayBuffer(){ return new ArrayBuffer(MODEL_BYTES); },
  async json(){
    const u=String(url);
    if (u.includes('tokens.json')) {
      const tokens = Array.from({length:1025},()=>'<unk>');
      tokens[10] = 'سلام';
      return { tokens };
    }
    if (u.includes('preprocessor.json')) return {
      sample_rate:16000,n_fft:512,win_length:400,hop_length:160,n_mels:80,
      center_pad:256,fixed_frames:2005,blank_id:1024
    };
    return Array.from({length:80},()=>Array(257).fill(0));
  }
});
vm.runInNewContext(source, sandbox, {filename:'voice-shenava-runtime.js'});
assert(sandbox.window.AdineShenavaRuntime);
(async()=>{
  const pcm = new Float32Array(32000);
  for(let i=0;i<pcm.length;i++) pcm[i] = Math.sin(i/17) * 0.05;
  const text = await sandbox.window.AdineShenavaRuntime.inferPCM(pcm,16000);
  assert.strictEqual(text,'سلام');
  assert(lastInput);
  assert.strictEqual(sandbox.window.AdineShenavaRuntime.version,'5.1.0');
  console.log('Shenava raw-PCM runtime smoke: PASS (PCM/resample/reflect-fbank/float16 tensor/float16 logits/CTC)');
})().catch(err=>{console.error(err);process.exitCode=1;});
