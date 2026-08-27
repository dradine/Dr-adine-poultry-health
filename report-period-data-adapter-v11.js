/* ADINE REPORT PERIOD DATA ADAPTER V11
   Single responsibility: constrain the existing report data to the selected
   biological week without touching the weekly_records table or creating UI.
*/
(function(w){
'use strict';
if(w.__ADINE_REPORT_PERIOD_ADAPTER_V11__) return;
w.__ADINE_REPORT_PERIOD_ADAPTER_V11__=true;
function n(v){if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/,/g,'').trim());return Number.isFinite(x)?x:null}
function biologicalWeek(r){const age=n(r?.ageDays??r?.age_days);if(age!=null&&age>=1)return Math.floor((age-1)/7)+1;const wk=n(r?.weekNumber??r?.week_number);return wk!=null&&wk>=1?Math.trunc(wk):null}
function sort(rows){return rows.slice().sort((a,b)=>(n(a?.ageDays??a?.age_days)||0)-(n(b?.ageDays??b?.age_days)||0))}
function install(){
  if(typeof w.getCompleteReportData!=='function')return false;
  if(w.getCompleteReportData.__adineV11)return true;
  const original=w.getCompleteReportData;
  const wrapped=async function(flockId){
    const result=await original(flockId);
    if(!result||!Array.isArray(result.records))return result;
    const all=sort(result.records);
    const weeks=[...new Set(all.map(biologicalWeek).filter(Number.isInteger))].sort((a,b)=>a-b);
    let selected=n(w.__adineSelectedReportWeek);
    if(selected!=null && !weeks.includes(selected))selected=null;
    if(selected==null && w.__adineReportPeriodExplicit===true){
      result.records=[];
    }else if(selected!=null){
      result.records=all.filter(r=>{const wk=biologicalWeek(r);return wk!=null&&wk<=selected});
    }else{
      result.records=all;
    }
    result.records=sort(result.records);
    result.__allRecords=all;
    result.__availableWeeks=weeks;
    result.__selectedWeek=selected;
    return result;
  };
  wrapped.__adineV11=true;
  wrapped.__adineOriginal=original;
  w.__adineOriginalGetCompleteReportData=original;
  w.getCompleteReportData=wrapped;
  return true;
}
if(install())return;
let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>240)clearInterval(timer)},50);
})(window);