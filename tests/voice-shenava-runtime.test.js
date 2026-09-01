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
  MediaRecorder: class {},
  AudioContext: class {
    async decodeAudioData() {
      const samples = new Float32Array(32000);
      for (let i=0;i<samples.length;i++) samples[i] = Math.sin(i/17) * 0.05;
      return { sampleRate:16000, length:samples.length, numberOfChannels:1, getChannelData:()=>samples };
    }
    async close() {}
  },
  BigInt64Array, Float32Array, Uint16Array, Uint32Array,
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
        assert.deepStrictEqual(inputs.processed_signal.dims,[1,80,2005]);
        assert.strictEqual(inputs.processed_signal.type,'float16');
        assert.strictEqual(inputs.processed_signal.data.length,80*2005);
        assert.deepStrictEqual(inputs.processed_signal_length.dims,[1]);
        assert.strictEqual(Number(inputs.processed_signal_length.data[0]),201);
        const data = new Float32Array(252*1025);
        for(let t=0;t<252;t++) data[t*1025+10]=10;
        return {
          logits:{type:'float32',data,dims:[1,252,1025]},
          encoded_lengths:{data:BigInt64Array.from([BigInt(252)]),dims:[1]}
        };
      }};
    }
  }
};
vm.runInNewContext(source, sandbox, {filename:'voice-shenava-runtime.js'});
assert(sandbox.window.AdineShenavaRuntime);
(async()=>{
  const blob = new Blob([new Uint8Array([1,2,3])], {type:'audio/mp4'});
  const text = await sandbox.window.AdineShenavaRuntime.infer(blob);
  assert.strictEqual(text,'سلام');
  assert(lastInput);
  console.log('Shenava real-inference runtime smoke: PASS (capture/decode/resample/fbank/tensor/CTC)');
})().catch(err=>{console.error(err);process.exitCode=1;});
