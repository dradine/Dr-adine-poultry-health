/* =========================================================
   ADINE POULTRY HEALTH CENTER
   COMPARISON ENGINE
========================================================= */


/* =========================================================
   COMPARE VALUE
========================================================= */

function compareValue(
    actual,
    standard
) {

    if (
        actual === null ||
        actual === undefined ||
        standard === null ||
        standard === undefined
    ) {

        return {

            actual,

            standard,

            difference: null,

            percentage: null,

            status:
                "no-standard"

        };

    }


    const a =
        Number(actual);

    const s =
        Number(standard);


    if (
        !Number.isFinite(a) ||
        !Number.isFinite(s)
    ) {

        return {

            actual: a,

            standard: s,

            difference: null,

            percentage: null,

            status:
                "invalid"

        };

    }


    const difference =
        a - s;


    const percentage =
        s === 0
            ? null
            : (
                difference /
                Math.abs(s)
            ) *
            100;


    return {

        actual: a,

        standard: s,

        difference,

        percentage,

        status:
            "available"

    };

}


/* =========================================================
   WEIGHT STATUS
========================================================= */

function weightStatus(
    actual,
    standard
) {

    const result =
        compareValue(
            actual,
            standard
        );


    if (
        result.percentage ===
        null
    ) {

        return "no-standard";

    }


    if (
        result.percentage >= 5
    ) {

        return "above";

    }


    if (
        result.percentage <= -5
    ) {

        return "below";

    }


    return "on-target";

}


/* =========================================================
   GENERIC COMPARISON
========================================================= */

function compareFlockToStandard({
    actual,
    standard
}) {

    if (
        !actual ||
        !standard
    ) {

        return null;

    }


    const metrics = {};


    Object.keys(
        PERFORMANCE_METRICS
    )
    .forEach(
        metric => {

            metrics[metric] =
                compareValue(
                    actual[metric],
                    standard[metric]
                );

        }
    );


    return {

        metrics,

        overall:
            calculateOverallPerformance(
                metrics
            )

    };

}


/* =========================================================
   OVERALL
========================================================= */

function calculateOverallPerformance(
    metrics
) {

    const values =
        Object.values(
            metrics
        )
        .filter(
            item =>
                item &&
                item.percentage !==
                null
        );


    if (!values.length) {

        return {

            score: null,

            status:
                "no-standard"

        };

    }


    const scores =
        values.map(
            item => {

                const p =
                    Math.abs(
                        Number(
                            item.percentage
                        )
                    );


                if (p <= 5) {

                    return 100;

                }

                if (p <= 10) {

                    return 80;

                }

                if (p <= 20) {

                    return 60;

                }

                return 30;

            }
        );


    const score =
        scores.reduce(
            (
                sum,
                value
            ) =>
                sum + value,
            0
        ) /
        scores.length;


    let status =
        "critical";


    if (
        score >= 90
    ) {

        status =
            "excellent";

    }

    else if (
        score >= 75
    ) {

        status =
            "good";

    }

    else if (
        score >= 60
    ) {

        status =
            "warning";

    }


    return {

        score,

        status

    };

}


/* =========================================================
   CHART DATA
========================================================= */

function buildComparisonChartData({
    actualRecords = [],
    standardRecords = [],
    metric
}) {

    const actualMap =
        new Map();


    actualRecords.forEach(
        record => {

            const age =
                Number(
                    record.ageDays ??
                    record.age
                );


            const value =
                record[metric];


            if (
                Number.isFinite(age) &&
                value !== null &&
                value !== undefined
            ) {

                actualMap.set(
                    age,
                    Number(value)
                );

            }

        }
    );


    const standardMap =
        new Map();


    standardRecords.forEach(
        record => {

            const age =
                Number(
                    record.ageDays ??
                    record.age
                );


            const value =
                record[metric];


            if (
                Number.isFinite(age) &&
                value !== null &&
                value !== undefined
            ) {

                standardMap.set(
                    age,
                    Number(value)
                );

            }

        }
    );


    const labels =
        [
            ...new Set(
                [
                    ...actualMap.keys(),
                    ...standardMap.keys()
                ]
            )
        ]
        .sort(
            (
                a,
                b
            ) =>
                a - b
        );


    return {

        labels,

        actual:
            labels.map(
                age =>
                    actualMap.get(
                        age
                    ) ?? null
            ),

        standard:
            labels.map(
                age =>
                    standardMap.get(
                        age
                    ) ?? null
            )

    };

}


/* =========================================================
   PERFORMANCE SUMMARY
========================================================= */

function buildPerformanceSummary(
    records
) {

    if (
        !records ||
        !records.length
    ) {

        return null;

    }


    const last =
        [...records]
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        a.ageDays || 0
                    ) -
                    Number(
                        b.ageDays || 0
                    )
            )
            .at(-1);


    return {

        ageDays:
            Number(
                last.ageDays || 0
            ),

        bodyWeight:
            Number(
                last.bodyWeight ??
                last.averageWeight ??
                0
            ),

        cv:
            Number(
                last.cv || 0
            ),

        uniformity10:
            Number(
                last.uniformity10 || 0
            ),

        uniformity15:
            Number(
                last.uniformity15 || 0
            ),

        fcr:
            last.fcr ??
            null,

        feed:
            last.feed ??
            null,

        water:
            last.water ??
            null

    };

}
