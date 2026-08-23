/* =========================================================
   ADINEH OWNER MANAGEMENT
   نسخه اصلاحی - احراز مالک + تست Session + مدیریت کاربران
========================================================= */

(function () {
    "use strict";

    let users = [];
    let selectedUser = null;

    const $ = (id) => document.getElementById(id);

    /* =====================================================
       SECURITY / HELPERS
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

        try {
            const d = new Date(value);

            if (isNaN(d.getTime())) {
                return "—";
            }

            return new Intl.DateTimeFormat(
                "fa-IR",
                {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ).format(d);

        } catch {
            return "—";
        }
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

            poultry_manager:
                "👨‍💼 مدیر واحد طیور",

            veterinary_lab:
                "🔬 آزمایشگاه تشخیص دامپزشکی",

            poultry_technical_expert:
                "📊 کارشناس فنی طیور",

            organization_manager:
                "🏢 مدیر / نماینده مجموعه",

            other:
                "سایر",

            /* سازگاری با نام‌های احتمالی قبلی */

            farm_operator:
                "🐔 بهره‌بردار واحد طیور",

            farm_manager:
                "👨‍💼 مدیر واحد طیور",

            diagnostic_lab:
                "🔬 آزمایشگاه تشخیص دامپزشکی",

            company_manager:
                "🏢 مدیر / نماینده مجموعه"
        };

        return map[type] || type || "—";
    }

    function statusLabel(status) {

        const map = {

            active:
                "فعال",

            pending:
                "در انتظار تأیید",

            suspended:
                "موقتاً غیرفعال",

            blocked:
                "مسدود",

            removed:
                "حذف شده"
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

    function activityText(activityTypes) {

        if (!activityTypes) {
            return "—";
        }

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

        if (!list.length) {
            return "—";
        }

        const map = {

            broiler:
                "گوشتی",

            layer:
                "تخمگذار",

            breeder:
                "مادر",

            pullet:
                "پولت",

            hatchery:
                "جوجه‌کشی",

            other:
                "سایر"
        };

        return list
            .map(x => map[x] || x)
            .join("، ");
    }

    /* =====================================================
       MESSAGE
    ===================================================== */

    function showMessage(
        message,
        type = "success"
    ) {

        const box =
            $("message") ||
            $("ownerStatus");

        if (!box) return;

        box.textContent =
            message || "";

        box.className =
            "message " +
            (type === "error"
                ? "error"
                : type === "info"
                    ? "info"
                    : "success");

        if (
            box.classList.contains("hidden")
        ) {
            box.classList.remove("hidden");
        }

        clearTimeout(
            showMessage.timer
        );

        showMessage.timer =
            setTimeout(() => {

                if (
                    box &&
                    box.id === "message"
                ) {
                    box.classList.add(
                        "hidden"
                    );
                }

            }, 5000);
    }

    /* =====================================================
       AUTH USER
    ===================================================== */

    async function getCurrentUser() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {
            throw new Error(
                "اتصال Supabase در دسترس نیست."
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
                "کاربر وارد نشده است."
            );
        }

        return data.user;
    }

    /* =====================================================
       REAL SESSION TEST
    ===================================================== */

    async function testOwnerSession() {

        try {

            const {
                data: sessionData,
                error: sessionError
            } =
                await supabaseClient
                    .auth
                    .getSession();

            if (sessionError) {
                console.error(
                    "SESSION ERROR:",
                    sessionError
                );
            }

            console.log(
                "CURRENT SESSION:",
                sessionData &&
                sessionData.session
                    ? sessionData.session.user
                    : null
            );

            /*
             * RPC مخصوص تست Session واقعی سایت
             */

            const {
                data,
                error
            } =
                await supabaseClient.rpc(
                    "owner_session_test"
                );

            console.log(
                "OWNER SESSION TEST:",
                data,
                error
            );

            if (error) {

                console.warn(
                    "owner_session_test RPC failed:",
                    error
                );

                return null;
            }

            return data;

        } catch (error) {

            console.error(
                "OWNER SESSION TEST ERROR:",
                error
            );

            return null;
        }
    }

    /* =====================================================
       VERIFY OWNER
    ===================================================== */

    async function verifyOwner() {

        const authUser =
            await getCurrentUser();

        console.log(
            "AUTH USER:",
            authUser
        );

        /*
         * ابتدا اطلاعات profiles را می‌گیریم.
         */

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
                .eq(
                    "id",
                    authUser.id
                )
                .maybeSingle();

        if (error) {
            throw error;
        }

        console.log(
            "OWNER PROFILE:",
            data
        );

        if (!data) {

            throw new Error(
                "پروفایل کاربر در سامانه پیدا نشد."
            );
        }

        /*
         * احراز مالک
         */

        if (
            data.role !== "owner" ||
            data.status !== "active" ||
            data.is_active !== true
        ) {

            throw new Error(
                "این حساب دسترسی مالک سامانه را ندارد."
            );
        }

        /*
         * نمایش هویت مالک در صفحه
         */

        const identity =
            $("ownerIdentity");

        if (identity) {

            identity.textContent =
                "مالک سامانه: " +
                (
                    data.full_name ||
                    "دکتر سعید ادینه وند"
                ) +
                " | " +
                (
                    data.email ||
                    authUser.email ||
                    "—"
                );
        }

        return data;
    }

    /* =====================================================
       LOAD USERS
    ===================================================== */

    async function loadUsers() {

        setLoading(true);

        try {

            /*
             * تست Session واقعی
             * فقط برای بررسی امنیت و احراز مالک
             */

            await testOwnerSession();

            /*
             * دریافت لیست کاربران
             */

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

            users =
                Array.isArray(data)
                    ? data
                    : [];

            console.log(
                "OWNER USERS:",
                users
            );

            renderAll();

            /*
             * اگر هیچ کاربری برنگشت
             */

            if (!users.length) {

                showMessage(
                    "اتصال برقرار است اما کاربری برای نمایش دریافت نشد.",
                    "info"
                );
            }

        } catch (error) {

            console.error(
                "OWNER LOAD ERROR:",
                error
            );

            users = [];

            showMessage(
                error &&
                error.message
                    ? error.message
                    : "دریافت اطلاعات کاربران ناموفق بود.",
                "error"
            );

            renderEmpty(
                "خطا در دریافت اطلاعات کاربران"
            );

        } finally {

            setLoading(false);
        }
    }

    /* =====================================================
       LOADING
    ===================================================== */

    function setLoading(isLoading) {

        const loading =
            $("ownerLoading");

        if (loading) {

            loading.style.display =
                isLoading
                    ? "block"
                    : "none";
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
                x =>
                    x.status ===
                    "active"
            ).length;

        const pending =
            users.filter(
                x =>
                    x.status ===
                    "pending"
            ).length;

        const specialists =
            users.filter(
                x => {

                    return (
                        x.user_type ===
                            "veterinarian" ||

                        x.user_type ===
                            "technical_veterinarian" ||

                        x.user_type ===
                            "veterinary_lab" ||

                        x.user_type ===
                            "poultry_technical_expert"
                    );
                }
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
            $("usersTableBody") ||
            $("ownerUsersTable");

        if (!tbody) {
            return;
        }

        if (!users.length) {

            renderEmpty(
                "هیچ کاربری برای نمایش وجود ندارد."
            );

            return;
        }

        tbody.innerHTML =
            users.map(
                user => {

                    const code =
                        user.professional_code
                            ? "••••"
                            : "—";

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
                                ${formatDate(
                                    user.created_at
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    user.last_seen_at
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
       USER DETAILS
    ===================================================== */

    function openDetails(userId) {

        const user =
            users.find(
                x =>
                    String(x.user_id) ===
                    String(userId)
            );

        if (!user) {

            showMessage(
                "اطلاعات کاربر پیدا نشد.",
                "error"
            );

            return;
        }

        selectedUser =
            user;

        const modal =
            $("ownerUserModal");

        /*
         * اگر HTML فعلی modal ندارد،
         * اطلاعات را در console نگه می‌داریم
         * و از اجرای JS جلوگیری نمی‌کنیم.
         */

        if (!modal) {

            console.log(
                "SELECTED OWNER USER:",
                user
            );

            showMessage(
                "اطلاعات کاربر در Console ثبت شد.",
                "info"
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

        /*
         * کد حرفه‌ای
         */

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

        const verified =
            $("detailVerified");

        if (verified) {

            verified.textContent =
                user.is_verified
                    ? "تأیید شده"
                    : "تأیید نشده";
        }

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

    /* =====================================================
       CLOSE DETAILS
    ===================================================== */

    function closeDetails() {

        const modal =
            $("ownerUserModal");

        if (!modal) {
            return;
        }

        modal.style.display =
            "none";

        document.body.classList.remove(
            "modal-open"
        );

        selectedUser =
            null;
    }

    /* =====================================================
       GENERATE PROFESSIONAL CODE
    ===================================================== */

    async function generateCode() {

        if (!selectedUser) {

            showMessage(
                "ابتدا یک کاربر را انتخاب کنید.",
                "error"
            );

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
                await supabaseClient.rpc(
                    "owner_generate_professional_code",
                    {
                        p_user_id:
                            selectedUser.user_id
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

            renderTable();

            showMessage(
                "کد حرفه‌ای با موفقیت ایجاد / تغییر کرد."
            );

        } catch (error) {

            console.error(
                "GENERATE CODE ERROR:",
                error
            );

            showMessage(
                error &&
                error.message
                    ? error.message
                    : "تولید کد ناموفق بود.",
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
       SEARCH
    ===================================================== */

    function filterUsers() {

        const input =
            $("userSearch") ||
            $("ownerSearch");

        if (!input) {
            return;
        }

        const query =
            input.value
                .trim()
                .toLowerCase();

        const roleFilter =
            $("roleFilter");

        const statusFilter =
            $("statusFilter");

        const selectedRole =
            roleFilter
                ? roleFilter.value
                : "all";

        const selectedStatus =
            statusFilter
                ? statusFilter.value
                : "all";

        const rows =
            document.querySelectorAll(
                "#usersTableBody tr, #ownerUsersTable tr"
            );

        rows.forEach(
            row => {

                const text =
                    row.textContent
                        .toLowerCase();

                const userId =
                    row
                        .querySelector(
                            "[data-user-id]"
                        )
                        ?.dataset
                        .userId;

                const user =
                    users.find(
                        x =>
                            String(
                                x.user_id
                            ) ===
                            String(
                                userId
                            )
                    );

                const matchesSearch =
                    !query ||
                    text.includes(
                        query
                    );

                let matchesRole =
                    true;

                if (
                    selectedRole !==
                    "all"
                ) {

                    if (
                        selectedRole ===
                        "owner"
                    ) {

                        matchesRole =
                            user &&
                            user.role ===
                                "owner";

                    } else {

                        matchesRole =
                            user &&
                            (
                                user.user_type ===
                                selectedRole
                            );
                    }
                }

                const matchesStatus =
                    selectedStatus ===
                        "all" ||
                    (
                        user &&
                        user.status ===
                            selectedStatus
                    );

                row.style.display =
                    (
                        matchesSearch &&
                        matchesRole &&
                        matchesStatus
                    )
                        ? ""
                        : "none";
            }
        );
    }

    /* =====================================================
       EMPTY
    ===================================================== */

    function renderEmpty(message) {

        const tbody =
            $("usersTableBody") ||
            $("ownerUsersTable");

        if (!tbody) {
            return;
        }

        const colspan =
            tbody.id ===
                "usersTableBody"
                ? 8
                : 7;

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="${colspan}"
                    class="empty"
                >
                    ${esc(
                        message
                    )}
                </td>
            </tr>
        `;
    }

    /* =====================================================
       RENDER ALL
    ===================================================== */

    function renderAll() {

        renderStats();

        renderTable();

        filterUsers();
    }

    /* =====================================================
       SET TEXT
    ===================================================== */

    function setText(
        id,
        value
    ) {

        const el =
            $(id);

        if (!el) {
            return;
        }

        el.textContent =
            value === null ||
            value === undefined ||
            value === ""
                ? "—"
                : value;
    }

    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

        /*
         * جلوگیری از دوبار Bind شدن
         */

        if (
            document.body.dataset
                .ownerEventsBound ===
            "true"
        ) {
            return;
        }

        document.body.dataset
            .ownerEventsBound =
            "true";

        /* -----------------------------------------------
           Table actions
        ------------------------------------------------ */

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

        /* -----------------------------------------------
           Close modal
        ------------------------------------------------ */

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

        /* -----------------------------------------------
           Search
        ------------------------------------------------ */

        const search =
            $("userSearch") ||
            $("ownerSearch");

        if (search) {

            search.addEventListener(
                "input",
                filterUsers
            );
        }

        /* -----------------------------------------------
           Role filter
        ------------------------------------------------ */

        const roleFilter =
            $("roleFilter");

        if (roleFilter) {

            roleFilter.addEventListener(
                "change",
                filterUsers
            );
        }

        /* -----------------------------------------------
           Status filter
        ------------------------------------------------ */

        const statusFilter =
            $("statusFilter");

        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                filterUsers
            );
        }

        /* -----------------------------------------------
           Refresh
        ------------------------------------------------ */

        const refresh =
            $("refreshButton");

        if (refresh) {

            refresh.addEventListener(
                "click",
                async function () {

                    refresh.disabled =
                        true;

                    refresh.textContent =
                        "در حال بروزرسانی...";

                    try {

                        await loadUsers();

                    } finally {

                        refresh.disabled =
                            false;

                        refresh.textContent =
                            "↻ بروزرسانی";
                    }
                }
            );
        }

        /* -----------------------------------------------
           Professional code
        ------------------------------------------------ */

        const generateButton =
            $("generateProfessionalCodeBtn");

        if (generateButton) {

            generateButton.addEventListener(
                "click",
                generateCode
            );
        }

        /* -----------------------------------------------
           Logout
        ------------------------------------------------ */

        const logout =
            $("logoutButton");

        if (logout) {

            logout.addEventListener(
                "click",
                async function () {

                    try {

                        const {
                            error
                        } =
                            await supabaseClient
                                .auth
                                .signOut();

                        if (error) {
                            throw error;
                        }

                        window.location.href =
                            "login.html";

                    } catch (error) {

                        console.error(
                            "LOGOUT ERROR:",
                            error
                        );

                        showMessage(
                            "خروج از حساب ناموفق بود.",
                            "error"
                        );
                    }
                }
            );
        }

        /* -----------------------------------------------
           Escape
        ------------------------------------------------ */

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

            /*
             * بررسی وجود Supabase
             */

            if (
                typeof supabaseClient ===
                "undefined"
            ) {

                throw new Error(
                    "supabaseClient پیدا نشد. config.js را بررسی کنید."
                );
            }

            /*
             * اول احراز هویت
             */

            await verifyOwner();

            /*
             * Bind eventها
             */

            bindEvents();

            /*
             * دریافت کاربران
             */

            await loadUsers();

        } catch (error) {

            console.error(
                "OWNER INIT ERROR:",
                error
            );

            showMessage(
                error &&
                error.message
                    ? error.message
                    : "خطا در دسترسی به پنل مالک.",
                "error"
            );
        }
    }

    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }

})();
