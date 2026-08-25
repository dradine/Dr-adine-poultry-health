/* =========================================================
   ADINE POULTRY HEALTH CENTER
   HOUSES + FLOCKS
   SUPABASE

   اصلاحات:
   - اعداد فارسی
   - اعداد عربی
   - اعداد انگلیسی
   - تاریخ شمسی
   - ذخیره تاریخ به صورت YYYY-MM-DD در Supabase
   ========================================================= */

let currentUser = null;
let selectedFarm = null;
let houses = [];
let flocks = [];


/* =========================================================
   NUMBER NORMALIZATION
========================================================= */

function normalizeNumbers(value) {

    return String(value ?? "")
        .replace(/[۰-۹]/g, function(char) {
            return String(
                char.charCodeAt(0) - 1776
            );
        })
        .replace(/[٠-٩]/g, function(char) {
            return String(
                char.charCodeAt(0) - 1632
            );
        })
        .replace(/[٬،]/g, ",")
        .replace(/,/g, "")
        .trim();

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeFlocks
);


async function initializeFlocks() {

    try {

        const access =
            await checkUserAccess();


        if (!access.authenticated) {

            window.location.href =
                "login.html?message=" +
                encodeURIComponent(
                    "ابتدا وارد سامانه شوید."
                );

            return;

        }


        if (!access.allowed) {

            alert(
                "حساب شما هنوز توسط مدیریت تأیید نشده است."
            );

            await logoutUser();

            return;

        }


        currentUser =
            access.user;

        /*
         * The page may be opened directly on iPhone/PWA without a
         * previously selected farm. In that case, recover the farm from
         * the URL or let the user select one instead of failing startup.
         */
        await loadSelectedFarm();

        setupHouseForm();
        setupFlockForm();
        setupGenetics();
        setupJalaliDate();


    }

    catch (error) {

        console.error(
            "Flocks initialization error:",
            error
        );

        alert(
            "خطا در راه‌اندازی بخش سالن و گله."
        );

    }

}


/* =========================================================
   SELECTED FARM
========================================================= */

async function loadSelectedFarm() {

    let selection =
        getCurrentSelection();

    const params = new URLSearchParams(window.location.search);
    const urlFarmId = params.get("farm") || params.get("farm_id");

    if (!selection.farmId && urlFarmId) {
        setCurrentSelection({ farmId: urlFarmId, houseId: null, flockId: null });
        selection = getCurrentSelection();
    }

    if (!selection.farmId) {

        await renderFarmChooser();

        disableForms();

        return;

    }


    if (typeof AdineAccess !== "undefined" && !(await AdineAccess.canAccessFarm(selection.farmId))) {
        document.getElementById("selectedFarm").innerHTML = "<p>دسترسی این فارم برای شما فعال نیست.</p>";
        disableForms();
        return;
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("farms")
        .select("*")
        .eq("id", selection.farmId)
        .maybeSingle();


    if (error || !data) {

        console.error(
            "Farm loading error:",
            error
        );

        document.getElementById(
            "selectedFarm"
        ).innerHTML = `
            <p>
                فارم انتخاب‌شده پیدا نشد.
            </p>
        `;

        disableForms();

        return;

    }


    selectedFarm =
        data;


    document.getElementById(
        "selectedFarm"
    ).innerHTML = `

        <div class="farm-summary">

            <strong>
                🏭 ${escapeHTML(data.name)}
            </strong>

            <br>

            کد:
            ${escapeHTML(
                data.farm_code || "-"
            )}

            <br>

            ظرفیت:
            ${
                data.capacity !== null &&
                data.capacity !== undefined
                    ? Number(
                        data.capacity
                      ).toLocaleString("fa-IR")
                    : "-"
            }

        </div>

    `;


    await loadHouses();

    await loadFlocks();

    enableForms();

}


/* =========================================================
   FARM CHOOSER (SAFE DIRECT ENTRY)
========================================================= */

async function renderFarmChooser() {

    const container =
        document.getElementById("selectedFarm");

    if (!container) return;

    try {

        let data, error;
        if (typeof AdineAccess !== "undefined" && !["owner","admin"].includes(String((await AdineAccess.current())?.profile?.role||"").toLowerCase())) {
            const r = await supabaseClient.rpc("get_my_farm_access");
            error = r.error;
            data = (r.data||[]).filter(x=>x.connection_status==="active").map(x=>({id:x.farm_id,name:x.farm_name,farm_code:x.farm_code,capacity:null}));
        } else {
            const r = await supabaseClient.from("farms").select("id,name,farm_code,capacity").order("created_at", { ascending:false });
            data=r.data; error=r.error;
        }

        if (error) throw error;

        const farms = data || [];

        if (!farms.length) {
            container.innerHTML = `
                <p>هنوز فارمی برای این حساب ثبت نشده است.</p>
                <button class="btn btn-primary" type="button"
                    onclick="location.href='Farms.html'">
                    ثبت / انتخاب فارم
                </button>`;
            return;
        }

        container.innerHTML = `
            <div class="form-group">
                <label for="directFarmSelect">انتخاب فارم</label>
                <select id="directFarmSelect">
                    <option value="">انتخاب فارم</option>
                </select>
            </div>`;

        const select = document.getElementById("directFarmSelect");
        farms.forEach(farm => {
            const option = document.createElement("option");
            option.value = farm.id;
            option.textContent = farm.name + (farm.farm_code ? " — " + farm.farm_code : "");
            select.appendChild(option);
        });

        select.addEventListener("change", async function () {
            if (!this.value) return;
            setCurrentSelection({ farmId: this.value, houseId: null, flockId: null });
            await loadSelectedFarm();
            enableForms();
        });

    } catch (error) {
        console.error("Farm chooser error:", error);
        container.innerHTML = `
            <p>دریافت فهرست فارم‌ها انجام نشد.</p>
            <button class="btn btn-secondary" type="button" onclick="location.reload()">
                تلاش مجدد
            </button>`;
    }
}


function enableForms() {
    ["houseForm", "flockForm"].forEach(id => {
        const form = document.getElementById(id);
        if (!form) return;
        Array.from(form.elements).forEach(el => { el.disabled = false; });
    });
}


/* =========================================================
   HOUSES
========================================================= */

async function loadHouses() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("houses")
            .select("*")
            .eq(
                "farm_id",
                selectedFarm.id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Houses loading error:",
            error
        );

        return;

    }


    houses =
        data || [];


    renderHouses();

    updateHouseSelect();

}


/* =========================================================
   HOUSE FORM
========================================================= */

function setupHouseForm() {

    const form =
        document.getElementById(
            "houseForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        saveHouse
    );

}


async function saveHouse(
    event
) {

    event.preventDefault();


    if (!selectedFarm) {

        alert(
            "ابتدا یک فارم انتخاب کنید."
        );

        return;

    }


    const name =
        getValue("houseName");


    if (!name) {

        alert(
            "نام سالن را وارد کنید."
        );

        return;

    }


    const payload = {

        farm_id:
            selectedFarm.id,

        owner_id:
            currentUser.id,

        name,

        house_code:
            getValue("houseCode"),

        capacity:
            getNumber("houseCapacity"),

        length_m:
            getNumber("houseLength"),

        width_m:
            getNumber("houseWidth"),

        ventilation_type:
            getValue("houseVentilation"),

        housing_system:
            getValue("houseSystem"),

        notes:
            getValue("houseNotes"),

        is_active:
            true

    };


    const button =
        event.target.querySelector(
            'button[type="submit"]'
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "در حال ذخیره...";

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("houses")
                .insert(payload);


        if (error) {

            console.error(
                error
            );

            alert(
                "ذخیره سالن انجام نشد:\n" +
                error.message
            );

            return;

        }


        event.target.reset();


        await loadHouses();


        alert(
            "سالن با موفقیت ثبت شد."
        );

    }

    finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "ذخیره سالن";

        }

    }

}


/* =========================================================
   RENDER HOUSES
========================================================= */

function renderHouses() {

    const container =
        document.getElementById(
            "housesList"
        );


    if (!container) {

        return;

    }


    if (!houses.length) {

        container.innerHTML = `
            <p>
                هنوز سالنی ثبت نشده است.
            </p>
        `;

        return;

    }


    container.innerHTML =

        houses
            .map(
                house => `

                    <div class="card">

                        <h3>
                            🏠
                            ${escapeHTML(
                                house.name
                            )}
                        </h3>

                        <p>
                            کد:
                            ${escapeHTML(
                                house.house_code || "-"
                            )}
                        </p>

                        <p>
                            ظرفیت:
                            ${
                                house.capacity !== null &&
                                house.capacity !== undefined
                                    ? Number(
                                        house.capacity
                                      ).toLocaleString("fa-IR")
                                    : "-"
                            }
                        </p>

                        <p>
                            تهویه:
                            ${escapeHTML(
                                house.ventilation_type || "-"
                            )}
                        </p>

                        <div class="button-row">

                            <button
                                class="btn btn-primary"
                                type="button"
                                onclick="
                                    selectHouse(
                                        '${escapeHTML(house.id)}'
                                    )
                                "
                            >
                                انتخاب سالن
                            </button>

                            <button
                                class="btn btn-danger"
                                type="button"
                                onclick="
                                    deleteHouse(
                                        '${escapeHTML(house.id)}'
                                    )
                                "
                            >
                                حذف
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   HOUSE SELECT
========================================================= */

function updateHouseSelect() {

    const select =
        document.getElementById(
            "flockHouse"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            انتخاب سالن
        </option>

    `;


    houses.forEach(
        house => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                house.id;


            option.textContent =
                house.name;


            select.appendChild(
                option
            );

        }
    );


    const selection =
        getCurrentSelection();


    if (selection.houseId) {

        select.value =
            selection.houseId;

    }

}


function selectHouse(
    houseId
) {

    setCurrentSelection({

        farmId:
            selectedFarm.id,

        houseId,

        flockId:
            null

    });


    const select =
        document.getElementById(
            "flockHouse"
        );


    if (select) {

        select.value =
            houseId;

    }


    document.getElementById(
        "flockForm"
    ).scrollIntoView({
        behavior: "smooth"
    });

}


/* =========================================================
   DELETE HOUSE
========================================================= */

async function deleteHouse(
    houseId
) {

    const confirmed =
        confirm(
            "آیا از حذف این سالن مطمئن هستید؟"
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("houses")
            .delete()
            .eq(
                "id",
                houseId
            );


    if (error) {

        alert(
            "حذف سالن انجام نشد:\n" +
            error.message
        );

        return;

    }


    await loadHouses();


    alert(
        "سالن حذف شد."
    );

}


/* =========================================================
   GENETICS
========================================================= */

function setupGenetics() {

    const production = document.getElementById("productionType");
    const genetics = document.getElementById("genetics");
    const strain = document.getElementById("flockStrain");
    const program = document.getElementById("flockProgram");

    if (!production || !genetics || !strain || !program) return;

    production.addEventListener("change", updateGenetics);
    genetics.addEventListener("change", updatePrograms);

    updateGenetics();
}


function updateGenetics() {

    const type = getValue("productionType");
    const genetics = document.getElementById("genetics");
    const strain = document.getElementById("flockStrain");
    const program = document.getElementById("flockProgram");

    if (!genetics || !strain || !program) return;

    genetics.innerHTML = `<option value="">انتخاب شرکت / ژنتیک</option>`;
    strain.innerHTML = `<option value="">انتخاب سویه / خط ژنتیکی</option>`;
    program.innerHTML = `<option value="">انتخاب خودکار</option>`;

    const catalog = typeof getGenetics === "function"
        ? getGenetics(type)
        : (window.POULTRY_CATALOG?.[type]?.genetics || []);

    (catalog || []).forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        genetics.appendChild(option);
    });

    genetics.disabled = !(catalog && catalog.length);
    strain.disabled = true;
    program.disabled = true;
}


function updatePrograms() {

    const type = getValue("productionType");
    const geneticsId = getValue("genetics");
    const genetics = document.getElementById("genetics");
    const strain = document.getElementById("flockStrain");
    const program = document.getElementById("flockProgram");

    if (!genetics || !strain || !program) return;

    strain.innerHTML = `<option value="">انتخاب سویه / خط ژنتیکی</option>`;
    program.innerHTML = `<option value="">انتخاب خودکار</option>`;

    if (!geneticsId) {
        strain.disabled = true;
        program.disabled = true;
        return;
    }

    const strains = typeof getStrains === "function"
        ? getStrains(type, geneticsId)
        : (window.POULTRY_CATALOG?.[type]?.genetics || [])
            .find(g => g.id === geneticsId)?.strains || [];

    (strains || []).forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        strain.appendChild(option);
    });

    strain.disabled = !(strains && strains.length);
    program.disabled = false;

    const first = strain.options.length > 1 ? strain.options[1] : null;
    if (first && strains.length === 1) {
        strain.value = first.value;
    }

    updateStrainProgram();

    strain.onchange = updateStrainProgram;
}


function updateStrainProgram() {

    const type = getValue("productionType");
    const geneticsId = getValue("genetics");
    const strainValue = getValue("flockStrain");
    const genetics = document.getElementById("genetics");
    const program = document.getElementById("flockProgram");

    if (!program) return;

    program.innerHTML = `<option value="">انتخاب استاندارد / برنامه</option>`;

    if (!geneticsId) {
        program.disabled = true;
        return;
    }

    const company = genetics?.selectedOptions?.[0]?.textContent || geneticsId;
    const label = strainValue || company;

    const option = document.createElement("option");
    option.value = `${type}_${geneticsId}_${strainValue || "default"}`;
    option.textContent = `استاندارد ${company}${strainValue ? " — " + strainValue : ""}`;
    program.appendChild(option);
    program.disabled = false;
}


/* =========================================================
   FLOCKS
========================================================= */

async function loadFlocks() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("flocks")
            .select("*")
            .eq(
                "farm_id",
                selectedFarm.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Flocks loading error:",
            error
        );

        return;

    }


    flocks =
        data || [];


    renderFlocks();

}


/* =========================================================
   FLOCK FORM
========================================================= */

function setupFlockForm() {

    const form =
        document.getElementById(
            "flockForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        saveFlock
    );

}


/* =========================================================
   SAVE FLOCK
========================================================= */

async function saveFlock(
    event
) {

    event.preventDefault();


    if (!selectedFarm) {

        alert(
            "ابتدا فارم را انتخاب کنید."
        );

        return;

    }


    const houseId =
        getValue(
            "flockHouse"
        );


    if (!houseId) {

        alert(
            "سالن را انتخاب کنید."
        );

        return;

    }


    const name =
        getValue(
            "flockName"
        );


    const productionType =
        getValue(
            "productionType"
        );


    if (!name || !productionType) {

        alert(
            "نام گله و نوع پرورش الزامی است."
        );

        return;

    }


    /* =====================================================
       JALALI DATE
    ===================================================== */

    const jalaliDate =
        getValue(
            "placementDate"
        );


    let gregorianDate = null;


    if (jalaliDate) {

        gregorianDate =
            jalaliToGregorianISO(
                jalaliDate
            );


        if (!gregorianDate) {

            alert(
                "تاریخ ورود گله را به صورت ۱۴۰۵/۰۵/۲۹ وارد کنید."
            );

            return;

        }

    }


    const payload = {

        farm_id:
            selectedFarm.id,

        house_id:
            houseId,

        owner_id:
            currentUser.id,

        flock_name:
            name,

        production_type:
            productionType,

        genetics:
            getValue("genetics"),

        strain:
            getValue("flockStrain") ||
            getValue("genetics"),

        program:
            getValue("flockProgram"),

        sex:
            getValue("flockSex") ||
            "mixed",

        initial_bird_count:
            getNumber("birdCount"),

        current_bird_count:
            getNumber("birdCount"),

        placement_date:
            gregorianDate,

        start_age_days:
            getNumber("startAgeDays"),

        status:
            "active",

        notes:
            getValue("flockNotes")

    };


    const button =
        event.target.querySelector(
            'button[type="submit"]'
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "در حال ذخیره...";

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("flocks")
                .insert(payload)
                .select()
                .single();


        if (error) {

            console.error(
                "Save flock error:",
                error
            );

            alert(
                "ذخیره گله انجام نشد:\n" +
                error.message
            );

            return;

        }


        setCurrentSelection({

            farmId:
                selectedFarm.id,

            houseId:
                houseId,

            flockId:
                data.id

        });


        event.target.reset();


        document.getElementById(
            "startAgeDays"
        ).value = "۱";


        updateGenetics();


        await loadFlocks();


        alert(
            "گله با موفقیت ثبت شد."
        );

    }

    finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "ذخیره گله";

        }

    }

}


/* =========================================================
   RENDER FLOCKS
========================================================= */

function renderFlocks() {

    const container =
        document.getElementById(
            "flocksList"
        );


    if (!container) {

        return;

    }


    if (!flocks.length) {

        container.innerHTML = `
            <p>
                هنوز گله‌ای ثبت نشده است.
            </p>
        `;

        return;

    }


    container.innerHTML =

        flocks
            .map(
                flock => `

                    <div class="card">

                        <h3>
                            🐔
                            ${escapeHTML(
                                flock.flock_name
                            )}
                        </h3>

                        <p>
                            نوع:
                            ${getProductionLabel(
                                flock.production_type
                            )}
                        </p>

                        <p>
                            سویه:
                            ${escapeHTML(
                                flock.genetics || "-"
                            )}
                        </p>

                        <p>
                            تعداد:
                            ${
                                flock.initial_bird_count !== null &&
                                flock.initial_bird_count !== undefined
                                    ? Number(
                                        flock.initial_bird_count
                                      ).toLocaleString("fa-IR")
                                    : "-"
                            }
                        </p>

                        <p>
                            تاریخ ورود:
                            ${escapeHTML(
                                gregorianISOToJalali(
                                    flock.placement_date
                                ) || "-"
                            )}
                        </p>

                        <div class="button-row">

                            <button
                                class="btn btn-primary"
                                type="button"
                                onclick="
                                    selectFlock(
                                        '${escapeHTML(flock.id)}'
                                    )
                                "
                            >
                                انتخاب گله
                            </button>

                            <button
                                class="btn btn-danger"
                                type="button"
                                onclick="
                                    deleteFlock(
                                        '${escapeHTML(flock.id)}'
                                    )
                                "
                            >
                                حذف
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   SELECT FLOCK
========================================================= */

function selectFlock(
    flockId
) {

    const flock =
        flocks.find(
            item =>
                item.id === flockId
        );


    if (!flock) {

        return;

    }


    setCurrentSelection({

        farmId:
            flock.farm_id,

        houseId:
            flock.house_id,

        flockId:
            flock.id

    });


    window.location.href =
        "weekly.html";

}


/* =========================================================
   DELETE FLOCK
========================================================= */

async function deleteFlock(
    flockId
) {

    const confirmed =
        confirm(
            "آیا از حذف این گله مطمئن هستید؟"
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("flocks")
            .delete()
            .eq(
                "id",
                flockId
            );


    if (error) {

        alert(
            "حذف گله انجام نشد:\n" +
            error.message
        );

        return;

    }


    const selection =
        getCurrentSelection();


    if (
        selection.flockId ===
        flockId
    ) {

        setCurrentSelection({

            flockId: null

        });

    }


    await loadFlocks();


    alert(
        "گله حذف شد."
    );

}


/* =========================================================
   DISABLE
========================================================= */

function disableForms() {

    [
        "houseForm",
        "flockForm"
    ]
    .forEach(
        id => {

            const form =
                document.getElementById(
                    id
                );


            if (!form) {

                return;

            }


            Array
                .from(
                    form.elements
                )
                .forEach(
                    element => {

                        element.disabled =
                            true;

                    }
                );

        }
    );

}


/* =========================================================
   HELPERS
========================================================= */

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? String(
            element.value || ""
          ).trim()
        : "";

}


function getNumber(
    id
) {

    const value =
        normalizeNumbers(
            getValue(id)
        );


    if (!value) {

        return 0;

    }


    /*
       اجازه اعداد اعشاری فارسی/انگلیسی
    */

    const normalized =
        value
            .replace(/٫/g, ".")
            .replace(/٬/g, "")
            .replace(/,/g, "");


    const number =
        Number(normalized);


    return Number.isFinite(number)
        ? number
        : 0;

}


function getProductionLabel(
    type
) {

    const labels = {

        broiler: "گوشتی",

        layer: "تخم‌گذار",

        pullet: "پولت",

        breeder: "مرغ مادر"

    };


    return labels[type] || type || "-";

}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}


/* =========================================================
   JALALI DATE SYSTEM
========================================================= */


/*
   تبدیل تاریخ شمسی به میلادی
   ورودی:
   ۱۴۰۵/۰۵/۲۹
   یا:
   1405/05/29
*/

function jalaliToGregorianISO(
    input
) {

    const normalized =
        normalizeNumbers(
            input
        )
        .replace(/-/g, "/")
        .replace(/\\/g, "/");


    const parts =
        normalized
            .split("/")
            .map(
                item =>
                    Number(item)
            );


    if (
        parts.length !== 3 ||
        parts.some(
            item =>
                !Number.isFinite(item)
        )
    ) {

        return null;

    }


    const jy =
        parts[0];

    const jm =
        parts[1];

    const jd =
        parts[2];


    if (
        jy < 1200 ||
        jy > 1600 ||
        jm < 1 ||
        jm > 12 ||
        jd < 1 ||
        jd > 31
    ) {

        return null;

    }


    const result =
        jalaliToGregorian(
            jy,
            jm,
            jd
        );


    if (!result) {

        return null;

    }


    return (
        String(result.gy).padStart(4, "0") +
        "-" +
        String(result.gm).padStart(2, "0") +
        "-" +
        String(result.gd).padStart(2, "0")
    );

}


/*
   الگوریتم تبدیل جلالی به میلادی
*/

function jalaliToGregorian(
    jy,
    jm,
    jd
) {

    jy -= 979;


    let days =
        365 * jy;


    days +=
        Math.floor(
            jy / 33
        ) * 8;


    days +=
        Math.floor(
            ((jy % 33) + 3) / 4
        );


    if (jm < 7) {

        days +=
            (jm - 1) * 31;

    }

    else {

        days +=
            (jm - 7) * 30 +
            186;

    }


    days +=
        jd - 1;


    let gy =
        1600 +
        400 *
        Math.floor(
            days / 146097
        );


    days %=
        146097;


    if (days >= 36525) {

        days--;

        gy +=
            100 *
            Math.floor(
                days / 36524
            );

        days %=
            36524;


        if (days >= 365) {

            days++;

        }

    }


    gy +=
        4 *
        Math.floor(
            days / 1461
        );


    days %=
        1461;


    if (days >= 366) {

        gy +=
            Math.floor(
                (days - 1) / 365
            );

        days =
            (days - 1) % 365;

    }


    let gd =
        days + 1;


    const leap =
        (
            gy % 4 === 0 &&
            gy % 100 !== 0
        ) ||
        (
            gy % 400 === 0
        );


    const monthDays = [

        31,

        leap ? 29 : 28,

        31,

        30,

        31,

        30,

        31,

        31,

        30,

        31,

        30,

        31

    ];


    let gm = 1;


    for (
        let i = 0;
        i < 12;
        i++
    ) {

        if (
            gd >
            monthDays[i]
        ) {

            gd -=
                monthDays[i];

            gm++;

        }

        else {

            break;

        }

    }


    return {

        gy,

        gm,

        gd

    };

}


/*
   تبدیل میلادی به شمسی
*/

function gregorianISOToJalali(
    iso
) {

    if (!iso) {

        return "";

    }


    const parts =
        String(iso)
            .substring(
                0,
                10
            )
            .split("-")
            .map(
                Number
            );


    if (
        parts.length !== 3 ||
        parts.some(
            Number.isNaN
        )
    ) {

        return "";

    }


    const result =
        gregorianToJalali(
            parts[0],
            parts[1],
            parts[2]
        );


    if (!result) {

        return "";

    }


    return (
        String(result.jy).padStart(4, "0") +
        "/" +
        String(result.jm).padStart(2, "0") +
        "/" +
        String(result.jd).padStart(2, "0")
    );

}


/*
   الگوریتم میلادی به جلالی
*/

function gregorianToJalali(
    gy,
    gm,
    gd
) {

    const gdm = [

        0,
        31,
        59,
        90,
        120,
        151,
        181,
        212,
        243,
        273,
        304,
        334

    ];


    let gy2 =
        gm > 2
            ? gy + 1
            : gy;


    let days =
        355666 +
        365 * gy +
        Math.floor(
            (gy2 + 3) / 4
        ) -
        Math.floor(
            (gy2 + 99) / 100
        ) +
        Math.floor(
            (gy2 + 399) / 400
        ) +
        gd +
        gdm[gm - 1];


    let jy =
        -1595 +
        33 *
        Math.floor(
            days / 12053
        );


    days %=
        12053;


    jy +=
        4 *
        Math.floor(
            days / 1461
        );


    days %=
        1461;


    if (days > 365) {

        jy +=
            Math.floor(
                (days - 1) / 365
            );

        days =
            (days - 1) % 365;

    }


    let jd;


    let jm;


    if (days < 186) {

        jm =
            1 +
            Math.floor(
                days / 31
            );

        jd =
            1 +
            (days % 31);

    }

    else {

        jm =
            7 +
            Math.floor(
                (days - 186) / 30
            );

        jd =
            1 +
            ((days - 186) % 30);

    }


    return {

        jy,
        jm,
        jd

    };

}


/* =========================================================
   PERSIAN DIGITS FOR DISPLAY
========================================================= */

function toPersianDigits(
    value
) {

    return String(value)
        .replace(
            /\d/g,
            function(char) {

                return (
                    "۰۱۲۳۴۵۶۷۸۹"
                )[Number(char)];

            }
        );

}


/* =========================================================
   JALALI DATE PICKER
========================================================= */

let jalaliPicker = null;

let jalaliPickerYear = null;

let jalaliPickerMonth = null;


function setupJalaliDate() {

    const input =
        document.getElementById(
            "placementDate"
        );


    if (!input) {

        return;

    }


    input.addEventListener(
        "click",
        openJalaliPicker
    );


    input.addEventListener(
        "focus",
        openJalaliPicker
    );


    createJalaliPicker();

}


function createJalaliPicker() {

    if (
        document.getElementById(
            "jalaliDatePicker"
        )
    ) {

        jalaliPicker =
            document.getElementById(
                "jalaliDatePicker"
            );

        return;

    }


    const picker =
        document.createElement(
            "div"
        );


    picker.id =
        "jalaliDatePicker";


    picker.style.cssText = `

        position: fixed;
        z-index: 99999;
        background: #ffffff;
        border: 1px solid #d9d9d9;
        border-radius: 14px;
        box-shadow: 0 10px 35px rgba(0,0,0,.18);
        padding: 12px;
        width: min(330px, calc(100vw - 24px));
        display: none;
        direction: rtl;
        font-family: inherit;

    `;


    document.body.appendChild(
        picker
    );


    jalaliPicker =
        picker;


    document.addEventListener(
        "click",
        function(event) {

            const input =
                document.getElementById(
                    "placementDate"
                );


            if (
                jalaliPicker &&
                jalaliPicker.style.display !== "none" &&
                !jalaliPicker.contains(event.target) &&
                event.target !== input
            ) {

                closeJalaliPicker();

            }

        }
    );

}


function openJalaliPicker() {

    if (!jalaliPicker) {

        createJalaliPicker();

    }


    const input =
        document.getElementById(
            "placementDate"
        );


    const current =
        getValue(
            "placementDate"
        );


    if (current) {

        const parts =
            normalizeNumbers(
                current
            )
            .split("/")
            .map(Number);


        if (
            parts.length === 3 &&
            parts[0] >= 1200 &&
            parts[1] >= 1 &&
            parts[1] <= 12
        ) {

            jalaliPickerYear =
                parts[0];

            jalaliPickerMonth =
                parts[1];

        }

    }


    if (
        !jalaliPickerYear ||
        !jalaliPickerMonth
    ) {

        const now =
            new Date();


        const today =
            gregorianToJalali(
                now.getFullYear(),
                now.getMonth() + 1,
                now.getDate()
            );


        jalaliPickerYear =
            today.jy;

        jalaliPickerMonth =
            today.jm;

    }


    renderJalaliPicker();


    const rect =
        input.getBoundingClientRect();


    const pickerWidth =
        Math.min(
            330,
            window.innerWidth - 24
        );


    let left =
        rect.left;


    if (
        left + pickerWidth >
        window.innerWidth - 12
    ) {

        left =
            window.innerWidth -
            pickerWidth -
            12;

    }


    if (left < 12) {

        left = 12;

    }


    let top =
        rect.bottom + 8;


    const estimatedHeight =
        360;


    if (
        top + estimatedHeight >
        window.innerHeight
    ) {

        top =
            rect.top -
            estimatedHeight -
            8;

    }


    if (top < 12) {

        top = 12;

    }


    jalaliPicker.style.left =
        left + "px";


    jalaliPicker.style.top =
        top + "px";


    jalaliPicker.style.display =
        "block";

}


function closeJalaliPicker() {

    if (jalaliPicker) {

        jalaliPicker.style.display =
            "none";

    }

}


function renderJalaliPicker() {

    if (!jalaliPicker) {

        return;

    }


    const monthNames = [

        "فروردین",
        "اردیبهشت",
        "خرداد",
        "تیر",
        "مرداد",
        "شهریور",
        "مهر",
        "آبان",
        "آذر",
        "دی",
        "بهمن",
        "اسفند"

    ];


    const daysInMonth =
        jalaliPickerMonth <= 6
            ? 31
            : jalaliPickerMonth <= 11
                ? 30
                : isJalaliLeapYear(
                    jalaliPickerYear
                  )
                    ? 30
                    : 29;


    const firstGregorian =
        jalaliToGregorian(
            jalaliPickerYear,
            jalaliPickerMonth,
            1
        );


    const firstDate =
        new Date(
            firstGregorian.gy,
            firstGregorian.gm - 1,
            firstGregorian.gd
        );


    const startDay =
        firstDate.getDay();


    /*
       تبدیل یکشنبه=۰ به
       شنبه=۰ برای تقویم فارسی
    */

    const offset =
        (startDay + 1) % 7;


    let html = `

        <div
            style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:8px;
                margin-bottom:10px;
            "
        >

            <button
                type="button"
                data-jalali-prev
                style="
                    border:0;
                    background:#f2f2f2;
                    border-radius:8px;
                    padding:7px 12px;
                    font-size:18px;
                    cursor:pointer;
                "
            >
                ›
            </button>

            <strong
                style="
                    font-size:15px;
                "
            >
                ${monthNames[jalaliPickerMonth - 1]}
                ${toPersianDigits(jalaliPickerYear)}
            </strong>

            <button
                type="button"
                data-jalali-next
                style="
                    border:0;
                    background:#f2f2f2;
                    border-radius:8px;
                    padding:7px 12px;
                    font-size:18px;
                    cursor:pointer;
                "
            >
                ‹
            </button>

        </div>


        <div
            style="
                display:grid;
                grid-template-columns:repeat(7,1fr);
                gap:4px;
                text-align:center;
                margin-bottom:5px;
                font-size:12px;
                font-weight:bold;
            "
        >

            <div>ش</div>
            <div>ی</div>
            <div>د</div>
            <div>س</div>
            <div>چ</div>
            <div>پ</div>
            <div>ج</div>

        </div>


        <div
            style="
                display:grid;
                grid-template-columns:repeat(7,1fr);
                gap:4px;
            "
        >
    `;


    for (
        let i = 0;
        i < offset;
        i++
    ) {

        html += `
            <div></div>
        `;

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        html += `

            <button
                type="button"
                data-jalali-day="${day}"
                style="
                    border:0;
                    background:#f7f7f7;
                    border-radius:8px;
                    padding:8px 2px;
                    cursor:pointer;
                    font-size:13px;
                "
            >
                ${toPersianDigits(day)}
            </button>

        `;

    }


    html += `

        </div>


        <div
            style="
                display:flex;
                justify-content:space-between;
                gap:8px;
                margin-top:10px;
            "
        >

            <button
                type="button"
                data-jalali-today
                style="
                    flex:1;
                    border:0;
                    background:#173f35;
                    color:white;
                    border-radius:8px;
                    padding:8px;
                    cursor:pointer;
                    font-family:inherit;
                "
            >
                امروز
            </button>

            <button
                type="button"
                data-jalali-close
                style="
                    flex:1;
                    border:0;
                    background:#eeeeee;
                    border-radius:8px;
                    padding:8px;
                    cursor:pointer;
                    font-family:inherit;
                "
            >
                بستن
            </button>

        </div>

    `;


    jalaliPicker.innerHTML =
        html;


    jalaliPicker
        .querySelector(
            "[data-jalali-prev]"
        )
        .addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                jalaliPickerMonth--;

                if (
                    jalaliPickerMonth <
                    1
                ) {

                    jalaliPickerMonth =
                        12;

                    jalaliPickerYear--;

                }

                renderJalaliPicker();

            }
        );


    jalaliPicker
        .querySelector(
            "[data-jalali-next]"
        )
        .addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                jalaliPickerMonth++;

                if (
                    jalaliPickerMonth >
                    12
                ) {

                    jalaliPickerMonth =
                        1;

                    jalaliPickerYear++;

                }

                renderJalaliPicker();

            }
        );


    jalaliPicker
        .querySelectorAll(
            "[data-jalali-day]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function(event) {

                        event.stopPropagation();


                        const day =
                            Number(
                                button.dataset.jalaliDay
                            );


                        const value =
                            String(
                                jalaliPickerYear
                            ).padStart(4, "0") +
                            "/" +
                            String(
                                jalaliPickerMonth
                            ).padStart(2, "0") +
                            "/" +
                            String(
                                day
                            ).padStart(2, "0");


                        const input =
                            document.getElementById(
                                "placementDate"
                            );


                        input.value =
                            toPersianDigits(
                                value
                            );


                        closeJalaliPicker();

                    }
                );

            }
        );


    jalaliPicker
        .querySelector(
            "[data-jalali-today]"
        )
        .addEventListener(
            "click",
            function(event) {

                event.stopPropagation();


                const now =
                    new Date();


                const today =
                    gregorianToJalali(
                        now.getFullYear(),
                        now.getMonth() + 1,
                        now.getDate()
                    );


                jalaliPickerYear =
                    today.jy;

                jalaliPickerMonth =
                    today.jm;


                const input =
                    document.getElementById(
                        "placementDate"
                    );


                input.value =
                    toPersianDigits(
                        String(today.jy).padStart(4, "0") +
                        "/" +
                        String(today.jm).padStart(2, "0") +
                        "/" +
                        String(today.jd).padStart(2, "0")
                    );


                closeJalaliPicker();

            }
        );


    jalaliPicker
        .querySelector(
            "[data-jalali-close]"
        )
        .addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                closeJalaliPicker();

            }
        );

}


function isJalaliLeapYear(
    year
) {

    const mod =
        year % 33;


    return [

        1,
        5,
        9,
        13,
        17,
        22,
        26,
        30

    ].includes(mod);

}
