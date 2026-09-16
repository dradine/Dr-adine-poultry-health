/* ADINE — FIRST 7 DAY REPORT UI V1
   Compatibility shell for the weekly report.
   Day-by-day UX is implemented separately in broiler-daily-first7-dayview-v1.js.
*/
(function(){
'use strict';
if(window.ADINE_BROILER_FIRST7_REPORT_UI_V1)return;
const $=id=>document.getElementById(id);
function showDaily(){return window.ADINE_BROILER_FIRST7_DAYVIEW_V1?.showDaily?.()}
function showWeekly(){return window.ADINE_BROILER_FIRST7_DAYVIEW_V1?.showWeekly?.()}
window.ADINE_BROILER_FIRST7_REPORT_UI_V1=Object.freeze({showDaily,showWeekly});
})();
