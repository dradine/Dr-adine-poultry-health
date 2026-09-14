/* ADINE BPI — CANONICAL WEIGHT REFERENCE BRIDGE V2
 * Presentation-only bridge.
 * The weekly report stores the canonical weight reference and its exact
 * standard_difference_percent. BPI must reproduce that same gap rather than
 * resolving a second reference from week*7.
 */
(function(global){
'use strict';
if(global.__ADINE_BPI_CANONICAL_WEIGHT_REFERENCE_V2__)return;
global.__ADINE_BPI_CANONICAL_WEIGHT_REFERENCE_V2__=true;
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
function patch(){
  const I=global.AdineBroilerReferenceInterpreterV1;
  if(!I||typeof I.build!=='function')return false;
  const original=I.__canonicalOriginalBuild||I.build;
  if(!I.__canonicalOriginalBuild)I.__canonicalOriginalBuild=original;
  I.build=function(metric,rows,opts){
    if(metric!=='weight')return original.call(this,metric,rows,opts);
    const canonical=(rows||[]).map(r=>{
      const raw=r?.raw||{};
      const diff=n(raw.standard_difference_percent);
      const actual=n(r.weight);
      if(diff!==null&&actual!==null&&actual>0){
        /* Reconstruct the exact canonical reference from the stored weekly gap:
           diff% = (actual-reference)/reference * 100. */
        const ref=actual/(1+diff/100);
        return {...r,standardWeight:ref,standardWeightSource:r.standardWeightSource??r.weightSource,standardWeightSourceLabel:r.standardWeightSourceLabel??r.weightSourceLabel};
      }
      const stored=n(raw.standard_weight);
      return stored===null?r:{...r,standardWeight:stored};
    });
    return original.call(this,metric,canonical,opts);
  };
  return true;
}
if(!patch()){
  let tries=0;
  const timer=setInterval(()=>{if(patch()||++tries>=100)clearInterval(timer)},50);
}
/* reference-gap is loaded before this bridge in the current page sequence only
   after the explicit cache/version bump; rerun its presentation pass once the
   bridge is installed so the visible card uses the patched canonical values. */
setTimeout(()=>global.dispatchEvent?.(new Event('adine:report-ready')),0);
})(typeof window!=='undefined'?window:globalThis);
