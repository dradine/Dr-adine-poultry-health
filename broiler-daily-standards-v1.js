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
  version: "2026-09-17.v3",
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
    "Ross 308": { producer:"Aviagen", day7WeightG:213, chickWeightG:44, dayWeightG:{1:44,2:59,3:82,4:110,5:142,6:176,7:213}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Ross 308 / Ross 308 FF Broiler Performance Objectives + 2025 Ross Broiler Management Handbook", sourceUrl:"https://aviagen.com/na/brands/ross/products/ross-308", rationale:"Published breeder performance anchors are authoritative; daily values are derived only because the breeder objective is published at checkpoint ages rather than every day." },
    "Ross 308 FF": { producer:"Aviagen", day7WeightG:213, chickWeightG:44, dayWeightG:{1:44,2:59,3:82,4:110,5:142,6:176,7:213}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Ross 308 / Ross 308 FF Broiler Performance Objectives + 2025 Ross Broiler Management Handbook", sourceUrl:"https://aviagen.com/na/brands/ross/products/ross-308", rationale:"Ross 308 FF shares the published early performance framework; daily points remain explicitly derived where a daily table is not published." },
    "Ross 708": { producer:"Aviagen", day7WeightG:204, chickWeightG:44, dayWeightG:{1:44,2:58,3:80,4:107,5:137,6:169,7:204}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Ross 708 Broiler Performance Objectives", rationale:"Day-7 breeder objective is used directly; days 1–6 are derived operational checkpoints and are not represented as breeder-published daily values." },
    "Ross 308 AP": { producer:"Aviagen", day7WeightG:214, chickWeightG:44, dayWeightG:{1:44,2:59,3:83,4:111,5:142,6:177,7:214}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Ross 308 AP Broiler Performance Objectives", rationale:"Published day-7 anchor is preserved; intermediate daily values are derived and labelled accordingly." },
    "Cobb500": { producer:"Cobb", day7WeightG:202, chickWeightG:42, dayWeightG:{1:42,2:56,3:78,4:105,5:135,6:167,7:202}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Cobb500 Broiler Performance & Nutrition Supplement / Cobb broiler management guidance", rationale:"Cobb performance objectives provide the strain-specific anchor; intermediate first-week values are operationally derived where no daily table is published." },
    "Cobb800": { producer:"Cobb", day7WeightG:202, chickWeightG:43, dayWeightG:{1:43,2:57,3:79,4:105,5:135,6:167,7:202}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Cobb800 Broiler Management Digital + Cobb800 broiler supplement", sourceUrl:"https://www.cobbgenetics.com/products/cobb800", rationale:"Cobb800 has current breeder-specific brooding guidance; the published day-7 weight anchor is retained and daily weight points are explicitly derived." },
    "Arbor Acres Plus": { producer:"Aviagen", day7WeightG:209, chickWeightG:42, dayWeightG:{1:42,2:57,3:80,4:108,5:139,6:173,7:209}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Arbor Acres Plus Broiler Performance Objectives + 2025 Arbor Acres Broiler Management Handbook", rationale:"Arbor Acres publishes strain-specific performance objectives; daily points are derived only where the official table does not publish a daily value." },
    "Arbor Acres Plus S": { producer:"Aviagen", day7WeightG:209, chickWeightG:42, dayWeightG:{1:42,2:57,3:80,4:108,5:139,6:173,7:209}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Arbor Acres Plus / Plus S Broiler Performance Objectives", rationale:"Uses the breeder-published Plus/Plus S performance family and clearly labels intermediate daily values as derived." },
    "Indian River": { producer:"Aviagen", day7WeightG:211, chickWeightG:44, dayWeightG:{1:62,2:80,3:101,4:124,5:150,6:179,7:211}, sourceType:"official-daily", sourcePriority:1, source:"Indian River / Indian River FF Broiler Performance Objectives", sourceUrl:"https://aviagen.com/assets/Tech_Center/LIR_Broiler/IndianRiver-BroilerPerformanceObjectives2022-EN.pdf", rationale:"Aviagen publishes the day-0 as-hatched weight separately from the day-1-to-7 body-weight objectives. The daily values shown here are breeder-published performance objectives, not derived values." },
    "Indian River FF": { producer:"Aviagen", day7WeightG:211, chickWeightG:44, dayWeightG:{1:62,2:80,3:101,4:124,5:150,6:179,7:211}, sourceType:"official-daily", sourcePriority:1, source:"Indian River / Indian River FF Broiler Performance Objectives", sourceUrl:"https://aviagen.com/assets/Tech_Center/LIR_Broiler/IndianRiver-BroilerPerformanceObjectives2022-EN.pdf", rationale:"Aviagen publishes the day-0 as-hatched weight separately from the day-1-to-7 body-weight objectives. The daily values shown here are breeder-published performance objectives, not derived values." },
    "Efficiency Plus": { producer:"Hubbard", day7WeightG:216, chickWeightG:43, dayWeightG:{1:43,2:58,3:82,4:111,5:143,6:178,7:216}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Hubbard Efficiency Plus Broiler Performance Objectives + Hubbard Broiler Brooding poster", rationale:"Hubbard publishes a day-7 performance objective and detailed brooding guidance; daily weight points are derived only for monitoring continuity." },
    "Hubbard EDGE": { producer:"Hubbard", day7WeightG:217, chickWeightG:43, dayWeightG:{1:43,2:58,3:82,4:111,5:144,6:179,7:217}, sourceType:"official-anchor+derived-daily", sourcePriority:1, source:"Hubbard EDGE Broiler Performance Objectives + Hubbard broiler brooding guidance", rationale:"Hubbard provides strain-specific performance objectives; intermediate daily points are operationally derived and never labelled official." },
    "Arian": { producer:"آرین ایران", day7WeightG:148, chickWeightG:42, dayWeightG:{1:42,2:51,3:66,4:84,5:103,6:125,7:148}, sourceType:"management-reference+derived-daily", sourcePriority:2, source:"Arian management reference used by the existing app + Iranian peer-reviewed Arian studies", rationale:"No current breeder-published first-week performance objective equivalent to the international breeder tables was located. Therefore the app uses the existing documented Arian management anchor and explicitly labels the daily series as management-derived; peer-reviewed Arian work supports strain-specific treatment rather than inventing an official target." }
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
