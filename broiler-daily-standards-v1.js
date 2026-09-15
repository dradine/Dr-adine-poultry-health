/* ADINE — ISOLATED BROILER DAILY MONITORING STANDARDS V1
   Source hierarchy:
   1) breeder-published official guidance/objectives
   2) management range where no single official daily value exists
   Never presented as a universal biological law.
*/
window.ADINE_BROILER_DAILY_STANDARDS_V1 = {
  version: "2026-09-15.v1",
  sourcePolicy: "official-first-management-fallback",
  common: {
    cropFill: {
      2: { target: 75, min: 75, sourceType: "official", source: "Aviagen 2025 Broiler Management Handbooks" },
      4: { target: 80, min: 80, sourceType: "official", source: "Aviagen 2025 Broiler Management Handbooks" },
      8: { target: 85, min: 80, sourceType: "official", source: "Aviagen 2025 Broiler Management Handbooks" },
      12: { target: 90, min: 85, sourceType: "official", source: "Aviagen 2025 Broiler Management Handbooks" },
      24: { target: 95, min: 95, sourceType: "official", source: "Aviagen 2025 Broiler Management Handbooks" }
    },
    ventTemperatureC: { min: 39.4, max: 40.5, sourceType: "official", source: "Aviagen 2025 Broiler Management Handbooks" },
    firstWeekLighting: { day1: { light: 23, dark: 1 }, day2: { light: 22, dark: 2 }, day3: { light: 21.5, dark: 2.5 }, day4: { light: 21, dark: 3 }, day5: { light: 20.5, dark: 3.5 }, day6: { light: 20, dark: 4 }, day7: { light: 20, dark: 4 }, sourceType: "official", source: "Aviagen 2025 Broiler Management Handbook" },
    humidity: { day1to3: [45, 55], day4to7: [50, 60], sourceType: "management", source: "Hubbard brooding guidance + Aviagen RH/temperature guidance" },
    waterFeedRatio: { min: 1.6, target: 1.8, max: 2.0, unit: "L/kg", sourceType: "management", source: "Cobb/Hubbard broiler guidance; temperature-dependent" },
    feedForm: ["کرامب (Crumb)", "مینی‌پلت (Mini-pellet)", "پلت ریز", "آردی / Mash"],
    airQuality: { ammoniaAction: 10, ammoniaCritical: 20, co2Action: 3000, sourceType: "management", source: "broiler environmental management practice; local regulations may be stricter" },
    litterQuality: ["خشک و مناسب", "کمی مرطوب", "مرطوب", "کلوخه‌ای / کیکی", "خیلی خشک و پرگردوغبار"]
  },
  strains: {
    "Ross 308": {
      dayWeightG: { 1: 63, 2: 82, 3: 103, 4: 126, 5: 152, 6: 181, 7: 213 },
      dayWeightSource: "Aviagen Ross 308 Performance Objectives — breeder-published objective; sex/variant dependent",
      day7Multiplier: { min: 4.0, target: 4.0, sourceType: "official-management" }
    },
    "Ross 308 FF": {
      dayWeightG: { 1: 63, 2: 82, 3: 103, 4: 126, 5: 152, 6: 181, 7: 213 },
      dayWeightSource: "Aviagen Ross 308/308 FF early-management framework; exact objective depends on variant",
      day7Multiplier: { min: 4.0, target: 4.0, sourceType: "official-management" }
    },
    "Arbor Acres": {
      dayWeightG: null,
      dayWeightSource: "No universal official daily 1–7 table used here; app uses breeder day-7 multiplier and flock-specific chick weight",
      day7Multiplier: { min: 4.0, target: 4.0, sourceType: "official" }
    },
    "Indian River": {
      dayWeightG: null,
      dayWeightSource: "No universal official daily 1–7 table used here; app uses breeder day-7 multiplier and flock-specific chick weight",
      day7Multiplier: { min: 4.0, target: 4.0, sourceType: "official" }
    },
    "Cobb 500": {
      dayWeightG: { 1: 55, 2: 71, 3: 90, 4: 112, 5: 138, 6: 168, 7: 202 },
      dayWeightSource: "Cobb500 breeder-published performance objective (mixed-sex reference)",
      day7Multiplier: { min: 4.6, target: 4.6, sourceType: "official" }
    },
    "Hubbard Efficiency Plus": {
      dayWeightG: null,
      dayWeightSource: "Hubbard recommends at least 4.2× initial chick weight at day 7; daily values are not treated as official",
      day7Multiplier: { min: 4.2, target: 4.2, sourceType: "official" }
    },
    "Hubbard": {
      dayWeightG: null,
      dayWeightSource: "Hubbard recommends at least 4.2× initial chick weight at day 7; daily values are not treated as official",
      day7Multiplier: { min: 4.2, target: 4.2, sourceType: "official" }
    },
    "default": {
      dayWeightG: null,
      dayWeightSource: "No strain-specific official daily objective loaded; use flock initial weight × management trajectory and label as management",
      day7Multiplier: { min: 4.0, target: 4.0, sourceType: "management" }
    }
  }
};
