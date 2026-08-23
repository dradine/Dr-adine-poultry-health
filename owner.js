/* =========================================================
   ADINEH OWNER MANAGEMENT
   OWNER PANEL — STABLE JSONB VERSION
========================================================= */

(function () {
    "use strict";

    let users = [];
    let selectedUser = null;
    let initialized = false;

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
            return new Intl.DateTimeFormat(
                "fa-IR",
                {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ).format(date);
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

    function normalize(value) {
        return String(
            value === null ||
            value === undefined
                ? ""
                : value
        )
            .trim()
            .toLowerCase();
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

        return (
            map[normalize(role)] ||
            role ||
            "—"
        );
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
                "سایر"
        };

        const key = normalize(type);

        return (
            map[key] ||
            type ||
            "—"
        );
    }

    function statusLabel(status) {

        const map = {
            active: "فعال",
            pending: "در انتظار تأیید",
            suspended: "موقتاً غیرفعال",
            blocked: "مسدود",
            removed: "اخراج‌شده"
        };

        const key = normalize(status);

        return (
            map[key] ||
            status ||
            "—"
        );
    }

    function statusClass(status) {

        switch (normalize(status)) {

            case "active":
                return "badge active";

            case "pending":
                return "badge pending";

            case "suspended":
                return "badge suspended";

            case "blocked":
                return "badge blocked";

            case "removed":
                return "badge removed";

            default:
                return "badge";
        }
    }

    function activityText(activityTypes) {

        if (
            activityTypes === null ||
            activityTypes === undefined
        ) {
            return "—";
        }

        let list = activityTypes;

        if (typeof list === "string") {

            try {
                list = JSON.parse(list);
            } catch {
                return list || "—";
            }
        }

        if (!Array.isArray(list)) {
            return String(list || "—");
        }

        if (!list.length) {
            return "—";
        }

        const map = {

            broiler:
                "مرغ گوشتی",

            layer:
                "مرغ تخمگذار",

            breeder:
                "مرغ مادر",

            pullet:
                "پولت",

            hatchery:
                "کارخانه جوجه‌کشی",

            other:
                "سایر"
        };

        return list
            .map(item => {
                const key = normalize(item);
                return map[key] || item;
            })
            .join("، ");
    }

    /* =====================================================
       MESSAGE
    ===================================================== */

    let messageTimer = null;

    function showMessage(
        message,
        type = "success"
    ) {

        const box = $("message");

        if (!box) return;

        if (messageTimer) {
            clearTimeout(messageTimer);
        }

        box.textContent =
            message || "—";

        box.className =
            "message " +
            (
                type === "error"
                    ? "error"
                    : type === "info"
                        ? "info"
                        : "success"
            );

        messageTimer =
            setTimeout(() => {

                box.className =
                    "message hidden";

                box.textContent = "";

            }, 5000);
    }

    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    async function getCurrentUser() {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getUser();

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
                    phone,
                    role,
                    status,
                    is_active
                `)
                .eq(
                    "id",
                    authUser.id
                )
                .maybeSingle();

        if (error) {
            throw error;
        }

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

        setText(
            "ownerIdentity",
            "ورود با حساب مالک سامانه: " +
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
                await supabaseClient
                    .rpc(
                        "owner_get_user_directory"
                    );

            if (error) {
                throw error;
            }

            let result = data;

            /*
             * تابع SQL جدید jsonb برمی‌گرداند.
             * Supabase معمولاً آن را مستقیماً به Array
             * تبدیل می‌کند، اما برای اطمینان JSON string
             * نیز پشتیبانی می‌شود.
             */

            if (typeof result === "string") {

                try {
                    result =
                        JSON.parse(result);
                } catch {
                    result = [];
                }
            }

            if (
                result &&
                !Array.isArray(result) &&
                Array.isArray(result.data)
            ) {
                result = result.data;
            }

            users =
                Array.isArray(result)
                    ? result
                    : [];

            renderAll();

        } catch (error) {

            console.error(
                "OWNER LOAD ERROR:",
                error
            );

            users = [];

            renderAll();

            showMessage(
                error?.message ||
                "دریافت اطلاعات کاربران ناموفق بود.",
                "error"
            );

        } finally {

            setLoading(false);
        }
    }

    function setLoading(isLoading) {

        const body =
            $("usersTableBody");

        if (!body) return;

        if (isLoading) {

            body.innerHTML = `
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
       STATISTICS
    ===================================================== */

    function renderStats() {

        const total =
            users.length;

        const active =
            users.filter(
                user =>
                    normalize(
                        user.status
                    ) === "active"
            ).length;

        const pending =
            users.filter(
                user =>
                    normalize(
                        user.status
                    ) === "pending"
            ).length;

        const specialists =
            users.filter(
                user => [

                    "veterinarian",
                    "technical_veterinarian",
                    "veterinary_lab",
                    "diagnostic_lab",
                    "poultry_technical_expert"

                ].includes(
                    normalize(
                        user.user_type
                    )
                )
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
    }

    /* =====================================================
       TABLE
    ===================================================== */

    function renderTable() {

        const tbody =
            $("usersTableBody");

        if (!tbody) return;

        if (!users.length) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="empty"
                    >
                        هیچ کاربری برای نمایش وجود ندارد.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            users.map(
                user => {

                    const codeExists =
                        !!user.professional_code;

                    const isOwner =
                        normalize(
                            user.role
                        ) === "owner";

                    const displayType =
                        isOwner
                            ? "👑 مالک سامانه"
                            : userTypeLabel(
                                user.user_type
                            );

                    return `
                        <tr>

                            <td>
                                <span class="user-name">
                                    ${esc(
                                        user.full_name ||
                                        "بدون نام"
                                    )}
                                </span>

                                ${
                                    isOwner
                                        ? `
                                            <span class="muted">
                                                حساب مالک سامانه
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

                            <td
                                dir="ltr"
                                style="text-align:right"
                            >
                                ${esc(
                                    user.phone ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${esc(
                                    displayType
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
                }
            ).join("");
    }

    /* =====================================================
       DETAILS
    ===================================================== */

    function openDetails(userId) {

        const user =
            users.find(
                item =>
                    String(
                        item.user_id
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

        setText(
            "detailName",
            user.full_name
        );

        setText(
            "detailEmail",
            user.email
        );

        setText(
            "detailPhone",
            user.phone
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
            user.organization_name
        );

        setText(
            "detailLicense",
            user.license_number
        );

        setText(
            "detailProvince",
            user.province
        );

        setText(
            "detailCity",
            user.city
        );

        setText(
            "detailSpecialty",
            user.specialty
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
            "detailVerified",
            user.is_verified
                ? "تأیید شده"
                : "تأیید نشده"
        );

        /*
         * کد حرفه‌ای:
         * فقط داخل جزئیات مالک نمایش داده می‌شود.
         */

        setText(
            "detailCode",
            user.professional_code ||
            "کد حرفه‌ای ایجاد نشده"
        );

        setText(
            "detailCodeStatus",
            user.professional_code_active
                ? "فعال"
                : "غیرفعال"
        );

        const codeSection =
            $("professionalCodeSection");

        if (codeSection) {

            codeSection.style.display =
                user.user_type &&
                ![
                    "other",
                    ""
                ].includes(
                    normalize(
                        user.user_type
                    )
                )
                    ? "block"
                    : "none";
        }

        const generateButton =
            $("generateProfessionalCodeBtn");

        if (generateButton) {

            generateButton.style.display =
                user.user_type &&
                normalize(
                    user.role
                ) !== "owner"
                    ? "inline-block"
                    : "none";
        }

        const modal =
            $("ownerUserModal");

        if (!modal) return;

        modal.style.display =
            "flex";

        document.body.classList.add(
            "modal-open"
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

        if (
            !selectedUser.user_type
        ) {

            showMessage(
                "این کاربر پروفایل حرفه‌ای ندارد.",
                "error"
            );

            return;
        }

        const button =
            $("generateProfessionalCodeBtn");

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "در حال تولید...";
        }

        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .rpc(
                        "owner_generate_professional_code",
                        {
                            p_user_id:
                                selectedUser.user_id
                        }
                    );

            if (error) {
                throw error;
            }

            const code =
                typeof data === "object" &&
                data !== null
                    ? (
                        data.access_code ||
                        data.code ||
                        ""
                    )
                    : data;

            if (!code) {
                throw new Error(
                    "کد حرفه‌ای از سامانه دریافت نشد."
                );
            }

            selectedUser.professional_code =
                code;

            selectedUser.professional_code_active =
                true;

            setText(
                "detailCode",
                code
            );

            setText(
                "detailCodeStatus",
                "فعال"
            );

            renderTable();

            showMessage(
                "کد حرفه‌ای با موفقیت ایجاد شد."
            );

        } catch (error) {

            console.error(
                "PROFESSIONAL CODE ERROR:",
                error
            );

            showMessage(
                error?.message ||
                "تولید کد حرفه‌ای ناموفق بود.",
                "error"
            );

        } finally {

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "تولید / تغییر کد";
            }
        }
    }

    /* =====================================================
       SEARCH / FILTER
    ===================================================== */

    function getFilteredUsers() {

        const search =
            $("userSearch");

        const roleFilter =
            $("roleFilter");

        const statusFilter =
            $("statusFilter");

        const query =
            normalize(
                search?.value
            );

        const selectedRole =
            normalize(
                roleFilter?.value ||
                "all"
            );

        const selectedStatus =
            normalize(
                statusFilter?.value ||
                "all"
            );

        return users.filter(
            user => {

                const searchable = [
                    user.full_name,
                    user.email,
                    user.phone,
                    user.user_type,
                    user.organization_name,
                    user.city,
                    user.province,
                    user.specialty,
                    activityText(
                        user.activity_types
                    )
                ]
                    .map(normalize)
                    .join(" ");

                const matchesSearch =
                    !query ||
                    searchable.includes(
                        query
                    );

                let matchesRole = true;

                if (
                    selectedRole !==
                    "all"
                ) {

                    if (
                        selectedRole ===
                        "owner"
                    ) {

                        matchesRole =
                            normalize(
                                user.role
                            ) === "owner";

                    } else {

                        matchesRole =
                            normalize(
                                user.user_type
                            ) === selectedRole;
                    }
                }

                const matchesStatus =
                    selectedStatus ===
                    "all" ||
                    normalize(
                        user.status
                    ) === selectedStatus;

                return (
                    matchesSearch &&
                    matchesRole &&
                    matchesStatus
                );
            }
        );
    }

    function renderFilteredTable() {

        const filtered =
            getFilteredUsers();

        const tbody =
            $("usersTableBody");

        if (!tbody) return;

        if (!filtered.length) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="empty"
                    >
                        کاربری با این مشخصات پیدا نشد.
                    </td>
                </tr>
            `;

            return;
        }

        const backup =
            users;

        users = filtered;

        renderTable();

        users = backup;
    }

    function applyFilters() {

        renderFilteredTable();
    }

    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

        if (initialized) {
            return;
        }

        initialized = true;

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!button) {
                    return;
                }

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
                async function () {

                    refresh.disabled =
                        true;

                    try {

                        await loadUsers();

                    } finally {

                        refresh.disabled =
                            false;
                    }
                }
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

        const logout =
            $("logoutButton");

        if (logout) {

            logout.addEventListener(
                "click",
                async function () {

                    logout.disabled =
                        true;

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

                        logout.disabled =
                            false;

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
       RENDER
    ===================================================== */

    function renderAll() {

        renderStats();
        renderTable();
    }

    /* =====================================================
       INIT
    ===================================================== */

    async function init() {

        try {

            bindEvents();

            await verifyOwner();

            await loadUsers();

        } catch (error) {

            console.error(
                "OWNER INIT ERROR:",
                error
            );

            showMessage(
                error?.message ||
                "خطا در راه‌اندازی پنل مالک.",
                "error"
            );

            const body =
                $("usersTableBody");

            if (body) {

                body.innerHTML = `
                    <tr>
                        <td
                            colspan="8"
                            class="empty"
                        >
                            ${esc(
                                error?.message ||
                                "خطا در دریافت اطلاعات"
                            )}
                        </td>
                    </tr>
                `;
            }
        }
    }

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );

    } else {

        init();
    }

})();
