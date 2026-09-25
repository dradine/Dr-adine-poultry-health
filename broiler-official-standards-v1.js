/* ADINE — CANONICAL BROILER STANDARDS ENGINE V4
   SINGLE SOURCE OF TRUTH for all broiler official + management targets.
   Consumers MUST resolve broiler targets through this engine only.
   Official breeder objectives are authoritative where published; explicit
   management fallbacks live here when breeder documents do not publish the
   required metric/week. Derived metrics are calculated here.
*/
const BROILER_OFFICIAL_STANDARDS_V1=Object.freeze({
  productionType:"broiler",version:"BROILER-CANONICAL-STANDARDS-V4.1",weeklyAges:[7,14,21,28,35,42,49,56],
  managementProfile:Object.freeze({sourceType:"management-standard",sourceYear:2026,sourceLabel:"استاندارد مدیریتی گوشتی آدینه — شاخص‌های عملیاتی و CV/یکنواختی بر پایه منابع مدیریتی مستند",epefReference:505,epefGood:450,epefAcceptable:430,epefWatch:400,mortality:[1,1.2,1.5,1.8,2.2,2.6,3,3.5],cv:[8,8,8,8,8,8,8,8],u10:[79,79,79,79,79,79,79,79],u15:[94,94,94,94,94,94,94,94],wfr:[1.8,1.8,1.8,1.8,1.8,1.8,1.8,1.8]}),
  managementFallbackMethod:"STRAIN-SPECIFIC-DOCUMENTED-DERIVATION-OR-CROSS-CATALOG-MEDIAN-V4",
  strains:{
    "Ross 308":{producer:"Aviagen",family:"Ross",variant:"As-Hatched",initialWeight:44,sourceYear:2022,sourceType:"official-performance-objective",sourceLabel:"Ross 308 / Ross 308 FF Broiler Performance Objectives 2022",sourceUrl:"https://aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf",records:[[7,213,.780],[14,533,1.005],[21,1012,1.142],[28,1616,1.269],[35,2296,1.399],[42,2998,1.531],[49,3681,1.663],[56,4318,1.793]]},
    "Ross 308 FF":{producer:"Aviagen",family:"Ross",variant:"Fast-Feathering / As-Hatched",initialWeight:44,sourceYear:2022,sourceType:"official-performance-objective",sourceLabel:"Ross 308 / Ross 308 FF Broiler Performance Objectives 2022",sourceUrl:"https://aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf",records:[[7,213,.780],[14,533,1.005],[21,1012,1.142],[28,1616,1.269],[35,2296,1.399],[42,2998,1.531],[49,3681,1.663],[56,4318,1.793]]},
    "Ross 708":{producer:"Aviagen",family:"Ross",variant:"As-Hatched",initialWeight:44,sourceYear:2022,sourceType:"official-performance-objective",sourceLabel:"Ross 708 Broiler Performance Objectives 2022",sourceUrl:"https://aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss708-BroilerPerformanceObjectives2022-EN.pdf",records:[[7,204,.770],[14,509,.992],[21,966,1.127],[28,1543,1.254],[35,2191,1.382],[42,2862,1.512],[49,3514,1.642],[56,4122,1.771]]},
    "Ross 308 AP":{producer:"Aviagen",family:"Ross",variant:"As-Hatched",initialWeight:44,sourceYear:2022,sourceType:"official-performance-objective",sourceLabel:"Ross 308 AP Broiler Performance Objectives 2022",sourceUrl:"https://aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308AP-BroilerPerformanceObjectives2022-EN.pdf",records:[[7,214,.772],[14,540,.995],[21,1033,1.130],[28,1657,1.257],[35,2360,1.386],[42,3086,1.516],[49,3791,1.646],[56,4446,1.776]]},
    "Cobb500":{producer:"Cobb",family:"Cobb",variant:"As-Hatched",initialWeight:42,sourceYear:2022,sourceType:"official-performance-objective",sourceLabel:"Cobb500 Broiler Performance & Nutrition Supplement 2022",sourceUrl:"https://www.cobbgenetics.com/assets/Cobb-Files/2022-Cobb500-Broiler-Performance-Nutrition-Supplement.pdf",records:[[7,202,.891],[14,570,1.029],[21,1116,1.182],[28,1783,1.322],[35,2521,1.441],[42,3278,1.555],[49,4001,1.686],[56,4641,1.842]]},
    "Cobb800":{producer:"Cobb",family:"Cobb",variant:"As-Hatched",initialWeight:43,sourceYear:2026,sourceType:"official-performance-objective",sourceLabel:"Cobb800 Broiler Nutrition and Management Supplement 2026",sourceUrl:"https://www.cobbgenetics.com/assets/Cobb-Files/Cobb800_5-2026_Digital.pdf",records:[[7,202,.825],[14,461,1.046],[21,951,1.163],[28,1583,1.281],[35,2297,1.400],[42,3036,1.520],[49,3742,1.639],[56,4358,1.762]]},
    "Arbor Acres Plus":{producer:"Aviagen",family:"Arbor Acres",variant:"As-Hatched",initialWeight:42,sourceYear:2022,sourceType:"official-performance-objective",sourceLabel:"Arbor Acres Plus / Plus S Broiler Performance Objectives 2022",sourceUrl:"https://aviagen.com/assets/Tech_Center/AA_Broiler/ArborAcres-BroilerPerformanceObjectives2022-EN.pdf",records:[[7,209,.803],[14,527,1.021],[21,1006,1.157],[28,1611,1.285],[35,2287,1.416],[42,2981,1.548],[49,3649,1.680],[56,4263,1.810]]},
    "Arbor Acres Plus S":{producer:"Aviagen",family:"Arbor Acres",variant:"Sexable / As-Hatched",initialWeight:42,sourceYear:2022,sourceType:"official-performance-objective-family",sourceLabel:"Arbor Acres Plus / Plus S Broiler Performance Objectives 2022",sourceUrl:"https://aviagen.com/assets/Tech_Center/AA_Broiler/ArborAcres-BroilerPerformanceObjectives2022-EN.pdf",records:[[7,209,.803],[14,527,1.021],[21,1006,1.157],[28,1611,1.285],[35,2287,1.416],[42,2981,1.548],[49,3649,1.680],[56,4263,1.810]]},
    "Indian River":{producer:"Aviagen",family:"Indian River",variant:"As-Hatched",initialWeight:44,sourceYear:2022,sourceType:"official-performance-objective",sourceLabel:"Indian River / Indian River FF Broiler Performance Objectives 2022",sourceUrl:"https://aviagen.com/assets/Tech_Center/LIR_Broiler/IndianRiver-BroilerPerformanceObjectives2022-EN.pdf",records:[[7,211,.788],[14,531,1.003],[21,1010,1.142],[28,1616,1.275],[35,2295,1.411],[42,2995,1.549],[49,3671,1.686],[56,4297,1.822]]},
    "Indian River FF":{producer:"Aviagen",family:"Indian River",variant:"Fast-Feathering / As-Hatched",initialWeight:44,sourceYear:2022,sourceType:"official-performance-objective",sourceLabel:"Indian River / Indian River FF Broiler Performance Objectives 2022",sourceUrl:"https://aviagen.com/assets/Tech_Center/LIR_Broiler/IndianRiver-BroilerPerformanceObjectives2022-EN.pdf",records:[[7,211,.788],[14,531,1.003],[21,1010,1.142],[28,1616,1.275],[35,2295,1.411],[42,2995,1.549],[49,3671,1.686],[56,4297,1.822]]},
    "Efficiency Plus":{producer:"Hubbard",family:"Efficiency Plus",variant:"As-Hatched",initialWeight:43,sourceYear:2025,sourceType:"official-performance-objective-partial",sourceLabel:"Hubbard Efficiency Plus Broiler Performance Objectives",sourceUrl:"https://www.hubbardbreeders.com/media/broiler-performance-objectives-hep-enfres-1.pdf",records:[[7,216,null],[14,541,null],[21,1035,1.13],[28,1647,1.27],[35,2330,1.41],[42,3028,1.54],[49,3704,1.67],[56,4324,1.80]],managementRecords:[[7,null,.960],[14,null,1.074]],managementMethod:"strain-specific-derived-from-official-cumulative-feed-and-bodyweight-at-placement"},
    "Hubbard EDGE":{producer:"Hubbard",family:"EDGE",variant:"As-Hatched",initialWeight:43,sourceYear:2025,sourceType:"official-performance-objective",sourceLabel:"Hubbard EDGE Broiler Performance Objectives",sourceUrl:"https://www.hubbardbreeders.com/media/broiler-performance-objectives-edge-en.pdf",records:[[7,217,null],[14,550,null],[21,1058,1.13],[28,1685,1.26],[35,2383,1.38],[42,3098,1.51],[49,3789,1.64],[56,4423,1.77]],managementRecords:[[7,null,.971],[14,null,1.073]],managementMethod:"strain-specific-derived-from-official-cumulative-feed-and-bodyweight-at-placement"},
    "Arian":{producer:"آرین ایران",family:"Arian",variant:"مدیریتی / مواد غذایی متراکم",initialWeight:42,sourceYear:null,sourceType:"management-standard-reference",sourceLabel:"راهنمای پرورش جوجه آرین — مرجع مدیریتی داخلی؛ غیر breeder-performance-objective",sourceUrl:"https://poshal.blogfa.com/post/10/%D8%B1%D8%A7%D9%87%D9%86%D9%85%D8%A7%DB%8C-%D9%BE%D8%B1%D8%B1%D8%B4-%D8%AC%D9%88%D8%AC%D9%87-%D8%A2%D8%B1%DB%8C%D9%86-",records:[],managementRecords:[[7,148,1.00],[14,391,1.30],[21,767,1.41],[28,1291,1.52],[35,1830,1.63],[42,2340,1.76],[49,2890,1.87],[56,3440,1.98]],managementMethod:"documented-domestic-management-reference-plus-linear-last-interval-extrapolation"}
  }
});
(function(g){
  const R=BROILER_OFFICIAL_STANDARDS_V1,A=R.weeklyAges,M=R.managementProfile;
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(v);return Number.isFinite(x)?x:null};
  const rec=(a,age)=>Array.isArray(a)?a.find(r=>n(r?.[0])===n(age))||null:null;
  /* A broiler measurement belongs to a weekly evaluation point when it is
     within +/-1 day of the catalogue age. This is intentionally centralized
     here so every broiler report/PI consumer uses the same age mapping. */
  const ageWindow=Object.freeze(A.reduce((out,standardAge,i)=>{out[standardAge]=Object.freeze({min:standardAge-1,max:standardAge+1,week:i+1});return out},{}));
  function resolveEvaluationAge(age){
    const a=n(age);if(a===null)return null;
    let best=null,bestDistance=Infinity;
    for(const standardAge of A){const w=ageWindow[standardAge];if(a>=w.min&&a<=w.max){const d=Math.abs(a-standardAge);if(d<bestDistance){best=standardAge;bestDistance=d}}}
    return best;
  }
  function resolveEvaluationWeek(age){const a=resolveEvaluationAge(age);return a===null?null:A.indexOf(a)+1}
  function target(strain,age,metric){
    const s=R.strains?.[strain],requestedAge=n(age),a=resolveEvaluationAge(requestedAge);if(!s||a===null)return null;
    const i=A.indexOf(a),o=rec(s.records,a),m=rec(s.managementRecords,a),iw=n(s.initialWeight);
    const w=n(o?.[1])??n(m?.[1]),cf=n(o?.[2])??n(m?.[2]);
    const prevAge=i>0?A[i-1]:null,po=prevAge===null?null:rec(s.records,prevAge),pm=prevAge===null?null:rec(s.managementRecords,prevAge);
    const pw=n(po?.[1])??n(pm?.[1]),pcf=n(po?.[2])??n(pm?.[2]);
    const feed=w!==null&&cf!==null&&iw!==null?cf*(w-iw):null,prevFeed=prevAge===null?0:(pw!==null&&pcf!==null&&iw!==null?pcf*(pw-iw):null),gain=prevAge===null?(w!==null&&iw!==null?w-iw:null):(w!==null&&pw!==null?w-pw:null);
    let weeklyFcr=feed!==null&&prevFeed!==null&&gain!==null&&gain>0?(feed-prevFeed)/gain:null; if(weeklyFcr===null&&i===0&&cf!==null&&w!==null&&iw!==null&&w>iw) weeklyFcr=cf; const adg=gain!==null?gain/7:null,feedDay=feed!==null&&prevFeed!==null?(feed-prevFeed)/7:null,mi=A.indexOf(a);
    const managementMetric=k=>mi>=0?(M?.[k]?.[mi]??null):null;
    const officialWeight=n(o?.[1])!==null,officialCf=n(o?.[2])!==null,previousOfficial=prevAge===null||(n(po?.[1])!==null&&n(po?.[2])!==null),officialDerived=(officialWeight&&officialCf&&previousOfficial);
    const ret=(value,targetType,sourceType,label)=>value===null?null:{value,targetType,sourceType,sourceLabel:label,standardAgeDays:a,requestedAgeDays:requestedAge,evaluationWeek:i+1,windowMinDays:ageWindow[a].min,windowMaxDays:ageWindow[a].max};
    const officialLabel=s.sourceLabel||'استاندارد رسمی breeder';const mgmtLabel=M?.sourceLabel||'استاندارد مدیریتی کاننیکال';
    if(metric==='weight')return ret(w,officialWeight?'official-direct':'management-fallback',officialWeight?s.sourceType:M.sourceType,officialWeight?officialLabel:mgmtLabel);
    if(metric==='cumulativeFcr')return ret(cf,officialCf?'official-direct':'management-fallback',officialCf?s.sourceType:M.sourceType,officialCf?officialLabel:mgmtLabel);
    if(metric==='fcr')return ret(weeklyFcr,officialDerived?'official-derived':'management-derived',officialDerived?'official-derived-from-breeder-objectives':'management-derived',officialDerived?officialLabel:mgmtLabel);
    if(metric==='adg')return ret(adg,officialDerived?'official-derived':'management-derived',officialDerived?'official-derived-from-breeder-objectives':'management-derived',officialDerived?officialLabel:mgmtLabel);
    if(metric==='feed')return ret(feedDay,officialDerived?'official-derived':'management-derived',officialDerived?'official-derived-from-breeder-objectives':'management-derived',officialDerived?officialLabel:mgmtLabel);
    if(['mortality','cv','u10','u15','wfr'].includes(metric)){const key={mortality:'mortality',cv:'cv',u10:'u10',u15:'u15',wfr:'wfr'}[metric],v=managementMetric(key);return ret(v,'management','management-standard',mgmtLabel)}
    if(metric==='water'){const v=feedDay!==null&&managementMetric('wfr')!==null?feedDay*managementMetric('wfr'):null;return ret(v,'management-derived','management-derived-from-feed-and-water-ratio',mgmtLabel)}
    if(metric==='epef'){const v=Number.isFinite(Number(M.epefReference))?Number(M.epefReference):505;return ret(v,'industry-benchmark','industry-benchmark',`مرجع عملکرد صنعتی EPEF — ${v}`)}
    return null;
  }
  function get(strain){const s=R.strains?.[strain];if(!s)return null;return {...s,records:A.map(age=>{const o=rec(s.records,age),m=rec(s.managementRecords,age);return [age,o?.[1]??m?.[1]??null,o?.[2]??m?.[2]??null]})};}
  g.BROILER_OFFICIAL_STANDARDS_V1=R;g.getBroilerOfficialStandard=get;g.broilerCanonicalMetricTarget=target;g.resolveBroilerEvaluationAge=resolveEvaluationAge;g.resolveBroilerEvaluationWeek=resolveEvaluationWeek;g.BROILER_STANDARD_AGE_WINDOW=ageWindow;
})(typeof window!=='undefined'?window:globalThis);

/* Runtime quarantine: standard-data.js is a shared legacy catalog for the
   other production types. Its historical broiler registry is not an active
   source. Remove that branch before any consumer can resolve it. */
(function(g){
  try{if(g.VERIFIED_STANDARDS&&Object.prototype.hasOwnProperty.call(g.VERIFIED_STANDARDS,'broiler'))delete g.VERIFIED_STANDARDS.broiler;}catch(e){}
  const canonical=g.getStandard;
  if(typeof canonical==='function'){
    g.getStandard=function(type,genetics,strain){
      const t=String(type??'').normalize('NFKC').toLowerCase();
      if(t==='broiler'||t==='broilers'||t==='گوشتی'){
        const s=g.BROILER_OFFICIAL_STANDARDS_V1?.strains?.[strain];
        return s?g.getBroilerOfficialStandard(strain):null;
      }
      return canonical.apply(this,arguments);
    };
  }
  g.ADINE_BROILER_STANDARD_AUTHORITY='BROILER_OFFICIAL_STANDARDS_V1';
})(typeof window!=='undefined'?window:globalThis);
