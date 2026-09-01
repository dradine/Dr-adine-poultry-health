/* ADINE PERSIAN ASR RUNTIME 7.0
 * Primary engine: official Shenava Rizeh v1.0 (32M) + sherpa-onnx/Sherpaw WASM.
 * No hand-written Mel/FFT/CTC path. Audio is filtered only at the acoustic boundary.
 * The heavy recognizer runs in a dedicated Worker so the UI thread stays responsive.
 */
(function(){
  'use strict';
  if (window.AdineShenavaRuntime?.version === '7.0.0') return;

  const C = Object.freeze({
    version: '7.0.0',
    engine: 'sherpa-onnx-wasm',
    model: 'Shenava-Rizeh-v1.0-sherpa-onnx',
    parameters: 32000000,
    sampleRate: 16000,
    maxSeconds: 45,
    minSeconds: 0.20,
    modelUrl: 'https://huggingface.co/Reza2kn/Shenava-Rizeh-v1.0-sherpa-onnx/resolve/main/model.onnx?download=true',
    tokensUrl: 'https://huggingface.co/Reza2kn/Shenava-Rizeh-v1.0-sherpa-onnx/resolve/main/tokens.txt?download=true',
    asrModuleUrl: 'https://esm.sh/@sherpaw/asr@0.0.2?bundle',
    preloaderModuleUrl: 'https://esm.sh/@sherpaw/preloader@0.0.2?bundle',
    modelMinBytes: 30000000,
    modelMaxBytes: 50000000,
    tokenCount: 1025,
    timeoutMs: 150000,
  });

  let worker = null;
  let requestId = 0;
  const pending = new Map();

  function error(code, message){ const e = new Error(message || code); e.code = code; return e; }
  function log(stage, meta){ try { console.info('[Adine Shenava 7]', stage, meta || ''); } catch(_){} }

  function ensureWorker(){
    if (worker) return worker;
    worker = new Worker('voice-sherpa-worker.js?v=7.0.0', { type: 'module', name: 'adine-persian-asr' });
    worker.onmessage = e => {
      const m = e.data || {};
      if (m.type === 'progress') { window.dispatchEvent(new CustomEvent('adine-voice-progress', {detail:m})); return; }
      const p = pending.get(m.id); if (!p) return;
      pending.delete(m.id);
      if (m.ok) p.resolve(m.text || ''); else { const er = error(m.code || 'ASR_WORKER_ERROR', m.message); p.reject(er); }
    };
    worker.onerror = e => {
      for (const [,p] of pending) p.reject(error('ASR_WORKER_CRASH', e?.message || 'worker error'));
      pending.clear(); worker = null;
    };
    return worker;
  }

  function call(type, payload){
    const id = ++requestId;
    const w = ensureWorker();
    return new Promise((resolve,reject)=>{
      pending.set(id,{resolve,reject});
      try { w.postMessage({id,type,...payload}, payload?.pcm ? [payload.pcm.buffer] : []); }
      catch(e){ pending.delete(id); reject(error('ASR_WORKER_POST',e.message)); }
    });
  }

  function resample(samples, from){
    if (from === C.sampleRate) return samples;
    if (!from || from < 8000) throw error('BAD_SAMPLE_RATE');
    const n = Math.max(1, Math.round(samples.length * C.sampleRate / from));
    const out = new Float32Array(n), ratio = (samples.length - 1) / Math.max(1,n-1);
    for(let i=0;i<n;i++){
      const p=i*ratio, j=Math.floor(p), f=p-j;
      out[i]=(samples[j]||0)*(1-f)+(samples[Math.min(j+1,samples.length-1)]||0)*f;
    }
    return out;
  }

  function highPass(samples, sr){
    // One-pole 70 Hz DC/rumble filter; deliberately before ASR, never on model features.
    const out = new Float32Array(samples.length), rc=1/(2*Math.PI*70), dt=1/sr, a=rc/(rc+dt);
    let prevX=0, prevY=0;
    for(let i=0;i<samples.length;i++){ const x=samples[i]||0; const y=a*(prevY+x-prevX); out[i]=y; prevX=x; prevY=y; }
    return out;
  }

  function dcRemove(samples){
    let mean=0; const n=Math.min(samples.length, Math.floor(0.5*48000));
    for(let i=0;i<n;i++) mean+=samples[i]; mean/=Math.max(1,n);
    if(Math.abs(mean)<0.0005) return samples;
    const out=new Float32Array(samples.length); for(let i=0;i<samples.length;i++) out[i]=samples[i]-mean; return out;
  }

  function limiter(samples){
    const out=new Float32Array(samples.length);
    for(let i=0;i<samples.length;i++){
      const x=samples[i]||0; out[i]=Math.tanh(x*1.08)/Math.tanh(1.08);
    }
    return out;
  }

  function trimSilence(samples,sr){
    // Conservative adaptive energy gate: 20 ms frames, 120 ms speech continuity,
    // 250 ms pre-roll and 700 ms tail. It never normalizes loudness.
    const frame=Math.max(160,Math.round(sr*0.02));
    const count=Math.floor(samples.length/frame);
    if(count<4) return samples;
    const energies=new Float32Array(count); let floor=0;
    for(let f=0;f<count;f++){
      let e=0; const a=f*frame,b=Math.min(samples.length,a+frame);
      for(let i=a;i<b;i++){const x=samples[i]||0;e+=x*x;}
      energies[f]=Math.sqrt(e/Math.max(1,b-a));
      if(f<Math.min(10,count)) floor+=energies[f];
    }
    floor/=Math.min(10,count);
    const threshold=Math.max(0.004,floor*2.2);
    let first=-1,last=-1,run=0;
    for(let f=0;f<count;f++){
      if(energies[f]>=threshold){run++; if(first<0&&run>=2)first=f-1; last=f;}
      else run=0;
    }
    if(first<0||last<0) throw error('SILENCE','No usable speech energy was detected.');
    const pre=Math.round(sr*0.25), post=Math.round(sr*0.70);
    const a=Math.max(0,first*frame-pre), b=Math.min(samples.length,(last+1)*frame+post);
    return samples.slice(a,b);
  }

  function prepare(pcm,sampleRate){
    if(!(pcm instanceof Float32Array)) pcm=Float32Array.from(pcm||[]);
    if(pcm.length < C.sampleRate*C.minSeconds) throw error('EMPTY_AUDIO');
    let x=resample(pcm,sampleRate||C.sampleRate);
    const max=C.sampleRate*C.maxSeconds; if(x.length>max) x=x.slice(0,max);
    x=dcRemove(x); x=highPass(x,C.sampleRate); x=trimSilence(x,C.sampleRate); x=limiter(x);
    let sum=0,peak=0; for(const v of x){sum+=v*v;peak=Math.max(peak,Math.abs(v));}
    const rms=Math.sqrt(sum/Math.max(1,x.length));
    if(rms<0.0025||peak<0.008) throw error('SILENCE');
    return {pcm:x,sampleRate:C.sampleRate,rms,peak};
  }

  async function inferPCM(pcm,sampleRate,progress){
    const p=prepare(pcm,sampleRate);
    log('AUDIO_READY',{samples:p.pcm.length,sampleRate:p.sampleRate,rms:+p.rms.toFixed(5),peak:+p.peak.toFixed(5)});
    progress?.('loading');
    return call('infer',{pcm:p.pcm, sampleRate:p.sampleRate});
  }

  async function preload(){
    try { await call('preload',{}); return true; }
    catch(e){ log('PRELOAD_FAIL',{code:e.code,message:e.message}); return false; }
  }

  window.AdineShenavaRuntime=Object.freeze({
    version:C.version,
    engine:C.engine,
    model:C.model,
    inferPCM,
    preload,
    diagnostics:()=>({version:C.version,engine:C.engine,model:C.model,parameters:C.parameters,sampleRate:C.sampleRate}),
  });

  // Warm the WASM module/model without blocking page startup. Failure is non-fatal and retried on demand.
  const warm=()=>{ if(document.visibilityState!=='hidden') preload(); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(warm,800),{once:true});
  else setTimeout(warm,800);
})();
