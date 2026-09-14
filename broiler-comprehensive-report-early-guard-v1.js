/* ADINE — COMPREHENSIVE REPORT EARLY GUARD V2
 * Presentation-only cleanup.
 * The comprehensive report must not block #root while asynchronous presentation
 * layers are loading. Weekly and comparison reports are never gated here.
 */
"use strict";
(function(){
  function cleanup(){
    document.body.classList.remove('adine-comprehensive-pending');
  }
  document.addEventListener('click',function(e){
    const tab=e.target?.closest?.('.report-tab');
    if(tab) cleanup();
  },true);
  cleanup();
})();
