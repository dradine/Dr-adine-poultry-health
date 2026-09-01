/* =========================================================
   ADINE GLOBAL PERSIAN VOICE INPUT v1.1
   UI-only speech-to-text layer.
   No Supabase calls. No business logic. No calculations.
   Voice is deliberately limited to free-text fields.
========================================================= */
(function () {
  'use strict';
  if (window.AdineVoiceInput) return;

  const CONFIG = Object.freeze({
    lang: 'fa-IR', continuous: true, interimResults: true, maxAlternatives: 1,
    buttonClass: 'adine-voice-button', wrapperClass: 'adine-voice-field',
    version: '1.1.0', restartDelay: 250, maxUnexpectedRestarts: 5
  });

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const state = new WeakMap();
  let active = null;
  let observer = null;

  const DENY_ID = /(password|passwd|secret|token|code|otp|captcha|search|url|email|phone|mobile|username|user-name|farmcode|flockcode|verification)/i;
  const DENY_NAME = /(password|passwd|secret|token|otp|captcha|email|phone|mobile|username|url|code|verification)/i;
  const NUMERIC_MODE = /^(numeric|decimal|tel)$/i;
  const NUMBER_WORDS = Object.freeze({
    'صفر':0,'یک':1,'دو':2,'سه':3,'چهار':4,'پنج':5,'شش':6,'هفت':7,'هشت':8,'نه':9,'ده':10,
    'یازده':11,'دوازده':12,'سیزده':13,'چهارده':14,'پانزده':15,'شانزده':16,'هفده':17,'هجده':18,'نوزده':19,
    'بیست':20,'سی':30,'چهل':40,'پنجاه':50,'شصت':60,'هفتاد':70,'هشتاد':80,'نود':90,
    'صد':100,'یکصد':100,'دویست':200,'سیصد':300,'چهارصد':400,'پانصد':500,'ششصد':600,'هفتصد':700,'هشتصد':800,'نهصد':900
  });
  const SCALE_WORDS = Object.freeze({'هزار':1000,'میلیون':1000000,'میلیارد':1000000000});
  const WORD_PATTERN = '(?:صفر|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|یازده|دوازده|سیزده|چهارده|پانزده|شانزده|هفده|هجده|نوزده|بیست|سی|چهل|پنجاه|شصت|هفتاد|هشتاد|نود|صد|یکصد|دویست|سیصد|چهارصد|پانصد|ششصد|هفتصد|هشتصد|نهصد|هزار|میلیون|میلیارد|و)';
  const SPOKEN_NUMBER_RE = new RegExp('(^|[\\s،؛])(' + WORD_PATTERN + '(?:\\s+' + WORD_PATTERN + ')*)(?=$|[\\s،؛])','g');

  function toPersianDigits(value) {
    return String(value == null ? '' : value)
      .replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
      .replace(/[٠-٩]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d.charCodeAt(0) - 0x0660]);
  }

  function parseNumber(tokens) {
    let total = 0, current = 0, used = false, afterScale = false;
    for (const token of tokens) {
      if (Object.prototype.hasOwnProperty.call(NUMBER_WORDS, token)) {
        current += NUMBER_WORDS[token]; used = true; afterScale = false; continue;
      }
      if (token === 'و') { if (!used) return null; continue; }
      if (Object.prototype.hasOwnProperty.call(SCALE_WORDS, token)) {
        if (afterScale && current === 0) return null;
        total += (current || 1) * SCALE_WORDS[token]; current = 0; used = true; afterScale = true; continue;
      }
      return null;
    }
    return used ? total + current : null;
  }

  function convertSpokenNumbers(text) {
    return String(text == null ? '' : text).replace(SPOKEN_NUMBER_RE, (all, before, phrase) => {
      const parsed = parseNumber(phrase.trim().split(/\s+/));
      return parsed == null ? all : before + toPersianDigits(parsed);
    });
  }

  function normalizeBase(value) {
    return String(value == null ? '' : value)
      .replace(/\u064A/g,'ی').replace(/\u0649/g,'ی').replace(/\u0643/g,'ک').replace(/[\u0640]/g,'')
      .replace(/[ \t]+/g,' ').replace(/\s+([،؛؟.!])/g,'$1').trim();
  }

  function normalizePoultryTerms(value) {
    let text = normalizeBase(value);
    const protectedTokens = [
      [/پی\s*سی\s*آر/gi,'__PCR__'],[/ال\s*ای\s*زا/gi,'__ELISA__'],
      [/اف\s*سی\s*آر/gi,'__FCR__'],[/سی\s*وی/gi,'__CV__'],
      [/کیو\s*پی\s*سی\s*آر/gi,'__QPCR__'],[/آر\s*تی\s*پی\s*سی\s*آر/gi,'__RTPCR__'],
      [/اچ\s*وی\s*تی/gi,'__HVT__'],[/آی\s*بی\s*وی/gi,'__IBV__'],[/آی\s*بی\s*دی/gi,'__IBD__'],
      [/آی\s*ال\s*تی/gi,'__ILT__'],[/اِی\s*آی/gi,'__AI__'],[/اِن\s*دی/gi,'__ND__']
    ];
    for (const [re, token] of protectedTokens) text = text.replace(re, token);
    text = convertSpokenNumbers(text);
    const replacements = [
      [/مایکو\s*پلا[زظ]ما/gi,'مایکوپلاسما'],[/گامبورو/gi,'گامبورو'],[/نیوکاسل/gi,'نیوکاسل'],
      [/برونشیت\s+عفونی/gi,'برونشیت عفونی'],[/لارنگو\s*تراکئیت/gi,'لارنگوتراکئیت'],
      [/کیسه\s*های\s*هوایی/gi,'کیسه‌های هوایی'],[/کیسه\s+هوایی/gi,'کیسه هوایی'],
      [/کوکسیدیوز/gi,'کوکسیدیوز'],[/آنتی\s*بیوگرام/gi,'آنتی‌بیوگرام'],[/آنتی\s*بادی/gi,'آنتی‌بادی'],
      [/بورس\s+فابریسیوس/gi,'بورس فابریسیوس'],[/فابریسیوس/gi,'فابریسیوس'],
      [/پودو\s*درماتیت/gi,'پودودرماتیت'],[/آسیت/gi,'آسیت'],[/تنوسینوویت/gi,'تنوسینوویت'],
      [/کلی\s*باسیلوز/gi,'کلی‌باسیلوز'],[/اشرشیا\s*کلی/gi,'اشرشیاکلی'],
      [/سالمونلا/gi,'سالمونلا'],[/کلستریدیوم/gi,'کلستریدیوم'],[/آسپرژیلوز/gi,'آسپرژیلوز'],
      [/کیسه هوایی/gi,'کیسه هوایی'],[/سینوزیت/gi,'سینوزیت'],[/تراشه/gi,'تراشه'],
      [/سرولوژی/gi,'سرولوژی'],[/تیتر\s+آنتی\s*بادی/gi,'تیتر آنتی‌بادی'],
      [/آنتی\s*بیوتیک/gi,'آنتی‌بیوتیک'],[/دهیدراتاسیون/gi,'دهیدراتاسیون'],
      [/گرمازدگی/gi,'گرمازدگی'],[/تهویه/gi,'تهویه'],[/آمونیاک/gi,'آمونیاک']
    ];
    for (const [re, replacement] of replacements) text = text.replace(re,replacement);
    return text.replace(/__PCR__/g,'PCR').replace(/__ELISA__/g,'ELISA').replace(/__FCR__/g,'FCR')
      .replace(/__CV__/g,'CV').replace(/__QPCR__/g,'qPCR').replace(/__RTPCR__/g,'RT-PCR')
      .replace(/__HVT__/g,'HVT').replace(/__IBV__/g,'IBV').replace(/__IBD__/g,'IBD')
      .replace(/__ILT__/g,'ILT').replace(/__AI__/g,'AI').replace(/__ND__/g,'ND');
  }

  function isEligible(el) {
    if (!el || el.nodeType !== 1 || el.disabled || el.readOnly || el.hidden) return false;
    if (el.dataset.voiceDisabled === 'true' || el.hasAttribute('data-no-voice')) return false;
    if (el.closest('[data-voice-disabled="true"],.no-voice')) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (type !== 'text' && type !== 'search') return false;
    if (NUMERIC_MODE.test(el.getAttribute('inputmode') || '')) return false;
    if (el.classList.contains('jalali-input')) return false;
    if (DENY_ID.test(el.id || '') || DENY_NAME.test(el.name || '')) return false;
    return true;
  }

  function fieldLabel(el) {
    if (el.id && window.CSS && CSS.escape) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) return label.textContent.trim();
    }
    const parent = el.closest('label');
    return parent ? parent.textContent.trim() : 'متن';
  }

  function dispatchInput(el) {
    try { el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); } catch (_) {}
  }

  function setValue(el,value) {
    const normalized = normalizePoultryTerms(value);
    if (el.value !== normalized) { el.value = normalized; dispatchInput(el); }
  }

  function getState(el) {
    let s = state.get(el);
    if (!s) { s = {recognition:null,baseValue:'',finalText:'',finalIndexes:new Set(),button:null,status:null,stopping:false,restarts:0,restartTimer:null}; state.set(el,s); }
    return s;
  }

  function setStatus(s,text,kind) { if (s.status) { s.status.textContent=text||''; s.status.dataset.state=kind||''; } }
  function render(s,el,interim) {
    const spoken = `${s.finalText}${interim ? ` ${normalizePoultryTerms(interim)}` : ''}`.trim();
    setValue(el,`${s.baseValue}${s.baseValue && spoken ? ' ' : ''}${spoken}`.trim());
  }

  function finish(el) {
    const s=getState(el);
    if (s.restartTimer) { clearTimeout(s.restartTimer); s.restartTimer=null; }
    render(s,el,''); s.recognition=null; s.stopping=false; s.restarts=0;
    if (s.button) { s.button.dataset.recording='false'; s.button.dataset.processing='false'; }
    setStatus(s,'',''); if (active && active.el===el) active=null;
  }

  function cleanupActive() {
    if (!active) return;
    const {el,s}=active;
    if (s.restartTimer) { clearTimeout(s.restartTimer); s.restartTimer=null; }
    try { if (s.recognition) s.recognition.abort(); } catch (_) {}
    s.recognition=null; s.stopping=false;
    if (s.button) { s.button.dataset.recording='false'; s.button.dataset.processing='false'; }
    setStatus(s,'',''); active=null;
  }

  function stop(el) {
    const s=getState(el); if (!s.recognition) return;
    s.stopping=true; if (s.button) s.button.dataset.processing='true'; setStatus(s,'در حال تکمیل متن…','processing');
    try { s.recognition.stop(); } catch (_) { finish(el); }
  }

  function start(el) {
    if (!Recognition) { setStatus(getState(el),'این مرورگر قابلیت گفتار به متن را ندارد.','error'); return; }
    if (active && active.el!==el) cleanupActive();
    const s=getState(el);
    if (s.recognition) { stop(el); return; }
    const r=new Recognition();
    r.lang=CONFIG.lang; r.continuous=CONFIG.continuous; r.interimResults=CONFIG.interimResults; r.maxAlternatives=CONFIG.maxAlternatives;
    s.recognition=r; s.baseValue=normalizePoultryTerms(el.value||'').trim(); s.finalText=''; s.finalIndexes=new Set(); s.stopping=false; s.restarts=0; active={el,s};
    if (s.button) { s.button.dataset.recording='true'; s.button.dataset.processing='false'; }
    setStatus(s,'در حال شنیدن… برای توقف دوباره بزنید.','recording');

    r.onresult=function(event){
      let interim='';
      for(let i=event.resultIndex;i<event.results.length;i++){
        const result=event.results[i]; const phrase=result && result[0] ? result[0].transcript : '';
        if(result.isFinal){ if(!s.finalIndexes.has(i)){s.finalIndexes.add(i); s.finalText += `${s.finalText?' ':''}${normalizePoultryTerms(phrase).trim()}`;} }
        else interim += `${interim?' ':''}${phrase}`;
      }
      render(s,el,interim);
    };

    r.onerror=function(event){
      const code=event && event.error;
      if(code==='aborted' && s.stopping) return;
      const messages={
        'not-allowed':'دسترسی به میکروفن داده نشد.','service-not-allowed':'سرویس تشخیص گفتار در دسترس نیست.',
        'no-speech':'صدایی دریافت نشد؛ دوباره تلاش کنید.','audio-capture':'میکروفن در دسترس نیست.',
        'network':'ارتباط سرویس گفتار برقرار نشد.','language-not-supported':'تشخیص زبان فارسی در این مرورگر در دسترس نیست.'
      };
      render(s,el,''); setStatus(s,messages[code]||'خطا در تبدیل گفتار به متن.','error');
      s.recognition=null; if(s.button){s.button.dataset.recording='false';s.button.dataset.processing='false';}
      if(active && active.el===el) active=null;
    };

    r.onend=function(){
      if(s.stopping){finish(el);return;}
      if(!s.recognition || !active || active.el!==el) return;
      if(s.restarts>=CONFIG.maxUnexpectedRestarts){finish(el);setStatus(s,'اتصال گفتار متوقف شد؛ دوباره شروع کنید.','error');return;}
      s.restarts++;
      if(s.restartTimer) clearTimeout(s.restartTimer);
      s.restartTimer=setTimeout(()=>{s.restartTimer=null;if(!s.stopping && s.recognition===r){try{r.start();}catch(_){finish(el);setStatus(s,'شروع دوباره میکروفن ممکن نشد؛ دوباره تلاش کنید.','error');}}},CONFIG.restartDelay);
    };
    try{r.start();}catch(_){s.recognition=null;if(s.button)s.button.dataset.recording='false';setStatus(s,'شروع میکروفن ممکن نشد؛ دوباره تلاش کنید.','error');if(active&&active.el===el)active=null;}
  }

  function makeButton(el){
    const b=document.createElement('button'); b.type='button'; b.className=CONFIG.buttonClass;
    b.setAttribute('aria-label',`تبدیل گفتار به متن برای ${fieldLabel(el)}`); b.setAttribute('title','گفتار به متن فارسی');
    b.innerHTML='<span aria-hidden="true">🎙️</span>'; return b;
  }

  function injectStyles(){
    if(document.getElementById('adine-voice-style'))return;
    const style=document.createElement('style'); style.id='adine-voice-style'; style.textContent=`
      .${CONFIG.wrapperClass}{position:relative;display:block;width:100%}
      .${CONFIG.wrapperClass}>input,.${CONFIG.wrapperClass}>textarea{padding-left:50px!important}
      .${CONFIG.buttonClass}{position:absolute;left:7px;top:7px;width:36px;height:36px;border:1px solid #d8e0e5;border-radius:10px;background:#fff;display:inline-flex;align-items:center;justify-content:center;padding:0;cursor:pointer;font:inherit;z-index:3;box-shadow:0 1px 4px rgba(0,0,0,.08);-webkit-tap-highlight-color:transparent;touch-action:manipulation}
      .${CONFIG.wrapperClass}>textarea+.${CONFIG.buttonClass}{top:8px}.${CONFIG.buttonClass}:focus-visible{outline:3px solid rgba(36,93,77,.22);outline-offset:1px}
      .${CONFIG.buttonClass}[data-recording="true"]{background:#fff1f0;border-color:#e5484d;box-shadow:0 0 0 3px rgba(229,72,77,.12)}
      .${CONFIG.buttonClass}[data-processing="true"]{opacity:.65;cursor:wait}.${CONFIG.buttonClass} span{font-size:17px;line-height:1}
      .adine-voice-status{position:absolute;left:8px;bottom:-21px;font-size:10px;color:#667085;pointer-events:none;z-index:4;white-space:nowrap}
      .adine-voice-status[data-state="recording"]{color:#b42318;font-weight:700}.adine-voice-status[data-state="error"]{color:#b42318}
      @media(max-width:520px){.${CONFIG.buttonClass}{width:38px;height:38px}.adine-voice-status{font-size:9px}}
    `; document.head.appendChild(style);
  }

  function attach(el){
    if(!isEligible(el)||el.dataset.adineVoiceAttached==='1')return;
    const parent=el.parentElement;if(!parent)return;
    const wrapper=document.createElement('span');wrapper.className=CONFIG.wrapperClass;wrapper.dataset.voiceField='1';
    parent.insertBefore(wrapper,el);wrapper.appendChild(el);
    const button=makeButton(el),status=document.createElement('span');status.className='adine-voice-status';status.setAttribute('aria-live','polite');
    wrapper.appendChild(button);wrapper.appendChild(status);
    const s=getState(el);s.button=button;s.status=status;el.dataset.adineVoiceAttached='1';button.addEventListener('click',()=>start(el));
  }

  function scan(root){if(!root||!root.querySelectorAll)return;root.querySelectorAll('textarea,input').forEach(attach);}
  function init(){
    if(document.documentElement.dataset.adineVoiceInitialized==='1')return;
    document.documentElement.dataset.adineVoiceInitialized='1';injectStyles();scan(document);
    observer=new MutationObserver(mutations=>mutations.forEach(m=>m.addedNodes.forEach(node=>{if(node.nodeType===1){if(node.matches&&node.matches('textarea,input'))attach(node);scan(node);}})));
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('beforeunload',cleanupActive,{once:true});
  }

  window.AdineVoiceInput={version:CONFIG.version,supported:!!Recognition,init,normalize:normalizePoultryTerms,toPersianDigits,attach,scan};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
