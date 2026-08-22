/* =========================================================
   ADINE POULTRY HEALTH CENTER
   GENETICS / CATALOG MASTER DATA
========================================================= */

const POULTRY_CATALOG = {

    broiler: {

        label: "گوشتی",

        genetics: [

            {
                id: "aviagen_ross",
                name: "Aviagen / Ross",
                strains: [
                    "Ross 308",
                    "Ross 308 FF",
                    "Ross 708",
                    "Ross 308 AP"
                ]
            },

            {
                id: "cobb",
                name: "Cobb",
                strains: [
                    "Cobb500",
                    "Cobb800"
                ]
            },

            {
                id: "aviagen_arbor",
                name: "Aviagen / Arbor Acres",
                strains: [
                    "Arbor Acres Plus",
                    "Arbor Acres Plus S"
                ]
            },

            {
                id: "aviagen_indian",
                name: "Aviagen / Indian River",
                strains: [
                    "Indian River",
                    "Indian River FF"
                ]
            },

            {
                id: "hubbard",
                name: "Hubbard",
                strains: [
                    "Efficiency Plus",
                    "Hubbard EDGE"
                ]
            },

            {
                id: "arian",
                name: "آرین ایران",
                strains: [
                    "Arian"
                ]
            }

        ]

    },


    layer: {

        label: "تخم‌گذار",

        genetics: [

            {
                id: "hyline",
                name: "Hy-Line",
                strains: [
                    "W-36",
                    "W-80",
                    "W-80 Plus",
                    "W-80 Pro",
                    "Brown"
                ]
            },

            {
                id: "hendrix",
                name: "Hendrix Genetics",
                strains: [
                    "ISA Brown",
                    "ISA White",
                    "Dekalb White",
                    "Dekalb Brown",
                    "Bovans White",
                    "Bovans Brown",
                    "Shaver White",
                    "Shaver Brown",
                    "Hisex White",
                    "Hisex Brown"
                ]
            },

            {
                id: "lohmann",
                name: "Lohmann",
                strains: [
                    "Lohmann Brown-Classic",
                    "Lohmann Brown-Lite",
                    "Lohmann Brown-Extra",
                    "Lohmann LSL-Classic",
                    "Lohmann LSL-Lite",
                    "Lohmann LSL-Extra",
                    "Lohmann Sandy",
                    "Lohmann Tradition"
                ]
            },

            {
                id: "novogen",
                name: "NOVOgen",
                strains: [
                    "NOVOgen Brown",
                    "NOVOgen White"
                ]
            },

            {
                id: "tetra",
                name: "TETRA",
                strains: [
                    "TETRA Brown"
                ]
            }

        ]

    },


    pullet: {

        label: "پولت",

        genetics: [

            {
                id: "hyline",
                name: "Hy-Line",
                strains: [
                    "W-36",
                    "W-80",
                    "Brown"
                ]
            },

            {
                id: "hendrix",
                name: "Hendrix Genetics",
                strains: [
                    "ISA Brown",
                    "ISA White",
                    "Dekalb White",
                    "Dekalb Brown",
                    "Hisex White",
                    "Hisex Brown"
                ]
            },

            {
                id: "lohmann",
                name: "Lohmann",
                strains: [
                    "Lohmann Brown-Classic",
                    "Lohmann LSL-Classic",
                    "Lohmann Brown-Lite",
                    "Lohmann LSL-Lite"
                ]
            }

        ]

    },


    breeder: {

        label: "مرغ مادر",

        genetics: [

            {
                id: "aviagen_ross",
                name: "Aviagen / Ross",
                strains: [
                    "Ross 308",
                    "Ross 308 FF",
                    "Ross 708",
                    "Ross 308 AP"
                ]
            },

            {
                id: "aviagen_arbor",
                name: "Aviagen / Arbor Acres",
                strains: [
                    "Arbor Acres Plus",
                    "Arbor Acres Plus S"
                ]
            },

            {
                id: "aviagen_indian",
                name: "Aviagen / Indian River",
                strains: [
                    "Indian River",
                    "Indian River FF"
                ]
            },

            {
                id: "cobb",
                name: "Cobb",
                strains: [
                    "Cobb500 Parent Stock",
                    "Cobb800 Parent Stock"
                ]
            }

        ]

    }

};



/* =========================================================
   PROFESSIONAL STANDARD RESOLUTION ENGINE
   ---------------------------------------------------------
   Policy:
   1) Use official breeder performance data whenever available.
   2) If a metric is not officially documented, use a clearly
      labelled MANAGEMENT standard. Never fabricate a genetic
      value and never silently borrow another strain's curve.
   3) Standards are metric-level, so one chart can legitimately
      use an official weight target and a management target for CV.
   4) No extrapolation outside a documented curve unless the
      management profile explicitly covers that age range.
========================================================= */

const PERFORMANCE_METRICS = {
    ageDays: { label: "سن", unit: "روز", direction: "neutral" },
    bodyWeight: { label: "وزن بدن", unit: "g", direction: "higher" },
    dailyGain: { label: "افزایش وزن روزانه", unit: "g/day", direction: "higher" },
    dailyFeed: { label: "مصرف دان روزانه", unit: "g/bird/day", direction: "lower" },
    cumulativeFeed: { label: "دان تجمعی", unit: "g/bird", direction: "lower" },
    fcr: { label: "FCR", unit: "kg/kg", direction: "lower" },
    livability: { label: "زنده‌مانی", unit: "%", direction: "higher" },
    mortality: { label: "تلفات", unit: "%", direction: "lower" },
    uniformity10: { label: "یکنواختی ±10%", unit: "%", direction: "higher" },
    uniformity15: { label: "یکنواختی ±15%", unit: "%", direction: "higher" },
    cv: { label: "CV", unit: "%", direction: "lower" },
    dailyWater: { label: "مصرف آب روزانه", unit: "mL/bird/day", direction: "lower" },
    henHousedProduction: { label: "تولید تخم‌مرغ", unit: "%", direction: "higher" },
    henDayProduction: { label: "Hen-Day", unit: "%", direction: "higher" },
    henHousedProduction: { label: "Hen-Housed", unit: "%", direction: "higher" },
    eggWeight: { label: "وزن تخم‌مرغ", unit: "g", direction: "higher" },
    haughUnit: { label: "Haugh Unit", unit: "HU", direction: "higher" },
    shellStrength: { label: "استحکام پوسته", unit: "N", direction: "higher" },
    eggMass: { label: "Egg Mass", unit: "g/hen/day", direction: "higher" },
    cumulativeEggs: { label: "تخم تجمعی", unit: "egg/hen", direction: "higher" },
    fertility: { label: "نطفه‌داری", unit: "%", direction: "higher" },
    hatchability: { label: "جوجه‌درآوری", unit: "%", direction: "higher" }
};

function standardRecord(ageDays, values = {}) {
    return { ageDays: Number(ageDays), ...values };
}

/* Official values intentionally limited to values we can trace to breeder documents. */
const VERIFIED_STANDARDS = {
    broiler: {
        cobb: {
            "Cobb500": {
                sourceYear: 2022,
                sourceType: "official-performance-objective",
                sourceLabel: "Cobb500 Broiler Performance & Nutrition Supplement 2022 (As-Hatched)",
                sourceUrl: "https://www.cobbgenetics.com/assets/Cobb-Files/2022-Cobb500-Broiler-Performance-Nutrition-Supplement.pdf",
                records: [
                    standardRecord(7,  { bodyWeight: 202,  dailyFeed: 34,  fcr: 0.891 }),
                    standardRecord(14, { bodyWeight: 570,  dailyFeed: 80,  fcr: 1.029 }),
                    standardRecord(21, { bodyWeight: 1116, dailyFeed: 125, fcr: 1.182 }),
                    standardRecord(28, { bodyWeight: 1783, dailyFeed: 165, fcr: 1.322 }),
                    standardRecord(35, { bodyWeight: 2521, dailyFeed: 194, fcr: 1.441 }),
                    standardRecord(42, { bodyWeight: 3278, dailyFeed: 220, fcr: 1.555 }),
                    standardRecord(49, { bodyWeight: 4001, dailyFeed: 247, fcr: 1.686 }),
                    standardRecord(56, { bodyWeight: 4641, dailyFeed: 262, fcr: 1.842 })
                ]
            }
        },
        aviagen_ross: {
            "Ross 308": {
                sourceYear: 2022,
                sourceType: "official-performance-objective",
                sourceLabel: "Aviagen Ross 308 Broiler Performance Objectives 2022 (As-Hatched)",
                sourceUrl: "https://ar.aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf",
                records: [
                    standardRecord(1,  { bodyWeight: 62,  dailyFeed: 12, cumulativeFeed: 12, fcr: 0.196 }),
                    standardRecord(7,  { bodyWeight: 213, dailyFeed: 35, cumulativeFeed: 166, fcr: 0.780 }),
                    standardRecord(14, { bodyWeight: 533, dailyFeed: 67, cumulativeFeed: 535, fcr: 1.005 }),
                    standardRecord(21, { bodyWeight: 978, dailyFeed: 99, cumulativeFeed: 1117, fcr: 1.142 }),
                    standardRecord(28, { bodyWeight: 1536, dailyFeed: 145, cumulativeFeed: 2051, fcr: 1.269 }),
                    standardRecord(35, { bodyWeight: 2296, dailyFeed: 180, cumulativeFeed: 3211, fcr: 1.399 }),
                    standardRecord(42, { bodyWeight: 2998, dailyFeed: 207, cumulativeFeed: 4586, fcr: 1.531 }),
                    standardRecord(49, { bodyWeight: 3681, dailyFeed: 225, cumulativeFeed: 6115, fcr: 1.663 }),
                    standardRecord(56, { bodyWeight: 4318, dailyFeed: 234, cumulativeFeed: 7733, fcr: 1.793 })
                ]
            }
        }
    },

    layer: {
        hyline: {
            "W-80": {
                sourceYear: 2026,
                sourceType: "official-performance-standard",
                sourceLabel: "Hy-Line W-80 Commercial Layers Performance Standards — April 2026",
                sourceUrl: "https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80%20STD%20ENG.pdf",
                records: [
                    standardRecord(119, { bodyWeight: 1240.5, dailyFeed: 73, dailyWater: 110, uniformity10: 90 }),
                    standardRecord(126, { bodyWeight: 1286.5, dailyFeed: 75, dailyWater: 110 }),
                    standardRecord(133, { bodyWeight: 1329.5, dailyFeed: 80.7, dailyWater: 121.1, eggProduction: 6.6, eggWeight: 45.45 }),
                    standardRecord(140, { bodyWeight: 1368, dailyFeed: 84.55, dailyWater: 126.9, eggProduction: 43.35, eggWeight: 47.95 }),
                    standardRecord(147, { bodyWeight: 1401.5, dailyFeed: 88.25, dailyWater: 132.6, eggProduction: 73.8, eggWeight: 49.75 }),
                    standardRecord(154, { bodyWeight: 1432.5, dailyFeed: 92.1, dailyWater: 138.7, eggProduction: 83.5, eggWeight: 51.35 }),
                    standardRecord(168, { bodyWeight: 1486.5, dailyFeed: 94.1, dailyWater: 141.1, eggProduction: 91.65, eggWeight: 54.3 }),
                    standardRecord(182, { bodyWeight: 1532.5, dailyFeed: 97.3, dailyWater: 145.9, eggProduction: 94.4, eggWeight: 56.65 }),
                    standardRecord(196, { bodyWeight: 1568.5, dailyFeed: 103.0, dailyWater: 154.7, eggProduction: 96.3, eggWeight: 59.55 }),
                    standardRecord(224, { bodyWeight: 1600.5, dailyFeed: 107.0, dailyWater: 160.5, eggProduction: 92.7, eggWeight: 62.0 }),
                    standardRecord(252, { bodyWeight: 1614.5, dailyFeed: 107.0, dailyWater: 160.6, eggProduction: 91.1, eggWeight: 63.1 }),
                    standardRecord(280, { bodyWeight: 1618.5, dailyFeed: 107.0, dailyWater: 160.6, eggProduction: 90.4, eggWeight: 64.0 }),
                    standardRecord(350, { bodyWeight: 1629.0, dailyFeed: 107.0, dailyWater: 160.6, eggProduction: 93.25, eggWeight: 64.55 }),
                    standardRecord(420, { bodyWeight: 1635.0, dailyFeed: 107.0, dailyWater: 160.6, eggProduction: 91.55, eggWeight: 64.65 }),
                    standardRecord(490, { bodyWeight: 1683.0, dailyFeed: 107.0, dailyWater: 160.6, eggProduction: 91.0, eggWeight: 64.5 }),
                    standardRecord(560, { bodyWeight: 1695.0, dailyFeed: 107.0, dailyWater: 160.6, eggProduction: 86.95, eggWeight: 64.8 }),
                    standardRecord(700, { bodyWeight: 1714.5, dailyFeed: 108.4, dailyWater: 166.2, eggProduction: 0, eggWeight: 64.9 })
                ]
            },
            "W-80 Plus": {
                sourceYear: 2024,
                sourceType: "official-performance-standard",
                sourceLabel: "Hy-Line W-80 Plus Commercial Layers Performance Standards",
                sourceUrl: "https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80PLUS%20STD%20ENG.pdf",
                records: [
                    standardRecord(126, { bodyWeight: 1280, dailyFeed: 73 }),
                    standardRecord(182, { bodyWeight: 1360, dailyFeed: 100 }),
                    standardRecord(490, { bodyWeight: 1710, dailyFeed: 104.9, eggWeight: 63.4 }),
                    standardRecord(700, { bodyWeight: 1820, dailyFeed: 113.2, eggWeight: 68.8 })
                ]
            },
            "W-80 Pro": {
                sourceYear: 2026,
                sourceType: "official-performance-standard",
                sourceLabel: "Hy-Line W-80 Pro Commercial Layers Performance Standards — 2026",
                sourceUrl: "https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80R%20STD%20ENG.pdf",
                records: [
                    standardRecord(119, { bodyWeight: 1156 }),
                    standardRecord(182, { bodyWeight: 1210 }),
                    standardRecord(490, { bodyWeight: 1570, dailyFeed: 102.8, eggWeight: 62.4 }),
                    standardRecord(700, { bodyWeight: 1701, dailyFeed: 106.4, eggWeight: 64.3 })
                ]
            }
        }
    },

    pullet: {
        hyline: {
            "W-80": {
                sourceYear: 2026,
                sourceType: "official-performance-standard",
                sourceLabel: "Hy-Line W-80 Commercial Layers Performance Standards — Rearing, April 2026",
                sourceUrl: "https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80%20STD%20ENG.pdf",
                records: [
                    standardRecord(7, { bodyWeight: 71, dailyFeed: 14.5, dailyWater: 21.5 }),
                    standardRecord(14, { bodyWeight: 131, dailyFeed: 19, dailyWater: 28.5, uniformity10: 85 }),
                    standardRecord(21, { bodyWeight: 196.5, dailyFeed: 22.5, dailyWater: 34.5 }),
                    standardRecord(28, { bodyWeight: 268, dailyFeed: 26.5, dailyWater: 39.5 }),
                    standardRecord(35, { bodyWeight: 346, dailyFeed: 31.5, dailyWater: 47, uniformity10: 80 }),
                    standardRecord(42, { bodyWeight: 432, dailyFeed: 36, dailyWater: 54 }),
                    standardRecord(49, { bodyWeight: 525, dailyFeed: 40.5, dailyWater: 60, uniformity10: 85 }),
                    standardRecord(56, { bodyWeight: 621.5, dailyFeed: 44, dailyWater: 66 }),
                    standardRecord(63, { bodyWeight: 718, dailyFeed: 47.5, dailyWater: 70.5 }),
                    standardRecord(70, { bodyWeight: 811.5, dailyFeed: 50, dailyWater: 75.5 }),
                    standardRecord(77, { bodyWeight: 897, dailyFeed: 53, dailyWater: 80 }),
                    standardRecord(84, { bodyWeight: 973, dailyFeed: 56, dailyWater: 84.5 }),
                    standardRecord(91, { bodyWeight: 1038, dailyFeed: 59.5, dailyWater: 89.5 }),
                    standardRecord(98, { bodyWeight: 1096.5, dailyFeed: 63, dailyWater: 94.5 }),
                    standardRecord(105, { bodyWeight: 1146.5, dailyFeed: 66, dailyWater: 99 }),
                    standardRecord(112, { bodyWeight: 1193.5, dailyFeed: 70, dailyWater: 105 }),
                    standardRecord(119, { bodyWeight: 1240.5, dailyFeed: 73, dailyWater: 110, uniformity10: 90 })
                ]
            }
        }
    },

    breeder: {
        aviagen_ross: {
            "Ross 308": {
                sourceYear: 2021,
                sourceType: "official-performance-objective",
                sourceLabel: "Ross 308 Parent Stock Performance Objectives 2021",
                sourceUrl: "https://ross-intl.aviagen.com/assets/Tech_Center/Ross_PS/Ross308-ParentStock-PerformanceObjectives-2021-EN.pdf",
                notes: "Official Ross 308 parent-stock objectives. Female body weight/feed, male body weight/feed, egg production, hatching eggs and hatchability are documented separately in the source.",
                records: [
                    standardRecord(175, { bodyWeight: 2970, dailyFeed: 127, henHousedProduction: 5.4, hatchability: 0 }),
                    standardRecord(182, { bodyWeight: 3090, dailyFeed: 144, henHousedProduction: 23.3, hatchability: 78.3 }),
                    standardRecord(189, { bodyWeight: 3190, dailyFeed: 159, henHousedProduction: 53.3, hatchability: 81.1 }),
                    standardRecord(196, { bodyWeight: 3290, dailyFeed: 167, henHousedProduction: 74.7, hatchability: 83.5 }),
                    standardRecord(203, { bodyWeight: 3360, dailyFeed: 167, henHousedProduction: 83.3, hatchability: 85.5 }),
                    standardRecord(210, { bodyWeight: 3410, dailyFeed: 167, henHousedProduction: 86.2, hatchability: 87.2 }),
                    standardRecord(217, { bodyWeight: 3450, dailyFeed: 167, henHousedProduction: 86.9, hatchability: 88.6 }),
                    standardRecord(224, { bodyWeight: 3490, dailyFeed: 167, henHousedProduction: 86.2, hatchability: 89.6 }),
                    standardRecord(238, { bodyWeight: 3570, dailyFeed: 167, henHousedProduction: 83.9, hatchability: 91.1 }),
                    standardRecord(252, { bodyWeight: 3630, dailyFeed: 167, henHousedProduction: 81.6, hatchability: 91.6 }),
                    standardRecord(280, { bodyWeight: 3725, dailyFeed: 165, henHousedProduction: 76.9, hatchability: 91.1 }),
                    standardRecord(308, { bodyWeight: 3805, dailyFeed: 163, henHousedProduction: 72.3, hatchability: 89.1 }),
                    standardRecord(336, { bodyWeight: 3885, dailyFeed: 162, henHousedProduction: 67.6, hatchability: 86.3 }),
                    standardRecord(364, { bodyWeight: 3960, dailyFeed: 160, henHousedProduction: 63.0, hatchability: 82.4 }),
                    standardRecord(392, { bodyWeight: 4005, dailyFeed: 157, henHousedProduction: 58.3, hatchability: 78.5 }),
                    standardRecord(420, { bodyWeight: 4045, dailyFeed: 155, henHousedProduction: 53.7, hatchability: 0 }),
                    standardRecord(448, { bodyWeight: 4085, dailyFeed: 154, henHousedProduction: 49.1, hatchability: 0 })
                ]
            }
        }
    }
};

/*
   MANAGEMENT TARGETS
   These are deliberately labelled as management standards.
   They are operational targets for monitoring, not genetic claims.
   The clinic can revise them by version without altering historical records.
*/
const MANAGEMENT_STANDARD_VERSION = "2026.1";

const MANAGEMENT_STANDARDS = {
    broiler: {
        sourceLabel: "استاندارد مدیریتی پایش گوشتی — نسخه 2026.1",
        sourceType: "management-standard",
        version: MANAGEMENT_STANDARD_VERSION,
        notes: "برای شاخص‌هایی که کاتالوگ رسمی سویه/نسخه در دسترس نیست، فقط اهداف مدیریتی پایش استفاده می‌شود. وزن و FCR از این پروفایل جایگزین استاندارد رسمی سویه نمی‌شوند.",
        records: [
            standardRecord(1,  { cv: 10, uniformity10: 80, uniformity15: 90 }),
            standardRecord(7,  { cv: 10, uniformity10: 80, uniformity15: 90 }),
            standardRecord(14, { cv: 10, uniformity10: 80, uniformity15: 90 }),
            standardRecord(21, { cv: 10, uniformity10: 80, uniformity15: 90 }),
            standardRecord(28, { cv: 10, uniformity10: 80, uniformity15: 90 }),
            standardRecord(35, { cv: 10, uniformity10: 80, uniformity15: 90 }),
            standardRecord(42, { cv: 10, uniformity10: 80, uniformity15: 90 }),
            standardRecord(49, { cv: 10, uniformity10: 80, uniformity15: 90 }),
            standardRecord(56, { cv: 10, uniformity10: 80, uniformity15: 90 })
        ]
    },
    pullet: {
        sourceLabel: "استاندارد مدیریتی پایش پولت — نسخه 2026.1",
        sourceType: "management-standard",
        version: MANAGEMENT_STANDARD_VERSION,
        notes: "هدف یکنواختی ±10% بر پایه توصیه‌های Hy-Line برای پایش پولت؛ وزن هدف فقط در صورت نبود سند رسمی سویه، به‌صورت مدیریتی نمایش داده نمی‌شود.",
        records: [
            standardRecord(28, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 1.90 }),
            standardRecord(56, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 1.85 }),
            standardRecord(84, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 1.95 }),
            standardRecord(112, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 1.90 }),
            standardRecord(126, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 1.85 })
        ]
    },
    layer: {
        sourceLabel: "استاندارد مدیریتی پایش تخم‌گذار — نسخه 2026.1",
        sourceType: "management-standard",
        version: MANAGEMENT_STANDARD_VERSION,
        notes: "اهداف یکنواختی و CV برای پایش مدیریتی هستند؛ شاخص‌های تولید/وزن تخم در صورت وجود سند رسمی سویه از همان سند خوانده می‌شوند.",
        records: [
            standardRecord(119, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 2.20 }),
            standardRecord(140, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 2.15 }),
            standardRecord(182, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 2.10 }),
            standardRecord(280, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 2.05 }),
            standardRecord(420, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 2.10 }),
            standardRecord(700, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 2.15 })
        ]
    },
    breeder: {
        sourceLabel: "استاندارد مدیریتی پایش مرغ مادر — نسخه 2026.1",
        sourceType: "management-standard",
        version: MANAGEMENT_STANDARD_VERSION,
        notes: "اهداف یکنواختی و CV برای پایش مدیریتی هستند؛ منحنی عملکرد و تولید فقط در صورت وجود سند رسمی سویه استفاده می‌شود.",
        records: [
            standardRecord(84, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 2.60 }),
            standardRecord(140, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 2.55 }),
            standardRecord(175, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 2.50 }),
            standardRecord(280, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 2.70 }),
            standardRecord(420, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 2.90 }),
            standardRecord(560, { cv: 10, uniformity10: 80, uniformity15: 90, fcr: 3.10 })
        ]
    }
};

const STANDARD_SOURCES = {
    aviagen: "Official Aviagen technical resources",
    hyline: "Official Hy-Line technical resources",
    cobb: "Official Cobb technical resources",
    lohmann: "Official Lohmann Breeders technical resources",
    management: "استاندارد مدیریتی مرکز تخصصی سلامت طیور آدینه"
};

function normalizeStandardKey(value) {
    return String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function getCatalog(type) { return POULTRY_CATALOG[type] || null; }
function getGenetics(type) { return POULTRY_CATALOG[type]?.genetics || []; }
function getStrains(type, geneticsId) {
    return getGenetics(type).find(item => item.id === geneticsId)?.strains || [];
}

function resolveGeneticsAndStrain(type, geneticsId, strain) {
    const catalog = getCatalog(type);
    const rawGenetics = String(geneticsId || "").trim();
    const rawStrain = String(strain || "").trim();
    if (!catalog) return { geneticsId: rawGenetics, strain: rawStrain };
    const direct = catalog.genetics.find(g => g.id === rawGenetics);
    if (direct) return { geneticsId: rawGenetics, strain: rawStrain || direct.strains[0] || "" };
    const wanted = normalizeStandardKey(rawStrain || rawGenetics);
    const found = catalog.genetics.find(g => g.strains.some(s => normalizeStandardKey(s) === wanted));
    return found ? { geneticsId: found.id, strain: rawStrain || found.strains[0] || "" } : { geneticsId: rawGenetics, strain: rawStrain };
}

function getOfficialStandard(type, geneticsId, strain) {
    const r = resolveGeneticsAndStrain(type, geneticsId, strain);
    return VERIFIED_STANDARDS[type]?.[r.geneticsId]?.[r.strain] || null;
}

function getManagementStandard(type) {
    return MANAGEMENT_STANDARDS[type] || MANAGEMENT_STANDARDS.broiler;
}

function getStandard(type, geneticsId, strain) {
    const official = getOfficialStandard(type, geneticsId, strain);
    const management = getManagementStandard(type);
    return {
        type,
        geneticsId: resolveGeneticsAndStrain(type, geneticsId, strain).geneticsId,
        strain: resolveGeneticsAndStrain(type, geneticsId, strain).strain,
        official,
        management,
        sourceType: official ? "mixed-official-management" : "management-standard",
        sourceLabel: official ? "استاندارد ژنتیکی رسمی + استاندارد مدیریتی برای شاخص‌های فاقد مرجع رسمی" : management.sourceLabel,
        sourceYear: official?.sourceYear || null,
        version: official?.sourceYear || management.version
    };
}

function interpolate(points, age) {
    const valid = points.map(p => ({ age: Number(p.ageDays), value: Number(p.value) })).filter(p => Number.isFinite(p.age) && Number.isFinite(p.value)).sort((a,b) => a.age-b.age);
    if (!valid.length || !Number.isFinite(age)) return null;
    if (age < valid[0].age || age > valid[valid.length - 1].age) return null;
    const exact = valid.find(p => p.age === age);
    if (exact) return exact.value;
    for (let i=1; i<valid.length; i++) {
        const a=valid[i-1], b=valid[i];
        if (age >= a.age && age <= b.age) {
            const t=(age-a.age)/(b.age-a.age);
            return a.value + (b.value-a.value)*t;
        }
    }
    return null;
}

function getStandardMetricAtAge(standard, metric, ageDays) {
    if (!standard) return { value: null, sourceType: null, sourceLabel: null, isFallback: false };
    const age = Number(ageDays);
    const officialPoints = standard.official?.records || [];
    const managementPoints = standard.management?.records || [];
    const official = interpolate(officialPoints.map(r => ({ ageDays:r.ageDays, value:r[metric] })), age);
    if (official !== null) {
        return { value: official, sourceType: standard.official.sourceType, sourceLabel: standard.official.sourceLabel, isFallback: false };
    }
    const derived = getDerivedStandardMetricAtAge(standard, metric, age);
    if (derived) return derived;
    const management = interpolate(managementPoints.map(r => ({ ageDays:r.ageDays, value:r[metric] })), age);
    if (management !== null) {
        return { value: management, sourceType: standard.management.sourceType, sourceLabel: standard.management.sourceLabel, isFallback: Boolean(standard.official) };
    }
    return { value: null, sourceType: null, sourceLabel: null, isFallback: false };
}


function getDerivedStandardMetricAtAge(standard, metric, ageDays) {
    if (!standard || metric !== "fcr") return null;
    const age = Number(ageDays);
    if (!Number.isFinite(age)) return null;

    const points = standard.official?.records || [];
    const type = standard.type;

    // Layer: feed-to-egg-mass FCR. The official W-80 curve supplies
    // daily feed, egg production and egg weight; egg mass is derived
    // mathematically from those published values.
    if (type === "layer") {
        const derived = points.map(r => {
            const feed = Number(r.dailyFeed);
            const prod = Number(r.eggProduction);
            const eggWeight = Number(r.eggWeight);
            if (![feed, prod, eggWeight].every(Number.isFinite) || prod <= 0 || eggWeight <= 0) return null;
            const eggMassGPerHenDay = (prod / 100) * eggWeight;
            if (eggMassGPerHenDay <= 0) return null;
            return { ageDays: r.ageDays, value: feed / eggMassGPerHenDay };
        }).filter(Boolean);
        const v = interpolate(derived, age);
        if (v !== null) return {
            value: Number(v.toFixed(3)),
            sourceType: standard.official?.sourceType || "official-performance-standard",
            sourceLabel: (standard.official?.sourceLabel || "استاندارد رسمی") + " — FCR مشتق‌شده از Feed / Egg Mass",
            isFallback: false
        };
    }

    // Pullet: growth FCR = feed intake / live-weight gain.
    // It is a derived management KPI, not a genetic claim.
    if (type === "pullet") {
        const src = points.filter(r => Number.isFinite(Number(r.ageDays)) && Number.isFinite(Number(r.bodyWeight)) && Number.isFinite(Number(r.dailyFeed)))
            .sort((a,b) => Number(a.ageDays)-Number(b.ageDays));
        const derived = [];
        for (let i=1; i<src.length; i++) {
            const prev=src[i-1], cur=src[i];
            const days=Number(cur.ageDays)-Number(prev.ageDays);
            const gainG=Number(cur.bodyWeight)-Number(prev.bodyWeight);
            if (days<=0 || gainG<=0) continue;
            const feedG=Number(cur.dailyFeed)*days;
            derived.push({ageDays:Number(cur.ageDays), value:feedG/gainG});
        }
        const v=interpolate(derived, age);
        if (v!==null) return {
            value:Number(v.toFixed(3)),
            sourceType:"derived-performance-standard",
            sourceLabel:(standard.official?.sourceLabel || "استاندارد رسمی") + " — FCR رشدِ مشتق‌شده",
            isFallback:false
        };
    }

    return null;
}

function getStandardValueAtAge(standard, metric, ageDays) {
    return getStandardMetricAtAge(standard, metric, ageDays).value;
}

function getStandardLabelAtAge(standard, metric, ageDays) {
    const result = getStandardMetricAtAge(standard, metric, ageDays);
    if (!result.value && result.value !== 0) return "بدون استاندارد";
    return result.sourceType === "management-standard" ? "استاندارد مدیریتی" : "استاندارد ژنتیکی رسمی";
}

function getStandardMeta(standard, metric, ageDays) {
    return getStandardMetricAtAge(standard, metric, ageDays);
}

if (typeof window !== "undefined") {
    window.POULTRY_CATALOG = POULTRY_CATALOG;
    window.PERFORMANCE_METRICS = PERFORMANCE_METRICS;
    window.VERIFIED_STANDARDS = VERIFIED_STANDARDS;
    window.MANAGEMENT_STANDARDS = MANAGEMENT_STANDARDS;
    window.getOfficialStandard = getOfficialStandard;
    window.getManagementStandard = getManagementStandard;
    window.getStandard = getStandard;
    window.getStandardValueAtAge = getStandardValueAtAge;
    window.getStandardMetricAtAge = getStandardMetricAtAge;
    window.getStandardLabelAtAge = getStandardLabelAtAge;
    window.getStandardMeta = getStandardMeta;
}
