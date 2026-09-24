/* ADINE — UNIFIED LAYER STANDARDS ENGINE
   Scope: commercial laying hens only.
   One Layer standards engine for Daily / Weekly / Monthly / Reports.
   No Broiler engine, standard, router or report is consulted here.
   Official breeder/genetic numeric data is used when traceable.
   Where no traceable numeric curve is available, an explicitly labelled
   management reference is used. No silent cross-strain borrowing.
*/
(function(g){
'use strict';

const VERSION='2026-09-24.layer-standards.v3';
const OFFICIAL='official-genetic';
const MANAGEMENT='management-standard';

const MANAGEMENT_PROFILE={
  sourceType:MANAGEMENT,
  sourceYear:2026,
  sourceLabel:'استاندارد مدیریتی پایش تخم‌گذار آدینه — مرجع عملیاتی 2026.1',
  sourceUrl:null,
  records:[
    {ageDays:119,dailyFeed:90,dailyWater:135,henDayProduction:85,eggWeight:58,fcr:2.20,mortality:0.08},
    {ageDays:140,dailyFeed:95,dailyWater:145,henDayProduction:90,eggWeight:60,fcr:2.15,mortality:0.08},
    {ageDays:182,dailyFeed:105,dailyWater:160,henDayProduction:94,eggWeight:62,fcr:2.10,mortality:0.08},
    {ageDays:280,dailyFeed:110,dailyWater:170,henDayProduction:92,eggWeight:63,fcr:2.05,mortality:0.08},
    {ageDays:420,dailyFeed:112,dailyWater:175,henDayProduction:90,eggWeight:64,fcr:2.10,mortality:0.08},
    {ageDays:700,dailyFeed:115,dailyWater:180,henDayProduction:80,eggWeight:65,fcr:2.15,mortality:0.08}
  ],
  daily:{
    feed:{min:90,max:125},
    water:{min:120,max:300},
    waterFeed:{min:1.5,max:3.5},
    mortality:{max:0.08},
    humidity:{min:45,max:75},
    temp:{min:18,max:28}
  }
};

const profiles={

  'W-36':{
    genetics:'hyline',sourceType:OFFICIAL,sourceYear:2020,
    sourceLabel:'Hy-Line W-36 Commercial Layers Management Guide — January 2020',
    sourceUrl:'https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-36/36%20COM%20ENG.pdf',
    records:[],
    notes:'منبع رسمی دارای بازه‌های عملکردی است؛ تا زمان پشتیبانی کامل از استانداردهای بازه‌ای، عدد نقطه‌ای ساخته نمی‌شود.'
  },

  'W-80':{
    genetics:'hyline',sourceType:OFFICIAL,sourceYear:2026,
    sourceLabel:'Hy-Line W-80 Commercial Layers Performance Standards — April 2026',
    sourceUrl:'https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80%20STD%20ENG.pdf',
    records:[
      {ageDays:119,bodyWeight:1240.5,dailyFeed:73,dailyWater:110},
      {ageDays:126,bodyWeight:1286.5,dailyFeed:75,dailyWater:110},
      {ageDays:133,bodyWeight:1329.5,dailyFeed:80.7,dailyWater:121.1,henDayProduction:6.6,eggWeight:45.45},
      {ageDays:140,bodyWeight:1368,dailyFeed:84.55,dailyWater:126.9,henDayProduction:43.35,eggWeight:47.95},
      {ageDays:147,bodyWeight:1401.5,dailyFeed:88.25,dailyWater:132.6,henDayProduction:73.8,eggWeight:49.75},
      {ageDays:154,bodyWeight:1432.5,dailyFeed:92.1,dailyWater:138.7,henDayProduction:83.5,eggWeight:51.35},
      {ageDays:168,bodyWeight:1486.5,dailyFeed:94.1,dailyWater:141.1,henDayProduction:91.65,eggWeight:54.3},
      {ageDays:182,bodyWeight:1532.5,dailyFeed:97.3,dailyWater:145.9,henDayProduction:94.4,eggWeight:56.65},
      {ageDays:196,bodyWeight:1568.5,dailyFeed:103,dailyWater:154.7,henDayProduction:96.3,eggWeight:59.55},
      {ageDays:224,bodyWeight:1600.5,dailyFeed:107,dailyWater:160.5,henDayProduction:92.7,eggWeight:62},
      {ageDays:252,bodyWeight:1614.5,dailyFeed:107,dailyWater:160.6,henDayProduction:91.1,eggWeight:63.1},
      {ageDays:280,bodyWeight:1618.5,dailyFeed:107,dailyWater:160.6,henDayProduction:90.4,eggWeight:64},
      {ageDays:350,bodyWeight:1629,dailyFeed:107,dailyWater:160.6,henDayProduction:93.25,eggWeight:64.55},
      {ageDays:420,bodyWeight:1635,dailyFeed:107,dailyWater:160.6,henDayProduction:91.55,eggWeight:64.65},
      {ageDays:490,bodyWeight:1683,dailyFeed:107,dailyWater:160.6,henDayProduction:91,eggWeight:64.5},
      {ageDays:560,bodyWeight:1695,dailyFeed:107,dailyWater:160.6,henDayProduction:86.95,eggWeight:64.8}
    ]
  },

  'W-80 Plus':{
    genetics:'hyline',sourceType:OFFICIAL,sourceYear:2024,
    sourceLabel:'Hy-Line W-80 Plus Commercial Layers Performance Standards',
    sourceUrl:'https://www.hyline.com/literature/w-80',
    records:[
      {ageDays:126,bodyWeight:1280,dailyFeed:73},
      {ageDays:182,bodyWeight:1360,dailyFeed:100},
      {ageDays:490,bodyWeight:1710,dailyFeed:104.9,eggWeight:63.4},
      {ageDays:700,bodyWeight:1820,dailyFeed:113.2,eggWeight:68.8}
    ]
  },

  'W-80 Pro':{
    genetics:'hyline',sourceType:OFFICIAL,sourceYear:2026,
    sourceLabel:'Hy-Line W-80 Pro Commercial Layers Performance Standards — 2026',
    sourceUrl:'https://www.hyline.com/literature/w-80',
    records:[
      {ageDays:119,bodyWeight:1156},
      {ageDays:182,bodyWeight:1210},
      {ageDays:490,bodyWeight:1570,dailyFeed:102.8,eggWeight:62.4},
      {ageDays:700,bodyWeight:1701,dailyFeed:106.4,eggWeight:64.3}
    ]
  },

  'Brown':{
    genetics:'hyline',sourceType:OFFICIAL,sourceYear:2025,
    sourceLabel:'Hy-Line Brown Commercial Layers Performance Standards — December 2025',
    sourceUrl:'https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/Brown/BRN%20STD%20ENG.pdf',
    records:[],
    notes:'منبع رسمی دارای بازه‌های عملکردی برای بسیاری از شاخص‌هاست؛ عدد نقطه‌ای از بازه ساخته نشده و فعلاً مرجع مدیریتی برای محاسبه استفاده می‌شود.'
  },

  'ISA Brown':{
    genetics:'hendrix',sourceType:OFFICIAL,sourceYear:2019,
    sourceLabel:'ISA Brown Commercial Product Guide — 2019',
    sourceUrl:'https://www.hendrix-genetics.com/en/news-events/events/space-en-2026/laying-hens/',
    records:[
      {ageDays:175,bodyWeight:1796,dailyFeed:112,henDayProduction:96.1},
      {ageDays:259,bodyWeight:1896,dailyFeed:113,henDayProduction:95.2},
      {ageDays:273,bodyWeight:1906,dailyFeed:113,henDayProduction:94.8},
      {ageDays:287,bodyWeight:1915,dailyFeed:113,henDayProduction:94.4},
      {ageDays:315,bodyWeight:1931,dailyFeed:113,henDayProduction:93.5},
      {ageDays:329,bodyWeight:1939,dailyFeed:113,henDayProduction:92.9},
      {ageDays:343,bodyWeight:1946,dailyFeed:113,henDayProduction:92.3},
      {ageDays:371,bodyWeight:1969,dailyFeed:113,henDayProduction:90.9},
      {ageDays:399,bodyWeight:1969,dailyFeed:113,henDayProduction:89.4},
      {ageDays:490,bodyWeight:1988,dailyFeed:113,henDayProduction:83.5}
    ]
  },

  'Lohmann Brown-Classic':{
    genetics:'lohmann',sourceType:OFFICIAL,sourceYear:2021,
    sourceLabel:'LOHMANN BROWN-CLASSIC Management Guide / Performance Data',
    sourceUrl:'https://lohmann-breeders.com/files/downloads/MG/e-Guides/Cage/English/LB_eMG_Cage_EN_PerfData_LB-Classic_p8.pdf',
    records:[
      {ageDays:119,bodyWeight:1420},
      {ageDays:504,eggWeight:63.7},
      {ageDays:560,eggWeight:64.1},
      {ageDays:700,eggWeight:64.9}
    ],
    notes:'تنها مقادیر نقطه‌ای مستند وارد شده‌اند؛ peak و cumulative egg totals به‌صورت منحنی روزانه جعل نشده‌اند.'
  },

  'Lohmann Brown-Lite':{
    genetics:'lohmann',sourceType:OFFICIAL,sourceYear:2021,
    sourceLabel:'LOHMANN BROWN-LITE Performance Data',
    sourceUrl:'https://lohmann-breeders.com/files/downloads/MG/Data%20Tables/Protected_LB_Zusatzheft_Alternative%20Haltung_LB-Lite_EN_06.21_V01-21_high.pdf',
    records:[
      {ageDays:119,bodyWeight:1407},
      {ageDays:504,eggWeight:61.7},
      {ageDays:560,eggWeight:62.0},
      {ageDays:630,eggWeight:62.4}
    ],
    notes:'مقادیر نقطه‌ای مستند breeder وارد شده‌اند؛ نرخ‌های تولیدی بازه‌ای به عدد ساختگی تبدیل نشده‌اند.'
  },

  'Lohmann LSL-Classic':{
    genetics:'lohmann',sourceType:OFFICIAL,sourceYear:2021,
    sourceLabel:'LOHMANN LSL-CLASSIC Performance Data',
    sourceUrl:'https://lohmann-breeders.com/files/downloads/MG/Cage/LB_MG_Cage_LSL-Classic_EN.pdf',
    records:[
      {ageDays:119,bodyWeight:1270},
      {ageDays:504,eggWeight:62.4},
      {ageDays:560,eggWeight:62.8},
      {ageDays:700,eggWeight:63.6}
    ],
    notes:'مقادیر نقطه‌ای مستند breeder وارد شده‌اند؛ peak و cumulative egg production به منحنی روزانه تبدیل نشده‌اند.'
  },

  'Lohmann LSL-Lite':{
    genetics:'lohmann',sourceType:OFFICIAL,sourceYear:2026,
    sourceLabel:'LOHMANN LSL-LITE — current breeder performance data',
    sourceUrl:'https://lohmann-breeders.com/strains/lohmann-lsl-lite/',
    records:[
      {ageDays:504,eggWeight:60.2},
      {ageDays:560,eggWeight:60.8},
      {ageDays:700,eggWeight:60.8}
    ],
    notes:'اعداد نقطه‌ای وزن تخم از breeder page؛ سایر شاخص‌های خلاصه‌ای به منحنی ساختگی تبدیل نشده‌اند.'
  },

  'NOVOgen Brown':{
    genetics:'novogen',sourceType:OFFICIAL,sourceYear:2024,
    sourceLabel:'NOVOgen BROWN Commercial Layers Management Guide — 2024',
    sourceUrl:'https://novocenter.novogen-layers.com/wp-content/uploads/2021/11/202402-Guide_management_CS_Brown_V2comp.pdf',
    records:[
      {ageDays:133,bodyWeight:1500,dailyFeed:81},
      {ageDays:140,bodyWeight:1580,dailyFeed:83,henDayProduction:1,eggWeight:43.5},
      {ageDays:147,bodyWeight:1640,dailyFeed:90,henDayProduction:14.8,eggWeight:47.8},
      {ageDays:154,bodyWeight:1685,dailyFeed:100,henDayProduction:39,eggWeight:50.5},
      {ageDays:168,bodyWeight:1765,dailyFeed:109,henDayProduction:93,eggWeight:56.3},
      {ageDays:182,bodyWeight:1815,dailyFeed:111,henDayProduction:96.5,eggWeight:59.6},
      {ageDays:210,bodyWeight:1830,dailyFeed:111,henDayProduction:96.3,eggWeight:62.1},
      {ageDays:280,bodyWeight:1840,dailyFeed:111,henDayProduction:95.7,eggWeight:62.9},
      {ageDays:350,bodyWeight:1855,dailyFeed:111,henDayProduction:94.7,eggWeight:63.5},
      {ageDays:420,bodyWeight:1865,dailyFeed:111,henDayProduction:94,eggWeight:63.8},
      {ageDays:490,bodyWeight:1875,dailyFeed:111,henDayProduction:93.2,eggWeight:64.2},
      {ageDays:560,bodyWeight:1882,dailyFeed:111,henDayProduction:92.2,eggWeight:64.4},
      {ageDays:630,bodyWeight:1890,dailyFeed:111,henDayProduction:90.4,eggWeight:64.5}
    ]
  },

  'NOVOgen White':{
    genetics:'novogen',sourceType:OFFICIAL,sourceYear:2024,
    sourceLabel:'NOVOgen WHITE Commercial Layers Management Guide — 2024',
    sourceUrl:'https://novocenter.novogen-layers.com/wp-content/uploads/2021/11/202402-Guide_management_CS_White_V2comp.pdf',
    records:[
      {ageDays:133,bodyWeight:1250,dailyFeed:74},
      {ageDays:140,bodyWeight:1315,dailyFeed:80,henDayProduction:5,eggWeight:43.4},
      {ageDays:147,bodyWeight:1365,dailyFeed:85,henDayProduction:25,eggWeight:48.9},
      {ageDays:154,bodyWeight:1405,dailyFeed:91,henDayProduction:55,eggWeight:51.4},
      {ageDays:168,bodyWeight:1515,dailyFeed:101,henDayProduction:91,eggWeight:55.6},
      {ageDays:182,bodyWeight:1625,dailyFeed:104,henDayProduction:95.8,eggWeight:59},
      {ageDays:210,bodyWeight:1665,dailyFeed:104,henDayProduction:96,eggWeight:61.5},
      {ageDays:280,bodyWeight:1687,dailyFeed:104,henDayProduction:95.6,eggWeight:62.9},
      {ageDays:350,bodyWeight:1690,dailyFeed:104,henDayProduction:95,eggWeight:63.6},
      {ageDays:420,bodyWeight:1695,dailyFeed:104,henDayProduction:92,eggWeight:64.3},
      {ageDays:490,bodyWeight:1698,dailyFeed:104,henDayProduction:90.8,eggWeight:64.4},
      {ageDays:560,bodyWeight:1699,dailyFeed:104,henDayProduction:93.3,eggWeight:64.1},
      {ageDays:630,bodyWeight:1700,dailyFeed:104,henDayProduction:90.3,eggWeight:64.5}
    ]
  },

  'Nick Chick':{
    genetics:'h&n',sourceType:OFFICIAL,sourceYear:2025,
    sourceLabel:'H&N Nick Chick Commercial Layer Performance Standards',
    sourceUrl:'https://hn-int.com/wp-content/uploads/2025/02/HN_MG_Alternative_EN-NA_NickChick_01.23_V01-25_printX3_compressed.pdf',
    records:[
      {ageDays:133,bodyWeight:1300,dailyFeed:103},
      {ageDays:210,bodyWeight:1597,dailyFeed:105,henDayProduction:95,eggWeight:59.5},
      {ageDays:504,bodyWeight:1690,dailyFeed:107,henDayProduction:95,eggWeight:60.5},
      {ageDays:630,bodyWeight:1710,dailyFeed:108,henDayProduction:90,eggWeight:61.6},
      {ageDays:700,bodyWeight:1725,dailyFeed:108,henDayProduction:85,eggWeight:61.6}
    ],
    notes:'اعداد عملکردی بر پایه استاندارد رسمی H&N؛ مقادیر نقطه‌ای فقط در سنین/شاخص‌های مستند استفاده شده‌اند.'
  },

  'TETRA Brown':{
    genetics:'tetra',sourceType:OFFICIAL,sourceYear:2009,
    sourceLabel:'Bábolna TETRA-SL Commercial Layer Management Guide',
    sourceUrl:'https://www.winmixsoft.com/wp-content/uploads/2025/06/TETRA-SL_en.pdf',
    records:[
      {ageDays:126,bodyWeight:1440,dailyFeed:82},
      {ageDays:144,bodyWeight:1500,dailyFeed:90,henDayProduction:50,eggWeight:52},
      {ageDays:168,bodyWeight:1650,dailyFeed:105,henDayProduction:93,eggWeight:58},
      {ageDays:196,bodyWeight:1750,dailyFeed:112,henDayProduction:95.3,eggWeight:60},
      {ageDays:280,bodyWeight:1840,dailyFeed:112,henDayProduction:92,eggWeight:63},
      {ageDays:420,bodyWeight:1900,dailyFeed:113,henDayProduction:87,eggWeight:66},
      {ageDays:560,bodyWeight:1960,dailyFeed:113,henDayProduction:82,eggWeight:67.7}
    ]
  }
};

// Explicitly assign every catalog strain. If it is not in profiles, it receives
// the management standard; it never inherits another strain's genetic curve.
const MANAGEMENT_ONLY=[
 'W-80 Plus','W-80 Pro',
 'ISA White','Dekalb White','Dekalb Brown','Bovans White','Bovans Brown',
 'Shaver White','Shaver Brown','Hisex White','Hisex Brown',
 'Lohmann Brown-Extra','Lohmann LSL-Extra','Lohmann Sandy','Lohmann Tradition'
];

function norm(v){return String(v??'').normalize('NFKC').replace(/[\u200c\u200f]/g,'').trim().toLowerCase();}
function interpolate(points,age){
 const a=Number(age),p=(points||[]).map(x=>({age:Number(x.ageDays),value:Number(x.value)}))
  .filter(x=>Number.isFinite(x.age)&&Number.isFinite(x.value)).sort((x,y)=>x.age-y.age);
 if(!p.length||!Number.isFinite(a))return null;
 if(a<p[0].age||a>p[p.length-1].age)return null;
 const exact=p.find(x=>x.age===a);if(exact)return exact.value;
 for(let i=1;i<p.length;i++){if(a<=p[i].age){const x=p[i-1],y=p[i],t=(a-x.age)/(y.age-x.age);return x.value+(y.value-x.value)*t;}}
 return null;
}
function resolve(flock){
 const s=norm(flock?.strain),g0=norm(flock?.genetics);
 const exact=Object.keys(profiles).find(k=>norm(k)===s);
 if(exact){const p=profiles[exact];return {...p,strain:exact,fallback:!(Array.isArray(p.records)&&p.records.length>1),numericReady:Array.isArray(p.records)&&p.records.length>1,management:MANAGEMENT_PROFILE};}
 const aliases={
  'hy-line w-80':'W-80','hyline w-80':'W-80','hy-line brown':'Brown',
  'lohmann brown':'Lohmann Brown-Classic','lohmann lsl':'Lohmann LSL-Classic',
  'novogen brown':'NOVOgen Brown','novogen white':'NOVOgen White'
 };
 const alias=Object.keys(aliases).find(k=>s===k);
 if(alias)return resolve({...flock,strain:aliases[alias]});
 const catalogStrains=[
  'W-36','W-80','W-80 Plus','W-80 Pro','Brown',
  'ISA Brown','ISA White','Dekalb White','Dekalb Brown','Bovans White','Bovans Brown','Shaver White','Shaver Brown','Hisex White','Hisex Brown',
  'Lohmann Brown-Classic','Lohmann Brown-Lite','Lohmann Brown-Extra','Lohmann LSL-Classic','Lohmann LSL-Lite','Lohmann LSL-Extra','Lohmann Sandy','Lohmann Tradition',
  'NOVOgen Brown','NOVOgen White','TETRA Brown','Nick Chick'
 ];
 const known=catalogStrains.find(k=>norm(k)===s);
 return {
   ...MANAGEMENT_PROFILE,
   genetics:g0||'layer',
   strain:known||flock?.strain||'unknown',
   fallback:true,
   numericReady:false,
   management:MANAGEMENT_PROFILE
 };
}
function metricAtAge(std,metric,age){
 const official=interpolate((std.records||[]).map(r=>({ageDays:r.ageDays,value:r[metric]})),age);
 if(official!==null)return {value:official,sourceType:std.sourceType,sourceLabel:std.sourceLabel,isFallback:false};
 const m=interpolate((std.management?.records||[]).map(r=>({ageDays:r.ageDays,value:r[metric]})),age);
 if(m!==null)return {value:m,sourceType:MANAGEMENT,sourceLabel:std.management.sourceLabel,isFallback:true};
 return {value:null,sourceType:null,sourceLabel:null,isFallback:false};
}
function getDailyReference(std){
 const d=std.daily||MANAGEMENT_PROFILE.daily;
 return {feed:d.feed,water:d.water,waterFeed:d.waterFeed,mortality:d.mortality,humidity:d.humidity,temp:d.temp};
}
function evaluate(metric,actual,ref,direction){
 if(actual==null||ref==null)return {state:'no_data',deltaPercent:null};
 const delta=(Number(actual)-Number(ref))/Number(ref)*100;
 const good=direction==='lower'?-delta:delta;
 return {state:Math.abs(good)<=3?'normal':good>0?'improving':'watch',deltaPercent:delta};
}

const api=Object.freeze({
 version:VERSION,
 profiles,
 management:MANAGEMENT_PROFILE,
 resolve,
 interpolate,
 metricAtAge,
 getDailyReference,
 evaluate,
 list:()=>Object.keys(profiles),
 isOfficial:std=>Boolean(std&&!std.fallback&&std.sourceType===OFFICIAL)
});
g.ADINE_LAYER_STANDARDS_ENGINE_V1=api;
// Backward-compatible alias for the Layer Daily page; this is the same engine,
// not a second standards engine.
g.ADINE_LAYER_DAILY_STANDARDS_V1=api;
})(window);
