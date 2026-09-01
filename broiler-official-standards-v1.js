/* =========================================================
   ADINE POULTRY HEALTH CENTER
   BROILER OFFICIAL PERFORMANCE REFERENCE REGISTRY v1
   ---------------------------------------------------------
   Scope: only the currently selectable broiler strains.
   Official values are kept separate from management targets.
   Weekly FCR is NOT stored as an official value unless the
   breeder explicitly publishes it; the report engine may derive
   a weekly value from official cumulative feed/weight points.
   Missing official ages remain null. No borrowing/extrapolation.
========================================================= */

const BROILER_OFFICIAL_STANDARDS_V1 = Object.freeze({
  productionType: "broiler",
  weeklyAges: [7,14,21,28,35,42,49,56],
  strains: {
    "Ross 308": {
      producer: "Aviagen", family: "Ross",
      variant: "As-Hatched", sourceYear: 2022,
      sourceType: "official-performance-objective",
      sourceLabel: "Ross 308 / Ross 308 FF Broiler Performance Objectives 2022",
      sourceUrl: "https://aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf",
      records: [
        [7,213,0.780],[14,533,1.005],[21,1012,1.142],[28,1616,1.269],
        [35,2296,1.399],[42,2998,1.531],[49,3681,1.663],[56,4318,1.793]
      ]
    },
    "Ross 308 FF": {
      producer: "Aviagen", family: "Ross",
      variant: "Fast-Feathering / As-Hatched", sourceYear: 2022,
      sourceType: "official-performance-objective",
      sourceLabel: "Ross 308 / Ross 308 FF Broiler Performance Objectives 2022",
      sourceUrl: "https://aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf",
      records: [
        [7,213,0.780],[14,533,1.005],[21,1012,1.142],[28,1616,1.269],
        [35,2296,1.399],[42,2998,1.531],[49,3681,1.663],[56,4318,1.793]
      ]
    },
    "Ross 708": {
      producer: "Aviagen", family: "Ross", variant: "As-Hatched", sourceYear: 2022,
      sourceType: "official-performance-objective",
      sourceLabel: "Ross 708 Broiler Performance Objectives 2022",
      sourceUrl: "https://aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss708-BroilerPerformanceObjectives2022-EN.pdf",
      records: [
        [7,204,0.770],[14,509,0.992],[21,966,1.127],[28,1543,1.254],
        [35,2191,1.382],[42,2862,1.512],[49,3514,1.642],[56,4122,1.771]
      ]
    },
    "Ross 308 AP": {
      producer: "Aviagen", family: "Ross", variant: "As-Hatched", sourceYear: 2022,
      sourceType: "official-performance-objective",
      sourceLabel: "Ross 308 AP Broiler Performance Objectives 2022",
      sourceUrl: "https://ap.aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308AP-BroilerPerformanceObjectives2022-EN.pdf",
      records: [
        [7,214,0.772],[14,540,0.995],[21,1033,1.130],[28,1657,1.257],
        [35,2360,1.386],[42,3086,1.516],[49,3791,1.646],[56,4446,1.776]
      ]
    },
    "Cobb500": {
      producer: "Cobb", family: "Cobb", variant: "As-Hatched", sourceYear: 2022,
      sourceType: "official-performance-objective",
      sourceLabel: "Cobb500 Broiler Performance & Nutrition Supplement 2022",
      sourceUrl: "https://www.cobbgenetics.com/assets/Cobb-Files/2022-Cobb500-Broiler-Performance-Nutrition-Supplement.pdf",
      records: [
        [7,202,0.891],[14,570,1.029],[21,1116,1.182],[28,1783,1.322],
        [35,2521,1.441],[42,3278,1.555],[49,4001,1.686],[56,4641,1.842]
      ]
    },
    "Cobb800": {
      producer: "Cobb", family: "Cobb", variant: "As-Hatched", sourceYear: 2026,
      sourceType: "official-performance-objective",
      sourceLabel: "Cobb800 Broiler Nutrition and Management Supplement 2026",
      sourceUrl: "https://www.cobbgenetics.com/assets/Cobb-Files/Cobb800_5-2026_Digital.pdf",
      records: [
        [7,200,0.825],[14,463,1.046],[21,953,1.163],[28,1583,1.281],
        [35,2295,1.400],[42,3035,1.520],[49,3742,1.639],[56,4359,1.762]
      ]
    },
    "Arbor Acres Plus": {
      producer: "Aviagen", family: "Arbor Acres", variant: "As-Hatched", sourceYear: 2022,
      sourceType: "official-performance-objective",
      sourceLabel: "Arbor Acres Plus / Plus S Broiler Performance Objectives 2022",
      sourceUrl: "https://aviagen.com/assets/Tech_Center/AA_Broiler/ArborAcres-BroilerPerformanceObjectives2022-EN.pdf",
      records: [
        [7,209,0.803],[14,527,1.021],[21,1006,1.157],[28,1611,1.285],
        [35,2287,1.416],[42,2981,1.548],[49,3649,1.680],[56,4263,1.810]
      ]
    },
    "Arbor Acres Plus S": {
      producer: "Aviagen", family: "Arbor Acres", variant: "Sexable / As-Hatched", sourceYear: 2022,
      sourceType: "official-performance-objective-family",
      sourceLabel: "Arbor Acres Plus / Plus S Broiler Performance Objectives 2022",
      sourceUrl: "https://aviagen.com/assets/Tech_Center/AA_Broiler/ArborAcres-BroilerPerformanceObjectives2022-EN.pdf",
      records: [
        [7,209,0.803],[14,527,1.021],[21,1006,1.157],[28,1611,1.285],
        [35,2287,1.416],[42,2981,1.548],[49,3649,1.680],[56,4263,1.810]
      ]
    },
    "Indian River": {
      producer: "Aviagen", family: "Indian River", variant: "As-Hatched", sourceYear: 2022,
      sourceType: "official-performance-objective",
      sourceLabel: "Indian River / Indian River FF Broiler Performance Objectives 2022",
      sourceUrl: "https://aviagen.com/assets/Tech_Center/LIR_Broiler/IndianRiver-BroilerPerformanceObjectives2022-EN.pdf",
      records: [
        [7,211,0.788],[14,531,1.003],[21,1010,1.142],[28,1616,1.275],
        [35,2295,1.411],[42,2995,1.549],[49,3671,1.686],[56,4297,1.822]
      ]
    },
    "Indian River FF": {
      producer: "Aviagen", family: "Indian River", variant: "Fast-Feathering / As-Hatched", sourceYear: 2022,
      sourceType: "official-performance-objective",
      sourceLabel: "Indian River / Indian River FF Broiler Performance Objectives 2022",
      sourceUrl: "https://aviagen.com/assets/Tech_Center/LIR_Broiler/IndianRiver-BroilerPerformanceObjectives2022-EN.pdf",
      records: [
        [7,211,0.788],[14,531,1.003],[21,1010,1.142],[28,1616,1.275],
        [35,2295,1.411],[42,2995,1.549],[49,3671,1.686],[56,4297,1.822]
      ]
    },
    "Efficiency Plus": {
      producer: "Hubbard", family: "Efficiency Plus", variant: "As-Hatched", sourceYear: 2025,
      sourceType: "official-performance-objective-partial",
      sourceLabel: "Hubbard Efficiency Plus Broiler Performance Objectives / official leaflet",
      sourceUrl: "https://www.hubbardbreeders.com/media/leaflet-hubbard-efficiency-plus-en.pdf",
      records: [
        [7,null,null],[14,null,null],[21,null,null],[28,1647,1.27],
        [35,2330,1.41],[42,3028,1.54],[49,3704,1.67],[56,4324,1.80]
      ]
    },
    "Hubbard EDGE": {
      producer: "Hubbard", family: "EDGE", variant: "As-Hatched", sourceYear: 2025,
      sourceType: "official-performance-objective",
      sourceLabel: "Hubbard EDGE Broiler Performance Objectives",
      sourceUrl: "https://www.hubbardbreeders.com/media/broiler-performance-objectives-edge-en.pdf",
      records: [
        [7,217,null],[14,550,null],[21,1058,1.13],[28,1685,1.26],
        [35,2383,1.38],[42,3098,1.51],[49,3789,1.64],[56,4423,1.77]
      ]
    },
    "Arian": {
      producer: "آرین ایران", family: "Arian", variant: "مواد غذایی متراکم / میانگین وزن", sourceYear: null,
      sourceType: "official-guide-reference",
      sourceLabel: "راهنمای پرورش جوجه گوشتی آرین — عملکرد گله با مواد غذایی متراکم",
      sourceUrl: null,
      records: [
        [7,148,1.00],[14,391,1.30],[21,767,1.41],[28,1291,1.52],
        [35,1830,1.63],[42,2340,1.76],[49,2890,1.87],[56,null,null]
      ]
    }
  }
});

function normalizeBroilerOfficialRecord(strain, index) {
  const s = BROILER_OFFICIAL_STANDARDS_V1.strains[strain];
  if (!s || !s.records[index]) return null;
  const [ageDays, bodyWeight, cumulativeFcr] = s.records[index];
  const previous = index > 0 ? s.records[index - 1] : null;
  return {
    ageDays, bodyWeight, cumulativeFcr,
    weeklyGain: previous && bodyWeight != null && previous[1] != null ? bodyWeight - previous[1] : null,
    official: true,
    weeklyFcrOfficial: false
  };
}

function getBroilerOfficialStandard(strain) {
  const s = BROILER_OFFICIAL_STANDARDS_V1.strains[strain];
  if (!s) return null;
  return {
    ...s,
    records: s.records.map((_, i) => normalizeBroilerOfficialRecord(strain, i))
  };
}
