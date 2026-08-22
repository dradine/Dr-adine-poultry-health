/* =========================================================
   ADINE POULTRY HEALTH CENTER
   POULTRY CALCULATION UTILITIES
========================================================= */


/* =========================================================
   BASIC STATISTICS
========================================================= */

function calculateMean(
    values
) {

    const numbers =
        values
            .map(Number)
            .filter(
                Number.isFinite
            );


    if (!numbers.length) {

        return null;

    }


    return (
        numbers.reduce(
            (
                sum,
                value
            ) =>
                sum + value,
            0
        ) /
        numbers.length
    );

}


function calculateSD(
    values
) {

    const numbers =
        values
            .map(Number)
            .filter(
                Number.isFinite
            );


    if (
        numbers.length <
        2
    ) {

        return null;

    }


    const mean =
        calculateMean(
            numbers
        );


    const variance =
        numbers.reduce(
            (
                sum,
                value
            ) =>
                sum +
                Math.pow(
                    value -
                    mean,
                    2
                ),
            0
        ) /
        (
            numbers.length -
            1
        );


    return Math.sqrt(
        variance
    );

}


function calculateCV(
    values
) {

    const mean =
        calculateMean(
            values
        );


    const sd =
        calculateSD(
            values
        );


    if (
        mean === null ||
        sd === null ||
        mean === 0
    ) {

        return null;

    }


    return (
        sd /
        mean
    ) *
    100;

}


/* =========================================================
   UNIFORMITY
========================================================= */

function calculateUniformity(
    values,
    percent = 10
) {

    const numbers =
        values
            .map(Number)
            .filter(
                Number.isFinite
            );


    if (!numbers.length) {

        return null;

    }


    const mean =
        calculateMean(
            numbers
        );


    if (
        mean === null ||
        mean === 0
    ) {

        return null;

    }


    const lower =
        mean *
        (
            1 -
            percent / 100
        );


    const upper =
        mean *
        (
            1 +
            percent / 100
        );


    const inside =
        numbers.filter(
            value =>
                value >= lower &&
                value <= upper
        );


    return (
        inside.length /
        numbers.length
    ) *
    100;

}


/* =========================================================
   WEIGHT ANALYSIS
========================================================= */

function calculateWeightAnalysis(
    weights
) {

    const numbers =
        weights
            .map(Number)
            .filter(
                Number.isFinite
            );


    if (!numbers.length) {

        return {

            count: 0,

            mean: null,

            sd: null,

            cv: null,

            uniformity10: null,

            uniformity15: null,

            min: null,

            max: null

        };

    }


    return {

        count:
            numbers.length,

        mean:
            calculateMean(
                numbers
            ),

        sd:
            calculateSD(
                numbers
            ),

        cv:
            calculateCV(
                numbers
            ),

        uniformity10:
            calculateUniformity(
                numbers,
                10
            ),

        uniformity15:
            calculateUniformity(
                numbers,
                15
            ),

        min:
            Math.min(
                ...numbers
            ),

        max:
            Math.max(
                ...numbers
            )

    };

}


/* =========================================================
   FCR
========================================================= */

function calculateFCR(
    feedGrams,
    weightGainGrams
) {

    const feed =
        Number(
            feedGrams
        );

    const gain =
        Number(
            weightGainGrams
        );


    if (
        !Number.isFinite(feed) ||
        !Number.isFinite(gain) ||
        gain <= 0
    ) {

        return null;

    }


    return feed / gain;

}


/* =========================================================
   MORTALITY
========================================================= */

function calculateMortalityRate(
    deaths,
    initialBirds
) {

    const d =
        Number(deaths);

    const n =
        Number(initialBirds);


    if (
        !Number.isFinite(d) ||
        !Number.isFinite(n) ||
        n <= 0
    ) {

        return null;

    }


    return (
        d /
        n
    ) *
    100;

}


function calculateLivability(
    mortalityPercent
) {

    const mortality =
        Number(
            mortalityPercent
        );


    if (
        !Number.isFinite(
            mortality
        )
    ) {

        return null;

    }


    return Math.max(
        0,
        100 -
        mortality
    );

}


/* =========================================================
   WATER / FEED RATIO
========================================================= */

function calculateWaterFeedRatio(
    waterLiters,
    feedKg
) {

    const water =
        Number(
            waterLiters
        );

    const feed =
        Number(
            feedKg
        );


    if (
        !Number.isFinite(water) ||
        !Number.isFinite(feed) ||
        feed <= 0
    ) {

        return null;

    }


    return (
        water /
        feed
    );

}


/* =========================================================
   EGG MASS
========================================================= */

function calculateEggMass(
    productionPercent,
    eggWeight
) {

    const production =
        Number(
            productionPercent
        );

    const weight =
        Number(
            eggWeight
        );


    if (
        !Number.isFinite(
            production
        ) ||
        !Number.isFinite(
            weight
        )
    ) {

        return null;

    }


    return (
        production /
        100
    ) *
    weight;

}


/* =========================================================
   PERSIAN DIGITS
========================================================= */

function toPersianDigits(
    value
) {

    return String(
        value
    )
    .replace(
        /\d/g,
        digit =>
            "۰۱۲۳۴۵۶۷۸۹"
                [digit]
    );

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
        !Number.isFinite(
            Number(value)
        )
    ) {

        return "—";

    }


    return Number(value)
        .toLocaleString(
            "fa-IR",
            {
                minimumFractionDigits:
                    decimals,

                maximumFractionDigits:
                    decimals
            }
        );

}
