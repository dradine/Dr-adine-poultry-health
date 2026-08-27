/* =========================================================
   ADINE POULTRY HEALTH CENTER
   WEEKLY DATA STORAGE
   LOCAL STORAGE COMPATIBILITY LAYER
   ========================================================= */

"use strict";

const WEEKLY_STORAGE_NAME = "weekly_records";

function getWeeklyRecords() {
    const records = readStorage(WEEKLY_STORAGE_NAME, []);
    return Array.isArray(records) ? records : [];
}

function saveWeeklyRecord(record) {
    if (!record || typeof record !== "object") throw new Error("رکورد هفتگی معتبر نیست.");
    const records = getWeeklyRecords();
    const item = {
        ...record,
        id: record.id || createId("weekly"),
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const index = records.findIndex(itemRecord => itemRecord.id === item.id);
    if (index >= 0) records[index] = item;
    else records.push(item);
    writeStorage(WEEKLY_STORAGE_NAME, records);
    return item;
}

function upsertWeeklyRecord(record) { return saveWeeklyRecord(record); }

function deleteWeeklyRecord(id) {
    if (!id) return false;
    const records = getWeeklyRecords().filter(item => item.id !== id);
    writeStorage(WEEKLY_STORAGE_NAME, records);
    return true;
}

function getWeeklyRecord(id) {
    if (!id) return null;
    return getWeeklyRecords().find(item => item.id === id) || null;
}

function getFarmWeeklyRecords(farmId) {
    if (!farmId) return [];
    return getWeeklyRecords()
        .filter(item => item.farmId === farmId)
        .sort((a, b) => Number(a.ageDays || 0) - Number(b.ageDays || 0));
}

function getFlockWeeklyRecords(flockId) {
    if (!flockId) return [];
    return getWeeklyRecords()
        .filter(item => item.flockId === flockId)
        .sort((a, b) => {
            const ageA = Number(a.ageDays || 0);
            const ageB = Number(b.ageDays || 0);
            if (ageA !== ageB) return ageA - ageB;
            return String(a.date || a.evaluationDate || "").localeCompare(String(b.date || b.evaluationDate || ""));
        });
}

function getFlockRecordByAge(flockId, ageDays) {
    return getFlockWeeklyRecords(flockId).find(item => Number(item.ageDays) === Number(ageDays)) || null;
}

function getFlockRecordByWeek(flockId, weekNumber) {
    return getFlockWeeklyRecords(flockId).find(item => Number(item.weekNumber) === Number(weekNumber)) || null;
}

function getFlockRecordByDate(flockId, date) {
    if (!date) return null;
    const targetDate = String(date).slice(0, 10);
    return getFlockWeeklyRecords(flockId).find(item => String(item.date || item.evaluationDate || "").slice(0, 10) === targetDate) || null;
}

function hasLocalWeeklyRecordAtAge(flockId, ageDays, excludeId = null) {
    return getFlockWeeklyRecords(flockId).some(record => record.id !== excludeId && Number(record.ageDays) === Number(ageDays));
}

function clearFlockWeeklyRecords(flockId) {
    if (!flockId) return false;
    const remaining = getWeeklyRecords().filter(item => item.flockId !== flockId);
    writeStorage(WEEKLY_STORAGE_NAME, remaining);
    return true;
}

function clearAllWeeklyRecords() {
    writeStorage(WEEKLY_STORAGE_NAME, []);
    return true;
}

(function loadWeeklyFeedWaterFix() {
    if (document.getElementById("weekly-feed-water-fix-script")) return;
    const script = document.createElement("script");
    script.id = "weekly-feed-water-fix-script";
    script.src = "weekly-feed-water-fix.js?v=20260826";
    script.async = false;
    (document.head || document.documentElement).appendChild(script);
})();

(function loadWeeklyDateSaveFix() {
    if (document.getElementById("weekly-date-save-fix-script")) return;
    const load = function () {
        if (document.getElementById("weekly-date-save-fix-script")) return;
        const script = document.createElement("script");
        script.id = "weekly-date-save-fix-script";
        script.src = "weekly-date-save-fix.js?v=20260826";
        script.async = false;
        (document.head || document.documentElement).appendChild(script);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, { once: true });
    else load();
})();

(function loadWeeklyAverageWeightAutofill() {
    if (document.getElementById("weekly-average-weight-autofill-script")) return;
    const load = function () {
        if (document.getElementById("weekly-average-weight-autofill-script")) return;
        const script = document.createElement("script");
        script.id = "weekly-average-weight-autofill-script";
        script.src = "weekly-average-weight-autofill.js?v=20260826-2";
        script.async = false;
        (document.head || document.documentElement).appendChild(script);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, { once: true });
    else load();
})();

/* Automatic week calculation for QUICK WEEKLY ENTRY. */
(function loadWeeklyAutoWeek() {
    if (document.getElementById("weekly-auto-week-script")) return;
    const load = function () {
        if (document.getElementById("weekly-auto-week-script")) return;
        const script = document.createElement("script");
        script.id = "weekly-auto-week-script";
        script.src = "weekly-auto-week.js?v=20260827-v2";
        script.async = false;
        (document.head || document.documentElement).appendChild(script);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, { once: true });
    else load();
})();
