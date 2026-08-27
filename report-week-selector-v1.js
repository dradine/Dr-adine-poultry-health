/* ADINE LEGACY WEEK SELECTOR COMPATIBILITY LAYER
   Intentionally does not create UI, filter weekly_records, reload the page,
   or override any report data function. The Reports page now uses
   reports-root-controller-v10.js + report-period-data-adapter-v11.js as its
   single period pipeline.
*/
(function(w){
'use strict';
w.__ADINE_REPORT_WEEK_SELECTOR_LEGACY_DISABLED__=true;
})(window);