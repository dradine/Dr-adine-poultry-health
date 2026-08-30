/* ADINE POULTRY HEALTH — VERIFIED STANDARD OVERRIDES V2 */
"use strict";
(function(g){
 if(typeof VERIFIED_STANDARDS==="undefined") return;
 const rec=(age,bodyWeight,fcr,dailyFeed,cumulativeFeed)=>{const r={ageDays:age};if(bodyWeight!=null)r.bodyWeight=bodyWeight;if(fcr!=null)r.fcr=fcr;if(dailyFeed!=null)r.dailyFeed=dailyFeed;if(cumulativeFeed!=null)r.cumulativeFeed=cumulativeFeed;return r;};
 const range=(age,m,low,high)=>{const r={ageDays:age};r[m]={low,high};return r;};
 const ross=VERIFIED_STANDARDS.broiler?.aviagen_ross?.["Ross 308"];
 if(ross)VERIFIED_STANDARDS.broiler.aviagen_ross["Ross 308 FF"]={...ross,sourceYear:2022,sourceLabel:"Aviagen Ross 308 / Ross 308 FF Broiler Performance Objectives 2022 — official breeder document",sourceUrl:"https://aviagen.com/eu/brands/ross/products/ross-308",sourceDocumentUrl:"https://aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf"};
 const cobb=VERIFIED_STANDARDS.broiler?.cobb?.Cobb500;
 if(cobb){cobb.records=[rec(0,42),...cobb.records];cobb.sourceUrl="https://www.cobbgenetics.com/assets/Cobb-Files/2022-Cobb500-Broiler-Performance-Nutrition-Supplement.pdf";}
 VERIFIED_STANDARDS.broiler.aviagen_ross["Ross 708"]={sourceYear:2022,sourceType:"official-performance-objective",sourceLabel:"Aviagen Ross 708 Broiler Performance Objectives 2022 (As-Hatched)",sourceUrl:"https://aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss708-BroilerPerformanceObjectives2022-EN.pdf",records:[rec(0,44),rec(1,59),rec(2,77,.347,27),rec(3,97,.470,46),rec(4,119,.569,68),rec(5,145,.650,94),rec(6,173,.715,123),rec(7,204,.770,157),rec(8,238,.816,194),rec(9,275,.855,235),rec(10,315,.889,280),rec(11,359,.918,329),rec(12,406,.945,383),rec(13,456,.970,442),rec(14,509,.992,505),rec(15,565,1.013,573),rec(16,625,1.034,646),rec(17,687,1.053,724),rec(18,753,1.072,807),rec(19,821,1.091,896),rec(20,892,1.109,990),rec(21,966,1.127,1089),rec(22,1042,1.145,1194),rec(23,1120,1.164,1304),rec(24,1201,1.182,1419),rec(25,1284,1.200,1540),rec(26,1369,1.218,1666),rec(27,1455,1.236,1798),rec(28,1543,1.254,1934),rec(29,1633,1.272,2076),rec(30,1723,1.290,2223),rec(31,1815,1.308,2374),rec(32,1908,1.327,2531),rec(33,2002,1.345,2692),rec(34,2096,1.364,2858),rec(35,2191,1.382,3027),rec(36,2287,1.400,3201),rec(37,2383,1.419,3380),rec(38,2479,1.438,3562),rec(39,2575,1.456,3747),rec(40,2671,1.475,3936),rec(41,2766,1.493,4129),rec(42,2862,1.512,4324),rec(43,2957,1.531,4523),rec(44,3052,1.549,4724),rec(45,3146,1.568,4928),rec(46,3239,1.586,5134),rec(47,3332,1.605,5343),rec(48,3423,1.624,5553),rec(49,3514,1.642,5765),rec(50,3604,1.661,5980),rec(51,3693,1.679,6195),rec(52,3781,1.698,6412),rec(53,3868,1.716,6630),rec(54,3954,1.734,6850),rec(55,4039,1.753,7070),rec(56,4122,1.771,7291)]};
 const lbWeeks=[75,130,195,273,366,469,573,677,777,873,963,1047,1128,1205,1279,1351,1421,1493,1565,1635,1701,1760,1808,1846,1874,1893,1906,1914,1918,1921,1924,1926,1929,1932,1934,1936,1939,1941,1944,1946,1949,1952,1954,1956,1959,1961,1964,1966,1969,1972,1974,1976,1979,1981,1985,1986,1990,1992,1994,1996,1999,2001,2004,2006,2009,2012,2014,2016,2019,2021,2024,2026,2029,2032,2034,2036,2039,2041,2044,2046,2047,2048,2049,2050,2051,2051,2052,2052,2053,2053];
 VERIFIED_STANDARDS.layer=VERIFIED_STANDARDS.layer||{};VERIFIED_STANDARDS.layer.lohmann=VERIFIED_STANDARDS.layer.lohmann||{};VERIFIED_STANDARDS.layer.lohmann["Lohmann Brown-Classic"]={sourceYear:2021,sourceType:"official-performance-standard",sourceLabel:"LOHMANN BROWN-CLASSIC Performance Data & Body Weight Tables — official breeder table",sourceUrl:"https://lohmann-breeders.com/media/2022/06/LB_Zusatzheft_Alternative-Haltung_LB-Classic_EN_06.21_V01-21_high-1.pdf",records:lbWeeks.map((w,i)=>rec((i+1)*7,w))};
 VERIFIED_STANDARDS.layer.hyline=VERIFIED_STANDARDS.layer.hyline||{};
 VERIFIED_STANDARDS.layer.hyline["W-80 Plus"]={sourceYear:2026,sourceType:"official-performance-standard",sourceLabel:"Hy-Line W-80 PLUS Commercial Layers — International Performance Standards, April 2026",sourceUrl:"https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80PLUS%20STD%20ENG.pdf",interpolationPolicy:"exact-only",records:[range(119,"bodyWeight",1238,1296),range(182,"bodyWeight",1527,1604),range(224,"bodyWeight",1608,1693),range(490,"bodyWeight",1662,1778),range(700,"bodyWeight",1682,1822),range(182,"eggWeight",57.3,59.0),range(224,"eggWeight",61.4,63.3),range(490,"eggWeight",65.2,67.2),range(700,"eggWeight",65.6,67.6),range(119,"henDayProduction",94.3,98.1)]};
 VERIFIED_STANDARDS.layer.hyline["W-80 Plus"].records=VERIFIED_STANDARDS.layer.hyline["W-80 Plus"].records.filter(r=>Object.values(r).some(v=>v&&typeof v==='object'&&v.low!==null&&v.high!==null));
})(typeof window!=="undefined"?window:globalThis);

/* FCR REPORT LAYER V1 — keeps existing weight standards untouched */
(function(g){
 'use strict';
 const db=()=>g.supabaseClient;
 const norm=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/[\u200c\u200f\u202a-\u202e]/g,'').replace(/[^a-z0-9\u0600-\u06ff]+/gi,' ').trim();
 async function standards(age,metric,strain){
  const s=db(); if(!s||!age)return null;
  const {data,error}=await s.from('poultry_performance_standards').select('target_value,source_type,source_name,source_version,strain,genetics,variant').eq('production_type','broiler').eq('age_days',Number(age)).eq('metric_code',metric).eq('active',true);
  if(error||!data?.length)return null;
  const sn=norm(strain); const exact=data.filter(x=>norm(x.strain)===sn); const pool=exact.length?exact:data;
  const wanted=metric==='fcr_cumulative'?pool.filter(x=>x.source_type==='official'):pool.filter(x=>x.source_type==='management');
  if(!wanted.length)return null;
  wanted.sort((a,b)=>((b.strain?1:0)-(a.strain?1:0))||((b.genetics?1:0)-(a.genetics?1:0)));
  return wanted[0];
 }
 async function apply(){
  try{
   const root=document.getElementById('root');if(!root)return;
   const identity=document.getElementById('identity'); const items=identity?.querySelectorAll('.identity-item')||[]; let strain='';
   items.forEach(x=>{if((x.querySelector('small')?.textContent||'').includes('سویه'))strain=x.querySelector('strong')?.textContent||'';});
   const ageText=[...root.querySelectorAll('.metric')].find(x=>(x.querySelector('.label')?.textContent||'').trim()==='سن')?.querySelector('.value')?.textContent||'';
   const digits='۰۱۲۳۴۵۶۷۸۹'; const m=ageText.match(/[0-9۰-۹]+/); const age=m?Number(m[0].replace(/[۰-۹]/g,c=>digits.indexOf(c))):0;
   const typeText=document.querySelector('.identity-item:nth-child(2) strong')?.textContent||''; if(!age||!/گوشتی|broiler/i.test(typeText))return;
   const [wk,cum]=await Promise.all([standards(age,'fcr_weekly',strain),standards(age,'fcr_cumulative',strain)]);
   const cards=[...root.querySelectorAll('.metric')]; const fwc=cards.find(x=>(x.querySelector('.label')?.textContent||'').trim()==='FCR هفتگی'); const fcc=cards.find(x=>(x.querySelector('.label')?.textContent||'').trim()==='FCR تجمعی');
   if(fwc&&wk){let ref=fwc.querySelector('.ref');if(!ref){ref=document.createElement('div');ref.className='ref';fwc.appendChild(ref);}ref.textContent='استاندارد مدیریتی هفتگی: '+Number(wk.target_value).toFixed(4)+' — '+(wk.source_name||'');}
   if(fcc&&cum){let ref=fcc.querySelector('.ref');if(!ref){ref=document.createElement('div');ref.className='ref';fcc.appendChild(ref);}ref.textContent='استاندارد رسمی تجمعی: '+Number(cum.target_value).toFixed(3)+' — '+(cum.source_name||'');}
   for(const canvas of root.querySelectorAll('canvas')){
    const ch=g.Chart?.getChart?.(canvas); if(!ch)continue; const title=canvas.closest('.box')?.querySelector('h3')?.textContent||''; if(!/FCR/.test(title))continue;
    const labels=ch.data.labels||[], ages=labels.map((_,i)=>(i+1)*7), weekly=[], cumulative=[];
    for(const a of ages){const [w,c]=await Promise.all([standards(a,'fcr_weekly',strain),standards(a,'fcr_cumulative',strain)]);weekly.push(w?Number(w.target_value):null);cumulative.push(c?Number(c.target_value):null);}
    const ds=ch.data.datasets; ds.forEach(d=>{const l=String(d.label||'');if(l.includes('استاندارد رسمی')){d.label='استاندارد رسمی تجمعی';d.data=cumulative;}else if(l.includes('استاندارد')){d.label='استاندارد مدیریتی هفتگی';d.data=weekly;}});
    if(!ds.some(d=>String(d.label||'').includes('استاندارد مدیریتی هفتگی')))ds.push({label:'استاندارد مدیریتی هفتگی',data:weekly});
    if(!ds.some(d=>String(d.label||'').includes('استاندارد رسمی تجمعی')))ds.push({label:'استاندارد رسمی تجمعی',data:cumulative}); ch.update('none');
   }
  }catch(e){console.warn('FCR report layer:',e);}
 }
 const boot=()=>{let last='';const tick=()=>{const r=document.getElementById('root');const sig=r?.textContent?.slice(0,220)||'';if(sig&&sig!==last){last=sig;setTimeout(apply,80);}};new MutationObserver(tick).observe(document.body,{subtree:true,childList:true});setInterval(tick,1200);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(typeof window!=='undefined'?window:globalThis);
