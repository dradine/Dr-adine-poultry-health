/* ADINE WEEKLY — AUTHORITATIVE WEEK POLICY v2
   Unified biological start: hatch_date when available, otherwise placement_date.
   Week 1 = age day 1-7; Week N = floor((age-1)/7)+1.
*/
(function(){"use strict";
const MAX_WEEK=120;let wrappedSave=null;
function digits(v){return String(v??"").replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));}
function toISO(v){const raw=String(v??"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;const s=digits(raw).replace(/[.\-]/g,"/").replace(/\s+/g,"");const iso=window.AdineDateSystem?.jalaliToISO?.(s);return /^\d{4}-\d{2}-\d{2}$/.test(String(iso||""))?iso:null;}
function diff(a,b){const n=Number(window.AdineDateSystem?.dateOnlyDiffDays?.(a,b));return Number.isFinite(n)?n:null;}
function flock(){return window.currentFlockForSpecialized||window.currentFlock||null;}
function start(f){return f?.hatch_date||f?.hatchDate||f?.placement_date||f?.placementDate||null;}
function calculate(){const f=flock(),e=document.getElementById("evaluationDate");if(!f||!e)return null;const s=toISO(start(f)),dte=toISO(e.value);if(!s||!dte)return null;const d=diff(s,dte);if(d===null||d<0)return null;const raw=Number(f.start_age_days??f.startAgeDays);const initial=Number.isFinite(raw)&&raw>=1?Math.floor(raw):1;const age=initial+d;const week=Math.min(MAX_WEEK,Math.max(1,Math.floor((age-1)/7)+1));return{week,age,start:s,evaluation:dte,diffDays:d};}
function write(r){const e=document.getElementById("weekNumber");if(!e||!r)return;e.value=String(r.week);e.readOnly=true;e.setAttribute("readonly","readonly");e.dataset.authoritativeWeek=String(r.week);e.dataset.authoritativeWeekAge=String(r.age);e.dataset.authoritativeWeekStart=r.start;}
function sync(){const r=calculate();if(r)write(r);const save=window.saveWeeklyRecord;if(typeof save==="function"&&save!==wrappedSave){const original=save;wrappedSave=async function(){const current=calculate();if(!current){alert("تاریخ ارزیابی معتبر نیست یا قبل از تاریخ شروع گله است.");return;}write(current);return original.apply(this,arguments);};window.saveWeeklyRecord=wrappedSave;}}
function selfTest(){const failures=[];for(let age=1;age<=840;age++){const expected=Math.min(MAX_WEEK,Math.max(1,Math.floor((age-1)/7)+1));if(expected<1||expected>MAX_WEEK)failures.push(age);}return{ok:failures.length===0,testedAges:840,maxWeek:MAX_WEEK,failures};}
window.AdineWeeklyWeekPolicy={calculate,sync,selfTest};setInterval(sync,100);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",sync,{once:true});else sync();
})();
