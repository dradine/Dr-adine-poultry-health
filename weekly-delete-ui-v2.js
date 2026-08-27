/* ADINE - Weekly History Delete UI v2
   Source-of-truth independent UI layer.
   Does not depend on weeklyRecords being exposed on window.
*/
(function (w, d) {
  'use strict';
  if (w.__ADINE_WEEKLY_DELETE_UI_V2__) return;
  w.__ADINE_WEEKLY_DELETE_UI_V2__ = true;

  const ROOT = 'weeklyHistory';
  const BTN = 'weekly-delete-v2';

  function digits(v) {
    return String(v ?? '')
      .replace(/[۰-۹]/g, x => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x))
      .replace(/[٠-٩]/g, x => '٠١٢٣٤٥٦٧٨٩'.indexOf(x));
  }

  function activeFlockId() {
    try { if (typeof currentFlock !== 'undefined' && currentFlock?.id) return currentFlock.id; } catch (_) {}
    return w.currentFlockForSpecialized?.id || w.currentFlock?.id || null;
  }

  function weekFromRow(row) {
    const cells = row.querySelectorAll('td');
    if (!cells.length) return null;
    // Weekly history's first data column is the week number in the canonical table.
    const raw = String(cells[0].textContent || '').trim();
    const n = Number(digits(raw).replace(/[^0-9]/g, ''));
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  function actionCell(row) {
    const buttons = row.querySelectorAll('button');
    if (!buttons.length) return null;
    // Put delete beside the existing edit button, never in a new row.
    return buttons[0].closest('td') || row.lastElementChild;
  }

  async function deleteRecord(row, button, week) {
    const flockId = activeFlockId();
    if (!flockId) { alert('گله فعال مشخص نیست؛ حذف انجام نشد.'); return; }

    let user = null;
    try {
      const r = await w.supabaseClient.auth.getUser();
      user = r?.data?.user || null;
    } catch (_) {}
    if (!user) { alert('برای حذف، ابتدا وارد سامانه شوید.'); return; }

    let flock = null;
    try { flock = typeof currentFlock !== 'undefined' ? currentFlock : null; } catch (_) {}
    flock = flock || w.currentFlockForSpecialized || w.currentFlock || null;
    if (String(flock?.status || 'active').toLowerCase() === 'closed') {
      alert('این دوره بسته شده است و حذف سابقه مجاز نیست.');
      return;
    }

    const { data: rows, error: findError } = await w.supabaseClient
      .from('weekly_records')
      .select('id,flock_id,week_number,age_days,record_date')
      .eq('flock_id', flockId)
      .eq('week_number', week)
      .order('age_days', { ascending: true, nullsFirst: false })
      .order('record_date', { ascending: true });

    if (findError) { alert('خطا در شناسایی سابقه هفته: ' + findError.message); return; }
    if (!Array.isArray(rows) || rows.length === 0) { alert('سابقه هفته ' + week + ' پیدا نشد.'); return; }
    if (rows.length > 1) {
      alert('برای این گله بیش از یک سابقه برای هفته ' + week + ' وجود دارد. برای جلوگیری از حذف اشتباه، عملیات متوقف شد.');
      return;
    }

    const record = rows[0];
    const phrase = 'حذف هفته ' + week;
    const ok = w.confirm(
      '⚠️ هشدار بسیار مهم\n\n' +
      'شما در حال حذف سابقه پایش هفتگی هفته ' + week + ' هستید.\n\n' +
      'این داده پس از حذف قابل بازیابی نخواهد بود.\n' +
      'این عملیات دائمی است و ممکن است روی گزارش‌ها، روندها و محاسبات تجمعی اثر بگذارد.\n\n' +
      'برای ادامه، تأیید را انتخاب کنید.'
    );
    if (!ok) return;

    const typed = w.prompt('برای تأیید نهایی حذف، عبارت زیر را دقیقاً وارد کنید:\n\n' + phrase);
    if (typed === null) return;
    if (String(typed).trim() !== phrase) {
      alert('عبارت تأیید صحیح نیست؛ حذف لغو شد و هیچ داده‌ای تغییر نکرد.');
      return;
    }

    button.disabled = true;
    button.textContent = 'در حال حذف...';

    const { error } = await w.supabaseClient
      .from('weekly_records')
      .delete()
      .eq('id', record.id)
      .eq('flock_id', flockId);

    if (error) {
      button.disabled = false;
      button.textContent = '🗑️ حذف';
      alert('حذف انجام نشد:\n' + error.message);
      return;
    }

    row.remove();
    alert('سابقه پایش هفته ' + week + ' با موفقیت حذف شد.');
  }

  function decorate() {
    const root = d.getElementById(ROOT);
    if (!root) return;
    const rows = root.querySelectorAll('tr');
    rows.forEach(row => {
      if (row.querySelector('th')) return;
      if (row.dataset.weeklyDeleteV2 === '1') return;
      const week = weekFromRow(row);
      const cell = actionCell(row);
      if (!week || !cell) return;
      const edit = cell.querySelector('button');
      if (!edit) return;

      row.dataset.weeklyDeleteV2 = '1';
      cell.style.setProperty('white-space', 'nowrap', 'important');
      cell.style.setProperty('display', 'table-cell', 'important');
      cell.style.setProperty('min-width', '190px', 'important');
      cell.style.setProperty('text-align', 'center', 'important');
      edit.style.setProperty('display', 'inline-flex', 'important');
      edit.style.setProperty('vertical-align', 'middle', 'important');
      edit.style.setProperty('margin', '2px', 'important');

      const b = d.createElement('button');
      b.type = 'button';
      b.id = BTN + '-' + week + '-' + Math.random().toString(36).slice(2);
      b.className = 'btn btn-danger weekly-delete-record-btn';
      b.textContent = '🗑️ حذف';
      b.title = 'حذف دائمی سابقه هفته ' + week;
      b.style.setProperty('display', 'inline-flex', 'important');
      b.style.setProperty('visibility', 'visible', 'important');
      b.style.setProperty('opacity', '1', 'important');
      b.style.setProperty('pointer-events', 'auto', 'important');
      b.style.setProperty('position', 'relative', 'important');
      b.style.setProperty('z-index', '99999', 'important');
      b.style.setProperty('vertical-align', 'middle', 'important');
      b.style.setProperty('margin', '2px', 'important');
      b.style.setProperty('min-width', '82px', 'important');
      b.addEventListener('click', () => deleteRecord(row, b, week));
      cell.appendChild(b);
    });
  }

  function start() {
    decorate();
    if (d.body) new MutationObserver(decorate).observe(d.body, { childList: true, subtree: true });
    let n = 0;
    const timer = setInterval(() => {
      decorate();
      if (++n >= 120) clearInterval(timer);
    }, 250);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window, document);
