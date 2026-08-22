/* =========================================================
   ADINE POULTRY HEALTH CENTER
   REPORTS DATA - SUPABASE
   STABLE PROFESSIONAL VERSION
   ---------------------------------------------------------
   Weight / FCR / Management fallback
   Genetic standard -> Management standard
   Age based interpolation
   ========================================================= */

"use strict";


let reportsCurrentUser = null;


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeReportsData() {

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

        throw new Error(
            "کاربر وارد نشده است."
        );

    }


    reportsCurrentUser =
        data.user;


    return reportsCurrentUser;

}


/* =========================================================
   GET FLOCK
========================================================= */

async function getReportFlock(
    flockId
) {

    if (!flockId) {

        return null;

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
                    id,
                    name
                ),
                houses (
                    id,
                    name
                )
            `)
            .eq(
                "id",
                flockId
            )
            .eq(
                "owner_id",
                reportsCurrentUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Report flock error:",
            error
        );

        throw error;

    }


    return data || null;

}


/* =========================================================
   GET WEEKLY RECORDS
========================================================= */

async function getReportWeeklyRecords(
    flockId
) {

    if (!flockId) {

        return [];

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("weekly_records")
            .select("*")
            .eq(
                "flock_id",
                flockId
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
            "Weekly records error:",
            error
        );

        throw error;

    }


    return Array.isArray(data)
        ? data
        : [];

}


/* =========================================================
   SAFE NUMBER
========================================================= */

function reportNumber(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    const n =
        Number(
            String(value)
                .replace(
                    /,/g,
                    ""
                )
                .trim()
        );


    return Number.isFinite(n)
        ? n
        : null;

}


/* =========================================================
   NORMALIZE PRODUCTION TYPE
========================================================= */

function normalizeReportProductionType(
    value
) {

    const raw =
        String(
            value || ""
        )
            .trim()
            .toLowerCase();


    if (
        raw === "broiler" ||
        raw === "گوشتی" ||
        raw === "گوشتی مرغ"
    ) {

        return "broiler";

    }


    if (
        raw === "layer" ||
        raw === "تخمگذار" ||
        raw === "تخم‌گذار" ||
        raw === "تخم گذار"
    ) {

        return "layer";

    }


    if (
        raw === "pullet" ||
        raw === "پولت"
    ) {

        return "pullet";

    }


    if (
        raw === "breeder" ||
        raw === "مادر" ||
        raw === "مرغ مادر"
    ) {

        return "breeder";

    }


    return raw;

}


/* =========================================================
   NORMALIZE WEEKLY RECORD
========================================================= */

function normalizeReportRecord(
    record
) {

    const weekNumber =
        reportNumber(
            record.week_number
        ) ??
        0;


    const ageDays =
        reportNumber(
            record.age_days
        ) ??
        (
            weekNumber * 7
        );


    return {

        id:
            record.id,

        flockId:
            record.flock_id,

        weekNumber,

        ageDays,

        evaluationDate:
            record.evaluation_date ||
            record.record_date ||
            null,

        liveBirds:
            reportNumber(
                record.live_birds
            ),

        mortality:
            reportNumber(
                record.mortality_count
            ),

        sampleCount:
            reportNumber(
                record.sample_count
            ),

        averageWeight:
            reportNumber(
                record.average_weight_g
            ),

        sd:
            reportNumber(
                record.sd_weight_g
            ),

        cv:
            reportNumber(
                record.cv_percent
            ),

        uniformity10:
            reportNumber(
                record.uniformity_10_percent
            ),

        uniformity15:
            reportNumber(
                record.uniformity_15_percent
            ),

        minWeight:
            reportNumber(
                record.min_weight_g
            ),

        maxWeight:
            reportNumber(
                record.max_weight_g
            ),

        feedTotalKg:
            reportNumber(
                record.feed_total_kg
            ),

        feedPerBirdG:
            reportNumber(
                record.feed_per_bird_g
            ),

        waterTotalLiter:
            reportNumber(
                record.water_total_liter
            ),

        waterPerBirdMl:
            reportNumber(
                record.water_per_bird_ml
            ),

        waterFeedRatio:
            reportNumber(
                record.water_feed_ratio
            ),

        productionMetrics:
            record.production_metrics &&
            typeof record.production_metrics ===
            "object"
                ? record.production_metrics
                : {},

        cumulativeFCR:
            reportNumber(
                record.cumulative_fcr
            ),

        fcr:
            null,

        /* استانداردها */
        standardWeight:
            null,

        standardWeightSourceType:
            null,

        standardWeightSourceLabel:
            null,

        standardWeightIsManagement:
            false,

        standardFCR:
            null,

        standardFCRSourceType:
            null,

        standardFCRSourceLabel:
            null,

        standardFCRIsManagement:
            false,

        standardCV:
            null,

        standardUniformity10:
            null,

        standardUniformity15:
            null,

        standardFeedPerBirdG:
            null,

        standardWaterPerBirdMl:
            null,

        weightDifference:
            null,

        weightDifferencePercent:
            null,

        notes:
            record.notes ||
            ""

    };

}


/* =========================================================
   GET STANDARD SAFELY
========================================================= */

function getReportStandardSafely(
    flock
) {

    if (
        typeof getStandard !==
        "function"
    ) {

        console.warn(
            "getStandard() در دسترس نیست."
        );

        return null;

    }


    const type =
        normalizeReportProductionType(
            flock?.production_type
        );


    const genetics =
        flock?.genetics ||
        flock?.genetic ||
        flock?.breed ||
        "";


    const strain =
        flock?.strain ||
        flock?.flock_strain ||
        "";


    try {

        let resolvedGenetics = genetics;
        let resolvedStrain = strain;

        if (typeof findPoultryStandardIdentity === "function") {
            const identity = findPoultryStandardIdentity(type, genetics, strain);
            resolvedGenetics = identity.geneticsId || genetics;
            resolvedStrain = identity.strain || strain;
        }

        const standard =
            getStandard(
                type,
                resolvedGenetics,
                resolvedStrain
            );


        if (standard) {

            return standard;

        }

    }

    catch (error) {

        console.error(
            "getStandard error:",
            error
        );

    }


    return null;

}


/* =========================================================
   GET STANDARD META SAFELY
========================================================= */

function getReportStandardMeta(
    standard,
    metric,
    ageDays
) {

    const age =
        reportNumber(
            ageDays
        );


    if (
        !standard ||
        age === null
    ) {

        return {

            value:
                null,

            sourceType:
                null,

            sourceLabel:
                null,

            isFallback:
                false

        };

    }


    try {

        if (
            typeof getStandardMeta ===
            "function"
        ) {

            const result =
                getStandardMeta(
                    standard,
                    metric,
                    age
                );


            if (
                result &&
                result.value !== null &&
                result.value !== undefined &&
                Number.isFinite(
                    Number(
                        result.value
                    )
                )
            ) {

                return {

                    value:
                        Number(
                            result.value
                        ),

                    sourceType:
                        result.sourceType ||
                        null,

                    sourceLabel:
                        result.sourceLabel ||
                        null,

                    isFallback:
                        Boolean(
                            result.isFallback
                        )

                };

            }

        }

    }

    catch (error) {

        console.warn(
            "getStandardMeta error:",
            metric,
            age,
            error
        );

    }


    /*
     * FALLBACK DIRECT
     * اگر getStandardMeta در دسترس نبود
     */

    try {

        if (
            typeof getStandardValueAtAge ===
            "function"
        ) {

            const value =
                getStandardValueAtAge(
                    standard,
                    metric,
                    age
                );


            if (
                value !== null &&
                value !== undefined &&
                Number.isFinite(
                    Number(value)
                )
            ) {

                const isManagement =
                    !standard.official;


                return {

                    value:
                        Number(value),

                    sourceType:
                        isManagement
                            ? "management-standard"
                            : "official",

                    sourceLabel:
                        isManagement
                            ? (
                                standard.management?.sourceLabel ||
                                "استاندارد مدیریتی"
                            )
                            : (
                                standard.official?.sourceLabel ||
                                "استاندارد ژنتیکی رسمی"
                            ),

                    isFallback:
                        isManagement

                };

            }

        }

    }

    catch (error) {

        console.warn(
            "getStandardValueAtAge error:",
            metric,
            age,
            error
        );

    }


    return {

        value:
            null,

        sourceType:
            null,

        sourceLabel:
            null,

        isFallback:
            false

    };

}


/* =========================================================
   STANDARD SOURCE LABEL
========================================================= */

function getReportSourceLabel(
    meta
) {

    if (!meta) {

        return "بدون استاندارد";

    }


    if (
        meta.sourceType ===
        "management-standard"
    ) {

        return "استاندارد مدیریتی";

    }


    if (
        meta.isFallback
    ) {

        return "استاندارد مدیریتی";

    }


    if (
        meta.sourceType
    ) {

        return "استاندارد ژنتیکی رسمی";

    }


    if (
        meta.value !== null &&
        meta.value !== undefined
    ) {

        return (
            meta.sourceLabel ||
            "استاندارد"

        );

    }


    return "بدون استاندارد";

}


/* =========================================================
   FCR
========================================================= */

function calculateReportFCR(previous, current, productionType = "broiler") {
    const type = normalizeReportProductionType(productionType);
    const feed = reportNumber(current?.feedTotalKg);
    if (!Number.isFinite(feed) || feed <= 0) return null;

    // Layer / breeder: FCR is feed kg per kg egg mass for the reporting week.
    if (type === "layer" || type === "breeder") {
        const eggMass = reportNumber(current?.productionMetrics?.egg_mass_kg);
        return Number.isFinite(eggMass) && eggMass > 0
            ? Number((feed / eggMass).toFixed(3))
            : null;
    }

    // Pullet / broiler: FCR is feed kg per kg live-weight gain.
    if (!previous) return null;
    const openingWeight = reportNumber(previous.averageWeight);
    const closingWeight = reportNumber(current.averageWeight);
    const openingBirds = reportNumber(previous.liveBirds);
    const closingBirds = reportNumber(current.liveBirds);
    if (![openingWeight, closingWeight, openingBirds, closingBirds].every(Number.isFinite)) return null;
    if (openingWeight < 0 || closingWeight <= 0 || openingBirds <= 0 || closingBirds <= 0) return null;

    const gainKg = (closingBirds * closingWeight - openingBirds * openingWeight) / 1000;
    return gainKg > 0 ? Number((feed / gainKg).toFixed(3)) : null;
}

function getReportSpecializedMetric(standard, metric, ageDays) {
    const direct = getReportStandardMeta(standard, metric, ageDays);
    if (direct && direct.value != null) return direct;
    // Aliases used by the weekly-specialized form and reports.
    const aliases = {
        henDayProduction: "henDayProduction",
        henHousedProduction: "henHousedProduction",
        eggProduction: "eggProduction",
        eggWeight: "eggWeight",
        eggMass: "eggMass",
        fertility: "fertility",
        hatchability: "hatchability",
        uniformity10: "uniformity10",
        uniformity15: "uniformity15",
        cv: "cv",
        fcr: "fcr"
    };
    const key = aliases[metric] || metric;
    return getReportStandardMeta(standard, key, ageDays);
}

function getActualSpecializedMetric(record, metric) {
    const m = record?.productionMetrics || {};
    const map = {
        eggProduction: m.hen_day_pct ?? m.egg_production ?? null,
        henDayProduction: m.hen_day_pct ?? null,
        henHousedProduction: m.hen_housed_pct ?? null,
        eggWeight: m.egg_weight_g ?? null,
        eggMass: m.egg_mass_kg ?? null,
        fertility: m.fertility_pct ?? null,
        hatchability: m.hatchability_pct ?? null,
        hatchingEggProduction: m.hatching_egg_pct ?? null,
        uniformity10: record?.uniformity10 ?? null,
        uniformity15: record?.uniformity15 ?? null,
        cv: record?.cv ?? null,
        bodyWeight: record?.averageWeight ?? null,
        fcr: record?.fcr ?? null
    };
    const value = map[metric];
    return value == null ? null : reportNumber(value);
}

if (typeof window !== "undefined") {
    window.getReportSpecializedMetric = getReportSpecializedMetric;
    window.getActualSpecializedMetric = getActualSpecializedMetric;
}

/* =========================================================
   CUMULATIVE FCR
========================================================= */

function calculateReportCumulativeFCR(
    records,
    current,
    productionType = "broiler"
) {

    const rows =
        (
            Array.isArray(records)
                ? records
                : []
        )
        .filter(
            row =>
                Number(
                    row.weekNumber
                ) <=
                Number(
                    current.weekNumber
                )
        )
        .sort(
            (a,b) =>
                Number(
                    a.weekNumber
                ) -
                Number(
                    b.weekNumber
                )
        );


    if (
        !rows.length
    ) {

        return null;

    }


    const feed =
        rows.reduce(
            (
                sum,
                row
            ) =>
                sum +
                Number(
                    row.feedTotalKg || 0
                ),
            0
        );


    if (
        feed <= 0
    ) {

        return null;

    }


    const type =
        normalizeReportProductionType(
            productionType
        );


    /*
     * تخم‌گذار / مادر
     */

    if (
        type === "layer" ||
        type === "breeder"
    ) {

        const eggMass =
            rows.reduce(
                (
                    sum,
                    row
                ) =>
                    sum +
                    Number(
                        row.productionMetrics
                            ?.egg_mass_kg ||
                        0
                    ),
                0
            );


        return eggMass > 0
            ? Number(
                (
                    feed /
                    eggMass
                )
                .toFixed(3)
            )
            : null;

    }


    /*
     * گوشتی
     */

    const first =
        rows.find(
            row =>
                Number(
                    row.averageWeight
                ) > 0 &&
                Number(
                    row.liveBirds
                ) > 0
        );


    const last =
        rows[
            rows.length - 1
        ];


    if (
        !first ||
        !last
    ) {

        return null;

    }


    const lastWeight =
        Number(
            last.averageWeight
        );


    const lastBirds =
        Number(
            last.liveBirds
        );


    if (
        lastWeight <= 0 ||
        lastBirds <= 0
    ) {

        return null;

    }


    const gainKg =
        (
            lastBirds *
            lastWeight
            -
            Number(
                first.liveBirds
            ) *
            Number(
                first.averageWeight
            )
        ) /
        1000;


    if (
        gainKg <= 0
    ) {

        return null;

    }


    return Number(
        (
            feed /
            gainKg
        )
        .toFixed(3)
    );

}


/* =========================================================
   APPLY STANDARDS
   ---------------------------------------------------------
   IMPORTANT:
   Genetic official standard is preferred.
   Management standard is automatic fallback.
========================================================= */

function applyReportStandards(
    records,
    standard,
    flock
) {

    if (
        !Array.isArray(records)
    ) {

        return [];

    }


    const productionType =
        normalizeReportProductionType(
            flock?.production_type
        );


    let previous =
        null;


    records
        .sort(
            (a,b) =>
                Number(
                    a.ageDays
                ) -
                Number(
                    b.ageDays
                )
        );


    records.forEach(
        record => {

            const ageDays =
                reportNumber(
                    record.ageDays
                );


            /* =============================================
               WEIGHT STANDARD
            ============================================== */

            const weightMeta =
                getReportStandardMeta(
                    standard,
                    "bodyWeight",
                    ageDays
                );


            record.standardWeight =
                weightMeta.value;


            record.standardWeightSourceType =
                weightMeta.sourceType;


            record.standardWeightSourceLabel =
                getReportSourceLabel(
                    weightMeta
                );


            record.standardWeightIsManagement =
                (
                    weightMeta.sourceType ===
                    "management-standard"
                ) ||
                Boolean(
                    weightMeta.isFallback
                );


            /* =============================================
               WEIGHT DIFFERENCE
            ============================================== */

            const actualWeight =
                reportNumber(
                    record.averageWeight
                );


            const standardWeightValue =
                reportNumber(
                    record.standardWeight
                );


            if (
                actualWeight !== null &&
                standardWeightValue !== null &&
                standardWeightValue !== 0
            ) {

                record.weightDifference =
                    actualWeight -
                    standardWeightValue;


                record.weightDifferencePercent =
                    (
                        record.weightDifference /
                        Math.abs(
                            standardWeightValue
                        )
                    ) *
                    100;

            }

            else {

                record.weightDifference =
                    null;

                record.weightDifferencePercent =
                    null;

            }


            /* =============================================
               FCR ACTUAL
            ============================================== */

            record.fcr =
                calculateReportFCR(
                    previous,
                    record,
                    productionType
                );


            /*
             * اگر FCR هفتگی قابل محاسبه نبود،
             * FCR ذخیره‌شده دیتابیس را نگه می‌داریم.
             */

            if (
                record.fcr === null
            ) {

                const storedFCR =
                    reportNumber(
                        record.cumulativeFCR
                    );


                if (
                    storedFCR !== null
                ) {

                    record.fcr =
                        storedFCR;

                }

            }


            /* =============================================
               CUMULATIVE FCR
            ============================================== */

            if (
                !Number.isFinite(
                    Number(
                        record.cumulativeFCR
                    )
                )
            ) {

                record.cumulativeFCR =
                    calculateReportCumulativeFCR(
                        records,
                        record,
                        productionType
                    );

            }


            /* =============================================
               FCR STANDARD
            ============================================== */

            const fcrMeta =
                getReportStandardMeta(
                    standard,
                    "fcr",
                    ageDays
                );


            record.standardFCR =
                fcrMeta.value;


            record.standardFCRSourceType =
                fcrMeta.sourceType;


            record.standardFCRSourceLabel =
                getReportSourceLabel(
                    fcrMeta
                );


            record.standardFCRIsManagement =
                (
                    fcrMeta.sourceType ===
                    "management-standard"
                ) ||
                Boolean(
                    fcrMeta.isFallback
                );


            /* =============================================
               OTHER STANDARD METRICS
            ============================================== */

            const feedMeta =
                getReportStandardMeta(
                    standard,
                    "dailyFeed",
                    ageDays
                );


            record.standardFeedPerBirdG =
                feedMeta.value;


            record.standardFeedSourceType =
                feedMeta.sourceType;


            const waterMeta =
                getReportStandardMeta(
                    standard,
                    "dailyWater",
                    ageDays
                );


            record.standardWaterPerBirdMl =
                waterMeta.value;


            record.standardWaterSourceType =
                waterMeta.sourceType;


            const cvMeta =
                getReportStandardMeta(
                    standard,
                    "cv",
                    ageDays
                );


            record.standardCV =
                cvMeta.value;


            record.standardCVSourceType =
                cvMeta.sourceType;


            const u10Meta =
                getReportStandardMeta(
                    standard,
                    "uniformity10",
                    ageDays
                );


            record.standardUniformity10 =
                u10Meta.value;


            record.standardUniformity10SourceType =
                u10Meta.sourceType;


            const u15Meta =
                getReportStandardMeta(
                    standard,
                    "uniformity15",
                    ageDays
                );


            record.standardUniformity15 =
                u15Meta.value;


            record.standardUniformity15SourceType =
                u15Meta.sourceType;


            previous =
                record;

        }
    );


    return records;

}


/* =========================================================
   GET COMPLETE REPORT DATA
========================================================= */

async function getCompleteReportData(
    flockId
) {

    const flock =
        await getReportFlock(
            flockId
        );


    if (!flock) {

        throw new Error(
            "گله موردنظر پیدا نشد."
        );

    }


    const rawRecords =
        await getReportWeeklyRecords(
            flockId
        );


    const records =
        rawRecords
            .map(
                normalizeReportRecord
            );


    /*
     * استاندارد کامل گله
     */

    const standard =
        getReportStandardSafely(
            flock
        );


    /*
     * اعمال استاندارد به تمام رکوردها
     */

    applyReportStandards(
        records,
        standard,
        flock
    );


    /*
     * مرتب‌سازی نهایی
     * بر اساس سن واقعی
     */

    records.sort(
        (a,b) =>
            Number(
                a.ageDays || 0
            ) -
            Number(
                b.ageDays || 0
            )
    );


    return {

        flock,

        records,

        standard

    };

}


/* =========================================================
   LAST RECORD
========================================================= */

function getLastReportRecord(
    records
) {

    if (
        !Array.isArray(records) ||
        !records.length
    ) {

        return null;

    }


    return [
        ...records
    ]
    .sort(
        (a,b) =>
            Number(
                a.ageDays || 0
            ) -
            Number(
                b.ageDays || 0
            )
    )
    .at(-1) || null;

}


/* =========================================================
   EXPORT GLOBALS
========================================================= */

if (
    typeof window !==
    "undefined"
) {

    window.initializeReportsData =
        initializeReportsData;

    window.getReportFlock =
        getReportFlock;

    window.getReportWeeklyRecords =
        getReportWeeklyRecords;

    window.normalizeReportRecord =
        normalizeReportRecord;

    window.getCompleteReportData =
        getCompleteReportData;

    window.calculateReportFCR =
        calculateReportFCR;

    window.calculateReportCumulativeFCR =
        calculateReportCumulativeFCR;

    window.applyReportStandards =
        applyReportStandards;

}
/* =========================================================
   HEALTH REPORT DATA
========================================================= */

async function getHealthReportEvents(
    flockId,
    startDate = null,
    endDate = null
){

    if(!flockId)
        return [];


    let query =
        supabaseClient
            .from(
                "health_weekly_report_events"
            )
            .select("*")
            .eq(
                "flock_id",
                flockId
            )
            .eq(
                "owner_id",
                reportsCurrentUser.id
            )
            .order(
                "event_date",
                {
                    ascending:true
                }
            );


    if(startDate){

        query =
            query.gte(
                "event_date",
                startDate
            );

    }


    if(endDate){

        query =
            query.lte(
                "event_date",
                endDate
            );

    }


    const {
        data,
        error
    } =
        await query;


    if(error){

        console.error(
            "Health report events error:",
            error
        );

        throw error;

    }


    return Array.isArray(data)
        ? data
        : [];

}


/* =========================================================
   HEALTH WEEK SUMMARY
========================================================= */

async function getHealthWeeklySummary(
    flockId,
    weekStart,
    weekEnd
){

    const events =
        await getHealthReportEvents(
            flockId,
            weekStart,
            weekEnd
        );


    return {

        mortality:
            events.reduce(
                (sum,row) =>
                    sum +
                    Number(
                        row.mortality_count || 0
                    ),
                0
            ),

        cull:
            events.reduce(
                (sum,row) =>
                    sum +
                    Number(
                        row.cull_count || 0
                    ),
                0
            ),

        affected:
            events.reduce(
                (sum,row) =>
                    sum +
                    Number(
                        row.affected_count || 0
                    ),
                0
            ),

        events,

        diseaseNames:
            [
                ...new Set(
                    events
                        .map(
                            row =>
                                row.confirmed_disease_name ||
                                row.suspected_disease_name
                        )
                        .filter(Boolean)
                )
            ]

    };

}
