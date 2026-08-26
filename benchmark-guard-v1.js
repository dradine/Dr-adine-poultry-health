/* ADINE POULTRY HEALTH — STRICT BENCHMARK GUARD V1 */
"use strict";
(function(global){
const VERSION="1.0.0";
const norm=v=>String(v??"").normalize("NFKC").toLowerCase().replace(/[\u200c\u200f\u202a-\u202e]/g,"").replace(/[‐‑‒–—−]/g,"-").replace(/[._/\\]+/g," ").replace(/[^a-z0-9\u0600-\u06ff-]+/gi," ").replace(/\s+/g," ").trim();
const type=v=>{const x=norm(v);if(x==="broiler"||x==="goshthi"||x==="گوشتی")return"broiler";if(x==="layer"||x==="layers"||x==="تخمگذار"||x==="تخم گذار"||x==="تخم‌گذار")return"layer";if(x==="breeder"||x==="parent stock"||x==="مادر"||x==="مرغ مادر")return"breeder";if(x==="pullet"||x==="pullets"||x==="پولت")return"pullet";return x||"broiler";};
function exactIdentity(productionType,genetics,strain){
 const t=type(productionType),g=norm(genetics),s=norm(strain);
 const cat=typeof POULTRY_CATALOG!=="undefined"?POULTRY_CATALOG[t]:null;
 if(!cat)return{type:t,geneticsId:g,strain:s,matched:false};
 for(const group of cat.genetics||[]){
   if(norm(group.id)===g){
     const hit=(group.strains||[]).find(x=>norm(x)===s);
     if(hit)return{type:t,geneticsId:group.id,strain:hit,matched:true};
     return{type:t,geneticsId:group.id,strain:s,matched:false};
   }
 }
 for(const group of cat.genetics||[]){
   const hit=(group.strains||[]).find(x=>norm(x)===s);
   if(hit)return{type:t,geneticsId:group.id,strain:hit,matched:true};
 }
 return{type:t,geneticsId:g,strain:s,matched:false};
}
function directStandard(identity){
 if(typeof VERIFIED_STANDARDS==="undefined")return null;
 return VERIFIED_STANDARDS?.[identity.type]?.[identity.geneticsId]?.[identity.strain]||null;
}
function metric(s,m,age){
 if(!s||typeof global.BENCHMARK_CORE_V3!=="object")return null;
 const meta=global.BENCHMARK_CORE_V3.metricAtAge(s,m,age);
 if(!meta||meta.value==null)return null;
 return meta;
}
function resolve({productionType,breed="",strain="",genetics="",ageDays}){
 const id=exactIdentity(productionType,breed||genetics,strain);
 const s=directStandard(id),age=Number(ageDays);
 const out={weight:null,fcr:null,weightSource:null,fcrSource:null,weightSourceLabel:null,fcrSourceLabel:null,sourceType:null,sourceName:null,confidence:"none",fallbackLevel:3,weightFallbackLevel:3,fcrFallbackLevel:3,geneticsId:id.geneticsId||null,strain:id.strain||null,identityMatched:id.matched,strict:true,version:VERSION};
 if(!Number.isFinite(age)||!s)return out;
 const w=metric(s,"bodyWeight",age),f=metric(s,"fcr",age);
 if(w){out.weight=w.value;out.weightSource=w.sourceType;out.weightSourceLabel=w.sourceLabel;out.weightFallbackLevel=w.isFallback?2:0;}
 if(f){out.fcr=f.value;out.fcrSource=f.sourceType;out.fcrSourceLabel=f.sourceLabel;out.fcrFallbackLevel=f.isFallback?2:0;}
 out.fallbackLevel=Math.max(out.weightFallbackLevel,out.fcrFallbackLevel);
 const src=[out.weightSource,out.fcrSource].filter(Boolean); const labels=[out.weightSourceLabel,out.fcrSourceLabel].filter(Boolean);
 out.sourceType=src.length===2&&src[0]===src[1]?src[0]:(src[0]||src[1]||null); out.sourceName=labels.length===2&&labels[0]===labels[1]?labels[0]:(labels[0]||labels[1]||null);
 out.confidence=out.fallbackLevel===0?"official":out.fallbackLevel===2?"management":"none";
 return out;
}
function auditCatalog(){
 const result=[]; const cat=typeof POULTRY_CATALOG!=="undefined"?POULTRY_CATALOG:{};
 for(const [t,v] of Object.entries(cat))for(const g of v.genetics||[])for(const s of g.strains||[]){const exists=directStandard({type:t,geneticsId:g.id,strain:s});result.push({type:t,geneticsId:g.id,strain:s,hasVerifiedStandard:Boolean(exists),sourceType:exists?.sourceType||null,sourceYear:exists?.sourceYear||null});}
 return result;
}
global.ADINE_BENCHMARK_GUARD={VERSION,norm,type,exactIdentity,directStandard,resolve,auditCatalog};
global.resolvePoultryStandard=resolve;
global.ADIN​E_STANDARDS_ENGINE_VERSION="4.0-STRICT-2026".replace("​","");
})(typeof window!=="undefined"?window:globalThis);
