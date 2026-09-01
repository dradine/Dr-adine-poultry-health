/* ADINE SHENAVA WORKER 7.0
 * Runs the official 32M Rizeh sherpa-onnx artifact off the UI thread.
 */
import { initASRModule, OfflineRecognizer } from 'https://esm.sh/@sherpaw/asr@0.0.2?bundle';

const C=Object.freeze({
  modelUrl:'https://huggingface.co/Reza2kn/Shenava-Rizeh-v1.0-sherpa-onnx/resolve/main/model.onnx?download=true',
  tokensUrl:'https://huggingface.co/Reza2kn/Shenava-Rizeh-v1.0-sherpa-onnx/resolve/main/tokens.txt?download=true',
  modelName:'model.onnx',
  tokensName:'tokens.txt',
  minBytes:30000000,
  maxBytes:50000000,
  sampleRate:16000,
  tokenCount:1025,
  timeoutMs:150000,
});

let modulePromise=null;
let recognizerPromise=null;

function fail(code,message){const e=new Error(message||code);e.code=code;return e;}
function post(id,ok,payload={}){self.postMessage({id,ok,...payload});}
function progress(id,stage,detail){self.postMessage({id,type:'progress',stage,detail});}
function withTimeout(p,ms,code){let t;return Promise.race([p,new Promise((_,r)=>t=setTimeout(()=>r(fail(code)),ms))]).finally(()=>clearTimeout(t));}

async function fetchBytes(url,label){
  const r=await fetch(url,{cache:'force-cache',mode:'cors'});
  if(!r.ok) throw fail(`${label}_HTTP_${r.status}`);
  const b=await r.arrayBuffer();
  return b;
}

async function getModule(){
  if(modulePromise) return modulePromise;
  modulePromise=(async()=>{
    progress(0,'wasm');
    const m=await initASRModule();
    if(!m?.FS_createDataFile) throw fail('WASM_FS_UNAVAILABLE');
    return m;
  })().catch(e=>{modulePromise=null;throw e});
  return modulePromise;
}

async function getRecognizer(id){
  if(recognizerPromise) return recognizerPromise;
  recognizerPromise=(async()=>{
    const Module=await getModule();
    progress(id,'model');
    const [model,tokens]=await Promise.all([fetchBytes(C.modelUrl,'MODEL'),fetch(C.tokensUrl,{cache:'force-cache',mode:'cors'}).then(async r=>{if(!r.ok)throw fail(`TOKENS_HTTP_${r.status}`);return r.text()})]);
    if(model.byteLength<C.minBytes||model.byteLength>C.maxBytes) throw fail('MODEL_SIZE',`Unexpected Shenava Rizeh model size: ${model.byteLength}`);
    const rows=tokens.split(/\r?\n/).filter(Boolean);
    if(rows.length!==C.tokenCount) throw fail('TOKEN_COUNT',`Expected ${C.tokenCount} tokens, got ${rows.length}`);
    Module.FS_createDataFile('/',C.modelName,new Uint8Array(model),true,true,true);
    Module.FS_createDataFile('/',C.tokensName,new TextEncoder().encode(tokens),true,true,true);
    progress(id,'session');
    const rec=new OfflineRecognizer({
      featConfig:{sampleRate:C.sampleRate,featureDim:80},
      modelConfig:{nemoCtc:{model:`/${C.modelName}`},tokens:`/${C.tokensName}`,numThreads:1,provider:'cpu',debug:0},
      decodingMethod:'greedy_search',
    },Module);
    return {rec,Module};
  })().catch(e=>{recognizerPromise=null;throw e});
  return recognizerPromise;
}

async function infer(id,pcm,sampleRate){
  if(!pcm?.length) throw fail('EMPTY_AUDIO');
  if(sampleRate!==C.sampleRate) throw fail('BAD_SAMPLE_RATE');
  const e=await withTimeout(getRecognizer(id),C.timeoutMs,'MODEL_INIT_TIMEOUT');
  progress(id,'decode');
  const stream=e.rec.createStream();
  try{
    stream.acceptWaveform(C.sampleRate,pcm);
    e.rec.decode(stream);
    const result=e.rec.getResult(stream);
    const text=String(result?.text||'').replace(/\s+/g,' ').trim();
    if(!text) throw fail('EMPTY_TEXT');
    progress(id,'done',{chars:text.length});
    return text;
  }finally{try{stream.free?.()}catch(_) {}}
}

self.onmessage=async e=>{
  const m=e.data||{}; const id=m.id;
  try{
    if(m.type==='preload'){
      await getRecognizer(id); post(id,true,{text:''}); return;
    }
    if(m.type==='infer'){
      const pcm=m.pcm instanceof Float32Array?m.pcm:new Float32Array(m.pcm||[]);
      const text=await infer(id,pcm,m.sampleRate); post(id,true,{text}); return;
    }
    throw fail('UNKNOWN_WORKER_COMMAND');
  }catch(err){
    post(id,false,{code:err?.code||'ASR_WORKER_ERROR',message:err?.message||String(err)});
  }
};
