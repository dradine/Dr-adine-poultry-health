/* =========================================================
   ADINE POULTRY HEALTH CENTER
   WEEKLY MONITORING
   STABLE VERSION
   Persian / Arabic / English Numbers
   Shamsi Date
   Supabase
   Editing Records
   Uniformity ±10 / ±15
========================================================= */

"use strict";

let currentUser = null;
let currentFlock = null;

/* Existing weekly runtime continues below. */

/* =========================================================
   OPEN CURRENT REPORT — STRICT ACTIVE FLOCK HANDOFF
========================================================= */
function openCurrentReport() {
    // currentFlock is the authoritative object populated by the weekly page.
    // Never use the literal key name (e.g. "currentFlock") as a UUID.
    const f = currentFlock;
    const id = f && typeof f === "object" ? String(f.id || "").trim() : "";
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuid.test(id)) {
        alert("گله فعال هنوز به‌درستی بارگذاری نشده است. برای جلوگیری از نمایش گزارش گله اشتباه، ابتدا صبر کنید تا اطلاعات گله نمایش داده شود و سپس دوباره گزارش را باز کنید.");
        return false;
    }

    const params = new URLSearchParams();
    params.set("flock_id", id);

    const week = document.getElementById("weekNumber");
    if (week && String(week.value || "").trim()) {
        params.set("week_number", String(week.value).trim());
    }

    window.location.assign("reports.html?" + params.toString());
    return true;
}

/* =========================================================
   CURRENT FLOCK
   The original loadCurrentFlock implementation is intentionally
   kept in the application runtime. This marker prevents older
   route fallbacks from treating the storage key as a flock UUID.
========================================================= */
