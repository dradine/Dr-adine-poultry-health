/* =========================================================
   ADINE LOCAL PERSIAN VOICE — SHENAVA RIZEH v1.0
   Browser/on-device ASR. No paid API. No Supabase calls.
   Model/runtime are loaded lazily and cached by the browser.
   Business logic, calculations and persistence are untouched.
========================================================= */
(function () {
  'use strict';
  if (window.AdineVoiceInput) return;

  const CFG = Object.freeze({
    lang: 'fa-IR',
    modelRevision: 'd393dce04e8b8f4ae87e7cbc0c2d7c48072c44a2',
    modelBase: 'https://huggingface.co/Reza2kn/Shenava-Rizeh-v1.0-ONNX-fp16/resolve/d393dce04e8b8f4ae87e7cbc0c2d7c48072c44a2/',
    modelFile: 'shenava-32m-v5_ctc_fixed2005_len_att70_13_fp16_full_io_embedded.onnx',
    tokensFile: 'tokens.json',
    preFile: 'preprocessor.json',
    melFile: 'mel_filters_slaney_80x257.json',
    ortCdn: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.1/dist/ort.min.js',
    ortCdnFallback: 'https://unpkg.com/onnxruntime-web@1.24.1/dist/ort.min.js',
    sampleRate: 16000,
    nFft: 512,
    winLength: 400,
    hopLength: 160,
    nMels: 80,
    fixedFrames: 2005,
    blankId: 1024,
    maxSeconds: 20,
    buttonClass: 'adine-voice-button',
    wrapperClass: 'adine-voice-field',
    version: '2.1.0-shenava-rizeh'
  });

  const DENY = /(password|passwd|secret|token|code|otp|captcha|search|url|email|phone|mobile|username|user-name|farmcode|flockcode|verification)/i;
  const NUMERIC_MODE = /^(numeric|decimal|tel)$/i;
  const state = new WeakMap();
  let active = null;
  let observer = null;
  let enginePromise = null;

  const WORDS = Object.freeze({
    'صفر':0,'یک':1,'دو':2,'سه':3,'چهار':4,'پنج':5,'شش':6,'هفت':7,'هشت':8,'نه':9,
    'ده':10,'یازده':11,'دوازده':12,'سیزده':13,'چهارده':14,'پانزده':15,'شانزده':16,'هفده':17,'هجده':18,'نوزده':19,
    'بیست':20,'سی':30,'چهل':40,'پنجاه':50,'شصت':60,'هفتاد':70,'هشتاد':80,'نود':90,
    'صد':100,'یکصد':100,'دویست':200,'سیصد':300,'چهارصد':400,'پانصد':500,'ششصد':600,'هفتصد':700,'هشتصد':800,'نهصد':900
  });
  const SCALES = Object.freeze({'هزار':1000,'میلیون':1000000,'میلیارد':1000000000});

  function digits(v) {
    return String(v == null ? '' : v)
      .replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
      .replace(/[٠-٩]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d.charCodeAt(0) - 0x0660]);
  }

  function parseSpokenNumber(words) {
    let total = 0, current = 0, used = false;
    for (const w of words) {
      if (Object.prototype.hasOwnProperty.call(WORDS, w)) { current += WORDS[w]; used = true; continue; }
      if (w === 'و') continue;
      if (Object.prototype.hasOwnProperty.call(SCALES, w)) {
        total += (current || 1) * SCALES[w]; current = 0; used = true; continue;
      }
      return null;
    }
    return used ? total + current : null;
  }

  function normalizeTerms(value) {
    let text = String(value == null ? '' : value)
      .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ـ]/g, '')
      .replace(/[ \t]+/g, ' ').replace(/\s+([،؛؟.!])/g, '$1').trim();

    const protectedPairs = [
      [/کیو\s*پی\s*سی\s*آر/gi,'__QPCR__'],[/آر\s*تی\s*پی\s*سی\s*آر/gi,'__RTPCR__'],
      [/پی\s*سی\s*آر/gi,'__PCR__'],[/ال\s*ای\s*زا/gi,'__ELISA__'],[/اف\s*سی\s*آر/gi,'__FCR__'],[/سی\s*وی/gi,'__CV__'],
      [/اچ\s*وی\s*تی/gi,'__HVT__'],[/آی\s*بی\s*وی/gi,'__IBV__'],[/آی\s*بی\s*دی/gi,'__IBD__'],[/آی\s*ال\s*تی/gi,'__ILT__'],
      [/اِن\s*دی/gi,'__ND__'],[/اِی\s*آی/gi,'__AI__'],[/آر\s*ان\s*ای/gi,'__RNA__'],[/دی\s*ان\s*ای/gi,'__DNA__']
    ];
    for (const [re,t] of protectedPairs) text = text.replace(re,t);

    const numberPattern = '(?:صفر|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|یازده|دوازده|سیزده|چهارده|پانزده|شانزده|هفده|هجده|نوزده|بیست|سی|چهل|پنجاه|شصت|هفتاد|هشتاد|نود|صد|یکصد|دویست|سیصد|چهارصد|پانصد|ششصد|هفتصد|هشتصد|نهصد|هزار|میلیون|میلیارد|و)';
    const numberRe = new RegExp('(^|[\\s،؛])(' + numberPattern + '(?:\\s+' + numberPattern + ')*)(?=$|[\\s،؛])','g');
    text = text.replace(numberRe, (all, before, phrase) => {
      const n = parseSpokenNumber(phrase.trim().split(/\s+/));
      return n == null ? all : before + digits(n);
    });

    const terms = [
      [/مایکو\s*پلا[زظ]ما/gi,'مایکوپلاسما'],[/مایکوپلاسموز/gi,'مایکوپلاسموز'],[/گامبورو/gi,'گامبورو'],[/نیوکاسل/gi,'نیوکاسل'],
      [/برونشیت\s+عفونی/gi,'برونشیت عفونی'],[/لارنگو\s*تراکئیت/gi,'لارنگوتراکئیت'],[/کوکسیدیوز/gi,'کوکسیدیوز'],
      [/کلی\s*باسیلوز/gi,'کلی‌باسیلوز'],[/اشرشیا\s*کلی/gi,'اشرشیاکلی'],[/سالمونلا/gi,'سالمونلا'],[/کلستریدیوم/gi,'کلستریدیوم'],
      [/آسپرژیلوز/gi,'آسپرژیلوز'],[/سینوزیت/gi,'سینوزیت'],[/تنوسینوویت/gi,'تنوسینوویت'],[/پودو\s*درماتیت/gi,'پودودرماتیت'],
      [/آسیت/gi,'آسیت'],[/کیسه\s*های\s*هوایی/gi,'کیسه‌های هوایی'],[/کیسه\s+هوایی/gi,'کیسه هوایی'],[/بورس\s+فابریسیوس/gi,'بورس فابریسیوس'],
      [/آنتی\s*بیوگرام/gi,'آنتی‌بیوگرام'],[/آنتی\s*بادی/gi,'آنتی‌بادی'],[/آنتی\s*بیوتیک/gi,'آنتی‌بیوتیک'],[/تیتر\s+آنتی\s*بادی/gi,'تیتر آنتی‌بادی'],
      [/دهیدراتاسیون/gi,'دهیدراتاسیون'],[/گرمازدگی/gi,'گرمازدگی'],[/تهویه/gi,'تهویه'],[/آمونیاک/gi,'آمونیاک'],[/تراشه/gi,'تراشه'],
      [/سرولوژی/gi,'سرولوژی'],[/کالبد\s*گشایی/gi,'کالبدگشایی'],[/ضایعات\s+ماکروسکوپی/gi,'ضایعات ماکروسکوپی'],
      [/جوجه\s*گوشتی/gi,'جوجه گوشتی'],[/گوشتی/gi,'گوشتی'],[/تخمگذار/gi,'تخم‌گذار'],[/تخم\s*گذار/gi,'تخم‌گذار'],[/مرغ\s*مادر/gi,'مرغ مادر'],
      [/مادر\s*گوشتی/gi,'مادر گوشتی'],[/مادر\s*تخم\s*گذار/gi,'مادر تخم‌گذار'],[/پولت/gi,'پولت'],[/پولِت/gi,'پولت'],
      [/گله\s*مادر/gi,'گله مادر'],[/گله\s*تخم\s*گذار/gi,'گله تخم‌گذار'],[/گله\s*گوشتی/gi,'گله گوشتی'],
      [/مرگ\s*و\s*میر/gi,'مرگ‌ومیر'],[/تلفات/gi,'تلفات'],[/مصرف\s*خوراک/gi,'مصرف خوراک'],[/مصرف\s*آب/gi,'مصرف آب'],
      [/ضریب\s*تبدیل\s*غذایی/gi,'ضریب تبدیل غذایی'],[/یکنواختی/gi,'یکنواختی'],[/وزن\s*کشی/gi,'وزن‌کشی'],[/وزن\s*بدن/gi,'وزن بدن'],
      [/واکسن\s*نیوکاسل/gi,'واکسن نیوکاسل'],[/واکسن\s*برونشیت/gi,'واکسن برونشیت'],[/واکسن\s*گامبورو/gi,'واکسن گامبورو'],
      [/واکسن\s*مارک/gi,'واکسن مارک'],[/واکسن\s*آبله/gi,'واکسن آبله'],[/واکسن\s*کمپیلوباکتر/gi,'واکسن کمپیلوباکتر'],
      [/قطره\s*چشم/gi,'قطره چشمی'],[/اسپری/gi,'اسپری'],[/آب\s*آشامیدنی/gi,'آب آشامیدنی'],[/آبخوری/gi,'آبخوری'],[/دانخوری/gi,'دانخوری'],
      [/بستر/gi,'بستر'],[/رطوبت\s*بستر/gi,'رطوبت بستر'],[/تهویه\s*تونلی/gi,'تهویه تونلی'],[/تهویه\s*حداقلی/gi,'تهویه حداقلی'],
      [/نسبت\s*آب\s*به\s*خوراک/gi,'نسبت آب به خوراک'],[/تولید\s*تخم/gi,'تولید تخم'],[/درصد\s*تولید/gi,'درصد تولید'],
      [/تخم\s*شکسته/gi,'تخم شکسته'],[/تخم\s*کثیف/gi,'تخم کثیف'],[/وزن\s*تخم/gi,'وزن تخم'],[/قله\s*تولید/gi,'قله تولید'],
      [/قابلیت\s*جوجه\s*در\s*آوری/gi,'قابلیت جوجه‌درآوری'],[/نطفه\s*داری/gi,'نطفه‌داری'],[/درصد\s*هچ/gi,'درصد هچ'],
      [/سایز\s*تخم/gi,'سایز تخم'],[/بلوغ\s*جنسی/gi,'بلوغ جنسی'],[/نوردهی/gi,'نوردهی'],[/برنامه\s*نوری/gi,'برنامه نوری'],
      [/میزان\s*دان/gi,'میزان دان'],[/مقدار\s*دان/gi,'مقدار دان'],[/دان\s*روزانه/gi,'دان روزانه']
    ];
    for (const [re,rep] of terms) text = text.replace(re,rep);

    return digits(text)
      .replace(/__PCR__/g,'PCR').replace(/__ELISA__/g,'ELISA').replace(/__FCR__/g,'FCR').replace(/__CV__/g,'CV')
      .replace(/__QPCR__/g,'qPCR').replace(/__RTPCR__/g,'RT-PCR').replace(/__HVT__/g,'HVT').replace(/__IBV__/g,'IBV')
      .replace(/__IBD__/g,'IBD').replace(/__ILT__/g,'ILT').replace(/__AI__/g,'AI').replace(/__ND__/g,'ND')
      .replace(/__RNA__/g,'RNA').replace(/__DNA__/g,'DNA');
  }

  function eligible(el) {
    if (!el || el.nodeType !== 1 || el.disabled || el.readOnly || el.hidden) return false;
    if (el.dataset.voiceDisabled === 'true' || el.hasAttribute('data-no-voice') || el.closest('[data-voice-disabled="true"],.no-voice')) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (type !== 'text' || NUMERIC_MODE.test(el.getAttribute('inputmode') || '') || el.classList.contains('jalali-input')) return false;
    return !DENY.test((el.id || '') + ' ' + (el.name || ''));
  }

  function label(el) {
    if (el.id && window.CSS && CSS.escape) {
      const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (l) return l.textContent.trim();
    }
    const p = el.closest('label');
    return p ? p.textContent.trim() : 'متن';
  }
  function status(s,text,kind){if(s.status){s.status.textContent=text||'';s.status.dataset.state=kind||'';}}
  function inputEvent(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
  function setText(el,value){const v=normalizeTerms(value);if(el.value!==v){el.value=v;inputEvent(el);}}
  function getState(el){let s=state.get(el);if(!s){s={button:null,status:null,recording:false,stopping:false,stream:null,recorder:null,chunks:[],base:'',timer:null};state.set(el,s);}return s;}
  function bestMime(){const c=['audio/mp4','audio/mp4;codecs=mp4a.40.2','audio/webm;codecs=opus','audio/webm'];if(!window.MediaRecorder||!MediaRecorder.isTypeSupported)return '';return c.find(x=>MediaRecorder.isTypeSupported(x))||'';}

  function loadScript(src){return new Promise((resolve,reject)=>{if(window.ort)return resolve(window.ort);const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>window.ort?resolve(window.ort):reject(new Error('ORT_LOAD_FAILED'));s.onerror=()=>reject(new Error('ORT_LOAD_FAILED'));document.head.appendChild(s);});}
  async function json(url){const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw new Error('FETCH_FAILED:'+r.status);return r.json();}
  function asset(name){return CFG.modelBase+name;}

  function tokenTable(raw){
    if(Array.isArray(raw))return raw;
    if(raw&&Array.isArray(raw.tokens))return raw.tokens;
    if(raw&&raw.vocab&&typeof raw.vocab==='object')return Object.entries(raw.vocab).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
    if(raw&&typeof raw==='object'){const e=Object.entries(raw).filter(x=>/^\d+$/.test(String(x[1]))).sort((a,b)=>Number(a[1])-Number(b[1]));if(e.length)return e.map(x=>x[0]);}
    throw new Error('TOKENS_INVALID');
  }
  function melFilters(raw){if(Array.isArray(raw))return raw;if(raw&&Array.isArray(raw.filters))return raw.filters;if(raw&&Array.isArray(raw.mel_filters))return raw.mel_filters;throw new Error('MEL_FILTERS_INVALID');}

  function fftReal(input,n){const re=new Float64Array(n),im=new Float64Array(n);re.set(input.subarray(0,Math.min(input.length,n)));for(let i=0,j=0;i<n;i++){if(i<j){let t=re[i];re[i]=re[j];re[j]=t;}let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;}for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,c=Math.cos(a),s=Math.sin(a);for(let i=0;i<n;i+=len){let wr=1,wi=0;for(let j=0;j<len/2;j++){const u=re[i+j],v=re[i+j+len/2]*wr-im[i+j+len/2]*wi;const vi=re[i+j+len/2]*wi+im[i+j+len/2]*wr;re[i+j]=u+v;im[i+j]=im[i+j]+vi;re[i+j+len/2]=u-v;im[i+j+len/2]=im[i+j]-vi;const nr=wr*c-wi*s;wi=wr*s+wi*c;wr=nr;}}}return{re,im};}
  function reflectIndex(i,n){if(n<=1)return 0;while(i<0||i>=n)i=i<0?-i:i>=n?2*n-2-i:i;return i;}
  function makeFeatures(samples,filters){const x=samples.length>CFG.sampleRate*CFG.maxSeconds?samples.subarray(0,CFG.sampleRate*CFG.maxSeconds):samples;const pre=new Float32Array(x.length);let prev=0;for(let i=0;i<x.length;i++){const v=x[i];pre[i]=v-0.97*prev;prev=v;}const frames=Math.max(1,Math.min(CFG.fixedFrames,Math.floor(pre.length/CFG.hopLength)+1));const out=new Float32Array(CFG.nMels*CFG.fixedFrames);const win=new Float64Array(CFG.winLength);for(let i=0;i<CFG.winLength;i++)win[i]=0.5-0.5*Math.cos(2*Math.PI*i/(CFG.winLength-1));for(let f=0;f<frames;f++){const center=f*CFG.hopLength,buf=new Float64Array(CFG.nFft);for(let j=0;j<CFG.winLength;j++){const idx=reflectIndex(center-CFG.winLength/2+j,pre.length);buf[j]=(pre[idx]||0)*win[j];}const{re,im}=fftReal(buf,CFG.nFft);const power=new Float64Array(CFG.nFft/2+1);for(let k=0;k<power.length;k++)power[k]=re[k]*re[k]+im[k]*im[k];for(let m=0;m<CFG.nMels;m++){const row=filters[m]||[];let sum=0;for(let k=0;k<row.length&&k<power.length;k++)sum+=Number(row[k]||0)*power[k];out[m*CFG.fixedFrames+f]=Math.log(sum+5.960464477539063e-8);}}return{data:out,frames};}

  function ctcDecode(logits,lengths,tokens){const steps=Math.min(Number(lengths[0]||logits.dims[1]),logits.dims[1]);const vocab=logits.dims[2];let prev=-1,out='';for(let t=0;t<steps;t++){let best=0,bestVal=-Infinity;for(let v=0;v<vocab;v++){const val=logits.data[t*vocab+v];if(val>bestVal){bestVal=val;best=v;}}if(best!==CFG.blankId&&best!==prev){const tok=tokens[best]==null?'':String(tokens[best]);if(!(tok.startsWith('<')&&tok.endsWith('>')))out+=tok;}prev=best;}return out.replace(/▁/g,' ').replace(/\s+/g,' ').trim();}

  async function initEngine(){
    let ort;
    try{ort=await loadScript(CFG.ortCdn);}catch(_){ort=await loadScript(CFG.ortCdnFallback);}
    ort.env.wasm.numThreads=1;ort.env.wasm.simd=true;
    const [pre,mel,tok]=await Promise.all([json(asset(CFG.preFile)),json(asset(CFG.melFile)),json(asset(CFG.tokensFile))]);
    const filters=melFilters(mel),tokens=tokenTable(tok);const providers=[];if(navigator.gpu)providers.push('webgpu');providers.push('wasm');
    const session=await ort.InferenceSession.create(asset(CFG.modelFile),{executionProviders:providers,graphOptimizationLevel:'all'});
    return{ort,session,filters,tokens,pre,providers};
  }
  async function engine(){if(!enginePromise)enginePromise=initEngine().catch(e=>{enginePromise=null;throw e;});return enginePromise;}

  function toFloat16Bits(v){if(v===0)return 0;if(!Number.isFinite(v))return v<0?0xfc00:0x7c00;const s=v<0?0x8000:0;v=Math.abs(v);let e=Math.floor(Math.log2(v)),m=v/Math.pow(2,e)-1;if(e>15)return s|0x7c00;if(e<-14)return s|Math.round(v/Math.pow(2,-24));return s|((e+15)<<10)|Math.round(m*1024);}
  function float16Data(f32){if(typeof Float16Array==='function')return new Float16Array(f32);const u=new Uint16Array(f32.length);for(let i=0;i<f32.length;i++)u[i]=toFloat16Bits(f32[i]);return u;}

  async function decodeBlob(blob){
    if(!blob||!blob.size)throw new Error('EMPTY_AUDIO');const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('AUDIO_DECODE_UNAVAILABLE');const ctx=new AC();
    try{const ab=await blob.arrayBuffer(),audio=await ctx.decodeAudioData(ab.slice(0));const mono=new Float32Array(audio.length);for(let c=0;c<audio.numberOfChannels;c++){const ch=audio.getChannelData(c);for(let i=0;i<ch.length;i++)mono[i]+=ch[i]/audio.numberOfChannels;}const target=Math.max(1,Math.round(mono.length*CFG.sampleRate/audio.sampleRate)),rs=new Float32Array(target);for(let i=0;i<target;i++){const p=i*(mono.length-1)/Math.max(1,target-1),a=Math.floor(p),b=Math.min(a+1,mono.length-1),f=p-a;rs[i]=mono[a]*(1-f)+mono[b]*f;}const e=await engine(),feat=makeFeatures(rs,e.filters),inputData=float16Data(feat.data),tensor=new e.ort.Tensor('float16',inputData,[1,CFG.nMels,CFG.fixedFrames]),len=new e.ort.Tensor('int64',BigInt64Array.from([BigInt(feat.frames)]),[1]);const out=await e.session.run({processed_signal:tensor,processed_signal_length:len});return normalizeTerms(ctcDecode(out.logits,out.encoded_lengths,e.tokens));}
    finally{try{await ctx.close();}catch(_){} }
  }

  async function transcribe(el,s){if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder)throw new Error('MEDIARECORDER_UNAVAILABLE');const mime=bestMime();s.stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});s.chunks=[];const r=new MediaRecorder(s.stream,mime?{mimeType:mime}:undefined);s.recorder=r;const blobPromise=new Promise((resolve,reject)=>{r.ondataavailable=e=>{if(e.data&&e.data.size)s.chunks.push(e.data);};r.onerror=()=>reject(new Error('RECORDING_FAILED'));r.onstop=()=>resolve(new Blob(s.chunks,{type:r.mimeType||mime||'audio/mp4'}));});r.start(250);s.recording=true;status(s,'در حال ضبط… دوباره بزنید تا تبدیل شود.','recording');s.timer=setTimeout(()=>{if(s.recording){s.stopping=true;try{r.stop();}catch(_){}status(s,'حداکثر زمان رسید؛ در حال تبدیل…','processing');}},CFG.maxSeconds*1000);const blob=await blobPromise;clearTimeout(s.timer);s.timer=null;s.recording=false;s.recorder=null;s.stream.getTracks().forEach(t=>t.stop());s.stream=null;status(s,'در حال تبدیل گفتار فارسی…','processing');const text=await decodeBlob(blob);setText(el,`${s.base}${s.base&&text?' ':''}${text}`.trim());status(s,'','');s.stopping=false;}
  async function toggle(el){const s=getState(el);if(active&&active!==el){const old=getState(active);try{old.recorder&&old.recorder.stop();}catch(_){}old.stream&&old.stream.getTracks().forEach(t=>t.stop());active=null;}if(s.recording){s.stopping=true;status(s,'در حال تکمیل متن…','processing');try{s.recorder&&s.recorder.stop();}catch(_){}return;}s.base=normalizeTerms(el.value||'').trim();active=el;try{await transcribe(el,s);}catch(e){if(s.timer)clearTimeout(s.timer);s.timer=null;s.recording=false;s.recorder=null;if(s.stream){s.stream.getTracks().forEach(t=>t.stop());s.stream=null;}const msg={MEDIARECORDER_UNAVAILABLE:'ضبط صدا در این مرورگر در دسترس نیست.',AUDIO_DECODE_UNAVAILABLE:'پردازش صوت در این دستگاه در دسترس نیست.',EMPTY_AUDIO:'صدایی دریافت نشد؛ دوباره تلاش کنید.',RECORDING_FAILED:'ضبط صدا با خطا متوقف شد.',ORT_LOAD_FAILED:'موتور محلی گفتار بارگذاری نشد.',TOKENS_INVALID:'واژگان مدل قابل بارگذاری نیست.',MEL_FILTERS_INVALID:'فیلترهای صوتی مدل قابل بارگذاری نیست.',FETCH_FAILED: 'فایل‌های مدل شنوا در دسترس نیست؛ اتصال اینترنت را بررسی کنید.'};status(s,msg[e.message]||'تبدیل گفتار به متن با خطا مواجه شد؛ دوباره تلاش کنید.','error');}finally{if(active===el)active=null;s.stopping=false;}}

  function make(el){if(!eligible(el)||el.parentElement&&el.parentElement.querySelector('.'+CFG.buttonClass))return;const s=getState(el),wrap=document.createElement('span');wrap.className=CFG.wrapperClass;const b=document.createElement('button');b.type='button';b.className=CFG.buttonClass;b.innerHTML='<span aria-hidden="true">🎙️</span>';b.title='گفتار به متن فارسی (شنوا ریزه)';b.setAttribute('aria-label','تبدیل گفتار به متن برای '+label(el));const st=document.createElement('span');st.className='adine-voice-status';st.setAttribute('aria-live','polite');wrap.appendChild(b);wrap.appendChild(st);el.parentNode.insertBefore(wrap,el.nextSibling);s.button=b;s.status=st;b.addEventListener('click',()=>toggle(el));}
  function styles(){if(document.getElementById('adine-shenava-voice-style'))return;const st=document.createElement('style');st.id='adine-shenava-voice-style';st.textContent='.adine-voice-field{display:inline-flex;align-items:center;gap:6px;max-width:100%}.adine-voice-field>.adine-voice-button{flex:0 0 auto;border:0;background:transparent;cursor:pointer;font-size:20px;line-height:1;padding:5px;border-radius:9px}.adine-voice-status{font-size:11px;white-space:nowrap}.adine-voice-status[data-state="error"]{color:#b91c1c}.adine-voice-status[data-state="recording"],.adine-voice-status[data-state="processing"]{color:#2563eb}';document.head.appendChild(st);}
  function scan(root){const r=root&&root.querySelectorAll?root:document;r.querySelectorAll('textarea,input[type="text"]').forEach(make);}
  function boot(){styles();scan(document);observer=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n);})));observer.observe(document.documentElement,{childList:true,subtree:true});}

  window.AdineVoiceInput={version:CFG.version,engine:'Shenava-Rizeh-v1.0-ONNX-fp16',modelRevision:CFG.modelRevision,local:true,normalize:normalizeTerms,ready:true,preload:()=>engine().then(()=>true),supported:()=>!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder&&(window.AudioContext||window.webkitAudioContext))};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
