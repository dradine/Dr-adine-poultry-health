/* =========================================================
   ADINEH OWNER MANAGEMENT
   Complete Owner Panel
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
            return "۰";
        }

        return String(value).replace(
            /\d/g,
            d => "۰۱۲۳۴۵۶۷۸۹"[d]
        );
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
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
            return date.toLocaleString("fa-IR");
        }
    }

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
            veterinarian: "دامپزشک",
            technical_veterinarian: "دامپزشک مسئول فنی",
            poultry_operator: "بهره‌بردار واحد طیور",
            poultry_manager: "مدیر واحد طیور",
            veterinary_lab: "آزمایشگاه تشخیص دامپزشکی",
            poultry_technical_expert: "کارشناس فنی طیور",
            organization_manager: "مدیر / نماینده مجموعه",
            farm_operator: "بهره‌بردار واحد طیور",
            farm_manager: "مدیر واحد طیور",
            diagnostic_lab: "آزمایشگاه تشخیص دامپزشکی",
            company_manager: "مدیر / نماینده مجموعه",
            other: "سایر"
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
        return {
            active: "active",
            pending: "pending",
            suspended: "suspended",
            blocked: "blocked",
            removed: "removed"
        }[status] || "pending";
    }

    function activityText(value) {
        if (!value) return "—";

        let list = value;

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
            .join("، ") || "—";
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

        box.className =
            "message " +
            (type === "error"
                ? "error"
                : type === "info"
                    ? "info"
                    : "success");

        box.classList.remove("hidden");

        clearTimeout(box._messageTimer);

        box._messageTimer = setTimeout(() => {
            box.classList.add("hidden");
        }, 5000);
    }

    function setLoading(value) {
        const loading = $("ownerLoading");

        if (loading) {
            loading.style.display =
                value ? "block" : "none";
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
                "اتصال Supabase برقرار نیست."
            );
        }

        const {
            data,
            error
        } = await supabaseClient.auth.getUser();

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

        if (error) throw error;

        if (!data) {
            throw new Error(
                "پروفایل مالک پیدا نشد."
            );
        }

        if (data.role !== "owner") {
            throw new Error(
                "این صفحه فقط برای مالک سامانه قابل دسترسی است."
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
                "ورود به عنوان مالک سامانه: " +
                (data.full_name ||
                    data.email ||
                    "مالک");
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

            renderAll();

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

    /* =====================================================
       STATS
    ===================================================== */

    function renderStats() {
        const total = users.length;

        const active =
            users.filter(
                u => u.status === "active"
            ).length;

        const pending =
            users.filter(
                u => u.status === "pending"
            ).length;

        const specialists =
            users.filter(u => {
                return [
                    "veterinarian",
                    "technical_veterinarian",
                    "veterinary_lab",
                    "poultry_technical_expert",
                    "diagnostic_lab"
                ].includes(u.user_type);
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

        setText(
            "statVeterinarians",
            faNumber(
                users.filter(
                    u =>
                        u.user_type ===
                        "veterinarian" ||
                        u.user_type ===
                        "technical_veterinarian"
                ).length
            )
        );

        setText(
            "statLabs",
            faNumber(
                users.filter(
                    u =>
                        u.user_type ===
                        "veterinary_lab" ||
                        u.user_type ===
                        "diagnostic_lab"
                ).length
            );

        setText(
            "statOperators",
            faNumber(
                users.filter(
                    u =>
                        u.user_type ===
                        "poultry_operator" ||
                        u.user_type ===
                        "farm_operator"
                ).length
            );

        setText(
            "statManagers",
            faNumber(
                users.filter(
                    u =>
                        u.user_type ===
                        "poultry_manager" ||
                        u.user_type ===
                        "farm_manager" ||
                        u.user_type ===
                        "organization_manager" ||
                        u.user_type ===
                        "company_manager"
                ).length
            );
        );
    }

    /* =====================================================
       TABLE
    ===================================================== */

    function renderTable() {
        const tbody =
            $("usersTableBody") ||
            $("ownerUsersTable");

        if (!tbody) return;

        if (!users.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty">
                        هیچ کاربری برای نمایش وجود ندارد.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            users.map(user => {

                const code =
                    user.professional_code ||
                    "";

                return `
                    <tr>

                        <td>
                            <div class="user-name">
                                ${esc(
                                    user.full_name ||
                                    "بدون نام"
                                )}
                            </div>

                            <span class="muted">
                                ${esc(
                                    user.user_id || ""
                                )}
                            </span>
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
            }).join("");

        filterUsers();
    }

    /* =====================================================
       FILTER
    ===================================================== */

    function filterUsers() {
        const search =
            $("userSearch") ||
            $("ownerSearch");

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

        const tbody =
            $("usersTableBody") ||
            $("ownerUsersTable");

        if (!tbody) return;

        Array.from(
            tbody.querySelectorAll("tr")
        ).forEach(row => {

            const userId =
                row.querySelector(
                    "[data-user-id]"
                )?.dataset.userId;

            const user =
                users.find(
                    u => u.user_id === userId
                );

            if (!user) return;

            const text =
                (
                    (user.full_name || "") +
                    " " +
                    (user.email || "") +
                    " " +
                    (user.phone || "") +
                    " " +
                    (user.user_type || "")
                ).toLowerCase();

            const matchesSearch =
                !query ||
                text.includes(query);

            const matchesRole =
                roleValue === "all" ||
                user.role === roleValue ||
                user.user_type === roleValue;

            const matchesStatus =
                statusValue === "all" ||
                user.status === statusValue;

            row.style.display =
                matchesSearch &&
                matchesRole &&
                matchesStatus
                    ? ""
                    : "none";
        });
    }

    /* =====================================================
       DETAILS
    ===================================================== */

    function openDetails(userId) {
        const user =
            users.find(
                u => u.user_id === userId
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
                "پنجره جزئیات در HTML وجود ندارد.",
                "error"
            );
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
            "detailVerified",
            user.is_verified
                ? "تأیید شده"
                : "تأیید نشده"
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

    async function loadProfessionalCode() {
        if (!selectedUser) return;

        try {
            const {
                data,
                error
            } = await supabaseClient.rpc(
                "owner_get_professional_code",
                {
                    p_user_id:
                        selectedUser.user_id
                }
            );

            if (error) throw error;

            let result = data;

            if (Array.isArray(data)) {
                result = data[0] || null;
            }

            if (result) {
                selectedUser.professional_code =
                    result.access_code ||
                    result.professional_code ||
                    null;

                selectedUser.professional_code_active =
                    result.is_active === true;

                setText(
                    "detailCode",
                    selectedUser.professional_code ||
                    "کد ندارد"
                );

                setText(
                    "detailCodeStatus",
                    selectedUser.professional_code_active
                        ? "فعال"
                        : "غیرفعال"
                );
            }

        } catch (error) {
            console.error(
                "LOAD PROFESSIONAL CODE ERROR:",
                error
            );
        }
    }

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
            } = await supabaseClient.rpc(
                "owner_generate_professional_code",
                {
                    p_user_id:
                        selectedUser.user_id
                }
            );

            if (error) throw error;

            let code = data;

            if (
                data &&
                typeof data === "object"
            ) {
                code =
                    data.access_code ||
                    data.professional_code ||
                    data.code;
            }

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

            renderTable();

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

    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {
        try {
            await supabaseClient.auth.signOut();

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

    /* =====================================================
       EVENTS
    ===================================================== */

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

                const userId =
                    button.dataset.userId;

                if (action === "details") {
                    openDetails(userId);
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
                        event.target === modal
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

        const search =
            $("userSearch") ||
            $("ownerSearch");

        if (search) {
            search.addEventListener(
                "input",
                filterUsers
            );
        }

        const roleFilter =
            $("roleFilter");

        if (roleFilter) {
            roleFilter.addEventListener(
                "change",
                filterUsers
            );
        }

        const statusFilter =
            $("statusFilter");

        if (statusFilter) {
            statusFilter.addEventListener(
                "change",
                filterUsers
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

        const logout =
            $("logoutButton");

        if (logout) {
            logout.addEventListener(
                "click",
                logout
            );
        }

        document.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Escape"
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
        renderTable();
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
                "خطا در بارگذاری پنل مالک.",
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
            init,
            { once: true }
        );
    } else {
        init();
    }

})();
