/* =========================================================
   ADINEH OWNER MANAGEMENT — STABLE / ROBUST
   - Waits for Supabase session
   - Verifies owner from current auth user
   - Uses owner_get_user_directory as primary source
   - Falls back to direct owner-readable tables
   - Keeps phone + professional profile + access code
========================================================= */
(function () {
    "use strict";

    let allUsers = [];
    let loading = false;

    const $ = id => document.getElementById(id);

    const els = {
        tbody: () => $("usersTableBody"),
        message: () => $("message"),
        identity: () => $("ownerIdentity"),
        search: () => $("userSearch"),
        role: () => $("roleFilter"),
        status: () => $("statusFilter"),
        refresh: () => $("refreshUsers"),
        logout: () => $("logoutButton")
    };

    function esc(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    function message(text, type) {
        const box = els.message();
        if (!box) return;
        box.textContent = text || "";
        box.className = "message " + (type || "info");
        box.classList.remove("hidden");
    }

    function clearMessage() {
        const box = els.message();
        if (!box) return;
        box.textContent = "";
        box.className = "message hidden";
    }

    function dateText(value) {
        if (!value) return "—";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "—";
        try {
            return d.toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" });
        } catch (_) {
            return d.toLocaleString("fa-IR");
        }
    }

    function roleText(role) {
        return ({ owner: "مالک سامانه", admin: "مدیر سامانه", user: "کاربر" })[role] || role || "—";
    }

    function typeText(type) {
        return ({
            veterinarian: "🩺 دامپزشک",
            technical_veterinarian: "🩺 دامپزشک مسئول فنی",
            poultry_operator: "🐔 بهره‌بردار واحد طیور",
            farm_operator: "🐔 بهره‌بردار واحد طیور",
            poultry_manager: "👨‍💼 مدیر واحد طیور",
            farm_manager: "👨‍💼 مدیر واحد طیور",
            veterinary_lab: "🔬 آزمایشگاه تشخیص دامپزشکی",
            diagnostic_lab: "🔬 آزمایشگاه تشخیص دامپزشکی",
            poultry_technical_expert: "📊 کارشناس فنی طیور",
            organization_manager: "🏢 مدیر / نماینده مجموعه",
            company_manager: "🏢 مدیر / نماینده مجموعه",
            other: "سایر"
        })[type] || type || "ثبت نشده";
    }

    function statusText(status) {
        return ({
            pending: "در انتظار تأیید",
            active: "فعال",
            suspended: "موقتاً غیرفعال",
            blocked: "مسدود",
            removed: "بایگانی / حذف‌شده"
        })[status] || status || "نامشخص";
    }

    function activityText(value) {
        if (!value) return "—";
        let list = value;
        if (typeof value === "string") {
            try { list = JSON.parse(value); } catch (_) { return esc(value); }
        }
        if (!Array.isArray(list)) return esc(list);
        const map = {
            broiler: "گوشتی",
            layer: "تخم‌گذار",
            breeder: "مادر",
            pullet: "پولت",
            hatchery: "جوجه‌کشی",
            other: "سایر"
        };
        return list.length ? list.map(x => esc(map[x] || x)).join("، ") : "—";
    }

    function specialist(user) {
        return ["veterinarian", "technical_veterinarian", "veterinary_lab", "diagnostic_lab", "poultry_technical_expert"].includes(user.user_type);
    }

    function normalize(row) {
        return {
            id: row.id || row.user_id,
            user_id: row.user_id || row.id,
            email: row.email || "",
            full_name: row.full_name || "",
            phone: row.phone || "",
            role: row.role || "user",
            status: row.status || "pending",
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
            last_seen_at: row.last_seen_at,
            user_type: row.user_type || row.profile_user_type || null,
            activity_types: row.activity_types || [],
            organization_name: row.organization_name || null,
            license_number: row.license_number || null,
            province: row.province || null,
            city: row.city || null,
            specialty: row.specialty || null,
            notes: row.notes || null,
            is_verified: row.is_verified === true,
            access_code: row.access_code || row.professional_code || null,
            professional_code: row.professional_code || row.access_code || null,
            professional_code_active: row.professional_code_active ?? row.code_is_active ?? row.is_active_code ?? false,
            code_created_at: row.code_created_at || null,
            code_updated_at: row.code_updated_at || null
        };
    }

    async function waitForSupabase() {
        for (let i = 0; i < 40; i++) {
            if (window.supabaseClient && supabaseClient.auth) return true;
            await new Promise(r => setTimeout(r, 150));
        }
        throw new Error("اتصال سامانه آماده نشد. لطفاً صفحه را دوباره باز کنید.");
    }

    async function getAuthUser() {
        await waitForSupabase();
        const { data, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        if (!data || !data.user) throw new Error("جلسه ورود کاربر پیدا نشد. لطفاً دوباره وارد شوید.");
        return data.user;
    }

    async function verifyOwner() {
        const authUser = await getAuthUser();
        let profile = null;

        const result = await supabaseClient
            .from("profiles")
            .select("id,email,full_name,phone,role,status,is_active")
            .eq("id", authUser.id)
            .maybeSingle();

        if (!result.error) profile = result.data;

        const isOwner = profile &&
            profile.role === "owner" &&
            profile.status === "active" &&
            profile.is_active === true;

        if (!isOwner) {
            throw new Error("این حساب به عنوان مالک فعال سامانه شناخته نشد.");
        }

        const identity = els.identity();
        if (identity) {
            identity.textContent = `مالک: ${profile.full_name || authUser.email || "—"}  |  ${profile.email || authUser.email || "—"}`;
        }

        return { authUser, profile };
    }

    async function loadViaRpc() {
        const { data, error } = await supabaseClient.rpc("owner_get_user_directory");
        if (error) throw error;
        if (!Array.isArray(data)) return [];
        return data.map(normalize).filter(x => x.id);
    }

    async function loadViaTables() {
        const { data: profiles, error } = await supabaseClient
            .from("profiles")
            .select("id,email,full_name,phone,role,status,is_active,created_at,updated_at,last_seen_at")
            .order("created_at", { ascending: false });
        if (error) throw error;

        const rows = profiles || [];
        const ids = rows.map(x => x.id).filter(Boolean);
        const professional = new Map();
        const codes = new Map();

        if (ids.length) {
            const [p, c] = await Promise.all([
                supabaseClient.from("professional_profiles").select("user_id,user_type,activity_types,organization_name,license_number,province,city,specialty,notes,is_verified").in("user_id", ids),
                supabaseClient.from("professional_access_codes").select("user_id,access_code,is_active,created_at,updated_at").in("user_id", ids)
            ]);
            if (!p.error) (p.data || []).forEach(x => professional.set(x.user_id, x));
            if (!c.error) (c.data || []).forEach(x => codes.set(x.user_id, x));
        }

        return rows.map(p => normalize({
            ...p,
            ...(professional.get(p.id) || {}),
            ...(codes.get(p.id) || {})
        }));
    }

    async function loadUsers() {
        if (loading) return;
        loading = true;
        const tbody = els.tbody();
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">در حال دریافت اطلاعات کامل کاربران...</td></tr>`;

        try {
            await verifyOwner();

            let users = [];
            let rpcError = null;
            try {
                users = await loadViaRpc();
            } catch (e) {
                rpcError = e;
                console.warn("OWNER DIRECTORY RPC FAILED:", e);
            }

            if (!users.length) {
                try {
                    users = await loadViaTables();
                } catch (e) {
                    if (rpcError) throw new Error(`RPC: ${rpcError.message || rpcError} | جدول‌ها: ${e.message || e}`);
                    throw e;
                }
            }

            allUsers = users;
            renderUsers();
            clearMessage();
            message(`اطلاعات ${allUsers.length.toLocaleString("fa-IR")} کاربر بارگذاری شد.`, "success");
        } catch (error) {
            console.error("OWNER LOAD USERS ERROR:", error);
            allUsers = [];
            updateStats([]);
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="error-cell"><strong>اطلاعات کاربران لود نشد</strong><br><small>${esc(error?.message || "خطای نامشخص")}</small></td></tr>`;
            message(error?.message || "خطا در دریافت اطلاعات کاربران.", "error");
        } finally {
            loading = false;
        }
    }

    function updateStats(users) {
        const total = $("statTotal");
        const active = $("statActive");
        const specialists = $("statSpecialists");
        const pending = $("statPending");
        const set = (el, n) => { if (el) el.textContent = Number(n || 0).toLocaleString("fa-IR"); };
        set(total, users.length);
        set(active, users.filter(u => u.status === "active" && u.is_active !== false).length);
        set(specialists, users.filter(specialist).length);
        set(pending, users.filter(u => u.status === "pending").length);
    }

    function filteredUsers() {
        const q = String(els.search()?.value || "").trim().toLowerCase();
        const type = els.role()?.value || "";
        const status = els.status()?.value || "";
        return allUsers.filter(u => {
            const hay = [u.full_name,u.email,u.phone,u.user_type,u.organization_name,u.access_code,u.license_number,u.province,u.city,u.specialty].join(" ").toLowerCase();
            return (!q || hay.includes(q)) && (!type || u.user_type === type) && (!status || u.status === status);
        });
    }

    function actionButtons(user) {
        if (user.role === "owner") return `<strong class="owner-lock">مالک</strong>`;
        let html = `<button type="button" class="action-button action-details" data-action="details" data-id="${esc(user.id)}">جزئیات</button>`;
        if (user.status !== "active") html += `<button type="button" class="action-button action-active" data-action="status" data-id="${esc(user.id)}" data-status="active">فعال‌سازی</button>`;
        if (user.status !== "suspended") html += `<button type="button" class="action-button action-suspend" data-action="status" data-id="${esc(user.id)}" data-status="suspended">تعلیق</button>`;
        if (user.status !== "blocked") html += `<button type="button" class="action-button action-block" data-action="status" data-id="${esc(user.id)}" data-status="blocked">مسدود</button>`;
        if (user.status !== "removed") html += `<button type="button" class="action-button action-remove" data-action="status" data-id="${esc(user.id)}" data-status="removed">بایگانی</button>`;
        return html;
    }

    function renderUsers() {
        const tbody = els.tbody();
        if (!tbody) return;
        updateStats(allUsers);
        const users = filteredUsers();
        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-cell">کاربری مطابق فیلترهای انتخاب‌شده پیدا نشد.</td></tr>`;
            return;
        }
        tbody.innerHTML = users.map(user => `
            <tr>
                <td><div class="user-name">${esc(user.full_name || "—")}</div><div class="user-sub">${esc(roleText(user.role))}</div></td>
                <td><div>${esc(user.email || "—")}</div><div class="user-sub">${esc(user.phone || "شماره ثبت نشده")}</div></td>
                <td><span class="role-badge">${esc(typeText(user.user_type))}</span><div class="user-sub activity-line">${activityText(user.activity_types)}</div></td>
                <td>${specialist(user) ? (user.access_code ? `<span class="access-code" data-code="${esc(user.access_code)}">••••</span><button type="button" class="code-toggle" data-action="toggle-code" data-id="${esc(user.id)}">نمایش</button>` : `<span class="muted">ثبت نشده</span>`) : `<span class="muted">—</span>`}</td>
                <td><span class="status-badge status-${esc(user.status || "unknown")}">${esc(statusText(user.status))}</span></td>
                <td>${dateText(user.created_at)}</td>
                <td>${dateText(user.last_seen_at || user.updated_at)}</td>
                <td><div class="user-actions">${actionButtons(user)}</div></td>
            </tr>
        `).join("");
    }

    function showDetails(user) {
        const old = $("ownerDetailsModal");
        if (old) old.remove();
        const modal = document.createElement("div");
        modal.id = "ownerDetailsModal";
        modal.className = "owner-modal-backdrop";
        modal.innerHTML = `
            <div class="owner-modal" role="dialog" aria-modal="true">
                <div class="owner-modal-head"><div><h3>جزئیات کامل کاربر</h3><p>${esc(user.full_name || "—")}</p></div><button type="button" class="modal-close" data-close>×</button></div>
                <div class="detail-grid">
                    <div><span>نام و نام خانوادگی</span><strong>${esc(user.full_name || "—")}</strong></div>
                    <div><span>ایمیل</span><strong dir="ltr">${esc(user.email || "—")}</strong></div>
                    <div><span>شماره تماس</span><strong dir="ltr">${esc(user.phone || "ثبت نشده")}</strong></div>
                    <div><span>نقش سامانه</span><strong>${esc(roleText(user.role))}</strong></div>
                    <div><span>نوع کاربری</span><strong>${esc(typeText(user.user_type))}</strong></div>
                    <div><span>کد حرفه‌ای</span><strong class="modal-code">${esc(user.access_code || "ثبت نشده")}</strong></div>
                    <div class="detail-wide"><span>نوع فعالیت</span><strong>${activityText(user.activity_types)}</strong></div>
                    <div><span>مجموعه</span><strong>${esc(user.organization_name || "—")}</strong></div>
                    <div><span>شماره پروانه</span><strong>${esc(user.license_number || "—")}</strong></div>
                    <div><span>استان</span><strong>${esc(user.province || "—")}</strong></div>
                    <div><span>شهر</span><strong>${esc(user.city || "—")}</strong></div>
                    <div><span>تخصص</span><strong>${esc(user.specialty || "—")}</strong></div>
                    <div><span>تأیید حرفه‌ای</span><strong>${user.is_verified ? "تأیید شده" : "تأیید نشده"}</strong></div>
                    <div><span>وضعیت حساب</span><strong>${esc(statusText(user.status))}</strong></div>
                    <div><span>فعال بودن حساب</span><strong>${user.is_active === true ? "فعال" : "غیرفعال"}</strong></div>
                    <div><span>تاریخ ثبت‌نام</span><strong>${dateText(user.created_at)}</strong></div>
                    <div><span>آخرین فعالیت</span><strong>${dateText(user.last_seen_at || user.updated_at)}</strong></div>
                    <div><span>ایجاد کد حرفه‌ای</span><strong>${dateText(user.code_created_at)}</strong></div>
                    <div><span>آخرین تغییر کد</span><strong>${dateText(user.code_updated_at)}</strong></div>
                    <div class="detail-wide"><span>یادداشت</span><strong>${esc(user.notes || "—")}</strong></div>
                </div>
                <div class="owner-modal-foot"><button type="button" class="action-button action-active" data-close>بستن</button></div>
            </div>`;
        document.body.appendChild(modal);
        modal.addEventListener("click", e => { if (e.target === modal || e.target.closest("[data-close]")) modal.remove(); });
    }

    async function changeStatus(button) {
        const userId = button.dataset.id;
        const newStatus = button.dataset.status;
        if (!userId || !newStatus) return;
        const text = { active:"آیا این کاربر فعال شود؟", suspended:"آیا دسترسی این کاربر موقتاً غیرفعال شود؟", blocked:"آیا این کاربر مسدود شود؟", removed:"آیا این کاربر بایگانی شود؟" }[newStatus] || "آیا مطمئن هستید؟";
        if (!window.confirm(text)) return;
        button.disabled = true;
        try {
            const { error } = await supabaseClient.rpc("owner_set_user_status", { target_user_id: userId, new_status: newStatus });
            if (error) throw error;
            message("وضعیت کاربر با موفقیت تغییر کرد.", "success");
            await loadUsers();
        } catch (e) {
            console.error("STATUS ERROR:", e);
            message(e?.message || "تغییر وضعیت انجام نشد.", "error");
        } finally { button.disabled = false; }
    }

    function bind() {
        const tbody = els.tbody();
        if (tbody) tbody.addEventListener("click", async e => {
            const button = e.target.closest("button[data-action]");
            if (!button) return;
            const action = button.dataset.action;
            const user = allUsers.find(u => String(u.id) === String(button.dataset.id));
            if (action === "details" && user) return showDetails(user);
            if (action === "toggle-code") {
                const code = button.parentElement?.querySelector(".access-code");
                if (!code) return;
                const hidden = code.textContent === "••••";
                code.textContent = hidden ? code.dataset.code : "••••";
                button.textContent = hidden ? "مخفی" : "نمایش";
                return;
            }
            if (action === "status") await changeStatus(button);
        });

        [els.search(), els.role(), els.status()].forEach(el => {
            if (!el) return;
            el.addEventListener("input", renderUsers);
            el.addEventListener("change", renderUsers);
        });
        const refresh = els.refresh();
        if (refresh) refresh.addEventListener("click", loadUsers);
        const logout = els.logout();
        if (logout) logout.addEventListener("click", async () => {
            logout.disabled = true;
            try {
                if (window.AdineAuth?.signOut) await AdineAuth.signOut();
                else await supabaseClient.auth.signOut();
            } catch (e) { console.error(e); logout.disabled = false; }
        });
    }

    async function init() {
        try {
            await waitForSupabase();
            bind();
            await loadUsers();
        } catch (e) {
            console.error("OWNER INIT ERROR:", e);
            message(e?.message || "خطا در راه‌اندازی پنل مالک.", "error");
        }
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
