/* =========================================================
   ADINEH OWNER MANAGEMENT
   OWNER PANEL — FINAL VERSION
   ========================================================= */

(function () {
    "use strict";

    let users = [];
    let selectedUser = null;
    let isInitialized = false;

    const $ = (id) => document.getElementById(id);

    /* =====================================================
       SECURITY / DISPLAY HELPERS
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

            const date = new Date(value);

            if (isNaN(date.getTime())) {
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
            ).format(date);

        } catch {
            return "—";
        }
    }

    /* =====================================================
       LABELS
    ===================================================== */

    function roleLabel(role) {

        const map = {

            owner: "مالک سامانه",

            admin: "مدیر سامانه",

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
                "سایر"

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
                "معلق",

            blocked:
                "مسدود",

            removed:
                "حذف شده"

        };

        return map[status] || status || "—";
    }

    function statusClass(status) {

        switch (status) {

            case "active":
                return "status-active";

            case "pending":
                return "status-pending";

            case "suspended":
                return "status-warning";

            case "blocked":
                return "status-danger";

            default:
                return "status-neutral";
        }
    }

    /* =====================================================
       ACTIVITY
    ===================================================== */

    function activityText(activityTypes) {

        if (
            activityTypes === null ||
            activityTypes === undefined ||
            activityTypes === ""
        ) {
            return "—";
        }

        let list = activityTypes;

        if (typeof list === "string") {

            try {
                list = JSON.parse(list);
            } catch {
                return list;
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
            .map(item => map[item] || item)
            .join("، ");
    }

    /* =====================================================
       MESSAGE
    ===================================================== */

    function showMessage(
        message,
        type = "success"
    ) {

        const box = $("ownerStatus");

        if (!box) return;

        box.textContent =
            message || "";

        box.className =
            "owner-status " +
            (
                type === "error"
                    ? "error"
                    : "success"
            );

        clearTimeout(
            showMessage.timer
        );

        showMessage.timer =
            setTimeout(
                () => {

                    box.className =
                        "owner-status";

                    box.textContent =
                        "";

                },
                5000
            );
    }

    /* =====================================================
       SUPABASE USER
    ===================================================== */

    async function getCurrentUser() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {
            throw new Error(
                "اتصال Supabase پیدا نشد."
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

    /* =====================================================
       OWNER VERIFICATION
    ===================================================== */

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
                "پروفایل مالک در سامانه پیدا نشد."
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

            users =
                Array.isArray(data)
                    ? data
                    : [];

            renderAll();

        } catch (error) {

            console.error(
                "OWNER LOAD ERROR:",
                error
            );

            showMessage(
                error.message ||
                "دریافت اطلاعات کاربران ناموفق بود.",
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

        if (!loading) return;

        loading.style.display =
            isLoading
                ? "block"
                : "none";
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
                    user.status === "active"
            ).length;

        const veterinarians =
            users.filter(
                user =>
                    user.user_type ===
                        "veterinarian" ||
                    user.user_type ===
                        "technical_veterinarian"
            ).length;

        const laboratories =
            users.filter(
                user =>
                    user.user_type ===
                    "veterinary_lab"
            ).length;

        const operators =
            users.filter(
                user =>
                    user.user_type ===
                    "poultry_operator"
            ).length;

        const managers =
            users.filter(
                user =>
                    user.user_type ===
                        "poultry_manager" ||
                    user.user_type ===
                        "organization_manager"
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
            "statVeterinarians",
            faNumber(veterinarians)
        );

        setText(
            "statLabs",
            faNumber(laboratories)
        );

        setText(
            "statOperators",
            faNumber(operators)
        );

        setText(
            "statManagers",
            faNumber(managers)
        );
    }

    /* =====================================================
       TABLE
    ===================================================== */

    function renderTable() {

        const tbody =
            $("ownerUsersTable");

        if (!tbody) return;

        if (!users.length) {

            renderEmpty(
                "هیچ کاربری برای نمایش وجود ندارد."
            );

            return;
        }

        tbody.innerHTML =
            users.map(
                user => {

                    /*
                     * مالک باید کد واقعی را ببیند.
                     * سایر کاربران از طریق RLS/RPC
                     * به این اطلاعات دسترسی ندارند.
                     */

                    const code =
                        user.professional_code
                            ? faNumber(
                                user.professional_code
                              )
                            : "ندارد";

                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${esc(
                                        user.full_name ||
                                        "بدون نام"
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${esc(
                                    user.email ||
                                    "—"
                                )}
                            </td>

                            <td dir="ltr">
                                ${esc(
                                    user.phone ||
                                    "—"
                                )}
                            </td>

                            <td>
                                ${userTypeLabel(
                                    user.user_type
                                )}
                            </td>

                            <td>
                                <span
                                    class="owner-code"
                                    dir="ltr"
                                >
                                    ${code}
                                </span>
                            </td>

                            <td>
                                <span
                                    class="${statusClass(
                                        user.status
                                    )}"
                                >
                                    ${statusLabel(
                                        user.status
                                    )}
                                </span>
                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="btn btn-small btn-primary"
                                    data-user-id="${esc(
                                        user.user_id
                                    )}"
                                    data-action="details"
                                >
                                    جزئیات
                                </button>

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
                    String(item.user_id) ===
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

        if (!modal) {

            showMessage(
                "ساختار پنجره جزئیات در HTML پیدا نشد.",
                "error"
            );

            return;
        }

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

        if (!modal) return;

        modal.style.display =
            "none";

        document.body.classList.remove(
            "modal-open"
        );

        selectedUser =
            null;
    }

    /* =====================================================
       GENERATE / CHANGE PROFESSIONAL CODE
    ===================================================== */

    async function generateCode() {

        if (!selectedUser) {

            showMessage(
                "ابتدا یک کاربر را انتخاب کنید.",
                "error"
            );

            return;
        }

        if (!selectedUser.user_type) {

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

            /*
             * RPC باید کد چهار رقمی برگرداند.
             */

            const newCode =
                data === null ||
                data === undefined
                    ? ""
                    : String(data);

            if (!newCode) {

                throw new Error(
                    "کد تولید شد اما مقدار کد از سرور دریافت نشد."
                );
            }

            selectedUser.professional_code =
                newCode;

            selectedUser.professional_code_active =
                true;

            setText(
                "detailCode",
                newCode
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
                error.message ||
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
       SEARCH
    ===================================================== */

    function filterUsers() {

        const input =
            $("ownerSearch");

        if (!input) return;

        const query =
            input.value
                .trim()
                .toLowerCase();

        const rows =
            document.querySelectorAll(
                "#ownerUsersTable tr"
            );

        rows.forEach(
            row => {

                const text =
                    row.textContent
                        .toLowerCase();

                row.style.display =
                    !query ||
                    text.includes(query)
                        ? ""
                        : "none";
            }
        );
    }

    /* =====================================================
       EMPTY TABLE
    ===================================================== */

    function renderEmpty(message) {

        const tbody =
            $("ownerUsersTable");

        if (!tbody) return;

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:35px;
                    "
                >
                    ${esc(message)}
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
    }

    /* =====================================================
       SAFE TEXT
    ===================================================== */

    function setText(
        id,
        value
    ) {

        const element =
            $(id);

        if (!element) return;

        element.textContent =
            (
                value === null ||
                value === undefined ||
                value === ""
            )
                ? "—"
                : value;
    }

    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

        if (isInitialized) {
            return;
        }

        isInitialized =
            true;

        /* -----------------------------------------------
           TABLE DETAILS
        ------------------------------------------------ */

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

        /* -----------------------------------------------
           CLOSE BUTTON
        ------------------------------------------------ */

        const closeButton =
            $("closeOwnerModal");

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeDetails
            );
        }

        /* -----------------------------------------------
           MODAL BACKDROP
        ------------------------------------------------ */

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
           SEARCH
        ------------------------------------------------ */

        const search =
            $("ownerSearch");

        if (search) {

            search.addEventListener(
                "input",
                filterUsers
            );
        }

        /* -----------------------------------------------
           GENERATE CODE
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
           ESCAPE
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
       INITIALIZATION
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
