const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const read = (path) => fs.readFileSync(path, "utf8");
const engineContext = { window: {}, console };
vm.createContext(engineContext);
vm.runInContext(read("layer-period-engine-v1.js"), engineContext, { filename: "layer-period-engine-v1.js" });
const E = engineContext.window.ADINE_LAYER_PERIOD_ENGINE_V1;
assert.ok(E, "Layer period engine must register");

const dailySource = read("layer-daily-monitoring-v1.js");
const dateStart = dailySource.indexOf("function jalaliToGregorian(");
const dateEnd = dailySource.indexOf("function setTodayJalali()", dateStart);
assert.ok(dateStart >= 0 && dateEnd > dateStart, "Layer daily Jalali parser must exist");
const dateContext = { g: { ADINE_LAYER_PERIOD_ENGINE_V1: E } };
vm.createContext(dateContext);
vm.runInContext(dailySource.slice(dateStart, dateEnd) + "\nthis.layerDateFns = { jalaliToIso };", dateContext);
const jalaliToIso = dateContext.layerDateFns.jalaliToIso;
assert.equal(jalaliToIso("۱۴۰۴/۰۵/۰۱"), "2025-07-23");
assert.equal(jalaliToIso("1404/5/1"), "2025-07-23");
assert.equal(jalaliToIso("۱۴۰۴-۰۵-۳۱"), "2025-08-22");
assert.equal(jalaliToIso("۱۴۰۳/۱۲/۳۰"), "2025-03-20");
assert.equal(jalaliToIso("۱۴۰۴/۱۲/۳۰"), "", "Invalid non-leap Esfand 30 must be rejected");
assert.equal(jalaliToIso("۱۴۰۴/۱۳/۰۱"), "", "Invalid month must be rejected");

const rows = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
  return {
    id: "daily-" + (i + 1),
    record_date: date,
    age_days: i + 1,
    opening_birds: 10000,
    feed_quantity_kg: 1100,
    water_quantity_l: 2000,
    egg_count: 9000,
    average_egg_weight_g: 60,
    hen_day_production_percent: 90,
    hen_housed_production_percent: 90,
    feed_per_hen_g: 110,
    water_per_hen_ml: 200,
    water_feed_ratio: 2000 / 1100,
    mortality_count: 0,
    cull_count: 0,
    livability_percent: 100
  };
});
const writes = [];
const db = {
  from(table) {
    return {
      async upsert(row, options) {
        writes.push({ table, row, options });
        return { error: null };
      }
    };
  }
};
(async () => {
  const result = await E.sync(
    { id: "layer-test", farm_id: "farm-test", house_id: "house-test", placement_date: "2026-01-01", initial_bird_count: 10000 },
    { id: "user-test" },
    db,
    rows
  );
  assert.equal(result.weeks.length, 2);
  const [week1, week2] = result.weeks;
  assert.deepEqual([week1.week_no, week1.age_start_days, week1.age_end_days], [1, 1, 7]);
  assert.deepEqual([week2.week_no, week2.age_start_days, week2.age_end_days], [2, 8, 14]);
  assert.equal(week1.is_complete, true);
  assert.equal(week2.is_complete, true);
  for (const week of result.weeks) {
    assert.ok(Math.abs(week.avg_egg_mass_g - 54) < 1e-9, "Egg Mass must be g/hen/day");
    assert.ok(Math.abs(week.feed_per_egg_mass - (1100 * 1000 / (9000 * 60))) < 1e-9, "FCR must be feed kg / egg mass kg");
    assert.ok(Math.abs(week.feed_per_egg_g - (1100 * 1000 / 9000)) < 1e-9, "Feed per egg must be g/egg");
    assert.ok(Math.abs(week.avg_hen_day_production - 90) < 1e-9);
    assert.ok(Math.abs(week.avg_hen_housed_production - 90) < 1e-9);
    assert.ok(Math.abs(week.avg_feed_per_hen_g - 110) < 1e-9);
    assert.ok(Math.abs(week.avg_water_per_hen_ml - 200) < 1e-9);
  }
  assert.ok(writes.every(x => x.table === "layer_weekly_monitoring" || x.table === "layer_monthly_monitoring"),
    "The period engine must write only layer summary tables");

  const standardContext = { window: {} };
  vm.createContext(standardContext);
  vm.runInContext(read("layer-daily-standards-v1.js"), standardContext, { filename: "layer-daily-standards-v1.js" });
  const Standards = standardContext.window.ADINE_LAYER_STANDARDS_ENGINE_V1;
  const brown = Standards.resolve({ strain: "Brown", genetics: "hyline" });
  assert.equal(Standards.metricAtAge(brown, "henDayProduction", 119).value, null,
    "Do not invent pointwise Hy-Line Brown production targets when no supported point exists");
  assert.equal(Standards.metricAtAge(brown, "eggWeight", 182).value, null,
    "Do not invent pointwise Hy-Line Brown egg-weight targets when no supported point exists");

  const reportsSource = read("layer-reports.html");
  const derivedStart = reportsSource.indexOf("function derivedDaily(");
  const derivedEnd = reportsSource.indexOf("const metrics=", derivedStart);
  assert.ok(derivedStart >= 0 && derivedEnd > derivedStart, "Daily report must derive its formula-based metrics from raw fields");
  const reportContext = {
    n(value) {
      if (value === null || value === undefined || value === "") return null;
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    },
    flock: { initial_bird_count: 10000 }
  };
  vm.createContext(reportContext);
  vm.runInContext(reportsSource.slice(derivedStart, derivedEnd) + "\nthis.derivedDaily = derivedDaily;", reportContext);
  const historicDaily = reportContext.derivedDaily({
    opening_birds: 10999,
    feed_quantity_kg: 982.76,
    egg_count: 411,
    average_egg_weight_g: 50.25,
    feed_per_egg_mass: 47.54,
    feed_per_egg_g: 2391.15
  });
  assert.ok(Math.abs(historicDaily.fcr - (982.76 * 1000 / (411 * 50.25))) < 1e-9,
    "Daily reports must recompute FCR from feed, egg count, and egg weight instead of trusting rounded historical FCR");
  assert.ok(Math.abs(historicDaily.eggMass - (411 * 50.25 / 10999)) < 1e-9);
  assert.ok(Math.abs(historicDaily.feedPerEgg - (982.76 * 1000 / 411)) < 1e-9);

  console.log("Layer Period Engine V1 regression tests: PASS");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
