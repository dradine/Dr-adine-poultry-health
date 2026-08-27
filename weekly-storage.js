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
    const item = { ...record, id: record.id || createId("weekly"), createdAt: record.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    const index = records.findIndex(itemRecord => itemRecord.id === item.id);
    if (index >= 0) records[index] = item; else records.push(item);
    writeStorage(WEEKLY_STORAGE_NAME, records);
    return item;
}
function upsertWeeklyRecord(record) { return saveWeeklyRecord(record); }
function deleteWeeklyRecord(id) { if (!id) return false; writeStorage(WEEKLY_STORAGE_NAME, getWeeklyRecords().filter(item => item.id !== id)); return true; }
function getWeeklyRecord(id) { return id ? getWeeklyRecords().find(item => item.id === id) || null : null; }
function getFarmWeeklyRecords(farmId) { return farmId ? getWeeklyRecords().filter(item => item.farmId === farmId).sort((a,b) => Number(a.ageDays||0)-Number(b.ageDays||0)) : []; }
function getFlockWeeklyRecords(flockId) { return flockId ? getWeeklyRecords().filter(item => item.flockId === flockId).sort((a,b) => Number(a.ageDays||0)-Number(b.ageDays||0)) : []; }
function getFlockRecordByAge(flockId, ageDays) { return getFlockWeeklyRecords(flockId).find(item => Number(item.ageDays) === Number(ageDays)) || null; }
function getFlockRecordByWeek(flockId, weekNumber) { return getFlockWeeklyRecords(flockId).find(item => Number(item.weekNumber) === Number(weekNumber)) || null; }
function getFlockRecordByDate(flockId, date) { const target = String(date||"").slice(0,10); return getFlockWeeklyRecords(flockId).find(item => String(item.date || item.evaluationDate || "").slice(0,10) === target) || null; }
function hasLocalWeeklyRecordAtAge(flockId, ageDays, excludeId=null) { return getFlockWeeklyRecords(flockId).some(r => r.id !== excludeId && Number(r.ageDays) === Number(ageDays)); }
function clearFlockWeeklyRecords(flockId) { if (!flockId) return false; writeStorage(WEEKLY_STORAGE_NAME, getWeeklyRecords().filter(item => item.flockId !== flockId)); return true; }
function clearAllWeeklyRecords() { writeStorage(WEEKLY_STORAGE_NAME, []); return true; }

(function loadWeeklyFeedWaterFix(){
    if(document.getElementById("weekly-feed-water-fix-script")) return;
    const s=document.createElement("script"); s.id="weekly-feed-water-fix-script"; s.src="weekly-feed-water-fix.js?v=20260826"; s.async=false; (document.head||document.documentElement).appendChild(s);
})();
(function loadWeeklyDateSaveFix(){
    if(document.getElementById("weekly-date-save-fix-script")) return;
    const load=()=>{ if(document.getElementById("weekly-date-save-fix-script")) return; const s=document.createElement("script"); s.id="weekly-date-save-fix-script"; s.src="weekly-date-save-fix.js?v=20260826"; s.async=false; (document.head||document.documentElement).appendChild(s); };
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",load,{once:true}); else load();
})();
(function loadWeeklyAverageWeightAutofill(){
    if(document.getElementById("weekly-average-weight-autofill-script")) return;
    const load=()=>{ if(document.getElementById("weekly-average-weight-autofill-script")) return; const s=document.createElement("script"); s.id="weekly-average-weight-autofill-script"; s.src="weekly-average-weight-autofill.js?v=20260826-2"; s.async=false; (document.head||document.documentElement).appendChild(s); };
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",load,{once:true}); else load();
})();
(function loadWeeklyAutoWeek(){
    if(document.getElementById("weekly-auto-week-script")) return;
    const load=()=>{ if(document.getElementById("weekly-auto-week-script")) return; const s=document.createElement("script"); s.id="weekly-auto-week-script"; s.src="weekly-auto-week.js?v=20260827-v3"; s.async=false; (document.head||document.documentElement).appendChild(s); };
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",load,{once:true}); else load();
})();
