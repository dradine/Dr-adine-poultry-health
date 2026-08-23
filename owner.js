/* ADINEH OWNER PANEL
 * Coordinated with current Supabase Owner RPCs
 * Version: Owner Panel Fix
 */
(function () {
  "use strict";

  let client = null;
  let users = [];
  let selected = null;
  let busy = false;
  let initialized = false;

  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const roleLabels = {
    user: "کاربر",
    owner: "مالک سامانه"
  };

  const statusLabels = {
    pending: "در انتظار تأیید",
    active: "فعال",
    suspended: "موقتاً غیرفعال",
    blocked: "مسدود",
    removed: "بایگانی"
  };

  const typeLabels = {
    veterinarian: "دامپزشک",
    technical_veterinarian: "دامپزشک مسئول فنی",
    poultry_operator: "بهره‌بردار واحد طیور",
    farm_operator: "بهره‌بردار واحد طیور",
    poultry_manager: "مدیر واحد طیور",
    farm_manager: "مدیر واحد طیور",
    veterinary_lab: "آزمایشگاه تشخیص دامپزشکی",
    diagnostic_lab: "آزمایشگاه تشخیص دامپزشکی",
    poultry_technical_expert: "کارشناس فنی طیور",
    organization_manager: "مدیر / نماینده مجموعه",
    company_manager: "مدیر / نماینده مجموعه",
    other: "سایر"
  };

  const activityLabels = {
    broiler: "گوشتی",
    layer: "تخم‌گذار",
    breeder: "مادر",
    pullet: "پولت",
    hatchery: "جوجه‌کشی",
    other: "سایر"
  };

  function esc(v) {
    return v == null
      ? ""
      : String(v).replace(/[&<>"']/g, c => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[c]));
  }

  function fa(v) {
    return Number(v || 0).toLocaleString("fa-IR");
  }

  function dateFa(v) {
    if (!v) return "—";

    const d = new Date(v);

    if (Number.isNaN(d.getTime())) {
      return "—";
    }

    try {
      return d.toLocaleString("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (_) {
      return d.toLocaleString("fa-IR");
    }
  }

  function notify(text, type = "info") {
    const e = $("message");

    if (!e) return;

    e.textContent = text;
    e.className = "message " + type;
    e.hidden = false;
  }

  function clearNotify() {
    const e = $("message");

    if (e) {
      e.hidden = true;
    }
  }

  function text(map, v) {
    return map[v] || v || "—";
  }

  function activityText(v) {
    let a = v;

    if (typeof v === "string") {
      try {
        a = JSON.parse(v);
      } catch (_) {
        return esc(v);
      }
    }

    if (!Array.isArray(a) || !a.length) {
      return "—";
    }

    return a
      .map(x => esc(activityLabels[x] || x))
      .join("، ");
  }

  function normalize(r) {
    return {
      id: r.id || r.user_id,
      user_id: r.user_id || r.id,

      full_name: r.full_name || "",
      email: r.email || "",
      phone: r.phone || "",

      role: r.role || "user",
      status: r.status || "pending",
      is_active: r.is_active === true,

      created_at: r.created_at || null,
      updated_at: r.updated_at || null,
      last_seen_at: r.last_seen_at || null,
      approved_at: r.approved_at || null,

      user_type: r.user_type || "other",
      activity_types: r.activity_types || [],

      organization_name: r.organization_name || null,
      license_number: r.license_number || null,
      province: r.province || null,
      city: r.city || null,
      specialty: r.specialty || null,
      notes: r.notes || null,

      is_verified: r.is_verified === true,

      professional_code:
        r.professional_code ||
        r.access_code ||
        null,

      access_code:
        r.access_code ||
        r.professional_code ||
        null,

      professional_code_active:
        r.professional_code_active === true ||
        r.is_active_code === true
    };
  }

  /*
   * ---------------------------------------------------------
   * فارسی‌سازی خطاهای Supabase
   * ---------------------------------------------------------
   */

  function faError(error, fallback = "انجام عملیات ناموفق بود.") {

    if (!error) {
      return fallback;
    }

    const raw = String(
      error?.message ||
      error?.details ||
      error?.hint ||
      error ||
      ""
    ).trim();

    const lower = raw.toLowerCase();

    console.error("SUPABASE ERROR:", {
      raw,
      error
    });

    /*
     * Function پیدا نشد
     */
    if (
      lower.includes("could not find the function") ||
      lower.includes("function") &&
      (
        lower.includes("does not exist") ||
        lower.includes("not found")
      )
    ) {
      return "عملیات موردنظر در پایگاه داده سامانه در دسترس نیست.";
    }

    /*
     * ستون یا جدول پیدا نشد
     */
    if (
      lower.includes("column") &&
      lower.includes("does not exist")
    ) {
      return "ساختار پایگاه داده سامانه با نسخه برنامه هماهنگ نیست.";
    }

    if (
      lower.includes("relation") &&
      lower.includes("does not exist")
    ) {
      return "جدول موردنظر در پایگاه داده سامانه پیدا نشد.";
    }

    /*
     * احراز هویت
     */
    if (
      lower.includes("jwt") ||
      lower.includes("session") ||
      lower.includes("not authenticated") ||
      lower.includes("auth")
    ) {
      return "نشست ورود شما معتبر نیست. لطفاً دوباره وارد سامانه شوید.";
    }

    /*
     * دسترسی
     */
    if (
      lower.includes("permission denied") ||
      lower.includes("row-level security") ||
      lower.includes("rls") ||
      lower.includes("unauthorized") ||
      lower.includes("access denied")
    ) {
      return "دسترسی لازم برای انجام این عملیات وجود ندارد.";
    }

    /*
     * مالک
     */
    if (
      lower.includes("owner") ||
      raw.includes("مالک")
    ) {
      return "این عملیات فقط برای مالک فعال سامانه مجاز است.";
    }

    /*
     * کاربر
     */
    if (
      raw.includes("کاربر موردنظر پیدا نشد") ||
      lower.includes("user not found")
    ) {
      return "کاربر موردنظر در سامانه پیدا نشد.";
    }

    /*
     * نام
     */
    if (
      raw.includes("نام و نام خانوادگی")
    ) {
      return "نام و نام خانوادگی نمی‌تواند خالی باشد.";
    }

    /*
     * کد حرفه‌ای
     */
    if (
      raw.includes("کد حرفه‌ای")
    ) {
      return raw;
    }

    /*
     * اگر خطای فارسی کوتاه و قابل فهم بود
     */
    if (
      /^[\u0600-\u06ff\s،؛:()._\-0-9]+$/.test(raw) &&
      raw.length < 300
    ) {
      return raw;
    }

    return fallback;
  }

  /*
   * ---------------------------------------------------------
   * RPC عمومی
   * ---------------------------------------------------------
   */

  async function rpc(name, args = {}) {

    if (!client) {
      client = await getClient();
    }

    console.log("OWNER RPC:", name, args);

    const {
      data,
      error
    } = await client.rpc(name, args);

    if (error) {
      console.error(
        "OWNER RPC ERROR:",
        name,
        error
      );

      throw new Error(
        faError(
          error,
          `اجرای عملیات «${name}» انجام نشد.`
        )
      );
    }

    return data;
  }

  /*
   * ---------------------------------------------------------
   * دریافت Supabase Client
   * ---------------------------------------------------------
   */

  async function getClient() {

    for (let i = 0; i < 100; i++) {

      if (
        window.supabaseClient &&
        window.supabaseClient.auth
      ) {
        return window.supabaseClient;
      }

      try {

        if (
          typeof supabaseClient !== "undefined" &&
          supabaseClient?.auth
        ) {
          return supabaseClient;
        }

      } catch (_) {}

      await sleep(80);
    }

    throw new Error(
      "اتصال به پایگاه داده سامانه آماده نشد."
    );
  }

  /*
   * ---------------------------------------------------------
   * دریافت کاربر فعلی
   * ---------------------------------------------------------
   */

  async function getUser() {

    const {
      data,
      error
    } = await client.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data?.user) {
      throw new Error(
        "جلسه ورود پیدا نشد. دوباره وارد سامانه شوید."
      );
    }

    return data.user;
  }

  /*
   * ---------------------------------------------------------
   * بررسی مالک
   * ---------------------------------------------------------
   */

  async function verifyOwner(u) {

    const {
      data,
      error
    } = await client
      .from("profiles")
      .select(
        "id,email,full_name,role,status,is_active"
      )
      .eq("id", u.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (
      !data ||
      data.role !== "owner" ||
      data.status !== "active" ||
      data.is_active !== true
    ) {
      throw new Error(
        "این حساب مالک فعال سامانه نیست."
      );
    }

    const e = $("ownerIdentity");

    if (e) {
      e.textContent =
        `مالک: ${data.full_name || "دکتر ادینه"} | ` +
        `${data.email || u.email || "—"}`;
    }
  }

  /*
   * ---------------------------------------------------------
   * دریافت فهرست کاربران
   * ---------------------------------------------------------
   */

  async function loadDirectory() {

    const data =
      await rpc("owner_get_user_directory");

    return Array.isArray(data)
      ? data
          .map(normalize)
          .filter(x => x.id)
      : [];
  }

  /*
   * ---------------------------------------------------------
   * بارگذاری کاربران
   * ---------------------------------------------------------
   */

  async function loadUsers() {

    if (busy) return;

    busy = true;

    const b = $("usersTableBody");

    if (b) {
      b.innerHTML =
        '<tr><td colspan="8" style="text-align:center;padding:30px">' +
        "در حال بارگذاری اطلاعات کاربران..." +
        "</td></tr>";
    }

    clearNotify();

    try {

      client = await getClient();

      const u = await getUser();

      await verifyOwner(u);

      users = await loadDirectory();

      render();

      await loadStatistics();

      await loadActivity();

      notify(
        `اطلاعات ${fa(users.length)} کاربر بارگذاری شد.`,
        "success"
      );

    } catch (e) {

      console.error(
        "OWNER LOAD ERROR:",
        e
      );

      users = [];

      render();

      notify(
        faError(
          e,
          "خطا در دریافت اطلاعات پنل مدیریت."
        ),
        "error"
      );

    } finally {

      busy = false;
    }
  }

  /*
   * ---------------------------------------------------------
   * آمار
   * ---------------------------------------------------------
   */

  async function loadStatistics() {

    try {

      const d =
        await rpc("owner_get_statistics");

      const r =
        Array.isArray(d)
          ? d[0]
          : d;

      if (!r) return;

      if ($("statTotal"))
        $("statTotal").textContent =
          fa(r.total_users);

      if ($("statActive"))
        $("statActive").textContent =
          fa(r.active_users);

      if ($("statPending"))
        $("statPending").textContent =
          fa(r.pending_users);

      if ($("statSuspended"))
        $("statSuspended").textContent =
          fa(r.suspended_users);

      if ($("statBlocked"))
        $("statBlocked").textContent =
          fa(
            Number(r.blocked_users || 0) +
            Number(r.removed_users || 0)
          );

      if ($("statSpecialists"))
        $("statSpecialists").textContent =
          fa(
            Number(r.veterinarians || 0) +
            Number(r.technical_veterinarians || 0) +
            Number(r.operators || 0) +
            Number(r.managers || 0) +
            Number(r.laboratories || 0) +
            Number(r.technical_experts || 0)
          );

    } catch (e) {

      console.warn(
        "STATISTICS:",
        e
      );

      renderStatsLocal();
    }
  }

  function renderStatsLocal() {

    if ($("statTotal"))
      $("statTotal").textContent =
        fa(users.length);

    if ($("statActive"))
      $("statActive").textContent =
        fa(
          users.filter(
            x =>
              x.status === "active" &&
              x.is_active
          ).length
        );

    if ($("statPending"))
      $("statPending").textContent =
        fa(
          users.filter(
            x => x.status === "pending"
          ).length
        );

    if ($("statSuspended"))
      $("statSuspended").textContent =
        fa(
          users.filter(
            x => x.status === "suspended"
          ).length
        );

    if ($("statBlocked"))
      $("statBlocked").textContent =
        fa(
          users.filter(
            x =>
              ["blocked", "removed"]
                .includes(x.status)
          ).length
        );

    if ($("statSpecialists"))
      $("statSpecialists").textContent =
        fa(
          users.filter(
            x =>
              [
                "veterinarian",
                "technical_veterinarian",
                "poultry_operator",
                "farm_operator",
                "poultry_manager",
                "farm_manager",
                "veterinary_lab",
                "diagnostic_lab",
                "poultry_technical_expert",
                "organization_manager",
                "company_manager"
              ].includes(x.user_type)
          ).length
        );
  }

  /*
   * ---------------------------------------------------------
   * فعالیت‌ها
   * ---------------------------------------------------------
   */

  async function loadActivity() {

    const box = $("activityList");

    if (!box) return;

    try {

      const d =
        await rpc("owner_get_activity");

      const a =
        Array.isArray(d)
          ? d
          : [];

      box.innerHTML =
        a.length
          ? a
              .slice(0, 30)
              .map(
                x =>
                  `<div class="activity-item">
                    <strong>
                      ${esc(x.full_name || "کاربر")}
                    </strong>
                    —
                    ${esc(x.action || "فعالیت")}
                    ${
                      x.page
                        ? `<span>صفحه: ${esc(x.page)}</span>`
                        : ""
                    }
                    <span>
                      ${dateFa(x.created_at)}
                      ${
                        x.details
                          ? ` | ${esc(
                              typeof x.details === "string"
                                ? x.details
                                : JSON.stringify(x.details)
                            )}`
                          : ""
                      }
                    </span>
                  </div>`
              )
              .join("")
          : '<div class="muted">فعالیتی ثبت نشده است.</div>';

    } catch (e) {

      console.warn(
        "ACTIVITY:",
        e
      );

      box.innerHTML =
        '<div class="muted">' +
        "اطلاعات فعالیت در دسترس نیست." +
        "</div>";
    }
  }

  /*
   * ---------------------------------------------------------
   * فیلتر
   * ---------------------------------------------------------
   */

  function filtered() {

    const q =
      String(
        $("userSearch")?.value || ""
      )
        .trim()
        .toLowerCase();

    const r =
      $("roleFilter")?.value || "";

    const s =
      $("statusFilter")?.value || "";

    return users.filter(u => {

      const hay = [
        u.full_name,
        u.email,
        u.phone,
        u.user_type,
        u.organization_name,
        u.license_number,
        u.province,
        u.city,
        u.specialty
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!q || hay.includes(q)) &&
        (!r || u.role === r) &&
        (!s || u.status === s)
      );
    });
  }

  /*
   * ---------------------------------------------------------
   * نمایش کاربران
   * ---------------------------------------------------------
   */

  function render() {

    renderStatsLocal();

    const b =
      $("usersTableBody");

    if (!b) return;

    const list =
      filtered();

    if (!list.length) {

      b.innerHTML =
        '<tr><td colspan="8" style="text-align:center;padding:30px;color:#75827c">' +
        "کاربری مطابق فیلترها پیدا نشد." +
        "</td></tr>";

      return;
    }

    b.innerHTML =
      list
        .map(
          u =>
            `<tr>

              <td>
                <strong class="name">
                  ${esc(
                    u.full_name || "بدون نام"
                  )}
                </strong>

                <span class="muted">
                  ${esc(
                    text(roleLabels, u.role)
                  )}
                </span>
              </td>

              <td>
                ${esc(u.email || "—")}

                <span
                  class="muted"
                  dir="ltr"
                >
                  ${esc(u.phone || "—")}
                </span>
              </td>

              <td>

                <span class="badge">
                  ${esc(
                    text(
                      typeLabels,
                      u.user_type
                    )
                  )}
                </span>

                <span class="muted">
                  ${activityText(
                    u.activity_types
                  )}
                </span>

              </td>

              <td>

                ${
                  u.is_verified
                    ? '<span class="badge verified">تأیید حرفه‌ای</span>'
                    : '<span class="muted">تأیید نشده</span>'
                }

                <span class="muted">
                  ${
                    u.professional_code_active
                      ? "کد فعال"
                      : "کد غیرفعال / ندارد"
                  }
                </span>

              </td>

              <td>

                <span
                  class="badge ${esc(
                    u.status
                  )}"
                >
                  ${esc(
                    text(
                      statusLabels,
                      u.status
                    )
                  )}
                </span>

              </td>

              <td>
                ${dateFa(
                  u.created_at
                )}
              </td>

              <td>
                ${dateFa(
                  u.last_seen_at ||
                  u.updated_at
                )}
              </td>

              <td>

                <div class="actions">

                  <button
                    class="action"
                    data-action="open"
                    data-id="${esc(u.id)}"
                  >
                    جزئیات
                  </button>

                  <button
                    class="action"
                    data-action="code"
                    data-id="${esc(u.id)}"
                  >
                    کد
                  </button>

                  <button
                    class="action"
                    data-action="status"
                    data-id="${esc(u.id)}"
                  >
                    وضعیت
                  </button>

                </div>

              </td>

            </tr>`
        )
        .join("");
  }

  /*
   * ---------------------------------------------------------
   * مقداردهی فیلد
   * ---------------------------------------------------------
   */

  function setVal(id, v) {

    const e = $(id);

    if (e) {
      e.value =
        v == null
          ? ""
          : v;
    }
  }

  /*
   * ---------------------------------------------------------
   * هماهنگ کردن Active و Status
   * ---------------------------------------------------------
   */

  function syncActiveWithStatus() {

    const status =
      $("editStatus")?.value;

    const active =
      $("editActive");

    if (!active) return;

    /*
     * مالک همیشه فعال است
     */
    if (
      selected &&
      selected.role === "owner"
    ) {
      active.value = "true";
      active.disabled = true;
      return;
    }

    /*
     * وضعیت active
     */
    if (status === "active") {

      active.value = "true";
      active.disabled = true;

      return;
    }

    /*
     * وضعیت‌های غیرفعال
     */
    if (
      status === "suspended" ||
      status === "blocked" ||
      status === "removed"
    ) {

      active.value = "false";
      active.disabled = true;

      return;
    }

    /*
     * pending
     */
    active.disabled = true;

    /*
     * وضعیت pending از RPC قبلی
     * مقدار is_active را تغییر نمی‌دهد.
     */
  }

  /*
   * ---------------------------------------------------------
   * باز کردن جزئیات
   * ---------------------------------------------------------
   */

  function openModal(u) {

    selected = u;

    setVal(
      "editFullName",
      u.full_name
    );

    setVal(
      "editEmail",
      u.email
    );

    setVal(
      "editPhone",
      u.phone
    );

    setVal(
      "editRole",
      u.role
    );

    setVal(
      "editStatus",
      u.status
    );

    setVal(
      "editActive",
      u.is_active
        ? "true"
        : "false"
    );

    setVal(
      "editUserType",
      u.user_type || "other"
    );

    setVal(
      "editOrganization",
      u.organization_name
    );

    setVal(
      "editLicense",
      u.license_number
    );

    setVal(
      "editProvince",
      u.province
    );

    setVal(
      "editCity",
      u.city
    );

    setVal(
      "editSpecialty",
      u.specialty
    );

    setVal(
      "editNotes",
      u.notes
    );

    setVal(
      "editVerified",
      u.is_verified
        ? "true"
        : "false"
    );

    /*
     * نقش Owner قابل تغییر نیست
     */
    const roleSelect =
      $("editRole");

    if (roleSelect) {

      roleSelect.disabled =
        u.role === "owner";
    }

    /*
     * فعالیت‌ها
     */
    const acts =
      Array.isArray(
        u.activity_types
      )
        ? u.activity_types
        : [];

    document
      .querySelectorAll(
        "#editActivities input"
      )
      .forEach(
        c =>
          c.checked =
            acts.includes(c.value)
      );

    /*
     * کد
     */
    if ($("currentCode")) {

      $("currentCode").textContent =
        u.professional_code ||
        "کد ندارد";
    }

    if ($("codeState")) {

      $("codeState").textContent =
        u.professional_code_active
          ? "فعال"
          : "غیرفعال";

      $("codeState").className =
        "badge " +
        (
          u.professional_code_active
            ? "active"
            : "removed"
        );
    }

    if ($("createdState")) {

      $("createdState").textContent =
        dateFa(u.created_at);
    }

    if ($("seenState")) {

      $("seenState").textContent =
        dateFa(
          u.last_seen_at ||
          u.updated_at
        );
    }

    if ($("modalSubtitle")) {

      $("modalSubtitle").textContent =
        `${u.full_name || "بدون نام"} | ${
          u.email || "بدون ایمیل"
        }`;
    }

    /*
     * Owner اصلی
     */
    const currentOwner =
      u.role === "owner";

    if ($("saveUser")) {

      $("saveUser").disabled =
        currentOwner;
    }

    /*
     * هماهنگی وضعیت
     */
    syncActiveWithStatus();

    /*
     * نمایش
     */
    if ($("userModal")) {

      $("userModal")
        .classList
        .remove("hidden");
    }

    document.body.classList.add(
      "modal-open"
    );
  }

  /*
   * ---------------------------------------------------------
   * بستن Modal
   * ---------------------------------------------------------
   */

  function closeModal() {

    if ($("userModal")) {

      $("userModal")
        .classList
        .add("hidden");
    }

    document.body.classList.remove(
      "modal-open"
    );

    selected = null;
  }

  /*
   * ---------------------------------------------------------
   * ذخیره اطلاعات پایه
   * ---------------------------------------------------------
   */

  async function saveBasic(uid) {

    const full =
      $("editFullName")?.value
        .trim() || "";

    const phone =
      $("editPhone")?.value
        .trim() || null;

    const email =
      $("editEmail")?.value
        .trim() || null;

    if (!full) {

      throw new Error(
        "نام و نام خانوادگی نمی‌تواند خالی باشد."
      );
    }

    const data =
      await rpc(
        "owner_update_user_basic",
        {
          p_user_id: uid,
          p_full_name: full,
          p_phone: phone,
          p_email: email
        }
      );

    if (
      !data ||
      data.success !== true
    ) {

      throw new Error(
        "ذخیره اطلاعات پایه کاربر انجام نشد."
      );
    }

    return data;
  }

  /*
   * ---------------------------------------------------------
   * ذخیره اطلاعات حرفه‌ای
   * ---------------------------------------------------------
   */

  async function saveProfessional(uid) {

    const activities = [
      ...document.querySelectorAll(
        "#editActivities input[type=checkbox]:checked"
      )
    ].map(
      x => x.value
    );

    const data =
      await rpc(
        "owner_update_professional_profile",
        {
          p_user_id: uid,

          p_user_type:
            $("editUserType")?.value ||
            "other",

          p_activity_types:
            activities,

          p_organization_name:
            $("editOrganization")?.value
              .trim() || null,

          p_license_number:
            $("editLicense")?.value
              .trim() || null,

          p_province:
            $("editProvince")?.value
              .trim() || null,

          p_city:
            $("editCity")?.value
              .trim() || null,

          p_specialty:
            $("editSpecialty")?.value
              .trim() || null,

          p_notes:
            $("editNotes")?.value
              .trim() || null,

          p_is_verified:
            $("editVerified")?.value ===
            "true"
        }
      );

    if (
      !data ||
      data.success !== true
    ) {

      throw new Error(
        "ذخیره اطلاعات حرفه‌ای انجام نشد."
      );
    }

    return data;
  }

  /*
   * ---------------------------------------------------------
   * تغییر وضعیت
   * ---------------------------------------------------------
   */

  async function saveStatus(uid, oldStatus) {

    let newStatus =
      $("editStatus")?.value ||
      "pending";

    /*
     * مالک اصلی همیشه active است
     */
    if (
      selected &&
      selected.role === "owner"
    ) {

      newStatus = "active";

      setVal(
        "editStatus",
        "active"
      );
    }

    if (
      newStatus === oldStatus
    ) {
      return true;
    }

    const data =
      await rpc(
        "owner_set_user_status",
        {
          target_user_id: uid,
          new_status: newStatus
        }
      );

    if (data !== true) {

      throw new Error(
        "تغییر وضعیت کاربر انجام نشد."
      );
    }

    return true;
  }

  /*
   * ---------------------------------------------------------
   * تغییر نقش
   * ---------------------------------------------------------
   */

  async function saveRole(uid, oldRole) {

    const newRole =
      $("editRole")?.value ||
      "user";

    if (
      newRole === oldRole
    ) {
      return true;
    }

    /*
     * هیچ کاربری از پنل نمی‌تواند
     * Owner جدید شود.
     */
    if (
      newRole === "owner"
    ) {

      throw new Error(
        "ایجاد مالک دیگر از پنل مدیریت مجاز نیست."
      );
    }

    if (
      oldRole === "owner"
    ) {

      throw new Error(
        "نقش مالک اصلی قابل تغییر نیست."
      );
    }

    const data =
      await rpc(
        "owner_set_user_role",
        {
          p_user_id: uid,
          p_role: newRole
        }
      );

    if (
      !data ||
      data.success !== true
    ) {

      throw new Error(
        "تغییر نقش کاربر انجام نشد."
      );
    }

    return true;
  }

  /*
   * ---------------------------------------------------------
   * تأیید حرفه‌ای
   * ---------------------------------------------------------
   */

  async function saveVerification(
    uid,
    oldVerified
  ) {

    const newVerified =
      $("editVerified")?.value ===
      "true";

    if (
      newVerified ===
      oldVerified
    ) {
      return true;
    }

    const data =
      await rpc(
        "owner_verify_professional",
        {
          p_user_id: uid,
          p_verified: newVerified
        }
      );

    if (
      !data ||
      data.success !== true
    ) {

      throw new Error(
        "تغییر وضعیت تأیید حرفه‌ای انجام نشد."
      );
    }

    return true;
  }

  /*
   * ---------------------------------------------------------
   * ذخیره کامل
   *
   * مهم:
   * owner_save_user وجود ندارد.
   *
   * بنابراین از RPCهای واقعی و موجود
   * به ترتیب استفاده می‌کنیم.
   * ---------------------------------------------------------
   */

  async function saveUser() {

    if (!selected) return;

    const btn =
      $("saveUser");

    if (btn) {
      btn.disabled = true;
    }

    try {

      client =
        client ||
        await getClient();

      const current =
        await getUser();

      const uid =
        selected.id;

      const oldRole =
        selected.role;

      const oldStatus =
        selected.status;

      const oldVerified =
        selected.is_verified;

      /*
       * جلوگیری از تغییر مالک اصلی
       */
      if (
        uid === current.id
      ) {

        /*
         * مالک باید همیشه مالک و فعال باشد.
         */
        if (
          oldRole !== "owner"
        ) {

          throw new Error(
            "حساب جاری مالک سامانه نیست."
          );
        }

        setVal(
          "editRole",
          "owner"
        );

        setVal(
          "editStatus",
          "active"
        );

        setVal(
          "editActive",
          "true"
        );
      }

      /*
       * 1 ـ اطلاعات پایه
       */
      await saveBasic(uid);

      /*
       * 2 ـ اطلاعات حرفه‌ای
       */
      await saveProfessional(uid);

      /*
       * 3 ـ نقش
       */
      await saveRole(
        uid,
        oldRole
      );

      /*
       * 4 ـ وضعیت
       */
      await saveStatus(
        uid,
        oldStatus
      );

      /*
       * 5 ـ تأیید حرفه‌ای
       */
      await saveVerification(
        uid,
        oldVerified
      );

      /*
       * موفقیت
       */
      notify(
        "تمام تغییرات کاربر با موفقیت ذخیره شد.",
        "success"
      );

      /*
       * دریافت مجدد اطلاعات واقعی
       * از پایگاه داده
       */
      await loadUsers();

      const fresh =
        users.find(
          x =>
            String(x.id) ===
            String(uid)
        );

      if (fresh) {
        openModal(fresh);
      }

    } catch (e) {

      console.error(
        "OWNER SAVE ERROR:",
        e
      );

      notify(
        faError(
          e,
          "ذخیره تغییرات انجام نشد."
        ),
        "error"
      );

    } finally {

      if (btn) {
        btn.disabled = false;
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * تولید کد حرفه‌ای
   * ---------------------------------------------------------
   */

  async function generateCode(){

  if(!selected){
    notify(
      "ابتدا یک کاربر را انتخاب کنید.",
      "error"
    );
    return;
  }

  const btn = $("generateCode");

  if(btn){
    btn.disabled = true;
    btn.textContent = "در حال تولید...";
  }

  try{

    client = client || await getClient();

    /* =====================================================
       1 — بررسی نشست کاربر
    ===================================================== */

    const sessionResult =
      await client.auth.getSession();

    if(sessionResult.error){

      throw new Error(
        "خطا در بررسی نشست ورود: " +
        sessionResult.error.message
      );

    }

    const session =
      sessionResult?.data?.session;

    if(!session?.user){

      throw new Error(
        "نشست ورود پیدا نشد. لطفاً از حساب مالک خارج شوید و دوباره وارد شوید."
      );

    }

    /* =====================================================
       2 — بررسی مالک بودن حساب فعلی
    ===================================================== */

    const ownerResult =
      await client
        .from("profiles")
        .select(
          "id,full_name,email,role,status,is_active"
        )
        .eq("id",session.user.id)
        .maybeSingle();

    if(ownerResult.error){

      throw new Error(
        "خطا در بررسی حساب مالک: " +
        ownerResult.error.message
      );

    }

    const owner =
      ownerResult.data;

    if(!owner){

      throw new Error(
        "پروفایل حساب فعلی در پایگاه داده پیدا نشد."
      );

    }

    if(owner.role !== "owner"){

      throw new Error(
        "حساب فعلی نقش مالک سامانه را ندارد."
      );

    }

    if(owner.status !== "active"){

      throw new Error(
        "حساب مالک در وضعیت فعال نیست."
      );

    }

    if(owner.is_active !== true){

      throw new Error(
        "حساب مالک غیرفعال است."
      );

    }

    /* =====================================================
       3 — بررسی شناسه کاربر هدف
    ===================================================== */

    const uid =
      selected.user_id ||
      selected.id;

    if(!uid){

      throw new Error(
        "شناسه کاربر انتخاب‌شده پیدا نشد."
      );

    }

    /* =====================================================
       4 — اجرای RPC تولید کد
    ===================================================== */

    const result =
      await client.rpc(
        "owner_generate_professional_code",
        {
          p_user_id: uid
        }
      );

    /* =====================================================
       5 — اگر Supabase خطا داد،
             خطای واقعی را روی صفحه نشان بده
    ===================================================== */

    if(result.error){

      const e = result.error;

      let realError = "";

      if(e.message)
        realError +=
          "پیام: " + e.message;

      if(e.details)
        realError +=
          "\nجزئیات: " + e.details;

      if(e.hint)
        realError +=
          "\nراهنما: " + e.hint;

      if(e.code)
        realError +=
          "\nکد خطا: " + e.code;

      throw new Error(
        "خطای واقعی پایگاه داده:\n\n" +
        realError
      );

    }

    /* =====================================================
       6 — بررسی نتیجه RPC
    ===================================================== */

    const code =
      result.data;

    if(!code){

      throw new Error(
        "تابع پایگاه داده اجرا شد اما هیچ کد حرفه‌ای برنگرداند."
      );

    }

    /* =====================================================
       7 — دریافت دوباره اطلاعات کاربران
    ===================================================== */

    await loadUsers();

    const fresh =
      users.find(
        x =>
          String(x.id) ===
          String(uid)
      );

    if(fresh){

      selected = fresh;

      openModal(fresh);

    }

    /* =====================================================
       8 — موفقیت
    ===================================================== */

    notify(
      "کد حرفه‌ای با موفقیت تولید و ذخیره شد: " +
      String(code),
      "success"
    );

  }

  catch(e){

    console.error(
      "OWNER GENERATE CODE ERROR",
      e
    );

    /*
       خطای واقعی را فارسی/قابل فهم می‌کنیم،
       ولی اطلاعات مهم Supabase را حذف نمی‌کنیم.
    */

    const raw =
      String(
        e?.message ||
        e?.details ||
        e ||
        ""
      );

    let message =
      raw;

    /* ---------------------------------------------
       تابع پیدا نشد
    --------------------------------------------- */

    if(
      /could not find the function/i.test(raw) ||
      /function .* does not exist/i.test(raw) ||
      /PGRST202/i.test(raw)
    ){

      message =
        "تابع «تولید کد حرفه‌ای» توسط API سامانه شناسایی نشد.\n\n" +
        "احتمالاً Schema Cache مربوط به Supabase به‌روز نشده است.\n\n" +
        "جزئیات فنی:\n" +
        raw;

    }

    /* ---------------------------------------------
       دسترسی
    --------------------------------------------- */

    else if(
      /دسترسی غیرمجاز/i.test(raw) ||
      /permission denied/i.test(raw) ||
      /not authorized/i.test(raw)
    ){

      message =
        "دسترسی مالک برای تولید کد تأیید نشد.\n\n" +
        "جزئیات:\n" +
        raw;

    }

    /* ---------------------------------------------
       کاربر پیدا نشد
    --------------------------------------------- */

    else if(
      /کاربر موردنظر پیدا نشد/i.test(raw)
    ){

      message =
        "کاربر انتخاب‌شده در پایگاه داده پیدا نشد.\n\n" +
        raw;

    }

    /* ---------------------------------------------
       شناسه کاربر
    --------------------------------------------- */

    else if(
      /شناسه کاربر/i.test(raw)
    ){

      message =
        "شناسه کاربر برای تولید کد معتبر نیست.\n\n" +
        raw;

    }

    /* ---------------------------------------------
       خطای اتصال
    --------------------------------------------- */

    else if(
      /Failed to fetch/i.test(raw) ||
      /Load failed/i.test(raw) ||
      /network/i.test(raw)
    ){

      message =
        "ارتباط با سرویس پایگاه داده برقرار نشد.\n\n" +
        "لطفاً اتصال اینترنت را بررسی کنید.\n\n" +
        "جزئیات:\n" +
        raw;

    }

    /* ---------------------------------------------
       خطای عمومی
    --------------------------------------------- */

    else if(
      !message ||
      message === "undefined"
    ){

      message =
        "تولید کد حرفه‌ای انجام نشد.";

    }

    notify(
      message,
      "error"
    );

  }

  finally{

    if(btn){

      btn.disabled = false;
      btn.textContent = "تولید کد";

    }

  }

}
  /*
   * ---------------------------------------------------------
   * دکمه سریع تولید کد
   * ---------------------------------------------------------
   */

  async function quickCode(uid) {

    const u =
      users.find(
        x =>
          String(x.id) ===
          String(uid)
      );

    if (!u) return;

    selected = u;

    await generateCode();
  }

  /*
   * ---------------------------------------------------------
   * دکمه سریع وضعیت
   * ---------------------------------------------------------
   */

  function quickStatus(uid) {

    const u =
      users.find(
        x =>
          String(x.id) ===
          String(uid)
      );

    if (!u) return;

    openModal(u);

    const e =
      $("editStatus");

    if (e) {
      e.focus();
    }
  }

  /*
   * ---------------------------------------------------------
   * Binding
   * ---------------------------------------------------------
   */

  function bind() {

    if (initialized) return;

    initialized = true;

    /*
     * جدول کاربران
     */
    $("usersTableBody")
      ?.addEventListener(
        "click",
        async e => {

          const b =
            e.target.closest(
              "[data-action]"
            );

          if (!b) return;

          const u =
            users.find(
              x =>
                String(x.id) ===
                String(b.dataset.id)
            );

          if (!u) return;

          const action =
            b.dataset.action;

          if (
            action === "open"
          ) {

            openModal(u);

          } else if (
            action === "code"
          ) {

            await quickCode(
              u.id
            );

          } else if (
            action === "status"
          ) {

            quickStatus(
              u.id
            );
          }
        }
      );

    /*
     * جستجو
     */
    $("userSearch")
      ?.addEventListener(
        "input",
        render
      );

    /*
     * فیلتر نقش
     */
    $("roleFilter")
      ?.addEventListener(
        "change",
        render
      );

    /*
     * فیلتر وضعیت
     */
    $("statusFilter")
      ?.addEventListener(
        "change",
        render
      );

    /*
     * Refresh
     */
    $("refreshButton")
      ?.addEventListener(
        "click",
        loadUsers
      );

    $("refreshUsers")
      ?.addEventListener(
        "click",
        loadUsers
      );

    /*
     * ذخیره
     */
    $("saveUser")
      ?.addEventListener(
        "click",
        saveUser
      );

    /*
     * تولید کد
     */
    $("generateCode")
      ?.addEventListener(
        "click",
        generateCode
      );

    /*
     * فعال / غیرفعال
     */
    $("toggleCode")
      ?.addEventListener(
        "click",
        toggleCode
      );

    /*
     * هماهنگی وضعیت و فعال بودن
     */
    $("editStatus")
      ?.addEventListener(
        "change",
        syncActiveWithStatus
      );

    /*
     * بستن
     */
    $("closeModal")
      ?.addEventListener(
        "click",
        closeModal
      );

    $("closeModal2")
      ?.addEventListener(
        "click",
        closeModal
      );

    /*
     * کلیک بیرون Modal
     */
    $("userModal")
      ?.addEventListener(
        "click",
        e => {

          if (
            e.target ===
            $("userModal")
          ) {
            closeModal();
          }
        }
      );

    /*
     * خروج
     */
    $("logoutButton")
      ?.addEventListener(
        "click",
        async () => {

          try {

            client =
              client ||
              await getClient();

            await client.auth.signOut();

            location.href =
              "login.html";

          } catch (e) {

            notify(
              faError(
                e,
                "خروج از سامانه ناموفق بود."
              ),
              "error"
            );
          }
        }
      );

    /*
     * تب‌ها
     */
    document
      .querySelectorAll(
        "[data-tab]"
      )
      .forEach(
        b =>
          b.addEventListener(
            "click",
            () => {

              document
                .querySelectorAll(
                  "[data-tab]"
                )
                .forEach(
                  x =>
                    x.classList
                      .remove(
                        "active"
                      )
                );

              document
                .querySelectorAll(
                  ".panel"
                )
                .forEach(
                  x =>
                    x.classList
                      .remove(
                        "active"
                      )
                );

              b.classList.add(
                "active"
              );

              const panel =
                $("tab-" +
                  b.dataset.tab);

              if (panel) {
                panel.classList.add(
                  "active"
                );
              }
            }
          )
      );

    /*
     * Escape
     */
    document.addEventListener(
      "keydown",
      e => {

        if (
          e.key === "Escape" &&
          $("userModal") &&
          !$("userModal")
            .classList
            .contains("hidden")
        ) {
          closeModal();
        }
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * شروع
   * ---------------------------------------------------------
   */

  async function init() {

    try {

      bind();

      await loadUsers();

    } catch (e) {

      console.error(
        "OWNER INIT ERROR:",
        e
      );

      notify(
        faError(
          e,
          "خطای راه‌اندازی پنل مالک سامانه."
        ),
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
