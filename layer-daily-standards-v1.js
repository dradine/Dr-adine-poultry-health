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
  sourceLabel:'مرجع عملیاتی پایش تخم‌گذار آدینه 2026.1 — آستانهٔ غربالگری محلی، نه استاندارد جهانی یا ژنتیکی',
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
    sourceLabel:'Hy-Line W-80 Commercial Layers Performance Standards Guide — April 2026 (Conventional/Cage systems)',
    housingSystem:'cage',sourceVerifiedAt:'2026-10-13',sourceStatus:'verified_selected_points',
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
    ],
    rangeRecords:[
      {ageDays:119,bodyWeight:{min:1212,max:1269},dailyFeed:{min:72,max:74},dailyWater:{min:108,max:112}},
      {ageDays:126,henDayProduction:{min:0.1,max:0.2},bodyWeight:{min:1257,max:1316},dailyFeed:{min:75.9,max:78.6},dailyWater:{min:113.8,max:117.8},eggWeight:{min:42.1,max:43.4}},
      {ageDays:133,henDayProduction:{min:6.5,max:6.7},bodyWeight:{min:1299,max:1360},dailyFeed:{min:79.3,max:82.1},dailyWater:{min:119,max:123.1},eggWeight:{min:44.8,max:46.1}},
      {ageDays:140,henDayProduction:{min:42.5,max:44.2},bodyWeight:{min:1336,max:1400},dailyFeed:{min:83.1,max:86.0},dailyWater:{min:124.7,max:129.1},eggWeight:{min:47.2,max:48.7}},
      {ageDays:147,henDayProduction:{min:72.3,max:75.3},bodyWeight:{min:1368,max:1435},dailyFeed:{min:86.6,max:89.7},dailyWater:{min:130.0,max:134.5},eggWeight:{min:49.0,max:50.5}},
      {ageDays:154,henDayProduction:{min:81.8,max:85.2},bodyWeight:{min:1398,max:1467},dailyFeed:{min:89.6,max:92.7},dailyWater:{min:134.4,max:139.1},eggWeight:{min:50.6,max:52.1}},
      {ageDays:168,henDayProduction:{min:89.8,max:93.5},bodyWeight:{min:1450,max:1523},dailyFeed:{min:94.1,max:97.3},dailyWater:{min:141.1,max:146.0},eggWeight:{min:53.5,max:55.1}},
      {ageDays:182,henDayProduction:{min:92.5,max:96.3},bodyWeight:{min:1495,max:1570},dailyFeed:{min:97.3,max:100.7},dailyWater:{min:145.9,max:151.0},eggWeight:{min:55.8,max:57.5}},
      {ageDays:196,henDayProduction:{min:93.9,max:97.7},bodyWeight:{min:1529,max:1608},dailyFeed:{min:99.6,max:103.1},dailyWater:{min:149.4,max:154.6},eggWeight:{min:57.6,max:59.4}},
      {ageDays:224,henDayProduction:{min:94.3,max:98.1},bodyWeight:{min:1573,max:1657},dailyFeed:{min:103.1,max:106.7},dailyWater:{min:154.7,max:160.1},eggWeight:{min:59.8,max:61.7}},
      {ageDays:252,henDayProduction:{min:93.8,max:97.6},bodyWeight:{min:1595,max:1682},dailyFeed:{min:105.7,max:109.4},dailyWater:{min:158.5,max:164.1},eggWeight:{min:61.0,max:62.9}},
      {ageDays:280,henDayProduction:{min:93.1,max:96.9},bodyWeight:{min:1605,max:1696},dailyFeed:{min:106.9,max:110.6},dailyWater:{min:160.3,max:165.9},eggWeight:{min:61.8,max:63.6}},
      {ageDays:350,henDayProduction:{min:91.4,max:95.1},bodyWeight:{min:1613,max:1712},dailyFeed:{min:107.0,max:110.8},dailyWater:{min:160.6,max:166.2},eggWeight:{min:62.7,max:64.6}},
      {ageDays:420,henDayProduction:{min:89.7,max:93.4},bodyWeight:{min:1620,max:1726},dailyFeed:{min:107.0,max:110.8},dailyWater:{min:160.6,max:166.2},eggWeight:{min:63.2,max:65.1}},
      {ageDays:490,henDayProduction:{min:88.1,max:91.7},bodyWeight:{min:1626,max:1740},dailyFeed:{min:107.0,max:110.8},dailyWater:{min:160.6,max:166.2},eggWeight:{min:63.5,max:65.5}},
      {ageDays:560,henDayProduction:{min:85.2,max:88.7},bodyWeight:{min:1633,max:1754},dailyFeed:{min:107.0,max:110.8},dailyWater:{min:160.6,max:166.2},eggWeight:{min:63.7,max:65.7}},
      {ageDays:700,henDayProduction:{min:78.4,max:81.6},bodyWeight:{min:1646,max:1783},dailyFeed:{min:107.0,max:110.8},dailyWater:{min:160.6,max:166.2},eggWeight:{min:63.9,max:65.9}}
    ]
  },

  'W-80 Plus':{
    genetics:'hyline',sourceType:OFFICIAL,sourceYear:2026,
    sourceLabel:'Hy-Line W-80 Plus Commercial Layers Performance Standards Guide — April 2026 (Conventional/Cage systems)',
    sourceUrl:'https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80PLUS%20STD%20ENG.pdf',
    housingSystem:'cage',sourceVerifiedAt:'2026-10-13',sourceStatus:'verified_selected_points',records:[],
    notes:'منحنی بازه‌ای از جدول رسمی آوریل ۲۰۲۶؛ مرزهای min/max حفظ می‌شوند و به نقطهٔ میانی به‌عنوان هدف قطعی تبدیل نمی‌شوند.',
    rangeRecords:[
      {ageDays:119,bodyWeight:{min:1238,max:1296},dailyFeed:{min:73.9,max:76.5},dailyWater:{min:110.9,max:114.7}},
      {ageDays:126,henDayProduction:{min:0.1,max:0.2},bodyWeight:{min:1284,max:1345},dailyFeed:{min:77.8,max:80.6},dailyWater:{min:116.7,max:120.8},eggWeight:{min:43.2,max:44.6}},
      {ageDays:133,henDayProduction:{min:6.5,max:6.7},bodyWeight:{min:1327,max:1390},dailyFeed:{min:81.3,max:84.1},dailyWater:{min:121.9,max:126.1},eggWeight:{min:45.9,max:47.3}},
      {ageDays:140,henDayProduction:{min:42.5,max:44.2},bodyWeight:{min:1365,max:1430},dailyFeed:{min:85.1,max:88.0},dailyWater:{min:127.6,max:132.1},eggWeight:{min:48.5,max:50.0}},
      {ageDays:147,henDayProduction:{min:72.3,max:75.3},bodyWeight:{min:1398,max:1466},dailyFeed:{min:88.5,max:91.6},dailyWater:{min:132.8,max:137.5},eggWeight:{min:50.3,max:51.8}},
      {ageDays:154,henDayProduction:{min:81.8,max:85.2},bodyWeight:{min:1429,max:1498},dailyFeed:{min:91.5,max:94.7},dailyWater:{min:137.3,max:142.1},eggWeight:{min:51.9,max:53.5}},
      {ageDays:168,henDayProduction:{min:89.8,max:93.5},bodyWeight:{min:1482,max:1556},dailyFeed:{min:96.0,max:99.3},dailyWater:{min:144.0,max:149.0},eggWeight:{min:54.9,max:56.5}},
      {ageDays:182,henDayProduction:{min:92.5,max:96.3},bodyWeight:{min:1527,max:1604},dailyFeed:{min:99.2,max:102.7},dailyWater:{min:148.8,max:154.0},eggWeight:{min:57.3,max:59.0}},
      {ageDays:196,henDayProduction:{min:93.9,max:97.7},bodyWeight:{min:1562,max:1642},dailyFeed:{min:102.0,max:105.6},dailyWater:{min:153.0,max:158.3},eggWeight:{min:59.1,max:60.9}},
      {ageDays:224,henDayProduction:{min:94.1,max:98.0},bodyWeight:{min:1608,max:1693},dailyFeed:{min:105.5,max:109.2},dailyWater:{min:158.3,max:163.9},eggWeight:{min:61.4,max:63.3}},
      {ageDays:252,henDayProduction:{min:93.4,max:97.2},bodyWeight:{min:1629,max:1719},dailyFeed:{min:108.2,max:111.9},dailyWater:{min:162.2,max:167.9},eggWeight:{min:62.6,max:64.5}},
      {ageDays:280,henDayProduction:{min:92.4,max:96.2},bodyWeight:{min:1640,max:1733},dailyFeed:{min:109.4,max:113.2},dailyWater:{min:164.0,max:169.8},eggWeight:{min:63.4,max:65.3}},
      {ageDays:350,henDayProduction:{min:90.3,max:94.0},bodyWeight:{min:1648,max:1749},dailyFeed:{min:109.5,max:113.3},dailyWater:{min:164.3,max:170.0},eggWeight:{min:64.4,max:66.3}},
      {ageDays:420,henDayProduction:{min:88.1,max:91.7},bodyWeight:{min:1655,max:1764},dailyFeed:{min:109.5,max:113.3},dailyWater:{min:164.3,max:170.0},eggWeight:{min:64.9,max:66.8}},
      {ageDays:490,henDayProduction:{min:86.4,max:89.9},bodyWeight:{min:1662,max:1778},dailyFeed:{min:109.5,max:113.3},dailyWater:{min:164.3,max:170.0},eggWeight:{min:65.2,max:67.2}},
      {ageDays:560,henDayProduction:{min:83.5,max:87.0},bodyWeight:{min:1668,max:1793},dailyFeed:{min:109.5,max:113.3},dailyWater:{min:164.3,max:170.0},eggWeight:{min:65.4,max:67.4}},
      {ageDays:700,henDayProduction:{min:76.9,max:80.0},bodyWeight:{min:1682,max:1822},dailyFeed:{min:109.5,max:113.3},dailyWater:{min:164.3,max:170.0},eggWeight:{min:65.6,max:67.6}}
    ]
  },

  'W-80 Pro':{
    genetics:'hyline',sourceType:OFFICIAL,sourceYear:2026,
    sourceLabel:'Hy-Line W-80 Pro Commercial Layers Performance Standards Guide — April 2026 (Conventional/Cage systems)',
    sourceUrl:'https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80R%20STD%20ENG.pdf',
    housingSystem:'cage',sourceVerifiedAt:'2026-10-13',records:[],
    notes:'منبع رسمی موجود است اما منحنی W-80 Pro هنوز استخراج و تطبیق نشده؛ هیچ منحنی عددی حدسی فعال نیست.'
  },

  'Brown':{
    genetics:'hyline',sourceType:OFFICIAL,sourceYear:2025,
    sourceLabel:'Hy-Line Brown Commercial Layers Performance Standards — December 2025',
    sourceUrl:'https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/Brown/BRN%20STD%20ENG.pdf',
    records:[],
    notes:'منبع رسمی دارای بازه‌های عملکردی برای بسیاری از شاخص‌هاست؛ عدد نقطه‌ای از بازه ساخته نشده و فعلاً مرجع مدیریتی برای محاسبه استفاده می‌شود.'
  },

  'ISA Brown':{
    genetics:'hendrix',sourceType:OFFICIAL,sourceYear:null,
    sourceLabel:'ISA Brown EU CS Product Guide — Cage housing (official PDF; verified 2026-10-13)',
    sourceUrl:'https://www.isa-poultry.com/documents/1399/ISA_Brown_EU_CS_product_guide_cage_EN_L6230-1.pdf',
    sourceVerifiedAt:'2026-10-13',housingSystem:'cage',sourceStatus:'verified_selected_points',dataGranularity:'selected_official_weekly_anchors',
    interpolationNote:'Only official week-specific values below are source values; values between anchors are linear estimates and must be labelled as interpolated.',
    records:[
      {ageDays:126,henDayProduction:3.2,eggWeight:42.6,dailyFeed:91,fcr:66.76,bodyWeight:1520,livability:99.9},
      {ageDays:175,henDayProduction:94.2,eggWeight:59.2,dailyFeed:115,fcr:2.07,bodyWeight:1780,livability:99.2},
      {ageDays:224,henDayProduction:95.7,eggWeight:63.0,dailyFeed:119,fcr:1.97,bodyWeight:1848,livability:98.5},
      {ageDays:280,henDayProduction:95.0,eggWeight:63.6,dailyFeed:119,fcr:1.97,bodyWeight:1890,livability:97.6},
      {ageDays:350,henDayProduction:93.2,eggWeight:63.9,dailyFeed:119,fcr:2.00,bodyWeight:1927,livability:96.6},
      {ageDays:420,henDayProduction:89.4,eggWeight:64.2,dailyFeed:118,fcr:2.06,bodyWeight:1950,livability:95.6},
      {ageDays:490,henDayProduction:86.1,eggWeight:64.5,dailyFeed:118,fcr:2.13,bodyWeight:1970,livability:94.5},
      {ageDays:560,henDayProduction:81.9,eggWeight:64.7,dailyFeed:118,fcr:2.22,bodyWeight:1981,livability:93.5},
      {ageDays:630,henDayProduction:77.3,eggWeight:65.0,dailyFeed:118,fcr:2.35,bodyWeight:1991,livability:92.5},
      {ageDays:700,henDayProduction:73.3,eggWeight:65.3,dailyFeed:118,fcr:2.47,bodyWeight:2000,livability:91.5}
    ]
  },

  'Lohmann Brown-Classic':{
    genetics:'lohmann',sourceType:OFFICIAL,sourceYear:2021,
    sourceLabel:'LOHMANN BROWN-CLASSIC Management Guide / Performance Data',housingSystem:'cage',
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
    sourceLabel:'LOHMANN BROWN-LITE Performance Data',housingSystem:'alternative',
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
    sourceLabel:'LOHMANN LSL-CLASSIC Performance Data',housingSystem:'cage',
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

  'Super Nick':{
    genetics:'hn',sourceType:'secondary_reference',sourceYear:2020,
    sourceLabel:'H&N Super Nick field performance report — secondary reference; not a current breeder standard',
    sourceUrl:'https://hn-int.com/wp-content/uploads/2020/10/2011-2-FtF-en.pdf',
    records:[],notes:'گزارش میدانی قدیمی و غیرمعادل استاندارد عملکرد جاری؛ برای مقایسه عددی سویه استفاده نمی‌شود.'
  },

  'Nick Chick':{
    genetics:'h&n',sourceType:OFFICIAL,sourceYear:2025,
    sourceLabel:'H&N Nick Chick Commercial Layer Performance Standards',housingSystem:'alternative',
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
    genetics:'babolna',sourceType:'secondary_reference',sourceYear:2009,
    sourceLabel:'TETRA-SL guide mirror — secondary copy; official publisher provenance not verified',
    sourceUrl:'https://www.winmixsoft.com/wp-content/uploads/2025/06/TETRA-SL_en.pdf',
    records:[],notes:'نسخهٔ ثانویه در میزبان غیرناشر؛ تا تأیید نسخهٔ اصلی سازنده، منحنی عددی غیرفعال است.'
  }
};

// Explicitly assign every catalog strain. If it is not in profiles, it receives
// the management standard; it never inherits another strain's genetic curve.
const MANAGEMENT_ONLY=[
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
function interpolateRange(records,metric,age){
 const min=interpolate((records||[]).map(r=>({ageDays:r.ageDays,value:r[metric]?.min})),age);
 const max=interpolate((records||[]).map(r=>({ageDays:r.ageDays,value:r[metric]?.max})),age);
 return min!==null&&max!==null?{min,max}:null;
}
function resolve(flock){
 const s=norm(flock?.strain),g0=norm(flock?.genetics);
 const exact=Object.keys(profiles).find(k=>norm(k)===s);
 if(exact){
  const p=profiles[exact],housing=norm(flock?.housing_system||flock?.housingSystem||flock?.housing_type);
  const cage=/(cage|قفس)/.test(housing),alternative=/(alternative|aviary|floor|barn|deep.litter|free.range|cage.free|آویاری|بستر|آزاد|بدون قفس)/.test(housing);
  const systemMismatch=Boolean(p.housingSystem&&((p.housingSystem==='cage'&&alternative)||(p.housingSystem==='alternative'&&cage)||(!housing&&(p.housingSystem==='cage'||p.housingSystem==='alternative'))));
  const active=systemMismatch?{...p,records:[],rangeRecords:[],fallback:true,numericReady:false,systemMismatch:true,systemMismatchReason:!housing?'سیستم پرورش ثبت نشده؛ منحنی قفس فعال نشد.':'سیستم پرورش با منبع منحنی سویه هم‌خوان نیست؛ مقایسهٔ ژنتیکی غیرفعال شد.'}:p;
  const ready=(active.records||[]).length>1||(active.rangeRecords||[]).length>1;
  const sourceStatus=active.sourceStatus||(ready?'provisional_selected_points':'source_available_curve_not_extracted');
  return {...active,label:active.strain||exact,strain:exact,sourceStatus,fallback:systemMismatch||!ready,numericReady:!systemMismatch&&ready,management:MANAGEMENT_PROFILE};
}
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
  'NOVOgen Brown','NOVOgen White','TETRA Brown','Nick Chick','Super Nick'
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
 const officialRange=interpolateRange(std.rangeRecords||[],metric,age);
 if(officialRange)return {value:(officialRange.min+officialRange.max)/2,min:officialRange.min,max:officialRange.max,referenceKind:'range',sourceType:std.sourceStatus==='verified_selected_points'?std.sourceType:'provisional_breeder_guide',sourceLabel:std.sourceLabel,sourceStatus:std.sourceStatus,isFallback:false,isInterpolated:!(std.rangeRecords||[]).some(r=>Number(r.ageDays)===Number(age))};
 const official=interpolate((std.records||[]).map(r=>({ageDays:r.ageDays,value:r[metric]})),age);
 if(official!==null)return {value:official,sourceType:std.sourceStatus==='verified_selected_points'?std.sourceType:'provisional_breeder_guide',sourceLabel:std.sourceLabel,sourceStatus:std.sourceStatus,isFallback:false,isInterpolated:!(std.records||[]).some(r=>Number(r.ageDays)===Number(age))};
 const m=interpolate((std.management?.records||[]).map(r=>({ageDays:r.ageDays,value:r[metric]})),age);
 if(m!==null)return {value:m,sourceType:MANAGEMENT,sourceLabel:std.management.sourceLabel,isFallback:true,isInterpolated:!(std.management?.records||[]).some(r=>Number(r.ageDays)===Number(age))};
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
 isOfficial:std=>Boolean(std&&!std.fallback&&std.sourceType===OFFICIAL&&std.sourceStatus==='verified_selected_points'),
 OFFICIAL,MANAGEMENT
});
g.ADINE_LAYER_STANDARDS_ENGINE_V1=api;
// Backward-compatible alias for the Layer Daily page; this is the same engine,
// not a second standards engine.
g.ADINE_LAYER_DAILY_STANDARDS_V1=api;
})(window);
