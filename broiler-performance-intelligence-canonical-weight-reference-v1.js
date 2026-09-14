/* ADINE BPI — CANONICAL WEIGHT REFERENCE BRIDGE V1
 * Presentation-only bridge.
 * The weekly_records.standard_weight value is the canonical reference stored by
 * the weekly-report path. Use it for BPI trend interpretation when available.
 * No calculations are written back and no independent standards resolver is used.
 */
(function(global){
'use strict';
if(global.__ADINE_BPI_CANONICAL_WEIGHT_REFERENCE_V1__)return;
global.__ADINE_BPI_CANONICAL_WEIGHT_REFERENCE_V1__=true;
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
function patch(){
  const I=global.AdineBroilerReferenceInterpreterV1;
  if(!I||typeof I.build!=='function')return false;
  if(I.__canonicalWeightReferenceV1)return true;
  const original=I.build;
  I.build=function(metric,rows,opts){
    if(metric!=='weight')return original.call(this,metric,rows,opts);
    const canonical=(rows||[]).map(r=>{
      const raw=r?.raw||{};
      const stored=n(raw.standard_weight);
      return stored===null?r:{...r,standardWeight:stored};
    });
    return original.call(this,metric,canonical,opts);
  };
  I.__canonicalWeightReferenceV1=true;
  return true;
}
if(!patch()){
  let tries=0;
  const timer=setInterval(()=>{if(patch()||++tries>=100)clearInterval(timer)},50);
}
})(typeof window!=='undefined'?window:globalThis);
