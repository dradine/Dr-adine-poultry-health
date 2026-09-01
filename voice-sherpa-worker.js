/* ADINE SHENAVA WORKER 8.0
 * Browser architecture aligned with the upstream sherpa-onnx WebAssembly ASR demos:
 * Classic Worker + Emscripten glue + sherpa-onnx-asr.js + dynamic model files.
 * Official Shenava Rizeh v1.0 (32M), NeMo CTC, 16 kHz, 1025 tokens.
 * No Sherpaw wrapper is used here because its prebuilt WASM is an additional wrapper layer.
 */
const WASM_BASE='https://unpkg.com/speech-asr@1.1.6/dist/lib/';
const C=Object.freeze({
  modelUrl:'https://huggingface.co/Reza2kn/Shenava-Rizeh-v1.0-sherpa-onnx/resolve/main/model.onnx?download=true',
  tokensUrl:'https://huggingface.co/Reza2kn/Shenava-Rizeh-v1.0-sherpa-onnx/resolve/main/tokens.txt?download=true',
  modelName:'model.onnx',tokensName:'tokens.txt',
  minBytes:80000000,maxBytes:160000000,sampleRate:16000,featureDim:80,tokenCount:1025,
  importTimeout:30000,wasmTimeout:60000,modelTimeout:180000,sessionTimeout:180000,decodeTimeout:180000
});
let moduleReady=null,recognizer=null;
const fail=(code,message)=>{const e=Error(message||code);e.code=code;return e};
const post=(id,ok,payload={})=>self.postMessage({id,ok,...payload});
const progress=(id,stage,detail)=>self.postMessage({id,type:'progress',stage,detail});

function bootModule(){
  if(moduleReady)return moduleReady;
  moduleReady=new Promise((resolve,reject)=>{
    let timer=setTimeout(()=>reject(fail('WASM_INIT_TIMEOUT')),C.wasmTimeout);
    const M={
      locateFile:(path)=>path.endsWith('.wasm')?WASM_BASE+'sherpa-onnx-wasm-main-asr.wasm':WASM_BASE+path,
      print:(...a)=>console.log('[sherpa]',...a),
      printErr:(...a)=>console.error('[sherpa]',...a),
      onAbort:(reason)=>{clearTimeout(timer);reject(fail('WASM_ABORT',String(reason||'abort')))},
      onRuntimeInitialized:()=>{clearTimeout(timer);if(!M.FS_createDataFile||!M._malloc||typeof self.OfflineRecognizer!=='function'){reject(fail('SHERPA_API_EXPORT'));return}resolve(M)}
    };
    self.Module=M;
    try{
      importScripts(WASM_BASE+'sherpa-onnx-asr.js',WASM_BASE+'sherpa-onnx-wasm-main-asr.js');
    }catch(e){clearTimeout(timer);reject(fail('SHERPA_IMPORT',e?.message||String(e)))}
  }).catch(e=>{moduleReady=null;throw e});
  return moduleReady;
}
async function fetchModel(){
  const result=await Promise.race([
    Promise.all([fetch(C.modelUrl,{cache:'force-cache',mode:'cors'}),fetch(C.tokensUrl,{cache:'force-cache',mode:'cors'})]).then(async([mr,tr])=>{
      if(!mr.ok)throw fail(`MODEL_HTTP_${mr.status}`);if(!tr.ok)throw fail(`TOKENS_HTTP_${tr.status}`);
      const [model,tokens]=await Promise.all([mr.arrayBuffer(),tr.text()]);
      if(model.byteLength<C.minBytes||model.byteLength>C.maxBytes)throw fail('MODEL_SIZE',`Unexpected Shenava Rizeh model size: ${model.byteLength}`);
      if(tokens.split(/\r?\n/).filter(Boolean).length!==C.tokenCount)throw fail('TOKEN_COUNT');
      return {model,tokens};
    }),
    new Promise((_,reject)=>setTimeout(()=>reject(fail('MODEL_LOAD_TIMEOUT')),C.modelTimeout))
  ]);return result;
}
async function ensureRecognizer(id){
  if(recognizer)return recognizer;
  const Module=await bootModule();progress(id,'model');const {model,tokens}=await fetchModel();
  try{
    Module.FS_unlink?.('/'+C.modelName);Module.FS_unlink?.('/'+C.tokensName);
    Module.FS_createDataFile('/',C.modelName,new Uint8Array(model),true,true,true);
    Module.FS_createDataFile('/',C.tokensName,new TextEncoder().encode(tokens),true,true,true);
  }catch(e){throw fail('MODEL_FS',e?.message||String(e))}
  progress(id,'session');
  const cfg={featConfig:{sampleRate:C.sampleRate,featureDim:C.featureDim},modelConfig:{nemoCtc:{model:'./'+C.modelName},tokens:'./'+C.tokensName,numThreads:1,provider:'cpu',debug:0},decodingMethod:'greedy_search'};
  try{recognizer=new self.OfflineRecognizer(cfg,Module);return recognizer}catch(e){throw fail('SESSION_INIT',e?.message||String(e))}
}
async function infer(id,pcm,sampleRate){
  if(!pcm?.length)throw fail('EMPTY_AUDIO');if(sampleRate!==C.sampleRate)throw fail('BAD_SAMPLE_RATE');
  const rec=await ensureRecognizer(id);progress(id,'decode');const stream=rec.createStream();
  try{
    stream.acceptWaveform({samples:pcm,sampleRate:C.sampleRate});
    if(typeof rec.decodeAsync==='function')await rec.decodeAsync(stream);else rec.decode(stream);
    const result=rec.getResult(stream);const text=String(result?.text||'').replace(/\s+/g,' ').trim();
    if(!text)throw fail('EMPTY_TEXT');progress(id,'done',{chars:text.length});return text;
  }catch(e){if(e?.code)throw e;throw fail('DECODE_ERROR',e?.message||String(e))}finally{try{stream.free?.()}catch(_){} }
}
self.onmessage=async(e)=>{const m=e.data||{},id=m.id;try{
  if(m.type==='preload'){await ensureRecognizer(id);post(id,true,{text:''});return}
  if(m.type==='infer'){const pcm=m.pcm instanceof Float32Array?m.pcm:new Float32Array(m.pcm||[]);post(id,true,{text:await infer(id,pcm,m.sampleRate)});return}
  throw fail('UNKNOWN_WORKER_COMMAND');
}catch(err){post(id,false,{code:err?.code||'ASR_WORKER_ERROR',message:err?.message||String(err)})}};
