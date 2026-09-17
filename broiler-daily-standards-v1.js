/* ADINE — ISOLATED BROILER DAILY MONITORING STANDARDS V2
   Scope: ONLY the daily monitoring module.

   Standard hierarchy (highest priority first):
   1) Official breeder / genetics-company guidance or performance objectives.
   2) Explicit management guidance from the same breeder when an official daily
      numeric objective is not published.
   3) Evidence-based management reference when neither exists.

   Important:
   - A derived daily value is NEVER labelled as an official breeder value.
   - Daily body-weight values between published checkpoints are operational
     reference values derived from the strain's published early-life anchor(s).
   - These values are intentionally isolated from the canonical weekly engine.
*/
window.ADINE_BROILER_DAILY_STANDARDS_V1 = Object.freeze({
  version: "2026-09-17.v4",
  scope: "daily-monitoring-only",
  sourcePolicy: "official-first-management-same-breeder-second-evidence-third",
  derivationPolicy: {
    dailyWeight: {
      method: "monotonic-normalized-early-growth-curve",
      exponent: 1.35,
      description: "When the breeder publishes weekly/day-7 anchors but not daily day-1-to-7 weights, daily operational reference points are interpolated monotonically between the chick-weight anchor and the published day-7 objective. They are management-derived, not official daily breeder objectives.",
      rationale: "This prevents fabricated official values while still providing a stable day-by-day comparator for field monitoring. The curve is deliberately labelled derived and must not overwrite breeder-published checkpoints."
    }
  },
  common: {
    cropFill: {
      2: { target: 75, min: 75, sourceType: "official", priority: 1, source: "Aviagen 2025 Broiler Management Handbooks", rationale: "Aviagen defines 75% full crops at 2 hours as the minimum early-start target." },
      4: { target: 80, min: 80, sourceType: "official", priority: 1, source: "Aviagen 2025 Broiler Management Handbooks", rationale: "Aviagen defines 80% at 4 hours; early crop fill is a direct indicator of feed/water access and chick start." },
      8: { target: 80, min: 80, sourceType: "official", priority: 1, source: "Aviagen 2025 Broiler Management Handbooks", rationale: "Aviagen target is >80%; 80% is stored as the minimum alert boundary." },
      12: { target: 85, min: 85, sourceType: "official", priority: 1, source: "Aviagen 2025 Broiler Management Handbooks", rationale: "Aviagen target is >85%; 85% is stored as the minimum alert boundary." },
      24: { target: 95, min: 95, sourceType: "official", priority: 1, source: "Aviagen 2025 Broiler Management Handbooks", rationale: "Aviagen target is >95% at 24 hours, making this the principal first-day crop-fill checkpoint." }
    },
    chickVentTemperatureC: {
      min: 39.4, max: 40.5, sourceType: "official", priority: 1,
      source: "Aviagen 2025 Broiler Management Handbooks",
      appliesDays: [1,2],
      rationale: "Aviagen states that the ideal chick vent temperature during the first two days is 39.4–40.5°C and should be interpreted together with chick behaviour."
    },
    lighting: {
      day1: { light: 23, dark: 1 }, day2: { light: 22, dark: 2 }, day3: { light: 21.5, dark: 2.5 },
      day4: { light: 21, dark: 3 }, day5: { light: 20.5, dark: 3.5 }, day6: { light: 20, dark: 4 }, day7: { light: 20, dark: 4 },
      sourceType: "official-management", priority: 1,
      source: "Aviagen 2025 Ross/Arbor Acres/Indian River Broiler Management Handbooks",
      rationale: "Aviagen recommends 23L:1D initially and a progressive increase in darkness during the first week, reaching approximately 4–6 hours by day 7."
    },
    broodingTemperatureC: {
      default: { 1:[32,34], 2:[31,33], 3:[30.5,32], 4:[30,31], 5:[29.5,31], 6:[29,30.5], 7:[28.5,30.5] },
      sourceType: "management-reference", priority: 2,
      source: "Breeder brooding guidance cross-reference: Hubbard broiler brooding poster + Aviagen environmental guidance",
      rationale: "Exact set-points vary with RH, air speed, housing and chick behaviour. The daily band is therefore used as a management reference, not as a universal biological constant."
    },
    humidity: {
      default: { 1:[45,55], 2:[45,55], 3:[45,55], 4:[50,60], 5:[50,60], 6:[50,60], 7:[50,60] },
      sourceType: "management-reference", priority: 2,
      source: "Hubbard broiler brooding guidance + Aviagen brooding/environment guidance",
      rationale: "Brooding RH interacts with temperature and chick comfort; the band is deliberately conservative and is not presented as a strain-specific breeder objective."
    },
    waterFeedRatio: {
      min: 1.6, target: 1.8, max: 2.0, unit: "L/kg",
      sourceType: "management-reference", priority: 2,
      source: "Hubbard Efficiency Plus broiler guide; Cobb/Aviagen temperature-dependent water-intake guidance",
      rationale: "Broilers commonly consume roughly 1.6–2.0 L water per kg feed under normal conditions; temperature and watering system materially shift the ratio."
    },
    airQuality: {
      ammoniaAction: 10, ammoniaCritical: 20, co2Action: 3000,
      sourceType: "management-reference", priority: 3,
      source: "Daily-monitoring operational safety reference",
      rationale: "Used as an action-oriented environmental screen rather than a strain-specific breeder target; local welfare/regulatory limits override it."
    },
    litterQuality: ["خشک و مناسب", "کمی مرطوب", "مرطوب", "کلوخه‌ای / کیکی", "خیلی خشک و پرگردوغبار"]
  },
  strains: {
    "Ross 308": { producer:"Aviagen", day7WeightG:213, chickWeightG:44, dayWeightG:{1:62,2:80,3:101,4:124,5:150,6:180,7:213}, sourceType:"official-daily", sourcePriority:1, source:"Ross 308 / Ross 308 FF Broiler Performance Objectives", sourceUrl:"https://aviagen.com/na/brands/ross/products/ross-308", rationale:"Aviagen publishes day 0 as-hatched weight separately from day 1 onward; the first-week daily weights are breeder-published performance objectives." },
    "Ross 308 FF": { producer:"Aviagen", day7WeightG:213, chickWeightG:44, dayWeightG:{1:62,2:80,3:101,4:124,5:150,6:180,7:213}, sourceType:"official-daily", sourcePriority:1, source:"Ross 308 / Ross 308 FF Broiler Performance Objectives", sourceUrl:"https://aviagen.com/na/brands/ross/products/ross-308", rationale:"Aviagen publishes day 0 as-hatched weight separately from day 1 onward; the first-week daily weights are breeder-published performance objectives." },
    "Ross 708": { producer:"Aviagen", day7WeightG:204, chickWeightG:44, dayWeightG:{1:59,2:77,3:97,4:119,5:145,6:172,7:204}, sourceType:"official-daily", sourcePriority:1, source:"Ross 708 Broiler Performance Objectives", rationale:"Aviagen publishes day 0 as-hatched weight separately from day 1 onward; values are converted from the official metric/lb table and rounded to whole grams." },
    "Ross 308 AP": { producer:"Aviagen", day7WeightG:214, chickWeightG:44, dayWeightG:{1:62,2:80,3:101,4:125,5:151,6:181,7:214}, sourceType:"official-daily", sourcePriority:1, source:"Ross 308 AP Broiler Performance Objectives", rationale:"Aviagen publishes day 0 as-hatched weight separately from day 1 onward; the first-week daily weights are breeder-published performance objectives." },
    "Cobb500": { producer:"Cobb", day7WeightG:202, chickWeightG:42, dayWeightG:{1:55,2:71,3:90,4:112,5:138,6:168,7:202}, sourceType:"official-daily", sourcePriority:1, source:"Cobb500 Broiler Performance & Nutrition Supplement", rationale:"Cobb publishes the as-hatched day-0 weight separately from the day-1-to-7 performance table; these are breeder-published daily objectives." },
    "Cobb800": { producer:"Cobb", day7WeightG:202, chickWeightG:43, dayWeightG:{1:54,2:72,3:94,4:118,5:144,6:172,7:202}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Cobb800 Broiler Management Digital + Cobb800 broiler supplement", rationale:"The day-0 chick weight is kept as the hatch anchor; where a validated day-1-to-7 table is not available in the current source set, the daily series is derived monotonically from the validated early-life anchor and day-7 objective." },
    "Arbor Acres Plus": { producer:"Aviagen", day7WeightG:209, chickWeightG:42, dayWeightG:{1:54,2:73,3:95,4:120,5:148,6:178,7:209}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Arbor Acres Plus Broiler Performance Objectives + 2025 Arbor Acres Broiler Management Handbook", rationale:"The day-0 chick weight is treated as the hatch anchor; daily values are operationally derived monotonically from the validated early-life and day-7 objectives where an official daily table is not published." },
    "Arbor Acres Plus S": { producer:"Aviagen", day7WeightG:209, chickWeightG:42, dayWeightG:{1:54,2:73,3:95,4:120,5:148,6:178,7:209}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Arbor Acres Plus / Plus S Broiler Performance Objectives", rationale:"The day-0 chick weight is treated as the hatch anchor; daily values are operationally derived monotonically from the validated early-life and day-7 objectives where an official daily table is not published." },
    "Indian River": { producer:"Aviagen", day7WeightG:211, chickWeightG:44, dayWeightG:{1:62,2:80,3:101,4:124,5:150,6:179,7:211}, sourceType:"official-daily", sourcePriority:1, source:"Indian River / Indian River FF Broiler Performance Objectives", sourceUrl:"https://aviagen.com/assets/Tech_Center/LIR_Broiler/IndianRiver-BroilerPerformanceObjectives2022-EN.pdf", rationale:"Aviagen publishes the day-0 as-hatched weight separately from the day-1-to-7 body-weight objectives. The daily values shown here are breeder-published performance objectives, not derived values." },
    "Indian River FF": { producer:"Aviagen", day7WeightG:211, chickWeightG:44, dayWeightG:{1:62,2:80,3:101,4:124,5:150,6:179,7:211}, sourceType:"official-daily", sourcePriority:1, source:"Indian River / Indian River FF Broiler Performance Objectives", sourceUrl:"https://aviagen.com/assets/Tech_Center/LIR_Broiler/IndianRiver-BroilerPerformanceObjectives2022-EN.pdf", rationale:"Aviagen publishes the day-0 as-hatched weight separately from the day-1-to-7 body-weight objectives. The daily values shown here are breeder-published performance objectives, not derived values." },
    "Efficiency Plus": { producer:"Hubbard", day7WeightG:216, chickWeightG:43, dayWeightG:{1:56,2:75,3:98,4:124,5:153,6:183,7:216}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Hubbard Efficiency Plus Broiler Performance Objectives + Hubbard Broiler Brooding poster", rationale:"The day-0 chick weight is the hatch anchor; where a complete official daily first-week table is not available, the monitoring series is derived monotonically from the validated early-life and day-7 objectives and is explicitly not labelled official." },
    "Hubbard EDGE": { producer:"Hubbard", day7WeightG:217, chickWeightG:43, dayWeightG:{1:56,2:75,3:98,4:125,5:153,6:184,7:217}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Hubbard EDGE Broiler Performance Objectives + Hubbard broiler brooding guidance", rationale:"The day-0 chick weight is the hatch anchor; where a complete official daily first-week table is not available, the monitoring series is derived monotonically from the validated early-life and day-7 objectives and is explicitly not labelled official." },
    "Arian": { producer:"آرین ایران", day7WeightG:148, chickWeightG:42, dayWeightG:{1:50,2:62,3:76,4:92,5:109,6:128,7:148}, sourceType:"management-reference+derived-daily", sourcePriority:2, source:"Arian management reference used by the existing app + Iranian peer-reviewed Arian studies", rationale:"No current breeder-published first-week performance objective equivalent to the international breeder tables was located. Therefore the app uses the existing documented Arian management anchor and explicitly labels the daily series as management-derived; peer-reviewed Arian work supports strain-specific treatment rather than inventing an official target." }
  },
  default: {
    producer:"Unknown",
    dayWeightG:null,
    day7WeightG:null,
    sourceType:"no-strain-standard",
    sourcePriority:null,
    source:"No validated strain-specific standard loaded",
    rationale:"Unknown genetics must never silently inherit another strain's official target. The daily module should show no-data until a validated standard is added."
  },
  aliases: {
    "Ross 308":"Ross 308", "Ross 308 FF":"Ross 308 FF", "Ross 708":"Ross 708", "Ross 308 AP":"Ross 308 AP",
    "Cobb500":"Cobb500", "Cobb 500":"Cobb500", "Cobb800":"Cobb800", "Cobb 800":"Cobb800",
    "Arbor Acres Plus":"Arbor Acres Plus", "Arbor Acres Plus S":"Arbor Acres Plus S", "Arbor Acres":"Arbor Acres Plus",
    "Indian River":"Indian River", "Indian River FF":"Indian River FF",
    "Efficiency Plus":"Efficiency Plus", "Hubbard Efficiency Plus":"Efficiency Plus", "Hubbard EDGE":"Hubbard EDGE", "EDGE":"Hubbard EDGE",
    "Arian":"Arian", "آرین":"Arian"
  }
});
