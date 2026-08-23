/* =========================================================
   ADINEH OWNER MANAGEMENT
   owner.js — FINAL STABLE VERSION
========================================================= */

(function () {
    "use strict";

    let users = [];
    let selectedUser = null;
    let eventsBound = false;

    const $ = (id) => document.getElementById(id);

    /* =====================================================
       HELPERS
    ===================================================== */

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

        const date = new Date(value);

        if (isNaN(date.getTime())) return "—";

        try {
            return new Intl.DateTimeFormat("fa-IR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }).format(date);
        } catch {
            return "—";
        }
    }

    function setText(id, value) {
        const element = $(id);

        if (!element) return;

        element.textContent =
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

        if (box.id === "message") {
            box.className =
                "message " +
                (
                    type === "error"
                        ? "error"
                        : type === "info"
                            ? "info"
                            : "success"
                );
        } else {
            box.className =
                "owner-status " +
                (
                    type === "error"
                        ? "error"
                        : "success"
                );
        }

        clearTimeout(box._timer);

        box._timer = setTimeout(() => {
            if (box.id === "message") {
                box.className = "message hidden";
            } else {
                box.className = "owner-status";
            }
        }, 5000);
    }

    /* =====================================================
       LABELS
    ===================================================== */

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
        if (status === "active") {
            return "badge active";
        }

        if (status === "pending") {
            return "badge pending";
        }

        if (status === "suspended") {
            return "badge suspended";
        }

        if (
            status === "blocked" ||
            status === "removed"
        ) {
            return "badge blocked";
        }

        return "badge";
    }

    function activityText(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "—";
        }

        let list = value;

        if (typeof list === "string") {
            try {
                list = JSON.parse(list);
            } catch {
                return value;
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
            .map(item => map[item] || item)
            .join("، ");
    }

    /* =====================================================
       AUTH
    ===================================================== */

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

        if (error) {
            throw error;
        }

        if (
            !data ||
            !data.user
        ) {
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

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error(
                "پروفایل کاربر پیدا نشد."
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

        setText(
            "ownerIdentity",
            "مالک سامانه: " +
            (
                data.full_name ||
                data.email ||
                "مالک"
            )
        );

        return data;
    }

    /* =====================================================
       LOAD USERS
    ===================================================== */

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

            if (error) {
                throw error;
            }

            /*
             * تابع SQL جدید JSONB برمی‌گرداند.
             */

            if (data === null) {
                users = [];
            } else if (Array.isArray(data)) {
                users = data;
            } else if (
                typeof data === "string"
            ) {
                try {
                    const parsed =
                        JSON.parse(data);

                    users =
                        Array.isArray(parsed)
                            ? parsed
                            : [];
                } catch {
                    users = [];
                }
            } else {
                users = [];
            }

            renderAll();

            showMessage(
                "اطلاعات کاربران با موفقیت بروزرسانی شد.",
                "success"
            );

        } catch (error) {
            console.error(
                "OWNER LOAD ERROR:",
                error
            );

            users = [];

            renderAll();

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
                    <td
                        colspan="8"
                        class="loading"
                    >
                        در حال بارگذاری کاربران...
                    </td>
                </tr>
            `;
        }
    }

    /* =====================================================
       STATS
    ===================================================== */

    function renderStats() {
        const total =
            users.length;

        const active =
            users.filter(
                user =>
                    user.status ===
                    "active"
            ).length;

        const pending =
            users.filter(
                user =>
                    user.status ===
                    "pending"
            ).length;

        const specialists =
            users.filter(
                user =>
                    user.user_type ===
                        "veterinarian" ||

                    user.user_type ===
                        "technical_veterinarian" ||

                    user.user_type ===
                        "veterinary_lab" ||

                    user.user_type ===
                        "diagnostic_lab" ||

                    user.user_type ===
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

        /* پشتیبانی از HTML قدیمی */

        setText(
            "statVeterinarians",
            faNumber(
                users.filter(
                    user =>
                        user.user_type ===
                            "veterinarian" ||
                        user.user_type ===
                            "technical_veterinarian"
                ).length
            )
        );

        setText(
            "statLabs",
            faNumber(
                users.filter(
                    user =>
                        user.user_type ===
                            "veterinary_lab" ||
                        user.user_type ===
                            "diagnostic_lab"
                ).length
            )
        );

        setText(
            "statOperators",
            faNumber(
                users.filter(
                    user =>
                        user.user_type ===
                            "poultry_operator" ||
                        user.user_type ===
                            "farm_operator"
                ).length
            )
        );

        setText(
            "statManagers",
            faNumber(
                users.filter(
                    user =>
                        user.user_type ===
                            "poultry_manager" ||
                        user.user_type ===
                            "farm_manager" ||
                        user.user_type ===
                            "organization_manager" ||
                        user.user_type ===
                            "company_manager"
                ).length
            )
        );
    }

    /* =====================================================
       TABLE
    ===================================================== */

    function renderTable(list) {
        const tbody =
            $("usersTableBody") ||
            $("ownerUsersTable");

        if (!tbody) return;

        const rows =
            Array.isArray(list)
                ? list
                : [];

        if (!rows.length) {
            renderEmpty(
                users.length
                    ? "کاربری با این فیلتر پیدا نشد."
                    : "هیچ کاربری برای نمایش وجود ندارد."
            );

            return;
        }

        tbody.innerHTML =
            rows.map(user => {

                const userId =
                    user.user_id ||
                    user.id;

                const professionalCode =
                    user.professional_code;

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
                                user.email ||
                                "—"
                            )}
                        </td>

                        <td>
                            ${esc(
                                user.phone ||
                                "—"
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
                                        userId
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

    /*
     * این تابع در نسخه قبلی جا افتاده بود.
     * تمام رندرهای اصلی از اینجا انجام می‌شوند.
     */

    function renderAll() {
        renderStats();
        renderTable(
            getFilteredUsers()
        );
    }

    /* =====================================================
       FILTER
    ===================================================== */

    function getFilteredUsers() {
        const search =
            $("userSearch");

        const roleFilter =
            $("roleFilter");

        const statusFilter =
            $("statusFilter");

        const query =
            search
                ? search.value
                    .trim()
                    .toLowerCase()
                : "";

        const selectedRole =
            roleFilter
                ? roleFilter.value
                : "all";

        const selectedStatus =
            statusFilter
                ? statusFilter.value
                : "all";

        return users.filter(user => {

            const searchable = [
                user.full_name,
                user.email,
                user.phone,
                user.organization_name,
                user.license_number,
                user.province,
                user.city,
                user.specialty,
                user.user_type,
                user.role
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const searchOK =
                !query ||
                searchable.includes(
                    query
                );

            let roleOK = true;

            if (
                selectedRole !==
                "all"
            ) {

                if (
                    selectedRole ===
                    "owner"
                ) {
                    roleOK =
                        user.role ===
                        "owner";
                }

                else if (
                    selectedRole ===
                    "user"
                ) {
                    roleOK =
                        user.role ===
                        "user";
                }

                else {
                    roleOK =
                        user.user_type ===
                        selectedRole;
                }
            }

            const statusOK =
                selectedStatus ===
                    "all" ||
                user.status ===
                    selectedStatus;

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

    /* =====================================================
       DETAILS
    ===================================================== */

    function openDetails(userId) {

        const user =
            users.find(
                item =>
                    String(
                        item.user_id ||
                        item.id
                    ) ===
                    String(userId)
            );

        if (!user) {
            showMessage(
                "اطلاعات کاربر پیدا نشد.",
                "error"
            );

            return;
        }

        selectedUser = user;

        const modal =
            $("ownerUserModal");

        /*
         * اگر مودال هنوز در HTML وجود ندارد،
         * اطلاعات را از دست نمی‌دهیم.
         */

        if (!modal) {
            showUserDetailsFallback(
                user
            );

            return;
        }

        setText(
            "detailName",
            user.full_name ||
            "—"
        );

        setText(
            "detailEmail",
            user.email ||
            "—"
        );

        setText(
            "detailPhone",
            user.phone ||
            "—"
        );

        setText(
            "detailRole",
            roleLabel(
                user.role
            )
        );

        setText(
            "detailUserType",
            userTypeLabel(
                user.user_type
            )
        );

        setText(
            "detailActivity",
            activityText(
                user.activity_types
            )
        );

        setText(
            "detailOrganization",
            user.organization_name ||
            "—"
        );

        setText(
            "detailLicense",
            user.license_number ||
            "—"
        );

        setText(
            "detailProvince",
            user.province ||
            "—"
        );

        setText(
            "detailCity",
            user.city ||
            "—"
        );

        setText(
            "detailSpecialty",
            user.specialty ||
            "—"
        );

        setText(
            "detailStatus",
            statusLabel(
                user.status
            )
        );

        setText(
            "detailCreated",
            formatDate(
                user.created_at
            )
        );

        setText(
            "detailLastSeen",
            formatDate(
                user.last_seen_at
            )
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
            user.notes ||
            "—"
        );

        const codeSection =
            $("professionalCodeSection");

        if (codeSection) {
            codeSection.style.display =
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

    function showUserDetailsFallback(
        user
    ) {

        const details = [
            "نام: " +
                (
                    user.full_name ||
                    "—"
                ),

            "ایمیل: " +
                (
                    user.email ||
                    "—"
                ),

            "شماره تماس: " +
                (
                    user.phone ||
                    "—"
                ),

            "نقش: " +
                roleLabel(
                    user.role
                ),

            "نوع کاربری: " +
                userTypeLabel(
                    user.user_type
                ),

            "فعالیت: " +
                activityText(
                    user.activity_types
                ),

            "مجموعه: " +
                (
                    user.organization_name ||
                    "—"
                ),

            "شماره مجوز: " +
                (
                    user.license_number ||
                    "—"
                ),

            "استان: " +
                (
                    user.province ||
                    "—"
                ),

            "شهر: " +
                (
                    user.city ||
                    "—"
                ),

            "تخصص: " +
                (
                    user.specialty ||
                    "—"
                ),

            "وضعیت: " +
                statusLabel(
                    user.status
                ),

            "کد حرفه‌ای: " +
                (
                    user.professional_code ||
                    "ندارد"
                ),

            "وضعیت کد حرفه‌ای: " +
                (
                    user.professional_code_active
                        ? "فعال"
                        : "غیرفعال"
                ),

            "وضعیت تأیید: " +
                (
                    user.is_verified
                        ? "تأیید شده"
                        : "تأیید نشده"
                )
        ];

        alert(
            details.join("\n")
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

    /* =====================================================
       PROFESSIONAL CODE
    ===================================================== */

    async function generateCode() {

        if (!selectedUser) {
            return;
        }

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
                            selectedUser.user_id ||
                            selectedUser.id
                    }
                );

            if (error) {
                throw error;
            }

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
                "کد حرفه‌ای با موفقیت ایجاد شد.",
                "success"
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

    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

        if (eventsBound) return;

        eventsBound = true;

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!button) return;

                if (
                    button.dataset.action ===
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

        const refreshButton =
            $("refreshButton");

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                loadUsers
            );
        }

        const generateButton =
            $("generateProfessionalCodeBtn");

        if (generateButton) {

            generateButton.addEventListener(
                "click",
                generateCode
            );
        }

        const logoutButton =
            $("logoutButton");

        if (logoutButton) {

            logoutButton.addEventListener(
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

    /* =====================================================
       INIT
    ===================================================== */

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

            renderStats();

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
