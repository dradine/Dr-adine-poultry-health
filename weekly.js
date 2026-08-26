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


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentUser = null;
let currentFlock = null;
let weeklyRecords = [];
let weightChart = null;
let editingRecordId = null;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeWeekly
);


async function initializeWeekly() {

    try {

        prepareNumericInputs();
initializeEvaluationDatePicker();

        const access =
            await getWeeklyUserAccess();

        if (!access.authenticated) {

            location.href =
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

            try {

                await supabaseClient
                    .auth
                    .signOut();

            }

            catch (error) {

                console.error(error);

            }

            location.href =
                "login.html";

            return;

        }

        currentUser =
            access.user;

        setToday();

        await loadCurrentFlock();

    }

    catch (error) {

        console.error(
            "Weekly initialization error:",
            error
        );

        alert(
            "خطا در راه‌اندازی ثبت هفتگی."
        );

    }

}


/* =========================================================
   AUTH
========================================================= */

async function getWeeklyUserAccess() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getUser();

        if (
            error ||
            !data ||
            !data.user
        ) {

            return {
                authenticated: false,
                allowed: false,
                user: null
            };

        }

        const user =
            data.user;

        let profile = null;

        try {

            const profileResult =
                await supabaseClient
                    .from("profiles")
                    .select("*")
                    .eq(
                        "id",
                        user.id
                    )
                    .maybeSingle();

            if (!profileResult.error) {

                profile =
                    profileResult.data;

            }

        }

        catch (profileError) {

            console.warn(
                "Profile check:",
                profileError
            );

        }

        if (!profile) {

            return {
                authenticated: true,
                allowed: true,
                user
            };

        }

        const status =
            String(
                profile.status || ""
            ).toLowerCase();

        const accessStatus =
            String(
                profile.access_status || ""
            ).toLowerCase();

        const role =
            String(
                profile.role || ""
            ).toLowerCase();

        const allowed =
            accessStatus === "approved" ||
            status === "active" ||
            (
                role === "owner" &&
                ![
                    "blocked",
                    "removed",
                    "suspended"
                ].includes(status)
            );

        return {

            authenticated: true,

            allowed,

            user

        };

    }

    catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        return {

            authenticated: false,

            allowed: false,

            user: null

        };

    }

}


/* =========================================================
   NUMBER INPUTS
========================================================= */

function prepareNumericInputs() {

    const numericIds = [

        "weekNumber",
        "liveBirds",
        "mortalityWeek",
        "feedTotal",
        "waterTotal",
        "feedPerBird",
        "waterPerBird"

    ];

    numericIds.forEach(
        id => {

            const input =
                document.getElementById(id);

            if (!input) {

                return;

            }

            input.type =
                "text";

            input.inputMode =
                "decimal";

            input.setAttribute(
                "autocomplete",
                "off"
            );

            attachNumberInputHandler(
                input
            );

        }
    );

    document
        .querySelectorAll(
            ".bird-weight"
        )
        .forEach(
            input => {

                prepareWeightInput(
                    input
                );

            }
        );

}


/* =========================================================
   WEIGHT INPUT
========================================================= */

function prepareWeightInput(
    input
) {

    if (!input) {

        return;

    }

    input.type =
        "text";

    input.inputMode =
        "decimal";

    input.setAttribute(
        "autocomplete",
        "off"
    );

    attachNumberInputHandler(
        input
    );

}


/* =========================================================
   NUMBER HANDLER
========================================================= */

function attachNumberInputHandler(
    input
) {

    if (!input) {

        return;

    }

    if (
        input.dataset.numberPrepared ===
        "true"
    ) {

        return;

    }

    input.dataset.numberPrepared =
        "true";

    input.addEventListener(
        "input",
        function () {

            this.value =
                normalizeNumberString(
                    this.value
                );

        }
    );

}


/* =========================================================
   NORMALIZE NUMBER
========================================================= */

function normalizeNumberString(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    let text =
        String(value);

    /* Persian digits */

    text =
        text.replace(
            /[۰-۹]/g,
            digit =>
                String(
                    digit.charCodeAt(0) -
                    1776
                )
        );

    /* Arabic digits */

    text =
        text.replace(
            /[٠-٩]/g,
            digit =>
                String(
                    digit.charCodeAt(0) -
                    1632
                )
        );

    /* Persian thousands */

    text =
        text.replaceAll(
            "٬",
            ""
        );

    /* English comma */

    text =
        text.replaceAll(
            ",",
            ""
        );

    /* Persian decimal */

    text =
        text.replaceAll(
            "٫",
            "."
        );

    /*
     * Arabic comma
     * only treated as decimal separator
     */

    text =
        text.replaceAll(
            "،",
            "."
        );

    /* Remove invalid characters */

    text =
        text.replace(
            /[^0-9.\-]/g,
            ""
        );

    /* Only one decimal point */

    const firstDot =
        text.indexOf(".");

    if (
        firstDot !== -1
    ) {

        text =
            text.substring(
                0,
                firstDot + 1
            ) +

            text
                .substring(
                    firstDot + 1
                )
                .replace(
                    /\./g,
                    ""
                );

    }

    /* Minus only at beginning */

    if (
        text.includes("-")
    ) {

        text =
            (
                text.startsWith("-")
                    ? "-"
                    : ""
            ) +

            text.replace(
                /-/g,
                ""
            );

    }

    return text;

}




/* =========================================================
   OPEN CURRENT REPORT
   ========================================================= */
function openCurrentReport() {
    if (currentFlock && currentFlock.id) {
        window.location.href =
            "reports.html?flockId=" +
            encodeURIComponent(currentFlock.id);
        return;
    }

    const selection =
        typeof getCurrentSelection === "function"
            ? getCurrentSelection()
            : readCurrentSelectionFallback();

    if (selection?.flockId) {
        window.location.href =
            "reports.html?flockId=" +
            encodeURIComponent(selection.flockId);
        return;
    }

    window.location.href = "reports.html";
}


/* =========================================================
   CURRENT FLOCK
========================================================= */

async function loadCurrentFlock() {

    const selection =
        typeof getCurrentSelection ===
        "function"

            ? getCurrentSelection()

            : readCurrentSelectionFallback();


    const container =
        document.getElementById(
            "currentFlock"
        );


    if (!container) {

        return;

    }


    if (!selection.flockId) {

        container.innerHTML = `

            <p>
                ابتدا یک گله انتخاب کنید.
            </p>

            <button
                class="btn btn-primary"
                type="button"
                onclick="location.href='flocks.html'"
            >
                انتخاب گله
            </button>

        `;

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("flocks")
            .select(`
                *,
                farms (
                    name
                ),
                houses (
                    name
                )
            `)
            .eq(
                "id",
                selection.flockId
            )
            .maybeSingle();


    if (
        error ||
        !data
    ) {

        console.error(
            "Flock loading error:",
            error
        );

        container.innerHTML = `

            <p>
                گله انتخاب‌شده پیدا نشد.
            </p>

            <button
                class="btn btn-primary"
                type="button"
                onclick="location.href='flocks.html'"
            >
                انتخاب گله
            </button>

        `;

        return;

    }


    currentFlock =
        data;

    window.currentFlockForSpecialized =
        currentFlock;

    if (typeof renderWeeklySpecializedFields === "function") {
        renderWeeklySpecializedFields(currentFlock);
    }


    container.innerHTML = `

        <div class="farm-summary">

            <strong>
                🐔
                ${escapeHTML(
                    data.flock_name ||
                    data.flockName ||
                    "-"
                )}
            </strong>

            <br>

            فارم:
            ${escapeHTML(
                data.farms?.name || "-"
            )}

            <br>

            سالن:
            ${escapeHTML(
                data.houses?.name || "-"
            )}

            <br>

            نوع:
            ${getProductionLabel(
                data.production_type ||
                data.productionType
            )}

            <br>

            سویه:
            ${escapeHTML(
                data.genetics ||
                "-"
            )}

        </div>

    `;


    await loadHistory();

}


/* =========================================================
   CURRENT SELECTION FALLBACK
========================================================= */

function readCurrentSelectionFallback() {

    try {

        const key =
            "adine_poultry_current_selection";

        const raw =
            localStorage.getItem(
                key
            );

        if (!raw) {

            return {};

        }

        return JSON.parse(
            raw
        );

    }

    catch (error) {

        console.error(
            error
        );

        return {};

    }

}

/* =========================================================
   EVALUATION DATE CALENDAR
========================================================= */

function initializeEvaluationDatePicker() {

    const input =
        document.getElementById(
            "evaluationDate"
        );

    if (
        !input ||
        typeof window.jQuery === "undefined" ||
        typeof window.jQuery.fn.persianDatepicker !== "function"
    ) {
        return;
    }

    const $input =
        window.jQuery(input);

    if (
        $input.data("persian-datepicker-initialized")
    ) {
        return;
    }

    $input.persianDatepicker({
        format: "YYYY/MM/DD",
        autoClose: true,
        initialValue: false,
        observer: true,
        calendarType: "persian",
        toolbox: {
            calendarSwitch: {
                enabled: false
            }
        }
    });

    $input.data(
        "persian-datepicker-initialized",
        true
    );

}
/* =========================================================
   TODAY SHAMSI
========================================================= */

function setToday() {

    const input = document.getElementById("evaluationDate");
    if (!input) return;

    if (!window.AdineDateSystem || typeof window.AdineDateSystem.todayJalali !== "function") {
        throw new Error("Central Date Engine is required before weekly.js");
    }

    input.value = window.AdineDateSystem.todayJalali();
}





















/* =========================================================
   ADD WEIGHT
========================================================= */

function addWeightInput(
    value = ""
) {

    const container =
        document.getElementById(
            "weightsContainer"
        );


    if (!container) {

        return;

    }


    const index =
        container.children.length + 1;


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "weight-input";


    wrapper.innerHTML = `

        <label>
            ${convertDigitsToPersian(index)}
        </label>

        <input
            type="text"
            inputmode="decimal"
            class="bird-weight"
            placeholder="گرم"
            autocomplete="off"
        >

    `;


    container.appendChild(
        wrapper
    );


    const input =
        wrapper.querySelector(
            ".bird-weight"
        );


    if (input) {

        input.value =
            normalizeNumberString(
                value
            );

        prepareWeightInput(
            input
        );

    }

}


/* =========================================================
   ADD 20 WEIGHTS
========================================================= */

function addTwentyWeights() {

    for (
        let i = 0;
        i < 20;
        i++
    ) {

        addWeightInput();

    }

}


/* =========================================================
   ADD 100 WEIGHTS — RECOMMENDED WEEKLY SAMPLE
========================================================= */

function addHundredWeights() {
    for (let i = 0; i < 100; i++) addWeightInput();
}


/* =========================================================
   ADD 100 WEIGHTS — RECOMMENDED WEEKLY SAMPLE
========================================================= */

function addHundredWeights() {

    for (let i = 0; i < 100; i++) {
        addWeightInput();
    }

}


/* =========================================================
   CLEAR WEIGHTS
========================================================= */

function clearWeights() {

    const container =
        document.getElementById(
            "weightsContainer"
        );


    if (container) {

        container.innerHTML =
            "";

    }


    const resultsCard =
        document.getElementById(
            "resultsCard"
        );


    if (resultsCard) {

        resultsCard.style.display =
            "none";

    }


    if (weightChart) {

        weightChart.destroy();

        weightChart =
            null;

    }

}


/* =========================================================
   GET WEIGHTS
========================================================= */

function getWeights() {

    const inputs =
        document.querySelectorAll(
            ".bird-weight"
        );


    const weights = [];


    inputs.forEach(
        input => {

            const normalized =
                normalizeNumberString(
                    input.value
                );


            input.value =
                normalized;


            if (
                normalized === ""
            ) {

                return;

            }


            const value =
                Number(
                    normalized
                );


            if (
                Number.isFinite(value) &&
                value > 0
            ) {

                weights.push(
                    value
                );

            }

        }
    );


    return weights;

}


/* =========================================================
   CALCULATE
========================================================= */

function getDirectAverageWeight(){
    const el=document.getElementById("averageWeightDirect");
    if(!el) return null;
    const raw=String(el.value||"").replace(/,/g,"").replace(/٬/g,"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d));
    const n=Number(raw);
    return Number.isFinite(n)&&n>0?n:null;
}

function buildDirectWeightStatistics(mean){
    return {count:0,mean:Number(mean),sd:null,cv:null,uniformity10:null,uniformity15:null,min:null,max:null,lower10:null,upper10:null,lower15:null,upper15:null,samplingStatus:"میانگین مستقیم ثبت شد؛ برای CV و یکنواختی نمونه وزن لازم است"};
}

function calculateWeekly() {

    const weights =
        getWeights();


    if (weights.length < 2 && getDirectAverageWeight()===null) {
        alert("یا وزن متوسط گله را وارد کنید، یا حداقل دو وزن نمونه‌ای ثبت کنید.");
        return;
    }

    const result = weights.length >= 2
        ? calculateWeightStatistics(weights)
        : buildDirectWeightStatistics(getDirectAverageWeight());


    renderResults(
        result
    );


    drawWeightChart(
        weights,
        result
    );


    const resultsCard =
        document.getElementById(
            "resultsCard"
        );


    if (resultsCard) {

        resultsCard.style.display =
            "block";

    }

}


/* =========================================================
   WEIGHT STATISTICS
========================================================= */

function calculateWeightStatistics(weights) {

    // پاک سازی و تبدیل صحیح وزن‌ها
    const cleanWeights = (Array.isArray(weights) ? weights : [])
        .map(value => {

            if (value === null || value === undefined) {
                return NaN;
            }

            let text = String(value)
                .trim()
                .replace(/,/g, "")
                .replace(/٬/g, "")
                .replace(/[۰-۹]/g, function (d) {
                    return "۰۱۲۳۴۵۶۷۸۹".indexOf(d);
                })
                .replace(/[٠-٩]/g, function (d) {
                    return "٠١٢٣٤٥٦٧٨٩".indexOf(d);
                });

            return Number(text);

        })
        .filter(value =>
            Number.isFinite(value) &&
            value > 0
        );


    const count = cleanWeights.length;


    if (count === 0) {

        return {
            count: 0,
            mean: 0,
            sd: 0,
            cv: 0,
            uniformity10: 0,
            uniformity15: 0,
            min: 0,
            max: 0,
            lower10: 0,
            upper10: 0,
            lower15: 0,
            upper15: 0
        };

    }



    // مرتب سازی برای کنترل بهتر داده‌ها
    const sorted =
        [...cleanWeights]
        .sort((a,b)=>a-b);



    // میانگین وزن
    const mean =
        sorted.reduce(
            (sum,value)=>sum + value,
            0
        ) / count;



    // چون وزن‌کشی معمولاً نمونه‌ای از گله است، انحراف معیار نمونه‌ای با n-1 محاسبه می‌شود.
    const squaredDeviation =
        sorted.reduce(
            (sum, value) => sum + Math.pow(value - mean, 2),
            0
        );

    const variance =
        count > 1
            ? squaredDeviation / (count - 1)
            : null;

    const sd =
        variance === null
            ? null
            : Math.sqrt(variance);



    // ضریب تغییرات
    const cv =
        sd !== null && mean > 0
            ? (sd / mean) * 100
            : null;

    const recommendedSampleSize =
        cv === null
            ? 100
            : cv <= 8
                ? 65
                : cv <= 10
                    ? 100
                    : cv <= 12
                        ? 140
                        : 180;

    const samplingStatus =
        count < 30
            ? "ضعیف — نمونه برای تصمیم‌گیری دقیق کم است"
            : count < recommendedSampleSize
                ? "قابل استفاده با احتیاط — نمونه کمتر از مقدار پیشنهادی است"
                : "مناسب — حجم نمونه برای پایش هفتگی قابل اتکاتر است";

    const tCritical95 = {
        1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
        6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
        11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
        16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
        21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
        26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042
    };

    const df = Math.max(count - 1, 1);
    const t = df <= 30 ? tCritical95[df] : 1.96;
    const standardError =
        sd !== null && count > 1
            ? sd / Math.sqrt(count)
            : null;
    const meanCI95 =
        standardError !== null
            ? { lower: mean - t * standardError, upper: mean + t * standardError }
            : null;



    /*
        محاسبه یکنواختی استاندارد مرغداری

        10 درصد:
        میانگین ± 10%

        15 درصد:
        میانگین ± 15%
    */


    const lower10 =
        mean * 0.90;


    const upper10 =
        mean * 1.10;


    const lower15 =
        mean * 0.85;


    const upper15 =
        mean * 1.15;



    const uniform10Count =
        sorted.filter(weight => {

            return (
                weight >= lower10 &&
                weight <= upper10
            );

        }).length;



    const uniform15Count =
        sorted.filter(weight => {

            return (
                weight >= lower15 &&
                weight <= upper15
            );

        }).length;



    return {

        count,

        mean:
            Number(mean.toFixed(2)),


        sd:
            sd === null ? null : Number(sd.toFixed(2)),


        cv:
            cv === null ? null : Number(cv.toFixed(2)),

        recommendedSampleSize,

        samplingStatus,

        meanCI95:
            meanCI95
                ? {
                    lower: Number(meanCI95.lower.toFixed(2)),
                    upper: Number(meanCI95.upper.toFixed(2))
                }
                : null,


        uniformity10:
            Number(
                ((uniform10Count / count) * 100)
                .toFixed(2)
            ),


        uniformity15:
            Number(
                ((uniform15Count / count) * 100)
                .toFixed(2)
            ),


        min:
            sorted[0],


        max:
            sorted[count-1],


        lower10:
            Number(lower10.toFixed(2)),


        upper10:
            Number(upper10.toFixed(2)),


        lower15:
            Number(lower15.toFixed(2)),


        upper15:
            Number(upper15.toFixed(2))

    };

}
/* =========================================================
   RESULTS
========================================================= */

function renderResults(
    result
) {

    const container =
        document.getElementById(
            "results"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        ${metric(
            "میانگین وزن",
            formatNumber(
                result.mean,
                1
            ) +
            " گرم"
        )}

        ${metric(
            "SD",
            formatNumber(
                result.sd,
                1
            ) +
            " گرم"
        )}

        ${metric(
            "CV",
            result.cv === null
                ? "قابل محاسبه نیست"
                : formatNumber(result.cv, 2) + "%"
        )}

        ${metric(
            "کیفیت نمونه",
            `${result.count} پرنده — ${result.samplingStatus || "-"}`
        )}

        ${metric(
            "یکنواختی ±10%",
            formatNumber(
                result.uniformity10,
                1
            ) +
            "%"
        )}

        ${metric(
            "یکنواختی ±15%",
            formatNumber(
                result.uniformity15,
                1
            ) +
            "%"
        )}

        ${metric(
            "حداقل وزن",
            formatNumber(
                result.min,
                1
            ) +
            " گرم"
        )}

        ${metric(
            "حداکثر وزن",
            formatNumber(
                result.max,
                1
            ) +
            " گرم"
        )}

    `;

}


/* =========================================================
   METRIC
========================================================= */

function metric(
    title,
    value
) {

    return `

        <div class="metric-card">

            <div class="metric-title">
                ${title}
            </div>

            <div class="metric-value">
                ${value}
            </div>

        </div>

    `;

}


/* =========================================================
   CHART
========================================================= */

function drawWeightChart(
    weights,
    result
) {

    if (
        typeof Chart ===
        "undefined"
    ) {

        return;

    }


    const canvas =
        document.getElementById(
            "weightChart"
        );


    if (!canvas) {

        return;

    }


    if (weightChart) {

        weightChart.destroy();

        weightChart =
            null;

    }


    const labels =
        weights.map(
            (
                _,
                index
            ) =>
                index + 1
        );


    weightChart =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels:
                        labels,

                    datasets: [

                        {

                            label:
                                "وزن پرندگان",

                            data:
                                weights,

                            tension:
                                0.25

                        },

                        {

                            label:
                                "میانگین",

                            data:
                                weights.map(
                                    () =>
                                        result.mean
                                ),

                            borderDash:
                                [
                                    6,
                                    6
                                ],

                            pointRadius:
                                0

                        },

                        {

                            label:
                                "حد پایین ±10%",

                            data:
                                weights.map(
                                    () =>
                                        result.lower10
                                ),

                            borderDash:
                                [
                                    4,
                                    4
                                ],

                            pointRadius:
                                0

                        },

                        {

                            label:
                                "حد بالا ±10%",

                            data:
                                weights.map(
                                    () =>
                                        result.upper10
                                ),

                            borderDash:
                                [
                                    4,
                                    4
                                ],

                            pointRadius:
                                0

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false

                }

            }

        );

}


/* =========================================================
   EDIT RECORD
========================================================= */

function editWeeklyRecord(
    recordId
) {

    const record =
        weeklyRecords.find(
            item =>
                String(item.id) ===
                String(recordId)
        );


    if (!record) {

        alert(
            "رکورد موردنظر پیدا نشد."
        );

        return;

    }


    editingRecordId =
        record.id;


    setField(
        "weekNumber",
        record.week_number
    );


    setField(
        "liveBirds",
        record.live_birds
    );


    setField(
        "mortalityWeek",
        record.mortality_count
    );


    setField(
        "feedTotal",
        record.feed_total_kg
    );


    setField(
        "waterTotal",
        record.water_total_liter
    );


    setField(
        "feedPerBird",
        record.feed_per_bird_g
    );


    setField(
        "waterPerBird",
        record.water_per_bird_ml
    );


    setDateField(
        "evaluationDate",
        convertDatabaseDateToShamsi(
            record.evaluation_date
        )
    );


    setTextField(
        "weeklyNotes",
        record.notes
    );

    if (typeof loadWeeklySpecializedMetrics === "function") {
        loadWeeklySpecializedMetrics(record.production_metrics || record.productionMetrics || {});
    }


    const weightsContainer =
        document.getElementById(
            "weightsContainer"
        );


    if (weightsContainer) {

        weightsContainer.innerHTML =
            "";

    }


    let savedWeights =
        record.weights;


    if (
        typeof savedWeights ===
        "string"
    ) {

        try {

            savedWeights =
                JSON.parse(
                    savedWeights
                );

        }

        catch (error) {

            console.error(
                error
            );

            savedWeights =
                [];

        }

    }


    if (
        Array.isArray(
            savedWeights
        )
    ) {

        savedWeights.forEach(
            weight => {

                if (
                    Number(weight) > 0
                ) {

                    addWeightInput(
                        weight
                    );

                }

            }
        );

    }


    if (
        !weightsContainer ||
        weightsContainer.children.length === 0
    ) {

        addWeightInput();

    }


    if (
        getWeights().length >= 2
    ) {

        calculateWeekly();

    }


    showEditMode();


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "smooth"

        }
    );

}


/* =========================================================
   EDIT MODE
========================================================= */

function showEditMode() {

    const saveButton =
        document.querySelector(
            'button[onclick="saveWeeklyRecord()"]'
        );


    if (saveButton) {

        saveButton.disabled =
            false;

        saveButton.textContent =
            "ذخیره تغییرات";

    }


    let editNotice =
        document.getElementById(
            "editModeNotice"
        );


    if (!editNotice) {

        editNotice =
            document.createElement(
                "div"
            );


        editNotice.id =
            "editModeNotice";


        editNotice.style.cssText = `
            margin-bottom:15px;
            padding:12px;
            border-radius:10px;
            background:#fff3cd;
            border:1px solid #ffe69c;
            color:#664d03;
            font-weight:600;
        `;


        editNotice.innerHTML = `

            ✏️ در حال ویرایش گزارش هفته

            <span
                id="editingWeekText"
            ></span>

            <button
                type="button"
                class="btn btn-secondary"
                style="margin-right:10px;"
                onclick="cancelEditWeeklyRecord()"
            >
                لغو ویرایش
            </button>

        `;


        const firstCard =
            document.querySelector(
                ".card"
            );


        if (firstCard) {

            firstCard.parentNode.insertBefore(
                editNotice,
                firstCard
            );

        }

    }


    const week =
        getValue(
            "weekNumber"
        );


    const weekText =
        document.getElementById(
            "editingWeekText"
        );


    if (weekText) {

        weekText.textContent =
            week
                ? ` — هفته ${convertDigitsToPersian(week)}`
                : "";

    }

}


/* =========================================================
   CANCEL EDIT
========================================================= */

function cancelEditWeeklyRecord() {

    clearWeeklyForm();

}


/* =========================================================
   CLEAR FORM
========================================================= */

function clearWeeklyForm() {
    const directWeight=document.getElementById("averageWeightDirect");
    if(directWeight) directWeight.value="";


    editingRecordId =
        null;


    setToday();


    const fields = [

        "weekNumber",
        "liveBirds",
        "mortalityWeek",
        "feedTotal",
        "waterTotal",
        "feedPerBird",
        "waterPerBird"

    ];


    fields.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );

            if (element) {

                element.value =
                    "";

            }

        }
    );


    setTextField(
        "weeklyNotes",
        ""
    );

    if (typeof clearWeeklySpecializedMetrics === "function") {
        clearWeeklySpecializedMetrics();
    }


    const weightsContainer =
        document.getElementById(
            "weightsContainer"
        );


    if (weightsContainer) {

        weightsContainer.innerHTML =
            "";

    }


    const resultsCard =
        document.getElementById(
            "resultsCard"
        );


    if (resultsCard) {

        resultsCard.style.display =
            "none";

    }


    if (weightChart) {

        weightChart.destroy();

        weightChart =
            null;

    }


    const saveButton =
        document.querySelector(
            'button[onclick="saveWeeklyRecord()"]'
        );


    if (saveButton) {

        saveButton.disabled =
            false;

        saveButton.textContent =
            "ذخیره گزارش هفتگی";

    }


    const notice =
        document.getElementById(
            "editModeNotice"
        );


    if (notice) {

        notice.remove();

    }

}


/* =========================================================
   SET FIELD
========================================================= */

function setField(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        element.value =
            "";

        return;

    }


    element.value =
        normalizeNumberString(
            value
        );

}


/* =========================================================
   DATE FIELD
========================================================= */

function setDateField(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.value =
        value || "";

}


/* =========================================================
   TEXT FIELD
========================================================= */

function setTextField(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.value =
        value === null ||
        value === undefined
            ? ""
            : String(value);

}


/* =========================================================
   SHAMSI → GREGORIAN
========================================================= */

function getGregorianDateForSupabase(
    value
) {

    if (!value) {

        return null;

    }


    let text =
        String(value)
            .trim();


    text =
        normalizeDateDigits(
            text
        );


    text =
        text.replace(
            /[-.]/g,
            "/"
        );


    const parts =
        text.split("/");


    if (
        parts.length !== 3
    ) {

        throw new Error(
            "فرمت تاریخ صحیح نیست. مثال: ۱۴۰۵/۰۵/۲۹"
        );

    }


    const jy =
        Number(parts[0]);


    const jm =
        Number(parts[1]);


    const jd =
        Number(parts[2]);


    if (
        !Number.isInteger(jy) ||
        !Number.isInteger(jm) ||
        !Number.isInteger(jd)
    ) {

        throw new Error(
            "تاریخ شمسی واردشده صحیح نیست."
        );

    }


    if (
        jy < 1200 ||
        jy > 1600
    ) {

        throw new Error(
            "سال تاریخ شمسی صحیح نیست."
        );

    }


    if (
        jm < 1 ||
        jm > 12
    ) {

        throw new Error(
            "ماه تاریخ شمسی صحیح نیست."
        );

    }


    const maxDay =
        jm <= 6
            ? 31
            : jm <= 11
                ? 30
                : isLeapJalaliYear(jy)
                    ? 30
                    : 29;


    if (
        jd < 1 ||
        jd > maxDay
    ) {

        throw new Error(
            "روز تاریخ شمسی صحیح نیست."
        );

    }


    const gregorian =
        jalaliToGregorian(
            jy,
            jm,
            jd
        );


    return (
        String(
            gregorian[0]
        ).padStart(
            4,
            "0"
        ) +
        "-" +
        String(
            gregorian[1]
        ).padStart(
            2,
            "0"
        ) +
        "-" +
        String(
            gregorian[2]
        ).padStart(
            2,
            "0"
        )
    );

}


/* =========================================================
   DATABASE DATE → SHAMSI
========================================================= */

function convertDatabaseDateToShamsi(
    date
) {

    if (!date) {

        return "";

    }


    const text =
        String(date)
            .trim();


    if (
        text.includes("/")
    ) {

        return convertDigitsToPersian(
            text
        );

    }


    const parts =
        text
            .substring(
                0,
                10
            )
            .split("-");


    if (
        parts.length !== 3
    ) {

        return convertDigitsToPersian(
            text
        );

    }


    const gy =
        Number(parts[0]);


    const gm =
        Number(parts[1]);


    const gd =
        Number(parts[2]);


    if (
        !Number.isInteger(gy) ||
        !Number.isInteger(gm) ||
        !Number.isInteger(gd)
    ) {

        return convertDigitsToPersian(
            text
        );

    }


    const jalali =
        gregorianToJalali(
            gy,
            gm,
            gd
        );


    return convertDigitsToPersian(
        `${jalali[0]}/${padNumber(jalali[1], 2)}/${padNumber(jalali[2], 2)}`
    );

}


/* =========================================================
   SAVE WEEKLY RECORD
========================================================= */

async function saveWeeklyRecord() {

    const saveButton =
        document.querySelector(
            'button[onclick="saveWeeklyRecord()"]'
        );


    try {

        if (!currentUser) {

            alert(
                "کاربر وارد نشده است."
            );

            return;

        }


        if (!currentFlock) {

            alert(
                "ابتدا گله را انتخاب کنید."
            );

            return;

        }

        if (String(currentFlock.status || "active").toLowerCase() === "closed") {
            alert("این دوره بسته شده است و امکان ثبت یا ویرایش وجود ندارد.");
            return;
        }


        const week =
            getNumber(
                "weekNumber"
            );


        if (
            !week ||
            week < 1
        ) {

            alert(
                "شماره هفته را وارد کنید."
            );

            return;

        }


        const weights =
            getWeights();


        if (weights.length < 2 && getDirectAverageWeight()===null) {
            alert("یا وزن متوسط گله را وارد کنید، یا حداقل دو وزن نمونه‌ای ثبت کنید.");
            return;
        }

        const stats = weights.length >= 2
            ? calculateWeightStatistics(weights)
            : buildDirectWeightStatistics(getDirectAverageWeight());


        const liveBirds =
            getNumber(
                "liveBirds"
            );


        const mortality =
            getNumber(
                "mortalityWeek"
            );


        const feedTotal =
            getNumber(
                "feedTotal"
            );


        const waterTotal =
            getNumber(
                "waterTotal"
            );


        const feedPerBird =
            getNumber(
                "feedPerBird"
            );


        const waterPerBird =
            getNumber(
                "waterPerBird"
            );


        const evaluationDate =
            getGregorianDateForSupabase(
                getValue(
                    "evaluationDate"
                )
            );


        const notes =
            getValue(
                "weeklyNotes"
            );

        let productionMetrics =
            typeof getWeeklySpecializedMetrics === "function"
                ? getWeeklySpecializedMetrics()
                : {};

        if (liveBirds !== null && liveBirds !== undefined) {
            productionMetrics.live_birds = liveBirds;
        }

        if (Number.isFinite(Number(stats.mean))) {
            productionMetrics.measured_weight_g = stats.mean;
        }

        // Mirror core weekly totals into specialized metrics so the
        // type-specific report can use one coherent dataset.
        if (feedTotal !== null && feedTotal > 0) {
            productionMetrics.weekly_feed_total_kg = feedTotal;
        }
        if (waterTotal !== null && waterTotal >= 0) {
            productionMetrics.weekly_water_total_liter = waterTotal;
        }
        if (feedTotal !== null && feedTotal > 0 && waterTotal !== null && waterTotal >= 0) {
            productionMetrics.water_feed_ratio = Number((waterTotal / feedTotal).toFixed(3));
        }
        if (mortality !== null && liveBirds !== null && liveBirds > 0) {
            productionMetrics.weekly_mortality_pct = Number((mortality / (liveBirds + mortality) * 100).toFixed(3));
        }

        const existingForCumulative =
            weeklyRecords
                .filter(item => String(item.id) !== String(editingRecordId || ""));

        if (typeof calculateWeeklySpecializedDerived === "function") {
            productionMetrics = calculateWeeklySpecializedDerived(
                productionMetrics,
                currentFlock,
                existingForCumulative
            );
        }

        const specializedValidation =
            typeof validateSpecializedMetrics === "function"
                ? validateSpecializedMetrics(
                    currentFlock.production_type || currentFlock.productionType,
                    productionMetrics
                )
                : null;

        if (specializedValidation) {
            alert(specializedValidation);
            return;
        }

        const ageDays =
            currentFlock.placement_date || currentFlock.placementDate
                ? calculateAgeDays(
                    currentFlock.placement_date || currentFlock.placementDate,
                    evaluationDate || todayISO()
                )
                : null;

        const editingRecord =
            editingRecordId

                ? weeklyRecords.find(
                    item =>
                        String(item.id) ===
                        String(editingRecordId)
                )

                : null;


        const recordId =
            editingRecord
                ? editingRecord.id
                : null;


        const performanceType = currentFlock.production_type || currentFlock.productionType || "broiler";
        const performancePrevious = [...existingForCumulative].sort((a,b) => Number(a.age_days || 0) - Number(b.age_days || 0)).at(-1) || null;
        const performanceWeeklyFcr = window.AdinePerformance
            ? window.AdinePerformance.broilerWeeklyFCR({
                feedKg: feedTotal,
                openBirds: performancePrevious?.live_birds,
                openWeight: performancePrevious?.average_weight_g,
                closeBirds: liveBirds,
                closeWeight: stats.mean
              })
            : null;
        const performanceLayerFcr = window.AdinePerformance
            ? window.AdinePerformance.layerWeekly(feedTotal, productionMetrics?.egg_mass_kg)
            : null;
        const performanceWeeklyFcrResolved = ["layer","تخمگذار","تخم‌گذار","breeder","مادر","مرغ مادر"].includes(String(performanceType).toLowerCase())
            ? performanceLayerFcr
            : performanceWeeklyFcr;

        const performanceMortalityCorrectedFcr = window.AdinePerformance
            ? window.AdinePerformance.mortalityCorrectedFCR({
                feedKg: feedTotal,
                openBirds: performancePrevious?.live_birds,
                openWeight: performancePrevious?.average_weight_g,
                closeBirds: liveBirds,
                closeWeight: stats.mean,
                deaths: mortality,
                deadAverageWeightG: productionMetrics?.dead_bird_avg_weight_g
              })
            : null;
        if (performanceMortalityCorrectedFcr != null) {
            productionMetrics.mortality_corrected_fcr = performanceMortalityCorrectedFcr;
        }
        const performanceRowsWithCurrent = [
            ...existingForCumulative,
            {
                id: recordId,
                age_days: ageDays,
                feed_total_kg: feedTotal,
                average_weight_g: stats.mean,
                live_birds: liveBirds,
                production_metrics: productionMetrics
            }
        ];
        const performanceCumulativeFcr = window.AdinePerformance
            ? window.AdinePerformance.typeOf(currentFlock) === "layer" || window.AdinePerformance.typeOf(currentFlock) === "breeder"
                ? window.AdinePerformance.layerCumulative(performanceRowsWithCurrent)
                : window.AdinePerformance.broilerCumulativeFCR(performanceRowsWithCurrent, currentFlock)
            : null;
        productionMetrics.performance_version = window.AdinePerformance?.version || null;
        productionMetrics.weekly_fcr_engine = performanceWeeklyFcrResolved;
        productionMetrics.cumulative_fcr_engine = performanceCumulativeFcr;
        productionMetrics.cumulative_feed_kg = performanceRowsWithCurrent.reduce((sum, row) => sum + (Number(row.feed_total_kg) || 0), 0);
        productionMetrics.current_age_days = ageDays;
        productionMetrics.current_average_weight_g = stats.mean;
        productionMetrics.current_live_birds = liveBirds;
        if (performanceCumulativeFcr != null) productionMetrics.cumulative_fcr = performanceCumulativeFcr;


        const payload = {

            ...(recordId
                ? {
                    id:
                        recordId
                }
                : {}),

            owner_id:
                currentUser.id,

            farm_id:
                currentFlock.farm_id,

            house_id:
                currentFlock.house_id,

            flock_id:
                currentFlock.id,

            week_number:
                week,

            evaluation_date:
                evaluationDate,

            sample_count:
                stats.count,

            average_weight_g:
                stats.mean,

            sd_weight_g:
                stats.sd,

            cv_percent:
                stats.cv,

            uniformity_10_percent:
                stats.uniformity10,

            uniformity_15_percent:
                stats.uniformity15,

            min_weight_g:
                stats.min,

            max_weight_g:
                stats.max,

            live_birds:
                liveBirds,

            mortality_count:
                mortality,

            feed_total_kg:
                feedTotal,

            water_total_liter:
                waterTotal,

            feed_per_bird_g:
                feedPerBird,

            water_per_bird_ml:
                waterPerBird,

            age_days:
                ageDays,

            water_feed_ratio:
                feedTotal > 0 && waterTotal >= 0
                    ? Number((waterTotal / feedTotal).toFixed(3))
                    : null,

            production_metrics:
                productionMetrics,

            cumulative_fcr:
                typeof calculateWeeklyCumulativeConversion === "function"
                    ? calculateWeeklyCumulativeConversion(
                        existingForCumulative,
                        {
                            id: recordId,
                            feed_total_kg: feedTotal,
                            average_weight_g: stats.mean,
                            live_birds: liveBirds,
                            production_metrics: productionMetrics,
                            week_number: week
                        },
                        currentFlock.production_type || currentFlock.productionType
                    )
                    : null,

            fcr:
                performanceWeeklyFcrResolved,

            notes:
                notes,

            weights:
                weights

        };


        console.log(
            "WEEKLY PAYLOAD:",
            payload
        );


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "در حال ذخیره...";

        }


        let query =
            supabaseClient
                .from(
                    "weekly_records"
                );


        let result;


        if (recordId) {

            result =
                await query
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        recordId
                    )
                    .select()
                    .single();

        }

        else {

            result =
                await query
                    .upsert(
                        payload,
                        {
                            onConflict:
                                "flock_id,week_number"
                        }
                    )
                    .select()
                    .single();

        }


        const {
            data,
            error
        } =
            result;


        if (error) {

            console.error(
                "Save weekly error:",
                error
            );


            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    editingRecordId
                        ? "ذخیره تغییرات"
                        : "ذخیره گزارش هفتگی";

            }


            alert(
                "ذخیره گزارش انجام نشد:\n" +
                error.message
            );


            return;

        }


        console.log(
            "WEEKLY RECORD SAVED:",
            data
        );


        const wasEditing =
            Boolean(
                editingRecordId
            );


        alert(
            wasEditing
                ? "گزارش هفتگی با موفقیت ویرایش شد."
                : "گزارش هفتگی با موفقیت ذخیره شد."
        );


        clearWeeklyForm();

        await loadHistory();

    }

    catch (error) {

        console.error(
            "Weekly save error:",
            error
        );


        alert(
            "ذخیره گزارش انجام نشد:\n" +
            (
                error?.message ||
                "خطای نامشخص"
            )
        );


        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                editingRecordId
                    ? "ذخیره تغییرات"
                    : "ذخیره گزارش هفتگی";

        }

    }

}


/* =========================================================
   LOAD HISTORY
========================================================= */

async function loadHistory() {

    if (
        !currentFlock ||
        !currentUser
    ) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "weekly_records"
            )
            .select("*")
            .eq(
                "flock_id",
                currentFlock.id
            )
            .order(
                "week_number",
                {
                    ascending:
                        true
                }
            );


    if (error) {

        console.error(
            "History error:",
            error
        );


        const history =
            document.getElementById(
                "weeklyHistory"
            );


        if (history) {

            history.innerHTML = `

                <p>
                    خطا در دریافت سوابق.
                </p>

            `;

        }


        return;

    }


    weeklyRecords =
        data || [];


    renderHistory();

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    const container =
        document.getElementById(
            "weeklyHistory"
        );


    if (!container) {

        return;

    }


    if (
        !weeklyRecords.length
    ) {

        container.innerHTML = `

            <p>
                هنوز گزارش هفتگی ثبت نشده است.
            </p>

        `;

        return;

    }


    container.innerHTML = `

        <div
            style="
                overflow-x:auto;
            "
        >

            <table>

                <thead>

                    <tr>

                        <th>
                            هفته
                        </th>

                        <th>
                            تاریخ
                        </th>

                        <th>
                            میانگین
                        </th>

                        <th>
                            SD
                        </th>

                        <th>
                            CV
                        </th>

                        <th>
                            FCR
                        </th>

                        <th>
                            یکنواختی ±10
                        </th>

                        <th>
                            یکنواختی ±15
                        </th>

                        <th>
                            تلفات
                        </th>

                        <th>
                            دان
                        </th>

                        <th>
                            آب
                        </th>

                        <th>
                            عملیات
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${
                        weeklyRecords
                            .map(
                                record => `

                                    <tr>

                                        <td>
                                            ${formatNumber(
                                                record.week_number,
                                                0
                                            )}
                                        </td>

                                        <td>
                                            ${formatDateDisplay(
                                                record.evaluation_date
                                            )}
                                        </td>

                                        <td>
                                            ${formatNumber(
                                                record.average_weight_g,
                                                1
                                            )}
                                        </td>

                                        <td>
                                            ${formatNumber(
                                                record.sd_weight_g,
                                                1
                                            )}
                                        </td>

                                        <td>
                                            ${formatNumber(
                                                record.cv_percent,
                                                2
                                            )}%
                                        </td>

                                        <td>
                                            ${formatNumber(
                                                calculateWeeklyHistoryFCR(
                                                    record
                                                ),
                                                3
                                            )}
                                        </td>

                                        <td>
                                            ${formatNumber(
                                                record.uniformity_10_percent,
                                                1
                                            )}%
                                        </td>

                                        <td>
                                            ${formatNumber(
                                                record.uniformity_15_percent,
                                                1
                                            )}%
                                        </td>

                                        <td>
                                            ${formatNumber(
                                                record.mortality_count,
                                                0
                                            )}
                                        </td>

                                        <td>
                                            ${formatNumber(
                                                record.feed_total_kg,
                                                1
                                            )}
                                        </td>

                                        <td>
                                            ${formatNumber(
                                                record.water_total_liter,
                                                1
                                            )}
                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                class="btn btn-secondary"
                                                onclick="editWeeklyRecord('${escapeHTMLAttribute(record.id)}')"
                                            >
                                                ✏️ ویرایش
                                            </button>

                                        </td>

                                    </tr>

                                `
                            )
                            .join("")
                    }

                </tbody>

            </table>

        </div>

    `;

}


/* =========================================================
   FCR FOR HISTORY
========================================================= */

function calculateWeeklyHistoryFCR(current) {
    if (!current) return null;
    const index=weeklyRecords.findIndex(item=>String(item.id)===String(current.id));
    if (index<=0) return null;
    const previous=weeklyRecords[index-1];
    const type=String(currentFlock?.production_type||currentFlock?.productionType||'broiler').toLowerCase();
    if (type!=='broiler' && type!=='گوشتی') return null;
    if (typeof calculateBroilerFCR==='function') return calculateBroilerFCR({
        feedKg:current.feed_total_kg,
        openingBirds:previous.live_birds,
        closingBirds:current.live_birds,
        openingAverageWeightG:previous.average_weight_g,
        closingAverageWeightG:current.average_weight_g
    });
    return null;
}


/* =========================================================
   DELETE WEEKLY RECORD - STRICT CONFIRMATION
========================================================= */
async function deleteWeeklyRecord(recordId) {
    if (!recordId || !currentUser || !currentFlock) return;
    const record = weeklyRecords.find(r => String(r.id) === String(recordId));
    if (!record) { alert("رکورد پیدا نشد."); return; }
    if (String(currentFlock.status || "active").toLowerCase() === "closed") {
        alert("دوره بسته شده و حذف مجاز نیست.");
        return;
    }
    const week = record.week_number ?? "-";
    if (!confirm(`هشدار جدی!\nگزارش هفتگی هفته ${week} حذف خواهد شد.\nاین عملیات ممکن است روی گزارش‌های تجمعی اثر بگذارد.\nآیا مطمئن هستید؟`)) return;
    const typed = prompt(`برای حذف قطعی، عبارت «حذف هفته ${week}» را وارد کنید:`);
    if (typed !== `حذف هفته ${week}`) { alert("عبارت صحیح وارد نشد؛ حذف لغو شد."); return; }
    const {error} = await supabaseClient
        .from("weekly_records")
        .delete()
        .eq("id", record.id)
        .eq("flock_id", currentFlock.id);
    if (error) { console.error(error); alert("حذف انجام نشد:\n"+error.message); return; }
    weeklyRecords = weeklyRecords.filter(r => String(r.id) !== String(record.id));
    renderHistory();
    alert("گزارش هفتگی حذف شد.");
}

/* =========================================================
   DATE DISPLAY
========================================================= */

function formatDateDisplay(
    date
) {

    if (!date) {

        return "-";

    }


    const text =
        String(date);


    if (
        text.includes("/")
    ) {

        return convertDigitsToPersian(
            text
        );

    }


    const parts =
        text
            .substring(
                0,
                10
            )
            .split("-");


    if (
        parts.length !== 3
    ) {

        return convertDigitsToPersian(
            text
        );

    }


    const gy =
        Number(parts[0]);


    const gm =
        Number(parts[1]);


    const gd =
        Number(parts[2]);


    if (
        !Number.isInteger(gy) ||
        !Number.isInteger(gm) ||
        !Number.isInteger(gd)
    ) {

        return convertDigitsToPersian(
            text
        );

    }


    const jalali =
        gregorianToJalali(
            gy,
            gm,
            gd
        );


    return convertDigitsToPersian(
        `${jalali[0]}/${padNumber(jalali[1], 2)}/${padNumber(jalali[2], 2)}`
    );

}


/* =========================================================
   GET VALUE
========================================================= */

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


/* =========================================================
   GET NUMBER
========================================================= */

function getNumber(
    id
) {

    const value =
        getValue(id);


    if (!value) {

        return 0;

    }


    const normalized =
        normalizeNumberString(
            value
        );


    const number =
        Number(
            normalized
        );


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(
    value,
    decimals = 1
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    const number =
        Number(value);


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "-";

    }


    return number.toLocaleString(
        "fa-IR",
        {

            minimumFractionDigits:
                decimals,

            maximumFractionDigits:
                decimals

        }
    );

}


/* =========================================================
   PRODUCTION LABEL
========================================================= */

function getProductionLabel(
    type
) {

    const labels = {

        broiler:
            "گوشتی",

        layer:
            "تخم‌گذار",

        pullet:
            "پولت",

        breeder:
            "مرغ مادر"

    };


    return (
        labels[type] ||
        type ||
        "-"
    );

}


/* =========================================================
   DIGITS TO PERSIAN
========================================================= */

function convertDigitsToPersian(
    value
) {

    return String(
        value ?? ""
    ).replace(
        /\d/g,
        digit =>
            "۰۱۲۳۴۵۶۷۸۹"[
                Number(digit)
            ]
    );

}


/* =========================================================
   NORMALIZE DATE DIGITS
========================================================= */

function normalizeDateDigits(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /[۰-۹]/g,
        digit =>
            String(
                digit.charCodeAt(0) -
                1776
            )
    )
    .replace(
        /[٠-٩]/g,
        digit =>
            String(
                digit.charCodeAt(0) -
                1632
            )
    );

}


/* =========================================================
   PAD
========================================================= */

function padNumber(
    value,
    length
) {

    return String(
        value
    ).padStart(
        length,
        "0"
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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
   ESCAPE ATTRIBUTE
========================================================= */

function escapeHTMLAttribute(
    value
) {

    return String(
        value ?? ""
    )

    .replaceAll(
        "\\",
        "\\\\"
    )

    .replaceAll(
        "'",
        "\\'"
    )

    .replaceAll(
        "\n",
        "\\n"
    )

    .replaceAll(
        "\r",
        "\\r"
    );

}


/* =========================================================
   JALALI CALENDAR MATH
   No external date library required
========================================================= */

function jalaliToGregorian(
    jy,
    jm,
    jd
) {

    jy =
        Number(jy);

    jm =
        Number(jm);

    jd =
        Number(jd);


    const jy2 =
        jy - 979;


    let days =
        365 * jy2;


    days +=
        Math.floor(
            jy2 / 33
        ) * 8;


    days +=
        Math.floor(
            (
                jy2 % 33
            ) + 3
            / 4
        );


    if (
        jm <= 6
    ) {

        days +=
            (
                jm - 1
            ) * 31;

    }

    else {

        days +=
            (
                jm - 7
            ) * 30 +
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


    if (
        days >= 36525
    ) {

        days--;

        gy +=
            100 *
            Math.floor(
                days / 36524
            );

        days %=
            36524;

        if (
            days >= 365
        ) {

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


    if (
        days >= 366
    ) {

        gy +=
            Math.floor(
                (
                    days - 1
                ) / 365
            );

        days =
            (
                days - 1
            ) %
            365;

    }


    let gd =
        days + 1;


    const monthDays = [

        31,
        (
            (
                gy % 4 === 0 &&
                gy % 100 !== 0
            ) ||
            gy % 400 === 0
        )
            ? 29
            : 28,
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


    while (
        gm <= 12 &&
        gd >
        monthDays[gm - 1]
    ) {

        gd -=
            monthDays[gm - 1];

        gm++;

    }


    return [
        gy,
        gm,
        gd
    ];

}


/* =========================================================
   GREGORIAN → JALALI
========================================================= */

function gregorianToJalali(
    gy,
    gm,
    gd
) {

    gy =
        Number(gy);

    gm =
        Number(gm);

    gd =
        Number(gd);


    const gDaysInMonth = [

        31,
        28,
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


    const jDaysInMonth = [

        31,
        31,
        31,
        31,
        31,
        31,
        30,
        30,
        30,
        30,
        30,
        29

    ];


    let gy2 =
        gy - 1600;


    let gm2 =
        gm - 1;


    let gd2 =
        gd - 1;


    let gDayNo =
        365 * gy2;


    gDayNo +=
        Math.floor(
            (
                gy2 + 3
            ) / 4
        );


    gDayNo -=
        Math.floor(
            (
                gy2 + 99
            ) / 100
        );


    gDayNo +=
        Math.floor(
            (
                gy2 + 399
            ) / 400
        );


    for (
        let i = 0;
        i < gm2;
        i++
    ) {

        gDayNo +=
            gDaysInMonth[i];

    }


    if (
        gm2 > 1 &&
        (
            gy % 4 === 0 &&
            (
                gy % 100 !== 0 ||
                gy % 400 === 0
            )
        )
    ) {

        gDayNo++;

    }


    gDayNo +=
        gd2;


    let jDayNo =
        gDayNo - 79;


    const jNp =
        Math.floor(
            jDayNo / 12053
        );


    jDayNo %=
        12053;


    let jy =
        979 +
        33 * jNp +
        4 *
        Math.floor(
            jDayNo / 1461
        );


    jDayNo %=
        1461;


    if (
        jDayNo >= 366
    ) {

        jy +=
            Math.floor(
                (
                    jDayNo - 1
                ) / 365
            );

        jDayNo =
            (
                jDayNo - 1
            ) %
            365;

    }


    let jm;


    for (
        jm = 0;
        jm < 11 &&
        jDayNo >=
        jDaysInMonth[jm];
        jm++
    ) {

        jDayNo -=
            jDaysInMonth[jm];

    }


    const jd =
        jDayNo + 1;


    return [
        jy,
        jm + 1,
        jd
    ];

}


/* =========================================================
   JALALI LEAP YEAR
========================================================= */

function isLeapJalaliYear(
    jy
) {

    const gy =
        jalaliToGregorian(
            jy,
            1,
            1
        )[0];


    const next =
        jalaliToGregorian(
            jy + 1,
            1,
            1
        );


    const current =
        jalaliToGregorian(
            jy,
            1,
            1
        );


    const days =
        (
            new Date(
                next[0],
                next[1] - 1,
                next[2]
            ).getTime() -
            new Date(
                current[0],
                current[1] - 1,
                current[2]
            ).getTime()
        ) /
        86400000;


    return days === 366;

}


/* =========================================================
   EXPOSE
========================================================= */

window.normalizeNumberString =
    normalizeNumberString;

window.addWeightInput =
    addWeightInput;

window.addTwentyWeights =
    addTwentyWeights;

window.addHundredWeights =
    addHundredWeights;

window.addHundredWeights =
    addHundredWeights;

window.clearWeights =
    clearWeights;

window.getWeights =
    getWeights;

window.calculateWeekly =
    calculateWeekly;

window.saveWeeklyRecord =
    saveWeeklyRecord;

window.editWeeklyRecord =
    editWeeklyRecord;

window.deleteWeeklyRecord =
    deleteWeeklyRecord;

window.cancelEditWeeklyRecord =
    cancelEditWeeklyRecord;

window.getGregorianDateForSupabase =
    getGregorianDateForSupabase;

window.convertDatabaseDateToShamsi =
    convertDatabaseDateToShamsi;

window.formatDateDisplay =
    formatDateDisplay;

window.setToday =
    setToday;
