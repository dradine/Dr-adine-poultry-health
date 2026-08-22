/* =========================================================
   ADINE POULTRY HEALTH CENTER
   WEEKLY PERFORMANCE ENGINE
   ========================================================= */

"use strict";


/* =========================================================
   BUILD WEEKLY WEIGHT RECORD
   ========================================================= */

function buildWeeklyWeightRecord({

    flockId,

    farmId = null,

    houseId = null,

    ageDays,

    weekNumber = null,

    weights = [],

    feed = null,

    water = null,

    liveBirds = null,

    mortalityCount = 0,

    initialBirdCount = null,

    date = todayISO(),

    notes = ""

}) {

    const analysis =
        calculateWeightAnalysis(
            weights
        );


    const averageWeight =
        analysis.mean;


    /* -----------------------------------------------------
       STANDARD
       ----------------------------------------------------- */

    const standard =
        getStandardForCurrentFlock(
            flockId
        );


    const standardWeight =
        standard
            ? getStandardValueAtAge(
                standard,
                "bodyWeight",
                ageDays
            )
            : null;


    /* -----------------------------------------------------
       FCR
       ----------------------------------------------------- */

    const previousRecord =
        getFlockWeeklyRecords(flockId)
            .filter(item => Number.isFinite(Number(item.ageDays)))
            .sort((a, b) => Number(a.ageDays) - Number(b.ageDays))
            .at(-1) || null;

    const productionType = getFlockProductionType(flockId);

    const fcr =
        calculateWeeklyFCR(
            flockId, averageWeight, feed, liveBirds, previousRecord, productionType
        );


    /* -----------------------------------------------------
       MORTALITY
       ----------------------------------------------------- */

    const mortalityRate =
        calculateMortalityRate(
            mortalityCount,
            initialBirdCount
        );


    /* -----------------------------------------------------
       WEEK NUMBER
       ----------------------------------------------------- */

    const calculatedWeekNumber =
        weekNumber !== null &&
        weekNumber !== undefined &&
        Number.isFinite(
            Number(weekNumber)
        )
            ? Number(weekNumber)
            : Math.round(
                Number(ageDays || 0) / 7
            );


    /* -----------------------------------------------------
       RETURN
       ----------------------------------------------------- */

    return {

        id:
            createId("weekly"),

        flockId,

        farmId,

        houseId,

        date,

        evaluationDate:
            date,

        ageDays:
            Number(ageDays || 0),

        weekNumber:
            calculatedWeekNumber,

        sampleCount:
            analysis.count,

        liveBirds:
            liveBirds === null ||
            liveBirds === undefined ||
            liveBirds === ""
                ? null
                : Number(liveBirds),

        mortalityCount:
            mortalityCount === null ||
            mortalityCount === undefined ||
            mortalityCount === ""
                ? null
                : Number(mortalityCount),

        averageWeight:
            analysis.mean,

        sd:
            analysis.sd,

        cv:
            analysis.cv,

        uniformity10:
            analysis.uniformity10,

        uniformity15:
            analysis.uniformity15,

        minWeight:
            analysis.min,

        maxWeight:
            analysis.max,

        /* -------------------------------------------------
           FEED
           ------------------------------------------------- */

        feed:
            feed === null ||
            feed === undefined ||
            feed === ""
                ? null
                : Number(feed),

        feedPerBirdG:
            feed === null ||
            feed === undefined ||
            feed === ""
                ? null
                : Number(feed),

        /* -------------------------------------------------
           WATER
           ------------------------------------------------- */

        water:
            water === null ||
            water === undefined ||
            water === ""
                ? null
                : Number(water),

        waterPerBirdMl:
            water === null ||
            water === undefined ||
            water === ""
                ? null
                : Number(water),

        /* -------------------------------------------------
           FCR
           ------------------------------------------------- */

        fcr,

        /* -------------------------------------------------
           MORTALITY / LIVABILITY
           ------------------------------------------------- */

        mortality:
            mortalityRate,

        livability:
            mortalityRate === null
                ? null
                : calculateLivability(
                    mortalityRate
                ),

        /* -------------------------------------------------
           STANDARD COMPARISON
           ------------------------------------------------- */

        standardWeight,

        weightDifference:
            standardWeight === null ||
            averageWeight === null
                ? null
                : Number(
                    averageWeight
                ) -
                  Number(
                    standardWeight
                ),

        weightDifferencePercent:
            standardWeight === null ||
            averageWeight === null ||
            Number(standardWeight) === 0
                ? null
                : (
                    (
                        Number(
                            averageWeight
                        ) -
                        Number(
                            standardWeight
                        )
                    ) /
                    Number(
                        standardWeight
                    )
                ) * 100,

        notes:
            notes || ""

    };

}


/* =========================================================
   SAVE WEEKLY WEIGHT RECORD
   ========================================================= */

function saveWeeklyWeightRecord(
    data
) {

    const record =
        buildWeeklyWeightRecord(
            data
        );


    return saveWeeklyRecord(
        record
    );

}


/* =========================================================
   FCR
   ========================================================= */

function calculateWeeklyFCR(flockId, currentWeight, currentFeed, currentLiveBirds=null, previousRecord=null, productionType=null, productionMetrics=null) {
    const feedKg=Number(currentFeed);
    const cw=Number(currentWeight);
    const cb=Number(currentLiveBirds);
    const type=typeof normalizePoultryProductionType==='function'
        ? normalizePoultryProductionType(productionType||getFlockProductionType(flockId)||'broiler')
        : String(productionType||'broiler').toLowerCase();
    if(!Number.isFinite(feedKg)||feedKg<=0) return null;

    if(type==='layer' || type==='breeder'){
        const eggMassKg=Number(productionMetrics?.egg_mass_kg);
        return Number.isFinite(eggMassKg)&&eggMassKg>0 ? Number((feedKg/eggMassKg).toFixed(3)) : null;
    }
    if(!previousRecord) return null;
    const ow=Number(previousRecord.average_weight_g ?? previousRecord.averageWeight ?? previousRecord.averageWeightG);
    const ob=Number(previousRecord.live_birds ?? previousRecord.liveBirds);
    if(![ow,ob,cb,cw].every(Number.isFinite)||ow<0||ob<=0||cb<=0||cw<=0) return null;
    const gainKg=(cb*cw-ob*ow)/1000;
    return gainKg>0?Number((feedKg/gainKg).toFixed(3)):null;
}

function getFlockProductionType(flockId) {
    if (typeof getFlocks!=='function') return null;
    const flock=getFlocks().find(item=>String(item.id)===String(flockId));
    return flock?.productionType||flock?.production_type||null;
}


/* =========================================================
   STANDARD FOR FLOCK
   ========================================================= */

function getStandardForCurrentFlock(
    flockId
) {

    if (
        typeof getFlocks !==
        "function"
    ) {

        return null;

    }


    const flocks =
        getFlocks();


    if (
        !Array.isArray(flocks)
    ) {

        return null;

    }


    const flock =
        flocks.find(
            item =>
                item.id ===
                flockId
        );


    if (!flock) {

        return null;

    }


    if (
        typeof getStandard !==
        "function"
    ) {

        return null;

    }


    const productionType =
        flock.production_type ||
        flock.productionType ||
        "broiler";

    const genetics =
        flock.genetics ||
        flock.genetic ||
        flock.breed ||
        "";

    const strain =
        flock.strain ||
        flock.flock_strain ||
        "";

    if (typeof findPoultryStandardIdentity === "function") {
        const identity = findPoultryStandardIdentity(
            productionType,
            genetics,
            strain
        );
        return getStandard(
            identity.type || productionType,
            identity.geneticsId || genetics,
            identity.strain || strain
        );
    }

    return getStandard(
        productionType,
        genetics,
        strain
    );

}


/* =========================================================
   WEEKLY PERFORMANCE
   ========================================================= */

function getWeeklyPerformance(
    flockId
) {

    const records =
        getFlockWeeklyRecords(
            flockId
        );


    if (
        !Array.isArray(records)
    ) {

        return [];

    }


    const standard =
        getStandardForCurrentFlock(
            flockId
        );


    return records.map(
        record => {

            const standardWeight =
                standard
                    ? getStandardValueAtAge(
                        standard,
                        "bodyWeight",
                        record.ageDays
                    )
                    : null;


            const averageWeight =
                Number(
                    record.averageWeight
                );


            const weightDifference =
                standardWeight === null ||
                !Number.isFinite(
                    averageWeight
                )
                    ? null
                    : averageWeight -
                      Number(
                          standardWeight
                      );


            const weightDifferencePercent =
                standardWeight === null ||
                !Number.isFinite(
                    averageWeight
                ) ||
                Number(
                    standardWeight
                ) === 0
                    ? null
                    : (
                        weightDifference /
                        Number(
                            standardWeight
                        )
                    ) * 100;


            return {

                ...record,

                standardWeight,

                weightDifference,

                weightDifferencePercent,

                standardFCR:
                    standard ? getStandardValueAtAge(standard, "fcr", record.ageDays) : null

            };

        }
    );

}


/* =========================================================
   LATEST WEEKLY PERFORMANCE
   ========================================================= */

function getLatestWeeklyPerformance(
    flockId
) {

    const records =
        getWeeklyPerformance(
            flockId
        );


    if (
        !records.length
    ) {

        return null;

    }


    return records[
        records.length - 1
    ];

}


/* =========================================================
   HEALTH INDEX
   ========================================================= */

function calculateFlockHealthIndex(
    record
) {

    if (!record) {

        return null;

    }


    let score =
        100;


    /* -----------------------------------------------------
       CV
       ----------------------------------------------------- */

    if (
        Number.isFinite(
            Number(
                record.cv
            )
        )
    ) {

        const cv =
            Number(
                record.cv
            );


        if (cv > 20) {

            score -= 25;

        }

        else if (cv > 15) {

            score -= 15;

        }

        else if (cv > 10) {

            score -= 5;

        }

    }


    /* -----------------------------------------------------
       UNIFORMITY
       ----------------------------------------------------- */

    if (
        Number.isFinite(
            Number(
                record.uniformity10
            )
        )
    ) {

        const uniformity =
            Number(
                record.uniformity10
            );


        if (uniformity < 70) {

            score -= 25;

        }

        else if (uniformity < 80) {

            score -= 15;

        }

        else if (uniformity < 85) {

            score -= 5;

        }

    }


    /* -----------------------------------------------------
       WEIGHT DIFFERENCE
       ----------------------------------------------------- */

    if (
        Number.isFinite(
            Number(
                record.weightDifferencePercent
            )
        )
    ) {

        const deviation =
            Math.abs(
                Number(
                    record.weightDifferencePercent
                )
            );


        if (deviation > 15) {

            score -= 20;

        }

        else if (deviation > 10) {

            score -= 10;

        }

        else if (deviation > 5) {

            score -= 5;

        }

    }


    /* -----------------------------------------------------
       MORTALITY
       ----------------------------------------------------- */

    if (
        Number.isFinite(
            Number(
                record.mortality
            )
        )
    ) {

        const mortality =
            Number(
                record.mortality
            );


        if (mortality > 5) {

            score -= 20;

        }

        else if (mortality > 3) {

            score -= 10;

        }

        else if (mortality > 1) {

            score -= 5;

        }

    }


    return Math.max(
        0,
        Math.min(
            100,
            score
        )
    );

}


/* =========================================================
   DUPLICATE AGE CHECK
   ========================================================= */

function hasWeeklyRecordAtAge(
    flockId,
    ageDays,
    excludeId = null
) {

    const records =
        getFlockWeeklyRecords(
            flockId
        );


    if (
        !Array.isArray(records)
    ) {

        return false;

    }


    return records.some(
        record =>

            record.id !==
            excludeId &&

            Number(
                record.ageDays
            ) ===
            Number(
                ageDays
            )

    );

}


/* =========================================================
   GET WEEKLY RECORD BY WEEK
   ========================================================= */

function getFlockRecordByWeek(
    flockId,
    weekNumber
) {

    const records =
        getFlockWeeklyRecords(
            flockId
        );


    return records.find(
        record =>
            Number(
                record.weekNumber
            ) ===
            Number(
                weekNumber
            )
    ) || null;

}


/* =========================================================
   GET WEEKLY RECORD BY DATE
   ========================================================= */

function getFlockRecordByDate(
    flockId,
    date
) {

    const records =
        getFlockWeeklyRecords(
            flockId
        );


    return records.find(
        record =>
            String(
                record.date ||
                record.evaluationDate ||
                ""
            )
            .slice(
                0,
                10
            ) ===
            String(
                date || ""
            )
            .slice(
                0,
                10
            )
    ) || null;

}
