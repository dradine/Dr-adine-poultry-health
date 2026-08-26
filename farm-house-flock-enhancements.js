/* =========================================================
   ADINEH | FARM / HOUSE / FLOCK REGISTRATION FIXES
   Loaded after flocks.js.

   Fixes:
   - Save initial average flock weight correctly.
   - Production baseline fields are only active for layer/breeder.
   - Auto-fill flock bird count from selected house (initial count, then capacity).
   - Save house initial bird count.
   - Calculate and display house density from birds / floor area.
========================================================= */
(function () {
    "use strict";

    const $ = id => document.getElementById(id);

    function norm(value) {
        if (typeof normalizeNumbers === "function") return normalizeNumbers(value);
        return String(value ?? "").replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[,٬،]/g, "").trim();
    }

    function num(id) {
        const v = norm($(id)?.value);
        if (v === "") return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }

    function text(id) {
        return String($(id)?.value ?? "").trim();
    }

    function isoFromJalali(id) {
        const value = text(id);
        if (!value) return null;
        if (window.AdineDateSystem?.jalaliToISO) return window.AdineDateSystem.jalaliToISO(value);
        if (window.jalaliToISO) return window.jalaliToISO(value);
        return null;
    }

    function productionIsRelevant() {
        const type = text("productionType").toLowerCase();
        return type === "layer" || type === "breeder";
    }

    function addProductionFields() {
        const form = $("flockForm");
        const notes = $("flockNotes");
        if (!form || !notes || $("productionBaselineFields")) return;

        const wrap = document.createElement("div");
        wrap.id = "productionBaselineFields";
        wrap.className = "form-grid full";
        wrap.style.cssText = "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:4px;padding:12px;border:1px solid #dfe8e3;border-radius:12px;background:#f7faf8;";
        wrap.innerHTML = `
            <div class="form-group">
                <label for="productionStartDate">تاریخ شروع تولید</label>
                <input id="productionStartDate" type="text" inputmode="numeric" autocomplete="off" placeholder="۱۴۰۵/۰۶/۰۱">
            </div>
            <div class="form-group">
                <label for="productionStartAgeDays">سن شروع تولید (روز)</label>
                <input id="productionStartAgeDays" type="text" inputmode="numeric" autocomplete="off">
            </div>
            <div class="form-group">
                <label for="productionBaselineBirdCount">تعداد پرنده شروع تولید</label>
                <input id="productionBaselineBirdCount" type="text" inputmode="numeric" autocomplete="off">
            </div>
            <div class="form-group">
                <label for="productionBaselineWeightG">وزن شروع تولید (گرم)</label>
                <input id="productionBaselineWeightG" type="text" inputmode="decimal" autocomplete="off">
            </div>
        `;

        notes.closest(".form-group")?.before(wrap);

        const dateInput = $("productionStartDate");
        dateInput?.addEventListener("input", function () {
            this.value = this.value.replace(/[^0-9۰-۹٠-٩\/.-]/g, "");
        });

        updateProductionVisibility();
    }

    function updateProductionVisibility() {
        const wrap = $("productionBaselineFields");
        if (!wrap) return;
        const active = productionIsRelevant();
        wrap.style.display = active ? "grid" : "none";
        ["productionStartDate", "productionStartAgeDays", "productionBaselineBirdCount", "productionBaselineWeightG"].forEach(id => {
            const el = $(id);
            if (el) el.required = false;
            if (!active && el) el.value = "";
        });
    }

    function selectedHouse() {
        const id = text("flockHouse");
        if (!id || !Array.isArray(window.houses) && typeof houses === "undefined") return null;
        try {
            const list = houses || [];
            return list.find(h => String(h.id) === String(id)) || null;
        } catch (_) {
            return null;
        }
    }

    function autoFillFlockBirdCount() {
        const house = selectedHouse();
        const input = $("birdCount");
        if (!house || !input) return;
        const value = house.initial_bird_count ?? house.capacity;
        if (value !== null && value !== undefined && value !== "") {
            input.value = Number(value).toLocaleString("fa-IR");
            input.readOnly = false;
            input.title = "تعداد اولیه از اطلاعات سالن پر شده است و در صورت نیاز قابل اصلاح است.";
        }
    }

    function addDensityField() {
        const form = $("houseForm");
        const width = $("houseWidth");
        if (!form || !width || $("houseDensity")) return;

        const group = document.createElement("div");
        group.className = "form-group";
        group.innerHTML = `<label for="houseDensity">تراکم اولیه (پرنده / مترمربع)</label><input id="houseDensity" type="text" readonly placeholder="با وارد کردن طول، عرض و تعداد پرنده محاسبه می‌شود">`;
        width.closest(".form-group")?.after(group);
    }

    function updateDensity() {
        const length = num("houseLength");
        const width = num("houseWidth");
        const birds = num("houseInitialBirdCount");
        const out = $("houseDensity");
        if (!out) return;
        if (!length || !width || !birds || length <= 0 || width <= 0 || birds < 0) {
            out.value = "";
            return;
        }
        const density = birds / (length * width);
        out.value = density.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
    }

    function interceptHouseSave() {
        const form = $("houseForm");
        if (!form || form.dataset.adineFixHouse === "1") return;
        form.dataset.adineFixHouse = "1";
        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            if (typeof selectedFarm === "undefined" || !selectedFarm) {
                alert("ابتدا یک فارم انتخاب کنید.");
                return;
            }
            const name = text("houseName");
            if (!name) {
                alert("نام سالن را وارد کنید.");
                return;
            }

            const payload = {
                farm_id: selectedFarm.id,
                owner_id: currentUser.id,
                name,
                house_code: text("houseCode"),
                capacity: num("houseCapacity"),
                initial_bird_count: num("houseInitialBirdCount"),
                length_m: num("houseLength"),
                width_m: num("houseWidth"),
                ventilation_type: text("houseVentilation"),
                housing_system: text("houseSystem"),
                notes: text("houseNotes"),
                is_active: true
            };

            const button = form.querySelector('button[type="submit"]');
            if (button) { button.disabled = true; button.textContent = "در حال ذخیره..."; }
            try {
                const { error } = await supabaseClient.from("houses").insert(payload);
                if (error) throw error;
                form.reset();
                updateDensity();
                await loadHouses();
                alert("سالن با موفقیت ثبت شد.");
            } catch (error) {
                console.error("House save error:", error);
                alert("ذخیره سالن انجام نشد:\n" + (error.message || error));
            } finally {
                if (button) { button.disabled = false; button.textContent = "ذخیره سالن"; }
            }
        }, true);
    }

    function interceptFlockSave() {
        const form = $("flockForm");
        if (!form || form.dataset.adineFixFlock === "1") return;
        form.dataset.adineFixFlock = "1";
        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            if (typeof selectedFarm === "undefined" || !selectedFarm) {
                alert("ابتدا یک فارم انتخاب کنید.");
                return;
            }
            const houseId = text("flockHouse");
            const flockName = text("flockName");
            const productionType = text("productionType");
            const averageWeight = num("initialAverageWeightG");
            const birdCount = num("birdCount");

            if (!houseId) return alert("سالن را انتخاب کنید.");
            if (!flockName) return alert("نام گله را وارد کنید.");
            if (!productionType) return alert("نوع پرورش را انتخاب کنید.");
            if (averageWeight === null || averageWeight <= 0) return alert("میانگین وزن اولیه گله را وارد کنید.");
            if (birdCount === null || birdCount <= 0) return alert("تعداد اولیه جوجه / مرغ را وارد کنید.");

            const placementDate = isoFromJalali("placementDate");
            if (text("placementDate") && !placementDate) return alert("تاریخ استقرار گله معتبر نیست.");

            const payload = {
                farm_id: selectedFarm.id,
                house_id: houseId,
                owner_id: currentUser.id,
                flock_name: flockName,
                flock_code: text("flockCode"),
                production_type: productionType,
                genetics: text("genetics"),
                strain: text("flockStrain") || text("genetics"),
                program: text("flockProgram"),
                sex: text("flockSex") || "mixed",
                initial_bird_count: birdCount,
                current_bird_count: birdCount,
                initial_average_weight_g: averageWeight,
                placement_date: placementDate,
                start_age_days: num("startAgeDays") ?? 1,
                status: "active",
                notes: text("flockNotes")
            };

            if (productionIsRelevant()) {
                const startDate = isoFromJalali("productionStartDate");
                const startAge = num("productionStartAgeDays");
                const startBirds = num("productionBaselineBirdCount");
                const startWeight = num("productionBaselineWeightG");

                if (text("productionStartDate") && !startDate) return alert("تاریخ شروع تولید معتبر نیست.");
                if (startAge === null || startAge < 0) return alert("سن شروع تولید را وارد کنید.");
                if (startBirds === null || startBirds <= 0) return alert("تعداد پرنده شروع تولید را وارد کنید.");
                if (startWeight === null || startWeight <= 0) return alert("وزن شروع تولید را وارد کنید.");

                payload.production_start_date = startDate;
                payload.production_start_age_days = startAge;
                payload.production_baseline_bird_count = startBirds;
                payload.production_baseline_weight_g = startWeight;
                payload.production_onset_date = startDate;
                payload.production_onset_age_days = startAge;
                payload.production_baseline_status = "registered";
            } else {
                payload.production_start_date = null;
                payload.production_start_age_days = null;
                payload.production_baseline_bird_count = null;
                payload.production_baseline_weight_g = null;
                payload.production_onset_date = null;
                payload.production_onset_age_days = null;
                payload.production_baseline_status = null;
            }

            const button = form.querySelector('button[type="submit"]');
            if (button) { button.disabled = true; button.textContent = "در حال ذخیره..."; }
            try {
                const { error } = await supabaseClient.from("flocks").insert(payload);
                if (error) throw error;
                form.reset();
                updateProductionVisibility();
                await loadFlocks();
                alert("گله با موفقیت ثبت شد.");
            } catch (error) {
                console.error("Flock save error:", error, payload);
                alert("ذخیره گله انجام نشد:\n" + (error.message || error));
            } finally {
                if (button) { button.disabled = false; button.textContent = "ذخیره گله"; }
            }
        }, true);
    }

    function init() {
        addProductionFields();
        addDensityField();
        interceptHouseSave();
        interceptFlockSave();

        $("productionType")?.addEventListener("change", updateProductionVisibility);
        $("flockHouse")?.addEventListener("change", autoFillFlockBirdCount);
        ["houseLength", "houseWidth", "houseInitialBirdCount"].forEach(id => $(id)?.addEventListener("input", updateDensity));
        autoFillFlockBirdCount();
        updateDensity();
        updateProductionVisibility();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
