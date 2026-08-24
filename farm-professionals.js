/*
 * ADINEH - FARM PROFESSIONAL ACCESS
 *
 * اتصال متخصص به فارم با کد حرفه‌ای ۴ رقمی.
 * جریان امنیتی:
 * 1) مالک فارم کد متخصص را وارد می‌کند.
 * 2) request_professional_access_by_code یک درخواست pending می‌سازد.
 * 3) متخصص درخواست را در professional.html می‌بیند و approve/reject می‌کند.
 * 4) فقط status=active اجازه مشاهده فارم را می‌دهد.
 * 5) مالک هر زمان revoke_professional_access را اجرا کند، دسترسی فوراً قطع می‌شود.
 * 6) revoke/reject رکورد را حذف نمی‌کند تا سابقه اتصال حفظ شود.
 */

(function () {
  'use strict';

  const FARM_USER_TYPES = [
    'poultry_operator',
    'poultry_manager',
    'organization_manager'
  ];

  const TYPE_LABELS = {
    veterinarian: 'دامپزشک',
    technical_veterinarian: 'دامپزشک مسئول فنی',
    poultry_technical_expert: 'کارشناس فنی طیور',
    veterinary_lab: 'آزمایشگاه تشخیص دامپزشکی',
    diagnostic_lab: 'آزمایشگاه تشخیص دامپزشکی',
    farm_operator: 'بهره‌بردار واحد طیور',
    farm_manager: 'مدیر واحد طیور',
    company_manager: 'مدیر / نماینده مجموعه',
    other: 'سایر'
  };

  const STATUS_LABELS = {
    pending: 'در انتظار تأیید متخصص',
    active: 'فعال و قابل مشاهده',
    revoked: 'دسترسی قطع شده',
    rejected: 'رد شده'
  };

  function esc(value) {
    return AdineAccess.esc(value == null ? '' : value);
  }

  function typeLabel(type) {
    return TYPE_LABELS[String(type || '').toLowerCase()] || String(type || 'متخصص');
  }

  function statusLabel(status) {
    return STATUS_LABELS[String(status || '').toLowerCase()] || String(status || 'نامشخص');
  }

  function statusClass(status) {
    if (status === 'active') return 'status-active';
    if (status === 'pending') return 'status-pending';
    return 'status-muted';
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const auth = await AdineAuth.requireAuth();
    if (!auth) return;

    const profile = auth.profile || {};
    const normalizedUserType = String(profile.user_type || '').toLowerCase();
    const normalizedRole = String(profile.role || '').toLowerCase();

    // این صفحه فقط برای مالک فارم/بهره‌بردار/مدیر واحد است.
    if (!FARM_USER_TYPES.includes(normalizedUserType) && !['owner', 'admin'].includes(normalizedRole)) {
      alert('این بخش فقط برای مالک یا مدیر واحد طیور در دسترس است.');
      location.href = 'Dashboard.html';
      return;
    }

    const farmsEl = document.getElementById('farms');
    if (!farmsEl) return;

    let farms = [];

    function farmCard(farm) {
      const farmId = farm.id;
      return `
        <article class="box farm-box" data-farm="${esc(farmId)}">
          <div class="farm-head">
            <div>
              <h3>${esc(farm.name || 'بدون نام')}</h3>
              <p class="muted">
                ${esc(farm.farm_type || 'نوع نامشخص')}
                ${farm.farm_code ? ' | کد فارم: ' + esc(farm.farm_code) : ''}
              </p>
            </div>
          </div>

          <div class="connect-box">
            <label for="pro-type-${esc(farmId)}">نوع متخصص</label>
            <select id="pro-type-${esc(farmId)}" class="pro-type">
              <option value="veterinarian">دامپزشک</option>
              <option value="technical_veterinarian">دامپزشک مسئول فنی</option>
              <option value="poultry_technical_expert">کارشناس فنی طیور</option>
              <option value="veterinary_lab">آزمایشگاه تشخیص دامپزشکی</option>
            </select>

            <label for="pro-code-${esc(farmId)}">کد حرفه‌ای متخصص</label>
            <div class="code-row">
              <input
                id="pro-code-${esc(farmId)}"
                class="pro-code"
                inputmode="numeric"
                autocomplete="off"
                maxlength="4"
                pattern="[0-9]{4}"
                placeholder="کد ۴ رقمی"
              >
              <button class="btn btn-primary" type="button" data-connect="${esc(farmId)}">
                ارسال درخواست
              </button>
            </div>
            <small class="muted">
              درخواست برای متخصص ارسال می‌شود و تا تأیید او، هیچ دسترسی به اطلاعات فارم ایجاد نمی‌شود.
            </small>
          </div>

          <div class="professionals" id="pro-${esc(farmId)}">
            در حال بررسی دسترسی‌ها...
          </div>
        </article>
      `;
    }

    async function loadFarms() {
      farmsEl.innerHTML = '<div class="muted">در حال دریافت فارم‌ها...</div>';

      let query = supabaseClient
        .from('farms')
        .select('id,name,farm_code,farm_type,owner_id')
        .order('created_at', { ascending: false });

      // مالک سامانه admin به‌صورت فنی می‌تواند همه را ببیند؛ کاربر عادی فقط فارم خودش.
      if (!['owner', 'admin'].includes(normalizedRole)) {
        query = query.eq('owner_id', auth.user.id);
      }

      const { data, error } = await query;
      if (error) {
        farmsEl.innerHTML = `<div class="alert">خطا در دریافت فارم‌ها: ${esc(error.message)}</div>`;
        return;
      }

      farms = data || [];
      if (!farms.length) {
        farmsEl.innerHTML = `
          <div class="empty-state">
            <strong>فارمی ثبت نشده است.</strong>
            <p>ابتدا یک فارم ایجاد کنید.</p>
            <button class="btn btn-primary" type="button" onclick="location.href='Farms.html'">ثبت فارم</button>
          </div>`;
        return;
      }

      farmsEl.innerHTML = farms.map(farmCard).join('');
      await Promise.all(farms.map(f => renderProfessionals(f.id)));
    }

    async function renderProfessionals(farmId) {
      const el = document.getElementById(`pro-${farmId}`);
      if (!el) return;

      const { data, error } = await supabaseClient.rpc('get_farm_professionals', {
        p_farm_id: farmId
      });

      if (error) {
        el.innerHTML = `<div class="alert">خطا در دریافت متخصصان: ${esc(error.message)}</div>`;
        return;
      }

      const rows = data || [];
      if (!rows.length) {
        el.innerHTML = '<div class="muted empty-access">هنوز متخصصی برای این فارم درخواست یا دسترسی فعال ندارد.</div>';
        return;
      }

      el.innerHTML = `
        <h4>متخصصان مرتبط با این فارم</h4>
        ${rows.map(row => `
          <div class="professional-row">
            <div class="professional-main">
              <strong>${esc(row.professional_name || 'متخصص بدون نام')}</strong>
              <span class="type-pill">${esc(typeLabel(row.professional_type))}</span>
              <span class="status-pill ${statusClass(row.connection_status)}">${esc(statusLabel(row.connection_status))}</span>
            </div>
            <div class="professional-actions">
              <button
                class="btn btn-danger-outline"
                type="button"
                data-revoke="${esc(row.connection_id)}"
                data-name="${esc(row.professional_name || 'این متخصص')}"
              >
                ${row.connection_status === 'pending' ? 'لغو درخواست' : 'قطع دسترسی'}
              </button>
            </div>
          </div>
        `).join('')}
      `;
    }

    async function connectProfessional(farmId) {
      const typeEl = document.getElementById(`pro-type-${farmId}`);
      const codeEl = document.getElementById(`pro-code-${farmId}`);
      const button = document.querySelector(`[data-connect="${CSS.escape(farmId)}"]`);
      if (!typeEl || !codeEl) return;

      const code = codeEl.value.trim();
      const type = typeEl.value;

      if (!/^\d{4}$/.test(code)) {
        alert('کد حرفه‌ای باید دقیقاً ۴ رقم باشد.');
        codeEl.focus();
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = 'در حال ارسال...';
      }

      const { data, error } = await supabaseClient.rpc('request_professional_access_by_code', {
        p_farm_id: farmId,
        p_access_code: code,
        p_professional_type: type
      });

      if (button) {
        button.disabled = false;
        button.textContent = 'ارسال درخواست';
      }

      if (error) {
        alert(error.message || 'ارسال درخواست انجام نشد.');
        return;
      }

      codeEl.value = '';
      alert('درخواست با موفقیت ارسال شد. متخصص باید درخواست را تأیید کند. تا آن زمان دسترسی به فارم فعال نیست.');
      await renderProfessionals(farmId);
    }

    async function revokeProfessional(accessId, name) {
      if (!confirm(`آیا مطمئن هستید دسترسی «${name}» از این فارم قطع شود؟\n\nپس از قطع، متخصص دیگر نمی‌تواند اطلاعات این فارم را مشاهده یا ویرایش کند.`)) {
        return;
      }

      const reason = prompt('دلیل قطع دسترسی (اختیاری):', '') ?? '';
      const { error } = await supabaseClient.rpc('revoke_professional_access', {
        p_access_id: accessId,
        p_reason: reason.trim() || null
      });

      if (error) {
        alert(error.message || 'قطع دسترسی انجام نشد.');
        return;
      }

      alert('دسترسی متخصص قطع شد.');
      await loadFarms();
    }

    document.addEventListener('click', async function (event) {
      const connect = event.target.closest('[data-connect]');
      if (connect) {
        await connectProfessional(connect.dataset.connect);
        return;
      }

      const revoke = event.target.closest('[data-revoke]');
      if (revoke) {
        await revokeProfessional(revoke.dataset.revoke, revoke.dataset.name || 'متخصص');
      }
    });

    await loadFarms();
  });
})();
