/* =========================================================
   ADINEH OWNER MANAGEMENT
   OWNER PANEL — FINAL JSONB VERSION
========================================================= */

(function () {
    "use strict";

    let users = [];
    let selectedUser = null;

    const $ = (id) => document.getElementById(id);

    /* -----------------------------------------------------
       HELPERS
    ----------------------------------------------------- */

    function esc(value) {
        if (value === null || value === undefined) return "";

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function faNumber(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "—";
        }

        return String(value).replace(
            /\d/g,
            d => "۰۱۲۳۴۵۶۷۸۹"[d]
        );
    }

    function formatDate(value) {
        if (!value) return "—";

        try {
            const d = new Date(value);

            if (isNaN(d.getTime())) return "—";

            return new Intl.DateTimeFormat("fa-IR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }).format(d);

        } catch {
            return "—";
        }
    }

    function setText(id, value) {
        const el = $(id);

        if (!el) return;

        el.textContent =
            value === null ||
            value === undefined ||
            value === ""
                ? "—"
                : value;
    }

    function showMessage(message, type = "success") {

        const box =
            $("message") ||
            $("ownerStatus");

        if (!box) return;

        box.textContent = message;

        box.className =
            "message " +
            (type === "error"
                ? "error"
                : type === "info"
                    ? "info"
                    : "success");

        if (box.classList.contains("hidden")) {
            box.classList.remove("hidden");
        }

        clearTimeout(box._messageTimer);

        box._messageTimer =
            setTimeout(() => {
                box.classList.add("hidden");
            }, 5000);
    }

    /* -----------------------------------------------------
       LABELS
    ----------------------------------------------------- */

    function roleLabel(role) {

        const map = {
            owner: "مالک",
            admin: "مدیر",
            user: "کاربر"
        };

        return map[role] || role || "—";
    }

    function userTypeLabel(type) {

        const map = {
            veterinarian:
                "🩺 دامپزشک",

            technical_veterinarian:
                "🩺 دامپزشک مسئول فنی",

            poultry_operator:
                "🐔 بهره‌بردار واحد طیور",

            farm_operator:
                "🐔 بهره‌بردار واحد طیور",

            poultry_manager:
                "👨‍💼 مدیر واحد طیور",

            farm_manager:
                "👨‍💼 مدیر واحد طیور",

            veterinary_lab:
                "🔬 آزمایشگاه تشخیص دامپزشکی",

            diagnostic_lab:
                "🔬 آزمایشگاه تشخیص دامپزشکی",

            poultry_technical_expert:
                "📊 کارشناس فنی طیور",

            organization_manager:
                "🏢 مدیر / نماینده مجموعه",

            company_manager:
                "🏢 مدیر / نماینده مجموعه",

            other:
                "سایر",

            user:
                "سایر"
        };

        return map[type] || type || "—";
    }

    function statusLabel(status) {

        const map = {
            active: "فعال",
            pending: "در انتظار تأیید",
            suspended: "موقتاً غیرفعال",
            blocked: "مسدود",
            removed: "اخراج‌شده"
        };

        return map[status] || status || "—";
    }

    function statusClass(status) {

        return (
            "badge " +
            (
                status === "active"
                    ? "active"
                    : status === "pending"
                        ? "pending"
                        : status === "suspended"
                            ? "suspended"
                            : status === "blocked"
                                ? "blocked"
                                : status === "removed"
                                    ? "removed"
                                    : ""
            )
        );
    }

    function activityText(activityTypes) {

        if (!activityTypes) return "—";

        let list = activityTypes;

        if (typeof activityTypes === "string") {

            try {
                list = JSON.parse(activityTypes);
            } catch {
                return activityTypes;
            }
        }

        if (!Array.isArray(list)) {
            return String(list);
        }

        if (!list.length) return "—";

        const map = {
            broiler: "گوشتی",
            layer: "تخمگذار",
            breeder: "مادر",
            pullet: "پولت",
            hatchery: "جوجه‌کشی",
            other: "سایر"
        };

        return list
            .map(x => map[x] || x)
            .join("، ");
    }

    /* -----------------------------------------------------
       AUTH
    ----------------------------------------------------- */

    async function getCurrentUser() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {
            throw new Error(
                "Supabase Client پیدا نشد."
            );
        }

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();

        if (error) throw error;

        if (!data || !data.user) {
            throw new Error(
                "کاربر وارد سامانه نشده است."
            );
        }

        return data.user;
    }

    async function verifyOwner() {

        const authUser =
            await getCurrentUser();

        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    full_name,
                    email,
                    role,
                    status,
                    is_active
                `)
                .eq("id", authUser.id)
                .maybeSingle();

        if (error) throw error;

        if (!data) {
            throw new Error(
                "پروفایل مالک پیدا نشد."
            );
        }

        if (
            data.role !== "owner" ||
            data.status !== "active" ||
            data.is_active !== true
        ) {
            throw new Error(
                "این صفحه فقط برای مالک سامانه قابل دسترسی است."
            );
        }

        const identity =
            $("ownerIdentity");

        if (identity) {
            identity.textContent =
                "مالک سامانه: " +
                (
                    data.full_name ||
                    data.email ||
                    "مالک"
                );
        }

        return data;
    }

    /* -----------------------------------------------------
       LOAD USERS
    ----------------------------------------------------- */

    async function loadUsers() {

        setLoading(true);

        try {

            const {
                data,
                error
            } =
                await supabaseClient.rpc(
                    "owner_get_user_directory"
                );

            if (error) throw error;

            if (data === null) {
                users = [];
            }
            else if (Array.isArray(data)) {
                users = data;
            }
            else if (
                typeof data === "string"
            ) {
                try {
                    users = JSON.parse(data);
                } catch {
                    users = [];
                }
            }
            else {
                users = [];
            }

            if (!Array.isArray(users)) {
                users = [];
            }

            renderAll();

        } catch (error) {

            console.error(
                "OWNER LOAD ERROR:",
                error
            );

            users = [];

            renderStats();

            renderEmpty(
                error.message ||
                "خطا در دریافت اطلاعات کاربران."
            );

            showMessage(
                error.message ||
                "دریافت اطلاعات کاربران ناموفق بود.",
                "error"
            );

        } finally {

            setLoading(false);
        }
    }

    function setLoading(isLoading) {

        const tbody =
            $("usersTableBody") ||
            $("ownerUsersTable");

        if (!tbody) return;

        if (isLoading) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading">
                        در حال بارگذاری کاربران...
                    </td>
                </tr>
            `;
        }
    }

    /* -----------------------------------------------------
       STATS
    ----------------------------------------------------- */

    function renderStats() {

        const total =
            users.length;

        const active =
            users.filter(
                x => x.status === "active"
            ).length;

        const pending =
            users.filter(
                x => x.status === "pending"
            ).length;

        const specialists =
            users.filter(
                x =>
                    x.user_type ===
                        "veterinarian" ||

                    x.user_type ===
                        "technical_veterinarian" ||

                    x.user_type ===
                        "veterinary_lab" ||

                    x.user_type ===
                        "diagnostic_lab" ||

                    x.user_type ===
                        "poultry_technical_expert"
            ).length;

        setText(
            "statTotal",
            faNumber(total)
        );

        setText(
            "statActive",
            faNumber(active)
        );

        setText(
            "statPending",
            faNumber(pending)
        );

        setText(
            "statSpecialists",
            faNumber(specialists)
        );

        /* compatibility with previous HTML */

        setText(
            "statVeterinarians",
            faNumber(
                users.filter(
                    x =>
                        x.user_type ===
                            "veterinarian" ||
                        x.user_type ===
                            "technical_veterinarian"
                ).length
            )
        );

        setText(
            "statLabs",
            faNumber(
                users.filter(
                    x =>
                        x.user_type ===
                            "veterinary_lab" ||
                        x.user_type ===
                            "diagnostic_lab"
                ).length
            )
        );

        setText(
            "statOperators",
            faNumber(
                users.filter(
                    x =>
                        x.user_type ===
                            "poultry_operator" ||
                        x.user_type ===
                            "farm_operator"
                ).length
            )
        );

        setText(
            "statManagers",
            faNumber(
                users.filter(
                    x =>
                        x.user_type ===
                            "poultry_manager" ||
                        x.user_type ===
                            "farm_manager" ||
                        x.user_type ===
                            "organization_manager" ||
                        x.user_type ===
                            "company_manager"
                ).length
            )
        );
    }

    /* -----------------------------------------------------
       TABLE
    ----------------------------------------------------- */

    function renderTable(list = users) {

        const tbody =
            $("usersTableBody") ||
            $("ownerUsersTable");

        if (!tbody) return;

        if (!list.length) {

            renderEmpty(
                "هیچ کاربری مطابق فیلترها پیدا نشد."
            );

            return;
        }

        tbody.innerHTML =
            list.map(user => {

                const code =
                    user.professional_code
                        ? "••••••••"
                        : "ندارد";

                return `
                    <tr>

                        <td>
                            <strong class="user-name">
                                ${esc(
                                    user.full_name ||
                                    "بدون نام"
                                )}
                            </strong>

                            ${
                                user.role === "owner"
                                    ? `
                                        <span class="badge owner">
                                            مالک
                                        </span>
                                      `
                                    : ""
                            }
                        </td>

                        <td>
                            ${esc(
                                user.email || "—"
                            )}
                        </td>

                        <td>
                            ${esc(
                                user.phone || "—"
                            )}
                        </td>

                        <td>
                            ${esc(
                                userTypeLabel(
                                    user.user_type
                                )
                            )}

                            ${
                                user.activity_types
                                    ? `
                                        <span class="muted">
                                            ${esc(
                                                activityText(
                                                    user.activity_types
                                                )
                                            )}
                                        </span>
                                      `
                                    : ""
                            }
                        </td>

                        <td>
                            <span class="${statusClass(
                                user.status
                            )}">
                                ${esc(
                                    statusLabel(
                                        user.status
                                    )
                                )}
                            </span>
                        </td>

                        <td>
                            ${esc(
                                formatDate(
                                    user.created_at
                                )
                            )}
                        </td>

                        <td>
                            ${esc(
                                formatDate(
                                    user.last_seen_at
                                )
                            )}
                        </td>

                        <td>
                            <div class="actions">

                                <button
                                    type="button"
                                    class="btn btn-primary"
                                    data-action="details"
                                    data-user-id="${esc(
                                        user.user_id
                                    )}"
                                >
                                    جزئیات
                                </button>

                            </div>
                        </td>

                    </tr>
                `;

            }).join("");
    }

    function renderEmpty(message) {

        const tbody =
            $("usersTableBody") ||
            $("ownerUsersTable");

        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty"
                >
                    ${esc(message)}
                </td>
            </tr>
        `;
    }

    /* -----------------------------------------------------
       DETAILS
    ----------------------------------------------------- */

    function openDetails(userId) {

        const user =
            users.find(
                x =>
                    String(x.user_id) ===
                    String(userId)
            );

        if (!user) return;

        selectedUser = user;

        const modal =
            $("ownerUserModal");

        if (!modal) {

            showUserDetailsFallback(user);

            return;
        }

        setText(
            "detailName",
            user.full_name || "—"
        );

        setText(
            "detailEmail",
            user.email || "—"
        );

        setText(
            "detailPhone",
            user.phone || "—"
        );

        setText(
            "detailRole",
            roleLabel(user.role)
        );

        setText(
            "detailUserType",
            userTypeLabel(user.user_type)
        );

        setText(
            "detailActivity",
            activityText(
                user.activity_types
            )
        );

        setText(
            "detailOrganization",
            user.organization_name || "—"
        );

        setText(
            "detailLicense",
            user.license_number || "—"
        );

        setText(
            "detailProvince",
            user.province || "—"
        );

        setText(
            "detailCity",
            user.city || "—"
        );

        setText(
            "detailSpecialty",
            user.specialty || "—"
        );

        setText(
            "detailStatus",
            statusLabel(user.status)
        );

        setText(
            "detailCreated",
            formatDate(user.created_at)
        );

        setText(
            "detailLastSeen",
            formatDate(user.last_seen_at)
        );

        setText(
            "detailCode",
            user.professional_code ||
            "کد ندارد"
        );

        setText(
            "detailCodeStatus",
            user.professional_code_active
                ? "فعال"
                : "غیرفعال"
        );

        setText(
            "detailVerified",
            user.is_verified
                ? "تأیید شده"
                : "تأیید نشده"
        );

        setText(
            "detailNotes",
            user.notes || "—"
        );

        const section =
            $("professionalCodeSection");

        if (section) {
            section.style.display =
                user.user_type
                    ? "block"
                    : "none";
        }

        modal.style.display =
            "flex";

        document.body.classList.add(
            "modal-open"
        );
    }

    function showUserDetailsFallback(user) {

        const information = [
            `نام: ${user.full_name || "—"}`,
            `ایمیل: ${user.email || "—"}`,
            `شماره تماس: ${user.phone || "—"}`,
            `نقش: ${roleLabel(user.role)}`,
            `نوع کاربری: ${userTypeLabel(user.user_type)}`,
            `فعالیت: ${activityText(user.activity_types)}`,
            `مجموعه: ${user.organization_name || "—"}`,
            `شماره مجوز: ${user.license_number || "—"}`,
            `استان: ${user.province || "—"}`,
            `شهر: ${user.city || "—"}`,
            `تخصص: ${user.specialty || "—"}`,
            `وضعیت: ${statusLabel(user.status)}`,
            `کد حرفه‌ای: ${user.professional_code || "ندارد"}`,
            `تأیید حرفه‌ای: ${user.is_verified ? "بله" : "خیر"}`
        ];

        alert(
            information.join("\n")
        );
    }

    function closeDetails() {

        const modal =
            $("ownerUserModal");

        if (!modal) return;

        modal.style.display =
            "none";

        document.body.classList.remove(
            "modal-open"
        );

        selectedUser = null;
    }

    /* -----------------------------------------------------
       PROFESSIONAL CODE
    ----------------------------------------------------- */

    async function generateCode() {

        if (!selectedUser) return;

        if (!selectedUser.user_type) {

            showMessage(
                "این کاربر هنوز پروفایل حرفه‌ای ندارد.",
                "error"
            );

            return;
        }

        const button =
            $("generateProfessionalCodeBtn");

        if (button) {

            button.disabled = true;

            button.textContent =
                "در حال تولید...";
        }

        try {

            const {
                data,
                error
            } =
                await supabaseClient.rpc(
                    "owner_generate_professional_code",
                    {
                        p_user_id:
                            selectedUser.user_id
                    }
                );

            if (error) throw error;

            selectedUser.professional_code =
                data;

            selectedUser.professional_code_active =
                true;

            setText(
                "detailCode",
                data
            );

            setText(
                "detailCodeStatus",
                "فعال"
            );

            renderTable(
                getFilteredUsers()
            );

            showMessage(
                "کد حرفه‌ای با موفقیت ایجاد شد."
            );

        } catch (error) {

            console.error(
                "GENERATE CODE ERROR:",
                error
            );

            showMessage(
                error.message ||
                "تولید کد حرفه‌ای ناموفق بود.",
                "error"
            );

        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "تولید / تغییر کد";
            }
        }
    }

    /* -----------------------------------------------------
       FILTERS
    ----------------------------------------------------- */

    function getFilteredUsers() {

        const search =
            $("userSearch");

        const role =
            $("roleFilter");

        const status =
            $("statusFilter");

        const query =
            search
                ? search.value
                    .trim()
                    .toLowerCase()
                : "";

        const roleValue =
            role
                ? role.value
                : "all";

        const statusValue =
            status
                ? status.value
                : "all";

        return users.filter(user => {

            const searchable = [
                user.full_name,
                user.email,
                user.phone,
                user.organization_name,
                user.license_number,
                user.city,
                user.province,
                user.specialty,
                user.user_type
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const searchOK =
                !query ||
                searchable.includes(query);

            let roleOK =
                roleValue === "all";

            if (!roleOK) {

                if (
                    roleValue === "owner"
                ) {
                    roleOK =
                        user.role === "owner";
                }
                else if (
                    roleValue === "user"
                ) {
                    roleOK =
                        user.role === "user";
                }
                else {
                    roleOK =
                        user.user_type ===
                        roleValue;
                }
            }

            const statusOK =
                statusValue === "all" ||
                user.status === statusValue;

            return (
                searchOK &&
                roleOK &&
                statusOK
            );
        });
    }

    function applyFilters() {

        renderTable(
            getFilteredUsers()
        );
    }

    /* -----------------------------------------------------
       EVENTS
    ----------------------------------------------------- */

    function bindEvents() {

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!button) return;

                const action =
                    button.dataset.action;

                if (
                    action ===
                    "details"
                ) {

                    openDetails(
                        button.dataset.userId
                    );
                }
            }
        );

        const closeButton =
            $("closeOwnerModal");

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeDetails
            );
        }

        const modal =
            $("ownerUserModal");

        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {
                        closeDetails();
                    }
                }
            );
        }

        const search =
            $("userSearch");

        if (search) {

            search.addEventListener(
                "input",
                applyFilters
            );
        }

        const roleFilter =
            $("roleFilter");

        if (roleFilter) {

            roleFilter.addEventListener(
                "change",
                applyFilters
            );
        }

        const statusFilter =
            $("statusFilter");

        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                applyFilters
            );
        }

        const refresh =
            $("refreshButton");

        if (refresh) {

            refresh.addEventListener(
                "click",
                loadUsers
            );
        }

        const generate =
            $("generateProfessionalCodeBtn");

        if (generate) {

            generate.addEventListener(
                "click",
                generateCode
            );
        }

        const logout =
            $("logoutButton");

        if (logout) {

            logout.addEventListener(
                "click",
                async function () {

                    try {

                        await supabaseClient
                            .auth
                            .signOut();

                        window.location.href =
                            "login.html";

                    } catch (error) {

                        console.error(
                            "LOGOUT ERROR:",
                            error
                        );

                        showMessage(
                            "خروج از سامانه ناموفق بود.",
                            "error"
                        );
                    }
                }
            );
        }

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Escape"
                ) {
                    closeDetails();
                }
            }
        );
    }

    /* -----------------------------------------------------
       INIT
    ----------------------------------------------------- */

    async function init() {

        try {

            await verifyOwner();

            bindEvents();

            await loadUsers();

        } catch (error) {

            console.error(
                "OWNER INIT ERROR:",
                error
            );

            showMessage(
                error.message ||
                "خطا در دسترسی به پنل مالک.",
                "error"
            );

            renderEmpty(
                error.message ||
                "دسترسی به پنل مالک امکان‌پذیر نیست."
            );
        }
    }

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );

    } else {

        init();
    }

})();
