"use strict";

/* =========================================================
   HEALTH ANALYSIS ENGINE
========================================================= */

function analyzeHealthEvents(
    events,
    flockPopulation = null
){

    const rows =
        Array.isArray(events)
            ? events
            : [];


    const mortality =
        rows.reduce(
            (sum,row) =>
                sum +
                Number(
                    row.mortality_count || 0
                ),
            0
        );


    const cull =
        rows.reduce(
            (sum,row) =>
                sum +
                Number(
                    row.cull_count || 0
                ),
            0
        );


    const affected =
        rows.reduce(
            (sum,row) =>
                sum +
                Number(
                    row.affected_count || 0
                ),
            0
        );


    const severe =
        rows.filter(
            row =>
                row.severity ===
                "severe"
        ).length;


    const diseaseEvents =
        rows.filter(
            row =>
                row.event_type ===
                    "disease" ||
                row.event_type ===
                    "suspected_disease" ||
                row.event_type ===
                    "clinical_case"
        );


    const diseaseNames =
        [
            ...new Set(
                diseaseEvents
                    .map(
                        row =>
                            row.confirmed_disease_name ||
                            row.suspected_disease_name
                    )
                    .filter(Boolean)
            )
        ];


    let mortalityRate = null;


    if(
        flockPopulation &&
        flockPopulation > 0
    ){

        mortalityRate =
            (
                mortality /
                flockPopulation
            ) *
            100;

    }


    let status =
        "stable";


    if(
        severe > 0 ||
        (
            mortalityRate !== null &&
            mortalityRate >= 0.5
        )
    ){

        status =
            "critical";

    }
    else if(
        diseaseEvents.length >= 3 ||
        (
            mortalityRate !== null &&
            mortalityRate >= 0.25
        )
    ){

        status =
            "warning";

    }
    else if(
        diseaseEvents.length > 0 ||
        mortality > 0
    ){

        status =
            "monitoring";

    }


    return {

        mortality,

        cull,

        affected,

        severe,

        diseaseEvents,

        diseaseNames,

        mortalityRate,

        status

    };

}


/* =========================================================
   STATUS LABEL
========================================================= */

function healthStatusLabel(
    status
){

    const labels = {

        stable:
            "پایدار",

        monitoring:
            "نیازمند پایش",

        warning:
            "هشدار",

        critical:
            "بحرانی"

    };


    return labels[status] ||
        "پایدار";

}
