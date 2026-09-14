/* ADINE — CANONICAL BROILER METRIC TARGET LAYER V1
   This is the metric extension of broiler-official-standards-v1.js.
   It never replaces breeder objectives: official weight/cumulative FCR are
   authoritative; weekly FCR, ADG and feed are mathematically derived from
   the canonical curve; mortality/CV/uniformity/water are management targets.
*/
(function(g){'use strict';
const MG=Object.freeze({version:'BROILER-MANAGEMENT-STANDARD-V1',sourceType:'management-standard',sourceLabel:'استاندارد مدیریتی عمومی گوشتی آدینه — CV/یکنواختی بر پایه مثال‌های Ross Broiler Management Handbook 2025 و سایر شاخص‌ها benchmark عملیاتی هستند',sourceYear:2026,ages:[7,14,21,28,35,42,49,56],mortality:[1,1.2,1.5,1.8,2.2,2.6,3,3.5],cv:[8,8,8,8,8,8,8,8],u10:[79,79,79,79,79,79,79,79],u15:[94,94,94,94,94,94,94,94],wfr:[1.8,1.8,1.8,1.8,1.8,1.8,1.8,1.8]});
function n(v){const x=Number(v);return Number.isFinite(x)?x:null}
function rec(a,age){return Array.isArray(a)?a.find(r=>n(r?.[0])===n(age))||null:null}
function target(strain,age,metric){const R=g.BROILER_OFFICIAL_STANDARDS_V1,S=R?.strains?.[strain],ages=R?.weeklyAges||MG.ages;if(!S||!ages.includes(Number(age)))return null;const i=ages.indexOf(Number(age)),o=rec(S.records,age),m=rec(S.managementRecords,age),w=n(o?.[1])??n(m?.[1]),cf=n(o?.[2])??n(m?.[2]),wo=n(o?.[1])!==null,cfo=n(o?.[2])!==null,pa=i>0?ages[i-1]:null,po=pa===null?null:rec(S.records,pa),pm=pa===null?null:rec(S.managementRecords,pa),pw=n(po?.[1])??n(pm?.[1]),pcf=n(po?.[2])??n(pm?.[2]),pwo=n(po?.[1])!==null,pcfo=n(po?.[2])!==null,iw=n(S.initialWeight),feed=w!==null&&cf!==null?cf*(w-iw):null,prevFeed=pa===null?0:(pw!==null&&pcf!==null?pcf*(pw-iw):null),gain=pa===null?(w!==null?w-iw:null):(w!==null&&pw!==null?w-pw:null),weeklyFcr=gain!==null&&gain>0&&feed!==null&&prevFeed!==null?(feed-prevFeed)/gain:null,adg=gain!==null?gain/7:null,feedDay=feed!==null&&prevFeed!==null?(feed-prevFeed)/7:null,mi=MG.ages.indexOf(Number(age)),mort=mi>=0?MG.mortality[mi]:null,cv=mi>=0?MG.cv[mi]:null,u10=mi>=0?MG.u10[mi]:null,u15=mi>=0?MG.u15[mi]:null,wfr=mi>=0?MG.wfr[mi]:null,water=feedDay!==null&&wfr!==null?feedDay*wfr:null,weeklyOfficial=weeklyFcr!==null&&wo&&cfo&&(pa===null||pwo&&pcfo),officialDerived=weeklyOfficial||((wo&&(pa===null||pwo))&&gain!==null),label=S.sourceLabel||'استاندارد رسمی breeder';
const ret=(value,type,source,label2=label)=>value===null?null:{value,targetType:type,sourceType:source,sourceLabel:label2};
if(metric==='weight')return ret(w,wo?'official-direct':'management-fallback',wo?S.sourceType:MG.sourceType,wo?label:MG.sourceLabel);
if(metric==='cumulativeFcr')return ret(cf,cfo?'official-direct':'management-fallback',cfo?S.sourceType:MG.sourceType,cfo?label:MG.sourceLabel);
if(metric==='fcr')return ret(weeklyFcr,weeklyOfficial?'official-derived':'management-derived',weeklyOfficial?'official-derived-from-breeder-objectives':'management-derived',weeklyOfficial?label:MG.sourceLabel);
if(metric==='adg')return ret(adg,officialDerived?'official-derived':'management-derived',officialDerived?'official-derived-from-breeder-objectives':'management-derived',officialDerived?label:MG.sourceLabel);
if(metric==='feed')return ret(feedDay,weeklyOfficial?'official-derived':'management-derived',weeklyOfficial?'official-derived-from-breeder-objectives':'management-derived',weeklyOfficial?label:MG.sourceLabel);
if(metric==='mortality')return ret(mort,'management','management-standard',MG.sourceLabel);
if(metric==='cv')return ret(cv,'management','management-standard',MG.sourceLabel);
if(metric==='u10')return ret(u10,'management','management-standard',MG.sourceLabel);
if(metric==='u15')return ret(u15,'management','management-standard',MG.sourceLabel);
if(metric==='wfr')return ret(wfr,'management','management-standard',MG.sourceLabel);
if(metric==='water')return ret(water,'management-derived','management-derived-from-feed-and-water-ratio',MG.sourceLabel);
if(metric==='epef'){const e=w!==null&&weeklyFcr!==null&&mort!==null?((100-mort)*w)/(Number(age)*weeklyFcr):null;return ret(e,'management-derived','mixed-official-management',MG.sourceLabel)}
return null}
g.BROILER_MANAGEMENT_STANDARD_V1=MG;g.broilerCanonicalMetricTarget=target;
})(typeof window!=='undefined'?window:globalThis);
