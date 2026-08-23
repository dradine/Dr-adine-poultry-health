/* =========================================================
   ADINEH OWNER MANAGEMENT
   FINAL OWNER.JS
   ========================================================= */

(function () {
    "use strict";

    let users = [];
    let selectedUser = null;

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
        if (value === null || value === undefined || value === "") {
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

        if (isNaN(date.getTime())) {
            return "—";
        }

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

            farm_operator:
                "🐔 بهره‌بردار واحد طیور",

            farm_manager:
                "👨‍💼 مدیر واحد طیور",

            diagnostic_lab:
                "🔬 آزمایشگاه تشخیص دامپزشکی",

            company_manager:
                "🏢 مدیر / نماینده مجموعه",

            other:
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
        const map = {
            active: "active",
            pending: "pending",
            suspended: "suspended",
            blocked: "blocked",
            removed: "removed"
        };

        return map[status] || "pending";
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
        const box = $("message");

        if (!box) return;

        box.textContent = message;

        box.className =
            "message " +
            (type === "error"
                ? "error"
                : type === "info"
                ? "info"
                : "success");

        clearTimeout(showMessage.timer);

        showMessage.timer = setTimeout(() => {
            box.className = "message hidden";
        }, 5000);
    }

    function setLoading(isLoading) {
        const tbody = $("usersTableBody");

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


    /* =====================================================
       AUTH
    ===================================================== */

    async function getCurrentUser() {
        if (
            typeof supabaseClient === "undefined" ||
            !supabaseClient
        ) {
            throw new Error(
                "اتصال به سامانه پایگاه داده برقرار نیست."
            );
        }

        const {
            data,
            error
        } = await supabaseClient.auth.getUser();

        if (error) {
            throw error;
        }

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
        } = await supabaseClient
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
                "پروفایل مالک در سامانه پیدا نشد."
            );
        }

        if (data.role !== "owner") {
            throw new Error(
                "این حساب مالک سامانه نیست."
            );
        }

        if (data.status !== "active") {
            throw new Error(
                "وضعیت حساب مالک فعال نیست."
            );
        }

        if (data.is_active !== true) {
            throw new Error(
                "حساب مالک غیرفعال است."
            );
        }

        const identity = $("ownerIdentity");

        if (identity) {
            identity.textContent =
                `ورود با حساب مالک: ${
                    data.full_name ||
                    data.email ||
                    "مالک سامانه"
                }`;
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
            } = await supabaseClient.rpc(
                "owner_get_user_directory"
            );

            if (error) {
                throw error;
            }

            users =
                Array.isArray(data)
                    ? data
                    : [];

            renderStats();
            applyFilters();

            showMessage(
                `اطلاعات ${faNumber(users.length)} کاربر دریافت شد.`,
                "success"
            );

        } catch (error) {

            console.error(
                "OWNER LOAD ERROR:",
                error
            );

            users = [];

            renderStats();

            renderEmpty(
                "دریافت اطلاعات کاربران ناموفق بود."
            );

            showMessage(
                error?.message ||
                "خطا در دریافت اطلاعات کاربران.",
                "error"
            );

        }
    }


    /* =====================================================
       STATS
    ===================================================== */

    function renderStats() {
        const total = users.length;

        const active =
            users.filter(
                user => user.status === "active"
            ).length;

        const pending =
            users.filter(
                user => user.status === "pending"
            ).length;

        const specialists =
            users.filter(user => {

                const type =
                    user.user_type;

                return (
                    type === "veterinarian" ||
                    type === "technical_veterinarian" ||
                    type === "veterinary_lab" ||
                    type === "diagnostic_lab" ||
                    type === "poultry_technical_expert"
                );

            }).length;

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

    function renderUsers(list) {
        const tbody =
            $("usersTableBody");

        if (!tbody) return;

        if (!list.length) {
            renderEmpty(
                "کاربری با این مشخصات پیدا نشد."
            );
            return;
        }

        tbody.innerHTML =
            list.map(user => {

                const code =
                    user.professional_code
                        ? "••••••"
                        : "ندارد";

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
                            ${
                                user.phone
                                    ? esc(user.phone)
                                    : "—"
                            }
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
                            <span class="badge ${statusClass(
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
            $("usersTableBody");

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


    /* =====================================================
       FILTERS
    ===================================================== */

    function applyFilters() {
        const searchInput =
            $("userSearch");

        const roleFilter =
            $("roleFilter");

        const statusFilter =
            $("statusFilter");

        const query =
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

        const filtered =
            users.filter(user => {

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
                    activityText(
                        user.activity_types
                    )
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    !query ||
                    searchable.includes(query);

                let matchesRole = true;

                if (role !== "all") {

                    if (
                        role === "owner" ||
                        role === "user"
                    ) {
                        matchesRole =
                            user.role === role;
                    } else {
                        matchesRole =
                            user.user_type === role;
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

        renderUsers(filtered);
    }


    /* =====================================================
       DETAILS MODAL
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

        selectedUser = user;

        const modal =
            $("ownerUserModal");

        if (!modal) {
            showMessage(
                "بخش جزئیات در HTML وجود ندارد.",
                "error"
            );
            return;
        }

        setText(
            "detailName",
            user.full_name ||
            "بدون نام"
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
            "detailNotes",
            user.notes
        );

        setText(
            "detailStatus",
            statusLabel(
                user.status
            )
        );

        setText(
            "detailActive",
            user.is_active
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
            "detailCreated",
            formatDate(
                user.created_at
            )
        );

        setText(
            "detailUpdated",
            formatDate(
                user.updated_at
            )
        );

        setText(
            "detailLastSeen",
            formatDate(
                user.last_seen_at
            )
        );

        setText(
            "detailApproved",
            formatDate(
                user.approved_at
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

        const codeSection =
            $("professionalCodeSection");

        if (codeSection) {
            codeSection.style.display =
                user.user_type
                    ? "block"
                    : "none";
        }

        modal.style.display = "flex";

        document.body.classList.add(
            "modal-open"
        );
    }


    function closeDetails() {
        const modal =
            $("ownerUserModal");

        if (!modal) return;

        modal.style.display = "none";

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
            } = await supabaseClient.rpc(
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

            applyFilters();

            showMessage(
                "کد حرفه‌ای با موفقیت ایجاد / تغییر کرد.",
                "success"
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
                button.disabled = false;
                button.textContent =
                    "تولید / تغییر کد";
            }
        }
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

        try {

            const {
                error
            } = await supabaseClient.auth.signOut();

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
                error?.message ||
                "خروج از سامانه ناموفق بود.",
                "error"
            );
        }
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

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

                    refresh.disabled = true;

                    try {
                        await loadUsers();
                    } finally {
                        refresh.disabled = false;
                    }
                }
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

                if (action === "details") {

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

        const generateButton =
            $("generateProfessionalCodeBtn");

        if (generateButton) {

            generateButton.addEventListener(
                "click",
                generateCode
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
                error?.message ||
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
