"use strict";

/* =========================================================
   ADINEH POULTRY HEALTH CENTER
   MORTALITY / DISEASE MODULE
   SUPABASE VERSION
========================================================= */

let healthUser = null;
let healthFlock = null;
let healthFarm = null;
let healthHouse = null;

let diseaseCatalog = [];
let clinicalSigns = [];

let healthEvents = [];
let selectedEventId = null;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initMortalityModule
);


async function initMortalityModule(){

    try{

        const sessionResult =
            await supabaseClient
                .auth
                .getSession();

        if(
            sessionResult.error ||
            !sessionResult.data.session
        ){

            location.href =
                "login.html?message=" +
                encodeURIComponent(
                    "ابتدا وارد سامانه شوید."
                );

            return;
        }

        healthUser =
            sessionResult.data.session.user;

        await loadCurrentFlock();

        setupTabs();

        setupEventForm();

        setupNecropsyForm();

        setDefaultDate();

        await loadCatalog();

        await loadEvents();

        renderDashboard();

        renderOverview();

    }
    catch(error){

        console.error(
            "Mortality module error:",
            error
        );

        showHealthStatus(
            "خطا در بارگذاری بخش سلامت: " +
            error.message,
            "error"
        );

    }

}


/* =========================================================
   CURRENT FLOCK
========================================================= */

async function loadCurrentFlock(){

    const selection =
        typeof getCurrentSelection ===
        "function"
            ? getCurrentSelection()
            : {};

    if(!selection.flockId){

        location.href =
            "flocks.html";

        return;
    }

    const result =
        await supabaseClient
            .from("flocks")
            .select("*")
            .eq(
                "id",
                selection.flockId
            )
            .maybeSingle();

    if(result.error)
        throw result.error;

    if(!result.data){

        location.href =
            "flocks.html";

        return;
    }

    healthFlock =
        result.data;


    if(healthFlock.farm_id){

        const farmResult =
            await supabaseClient
                .from("farms")
                .select("*")
                .eq(
                    "id",
                    healthFlock.farm_id
                )
                .maybeSingle();

        if(!farmResult.error)
            healthFarm =
                farmResult.data;
    }


    if(healthFlock.house_id){

        const houseResult =
            await supabaseClient
                .from("houses")
                .select("*")
                .eq(
                    "id",
                    healthFlock.house_id
                )
                .maybeSingle();

        if(!houseResult.error)
            healthHouse =
                houseResult.data;
    }


    const info = [

        healthFarm?.name,

        healthHouse?.name,

        healthFlock.flock_name,

        healthFlock.strain

    ]
    .filter(Boolean)
    .join(" | ");


    document.getElementById(
        "flockInfo"
    ).textContent =
        info || "گله انتخاب‌شده";


    const age =
        calculateFlockAge();


    if(age !== null){

        document.getElementById(
            "eventAge"
        ).value = age;

    }

}


/* =========================================================
   AGE
========================================================= */

function calculateFlockAge(){

    if(
        !healthFlock ||
        !healthFlock.placement_date
    )
        return null;

    const start =
        new Date(
            healthFlock.placement_date
        );

    const now =
        new Date();

    const diff =
        now.getTime() -
        start.getTime();

    return Math.max(
        0,
        Math.floor(
            diff /
            86400000
        )
    );

}


/* =========================================================
   TABS
========================================================= */

function setupTabs(){

    document
        .querySelectorAll(
            ".health-tab"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const tab =
                        button.dataset.tab;


                    document
                        .querySelectorAll(
                            ".health-tab"
                        )
                        .forEach(item =>
                            item.classList
                                .remove("active")
                        );


                    document
                        .querySelectorAll(
                            ".health-panel"
                        )
                        .forEach(panel =>
                            panel.classList
                                .remove("active")
                        );


                    button.classList
                        .add("active");


                    const panel =
                        document.getElementById(
                            "panel-" + tab
                        );


                    if(panel)
                        panel.classList
                            .add("active");

                }
            );

        });

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setDefaultDate(){

    const input =
        document.getElementById(
            "eventDate"
        );

    if(input){
        if(window.jalaliDate && typeof window.jalaliDate.todayJalali === "function")
            input.value = window.jalaliDate.todayJalali();
        else
            input.value = new Date().toISOString().slice(0,10);
    }

}


/* =========================================================
   CATALOGS
========================================================= */

async function loadCatalog(){

    const diseaseResult =
        await supabaseClient
            .from(
                "health_disease_catalog"
            )
            .select("*")
            .eq(
                "active",
                true
            )
            .order(
                "sort_order",
                {
                    ascending:true
                }
            );


    if(diseaseResult.error)
        throw diseaseResult.error;


    diseaseCatalog =
        diseaseResult.data || [];


    const signsResult =
        await supabaseClient
            .from(
                "health_clinical_signs"
            )
            .select("*")
            .eq(
                "active",
                true
            )
            .order(
                "category",
                {
                    ascending:true
                }
            )
            .order(
                "sort_order",
                {
                    ascending:true
                }
            );


    if(signsResult.error)
        throw signsResult.error;


    clinicalSigns =
        signsResult.data || [];


    populateDiseaseSelect(
        "suspectedDisease"
    );

    populateDiseaseSelect(
        "confirmedDisease"
    );

    renderClinicalSigns();

}


/* =========================================================
   DISEASE SELECT
========================================================= */

function populateDiseaseSelect(id){

    const select =
        document.getElementById(id);

    if(!select)
        return;


    const first =
        id === "confirmedDisease"
            ? "هنوز تشخیص قطعی ندارد"
            : "انتخاب نشده";


    select.innerHTML =
        `<option value="">${first}</option>`;


    diseaseCatalog
        .forEach(disease => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                disease.id;

            option.textContent =
                disease.name_fa;

            select.appendChild(
                option
            );

        });

}


/* =========================================================
   EVENT FORM
========================================================= */

function setupEventForm(){

    const form =
        document.getElementById(
            "healthEventForm"
        );


    form.addEventListener(
        "submit",
        saveHealthEvent
    );


    form.addEventListener(
        "reset",
        () => {

            setTimeout(
                setDefaultDate,
                0
            );

            setTimeout(
                () => {

                    const age =
                        calculateFlockAge();

                    if(age !== null){

                        document.getElementById(
                            "eventAge"
                        ).value =
                            age;

                    }

                },
                0
            );

        }
    );

}


/* =========================================================
   SAVE EVENT
========================================================= */

async function saveHealthEvent(
    event
){

    event.preventDefault();


    if(!healthFlock){

        showHealthStatus(
            "گله انتخاب نشده است.",
            "error"
        );

        return;
    }


    const mortality =
        numberValue(
            "mortalityCount"
        );

    const cull =
        numberValue(
            "cullCount"
        );

    const affected =
        numberValue(
            "affectedCount"
        );


    const payload = {

        owner_id:
            healthUser.id,

        farm_id:
            healthFlock.farm_id || null,

        house_id:
            healthFlock.house_id || null,

        flock_id:
            healthFlock.id,

        event_date:
            (window.jalaliDate && typeof window.jalaliDate.jalaliToISO === "function"
                ? (window.jalaliDate.jalaliToISO(valueOf("eventDate")) || valueOf("eventDate"))
                : valueOf("eventDate")),

        flock_age_days:
            numberValue(
                "eventAge"
            ),

        event_type:
            valueOf("eventType"),

        status:
            valueOf("eventStatus") ||
            "open",

        mortality_count:
            mortality,

        cull_count:
            cull,

        affected_count:
            affected,

        flock_population_snapshot:
            getFlockPopulation(),

        suspected_disease_id:
            valueOf(
                "suspectedDisease"
            ) || null,

        confirmed_disease_id:
            valueOf(
                "confirmedDisease"
            ) || null,

        severity:
            valueOf("severity") || null,

        diagnosis_status:
            valueOf(
                "diagnosisStatus"
            ) ||
            "not_confirmed",

        sudden_death:
            valueOf(
                "suddenDeath"
            ) === "true",

        notes:
            valueOf("eventNotes"),

        show_in_reports:
            checked(
                "showInReports"
            ),

        report_level:
            valueOf("reportLevel") ||
            "private",

        include_in_weekly_report:
            checked(
                "includeWeekly"
            ),

        include_in_management_analysis:
            checked(
                "includeAnalysis"
            ),

        created_by:
            healthUser.id

    };


    if(
        payload.show_in_reports === false
    ){

        payload.report_level =
            "private";

        payload.include_in_weekly_report =
            false;

    }


    const result =
        await supabaseClient
            .from("health_events")
            .insert(payload)
            .select("*")
            .single();


    if(result.error){

        console.error(
            result.error
        );

        showHealthStatus(
            "خطا در ثبت رخداد: " +
            result.error.message,
            "error"
        );

        return;
    }


    selectedEventId =
        result.data.id;


    await loadEvents();

    renderDashboard();

    renderOverview();

    renderReportPreview(
        result.data
    );


    showHealthStatus(
        "رخداد سلامت با موفقیت ثبت شد.",
        "success"
    );


    openTab("clinical");

}


/* =========================================================
   LOAD EVENTS
========================================================= */

async function loadEvents(){

    if(!healthFlock)
        return;


    const result =
        await supabaseClient
            .from("health_reportable_events")
            .select("*")
            .eq(
                "flock_id",
                healthFlock.id
            )
            .order(
                "event_date",
                {
                    ascending:false
                }
            )
            .limit(300);


    if(result.error){

        /*
          اگر view گزارش به علت RLS یا نسخه
          PostgreSQL مشکل داشت، از جدول اصلی
          می‌خوانیم.
        */

        const fallback =
            await supabaseClient
                .from("health_events")
                .select(`
                    *,
                    suspected_disease:
                        health_disease_catalog!suspected_disease_id(
                            id,
                            name_fa
                        ),
                    confirmed_disease:
                        health_disease_catalog!confirmed_disease_id(
                            id,
                            name_fa
                        )
                `)
                .eq(
                    "flock_id",
                    healthFlock.id
                )
                .order(
                    "event_date",
                    {
                        ascending:false
                    }
                )
                .limit(300);


        if(fallback.error)
            throw fallback.error;


        healthEvents =
            fallback.data || [];

    }
    else{

        healthEvents =
            result.data || [];

    }


    renderHistory();

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard(){

    const mortality =
        healthEvents.reduce(
            (sum,row) =>
                sum +
                Number(
                    row.mortality_count || 0
                ),
            0
        );


    const cull =
        healthEvents.reduce(
            (sum,row) =>
                sum +
                Number(
                    row.cull_count || 0
                ),
            0
        );


    const disease =
        healthEvents
            .filter(
                row =>
                    row.event_type ===
                    "disease" ||
                    row.event_type ===
                    "clinical_case"
            )
            .reduce(
                (sum,row) =>
                    sum +
                    Number(
                        row.affected_count || 0
                    ),
                0
            );


    const suspected =
        healthEvents
            .filter(
                row =>
                    row.event_type ===
                    "suspected_disease"
            )
            .length;


    setText(
        "statMortality",
        formatNumber(mortality)
    );

    setText(
        "statCull",
        formatNumber(cull)
    );

    setText(
        "statDisease",
        formatNumber(disease)
    );

    setText(
        "statSuspected",
        formatNumber(suspected)
    );

}


/* =========================================================
   OVERVIEW
========================================================= */

function renderOverview(){

    const container =
        document.getElementById(
            "healthOverview"
        );


    if(!container)
        return;


    if(!healthEvents.length){

        container.innerHTML = `
            <div class="empty-state">
                تاکنون رخداد سلامت برای این گله ثبت نشده است.
            </div>
        `;

        return;
    }


    const recent =
        healthEvents.slice(
            0,
            10
        );


    container.innerHTML =
        recent.map(
            row => {

                const disease =
                    row.confirmed_disease_name ||
                    row.suspected_disease_name ||
                    getNestedDisease(
                        row,
                        "confirmed_disease"
                    ) ||
                    getNestedDisease(
                        row,
                        "suspected_disease"
                    ) ||
                    "—";


                return `
                    <div
                        style="
                            padding:14px;
                            border-bottom:1px solid #e8ecea;
                        "
                    >

                        <strong>
                            ${escapeHtml(
                                typeLabel(
                                    row.event_type
                                )
                            )}
                        </strong>

                        <span class="badge">
                            ${escapeHtml(
                                row.event_date ||
                                "-"
                            )}
                        </span>

                        ${
                            disease !== "—"
                            ? `
                                <span class="badge">
                                    ${escapeHtml(
                                        disease
                                    )}
                                </span>
                            `
                            : ""
                        }

                        <div
                            style="
                                margin-top:8px;
                                color:#67736d;
                                font-size:13px;
                            "
                        >
                            تلفات:
                            ${formatNumber(
                                row.mortality_count
                            )}

                            |
                            حذفی:
                            ${formatNumber(
                                row.cull_count
                            )}

                            |
                            درگیر:
                            ${formatNumber(
                                row.affected_count
                            )}
                        </div>

                    </div>
                `;

            }
        )
        .join("");

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory(){

    const tbody =
        document.getElementById(
            "healthHistoryTable"
        );


    if(!tbody)
        return;


    if(!healthEvents.length){

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-state"
                >
                    هنوز رکوردی ثبت نشده است.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        healthEvents
            .map(
                row => {

                    const disease =
                        row.confirmed_disease_name ||
                        row.suspected_disease_name ||
                        getNestedDisease(
                            row,
                            "confirmed_disease"
                        ) ||
                        getNestedDisease(
                            row,
                            "suspected_disease"
                        ) ||
                        "—";


                    const report =
                        row.show_in_reports
                            ? `<span class="badge badge-success">گزارش</span>`
                            : `<span class="badge">خصوصی</span>`;


                    return `
                        <tr>

                            <td>
                                ${escapeHtml(
                                    row.event_date ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    typeLabel(
                                        row.event_type
                                    )
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    row.mortality_count
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    row.cull_count
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    row.affected_count
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    disease
                                )}
                            </td>

                            <td>
                                ${severityLabel(
                                    row.severity
                                )}
                            </td>

                            <td>
                                ${report}
                            </td>

                            <td>

                                <button
                                    class="btn btn-secondary"
                                    type="button"
                                    onclick="selectHealthEvent('${row.id}')"
                                >
                                    مشاهده
                                </button>

                                <button
                                    class="btn btn-danger"
                                    type="button"
                                    onclick="deleteHealthEvent('${row.id}')"
                                >
                                    حذف
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   SELECT EVENT
========================================================= */

window.selectHealthEvent =
async function(id){

    selectedEventId =
        id;


    const event =
        healthEvents.find(
            row =>
                row.id === id
        );


    if(!event)
        return;


    renderReportPreview(
        event
    );


    await loadNecropsy(
        id
    );


    openTab(
        "report"
    );

};


/* =========================================================
   REPORT PREVIEW
========================================================= */

function renderReportPreview(event){

    const container =
        document.getElementById(
            "reportPreview"
        );


    if(!container)
        return;


    const disease =
        event.confirmed_disease_name ||
        event.suspected_disease_name ||
        getNestedDisease(
            event,
            "confirmed_disease"
        ) ||
        getNestedDisease(
            event,
            "suspected_disease"
        ) ||
        "تشخیص ثبت نشده";


    container.innerHTML = `

        <div class="report-box">

            <h3>
                ${escapeHtml(
                    typeLabel(
                        event.event_type
                    )
                )}
            </h3>

            <p>
                تاریخ:
                <strong>
                    ${escapeHtml(
                        event.event_date || "-"
                    )}
                </strong>
            </p>

            <p>
                بیماری:
                <strong>
                    ${escapeHtml(
                        disease
                    )}
                </strong>
            </p>

            <p>
                تلفات:
                ${formatNumber(
                    event.mortality_count
                )}

                |
                حذفی:
                ${formatNumber(
                    event.cull_count
                )}

                |
                درگیر:
                ${formatNumber(
                    event.affected_count
                )}
            </p>

            <p>
                شدت:
                ${escapeHtml(
                    severityLabel(
                        event.severity
                    )
                )}
            </p>

            <p>
                وضعیت گزارش:
                ${
                    event.show_in_reports
                    ? "نمایش داده می‌شود"
                    : "خصوصی"
                }
            </p>

            <p>
                سطح:
                ${escapeHtml(
                    reportLevelLabel(
                        event.report_level
                    )
                )}
            </p>

            ${
                event.notes
                ? `
                    <hr>
                    <strong>
                        توضیحات
                    </strong>
                    <p>
                        ${escapeHtml(
                            event.notes
                        )}
                    </p>
                `
                : ""
            }

        </div>

    `;

}


/* =========================================================
   CLINICAL SIGNS
========================================================= */

function renderClinicalSigns(){

    const container =
        document.getElementById(
            "clinicalSignsContainer"
        );


    if(!container)
        return;


    if(!clinicalSigns.length)
        return;


    const groups = {};


    clinicalSigns.forEach(
        sign => {

            if(!groups[sign.category])
                groups[sign.category] = [];

            groups[sign.category]
                .push(sign);

        }
    );


    container.innerHTML =
        Object.entries(groups)
            .map(
                ([category,signs]) => `

                    <h3 class="sub-title">
                        ${escapeHtml(
                            category
                        )}
                    </h3>

                    <div class="check-grid">

                        ${
                            signs
                                .map(
                                    sign => `

                                        <label
                                            class="check-item"
                                        >

                                            <input
                                                type="checkbox"
                                                value="${sign.id}"
                                                data-sign-id="${sign.id}"
                                            >

                                            <span>
                                                ${escapeHtml(
                                                    sign.name_fa
                                                )}
                                            </span>

                                        </label>

                                    `
                                )
                                .join("")
                        }

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   NECROPSY
========================================================= */

function setupNecropsyForm(){

    const form =
        document.getElementById(
            "necropsyForm"
        );


    if(!form)
        return;


    form.addEventListener(
        "submit",
        saveNecropsy
    );

}


/* =========================================================
   SAVE NECROPSY
========================================================= */

async function saveNecropsy(
    event
){

    event.preventDefault();


    const eventId =
        document.getElementById(
            "necropsyEventId"
        ).value ||
        selectedEventId;


    if(!eventId){

        showHealthStatus(
            "ابتدا یک رخداد سلامت را انتخاب کنید.",
            "error"
        );

        return;
    }


    const payload = {

        event_id:
            eventId,

        necropsy_date:
            valueOf("eventDate") ||
            new Date()
                .toISOString()
                .slice(0,10),

        birds_examined:
            numberValue(
                "birdsExamined"
            ) || 1,

        body_condition:
            valueOf(
                "bodyCondition"
            ),

        dehydration:
            valueOf(
                "dehydration"
            ) === ""
                ? null
                : valueOf(
                    "dehydration"
                ) === "true",

        external_lesions:
            valueOf(
                "externalLesions"
            ),

        respiratory_findings:
            valueOf(
                "respiratoryFindings"
            ),

        digestive_findings:
            valueOf(
                "digestiveFindings"
            ),

        liver_findings:
            valueOf(
                "liverFindings"
            ),

        heart_findings:
            valueOf(
                "heartFindings"
            ),

        kidney_findings:
            valueOf(
                "kidneyFindings"
            ),

        bursa_findings:
            valueOf(
                "bursaFindings"
            ),

        intestinal_findings:
            valueOf(
                "intestinalFindings"
            ),

        other_findings:
            valueOf(
                "otherOrganFindings"
            ),

        gross_diagnosis:
            valueOf(
                "grossDiagnosis"
            ),

        veterinarian_notes:
            valueOf(
                "veterinarianNotes"
            ),

        created_by:
            healthUser.id

    };


    const result =
        await supabaseClient
            .from(
                "health_necropsies"
            )
            .insert(payload);


    if(result.error){

        showHealthStatus(
            "خطا در ثبت کالبدگشایی: " +
            result.error.message,
            "error"
        );

        return;
    }


    await saveSelectedClinicalSigns(
        eventId
    );


    showHealthStatus(
        "کالبدگشایی و علائم با موفقیت ثبت شد.",
        "success"
    );

}


/* =========================================================
   SAVE SIGNS
========================================================= */

async function saveSelectedClinicalSigns(
    eventId
){

    const selected =
        Array.from(
            document.querySelectorAll(
                "#clinicalSignsContainer input[data-sign-id]:checked"
            )
        )
        .map(
            input =>
                input.dataset.signId
        );


    if(!selected.length)
        return;


    await supabaseClient
        .from(
            "health_event_signs"
        )
        .delete()
        .eq(
            "event_id",
            eventId
        );


    const rows =
        selected.map(
            signId => ({

                event_id:
                    eventId,

                sign_id:
                    signId

            })
        );


    const result =
        await supabaseClient
            .from(
                "health_event_signs"
            )
            .insert(rows);


    if(result.error)
        throw result.error;

}


/* =========================================================
   LOAD NECROPSY
========================================================= */

async function loadNecropsy(
    eventId
){

    selectedEventId =
        eventId;


    document.getElementById(
        "necropsyEventId"
    ).value =
        eventId;


    const result =
        await supabaseClient
            .from(
                "health_necropsies"
            )
            .select("*")
            .eq(
                "event_id",
                eventId
            )
            .order(
                "created_at",
                {
                    ascending:false
                }
            )
            .limit(1)
            .maybeSingle();


    if(result.error)
        return;


    if(!result.data)
        return;


    const n =
        result.data;


    setValue(
        "birdsExamined",
        n.birds_examined
    );

    setValue(
        "bodyCondition",
        n.body_condition
    );

    setValue(
        "dehydration",
        n.dehydration === null
            ? ""
            : String(
                n.dehydration
            )
    );

    setValue(
        "externalLesions",
        n.external_lesions
    );

    setValue(
        "respiratoryFindings",
        n.respiratory_findings
    );

    setValue(
        "digestiveFindings",
        n.digestive_findings
    );

    setValue(
        "liverFindings",
        n.liver_findings
    );

    setValue(
        "heartFindings",
        n.heart_findings
    );

    setValue(
        "kidneyFindings",
        n.kidney_findings
    );

    setValue(
        "bursaFindings",
        n.bursa_findings
    );

    setValue(
        "intestinalFindings",
        n.intestinal_findings
    );

    setValue(
        "otherOrganFindings",
        n.other_findings
    );

    setValue(
        "grossDiagnosis",
        n.gross_diagnosis
    );

    setValue(
        "veterinarianNotes",
        n.veterinarian_notes
    );


    await loadClinicalSigns(
        eventId
    );

}


/* =========================================================
   LOAD SIGNS
========================================================= */

async function loadClinicalSigns(
    eventId
){

    const result =
        await supabaseClient
            .from(
                "health_event_signs"
            )
            .select(
                "sign_id"
            )
            .eq(
                "event_id",
                eventId
            );


    if(result.error)
        return;


    const ids =
        (result.data || [])
            .map(
                row =>
                    row.sign_id
            );


    document
        .querySelectorAll(
            "#clinicalSignsContainer input[data-sign-id]"
        )
        .forEach(
            input => {

                input.checked =
                    ids.includes(
                        input.dataset.signId
                    );

            }
        );

}


/* =========================================================
   DELETE
========================================================= */

window.deleteHealthEvent =
async function(id){

    const ok =
        confirm(
            "این پرونده و اطلاعات وابسته به آن حذف شود؟"
        );


    if(!ok)
        return;


    const result =
        await supabaseClient
            .from(
                "health_events"
            )
            .delete()
            .eq(
                "id",
                id
            );


    if(result.error){

        showHealthStatus(
            "خطا در حذف: " +
            result.error.message,
            "error"
        );

        return;
    }


    if(selectedEventId === id)
        selectedEventId = null;


    await loadEvents();

    renderDashboard();

    renderOverview();


    showHealthStatus(
        "پرونده حذف شد.",
        "success"
    );

};


/* =========================================================
   GET FLOCK POPULATION
========================================================= */

function getFlockPopulation(){

    if(!healthFlock)
        return null;


    const fields = [

        "current_birds",

        "current_population",

        "bird_count",

        "initial_birds",

        "initial_population",

        "placement_count"

    ];


    for(
        const field of fields
    ){

        const value =
            Number(
                healthFlock[field]
            );


        if(
            Number.isFinite(value) &&
            value > 0
        )
            return value;

    }


    return null;

}


/* =========================================================
   HELPERS
========================================================= */

function valueOf(id){

    const element =
        document.getElementById(id);

    return element
        ? element.value
        : "";

}


function setValue(
    id,
    value
){

    const element =
        document.getElementById(id);

    if(element)
        element.value =
            value ??
            "";

}


function numberValue(id){

    const value =
        Number(
            valueOf(id)
        );


    return Number.isFinite(value)
        ? Math.max(
            0,
            value
        )
        : 0;

}


function checked(id){

    const element =
        document.getElementById(id);

    return Boolean(
        element?.checked
    );

}


function setText(
    id,
    value
){

    const element =
        document.getElementById(id);

    if(element)
        element.textContent =
            value;

}


function formatNumber(
    value
){

    return Number(
        value || 0
    ).toLocaleString(
        "fa-IR"
    );

}


function escapeHtml(
    value
){

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


function typeLabel(type){

    const labels = {

        mortality:
            "تلفات",

        cull:
            "حذفی",

        disease:
            "بیماری",

        suspected_disease:
            "بیماری مشکوک",

        clinical_case:
            "مورد بالینی",

        environmental:
            "محیطی / مدیریتی",

        other:
            "سایر"

    };


    return labels[type] ||
        "سایر";

}


function severityLabel(
    value
){

    const labels = {

        mild:
            "خفیف",

        moderate:
            "متوسط",

        severe:
            "شدید"

    };


    return labels[value] ||
        "—";

}


function reportLevelLabel(
    value
){

    const labels = {

        private:
            "خصوصی",

        farm:
            "گزارش فارم",

        management:
            "گزارش مدیریتی"

    };


    return labels[value] ||
        "خصوصی";

}


function getNestedDisease(
    row,
    key
){

    if(
        row &&
        row[key] &&
        typeof row[key] ===
            "object"
    ){

        return row[key].name_fa ||
            null;

    }

    return null;

}


function openTab(
    tab
){

    const button =
        document.querySelector(
            `.health-tab[data-tab="${tab}"]`
        );


    if(button)
        button.click();

}


function showHealthStatus(
    message,
    type
){

    const box =
        document.getElementById(
            "healthStatus"
        );


    if(!box)
        return;


    box.textContent =
        message;


    box.className =
        "status-box show " +
        (
            type === "success"
                ? "status-success"
                : "status-error"
        );


    setTimeout(
        () => {

            box.classList
                .remove("show");

        },
        5000
    );

}


/* =========================================================
   PERSIAN DATEPICKER FOR MORTALITY EVENT DATE
========================================================= */
document.addEventListener("DOMContentLoaded", function(){
    const input=document.getElementById("eventDate");
    if(!input) return;
    if(window.jalaliDate && typeof window.jalaliDate.prepareDateFields === "function")
        window.jalaliDate.prepareDateFields();
    if(window.jQuery && typeof window.jQuery.fn.persianDatepicker === "function") {
        try {
            window.jQuery(input).persianDatepicker({
                format:"YYYY/MM/DD",
                initialValue:false,
                autoClose:true,
                observer:true,
                calendar:{persian:{locale:"fa"}}
            });
        } catch(e) { console.warn("Persian datepicker init failed",e); }
    }
});
