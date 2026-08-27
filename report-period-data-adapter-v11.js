/* ADINE REPORT PERIOD DATA ADAPTER V12
   Canonical data bridge between weekly_records and Reports.
   - Derives biological week from age_days when week_number is missing/invalid.
   - Applies selected-period filtering after the report engine has calculated standards.
   - Never mutates database rows.
*/
(function(w){
'use strict';
if(w.__ADINE_REPORT_PERIOD_ADAPTER_V12__)return;
w.__ADINE_REPORT_PERIOD_ADAPTER_V12__=true;
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/,/g,'').trim());return Number.isFinite(x)?x:null};
const biologicalWeek=r=>{const age=n(r?.ageDays??r?.age_days);if(age!=null&&age>=1)return Math.floor((age-1)/7)+1;const wk=n(r?.weekNumber??r?.week_number);return wk!=null&&wk>=1?Math.trunc(wk):null};
const sort=rows=>rows.slice().sort((a,b)=>(n(a?.ageDays??a?.age_days)||0)-(n(b?.ageDays??b?.age_days)||0));
function installWeeklyNormalizer(){
  if(typeof w.getReportWeeklyRecords!=='function')return false;
  if(w.getReportWeeklyRecords.__adineV12)return true;
  const original=w.getReportWeeklyRecords;
  const wrapped=async function(flockId){
    const rows=await original(flockId);
    return (Array.isArray(rows)?rows:[]).map(r=>{
      const copy={...r};
      const bw=biologicalWeek(copy);
      if(bw!=null)copy.week_number=bw;
      return copy;
    });
  };
  wrapped.__adineV12=true;wrapped.__adineOriginal=original;
  w.__adineOriginalGetReportWeeklyRecords=original;
  w.getReportWeeklyRecords=wrapped;
  return true;
}
function installPeriodFilter(){
  if(typeof w.getCompleteReportData!=='function')return false;
  if(w.getCompleteReportData.__adineV12)return true;
  const original=w.getCompleteReportData;
  const wrapped=async function(flockId){
    const result=await original(flockId);
    if(!result||!Array.isArray(result.records))return result;
    const all=sort(result.records);
    const weeks=[...new Set(all.map(biologicalWeek).filter(Number.isInteger))].sort((a,b)=>a-b);
    let selected=n(w.__adineSelectedReportWeek);
    if(selected!=null&&!weeks.includes(selected))selected=null;
    if(selected!=null)result.records=all.filter(r=>{const wk=biologicalWeek(r);return wk!=null&&wk<=selected});
    else result.records=all;
    result.records=sort(result.records);
    result.__allRecords=all;result.__availableWeeks=weeks;result.__selectedWeek=selected;
    return result;
  };
  wrapped.__adineV12=true;wrapped.__adineOriginal=original;
  w.__adineOriginalGetCompleteReportData=original;
  w.getCompleteReportData=wrapped;
  return true;
}
function install(){const a=installWeeklyNormalizer();const b=installPeriodFilter();return a&&b}
if(install())return;
let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>300)clearInterval(timer)},50);
})(window);