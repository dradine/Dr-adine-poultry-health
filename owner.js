/* =========================================================
   ADINEH OWNER MANAGEMENT
   OWNER PANEL — COMPLETE USER DIRECTORY
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STATE
    ===================================================== */

    let users = [];
    let filteredUsers = [];
    let selectedUser = null;

    let isLoading = false;
    let initialized = false;


    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = (id) =>
        document.getElementById(id);


    function esc(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

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

        if (!value) {
            return "—";
        }

        try {

            const d =
                new Date(value);

            if (
                Number.isNaN(
                    d.getTime()
                )
            ) {
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


    function setText(id, value) {

        const element =
            $(id);

        if (!element) {
            return;
        }

        element.textContent =
            value === null ||
            value === undefined ||
            value === ""
                ? "—"
                : String(value);
    }


    /* =====================================================
       LABELS
    ===================================================== */

    function roleLabel(role) {

        const map = {

            owner:
                "مالک",

            admin:
                "مدیر",

            user:
                "کاربر"

        };

        return (
            map[role] ||
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

        return (
            map[type] ||
            type ||
            "—"
        );
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
                "اخراج‌شده"

        };

        return (
            map[status] ||
            status ||
            "—"
        );
    }


    function statusClass(status) {

        if (
            status === "active"
        ) {
            return "active";
        }

        if (
            status === "pending"
        ) {
            return "pending";
        }

        if (
            status === "suspended"
        ) {
            return "suspended";
        }

        if (
            status === "blocked"
        ) {
            return "blocked";
        }

        if (
            status === "removed"
        ) {
            return "removed";
        }

        return "pending";
    }


    function activityText(activityTypes) {

        if (!activityTypes) {
            return "—";
        }

        let list =
            activityTypes;


        if (
            typeof activityTypes ===
            "string"
        ) {

            try {

                list =
                    JSON.parse(
                        activityTypes
                    );

            } catch {

                return activityTypes;
            }
        }


        if (
            !Array.isArray(list)
        ) {

            return String(list);
        }


        if (
            !list.length
        ) {

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
            .map(
                item =>
                    map[item] ||
                    item
            )
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
            $("message");

        if (!box) {
            return;
        }

        box.textContent =
            message || "";

        box.className =
            "message " +
            (
                type === "error"
                    ? "error"
                    : type === "info"
                        ? "info"
                        : "success"
            );

        box.classList.remove(
            "hidden"
        );


        window.clearTimeout(
            showMessage.timer
        );


        showMessage.timer =
            window.setTimeout(
                () => {

                    box.className =
                        "message hidden";

                },
                5000
            );
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
                "اتصال Supabase برقرار نشده است."
            );
        }


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
                .select(
                    `
                    id,
                    full_name,
                    email,
                    phone,
                    role,
                    status,
                    is_active
                    `
                )
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
                "پروفایل مالک در سامانه پیدا نشد."
            );
        }


        if (
            data.role !== "owner" ||
            data.status !== "active" ||
            data.is_active !== true
        ) {

            throw new Error(
                "این صفحه فقط برای مالک فعال سامانه قابل دسترسی است."
            );
        }


        setText(
            "ownerIdentity",
            "ورود موفق — " +
            (
                data.full_name ||
                data.email ||
                "مالک سامانه"
            )
        );


        return data;
    }


    /* =====================================================
       LOAD USERS
    ===================================================== */

    async function loadUsers() {

        if (isLoading) {
            return;
        }

        isLoading = true;

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


            users =
                Array.isArray(data)
                    ? data
                    : [];


            filteredUsers =
                [...users];


            renderAll();


        } catch (error) {

            console.error(
                "OWNER LOAD ERROR:",
                error
            );


            users = [];
            filteredUsers = [];


            renderStats();
            renderEmpty(
                error &&
                error.message
                    ? error.message
                    : "خطا در دریافت کاربران"
            );


            showMessage(
                error &&
                error.message
                    ? error.message
                    : "دریافت اطلاعات کاربران ناموفق بود.",
                "error"
            );


        } finally {

            isLoading = false;

            setLoading(false);
        }
    }


    function setLoading(
        loading
    ) {

        const button =
            $("refreshButton");

        if (!button) {
            return;
        }

        button.disabled =
            loading;

        button.textContent =
            loading
                ? "در حال بروزرسانی..."
                : "↻ بروزرسانی";
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
                user => {

                    const type =
                        user.user_type;

                    return (

                        type ===
                            "veterinarian" ||

                        type ===
                            "technical_veterinarian" ||

                        type ===
                            "poultry_technical_expert" ||

                        type ===
                            "veterinary_lab" ||

                        type ===
                            "diagnostic_lab"

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
            faNumber(
                specialists
            )
        );
    }


    /* =====================================================
       TABLE
    ===================================================== */

    function renderTable() {

        const tbody =
            $("usersTableBody");

        if (!tbody) {
            return;
        }


        if (
            !filteredUsers.length
        ) {

            renderEmpty(
                "کاربری مطابق فیلتر انتخاب‌شده پیدا نشد."
            );

            return;
        }


        tbody.innerHTML =
            filteredUsers
                .map(
                    renderUserRow
                )
                .join("");
    }


    function renderUserRow(
        user
    ) {

        const code =
            user.professional_code
                ? "دارای کد"
                : "بدون کد";


        return `

        <tr>

            <td>

                <span class="user-name">

                    ${esc(
                        user.full_name ||
                        "بدون نام"
                    )}

                </span>

                <span class="muted">

                    ${esc(
                        user.role
                            ? roleLabel(
                                user.role
                            )
                            : ""
                    )}

                </span>

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

                <span class="muted">

                    ${esc(code)}

                </span>

            </td>


            <td>

                <span
                    class="badge ${statusClass(
                        user.status
                    )}"
                >

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


    function renderEmpty(
        message
    ) {

        const tbody =
            $("usersTableBody");

        if (!tbody) {
            return;
        }


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
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
       FILTERS
    ===================================================== */

    function applyFilters() {

        const search =
            (
                $("userSearch") &&
                $("userSearch").value
                    ? $("userSearch").value
                    : ""
            )
            .trim()
            .toLowerCase();


        const role =
            $("roleFilter")
                ? $("roleFilter").value
                : "all";


        const status =
            $("statusFilter")
                ? $("statusFilter").value
                : "all";


        filteredUsers =
            users.filter(
                user => {

                    const searchable =
                        [

                            user.full_name,

                            user.email,

                            user.phone,

                            user.user_type,

                            user.organization_name,

                            user.license_number,

                            user.province,

                            user.city,

                            user.specialty

                        ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    const searchOK =
                        !search ||
                        searchable.includes(
                            search
                        );


                    const roleOK =
                        role === "all" ||
                        user.role === role ||
                        user.user_type === role;


                    const statusOK =
                        status === "all" ||
                        user.status === status;


                    return (
                        searchOK &&
                        roleOK &&
                        statusOK
                    );
                }
            );


        renderTable();
    }


    /* =====================================================
       DETAILS
    ===================================================== */

    function openDetails(
        userId
    ) {

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


        selectedUser =
            user;


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
                : user.professional_code
                    ? "غیرفعال"
                    : "کد ندارد"
        );


        setText(
            "detailCodeUpdated",
            formatDate(
                user.professional_code_updated_at
            )
        );


        const modal =
            $("ownerUserModal");


        if (!modal) {
            return;
        }


        modal.classList.add(
            "show"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "modal-open"
        );


        updateCodeButtons();
    }


    function closeDetails() {

        const modal =
            $("ownerUserModal");


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "show"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.classList.remove(
            "modal-open"
        );


        selectedUser =
            null;
    }


    /* =====================================================
       PROFESSIONAL CODE
    ===================================================== */

    function updateCodeButtons() {

        const generate =
            $("generateProfessionalCodeBtn");

        const toggle =
            $("toggleProfessionalCodeBtn");


        if (!selectedUser) {

            if (generate) {
                generate.disabled = true;
            }

            if (toggle) {
                toggle.disabled = true;
            }

            return;
        }


        if (generate) {

            generate.disabled =
                !selectedUser.user_type;

        }


        if (toggle) {

            toggle.disabled =
                !selectedUser.professional_code;

            toggle.textContent =
                selectedUser.professional_code_active
                    ? "غیرفعال کردن کد"
                    : "فعال کردن کد";
        }
    }


    async function generateProfessionalCode() {

        if (!selectedUser) {
            return;
        }


        if (
            !selectedUser.user_type
        ) {

            showMessage(
                "این کاربر هنوز پروفایل حرفه‌ای ندارد.",
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
                        data.professional_code ||
                        data.code ||
                        ""
                    )
                    : data;


            if (!code) {

                throw new Error(
                    "کد حرفه‌ای از سرور دریافت نشد."
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


            setText(
                "detailCodeUpdated",
                formatDate(
                    new Date()
                )
            );


            updateCodeButtons();


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
                error &&
                error.message
                    ? error.message
                    : "تولید کد حرفه‌ای ناموفق بود.",
                "error"
            );


        } finally {

            if (button) {

                button.disabled =
                    !selectedUser ||
                    !selectedUser.user_type;

                button.textContent =
                    "تولید / تغییر کد";
            }
        }
    }


    async function toggleProfessionalCode() {

        if (!selectedUser) {
            return;
        }


        if (
            !selectedUser.professional_code
        ) {

            showMessage(
                "برای این کاربر هنوز کدی وجود ندارد.",
                "error"
            );

            return;
        }


        const targetState =
            !Boolean(
                selectedUser.professional_code_active
            );


        const button =
            $("toggleProfessionalCodeBtn");


        if (button) {
            button.disabled = true;
        }


        try {

            /*
             * ابتدا تلاش می‌کنیم RPC اختصاصی را اجرا کنیم.
             */

            const {
                data,
                error
            } =
                await supabaseClient
                    .rpc(
                        "owner_set_professional_code_status",
                        {
                            p_user_id:
                                selectedUser.user_id,

                            p_is_active:
                                targetState
                        }
                    );


            if (error) {
                throw error;
            }


            selectedUser.professional_code_active =
                targetState;


            if (
                data &&
                typeof data ===
                "object"
            ) {

                if (
                    data.is_active !==
                    undefined
                ) {

                    selectedUser.professional_code_active =
                        data.is_active;
                }
            }


            setText(
                "detailCodeStatus",
                selectedUser.professional_code_active
                    ? "فعال"
                    : "غیرفعال"
            );


            updateCodeButtons();


            showMessage(
                selectedUser.professional_code_active
                    ? "کد حرفه‌ای فعال شد."
                    : "کد حرفه‌ای غیرفعال شد."
            );


        } catch (error) {

            console.error(
                "TOGGLE PROFESSIONAL CODE ERROR:",
                error
            );


            showMessage(
                error &&
                error.message
                    ? error.message
                    : "تغییر وضعیت کد ناموفق بود.",
                "error"
            );


            updateCodeButtons();
        }
    }


    /* =====================================================
       REFRESH
    ===================================================== */

    async function refreshUsers() {

        try {

            await verifyOwner();

            await loadUsers();

            showMessage(
                "اطلاعات کاربران بروزرسانی شد."
            );

        } catch (error) {

            console.error(
                "REFRESH ERROR:",
                error
            );


            showMessage(
                error &&
                error.message
                    ? error.message
                    : "بروزرسانی ناموفق بود.",
                "error"
            );
        }
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

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
                error &&
                error.message
                    ? error.message
                    : "خروج ناموفق بود.",
                "error"
            );
        }
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

        if (initialized) {
            return;
        }


        initialized = true;


        const refresh =
            $("refreshButton");


        if (refresh) {

            refresh.addEventListener(
                "click",
                refreshUsers
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


        const logout =
            $("logoutButton");


        if (logout) {

            logout.addEventListener(
                "click",
                logout
            );
        }


        const generate =
            $("generateProfessionalCodeBtn");


        if (generate) {

            generate.addEventListener(
                "click",
                generateProfessionalCode
            );
        }


        const toggle =
            $("toggleProfessionalCodeBtn");


        if (toggle) {

            toggle.addEventListener(
                "click",
                toggleProfessionalCode
            );
        }


        const close =
            $("closeOwnerModal");


        if (close) {

            close.addEventListener(
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


        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "[data-action='details']"
                    );


                if (!button) {
                    return;
                }


                openDetails(
                    button.dataset.userId
                );
            }
        );


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
       RENDER ALL
    ===================================================== */

    function renderAll() {

        renderStats();
        applyFilters();
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
                error &&
                error.message
                    ? error.message
                    : "خطا در بارگذاری پنل مالک.",
                "error"
            );


            renderEmpty(
                error &&
                error.message
                    ? error.message
                    : "خطا در بارگذاری پنل مالک."
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
            {
                once:true
            }
        );

    } else {

        init();
    }

})();
