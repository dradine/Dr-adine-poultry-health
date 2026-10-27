/* =========================================================
   ADINE POULTRY HEALTH CENTER
   FARMS MODULE
   SUPABASE VERSION
   Persian / Arabic / English Number Support
   ========================================================= */

const farmForm = document.getElementById("farmForm");
const farmsList = document.getElementById("farmsList");

let currentUser = null;
let ownerViewTarget = null;
let ownerViewFarm = null;
let ownerViewReadOnly = false;
let farms = [];

function normalizeNumbers(value) {
    return String(value ?? "")
        .replace(/[۰-۹]/g, char => String(char.charCodeAt(0) - 1776))
        .replace(/[٠-٩]/g, char => String(char.charCodeAt(0) - 1632))
        .replace(/[٬،]/g, ",")
        .replace(/,/g, "")
        .trim();
}

document.addEventListener("DOMContentLoaded", initializeFarms);

async function initializeFarms() {
    try {
        const access = await checkUserAccess();
        if (!access.authenticated) {
            window.location.href = "login.html?message=" + encodeURIComponent("ابتدا وارد سامانه شوید.");
            return;
        }
        if (!access.allowed) {
            alert("حساب شما هنوز توسط مدیریت تأیید نشده است.");
            await logoutUser();
            return;
        }

        currentUser = access.user;
        window.__ADINEH_CURRENT_PROFILE__ = access.profile || {};

        const params = new URLSearchParams(window.location.search);
        const requestedOwner = params.get("owner_view");
        if (requestedOwner && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedOwner)) {
            const role = String(access.profile?.role || "").toLowerCase();
            if (!["owner", "admin"].includes(role)) {
                throw new Error("فقط مالک یا مدیر سامانه می‌تواند سامانه کاربر را مشاهده کند.");
            }
            ownerViewTarget = requestedOwner;
            const requestedFarm = params.get("farm_view");
            if (requestedFarm && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedFarm)) ownerViewFarm = requestedFarm;
            ownerViewReadOnly = true;
            document.body.classList.add("owner-readonly-view");
        }

        await loadFarms();
        if (!ownerViewReadOnly) setupFarmForm();
    } catch (error) {
        console.error("Farm initialization error:", error);
        showMessage("خطا در راه‌اندازی بخش فارم.", "error");
    }
}

async function loadFarms() {
    farmsList.innerHTML = `<div class="card">در حال دریافت اطلاعات فارم‌ها...</div>`;
    const profileRole = String(window.__ADINEH_CURRENT_PROFILE__?.role || "").toLowerCase();
    const canUseOffline = !ownerViewReadOnly && currentUser && window.AdineOffline;
    if (canUseOffline && (!navigator.onLine || !supabaseClient)) {
        farms = (await AdineOffline.getRows("farms", currentUser.id)).filter(f => String(f.owner_id) === String(currentUser.id));
        renderFarms();
        return;
    }
    let farmQuery = supabaseClient.from("farms").select("*");
    if (ownerViewTarget) {
        farmQuery = farmQuery.eq("owner_id", ownerViewTarget);
        if (ownerViewFarm) farmQuery = farmQuery.eq("id", ownerViewFarm);
    } else if (!["owner", "admin"].includes(profileRole)) {
        farmQuery = farmQuery.eq("owner_id", currentUser.id);
    }
    const { data, error } = await AdineOffline.withTimeout(farmQuery.order("created_at", { ascending: false }), 8000, "FARMS_QUERY");
    if (error) {
        console.error("Load farms error:", error);
        if (canUseOffline && AdineOffline.isNetworkFailure(error)) {
            farms = (await AdineOffline.getRows("farms", currentUser.id)).filter(f => String(f.owner_id) === String(currentUser.id));
            renderFarms();
            return;
        }
        farmsList.innerHTML = `<div class="card">خطا در دریافت اطلاعات فارم‌ها.</div>`;
        return;
    }
    farms = data || [];
    if (canUseOffline) {
        try {
            await AdineOffline.cacheRows("farms", farms, currentUser.id);
            const pending = await AdineOffline.getPending();
            const localFarms = pending.filter(op => op.table === "farms" && String(op.payload.owner_id) === String(currentUser.id)).map(op => op.payload);
            const byId = new Map(farms.map(f => [String(f.id), f]));
            localFarms.forEach(f => byId.set(String(f.id), f));
            farms = Array.from(byId.values()).sort((x,y) => String(y.created_at||"").localeCompare(String(x.created_at||"")));
        } catch (cacheError) { console.warn("Farm offline cache:", cacheError); }
    }
    if (ownerViewReadOnly && farmForm) farmForm.style.display = "none";
    renderFarms();
}
function setupFarmForm() {
    if (farmForm) farmForm.addEventListener("submit", saveFarm);
}

async function saveFarm(event) {
    event.preventDefault();

    if (ownerViewReadOnly) {
        alert("این سامانه در حالت مشاهده مدیریتی است و امکان ثبت یا ویرایش وجود ندارد.");
        return;
    }
    if (!currentUser) {
        alert("کاربر وارد سامانه نشده است.");
        return;
    }

    const name = getValue("farmName");
    if (!name) {
        alert("نام فارم را وارد کنید.");
        return;
    }

    const button = farmForm.querySelector('button[type="submit"]');
    if (button) {
        button.disabled = true;
        button.textContent = "در حال ذخیره...";
    }

    try {
        /* Geography is calculated from the city/location at save time as well
           as by the UI runtime. This makes the farm record self-contained and
           removes the previous delayed post-insert dependency. */
        const location = getValue("farmLocation");
        const manualProvince = getValue("farmProvince");
        const geo = window.AdineFarmRegion?.info
            ? window.AdineFarmRegion.info(location, manualProvince)
            : { province: manualProvince, region: getValue("farmRegion"), climate: getValue("farmClimate") };

        const province = geo.province || manualProvince || getValue("farmProvince");
        const region = geo.region || getValue("farmRegion");
        const climate = geo.climate || getValue("farmClimate");

        const payload = {
            id: window.AdineOffline ? window.AdineOffline.uuid() : undefined,
            owner_id: currentUser.id,
            name,
            farm_code: getValue("farmCode"),
            location,
            province: province || null,
            region: region || null,
            climate_class: climate || null,
            owner_name: getValue("farmOwner"),
            manager_name: getValue("farmManager"),
            capacity: getNumber("farmCapacity"),
            notes: getValue("farmNotes"),
            is_active: true
        };

        let data = null, error = null, savedOffline = false;
        if (!navigator.onLine && window.AdineOffline) {
            const local = await AdineOffline.saveLocal("farms", payload, { userId: currentUser.id });
            data = local.data; savedOffline = true;
        } else {
            const result = await supabaseClient.from("farms").insert(payload).select().single();
            data = result.data; error = result.error;
            if (error && window.AdineOffline && AdineOffline.isNetworkFailure(error)) {
                const local = await AdineOffline.saveLocal("farms", payload, { userId: currentUser.id });
                data = local.data; error = null; savedOffline = true;
            }
        }
        if (error || !data) {
            console.error("Save farm error:", error);
            alert("ذخیره فارم انجام نشد:\n" + (error?.message || "پاسخ معتبری از سرور دریافت نشد."));
            return;
        }

        farmForm.reset();
        const provinceEl = document.getElementById("farmProvince");
        const regionEl = document.getElementById("farmRegion");
        const climateEl = document.getElementById("farmClimate");
        [provinceEl, regionEl, climateEl].forEach(el => {
            if (el) el.disabled = false;
        });
        await loadFarms();

        setCurrentSelection({ farmId: data.id, houseId: null, flockId: null });
        alert(savedOffline ? "فارم روی این دستگاه ذخیره شد و پس از اتصال اینترنت همگام‌سازی می‌شود." : "فارم با موفقیت ذخیره شد.");
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "ذخیره فارم";
        }
    }
}

function renderFarms() {
    if (!farmsList) return;
    if (!farms || farms.length === 0) {
        farmsList.innerHTML = `<div class="card"><p>هنوز فارمی ثبت نشده است.</p></div>`;
        return;
    }

    const banner = ownerViewReadOnly
        ? `<div class="card" style="margin-bottom:12px;background:#edf4fb;color:#2c608c">این سامانه در حالت مشاهده مدیریتی باز شده است؛ اطلاعات در این حالت قابل ویرایش نیست.</div>`
        : "";

    farmsList.innerHTML = banner + farms.map(createFarmCard).join("");
}

function createFarmCard(farm) {
    const capacity = farm.capacity !== null && farm.capacity !== undefined
        ? Number(farm.capacity).toLocaleString("fa-IR")
        : "-";

    const climateLabels = window.AdineFarmRegion?.climateLabels || {};
    const regionLabels = window.AdineFarmRegion?.labels || {};
    const geoText = [
        farm.province || "",
        regionLabels[farm.region] || farm.region || "",
        climateLabels[farm.climate_class] || farm.climate_class || ""
    ].filter(Boolean).join(" · ");

    return `
        <div class="card farm-card" data-farm-id="${escapeHTML(farm.id)}">
            <h3 class="card-title">🏭 ${escapeHTML(farm.name)}
                ${String(farm.farm_code || "").startsWith("TEST-BM-ADINEH-") ? '<span class="benchmark-badge">Benchmark آزمایشی</span>' : ""}
            </h3>
            <p><strong>کد فارم:</strong> ${escapeHTML(farm.farm_code || "-")}</p>
            <p><strong>موقعیت:</strong> ${escapeHTML(farm.location || "-")}</p>
            <p><strong>استان / منطقه / اقلیم:</strong> ${escapeHTML(geoText || "-")}</p>
            <p><strong>مالک:</strong> ${escapeHTML(farm.owner_name || "-")}</p>
            <p><strong>مسئول فارم:</strong> ${escapeHTML(farm.manager_name || "-")}</p>
            <p><strong>ظرفیت:</strong> ${capacity}</p>
            <div class="button-row">
                <button type="button" class="btn btn-primary" onclick="selectFarm('${escapeHTML(farm.id)}')">انتخاب فارم</button>
                <button type="button" class="btn btn-danger" onclick="deleteFarm('${escapeHTML(farm.id)}')">حذف</button>
            </div>
        </div>`;
}

async function selectFarm(farmId) {
    const farm = farms.find(item => item.id === farmId);
    if (!farm) return;
    setCurrentSelection({ farmId: farm.id, houseId: null, flockId: null });

    const params = new URLSearchParams(window.location.search);
    const returnTarget = String(params.get("return") || "").toLowerCase();

    if (returnTarget === "accounting") {
        window.location.href = "accounting-v14.html?farm=" + encodeURIComponent(farm.id) + "&v=accounting6";
        return;
    }

    window.location.href = "flocks.html";
}

async function deleteFarm(farmId) {
    const farm = farms.find(item => item.id === farmId);
    if (!farm) return;

    const warning = confirm(
        "⚠️ هشدار بسیار مهم\n\nحذف فارم «" + farm.name + "» دائمی است.\n\nتمام اطلاعات وابسته به این فارم نیز ممکن است طبق وابستگی‌های پایگاه داده حذف شوند.\nاین عملیات قابل بازگشت نیست.\n\nآیا برای ادامه آماده هستید؟"
    );
    if (!warning) return;

    const phrase = "حذف فارم " + farm.name;
    const typed = prompt(
        "برای حذف قطعی فارم، عبارت زیر را دقیقاً وارد کنید:\n\n" + phrase + "\n\nاین عملیات قابل بازگشت نیست."
    );
    if (typed === null) return;
    if (typed.trim() !== phrase) {
        alert("عبارت تأیید صحیح نیست؛ حذف فارم لغو شد.");
        return;
    }

    const { error } = await supabaseClient
        .from("farms")
        .delete()
        .eq("id", farmId)
        .eq("owner_id", currentUser.id);

    if (error) {
        console.error("Delete farm error:", error);
        alert("حذف فارم انجام نشد:\n" + error.message);
        return;
    }

    const selection = getCurrentSelection();
    if (selection.farmId === farmId) clearCurrentSelection();
    await loadFarms();
    alert("فارم «" + farm.name + "» با موفقیت حذف شد.");
}
function getValue(id) {
    const element = document.getElementById(id);
    return element ? String(element.value || "").trim() : "";
}

function getNumber(id) {
    const value = normalizeNumbers(getValue(id));
    if (!value) return 0;
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function showMessage(message, type = "info") {
    console.log(`[${type}]`, message);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
