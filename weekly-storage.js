/* =========================================================
   ADINE POULTRY HEALTH CENTER
   WEEKLY DATA STORAGE
   LOCAL STORAGE COMPATIBILITY LAYER
   ========================================================= */

"use strict";


const WEEKLY_STORAGE_NAME =
    "weekly_records";


/* =========================================================
   GET ALL
   ========================================================= */

function getWeeklyRecords() {

    const records =
        readStorage(
            WEEKLY_STORAGE_NAME,
            []
        );


    if (!Array.isArray(records)) {

        return [];

    }


    return records;

}


/* =========================================================
   SAVE
   ========================================================= */

function saveWeeklyRecord(
    record
) {

    if (
        !record ||
        typeof record !== "object"
    ) {

        throw new Error(
            "رکورد هفتگی معتبر نیست."
        );

    }


    const records =
        getWeeklyRecords();


    const item = {

        ...record,

        id:
            record.id ||
            createId("weekly"),

        createdAt:
            record.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    const index =
        records.findIndex(
            itemRecord =>
                itemRecord.id ===
                item.id
        );


    if (index >= 0) {

        records[index] =
            item;

    }

    else {

        records.push(
            item
        );

    }


    writeStorage(
        WEEKLY_STORAGE_NAME,
        records
    );


    return item;

}


/* =========================================================
   UPSERT
   ========================================================= */

function upsertWeeklyRecord(
    record
) {

    return saveWeeklyRecord(
        record
    );

}


/* =========================================================
   DELETE
   ========================================================= */

function deleteWeeklyRecord(
    id
) {

    if (!id) {

        return false;

    }


    const records =
        getWeeklyRecords()
            .filter(
                item =>
                    item.id !==
                    id
            );


    writeStorage(
        WEEKLY_STORAGE_NAME,
        records
    );


    return true;

}


/* =========================================================
   FIND BY ID
   ========================================================= */

function getWeeklyRecord(
    id
) {

    if (!id) {

        return null;

    }


    return getWeeklyRecords()
        .find(
            item =>
                item.id ===
                id
        ) || null;

}


/* =========================================================
   FARM RECORDS
   ========================================================= */

function getFarmWeeklyRecords(
    farmId
) {

    if (!farmId) {

        return [];

    }


    return getWeeklyRecords()
        .filter(
            item =>
                item.farmId ===
                farmId
        )
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
        );

}


/* =========================================================
   FLOCK RECORDS
   ========================================================= */

function getFlockWeeklyRecords(
    flockId
) {

    if (!flockId) {

        return [];

    }


    return getWeeklyRecords()
        .filter(
            item =>
                item.flockId ===
                flockId
        )
        .sort(
            (
                a,
                b
            ) => {

                const ageA =
                    Number(
                        a.ageDays || 0
                    );

                const ageB =
                    Number(
                        b.ageDays || 0
                    );


                if (
                    ageA !==
                    ageB
                ) {

                    return ageA -
                           ageB;

                }


                return String(
                    a.date ||
                    a.evaluationDate ||
                    ""
                ).localeCompare(
                    String(
                        b.date ||
                        b.evaluationDate ||
                        ""
                    )
                );

            }
        );

}


/* =========================================================
   RECORD BY AGE
   ========================================================= */

function getFlockRecordByAge(
    flockId,
    ageDays
) {

    return getFlockWeeklyRecords(
        flockId
    )
    .find(
        item =>
            Number(
                item.ageDays
            ) ===
            Number(
                ageDays
            )
    ) || null;

}


/* =========================================================
   RECORD BY WEEK
   ========================================================= */

function getFlockRecordByWeek(
    flockId,
    weekNumber
) {

    return getFlockWeeklyRecords(
        flockId
    )
    .find(
        item =>
            Number(
                item.weekNumber
            ) ===
            Number(
                weekNumber
            )
    ) || null;

}


/* =========================================================
   RECORD BY DATE
   ========================================================= */

function getFlockRecordByDate(
    flockId,
    date
) {

    if (!date) {

        return null;

    }


    const targetDate =
        String(
            date
        )
        .slice(
            0,
            10
        );


    return getFlockWeeklyRecords(
        flockId
    )
    .find(
        item => {

            const itemDate =
                String(
                    item.date ||
                    item.evaluationDate ||
                    ""
                )
                .slice(
                    0,
                    10
                );


            return itemDate ===
                   targetDate;

        }
    ) || null;

}


/* =========================================================
   CHECK DUPLICATE AGE
   ========================================================= */

function hasLocalWeeklyRecordAtAge(
    flockId,
    ageDays,
    excludeId = null
) {

    return getFlockWeeklyRecords(
        flockId
    )
    .some(
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
   CLEAR FLOCK RECORDS
   ========================================================= */

function clearFlockWeeklyRecords(
    flockId
) {

    if (!flockId) {

        return false;

    }


    const remaining =
        getWeeklyRecords()
            .filter(
                item =>
                    item.flockId !==
                    flockId
            );


    writeStorage(
        WEEKLY_STORAGE_NAME,
        remaining
    );


    return true;

}


/* =========================================================
   CLEAR ALL
   ========================================================= */

function clearAllWeeklyRecords() {

    writeStorage(
        WEEKLY_STORAGE_NAME,
        []
    );


    return true;

}
