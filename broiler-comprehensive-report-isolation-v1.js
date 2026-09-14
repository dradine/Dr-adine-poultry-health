/* ADINE — COMPREHENSIVE REPORT ISOLATION V2
 * Presentation-only cleanup.
 * The report orchestrator owns report-tab visibility. This layer must not hide
 * #root or gate the weekly/comparison views while the comprehensive presentation
 * is being assembled.
 */
"use strict";
(function(){
  function cleanup(){
    document.body.classList.remove('adine-comprehensive-active');
    document.body.classList.add('adine-comprehensive-ready');
    const root=document.getElementById('root');
    if(root){root.style.visibility='';}
  }
  document.addEventListener('click',function(e){
    const tab=e.target?.closest?.('.report-tab');
    if(tab) cleanup();
  },true);
  cleanup();
})();
