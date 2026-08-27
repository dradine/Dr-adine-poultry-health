/* ADINE REPORT BENCHMARK ADAPTER V1
   Preserves official range metadata for the canonical report engine without changing legacy report APIs.
*/
(function(g){
"use strict";
const previous=g.getReportStandardMeta;
g.getReportStandardMeta=function(standard,metric,age){
  try{
    if(typeof g.getStandardMeta==="function"){
      const m=g.getStandardMeta(standard,metric,age);
      if(m&&m.value!=null)return{value:Number(m.value),low:m.low!=null?Number(m.low):Number(m.value),high:m.high!=null?Number(m.high):Number(m.value),isRange:Boolean(m.isRange||m.low!==m.high),sourceType:m.sourceType||null,sourceLabel:m.sourceLabel||null,isFallback:Boolean(m.isFallback),interpolated:Boolean(m.interpolated)};
    }
  }catch(e){console.warn("benchmark report adapter",e);}
  return typeof previous==="function"?previous(standard,metric,age):{value:null,low:null,high:null,isRange:false,sourceType:null,sourceLabel:null,isFallback:false};
};
g.__ADINE_REPORT_BENCHMARK_ADAPTER_V1=true;
})(window);
