/* =========================================================
   ADINE PERSIAN VOICE FALLBACK v1.0.0
   MediaRecorder -> authenticated Supabase Edge Function -> STT.
   No direct provider key in browser. No audio persistence.
========================================================= */
(function () {
  'use strict';
  if (window.AdineVoiceFallback) return;

  const FUNCTION_NAME = 'persian-voice-transcribe';
  const BUTTON = '.adine-voice-button';
  const WRAPPER = '.adine-voice-field';
  const MAX_BYTES = 10 * 1024 * 1024;
  const FALLBACK_ERROR = 'سرویس تشخیص گفتار در دسترس نیست.';
  const state = new WeakMap();
  const markedFallback = new WeakSet();
  let observer = null;

  const DENY_ID = /(password|passwd|secret|token|code|otp|captcha|search|url|email|phone|mobile|username|user-name|farmcode|flockcode|verification)/i;
  const DENY_NAME = /(password|passwd|secret|token|otp|captcha|email|phone|mobile|username|url|code|verification)/i;
  const NUMBER_INPUT = /^(number|range|date|datetime-local|month|week|time|tel)$/i;

  function eligible(el) {
    if (!el || el.disabled || el.readOnly || el.hidden) return false;
    if (el.dataset.voiceDisabled === 'true' || el.hasAttribute('data-no-voice')) return false;
    if (el.closest('[data-voice-disabled="true"],.no-voice')) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (type !== 'text' || NUMBER_INPUT.test(type)) return false;
    if (/^(numeric|decimal|tel)$/i.test(el.getAttribute('inputmode') || '')) return false;
    if (el.classList.contains('jalali-input')) return false;
    if (DENY_ID.test(el.id || '') || DENY_NAME.test(el.name || '')) return false;
    return true;
  }

  function normalize(value) {
    let text = String(value == null ? '' : value)
      .replace(/\u064A/g, 'ی').replace(/\u0649/g, 'ی').replace(/\u0643/g, 'ک')
      .replace(/[\u0640]/g, '').replace(/[ \t]+/g, ' ')
      .replace(/\s+([،؛؟.!])/g, '$1').trim();
    text = text.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
    text = text.replace(/[٠-٩]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d.charCodeAt(0) - 0x0660]);
    const terms = [
      [/کیو\s*پی\s*سی\s*آر/gi, 'qPCR'], [/آر\s*تی\s*پی\s*سی\s*آر/gi, 'RT-PCR'],
      [/پی\s*سی\s*آر/gi, 'PCR'], [/ال\s*ای\s*زا/gi, 'ELISA'],
      [/اف\s*سی\s*آر/gi, 'FCR'], [/سی\s*وی/gi, 'CV'], [/اچ\s*وی\s*تی/gi, 'HVT'],
      [/آی\s*بی\s*وی/gi, 'IBV'], [/آی\s*بی\s*دی/gi, 'IBD'], [/آی\s*ال\s*تی/gi, 'ILT'],
      [/اِن\s*دی/gi, 'ND'], [/مایکو\s*پلا[زظ]ما/gi, 'مایکوپلاسما'],
      [/کیسه\s*های\s*هوایی/gi, 'کیسه‌های هوایی'], [/آنتی\s*بادی/gi, 'آنتی‌بادی'],
      [/آنتی\s*بیوگرام/gi, 'آنتی‌بیوگرام'], [/کلی\s*باسیلوز/gi, 'کلی‌باسیلوز'],
      [/پودو\s*درماتیت/gi, 'پودودرماتیت'], [/لارنگو\s*تراکئیت/gi, 'لارنگوتراکئیت']
    ];
    for (const [re, replacement] of terms) text = text.replace(re, replacement);
    return text;
  }

  function getField(wrapper) {
    return wrapper && wrapper.querySelector('textarea,input[type="text"]');
  }

  function getStatus(wrapper) {
    return wrapper && wrapper.querySelector('.adine-voice-status');
  }

  function setStatus(wrapper, text, kind) {
    const status = getStatus(wrapper);
    if (status) { status.textContent = text || ''; status.dataset.state = kind || ''; }
  }

  function dispatchInput(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function mimeType() {
    if (!window.MediaRecorder) return '';
    const candidates = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    for (const type of candidates) {
      try { if (MediaRecorder.isTypeSupported(type)) return type; } catch (_) {}
    }
    return '';
  }

  function markFallback(wrapper) {
    if (!wrapper) return;
    markedFallback.add(wrapper);
    wrapper.dataset.adineVoiceFallback = 'true';
    setStatus(wrapper, 'حالت جایگزین آماده است؛ برای ضبط دوباره بزنید.', 'fallback');
  }

  function hasNativeRecognition() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  async function upload(blob, mime) {
    if (!window.supabaseClient || !window.supabaseClient.functions) throw new Error('SUPABASE_CLIENT_UNAVAILABLE');
    const form = new FormData();
    const ext = mime.startsWith('audio/mp4') ? 'm4a' : mime.startsWith('audio/ogg') ? 'ogg' : 'webm';
    form.append('file', new File([blob], `voice.${ext}`, { type: mime || blob.type || 'audio/webm' }));
    const result = await window.supabaseClient.functions.invoke(FUNCTION_NAME, { body: form });
    if (result.error) throw result.error;
    if (!result.data || typeof result.data.text !== 'string') throw new Error('INVALID_STT_RESPONSE');
    return normalize(result.data.text);
  }

  async function startFallback(wrapper, field, button) {
    const existing = state.get(wrapper);
    if (existing && existing.recording) {
      existing.stopRequested = true;
      try { existing.recorder.stop(); } catch (_) {}
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      setStatus(wrapper, 'ضبط صدا در این مرورگر در دسترس نیست.', 'error');
      return;
    }
    const mime = mimeType();
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (error) {
      const denied = error && (error.name === 'NotAllowedError' || error.name === 'SecurityError');
      setStatus(wrapper, denied ? 'دسترسی به میکروفن داده نشد.' : 'میکروفن در دسترس نیست.', 'error');
      return;
    }

    const chunks = [];
    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    const current = { recorder, stream, recording: true, stopRequested: false };
    state.set(wrapper, current);
    button.dataset.recording = 'true';
    button.dataset.processing = 'false';
    setStatus(wrapper, 'در حال ضبط… برای توقف دوباره بزنید.', 'recording');

    recorder.ondataavailable = event => { if (event.data && event.data.size) chunks.push(event.data); };
    recorder.onerror = () => { try { stream.getTracks().forEach(t => t.stop()); } catch (_) {} state.delete(wrapper); button.dataset.recording = 'false'; setStatus(wrapper, 'خطا در ضبط صدا.', 'error'); };
    recorder.onstop = async () => {
      try { stream.getTracks().forEach(t => t.stop()); } catch (_) {}
      state.delete(wrapper);
      button.dataset.recording = 'false';
      button.dataset.processing = 'true';
      setStatus(wrapper, 'در حال تبدیل گفتار به متن…', 'processing');
      const blob = new Blob(chunks, { type: mime || 'audio/webm' });
      try {
        if (blob.size > MAX_BYTES) throw new Error('AUDIO_TOO_LARGE');
        if (!blob.size) throw new Error('AUDIO_EMPTY');
        const text = await upload(blob, mime || blob.type || 'audio/webm');
        if (text) {
          const base = normalize(field.value || '').trim();
          field.value = `${base}${base ? ' ' : ''}${text}`.trim();
          dispatchInput(field);
        }
        setStatus(wrapper, '', '');
      } catch (error) {
        const code = error && error.message;
        const messages = {
          VOICE_SERVICE_NOT_CONFIGURED: 'سرویس گفتار هنوز پیکربندی نشده است.',
          VOICE_TRANSCRIPTION_FAILED: 'تبدیل گفتار به متن انجام نشد؛ دوباره تلاش کنید.',
          AUDIO_TOO_LARGE: 'صدای ضبط‌شده بیش از حد مجاز است.',
          AUDIO_EMPTY: 'صدایی برای تبدیل دریافت نشد.',
          SUPABASE_CLIENT_UNAVAILABLE: 'اتصال برنامه به سرویس گفتار برقرار نشد.'
        };
        setStatus(wrapper, messages[code] || 'تبدیل گفتار به متن انجام نشد؛ دوباره تلاش کنید.', 'error');
      } finally { button.dataset.processing = 'false'; }
    };
    recorder.start(250);
  }

  function shouldFallback(wrapper) {
    return !hasNativeRecognition() || markedFallback.has(wrapper) || wrapper.dataset.adineVoiceFallback === 'true';
  }

  function clickHandler(event) {
    const button = event.target && event.target.closest ? event.target.closest(BUTTON) : null;
    if (!button) return;
    const wrapper = button.closest(WRAPPER);
    const field = getField(wrapper);
    if (!wrapper || !field || !eligible(field) || !shouldFallback(wrapper)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    startFallback(wrapper, field, button);
  }

  function scanFallbackErrors(root) {
    const wrappers = (root && root.matches && root.matches(WRAPPER)) ? [root] : Array.from((root || document).querySelectorAll ? root.querySelectorAll(WRAPPER) : []);
    for (const wrapper of wrappers) {
      const status = getStatus(wrapper);
      if (status && status.textContent && status.textContent.indexOf(FALLBACK_ERROR) !== -1) markFallback(wrapper);
    }
  }

  function init() {
    if (hasNativeRecognition()) {
      observer = new MutationObserver(mutations => { for (const m of mutations) for (const node of m.addedNodes) if (node.nodeType === 1) scanFallbackErrors(node); scanFallbackErrors(document); });
      observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
      scanFallbackErrors(document);
    }
    document.addEventListener('click', clickHandler, true);
  }

  window.AdineVoiceFallback = Object.freeze({ version: '1.0.0', start: startFallback, markFallback });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
