/* ADINEH FARM OWNER - PROFESSIONAL ACCESS MANAGEMENT */
document.addEventListener('DOMContentLoaded', async () => {
    const auth = await AdineAuth.requireAuth();
    if (!auth) return;
    const p = auth.profile || {};
    const role = String(p.user_type || p.role || '').trim().toLowerCase();

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
        const { data, error } = role === 'owner' || role === 'admin'
            ? await q
            : await q.eq('owner_id', p.id);

        if (error) {
            document.getElementById('farms').textContent = error.message;
            return;
        }

        farms = data || [];

        // فقط برای نمایش نشان پیام؛ هیچ تغییری در منطق دسترسی پیام‌ها ایجاد نمی‌شود.
        const unreadByFarm = {};
        const unreadResult = await supabaseClient
            .from('professional_messages')
            .select('farm_id')
            .eq('recipient_id', p.id)
            .is('read_at', null);

        if (!unreadResult.error) {
            (unreadResult.data || []).forEach(m => {
                if (m.farm_id) unreadByFarm[m.farm_id] = (unreadByFarm[m.farm_id] || 0) + 1;
            });
        }

        document.getElementById('farms').innerHTML = farms.map(f => {
            const unread = unreadByFarm[f.id] || 0;
            return `
            <div class="box">
                <h3>${AdineAccess.esc(f.name)}</h3>
                <p class="muted">${AdineAccess.esc(f.farm_type||'نوع نامشخص')} | ${AdineAccess.esc(f.farm_code||'بدون کد')}</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 12px">
                    <a class="btn btn-secondary" href="professional-messages.html?farm=${f.id}">
                        💬 پیام‌های متخصصان این فارم
                        ${unread ? `<span class="unread-badge" aria-label="${unread} پیام خوانده‌نشده">${unread}</span>` : ''}
                    </a>
                </div>
                <div class="professional-add-grid">
                    <div>
                        <input id="code-${f.id}" type="text" inputmode="numeric" autocomplete="off" maxlength="4" pattern="[0-9]{4}" placeholder="کد حرفه‌ای ۴ رقمی" aria-label="کد حرفه‌ای ۴ رقمی">
                        <select id="type-${f.id}">
                            <option value="veterinarian">دامپزشک</option>
                            <option value="technical_veterinarian">دامپزشک مسئول فنی</option>
                            <option value="poultry_technical_expert">کارشناس فنی طیور</option>
                            <option value="diagnostic_lab">آزمایشگاه تشخیص دامپزشکی</option>
                        </select>
                        <button class="btn btn-primary" data-add="${f.id}">بررسی و انتخاب متخصص</button>
                        <div id="preview-${f.id}" class="muted" style="margin-top:8px;line-height:1.8" hidden></div>
                    </div>
                </div>
                <div id="pro-${f.id}" style="margin-top:12px">در حال بارگذاری...</div>
            </div>`;
        }).join('') || 'فارمی ثبت نشده است.';

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
            const codeInput = document.getElementById(`code-${farm}`);
            const typeInput = document.getElementById(`type-${farm}`);
            const preview = document.getElementById(`preview-${farm}`);
            const rawCode = codeInput ? codeInput.value.trim() : '';
            const code = String(rawCode || '')
                .normalize('NFKC')
                .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
                .replace(/[\u200c\u200d\u200e\u200f\ufeff]/g, '')
                .replace(/\s/g, '');
            const professionalType = typeInput ? typeInput.value : '';

            if (code.length !== 4 || !/^[0-9]{4}$/.test(code)) {
                alert('کد حرفه‌ای باید دقیقاً ۴ رقم باشد.');
                return;
            }

            add.disabled = true;
            if (preview) {
                preview.hidden = false;
                preview.textContent = 'در حال بررسی کد حرفه‌ای…';
            }

            const lookup = await supabaseClient.rpc('preview_professional_access_by_code', {
                p_farm_id: farm,
                p_access_code: code,
                p_professional_type: professionalType
            });

            if (lookup.error) {
                add.disabled = false;
                if (preview) preview.textContent = '';
                alert(lookup.error.message);
                return;
            }

            const professional = lookup.data?.[0];
            if (!professional) {
                add.disabled = false;
                if (preview) preview.textContent = '';
                alert('متخصصی با این کد پیدا نشد یا نوع متخصص با کد واردشده مطابقت ندارد.');
                return;
            }

            const verifiedText = professional.is_verified
                ? 'پروفایل حرفه‌ای تأییدشده'
                : 'پروفایل حرفه‌ای ثبت‌شده';

            if (preview) {
                preview.innerHTML =
                    '<strong>متخصص پیدا شد:</strong> ' +
                    AdineAccess.esc(professional.professional_name || 'بدون نام') +
                    ' — ' + typeLabel(professional.professional_type) +
                    ' (' + verifiedText + ')';
            }

            const confirmed = confirm(
                'کد حرفه‌ای واردشده متعلق به «' +
                (professional.professional_name || 'بدون نام') +
                '» است.\\n\\nنوع متخصص: ' + typeLabel(professional.professional_type) +
                '\\n' + verifiedText +
                '\\n\\nآیا تأیید می‌کنید که همین متخصص را برای این فارم انتخاب کرده‌اید؟'
            );

            if (!confirmed) {
                add.disabled = false;
                return;
            }

            const request = await supabaseClient.rpc('request_professional_access_by_code', {
                p_farm_id: farm,
                p_access_code: code,
                p_professional_type: professionalType
            });

            add.disabled = false;

            if (request.error) {
                alert(request.error.message);
                return;
            }

            alert(
                'متخصص «' + (professional.professional_name || 'بدون نام') +
                '» انتخاب شد. درخواست برای او ارسال شد و پس از تأیید وی، دسترسی فعال می‌شود.'
            );

            if (codeInput) codeInput.value = '';
            if (preview) preview.hidden = true;
            await renderProfessionals(farm);
        }

        const revoke = e.target.closest('[data-revoke]');
        if (revoke) {
            if (!confirm('آیا مطمئن هستید دسترسی این متخصص به این فارم قطع شود؟ پس از قطع، دیگر اطلاعات فارم را مشاهده نخواهد کرد.')) return;

            const { error } = await supabaseClient.rpc('revoke_professional_access', {
                p_access_id: revoke.dataset.revoke,
                p_reason:'قطع دسترسی توسط مالک فارم'
            });

            if (error) alert(error.message);
            else alert('دسترسی متخصص قطع شد.');

            await loadFarms();
        }
    });

    await loadFarms();
});
