/* ADINEH PROFESSIONAL PANEL - FARM ACCESS */
document.addEventListener('DOMContentLoaded', async () => {
    const auth = await AdineAuth.requireAuth();
    if (!auth) return;

    const p = auth.profile || {};
    const type = String(p.user_type || '').trim().toLowerCase();
    const professionalTypes = ['veterinarian','technical_veterinarian','veterinary_lab','diagnostic_lab','poultry_technical_expert'];
    if (!professionalTypes.includes(type)) {
        window.location.replace('Dashboard.html');
        return;
    }

    const title = document.getElementById('title');
    const sub = document.getElementById('sub');
    const isLab = ['veterinary_lab','diagnostic_lab'].includes(type);
    if (title) title.textContent = `پنل ${AdineAccess.roleLabel(p)}`;
    if (sub) sub.textContent = `${p.full_name || ''} | ${p.phone || '—'}`;

    if (isLab) document.getElementById('labPanel')?.style.setProperty('display','block');

    async function load() {
        const { data, error } = await supabaseClient.rpc('get_my_farm_access');
        if (error) {
            document.getElementById('farms').innerHTML = '<div class="alert">خطا در دریافت فارم‌ها</div>';
            document.getElementById('pending').textContent = 'خطا در دریافت درخواست‌ها.';
            return;
        }

        const rows = data || [];
        const pend = rows.filter(x => x.connection_status === 'pending');
        document.getElementById('pending').innerHTML = pend.length
            ? pend.map(x => `
                <div class="alert">
                    <strong>${AdineAccess.esc(x.farm_name)}</strong>
                    — ${AdineAccess.esc(AdineAccess.roleLabel({user_type:x.professional_type}))}
                    <div class="actions">
                        <button class="btn btn-primary" data-accept="${x.connection_id}">تأیید درخواست</button>
                        <button class="btn btn-secondary" data-reject="${x.connection_id}">رد درخواست</button>
                    </div>
                </div>`).join('')
            : 'درخواست جدیدی ندارید.';

        const active = rows.filter(x => x.connection_status === 'active');
        document.getElementById('farms').innerHTML = active.length
            ? active.map(x => `
                <article class="farm-card">
                    <h3>${AdineAccess.esc(x.farm_name)}</h3>
                    <span class="badge">${AdineAccess.esc(x.farm_type || 'نوع نامشخص')}</span>
                    <p>کد فارم: ${AdineAccess.esc(x.farm_code || '—')}</p>
                    <div class="actions">
                        <button class="btn btn-primary" data-open="${x.farm_id}">ورود به فارم</button>
                        <button class="btn btn-secondary" data-health="${x.farm_id}">سلامت و بیماری</button>
                        <button class="btn btn-secondary" data-report="${x.farm_id}">گزارش</button>
                    </div>
                </article>`).join('')
            : 'هنوز فارم فعالی برای شما ثبت نشده است.';

        const sel = document.getElementById('labFarm');
        if (sel) sel.innerHTML = active.map(x => `<option value="${x.farm_id}">${AdineAccess.esc(x.farm_name)}</option>`).join('');
        if (isLab) await loadLabs(active.map(x => x.farm_id));
    }

    document.addEventListener('click', async e => {
        const accept = e.target.closest('[data-accept]');
        const reject = e.target.closest('[data-reject]');

        if (accept || reject) {
            const id = accept?.dataset.accept || reject?.dataset.reject;
            const result = accept
                ? await supabaseClient.rpc('approve_professional_access', { p_access_id: id })
                : await supabaseClient.rpc('reject_professional_access', { p_access_id: id, p_reason: 'رد درخواست توسط متخصص' });
            if (result.error) alert(result.error.message);
            else alert(accept ? 'درخواست تأیید شد.' : 'درخواست رد شد.');
            await load();
            return;
        }

        const open = e.target.closest('[data-open]');
        const health = e.target.closest('[data-health]');
        const report = e.target.closest('[data-report]');
        if (open) await AdineAccess.openFarm(open.dataset.open, 'professional-farm.html');
        if (health) await AdineAccess.openFarm(health.dataset.health, 'health.html');
        if (report) await AdineAccess.openFarm(report.dataset.report, 'reports.html');
    });

    async function loadLabs(ids) {
        // نتیجه آزمایش‌ها در نسخه فعلی از lab_tests خوانده می‌شود؛ جدول lab_reports در ساختار فعلی پروژه وجود ندارد.
        if (!ids.length) {
            document.getElementById('labList').textContent = 'نتیجه‌ای ثبت نشده است.';
            return;
        }
        const { data, error } = await supabaseClient
            .from('lab_tests')
            .select('*')
            .in('farm_id', ids)
            .order('created_at', { ascending: false });
        if (error) {
            document.getElementById('labList').textContent = 'خطا در دریافت نتایج آزمایش.';
            return;
        }
        document.getElementById('labList').innerHTML = (data || []).map(x => `
            <div class="farm-card">
                <strong>${AdineAccess.esc(x.test_name || x.title || 'آزمایش')}</strong>
                <p>${AdineAccess.esc(x.result || x.result_text || '—')}</p>
            </div>`).join('') || 'نتیجه‌ای ثبت نشده است.';
    }

    document.getElementById('labForm')?.addEventListener('submit', async e => {
        e.preventDefault();
        alert('ثبت نتیجه آزمایش از مسیر lab_tests انجام می‌شود و این فرم فایل‌محور در نسخه فعلی غیرفعال است.');
    });

    await load();
});
