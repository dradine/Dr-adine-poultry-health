/* ADINE REPORTS — SINGLE STABLE CONTROLLER
   The report page already contains its canonical flock loader and renderer.
   This file must NOT create a second flock loader or mirror select.
*/
(function (w, d) {
  'use strict';
  if (w.__ADINE_REPORTS_STABLE_CONTROLLER__) return;
  w.__ADINE_REPORTS_STABLE_CONTROLLER__ = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const num = v => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : null;
  };
  const biologicalWeek = row => {
    const age = num(row?.age_days ?? row?.ageDays);
    if (age != null && age >= 1) return Math.floor((age - 1) / 7) + 1;
    const week = num(row?.week_number ?? row?.weekNumber);
    return week != null && week >= 1 ? Math.trunc(week) : null;
  };

  async function clientReady() {
    for (let i = 0; i < 200; i++) {
      if (w.supabaseClient?.from && w.supabaseClient?.auth) return w.supabaseClient;
      await sleep(50);
    }
    throw new Error('اتصال Supabase برای گزارش آماده نشد.');
  }

  async function sessionReady(client) {
    for (let i = 0; i < 120; i++) {
      try {
        const { data } = await client.auth.getSession();
        if (data?.session?.user?.id) return data.session.user;
      } catch (_) {}
      await sleep(100);
    }
    throw new Error('نشست کاربر برای گزارش آماده نشد.');
  }

  async function weeklyRows(flockId) {
    const client = await clientReady();
    const { data, error } = await client
      .from('weekly_records')
      .select('id,flock_id,record_date,age_days,week_number,updated_at')
      .eq('flock_id', flockId)
      .order('age_days', { ascending: true, nullsFirst: false })
      .order('record_date', { ascending: true });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }

  function renderWeeks(rows, keep) {
    const select = d.getElementById('reportWeekSelect');
    if (!select) return;

    const weeks = [...new Set(rows.map(biologicalWeek).filter(Number.isInteger))].sort((a,b) => a-b);
    select.innerHTML = '';
    const empty = d.createElement('option');
    empty.value = '';
    empty.textContent = weeks.length ? 'انتخاب هفته گزارش' : 'برای این گله ثبت هفتگی وجود ندارد';
    select.appendChild(empty);

    weeks.forEach(week => {
      const option = d.createElement('option');
      option.value = String(week);
      option.textContent = `هفته ${week}`;
      select.appendChild(option);
    });

    const wanted = num(keep);
    const selected = wanted != null && weeks.includes(wanted) ? wanted : (weeks.length ? weeks[weeks.length - 1] : null);
    select.value = selected == null ? '' : String(selected);
    select.disabled = weeks.length === 0;
    w.__adineSelectedReportWeek = selected;
    w.__adineReportWeeklyRows = rows;
    w.__adineReportWeeks = weeks;

    const info = d.getElementById('reportWeekSelectorInfo');
    if (info) {
      info.innerHTML = weeks.length
        ? `پایش‌های ثبت‌شده: <strong>${weeks.length}</strong> هفته | گزارش تا پایان <strong>هفته ${selected}</strong>`
        : 'برای این گله ثبت هفتگی وجود ندارد.';
    }
  }

  async function syncWeeks(flockId, keep) {
    const select = d.getElementById('reportWeekSelect');
    if (!select) return;
    select.disabled = true;
    select.innerHTML = '<option value="">در حال دریافت ثبت‌های هفتگی...</option>';
    try {
      const rows = await weeklyRows(flockId);
      renderWeeks(rows, keep);
      return rows;
    } catch (error) {
      console.error('[ADINE REPORTS] weekly_records load failed:', error);
      select.innerHTML = '<option value="">خطا در دریافت ثبت‌های هفتگی</option>';
      select.disabled = true;
      const info = d.getElementById('reportWeekSelectorInfo');
      if (info) info.textContent = `خطا در دریافت ثبت‌های هفتگی: ${error?.message || 'خطای نامشخص'}`;
      return [];
    }
  }

  async function boot() {
    try { await clientReady(); await sessionReady(w.supabaseClient); } catch (e) {
      console.error('[ADINE REPORTS] startup:', e);
      return;
    }

    for (let i = 0; i < 240; i++) {
      const flock = d.getElementById('flockSelect');
      if (flock) {
        // The inline reports engine owns the flock query. We only observe it.
        if (flock.dataset.adineStableObserved !== '1') {
          flock.dataset.adineStableObserved = '1';
          flock.addEventListener('change', function () {
            const id = this.value;
            w.__adineSelectedReportWeek = null;
            if (!id) {
              const week = d.getElementById('reportWeekSelect');
              if (week) { week.innerHTML = '<option value="">ابتدا گله را انتخاب کنید</option>'; week.disabled = true; }
              return;
            }
            // Never await or block the original report renderer.
            syncWeeks(id, null);
          }, { capture: true });
        }
        const week = d.getElementById('reportWeekSelect');
        if (week && week.dataset.adineStableObserved !== '1') {
          week.dataset.adineStableObserved = '1';
          week.addEventListener('change', function () {
            const id = flock.value;
            const selected = num(this.value);
            if (!id || selected == null) return;
            w.__adineSelectedReportWeek = selected;
            // Keep the original report renderer alive; period-aware engines can consume this state.
            w.__adineReportPeriodExplicit = true;
            syncWeeks(id, selected);
            if (typeof w.loadReport === 'function') {
              Promise.resolve().then(() => w.loadReport(id)).catch(e => console.error('[ADINE REPORTS] report reload:', e));
            }
          });
        }
        // If the canonical loader has already selected a flock, initialize its weeks.
        if (flock.value && week && week.options.length <= 1 && week.disabled !== false) syncWeeks(flock.value, null);
        return;
      }
      await sleep(50);
    }
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(window, document);
