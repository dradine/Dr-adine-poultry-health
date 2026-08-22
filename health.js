/* =========================================================
   ADINE POULTRY HEALTH CENTER
   HEALTH MODULE
   Compatible with current Supabase schema
========================================================= */

let currentUser = null;
let currentFlock = null;
let currentFarm = null;
let currentHouse = null;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initHealth
);


async function initHealth() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (
            error ||
            !data.session
        ) {

            location.href =
                "login.html?message=" +
                encodeURIComponent(
                    "ابتدا وارد سامانه شوید."
                );

            return;
        }


        currentUser =
            data.session.user;


        await loadSelection();

        setupTabs();

        setupForms();

        setupPrintButton();


        if (
            window.jalaliDate &&
            typeof window.jalaliDate
                .prepareDateFields === "function"
        ) {

            window.jalaliDate
                .prepareDateFields();

        }


        setDefaultDates();

        await loadCatalogs();

        await loadHistory();

    }

    catch (error) {

        console.error(
            "Health initialization error:",
            error
        );

        showStatus(
            "خطا در بارگذاری بخش سلامت: " +
            error.message,
            "error"
        );
    }
}


/* =========================================================
   LOAD FLOCK
========================================================= */

async function loadSelection() {

    const selection =
        typeof getCurrentSelection === "function"
            ? getCurrentSelection()
            : {};


    if (!selection.flockId) {

        alert(
            "ابتدا یک گله را انتخاب کنید."
        );

        location.href =
            "flocks.html";

        return;
    }


    const {
        data: flock,
        error
    } =
        await supabaseClient
            .from("flocks")
            .select("*")
            .eq(
                "id",
                selection.flockId
            )
            .maybeSingle();


    if (error) {
        throw error;
    }


    if (!flock) {

        alert(
            "گله انتخاب‌شده پیدا نشد."
        );

        location.href =
            "flocks.html";

        return;
    }


    currentFlock =
        flock;


    const farmResult =
        await supabaseClient
            .from("farms")
            .select("*")
            .eq(
                "id",
                flock.farm_id
            )
            .maybeSingle();


    if (!farmResult.error) {

        currentFarm =
            farmResult.data;
    }


    const houseResult =
        await supabaseClient
            .from("houses")
            .select("*")
            .eq(
                "id",
                flock.house_id
            )
            .maybeSingle();


    if (!houseResult.error) {

        currentHouse =
            houseResult.data;
    }


    const info = [

        currentFarm?.name,

        currentHouse?.name,

        currentFlock.flock_name,

        currentFlock.strain

    ]
    .filter(Boolean)
    .join(" | ");


    const infoElement =
        document.getElementById(
            "flockInfo"
        );


    if (infoElement) {

        infoElement.textContent =
            info || "گله انتخاب‌شده";
    }


    calculateAge();
}


/* =========================================================
   AGE
========================================================= */

function calculateAge() {

    if (
        !currentFlock?.placement_date
    ) {
        return;
    }


    let age = null;


    if (
        typeof calculateAgeDays ===
        "function"
    ) {

        age =
            calculateAgeDays(
                currentFlock.placement_date
            );
    }


    if (
        age === null ||
        age === undefined
    ) {
        return;
    }


    [
        "vaccinationAge",
        "antibodyAge"
    ]
    .forEach(id => {

        const el =
            document.getElementById(id);


        if (
            el &&
            !el.value
        ) {

            el.value =
                age;
        }

    });
}


/* =========================================================
   TABS
========================================================= */

function setupTabs() {

    document
        .querySelectorAll(
            ".health-tab"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const tab =
                        this.dataset.tab;


                    document
                        .querySelectorAll(
                            ".health-tab"
                        )
                        .forEach(btn => {

                            btn.classList.remove(
                                "active"
                            );

                        });


                    document
                        .querySelectorAll(
                            ".health-panel"
                        )
                        .forEach(panel => {

                            panel.classList.remove(
                                "active"
                            );

                        });


                    this.classList.add(
                        "active"
                    );


                    const panel =
                        document.getElementById(
                            "panel-" + tab
                        );


                    if (panel) {

                        panel.classList.add(
                            "active"
                        );
                    }

                }
            );

        });
}


/* =========================================================
   FORMS
========================================================= */

function setupForms() {

    const vaccinationForm =
        document.getElementById(
            "vaccinationForm"
        );


    if (vaccinationForm) {

        vaccinationForm.addEventListener(
            "submit",
            saveVaccination
        );
    }


    const antibodyForm =
        document.getElementById(
            "antibodyForm"
        );


    if (antibodyForm) {

        antibodyForm.addEventListener(
            "submit",
            saveAntibody
        );
    }


    const labForm =
        document.getElementById(
            "labForm"
        );


    if (labForm) {

        labForm.addEventListener(
            "submit",
            saveLab
        );
    }


    const treatmentForm =
        document.getElementById(
            "treatmentForm"
        );


    if (treatmentForm) {

        treatmentForm.addEventListener(
            "submit",
            saveTreatment
        );
    }
}


/* =========================================================
   DATES
========================================================= */

function setDefaultDates() {

    let today = "";


    if (
        window.jalaliDate &&
        typeof window.jalaliDate
            .todayJalali === "function"
    ) {

        today =
            window.jalaliDate
                .todayJalali();
    }


    [
        "vaccinationDate",
        "antibodyDate",
        "labDate",
        "treatmentDate"
    ]
    .forEach(id => {

        const el =
            document.getElementById(id);


        if (
            el &&
            !el.value
        ) {

            el.value =
                today;
        }

    });
}


/* =========================================================
   CATALOGS
========================================================= */

async function loadCatalogs() {

    await Promise.all([

        loadDiseases(),

        loadVaccines(),

        loadMedications()

    ]);
}


/* =========================================================
   DISEASES
========================================================= */

async function loadDiseases() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("diseases")
            .select("*")
            .eq(
                "active",
                true
            )
            .order(
                "category"
            );


    if (error) {
        throw error;
    }


    [
        "vaccinationDisease",
        "antibodyDisease",
        "labDisease",
        "treatmentDisease"
    ]
    .forEach(id => {

        const select =
            document.getElementById(id);


        if (!select) {
            return;
        }


        select.innerHTML = `
            <option value="">
                انتخاب کنید
            </option>
        `;


        (data || []).forEach(
            disease => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    disease.code;


                option.textContent =
                    disease.name_fa;


                select.appendChild(
                    option
                );

            }
        );

    });
}


/* =========================================================
   VACCINES
========================================================= */

async function loadVaccines() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("vaccines")
            .select("*")
            .eq(
                "active",
                true
            )
            .order(
                "name"
            );


    if (error) {
        throw error;
    }


    const select =
        document.getElementById(
            "vaccinationVaccine"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            انتخاب واکسن
        </option>
    `;


    (data || []).forEach(
        vaccine => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                vaccine.id;


            option.textContent =
                vaccine.manufacturer
                    ? `${vaccine.name} — ${vaccine.manufacturer}`
                    : vaccine.name;


            select.appendChild(
                option
            );

        }
    );
}


/* =========================================================
   MEDICATIONS
   No "active" column is assumed.
========================================================= */


function loadMedications() {

    const select =
        document.getElementById(
            "treatmentMedication"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">
            انتخاب دارو
        </option>`;


    LOCAL_MEDICATION_CATALOG
        .forEach(
            (medication, index) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    "local-" + index;


                option.textContent =
                    medication.name +
                    " — " +
                    medication.active;


                option.dataset.name =
                    medication.name;


                option.dataset.active =
                    medication.active;


                select.appendChild(
                    option
                );

            }
        );


    select.addEventListener(
        "change",
        function () {

            const option =
                this.options[
                    this.selectedIndex
                ];


            if (!option) {
                return;
            }


            const nameInput =
                document.getElementById(
                    "treatmentMedicationName"
                );


            const activeInput =
                document.getElementById(
                    "treatmentActive"
                );


            if (nameInput) {

                nameInput.value =
                    option.dataset.name || "";

            }


            if (activeInput) {

                activeInput.value =
                    option.dataset.active || "";

            }

        }
    );

}/* =========================================================
   VACCINATION
   Uses actual current schema:
   vaccine_date
   vaccine_name
   disease
   manufacturer
   batch_number
   route
   dose
   dose_unit
   administered_by
========================================================= */

async function saveVaccination(event) {

    event.preventDefault();


    try {

        const vaccineId =
            value(
                "vaccinationVaccine"
            );


        let vaccineName = "";
        let manufacturer = "";


        if (vaccineId) {

            const {
                data
            } =
                await supabaseClient
                    .from("vaccines")
                    .select(
                        "name,manufacturer"
                    )
                    .eq(
                        "id",
                        vaccineId
                    )
                    .maybeSingle();


            vaccineName =
                data?.name || "";


            manufacturer =
                data?.manufacturer || "";
        }


        const payload = {

            owner_id:
                currentUser.id,

            flock_id:
                currentFlock.id,

            vaccine_date:
                value(
                    "vaccinationDate"
                ),

            vaccine_name:
                vaccineName,

            disease:
                value(
                    "vaccinationDisease"
                ),

            manufacturer:
                manufacturer,

            batch_number:
                value(
                    "vaccinationBatch"
                ),

            route:
                value(
                    "vaccinationRoute"
                ),

            dose:
                numberOrNull(
                    "vaccinationDose"
                ),

            dose_unit:
                value(
                    "vaccinationDoseUnit"
                ),

            administered_by:
                value(
                    "vaccinationAdministeredBy"
                ),

            notes:
                value(
                    "vaccinationNotes"
                )
        };


        if (
            !payload.vaccine_name ||
            !payload.vaccine_date
        ) {

            showStatus(
                "واکسن و تاریخ واکسیناسیون الزامی است.",
                "error"
            );

            return;
        }


        const {
            error
        } =
            await supabaseClient
                .from("vaccinations")
                .insert(
                    payload
                );


        if (error) {
            throw error;
        }


        event.target.reset();

        setDefaultDates();

        calculateAge();


        showStatus(
            "واکسیناسیون با موفقیت ثبت شد.",
            "success"
        );


        await loadHistory();

    }

    catch (error) {

        console.error(error);

        showStatus(
            "ثبت واکسیناسیون انجام نشد: " +
            error.message,
            "error"
        );
    }
}


/* =========================================================
   ANTIBODY
========================================================= */

async function saveAntibody(event) {

    event.preventDefault();


    try {

        const payload = {

            owner_id:
                currentUser.id,

            farm_id:
                currentFlock.farm_id,

            house_id:
                currentFlock.house_id,

            flock_id:
                currentFlock.id,

            disease_code:
                value(
                    "antibodyDisease"
                ),

            test_type:
                value(
                    "antibodyTestType"
                ) || "ELISA",

            antibody_stage:
                value(
                    "antibodyStage"
                ),

            test_date:
                value(
                    "antibodyDate"
                ),

            flock_age_days:
                numberOrNull(
                    "antibodyAge"
                ),

            sample_count:
                numberOrNull(
                    "antibodySamples"
                ),

            mean_value:
                numberOrNull(
                    "antibodyMean"
                ),

            gmt:
                numberOrNull(
                    "antibodyGMT"
                ),

            cv_percent:
                numberOrNull(
                    "antibodyCV"
                ),

            min_value:
                numberOrNull(
                    "antibodyMin"
                ),

            max_value:
                numberOrNull(
                    "antibodyMax"
                ),

            lab_name:
                value(
                    "antibodyLab"
                ),

            notes:
                value(
                    "antibodyNotes"
                )
        };


        if (
            !payload.disease_code ||
            !payload.test_date
        ) {

            showStatus(
                "بیماری و تاریخ آزمایش الزامی است.",
                "error"
            );

            return;
        }


        const {
            error
        } =
            await supabaseClient
                .from("antibody_tests")
                .insert(
                    payload
                );


        if (error) {
            throw error;
        }


        event.target.reset();

        setDefaultDates();

        calculateAge();


        showStatus(
            "تیتر آنتی‌بادی ثبت شد.",
            "success"
        );


        await loadHistory();

    }

    catch (error) {

        console.error(error);

        showStatus(
            "ثبت تیتر انجام نشد: " +
            error.message,
            "error"
        );
    }
}


/* =========================================================
   LAB
========================================================= */

async function saveLab(event) {

    event.preventDefault();


    try {

        const payload = {

            owner_id:
                currentUser.id,

            farm_id:
                currentFlock.farm_id,

            house_id:
                currentFlock.house_id,

            flock_id:
                currentFlock.id,

            test_date:
                value(
                    "labDate"
                ),

            test_type:
                value(
                    "labType"
                ),

            disease_code:
                value(
                    "labDisease"
                ),

            sample_type:
                value(
                    "labSampleType"
                ),

            sample_count:
                numberOrNull(
                    "labSampleCount"
                ),

            positive_count:
                numberOrNull(
                    "labPositiveCount"
                ),

            result:
                value(
                    "labResult"
                ),

            ct_value:
                numberOrNull(
                    "labCT"
                ),

            antibiotic_sensitivity:
                value(
                    "labSensitivity"
                ),

            laboratory:
                value(
                    "labLaboratory"
                ),

            notes:
                value(
                    "labNotes"
                )
        };


        if (
            !payload.test_date
        ) {

            showStatus(
                "تاریخ آزمایش الزامی است.",
                "error"
            );

            return;
        }


        const {
            error
        } =
            await supabaseClient
                .from("lab_tests")
                .insert(
                    payload
                );


        if (error) {
            throw error;
        }


        event.target.reset();

        setDefaultDates();


        showStatus(
            "آزمایش با موفقیت ثبت شد.",
            "success"
        );


        await loadHistory();

    }

    catch (error) {

        console.error(error);

        showStatus(
            "ثبت آزمایش انجام نشد: " +
            error.message,
            "error"
        );
    }
}


/* =========================================================
   TREATMENT
   Uses actual current schema:
   medicine_name
   active_ingredient
   dose
   dose_unit
   route
   indication
   withdrawal_days
   veterinarian
========================================================= */

async function saveTreatment(event) {

    event.preventDefault();


    try {

        const medicationId =
            value(
                "treatmentMedication"
            );


        let selectedMedication = null;


        if (medicationId) {

            const {
                data
            } =
                await supabaseClient
                    .from("medications")
                    .select("*")
                    .eq(
                        "id",
                        medicationId
                    )
                    .maybeSingle();


            selectedMedication =
                data || null;
        }


        const medicationName =
            value(
                "treatmentMedicationName"
            ) ||
            selectedMedication?.name ||
            "";


        const activeIngredient =
            value(
                "treatmentActive"
            ) ||
            selectedMedication?.active_ingredient ||
            "";


        const withdrawalText =
            value(
                "treatmentWithdrawal"
            );


        let withdrawalDays = null;


        if (withdrawalText !== null) {

            const parsed =
                Number(
                    withdrawalText
                );


            if (
                Number.isFinite(parsed)
            ) {

                withdrawalDays =
                    parsed;
            }
        }


        const payload = {

            owner_id:
                currentUser.id,

            flock_id:
                currentFlock.id,

            start_date:
                value(
                    "treatmentDate"
                ),

            end_date:
                value(
                    "treatmentEnd"
                ),

            medicine_name:
                medicationName,

            active_ingredient:
                activeIngredient,

            dose:
                numberOrNull(
                    "treatmentDose"
                ),

            dose_unit:
                null,

            route:
                value(
                    "treatmentRoute"
                ),

            indication:
                value(
                    "treatmentDisease"
                ),

            withdrawal_days:
                withdrawalDays,

            veterinarian:
                value(
                    "treatmentVeterinarian"
                ),

            notes:
                value(
                    "treatmentNotes"
                )
        };


        if (
            !payload.start_date ||
            !payload.medicine_name
        ) {

            showStatus(
                "تاریخ شروع و نام دارو الزامی است.",
                "error"
            );

            return;
        }


        const {
            error
        } =
            await supabaseClient
                .from("treatment_records")
                .insert(
                    payload
                );


        /*
         * اگر جدول اصلی پروژه نام treatments داشته باشد
         * در مرحله بعد قابل تغییر است.
         */


        if (error) {

            /*
             * تلاش دوم برای ساختار قدیمی
             */

            const fallback =
                await supabaseClient
                    .from("treatments")
                    .insert({

                        owner_id:
                            currentUser.id,

                        farm_id:
                            currentFlock.farm_id,

                        house_id:
                            currentFlock.house_id,

                        flock_id:
                            currentFlock.id,

                        treatment_date:
                            payload.start_date,

                        end_date:
                            payload.end_date,

                        disease_code:
                            payload.indication,

                        medication_id:
                            medicationId,

                        medication_name:
                            payload.medicine_name,

                        active_ingredient:
                            payload.active_ingredient,

                        dose:
                            value(
                                "treatmentDose"
                            ),

                        route:
                            payload.route,

                        duration:
                            value(
                                "treatmentDuration"
                            ),

                        withdrawal_period:
                            value(
                                "treatmentWithdrawal"
                            ),

                        result:
                            value(
                                "treatmentResult"
                            ),

                        notes:
                            payload.notes
                    });


            if (fallback.error) {

                throw error;
            }
        }


        event.target.reset();

        setDefaultDates();


        showStatus(
            "درمان با موفقیت ثبت شد.",
            "success"
        );


        await loadHistory();

    }

    catch (error) {

        console.error(error);

        showStatus(
            "ثبت درمان انجام نشد: " +
            error.message,
            "error"
        );
    }
}


/* =========================================================
   HISTORY
========================================================= */

async function loadHistory() {

    const table =
        document.getElementById(
            "healthTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = `
        <tr>
            <td colspan="5">
                در حال دریافت سوابق...
            </td>
        </tr>
    `;


    const [
        vaccinationsResult,
        antibodiesResult,
        labsResult,
        treatmentsResult
    ] =
        await Promise.all([

            supabaseClient
                .from("vaccinations")
                .select("*")
                .eq(
                    "flock_id",
                    currentFlock.id
                ),


            supabaseClient
                .from("antibody_tests")
                .select("*")
                .eq(
                    "flock_id",
                    currentFlock.id
                ),


            supabaseClient
                .from("lab_tests")
                .select("*")
                .eq(
                    "flock_id",
                    currentFlock.id
                ),


            /*
             * جدول واقعی جدید
             */

            supabaseClient
                .from("treatment_records")
                .select("*")
                .eq(
                    "flock_id",
                    currentFlock.id
                )

        ]);


    /*
     * اگر treatment_records وجود نداشت
     * از جدول treatments استفاده می‌کنیم.
     */

    let treatmentData =
        treatmentsResult.data || [];


    if (
        treatmentsResult.error
    ) {

        const fallback =
            await supabaseClient
                .from("treatments")
                .select("*")
                .eq(
                    "flock_id",
                    currentFlock.id
                );


        if (!fallback.error) {

            treatmentData =
                fallback.data || [];

        }

    }


    if (
        vaccinationsResult.error ||
        antibodiesResult.error ||
        labsResult.error
    ) {

        console.error(
            vaccinationsResult.error,
            antibodiesResult.error,
            labsResult.error
        );


        table.innerHTML = `
            <tr>
                <td colspan="5">
                    خطا در دریافت سوابق
                </td>
            </tr>
        `;


        return;
    }


    const rows = [];


    /* =====================================================
       VACCINATIONS
    ===================================================== */

    (vaccinationsResult.data || [])
        .forEach(item => {

            rows.push({

                id:
                    item.id,

                table:
                    "vaccinations",

                date:
                    displayHealthDate(
                        item.vaccine_date
                    ),

                sortDate:
                    item.vaccine_date || "",

                type:
                    "واکسیناسیون",

                item:
                    item.vaccine_name ||
                    "واکسن",

                details:
                    [
                        item.disease,
                        item.manufacturer,
                        item.dose !== null
                            ? "دوز: " +
                              item.dose +
                              (
                                  item.dose_unit
                                      ? " " +
                                        item.dose_unit
                                      : ""
                              )
                            : "",
                        routeLabel(
                            item.route
                        ),
                        item.batch_number
                            ? "سری: " +
                              item.batch_number
                            : "",
                        item.administered_by
                            ? "مجری: " +
                              item.administered_by
                            : "",
                        item.notes
                    ]
                    .filter(Boolean)
                    .join(" | ")
            });

        });


    /* =====================================================
       ANTIBODIES
    ===================================================== */

    (antibodiesResult.data || [])
        .forEach(item => {

            rows.push({

                id:
                    item.id,

                table:
                    "antibody_tests",

                date:
                    displayHealthDate(
                        item.test_date
                    ),

                sortDate:
                    item.test_date || "",

                type:
                    "تیتر آنتی‌بادی",

                item:
                    diseaseName(
                        item.disease_code
                    ),

                details:
                    [
                        stageLabel(
                            item.antibody_stage
                        ),

                        item.test_type,

                        item.sample_count
                            ? "نمونه: " +
                              item.sample_count
                            : "",

                        item.mean_value !== null
                            ? "Mean: " +
                              item.mean_value
                            : "",

                        item.gmt !== null
                            ? "GMT: " +
                              item.gmt
                            : "",

                        item.cv_percent !== null
                            ? "CV: " +
                              item.cv_percent +
                              "%"
                            : "",

                        item.min_value !== null
                            ? "Min: " +
                              item.min_value
                            : "",

                        item.max_value !== null
                            ? "Max: " +
                              item.max_value
                            : "",

                        item.lab_name
                    ]
                    .filter(Boolean)
                    .join(" | ")

            });

        });


    /* =====================================================
       LAB
    ===================================================== */

    (labsResult.data || [])
        .forEach(item => {

            rows.push({

                id:
                    item.id,

                table:
                    "lab_tests",

                date:
                    displayHealthDate(
                        item.test_date
                    ),

                sortDate:
                    item.test_date || "",

                type:
                    "آزمایش",

                item:
                    item.disease_code
                        ? diseaseName(
                            item.disease_code
                        )
                        : item.test_type,

                details:
                    [
                        item.test_type,

                        item.sample_type
                            ? "نمونه: " +
                              item.sample_type
                            : "",

                        item.sample_count
                            ? "تعداد: " +
                              item.sample_count
                            : "",

                        item.positive_count !== null
                            ? "مثبت: " +
                              item.positive_count
                            : "",

                        item.result,

                        item.ct_value !== null
                            ? "Ct: " +
                              item.ct_value
                            : "",

                        item.laboratory
                    ]
                    .filter(Boolean)
                    .join(" | ")

            });

        });


    /* =====================================================
       TREATMENTS
    ===================================================== */

    treatmentData
        .forEach(item => {

            const isNew =
                Object.prototype.hasOwnProperty
                    .call(
                        item,
                        "medicine_name"
                    );


            const date =
                isNew
                    ? item.start_date
                    : item.treatment_date;


            const medicine =
                isNew
                    ? item.medicine_name
                    : item.medication_name;


            const route =
                item.route;


            const indication =
                isNew
                    ? item.indication
                    : item.disease_code;


            rows.push({

                id:
                    item.id,

                table:
                    isNew
                        ? "treatment_records"
                        : "treatments",

                date:
                    displayHealthDate(
                        date
                    ),

                sortDate:
                    date || "",

                type:
                    "درمان",

                item:
                    medicine ||
                    "دارو",

                details:
                    [
                        indication
                            ? diseaseName(
                                indication
                            )
                            : "",

                        item.active_ingredient,

                        item.dose !== null &&
                        item.dose !== undefined
                            ? "دوز: " +
                              item.dose
                            : "",

                        routeLabel(
                            route
                        ),

                        isNew &&
                        item.withdrawal_days !== null
                            ? "منع مصرف: " +
                              item.withdrawal_days +
                              " روز"
                            : "",

                        isNew
                            ? item.veterinarian
                            : "",

                        item.result,

                        item.notes
                    ]
                    .filter(Boolean)
                    .join(" | ")

            });

        });


    /* =====================================================
       EMPTY
    ===================================================== */

    if (!rows.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    هنوز سابقه‌ای برای این گله ثبت نشده است.
                </td>
            </tr>
        `;

        return;
    }


    /* =====================================================
       SORT
    ===================================================== */

    rows.sort(
        (a, b) =>
            String(b.sortDate)
                .localeCompare(
                    String(a.sortDate)
                )
    );


    /* =====================================================
       RENDER
    ===================================================== */

    table.innerHTML =
        rows
            .map(row => `

                <tr>

                    <td>
                        ${escapeSafe(
                            row.date
                        )}
                    </td>

                    <td>

                        <span class="badge">

                            ${escapeSafe(
                                row.type
                            )}

                        </span>

                    </td>

                    <td>

                        ${escapeSafe(
                            row.item
                        )}

                    </td>

                    <td>

                        ${escapeSafe(
                            row.details || "-"
                        )}

                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn btn-danger"
                            data-delete-id="${escapeSafe(row.id)}"
                            data-delete-table="${escapeSafe(row.table)}"
                        >

                            حذف

                        </button>

                    </td>

                </tr>

            `)
            .join("");


    /*
     * حذف‌ها
     */

    table
        .querySelectorAll(
            "[data-delete-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    deleteRecord(
                        this.dataset.deleteId,
                        this.dataset.deleteTable
                    );

                }
            );

        });
}


/* =========================================================
   PRINT
========================================================= */

function setupPrintButton() {

    const button =
        document.getElementById(
            "printHealthHistoryBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        printHealthHistory
    );
}


function printHealthHistory() {

    if (!currentFlock) {

        showStatus(
            "ابتدا یک گله را انتخاب کنید.",
            "error"
        );

        return;
    }


    /*
     * اطلاعات گله
     */

    const flockInfo =
        document.getElementById(
            "printFlockInfo"
        );


    if (flockInfo) {

        const parts = [

            currentFarm?.name
                ? "فارم: " +
                  currentFarm.name
                : "",

            currentHouse?.name
                ? "سالن: " +
                  currentHouse.name
                : "",

            currentFlock?.flock_name
                ? "گله: " +
                  currentFlock.flock_name
                : "",

            currentFlock?.strain
                ? "نژاد: " +
                  currentFlock.strain
                : ""

        ]
        .filter(Boolean);


        flockInfo.textContent =
            parts.join(" | ");
    }


    /*
     * تاریخ چاپ شمسی
     */

    const printDate =
        document.getElementById(
            "printDate"
        );


    if (printDate) {

        let today = "";


        if (
            window.jalaliDate &&
            typeof window.jalaliDate
                .todayJalali === "function"
        ) {

            today =
                window.jalaliDate
                    .todayJalali();
        }


        printDate.textContent =
            today
                ? "تاریخ چاپ: " +
                  today
                : "";
    }


    /*
     * فقط تب سوابق فعال باشد
     */

    document
        .querySelectorAll(
            ".health-panel"
        )
        .forEach(panel => {

            panel.classList.remove(
                "active"
            );

        });


    const historyPanel =
        document.getElementById(
            "panel-history"
        );


    if (historyPanel) {

        historyPanel.classList.add(
            "active"
        );
    }


    /*
     * چاپ
     */

    setTimeout(
        () => {

            window.print();

        },
        100
    );
}


/* =========================================================
   DELETE
========================================================= */

async function deleteRecord(
    id,
    tableName
) {

    if (
        !confirm(
            "آیا این رکورد حذف شود؟"
        )
    ) {

        return;
    }


    const allowedTables = [

        "vaccinations",

        "antibody_tests",

        "lab_tests",

        "treatments",

        "treatment_records"

    ];


    if (
        !allowedTables.includes(
            tableName
        )
    ) {

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from(tableName)
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        showStatus(
            "حذف انجام نشد: " +
            error.message,
            "error"
        );

        return;
    }


    showStatus(
        "رکورد حذف شد.",
        "success"
    );


    await loadHistory();
}


/* =========================================================
   HELPERS
========================================================= */

function value(id) {

    const el =
        document.getElementById(id);


    if (!el) {
        return null;
    }


    let result =
        String(
            el.value || ""
        ).trim();


    if (!result) {
        return null;
    }


    const dateIds = [

        "vaccinationDate",

        "antibodyDate",

        "labDate",

        "treatmentDate",

        "treatmentEnd"

    ];


    if (
        dateIds.includes(id)
    ) {

        if (
            !window.jalaliDate ||
            typeof window.jalaliDate
                .jalaliToISO !== "function"
        ) {

            throw new Error(
                "سیستم تاریخ شمسی بارگذاری نشده است."
            );
        }


        const iso =
            window.jalaliDate
                .jalaliToISO(
                    result
                );


        if (!iso) {

            throw new Error(
                "تاریخ واردشده معتبر نیست. فرمت صحیح: ۱۴۰۵/۰۵/۲۹"
            );
        }


        return iso;
    }


    return result;
}


function numberOrNull(id) {

    const v =
        value(id);


    if (
        v === null
    ) {

        return null;
    }


    const number =
        Number(v);


    return Number.isFinite(number)
        ? number
        : null;
}


function displayHealthDate(
    isoDate
) {

    if (!isoDate) {
        return "-";
    }


    if (
        window.jalaliDate &&
        typeof window.jalaliDate
            .isoToJalali === "function"
    ) {

        return window.jalaliDate
            .isoToJalali(
                isoDate
            );
    }


    return isoDate;
}


/* =========================================================
   DISEASE NAME
========================================================= */

const diseaseCache = {};


function diseaseName(code) {

    if (!code) {
        return "";
    }


    /*
     * برای جلوگیری از query اضافه
     * فعلاً خود code را برمی‌گردانیم.
     *
     * گزینه select در فرم نام فارسی را نشان می‌دهد.
     */

    return code;
}


/* =========================================================
   ROUTE
========================================================= */

function routeLabel(route) {

    const map = {

        water:
            "آب آشامیدنی",

        spray:
            "اسپری",

        eye:
            "قطره چشمی",

        wing:
            "بال‌زدن",

        injection:
            "تزریقی",

        feed:
            "دان",

        oral:
            "خوراکی",

        other:
            "سایر"
    };


    return (
        map[route] ||
        route ||
        ""
    );
}


/* =========================================================
   STAGE
========================================================= */

function stageLabel(stage) {

    const map = {

        maternal:
            "مادری",

        pre_vaccination:
            "قبل واکسیناسیون",

        post_vaccination:
            "پس از واکسیناسیون",

        routine:
            "پایش روتین"
    };


    return (
        map[stage] ||
        stage ||
        ""
    );
}


/* =========================================================
   ESCAPE
========================================================= */

function escapeSafe(value) {

    if (
        typeof escapeHTML ===
        "function"
    ) {

        return escapeHTML(
            value
        );
    }


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
   STATUS
========================================================= */

function showStatus(
    message,
    type
) {

    const el =
        document.getElementById(
            "healthStatus"
        );


    if (!el) {
        return;
    }


    el.textContent =
        message;


    el.className =
        "health-status " +
        type;


    setTimeout(
        () => {

            el.className =
                "health-status";

        },
        5000
    );
}


/* =========================================================
   GLOBAL
========================================================= */

window.deleteRecord =
    deleteRecord;

window.printHealthHistory =
    printHealthHistory;
/* =========================================================
   HEALTH - SMALL PERSIAN CALENDAR
   فقط برای فیلدهای تاریخ صفحه Health
   ========================================================= */

(function () {
  function initHealthCalendar() {
    // اگر تقویم شمسی در پروژه وجود دارد، از همان استفاده می‌کنیم
    if (typeof jQuery === "undefined" || typeof jQuery.fn.persianDatepicker === "undefined") {
      console.warn("Persian datepicker library is not available.");
      return;
    }

    const selectors = [
      '#vaccinationDate',
      '#testDate',
      '#treatmentStartDate',
      '#treatmentEndDate',
      'input[name="vaccinationDate"]',
      'input[name="testDate"]',
      'input[name="treatmentStartDate"]',
      'input[name="treatmentEndDate"]'
    ];

    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (input) {

        // جلوگیری از دوباره فعال شدن
        if (input.dataset.healthCalendarReady === "1") return;

        input.dataset.healthCalendarReady = "1";

        $(input).persianDatepicker({
          format: 'YYYY/MM/DD',
          autoClose: true,
          initialValue: false,
          observer: true,
          calendarType: 'persian',
          calendar: {
            persian: {
              locale: 'fa',
              leapYearMode: 'algorithmic'
            }
          },
          toolbox: {
            calendarSwitch: false
          },
          navigator: {
            enabled: true,
            scroll: {
              enabled: false
            }
          },
          responsive: true
        });
      });
    });
  }

  // بعد از آماده شدن کامل صفحه
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHealthCalendar);
  } else {
    initHealthCalendar();
  }

  // اگر صفحه Health به صورت SPA باز و بسته می‌شود
  setTimeout(initHealthCalendar, 500);
  setTimeout(initHealthCalendar, 1500);
})();
