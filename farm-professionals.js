/* ADINEH FARM OWNER - PROFESSIONAL ACCESS MANAGEMENT */
document.addEventListener('DOMContentLoaded', async () => {
    const auth = await AdineAuth.requireAuth();
    if (!auth) return;
    const p = auth.profile || {};
    const role = String(p.user_type || p.role || '').trim().toLowerCase();
    if (!['poultry_operator','poultry_manager','organization_manager','owner','admin'].includes(role)) {
        alert('این بخش برای بهره‌بردار و مدیر واحد است.');
        location.href = 'Dashboard.html';
        return;
    }

    let farms = [];

    const typeLabel = t => ({
        veterinarian:'دامپزشک',
        technical_veterinarian:'دامپزشک مسئول فنی',
        poultry_technical_expert:'کارشناس فنی طیور',
        diagnostic_lab:'آزمایشگاه تشخیص دامپزشکی',
        veterinary_lab:'آزمایشگاه تشخیص دامپزشکی'
    }[String(t||'').toLowerCase()] || 'متخصص');

    async function loadFarms() {
        const q = supabaseClient.from('farms').select('id,name,farm_code,farm_type').order('created_at',{ascending:false});
        const { data, error } = role === 'owner' || role === 'admin' ? await q : await q.eq('owner_id', p.id);
        if (error) { document.getElementById('farms').textContent = error.message; return; }
        farms = data || [];

        document.getElementById('farms').innerHTML = farms.map(f => `
            <div class="box">
                <h3>${AdineAccess.esc(f.name)}</h3>
                <p class="muted">${AdineAccess.esc(f.farm_type||'نوع نامشخص')} | ${AdineAccess.esc(f.farm_code||'بدون کد')}</p>
                <div class="professional-add-grid">
                    <div>
                        <input id="code-${f.id}" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="کد حرفه‌ای ۴ رقمی">
                        <select id="type-${f.id}">
                            <option value="veterinarian">دامپزشک</option>
                            <option value="technical_veterinarian">دامپزشک مسئول فنی</option>
                            <option value="poultry_technical_expert">کارشناس فنی طیور</option>
                            <option value="diagnostic_lab">آزمایشگاه تشخیص دامپزشکی</option>
                        </select>
                        <button class="btn btn-primary" data-add="${f.id}">ارسال درخواست اتصال</button>
                    </div>
                </div>
                <div id="pro-${f.id}" style="margin-top:12px">در حال بارگذاری...</div>
            </div>`).join('') || 'فارمی ثبت نشده است.';

        for (const f of farms) await renderProfessionals(f.id);
    }

    async function renderProfessionals(farmId) {
        const { data, error } = await supabaseClient.rpc('get_farm_professionals',{p_farm_id:farmId});
        const el = document.getElementById('pro-'+farmId);
        if (error) { el.textContent = error.message; return; }
        el.innerHTML = (data||[]).map(x => `
            <div class="box">
                <strong>${AdineAccess.esc(x.professional_name || 'بدون نام')}</strong>
                <div>${typeLabel(x.professional_type)} — ${x.connection_status==='active'?'فعال':x.connection_status==='pending'?'در انتظار تأیید':'غیرفعال'}</div>
                ${x.approved_at ? `<div class="muted">تأیید شده: ${new Date(x.approved_at).toLocaleDateString('fa-IR')}</div>` : ''}
                ${x.connection_status==='active' || x.connection_status==='pending' ? `<button class="btn btn-secondary" data-revoke="${x.connection_id}">قطع دسترسی</button>` : ''}
            </div>`).join('') || 'هنوز متخصصی برای این فارم ثبت نشده است.';
    }

    document.addEventListener('click', async e => {
        const add = e.target.closest('[data-add]');
        if (add) {
            const farm = add.dataset.add;
            const code = document.getElementById(`code-${farm}`).value.trim();
            const professionalType = document.getElementById(`type-${farm}`).value;
            if (!/^\d{4}$/.test(code)) return alert('کد حرفه‌ای باید دقیقاً ۴ رقم باشد.');
            add.disabled = true;
            const { error } = await supabaseClient.rpc('request_professional_access_by_code', {
                p_farm_id: farm,
                p_access_code: code,
                p_professional_type: professionalType
            });
            add.disabled = false;
            if (error) alert(error.message);
            else { alert('درخواست برای متخصص ارسال شد. پس از تأیید، دسترسی فعال می‌شود.'); document.getElementById(`code-${farm}`).value=''; await renderProfessionals(farm); }
            return;
        }

        const revoke = e.target.closest('[data-revoke]');
        if (revoke) {
            if (!confirm('آیا مطمئن هستید دسترسی این متخصص به این فارم قطع شود؟ پس از قطع، دیگر اطلاعات فارم را مشاهده نخواهد کرد.')) return;
            const { error } = await supabaseClient.rpc('revoke_professional_access', { p_access_id: revoke.dataset.revoke, p_reason:'قطع دسترسی توسط مالک فارم' });
            if (error) alert(error.message);
            else alert('دسترسی متخصص قطع شد.');
            await loadFarms();
        }
    });

    await loadFarms();
});
