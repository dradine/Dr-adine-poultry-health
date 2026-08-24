/* ADINEH - PROFESSIONAL PANEL */
document.addEventListener('DOMContentLoaded', async () => {
  const auth = await AdineAuth.requireAuth();
  if (!auth) return;

  const p = auth.profile || {};
  const userType = String(p.user_type || '').toLowerCase();
  const isLab = userType === 'veterinary_lab';

  document.getElementById('title').textContent = `پنل ${AdineAccess.roleLabel(p)}`;
  document.getElementById('sub').textContent = `${p.full_name || ''} | ${p.phone || '—'}`;
  if (isLab) document.getElementById('labPanel').style.display = 'block';

  const typeLabels = {
    veterinarian: 'دامپزشک',
    technical_veterinarian: 'دامپزشک مسئول فنی',
    poultry_technical_expert: 'کارشناس فنی طیور',
    veterinary_lab: 'آزمایشگاه تشخیص دامپزشکی'
  };

  const esc = v => AdineAccess.esc(v ?? '');

  async function load() {
    const { data, error } = await supabaseClient.rpc('get_my_farm_access');
    if (error) {
      document.getElementById('pending').innerHTML = `<div class="alert">خطا در دریافت درخواست‌ها: ${esc(error.message)}</div>`;
      document.getElementById('farms').innerHTML = '<div class="alert">دریافت فارم‌ها انجام نشد.</div>';
      return;
    }

    const rows = data || [];
    const pending = rows.filter(x => x.connection_status === 'pending');
    document.getElementById('pending').innerHTML = pending.length
      ? pending.map(x => `
          <div class="alert">
            <strong>${esc(x.farm_name || 'فارم')}</strong>
            <div>${esc(typeLabels[x.professional_type] || x.professional_type || 'متخصص')}</div>
            <div class="actions">
              <button class="btn btn-primary" data-accept="${esc(x.connection_id)}">تأیید دسترسی</button>
              <button class="btn btn-secondary" data-reject="${esc(x.connection_id)}">رد درخواست</button>
            </div>
          </div>
        `).join('')
      : 'درخواست جدیدی ندارید.';

    const active = rows.filter(x => x.connection_status === 'active');
    document.getElementById('farms').innerHTML = active.length
      ? active.map(x => `
          <article class="farm-card">
            <h3>${esc(x.farm_name || 'فارم')}</h3>
            <span class="badge">${esc(x.farm_type || 'نوع نامشخص')}</span>
            <p>کد فارم: ${esc(x.farm_code || '—')}</p>
            <p>نوع ارتباط: ${esc(typeLabels[x.professional_type] || x.professional_type || 'متخصص')}</p>
            <div class="actions">
              <button class="btn btn-primary" data-open="${esc(x.farm_id)}">ورود به پایش هفتگی</button>
              <button class="btn btn-secondary" data-health="${esc(x.farm_id)}">سلامت و بیماری</button>
              <button class="btn btn-secondary" data-report="${esc(x.farm_id)}">گزارش</button>
            </div>
          </article>
        `).join('')
      : 'هنوز فارم فعالی برای شما ثبت نشده است.';

  }

  document.addEventListener('click', async e => {
    const accept = e.target.closest('[data-accept]');
    const reject = e.target.closest('[data-reject]');

    if (accept || reject) {
      const id = (accept || reject).dataset.accept || reject.dataset.reject;
      let result;

      if (accept) {
        result = await supabaseClient.rpc('approve_professional_access', {
          p_access_id: id
        });
      } else {
        const reason = prompt('دلیل رد درخواست (اختیاری):', '') ?? '';
        result = await supabaseClient.rpc('reject_professional_access', {
          p_access_id: id,
          p_reason: reason.trim() || null
        });
      }

      if (result.error) alert(result.error.message);
      else alert(accept ? 'دسترسی فعال شد.' : 'درخواست رد شد.');
      await load();
      return;
    }

    const open = e.target.closest('[data-open]');
    const health = e.target.closest('[data-health]');
    const report = e.target.closest('[data-report]');

    if (open) AdineAccess.openFarm(open.dataset.open, 'weekly.html');
    if (health) AdineAccess.openFarm(health.dataset.health, 'health.html');
    if (report) AdineAccess.openFarm(report.dataset.report, 'reports.html');
  });

  await load();
});
