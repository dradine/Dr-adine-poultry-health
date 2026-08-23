/* =========================================================
   ADINEH OWNER MANAGEMENT
   OWNER.JS
   نسخه هماهنگ با HTML فعلی پنل مدیریت
========================================================= */

(function () {
    "use strict";

    let allUsers = [];
    let filteredUsers = [];
    let selectedUser = null;

    const $ = (id) => document.getElementById(id);

    /* =====================================================
       ابزارهای عمومی
    ===================================================== */

    function esc(value) {
        if (value === null || value === undefined) {
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
            (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]
        );
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }

        try {
            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return "—";
            }

            return new Intl.DateTimeFormat("fa-IR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }).format(date);

        } catch (error) {
            return "—";
        }
    }

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

    function activityText(value) {

        if (!value) {
            return "—";
        }

        let list = value;

        if (typeof value === "string") {

            try {
                list = JSON.parse(value);
            } catch {
                return value;
            }
        }

        if (!Array.isArray(list)) {
            return String(list);
        }

        if (!list.length) {
            return "—";
        }

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

        switch (status) {

            case "active":
                return "active";

            case "pending":
                return "pending";

            case "suspended":
                return "suspended";

            case "blocked":
            case "removed":
                return "blocked";

            default:
                return "";
        }
    }

    function setText(id, value) {

        const element = $(id);

        if (!element) {
            return;
        }

        element.textContent =
            value === null ||
            value === undefined ||
            value === ""
                ? "—"
                : value;
    }

    /* =====================================================
       پیام
    ===================================================== */

    function showMessage(
        message,
        type = "success"
    ) {

        const box = $("message");

        if (!box) {
            return;
        }

        box.textContent = message;

        box.className =
            "message " +
            (type || "success");

        box.classList.remove("hidden");

        clearTimeout(
            showMessage.timer
        );

        showMessage.timer =
            setTimeout(() => {

                box.classList.add(
                    "hidden"
                );

            }, 5000);
    }

    /* =====================================================
       کاربر فعلی
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

    /* =====================================================
       بررسی مالک
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
            `مالک سامانه: ${
                data.full_name ||
                data.email ||
                "مالک"
            }`
        );

        return data;
    }

    /* =====================================================
       دریافت کاربران
    ===================================================== */

    async function loadUsers() {

        const tbody =
            $("usersTableBody");

        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading">
                        در حال بارگذاری کاربران...
                    </td>
                </tr>
            `;
        }

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

            allUsers =
                Array.isArray(data)
                    ? data
                    : [];

            filteredUsers =
                [...allUsers];

            renderStats();

            applyFilters();

        } catch (error) {

            console.error(
                "OWNER LOAD ERROR:",
                error
            );

            if (tbody) {

                tbody.innerHTML = `
                    <tr>
                        <td
                            colspan="8"
                            class="empty"
                        >
                            خطا در دریافت اطلاعات کاربران
                        </td>
                    </tr>
                `;
            }

            showMessage(
                error.message ||
                "دریافت اطلاعات کاربران ناموفق بود.",
                "error"
            );
        }
    }

    /* =====================================================
       آمار
    ===================================================== */

    function renderStats() {

        const total =
            allUsers.length;

        const active =
            allUsers.filter(
                user =>
                    user.status ===
                    "active"
            ).length;

        const pending =
            allUsers.filter(
                user =>
                    user.status ===
                    "pending"
            ).length;

        const specialists =
            allUsers.filter(
                user =>
                    [
                        "veterinarian",
                        "technical_veterinarian",
                        "veterinary_lab",
                        "poultry_technical_expert"
                    ].includes(
                        user.user_type
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
       فیلتر
    ===================================================== */

    function applyFilters() {

        const searchInput =
            $("userSearch");

        const roleFilter =
            $("roleFilter");

        const statusFilter =
            $("statusFilter");

        const search =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";

        const role =
            roleFilter
                ? roleFilter.value
                : "all";

        const status =
            statusFilter
                ? statusFilter.value
                : "all";

        filteredUsers =
            allUsers.filter(user => {

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

                const matchesSearch =
                    !search ||
                    searchable.includes(search);

                let matchesRole = true;

                if (role !== "all") {

                    if (
                        [
                            "veterinarian",
                            "technical_veterinarian",
                            "farm_operator",
                            "farm_manager",
                            "diagnostic_lab",
                            "poultry_technical_expert",
                            "company_manager"
                        ].includes(role)
                    ) {

                        const typeMap = {
                            farm_operator:
                                "poultry_operator",

                            farm_manager:
                                "poultry_manager",

                            diagnostic_lab:
                                "veterinary_lab",

                            company_manager:
                                "organization_manager"
                        };

                        const wanted =
                            typeMap[role] ||
                            role;

                        matchesRole =
                            user.user_type ===
                            wanted;

                    } else {

                        matchesRole =
                            user.role === role;
                    }
                }

                const matchesStatus =
                    status === "all" ||
                    user.status === status;

                return (
                    matchesSearch &&
                    matchesRole &&
                    matchesStatus
                );
            });

        renderTable();
    }

    /* =====================================================
       جدول
    ===================================================== */

    function renderTable() {

        const tbody =
            $("usersTableBody");

        if (!tbody) {
            return;
        }

        if (!filteredUsers.length) {

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

        tbody.innerHTML =
            filteredUsers
                .map(
                    user =>
                        renderUserRow(user)
                )
                .join("");
    }

    function renderUserRow(user) {

        const isOwner =
            user.role === "owner";

        const userName =
            user.full_name ||
            "بدون نام";

        const code =
            user.professional_code
                ? "کد حرفه‌ای دارد"
                : "بدون کد";

        return `
            <tr>

                <td>
                    <span class="user-name">
                        ${esc(userName)}
                    </span>

                    ${
                        isOwner
                            ? `
                                <span
                                    class="badge owner"
                                    style="margin-top:5px"
                                >
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

    /* =====================================================
       ساخت پنجره جزئیات
       
       چون HTML فعلی مودال ندارد،
       اینجا یک بار ساخته می‌شود.
    ===================================================== */

    function ensureModal() {

        if ($("ownerUserModal")) {
            return;
        }

        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "ownerUserModal";

        modal.innerHTML = `
            <div
                style="
                    position:fixed;
                    inset:0;
                    background:rgba(0,0,0,.48);
                    z-index:9999;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    padding:15px;
                "
                data-modal-backdrop
            >

                <div
                    style="
                        width:min(760px,100%);
                        max-height:92vh;
                        overflow:auto;
                        background:#fff;
                        border-radius:20px;
                        box-shadow:0 20px 60px rgba(0,0,0,.25);
                    "
                    dir="rtl"
                >

                    <div
                        style="
                            padding:18px;
                            border-bottom:1px solid #e6ece9;
                            display:flex;
                            align-items:center;
                            justify-content:space-between;
                            gap:10px;
                        "
                    >

                        <div>
                            <strong
                                id="detailTitle"
                                style="
                                    color:#173f35;
                                    font-size:18px;
                                "
                            >
                                جزئیات کاربر
                            </strong>

                            <div
                                id="detailSubtitle"
                                style="
                                    margin-top:5px;
                                    color:#7a8581;
                                    font-size:11px;
                                "
                            >
                            </div>
                        </div>

                        <button
                            id="closeOwnerModal"
                            type="button"
                            class="btn btn-secondary"
                        >
                            بستن
                        </button>

                    </div>


                    <div
                        style="
                            padding:18px;
                            display:grid;
                            grid-template-columns:
                                repeat(
                                    auto-fit,
                                    minmax(210px,1fr)
                                );
                            gap:10px;
                        "
                    >

                        ${detailItem(
                            "نام و نام خانوادگی",
                            "detailName"
                        )}

                        ${detailItem(
                            "ایمیل",
                            "detailEmail"
                        )}

                        ${detailItem(
                            "شماره تماس",
                            "detailPhone"
                        )}

                        ${detailItem(
                            "نقش سامانه",
                            "detailRole"
                        )}

                        ${detailItem(
                            "نوع کاربری",
                            "detailUserType"
                        )}

                        ${detailItem(
                            "فعالیت",
                            "detailActivity"
                        )}

                        ${detailItem(
                            "نام مجموعه / سازمان",
                            "detailOrganization"
                        )}

                        ${detailItem(
                            "شماره پروانه / مجوز",
                            "detailLicense"
                        )}

                        ${detailItem(
                            "استان",
                            "detailProvince"
                        )}

                        ${detailItem(
                            "شهر",
                            "detailCity"
                        )}

                        ${detailItem(
                            "تخصص",
                            "detailSpecialty"
                        )}

                        ${detailItem(
                            "وضعیت حساب",
                            "detailStatus"
                        )}

                        ${detailItem(
                            "تأیید حرفه‌ای",
                            "detailVerified"
                        )}

                        ${detailItem(
                            "تاریخ ثبت‌نام",
                            "detailCreated"
                        )}

                        ${detailItem(
                            "آخرین فعالیت",
                            "detailLastSeen"
                        )}

                    </div>


                    <div
                        id="professionalCodeSection"
                        style="
                            margin:0 18px 18px;
                            padding:16px;
                            border-radius:16px;
                            background:#f5f8f6;
                            border:1px solid #e0e9e4;
                        "
                    >

                        <div
                            style="
                                font-weight:800;
                                color:#173f35;
                                margin-bottom:10px;
                            "
                        >
                            🔐 کد حرفه‌ای
                        </div>

                        <div
                            style="
                                display:flex;
                                align-items:center;
                                gap:10px;
                                flex-wrap:wrap;
                            "
                        >

                            <div
                                id="detailCode"
                                style="
                                    flex:1;
                                    min-width:180px;
                                    padding:11px;
                                    background:#fff;
                                    border:1px solid #dce6e1;
                                    border-radius:10px;
                                    font-weight:800;
                                    letter-spacing:1px;
                                "
                            >
                                —
                            </div>

                            <div
                                id="detailCodeStatus"
                                style="
                                    padding:8px 11px;
                                    border-radius:10px;
                                    background:#e7f6ec;
                                    color:#17603f;
                                    font-size:11px;
                                    font-weight:800;
                                "
                            >
                                —
                            </div>

                        </div>


                        <div
                            style="
                                display:flex;
                                gap:8px;
                                flex-wrap:wrap;
                                margin-top:12px;
                            "
                        >

                            <button
                                id="generateProfessionalCodeBtn"
                                type="button"
                                class="btn btn-primary"
                            >
                                تولید / تغییر کد
                            </button>

                        </div>

                    </div>


                    <div
                        style="
                            padding:0 18px 18px;
                        "
                    >

                        <div
                            style="
                                padding:12px;
                                border-radius:12px;
                                background:#f7faf8;
                                color:#65736d;
                                font-size:11px;
                                line-height:1.9;
                            "
                        >
                            کد حرفه‌ای برای شناسایی و دسترسی
                            حرفه‌ای کاربر استفاده می‌شود.
                        </div>

                    </div>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        bindModalEvents();
    }

    function detailItem(
        label,
        id
    ) {

        return `
            <div
                style="
                    padding:11px;
                    border:1px solid #e6ece9;
                    border-radius:12px;
                    background:#fafcfb;
                "
            >

                <div
                    style="
                        font-size:10px;
                        color:#7a8581;
                        margin-bottom:5px;
                    "
                >
                    ${esc(label)}
                </div>

                <div
                    id="${esc(id)}"
                    style="
                        font-size:12px;
                        color:#24342e;
                        font-weight:700;
                        line-height:1.8;
                        word-break:break-word;
                    "
                >
                    —
                </div>

            </div>
        `;
    }

    /* =====================================================
       باز کردن جزئیات
    ===================================================== */

    function openDetails(userId) {

        const user =
            allUsers.find(
                item =>
                    String(
                        item.user_id
                    ) === String(userId)
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

        ensureModal();

        setText(
            "detailTitle",
            user.full_name ||
            "جزئیات کاربر"
        );

        setText(
            "detailSubtitle",
            user.email ||
            ""
        );

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
            "detailVerified",
            user.is_verified
                ? "تأیید شده"
                : "تأیید نشده"
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
            "کد حرفه‌ای ثبت نشده"
        );

        setText(
            "detailCodeStatus",
            user.professional_code_active
                ? "فعال"
                : "غیرفعال"
        );

        const section =
            $("professionalCodeSection");

        if (section) {

            section.style.display =
                user.user_type
                    ? "block"
                    : "none";
        }

        const modal =
            $("ownerUserModal");

        if (modal) {

            modal.style.display =
                "block";
        }

        document.body.style.overflow =
            "hidden";
    }

    /* =====================================================
       بستن جزئیات
    ===================================================== */

    function closeDetails() {

        const modal =
            $("ownerUserModal");

        if (modal) {

            modal.style.display =
                "none";
        }

        document.body.style.overflow =
            "";

        selectedUser =
            null;
    }

    /* =====================================================
       رویدادهای مودال
    ===================================================== */

    function bindModalEvents() {

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
                event => {

                    if (
                        event.target
                            .hasAttribute(
                                "data-modal-backdrop"
                            )
                    ) {
                        closeDetails();
                    }

                }
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
    }

    /* =====================================================
       تولید کد حرفه‌ای
    ===================================================== */

    async function generateProfessionalCode() {

        if (!selectedUser) {

            showMessage(
                "کاربری انتخاب نشده است.",
                "error"
            );

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

            const code =
                typeof data === "string"
                    ? data
                    : data?.access_code ||
                      data?.professional_code ||
                      null;

            if (!code) {

                throw new Error(
                    "کد ایجاد شد اما مقدار کد از سرور دریافت نشد."
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
       بروزرسانی
    ===================================================== */

    function bindMainEvents() {

        const search =
            $("userSearch");

        if (search) {

            search.addEventListener(
                "input",
                applyFilters
            );
        }

        const role =
            $("roleFilter");

        if (role) {

            role.addEventListener(
                "change",
                applyFilters
            );
        }

        const status =
            $("statusFilter");

        if (status) {

            status.addEventListener(
                "change",
                applyFilters
            );
        }

        const refresh =
            $("refreshButton");

        if (refresh) {

            refresh.addEventListener(
                "click",
                async () => {

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

        const logout =
            $("logoutButton");

        if (logout) {

            logout.addEventListener(
                "click",
                async () => {

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
                            error.message ||
                            "خروج ناموفق بود.",
                            "error"
                        );
                    }
                }
            );
        }

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!button) {
                    return;
                }

                const action =
                    button.dataset.action;

                const userId =
                    button.dataset.userId;

                if (
                    action ===
                    "details"
                ) {

                    openDetails(
                        userId
                    );
                }
            }
        );

        document.addEventListener(
            "keydown",
            event => {

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
       شروع
    ===================================================== */

    async function init() {

        try {

            await verifyOwner();

            bindMainEvents();

            await loadUsers();

        } catch (error) {

            console.error(
                "OWNER INIT ERROR:",
                error
            );

            showMessage(
                error.message ||
                "خطا در راه‌اندازی پنل مالک.",
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
            init
        );

    } else {

        init();
    }

})();
