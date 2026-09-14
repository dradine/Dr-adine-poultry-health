/* ADINE BPI — CANONICAL WEEKLY REFERENCE BRIDGE V3
 * Presentation-only bridge.
 * BPI consumes the same canonical standards already present in the weekly-report model.
 * No independent standards resolver is used here.
 */
(function(global){
'use strict';
if(global.__ADINE_BPI_CANONICAL_WEIGHT_REFERENCE_V3__)return;
global.__ADINE_BPI_CANONICAL_WEIGHT_REFERENCE_V3__=true;
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
function restoreCardFormat(){
  const old=document.getElementById('bpi3-reference-layer-v11-style');
  if(old)old.remove();
  if(document.getElementById('bpi3-reference-layer-v7-compat-style'))return;
  const s=document.createElement('style');s.id='bpi3-reference-layer-v7-compat-style';s.textContent=`
.bpi3-ref-pending{visibility:hidden!important}
.bpi3-reference-card .bpi3-card-value{font-size:15px;line-height:1.7}
.bpi3-ref-summary{display:block;margin-top:5px;font-size:10px;font-weight:800;color:#334155}
.bpi3-ref-detail{display:grid;gap:2px;margin-top:7px;font-size:10px;line-height:1.8}
.bpi3-ref-row{display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed #e2e8f0;padding-bottom:1px}
.bpi3-ref-row:last-child{border-bottom:0}
.bpi3-ref-key{color:#64748b}.bpi3-ref-val{color:#172033;font-weight:700;text-align:left}
.bpi3-ref-interpret{margin-top:7px;padding:7px 8px;border-radius:9px;background:#f8fafc;color:#334155;font-size:10px;line-height:1.9}
.bpi3-reference-card.ref-good .bpi3-ref-interpret{background:#f0fdf4}
.bpi3-reference-card.ref-bad .bpi3-ref-interpret{background:#fef2f2}
.bpi3-reference-card.ref-neutral .bpi3-ref-interpret{background:#f8fafc}`;(document.head||document.documentElement).appendChild(s);
}
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
        const ref=actual/(1+diff/100);
        return {...r,standardWeight:ref,standardWeightSource:r.standardWeightSource??r.weightSource,standardWeightSourceLabel:r.standardWeightSourceLabel??r.weightSourceLabel};
      }
      const stored=n(raw.standard_weight);
      return stored===null?r:{...r,standardWeight:stored};
    });
    return original.call(this,metric,canonical,opts);
  };
  restoreCardFormat();
  return true;
}
if(!patch()){
  let tries=0;
  const timer=setInterval(()=>{if(patch()||++tries>=100)clearInterval(timer)},50);
}
setTimeout(()=>{restoreCardFormat();global.dispatchEvent?.(new Event('adine:report-ready'));},0);
})(typeof window!=='undefined'?window:globalThis);
