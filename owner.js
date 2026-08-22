/* =========================================================
   ADINEH OWNER MANAGEMENT
========================================================= */

(function () {
    "use strict";

    let users = [];
    let selectedUser = null;

    const $ = (id) => document.getElementById(id);

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
            veterinarian: "🩺 دامپزشک",
            technical_veterinarian: "🩺 دامپزشک مسئول فنی",
            poultry_operator: "🐔 بهره‌بردار واحد طیور",
            poultry_manager: "👨‍💼 مدیر واحد طیور",
            veterinary_lab: "🔬 آزمایشگاه تشخیص دامپزشکی",
            poultry_technical_expert: "📊 کارشناس فنی طیور",
            organization_manager: "🏢 مدیر / نماینده مجموعه",
            other: "سایر"
        };

        return map[type] || type || "—";
    }

    function statusLabel(status) {

        const map = {
            active: "فعال",
            pending: "در انتظار",
            suspended: "معلق",
            blocked: "مسدود",
            removed: "حذف شده"
        };

        return map[status] || status || "—";
    }

    function statusClass(status) {

        if (status === "active") return "status-active";
        if (status === "pending") return "status-pending";
        if (status === "blocked") return "status-danger";
        if (status === "suspended") return "status-warning";

        return "status-neutral";
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

    function showMessage(message, type = "success") {

        const box = $("ownerStatus");

        if (!box) return;

        box.textContent = message;

        box.className =
            "owner-status " +
            (type === "error"
                ? "error"
                : "success");

        setTimeout(() => {
            box.className = "owner-status";
        }, 4500);
    }

    async function getCurrentUser() {

        const {
            data,
            error
        } = await supabaseClient.auth.getUser();

        if (error) throw error;

        if (!data || !data.user) {
            throw new Error(
                "کاربر وارد نشده است."
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

        if (
            !data ||
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

    async function loadUsers() {

        setLoading(true);

        try {

            const {
                data,
                error
            } = await supabaseClient.rpc(
                "owner_get_user_directory"
            );

            if (error) throw error;

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

    function renderStats() {

        const total =
            users.length;

        const active =
            users.filter(
                x => x.status === "active"
            ).length;

        const veterinarians =
            users.filter(
                x =>
                    x.user_type === "veterinarian" ||
                    x.user_type === "technical_veterinarian"
            ).length;

        const laboratories =
            users.filter(
                x =>
                    x.user_type === "veterinary_lab"
            ).length;

        const operators =
            users.filter(
                x =>
                    x.user_type === "poultry_operator"
            ).length;

        const managers =
            users.filter(
                x =>
                    x.user_type === "poultry_manager" ||
                    x.user_type === "organization_manager"
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
            users.map(user => {

                const code =
                    user.professional_code
                        ? "••••"
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
                                user.email || "—"
                            )}
                        </td>

                        <td>
                            ${esc(
                                user.phone || "—"
                            )}
                        </td>

                        <td>
                            ${userTypeLabel(
                                user.user_type
                            )}
                        </td>

                        <td>
                            <span class="owner-code">
                                ${code}
                            </span>
                        </td>

                        <td>
                            <span class="${statusClass(
                                user.status
                            )}">
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

            }).join("");
    }

    function openDetails(userId) {

        const user =
            users.find(
                x => x.user_id === userId
            );

        if (!user) return;

        selectedUser = user;

        const modal =
            $("ownerUserModal");

        if (!modal) return;

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

        const verified =
            $("detailVerified");

        if (verified) {

            verified.textContent =
                user.is_verified
                    ? "تأیید شده"
                    : "تأیید نشده";
        }

        const codeStatus =
            $("detailCodeStatus");

        if (codeStatus) {

            codeStatus.textContent =
                user.professional_code_active
                    ? "فعال"
                    : "غیرفعال";
        }

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

    async function generateCode() {

        if (!selectedUser) return;

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
                "کد حرفه‌ای با موفقیت ایجاد شد."
            );

        } catch (error) {

            console.error(
                "GENERATE CODE ERROR:",
                error
            );

            showMessage(
                error.message ||
                "تولید کد ناموفق بود.",
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

        rows.forEach(row => {

            const text =
                row.textContent
                    .toLowerCase();

            row.style.display =
                !query ||
                text.includes(query)
                    ? ""
                    : "none";
        });
    }

    function renderEmpty(message) {

        const tbody =
            $("ownerUsersTable");

        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="text-align:center;padding:35px;"
                >
                    ${esc(message)}
                </td>
            </tr>
        `;
    }

    function renderAll() {

        renderStats();
        renderTable();
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

    function bindEvents() {

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
                        event.target === modal
                    ) {
                        closeDetails();
                    }
                }
            );
        }

        const search =
            $("ownerSearch");

        if (search) {

            search.addEventListener(
                "input",
                filterUsers
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
                    event.key === "Escape"
                ) {
                    closeDetails();
                }
            }
        );
    }

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
            init
        );

    } else {

        init();
    }

})();
