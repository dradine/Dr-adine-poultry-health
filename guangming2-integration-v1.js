/* ADINE — GUANGMING NO.2 INTEGRATION V1
   Scope: additive integration only.
   Red-line contract:
   - Do not mutate existing breeder standards.
   - Do not change navigation, flock loading, storage schema or report layout.
   - Official Guangming No.2 objectives are used only where documented in the
     May 2025 performance objective sheet (through day 42).
   - Missing later checkpoints and non-published metrics are explicitly marked
     as management-derived; they never borrow another strain's curve silently.
*/
(function(g){
  'use strict';

  const WEEKLY_AGES=[7,14,21,28,35,42,49,56];
  const OFFICIAL={
    7:  {weight:208, cumulativeFcr:0.803, dailyFeed:35},
    14: {weight:525, cumulativeFcr:1.022, dailyFeed:67.5},
    21: {weight:1011,cumulativeFcr:1.138, dailyFeed:109},
    28: {weight:1620,cumulativeFcr:1.286, dailyFeed:146},
    35: {weight:2299,cumulativeFcr:1.415, dailyFeed:183},
    42: {weight:3027,cumulativeFcr:1.544, dailyFeed:218}
  };
  const MANAGEMENT={49:{weight:3755,cumulativeFcr:1.673},56:{weight:4483,cumulativeFcr:1.802}};
  const INITIAL_WEIGHT=58;
  const SOURCE_OFFICIAL='Guangming No.2 Broiler Performance Objective and Nutrition Specifications — May 2025';
  const SOURCE_URL='https://www.guangmingbio.com/uploads/202511/Guangming-No-2-Broiler-Performance-Objective-and-Nutrition-Specifications-May-2025_1762223814_WNo.pdf';
  const MANAGEMENT_LABEL='استاندارد مدیریتی آدینه — Guangming No.2؛ مقدار رسمی منتشر نشده در منبع breeder';
  const MANAGEMENT_METHOD='official-anchor-plus-strain-specific-linear-extension-after-day-42';

  const MORTALITY=[1,1.2,1.5,1.8,2.2,2.6,3,3.5];
  const CV=[8,8,8,8,8,8,8,8];
  const U10=[79,79,79,79,79,79,79,79];
  const U15=[94,94,94,94,94,94,94,94];
  const WFR=[1.8,1.8,1.8,1.8,1.8,1.8,1.8,1.8];

  function isGM(strain){
    const s=String(strain||'').normalize('NFKC').replace(/\u200c/g,'').trim().toLowerCase();
    return s==='guangming no.2'||s==='guangming no 2'||s==='guangming 2'||s==='guangming2'||s==='guangming no. 2'||
      s==='گوانگمینگ ۲'||s==='گوانگ‌مینگ ۲'||s==='گوانمینگ 2'||s==='گوانمینگ ۲';
  }
  function weeklyRecord(age){
    if(OFFICIAL[age]) return {age,...OFFICIAL[age],sourceType:'official-performance-objective',sourceLabel:SOURCE_OFFICIAL,sourceUrl:SOURCE_URL};
    if(MANAGEMENT[age]) return {age,...MANAGEMENT[age],sourceType:'management-derived',sourceLabel:MANAGEMENT_LABEL,sourceMethod:MANAGEMENT_METHOD};
    return null;
  }
  function cumulativeFeed(age){const r=weeklyRecord(age);return r?(r.weight-INITIAL_WEIGHT)*r.cumulativeFcr:null;}
  function intervalValues(age){
    const i=WEEKLY_AGES.indexOf(age);if(i<0)return null;const cur=weeklyRecord(age);if(!cur)return null;
    const prevAge=i===0?null:WEEKLY_AGES[i-1],prev=prevAge===null?null:weeklyRecord(prevAge);
    const prevWeight=prev?prev.weight:INITIAL_WEIGHT,prevFeed=prev?cumulativeFeed(prevAge):0,curFeed=cumulativeFeed(age);
    const gain=cur.weight-prevWeight;
    return {adg:gain/7,feedDay:(curFeed-prevFeed)/7,intervalFcr:gain>0?(curFeed-prevFeed)/gain:null};
  }
  function managementValue(metric,idx){const map={mortality:MORTALITY,cv:CV,u10:U10,u15:U15,wfr:WFR};const a=map[metric];return a&&idx>=0?a[idx]:null;}

  function target(strain,age,metric){
    if(!isGM(strain))return null;
    const a=Number(age),i=WEEKLY_AGES.indexOf(a);if(i<0)return null;const r=weeklyRecord(a);if(!r)return null;
    const iv=intervalValues(a),base={standardAgeDays:a,requestedAgeDays:a,evaluationWeek:i+1,windowMinDays:a-1,windowMaxDays:a+1};
    const official=r.sourceType==='official-performance-objective',src=official?SOURCE_OFFICIAL:MANAGEMENT_LABEL,type=official?'official-direct':'management-derived';
    const out=(value,sourceType=type,targetType=official?'official-direct':'management-derived')=>value==null?null:{value,sourceType,targetType,sourceLabel:src,...base};
    if(metric==='weight'||metric==='bodyWeight')return out(r.weight);
    if(metric==='cumulativeFcr')return out(r.cumulativeFcr);
    if(metric==='fcr')return out(iv?.intervalFcr);
    if(metric==='adg'||metric==='dailyGain')return out(iv?.adg);
    if(metric==='feed'||metric==='dailyFeed')return out(iv?.feedDay);
    if(metric==='mortality')return out(managementValue('mortality',i),'management-standard','management');
    if(metric==='livability'||metric==='liveability')return out(100-managementValue('mortality',i),'management-derived','management');
    if(metric==='cv')return out(managementValue('cv',i),'management-standard','management');
    if(metric==='u10'||metric==='uniformity10')return out(managementValue('u10',i),'management-standard','management');
    if(metric==='u15'||metric==='uniformity15')return out(managementValue('u15',i),'management-standard','management');
    if(metric==='wfr')return out(managementValue('wfr',i),'management-standard','management');
    if(metric==='water'||metric==='dailyWater')return out(iv?.feedDay!=null?iv.feedDay*managementValue('wfr',i):null,'management-derived','management-derived');
    if(metric==='epef'){
      const livability=100-managementValue('mortality',i),v=livability*r.weight/1000/(a*r.cumulativeFcr)*100;
      return out(v,'management-derived','management-derived');
    }
    return null;
  }

  function installCatalog(){
    try{const c=g.POULTRY_CATALOG;if(c?.broiler?.genetics&&!c.broiler.genetics.some(x=>x.id==='guangming'))c.broiler.genetics.push({id:'guangming',name:'Guangming / گوانگ‌مینگ',strains:['Guangming No.2']});}
    catch(e){console.warn('[GUANGMING2] catalog integration skipped',e);}
  }
  function installIdentityBridge(){
    const old=typeof g.findPoultryStandardIdentity==='function'?g.findPoultryStandardIdentity:null;if(old&&old.__adineGuangming2Wrapped)return;
    const fn=function(type,genetics,strain){if(String(type||'').toLowerCase()==='broiler'&&isGM(strain))return{matched:true,type:'broiler',genetics:'guangming',strain:'Guangming No.2',source:'GUANGMING2-INTEGRATION-V1'};return old?old.apply(this,arguments):{matched:false};};
    fn.__adineGuangming2Wrapped=true;g.findPoultryStandardIdentity=fn;
  }
  function installCanonicalBridge(){
    const old=typeof g.broilerCanonicalMetricTarget==='function'?g.broilerCanonicalMetricTarget:null;if(old&&old.__adineGuangming2Wrapped)return;
    const fn=function(strain,age,metric){const gm=target(strain,age,metric);return gm|| (old?old.apply(this,arguments):null);};fn.__adineGuangming2Wrapped=true;g.broilerCanonicalMetricTarget=fn;
    const oldStd=typeof g.getBroilerOfficialStandard==='function'?g.getBroilerOfficialStandard:null;
    if(oldStd&&!oldStd.__adineGuangming2Wrapped){const sf=function(strain){if(isGM(strain))return{producer:'Guangming',family:'Guangming',variant:'No.2',initialWeight:INITIAL_WEIGHT,sourceYear:2025,sourceType:'official-performance-objective-plus-management-extension',sourceLabel:SOURCE_OFFICIAL,sourceUrl:SOURCE_URL,records:WEEKLY_AGES.map(a=>{const r=weeklyRecord(a);return[a,r.weight,r.cumulativeFcr]})};return oldStd.apply(this,arguments);};sf.__adineGuangming2Wrapped=true;g.getBroilerOfficialStandard=sf;}
  }
  function cloneDailyWithGuangming(existing){
    const S=existing||{},strains={...(S.strains||{})},aliases={...(S.aliases||{})};
    strains['Guangming No.2']={producer:'Guangming',day7WeightG:208,chickWeightG:58,dayWeightG:{1:58,2:71,3:92,4:117,5:145,6:175,7:208},sourceType:'official-anchor+management-derived-daily',sourcePriority:1,source:SOURCE_OFFICIAL,sourceUrl:SOURCE_URL,rationale:'روز ۱ و روز ۷ از داده/اهداف کاتالوگ May 2025؛ روزهای ۲ تا ۶ به‌صورت منحنی یکنواخت مدیریتی مشتق شده‌اند و official daily breeder objective تلقی نمی‌شوند.'};
    ['Guangming No.2','Guangming No 2','Guangming 2','Guangming2','Guangming No. 2','گوانگ‌مینگ ۲','گوانگمینگ ۲','گوانمینگ 2','گوانمینگ ۲'].forEach(k=>aliases[k]='Guangming No.2');
    return Object.freeze({...S,strains,aliases});
  }
  function installDailyBridge(){
    const key='ADINE_BROILER_DAILY_STANDARDS_V1';let current;try{current=g[key];}catch(e){current=undefined;}
    if(current)g[key]=cloneDailyWithGuangming(current);
    try{const desc=Object.getOwnPropertyDescriptor(g,key);if(!desc||desc.configurable){let stored=current;Object.defineProperty(g,key,{configurable:true,enumerable:true,get(){return stored;},set(v){stored=cloneDailyWithGuangming(v);}});}}
    catch(e){console.warn('[GUANGMING2] daily bridge unavailable',e);}
  }
  function installLegacyStandardBridge(){
    const old=typeof g.getStandard==='function'?g.getStandard:null;if(!old||old.__adineGuangming2Wrapped)return;
    const fn=function(type,genetics,strain){if(String(type||'').toLowerCase()==='broiler'&&isGM(strain))return{type:'broiler',genetics:'guangming',strain:'Guangming No.2',sourceType:'official-performance-objective-plus-management-extension',sourceLabel:SOURCE_OFFICIAL,sourceUrl:SOURCE_URL,records:WEEKLY_AGES.map(age=>{const r=weeklyRecord(age);return{ageDays:age,bodyWeight:r.weight,fcr:r.cumulativeFcr,dailyFeed:r.dailyFeed??null};}),management:true};return old.apply(this,arguments);};
    fn.__adineGuangming2Wrapped=true;g.getStandard=fn;
  }

  installCatalog();installIdentityBridge();installCanonicalBridge();installDailyBridge();installLegacyStandardBridge();
  g.ADINE_GUANGMING2={version:'GUANGMING2-INTEGRATION-V1',strain:'Guangming No.2',producer:'Guangming',sourceType:'official-through-day-42-management-extension-after-day-42',sourceLabel:SOURCE_OFFICIAL,sourceUrl:SOURCE_URL,weeklyAges:WEEKLY_AGES.slice(),weeklyRecords:WEEKLY_AGES.map(weeklyRecord),dailyFirst7:{1:58,2:71,3:92,4:117,5:145,6:175,7:208},nutritionPhases:[{phase:'Starter',age:'0–10',meKcalKg:2975,cp:'22–23%',digestibleLysine:'1.40%',authority:'official'},{phase:'Grower',age:'11–24',meKcalKg:3050,cp:'20–22%',digestibleLysine:'1.28%',authority:'official'},{phase:'Finisher 1',age:'25–35',meKcalKg:3150,cp:'19–20%',digestibleLysine:'1.22%',authority:'official'},{phase:'Finisher 2',age:'36–market',meKcalKg:3250,cp:'17–19%',digestibleLysine:'1.18%',authority:'official'}],target(targetAge,metric){return target('Guangming No.2',targetAge,metric);},applyDaily(){try{g.ADINE_BROILER_DAILY_STANDARDS_V1=cloneDailyWithGuangming(g.ADINE_BROILER_DAILY_STANDARDS_V1);}catch(e){}return g.ADINE_BROILER_DAILY_STANDARDS_V1;}};
})(window);
