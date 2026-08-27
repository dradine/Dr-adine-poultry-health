/* ADINE Weekly History Delete UI v3
   Directly decorates the existing Edit action. No dependency on table markup.
*/
(function () {
  'use strict';

  const HISTORY = 'weeklyHistory';
  const DELETE_CLASS = 'weekly-delete-record-v3';

  function normalizeDigits(value) {
    return String(value ?? '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  }

  function getRecords() {
    try {
      if (typeof weeklyRecords !== 'undefined' && Array.isArray(weeklyRecords)) return weeklyRecords;
    } catch (_) {}
    return [];
  }

  function getFlock() {
    try {
      if (typeof currentFlock !== 'undefined' && currentFlock) return currentFlock;
    } catch (_) {}
    return window.currentFlockForSpecialized || window.currentFlock || null;
  }

  function weekOf(record, row) {
    const direct = record?.week_number ?? record?.weekNumber ?? record?.week;
    if (direct != null) return String(direct);
    const text = String(row?.textContent || '');
    const m = text.match(/هفته\s*([0-9۰-۹]+)/);
    return m ? normalizeDigits(m[1]) : '';
  }

  function findRecord(row, index) {
    const records = getRecords();
    if (!records.length) return null;
    const attr = row.getAttribute('data-record-id') || row.dataset.recordId;
    if (attr) {
      const byId = records.find(r => String(r.id) === String(attr));
      if (byId) return byId;
    }
    const edit = Array.from(row.querySelectorAll('button, a')).find(el => /ویرایش|edit/i.test(el.textContent || ''));
    const onclick = edit?.getAttribute('onclick') || '';
    const idMatch = onclick.match(/['"]([0-9a-f-]{20,})['"]/i);
    if (idMatch) {
      const byId = records.find(r => String(r.id) === idMatch[1]);
      if (byId) return byId;
    }
    const week = weekOf(null, row);
    if (week) {
      const byWeek = records.find(r => normalizeDigits(r.week_number ?? r.weekNumber ?? r.week) === normalizeDigits(week));
      if (byWeek) return byWeek;
    }
    return records[index] || null;
  }

  async function performDelete(record, button) {
    const flock = getFlock();
    if (!record?.id) { alert('شناسه سابقه پایش پیدا نشد؛ حذف انجام نشد.'); return; }
    if (!flock?.id) { alert('گله فعال مشخص نیست؛ حذف انجام نشد.'); return; }

    let authUser = null;
    try { authUser = (await window.supabaseClient.auth.getUser())?.data?.user || null; } catch (_) {}
    if (!authUser) { alert('برای حذف سابقه، ابتدا وارد سامانه شوید.'); return; }

    const status = String(flock.status ?? flock.operational_status ?? '').toLowerCase();
    if (['closed', 'بسته', 'archived'].includes(status)) {
      alert('این دوره بسته است و حذف سابقه پایش مجاز نیست.');
      return;
    }

    const week = record.week_number ?? record.weekNumber ?? record.week ?? '-';
    const phrase = 'حذف هفته ' + week;
    const warning = '⚠️ هشدار بسیار مهم\n\n' +
      'شما در حال حذف سابقه پایش هفتگی هفته ' + week + ' هستید.\n\n' +
      'این داده پس از حذف قابل بازیابی نخواهد بود.\n' +
      'این عملیات دائمی است و ممکن است روی گزارش‌ها و روندهای گله اثر بگذارد.\n\n' +
      'برای ادامه، «تأیید» را انتخاب کنید.';
    if (!window.confirm(warning)) return;

    const typed = window.prompt('برای تأیید نهایی، عبارت زیر را دقیقاً وارد کنید:\n\n' + phrase);
    if (typed === null) return;
    if (String(typed).trim() !== phrase) {
      alert('عبارت تأیید صحیح نیست؛ حذف لغو شد و هیچ داده‌ای تغییر نکرد.');
      return;
    }

    button.disabled = true;
    button.textContent = 'در حال حذف...';
    try {
      const { error } = await window.supabaseClient.from('weekly_records').delete().eq('id', record.id).eq('flock_id', flock.id);
      if (error) throw error;
      try {
        if (typeof weeklyRecords !== 'undefined' && Array.isArray(weeklyRecords)) {
          weeklyRecords = weeklyRecords.filter(r => String(r.id) !== String(record.id));
        }
      } catch (_) {}
      if (typeof loadHistory === 'function') await loadHistory();
      else if (typeof renderHistory === 'function') renderHistory();
      alert('سابقه پایش هفته ' + week + ' با موفقیت حذف شد.');
    } catch (error) {
      console.error('Weekly delete error:', error);
      button.disabled = false;
      button.textContent = '🗑️ حذف';
      alert('حذف انجام نشد:\n' + (error?.message || error));
    }
  }

  function decorate() {
    const root = document.getElementById(HISTORY);
    if (!root) return;

    // Find every existing Edit control, regardless of whether history is rendered as a table or cards.
    const edits = Array.from(root.querySelectorAll('button, a')).filter(el => /ویرایش|edit/i.test(el.textContent || ''));
    edits.forEach((edit, index) => {
      const parent = edit.parentElement;
      if (!parent || parent.querySelector('.' + DELETE_CLASS)) return;
      const row = edit.closest('tr, .history-row, .history-item, .record-row, .card') || parent;
      const record = findRecord(row, index);
      if (!record?.id) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-danger ' + DELETE_CLASS;
      button.textContent = '🗑️ حذف';
      button.title = 'حذف دائمی سابقه پایش هفتگی';
      button.style.cssText = 'display:inline-flex!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:99999!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;min-width:82px!important;margin:2px 4px!important;cursor:pointer!important;';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        performDelete(record, button);
      });
      edit.insertAdjacentElement('afterend', button);
    });
  }

  function start() {
    decorate();
    if (document.body) new MutationObserver(decorate).observe(document.body, { childList: true, subtree: true });
    let n = 0;
    const timer = setInterval(() => { decorate(); if (++n > 160) clearInterval(timer); }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.installWeeklyDeleteUI = decorate;
})();
