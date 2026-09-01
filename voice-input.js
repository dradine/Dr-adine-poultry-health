/* =========================================================
   ADINE GLOBAL PERSIAN VOICE INPUT v1
   UI-only speech-to-text layer.
   No Supabase calls. No business logic. No calculations.
========================================================= */
(function () {
  'use strict';

  if (window.AdineVoiceInput) return;

  const CONFIG = {
    lang: 'fa-IR',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1,
    buttonClass: 'adine-voice-button',
    wrapperClass: 'adine-voice-field',
    version: '1.0.1'
  };

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const state = new WeakMap();
  let active = null;

  const DENY_ID = /(password|passwd|secret|token|code|otp|captcha|search|url|email|phone|mobile|username|user-name)/i;
  const DENY_NAME = /(password|passwd|secret|token|otp|captcha|email|phone|mobile|username|url)/i;
  const NUMERIC_MODE = /^(numeric|decimal|tel)$/i;

  function toPersianDigits(value) {
    return String(value == null ? '' : value)
      .replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])
      .replace(/[٠-٩]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d.charCodeAt(0) - 0x0660]);
  }

  const NUMBER_WORDS = Object.freeze({
    'صفر':0,'یک':1,'دو':2,'سه':3,'چهار':4,'پنج':5,'شش':6,'هفت':7,'هشت':8,'نه':9,'ده':10,
    'یازده':11,'دوازده':12,'سیزده':13,'چهارده':14,'پانزده':15,'شانزده':16,'هفده':17,'هجده':18,'نوزده':19,
    'بیست':20,'سی':30,'چهل':40,'پنجاه':50,'شصت':60,'هفتاد':70,'هشتاد':80,'نود':90,
    'صد':100,'یکصد':100,'دویست':200,'سیصد':300,'چهارصد':400,'پانصد':500,'ششصد':600,'هفتصد':700,'هشتصد':800,'نهصد':900
  });
  const SCALE_WORDS = Object.freeze({'هزار':1000,'میلیون':1000000,'میلیارد':1000000000});

  function parsePersianNumberWords(tokens) {
    let total = 0, current = 0, used = false;
    for (const token of tokens) {
      if (Object.prototype.hasOwnProperty.call(NUMBER_WORDS, token)) {
        current += NUMBER_WORDS[token]; used = true; continue;
      }
      if (token === 'و') { if (used) continue; return null; }
      if (Object.prototype.hasOwnProperty.call(SCALE_WORDS, token)) {
        const scale = SCALE_WORDS[token];
        total += (current || 1) * scale; current = 0; used = true; continue;
      }
      return null;
    }
    return used ? total + current : null;
  }

  function convertSpokenPersianNumbers(value) {
    const text = String(value == null ? '' : value);
    const words = '(?:صفر|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|یازده|دوازده|سیزده|چهارده|پانزده|شانزده|هفده|هجده|نوزده|بیست|سی|چهل|پنجاه|شصت|هفتاد|هشتاد|نود|صد|یکصد|دویست|سیصد|چهارصد|پانصد|ششصد|هفتصد|هشتصد|نهصد|هزار|میلیون|میلیارد|و)';
    const re = new RegExp('(^|\\s)(' + words + '(?:\\s+' + words + ')*)($|\\s)', 'g');
    return text.replace(re, (all, before, phrase, after) => {
      const parsed = parsePersianNumberWords(phrase.trim().split(/\s+/));
      return parsed == null ? all : before + toPersianDigits(parsed) + after;
    });
  }

  function normalizeArabicPersianText(value) {
    return convertSpokenPersianNumbers(toPersianDigits(String(value == null ? '' : value)
      .replace(/\u064A/g, 'ی')
      .replace(/\u0649/g, 'ی')
      .replace(/\u0643/g, 'ک')
      .replace(/[\u0640]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s+([،؛؟.!])/g, '$1')
      .trim()));
  }

  function normalizePoultryTerms(value) {
    let text = String(value == null ? '' : value);
    const protectedTokens = [
      [/پی\s*سی\s*آر/gi, '__ADINE_PCR__'],
      [/ال\s*ای\s*زا/gi, '__ADINE_ELISA__'],
      [/اف\s*سی\s*آر/gi, '__ADINE_FCR__'],
      [/سی\s*وی/gi, '__ADINE_CV__']
    ];
    for (const [pattern, token] of protectedTokens) text = text.replace(pattern, token);
    text = normalizeArabicPersianText(text);
    const replacements = [
      [/مایکو\s*پلاسما/g, 'مایکوپلاسما'],
      [/مایکو\s*پلازما/g, 'مایکوپلاسما'],
      [/گامبورو/g, 'گامبورو'],
      [/نیوکاسل/g, 'نیوکاسل'],
      [/برونشیت\s+عفونی/g, 'برونشیت عفونی'],
      [/لارنگو\s*تراکئیت/g, 'لارنگوتراکئیت'],
      [/کیسه\s*های\s*هوایی/g, 'کیسه‌های هوایی'],
      [/کیسه\s+هوایی/g, 'کیسه هوایی'],
      [/تراشه/g, 'تراشه'],
      [/کوکسیدیوز/g, 'کوکسیدیوز'],
      [/آنتی\s*بیوگرام/g, 'آنتی‌بیوگرام'],
      [/آنتی\s*بادی/g, 'آنتی‌بادی']
    ];
    for (const [pattern, replacement] of replacements) text = text.replace(pattern, replacement);
    return text
      .replace(/__ADINE_PCR__/g, 'PCR')
      .replace(/__ADINE_ELISA__/g, 'ELISA')
      .replace(/__ADINE_FCR__/g, 'FCR')
      .replace(/__ADINE_CV__/g, 'CV');
  }

  function isEligible(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.disabled || el.readOnly || el.hidden) return false;
    if (el.dataset.voiceDisabled === 'true' || el.hasAttribute('data-no-voice')) return false;
    if (el.closest('[data-voice-disabled="true"], .no-voice')) return false;

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
    const id = el.id;
    if (id && window.CSS && CSS.escape) {
      const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (label) return label.textContent.trim();
    }
    const parentLabel = el.closest('label');
    return parentLabel ? parentLabel.textContent.trim() : 'متن';
  }

  function emitInput(el) {
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) {}
  }

  function setValue(el, value) {
    const normalized = normalizePoultryTerms(value);
    if (el.value !== normalized) {
      el.value = normalized;
      emitInput(el);
    }
  }

  function makeButton(el) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = CONFIG.buttonClass;
    button.setAttribute('aria-label', `تبدیل گفتار به متن برای ${fieldLabel(el)}`);
    button.setAttribute('title', 'گفتار به متن فارسی');
    button.innerHTML = '<span aria-hidden="true">🎙️</span>';
    return button;
  }

  function injectStyles() {
    if (document.getElementById('adine-voice-style')) return;
    const style = document.createElement('style');
    style.id = 'adine-voice-style';
    style.textContent = `
      .${CONFIG.wrapperClass}{position:relative;display:block;width:100%}
      .${CONFIG.wrapperClass} > input,.${CONFIG.wrapperClass} > textarea{padding-left:48px!important}
      .${CONFIG.buttonClass}{position:absolute;left:7px;top:7px;width:34px;height:34px;border:1px solid #d8e0e5;border-radius:10px;background:#fff;display:inline-flex;align-items:center;justify-content:center;padding:0;cursor:pointer;font:inherit;z-index:3;box-shadow:0 1px 4px rgba(0,0,0,.08);-webkit-tap-highlight-color:transparent}
      .${CONFIG.wrapperClass} > textarea + .${CONFIG.buttonClass}{top:8px}
      .${CONFIG.buttonClass}:hover{background:#f5f8f7}
      .${CONFIG.buttonClass}:focus-visible{outline:3px solid rgba(36,93,77,.22);outline-offset:1px}
      .${CONFIG.buttonClass}[data-recording="true"]{background:#fff1f0;border-color:#e5484d;box-shadow:0 0 0 3px rgba(229,72,77,.12)}
      .${CONFIG.buttonClass}[data-processing="true"]{opacity:.65;cursor:wait}
      .${CONFIG.buttonClass} span{font-size:17px;line-height:1}
      .adine-voice-status{position:absolute;left:8px;bottom:-21px;font-size:10px;color:#667085;pointer-events:none;z-index:4;white-space:nowrap}
      .adine-voice-status[data-state="recording"]{color:#b42318;font-weight:700}
      .adine-voice-status[data-state="error"]{color:#b42318}
      @media(max-width:520px){.${CONFIG.buttonClass}{width:36px;height:36px}.adine-voice-status{font-size:9px}}
    `;
    document.head.appendChild(style);
  }

  function getState(el) {
    let s = state.get(el);
    if (!s) {
      s = { recognition: null, finalText: '', baseValue: '', button: null, status: null, stopping: false };
      state.set(el, s);
    }
    return s;
  }

  function setStatus(s, text, kind) {
    if (!s.status) return;
    s.status.textContent = text || '';
    s.status.dataset.state = kind || '';
  }

  function cleanupActive() {
    if (!active) return;
    const { s } = active;
    try { s.recognition && s.recognition.abort(); } catch (_) {}
    s.recognition = null;
    s.stopping = false;
    if (s.button) {
      s.button.dataset.recording = 'false';
      s.button.dataset.processing = 'false';
    }
    setStatus(s, '', '');
    active = null;
  }

  function finish(el) {
    const s = getState(el);
    if (s.finalText) setValue(el, `${s.baseValue}${s.baseValue && s.finalText ? ' ' : ''}${s.finalText}`);
    s.recognition = null;
    s.stopping = false;
    if (s.button) {
      s.button.dataset.recording = 'false';
      s.button.dataset.processing = 'false';
    }
    setStatus(s, '', '');
    if (active && active.el === el) active = null;
  }

  function stop(el) {
    const s = getState(el);
    if (!s.recognition) return;
    s.stopping = true;
    if (s.button) s.button.dataset.processing = 'true';
    setStatus(s, 'در حال تکمیل متن…', 'processing');
    try { s.recognition.stop(); } catch (_) { finish(el); }
  }

  function start(el) {
    if (!SpeechRecognition) {
      const s = getState(el);
      setStatus(s, 'مرورگر از گفتار به متن فارسی پشتیبانی نمی‌کند.', 'error');
      return;
    }

    if (active && active.el !== el) cleanupActive();
    const s = getState(el);
    if (s.recognition) { stop(el); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = CONFIG.lang;
    recognition.continuous = CONFIG.continuous;
    recognition.interimResults = CONFIG.interimResults;
    recognition.maxAlternatives = CONFIG.maxAlternatives;

    s.recognition = recognition;
    s.baseValue = normalizePoultryTerms(el.value || '').trim();
    s.finalText = '';
    s.stopping = false;
    active = { el, s };

    if (s.button) {
      s.button.dataset.recording = 'true';
      s.button.dataset.processing = 'false';
    }
    setStatus(s, 'در حال شنیدن… برای توقف دوباره بزنید.', 'recording');

    recognition.onresult = function (event) {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const phrase = event.results[i][0] && event.results[i][0].transcript || '';
        if (event.results[i].isFinal) finalChunk += ` ${phrase}`;
        else interim += ` ${phrase}`;
      }
      if (finalChunk) s.finalText += ` ${normalizePoultryTerms(finalChunk)}`;
      const live = `${s.baseValue}${s.baseValue && (s.finalText || interim) ? ' ' : ''}${s.finalText}${interim ? ` ${normalizePoultryTerms(interim)}` : ''}`.trim();
      setValue(el, live);
    };

    recognition.onerror = function (event) {
      const code = event && event.error;
      if (code === 'aborted' && s.stopping) return;
      const messages = {
        'not-allowed': 'دسترسی به میکروفن داده نشد.',
        'service-not-allowed': 'سرویس تشخیص گفتار در دسترس نیست.',
        'no-speech': 'صدایی دریافت نشد؛ دوباره تلاش کنید.',
        'audio-capture': 'میکروفن در دسترس نیست.',
        'network': 'ارتباط سرویس گفتار برقرار نشد.'
      };
      setStatus(s, messages[code] || 'خطا در تبدیل گفتار به متن.', 'error');
      s.recognition = null;
      if (s.button) { s.button.dataset.recording = 'false'; s.button.dataset.processing = 'false'; }
      if (active && active.el === el) active = null;
    };

    recognition.onend = function () {
      if (s.stopping) finish(el);
      else if (s.recognition && active && active.el === el) {
        try { recognition.start(); } catch (_) { finish(el); }
      }
    };

    try {
      recognition.start();
    } catch (_) {
      s.recognition = null;
      if (s.button) s.button.dataset.recording = 'false';
      setStatus(s, 'شروع میکروفن ممکن نشد؛ دوباره تلاش کنید.', 'error');
      if (active && active.el === el) active = null;
    }
  }

  function attach(el) {
    if (!isEligible(el) || el.dataset.adineVoiceAttached === '1') return;
    const parent = el.parentElement;
    if (!parent) return;

    const wrapper = document.createElement('span');
    wrapper.className = CONFIG.wrapperClass;
    wrapper.dataset.voiceField = '1';
    parent.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    const button = makeButton(el);
    const status = document.createElement('span');
    status.className = 'adine-voice-status';
    status.setAttribute('aria-live', 'polite');
    wrapper.appendChild(button);
    wrapper.appendChild(status);

    const s = getState(el);
    s.button = button;
    s.status = status;
    el.dataset.adineVoiceAttached = '1';
    button.addEventListener('click', () => start(el));
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('textarea,input').forEach(attach);
  }

  function init() {
    if (document.documentElement.dataset.adineVoiceInitialized === '1') return;
    document.documentElement.dataset.adineVoiceInitialized = '1';
    injectStyles();
    scan(document);

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.matches && node.matches('textarea,input')) attach(node);
            scan(node);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('beforeunload', cleanupActive, { once: true });
  }

  window.AdineVoiceInput = {
    version: CONFIG.version,
    supported: !!SpeechRecognition,
    init,
    normalize: normalizePoultryTerms,
    toPersianDigits,
    attach,
    scan
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
