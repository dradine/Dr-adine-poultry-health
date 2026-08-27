/* ADINE REPORT PERIOD NORMALIZER V1
   Canonicalizes report periods from biological age, never from entry order.
   Safe compatibility layer for legacy weekly_records data.
*/
(function(g){
  "use strict";
  if (g.__ADINE_REPORT_PERIOD_NORMALIZER_V1__) return;
  g.__ADINE_REPORT_PERIOD_NORMALIZER_V1__ = true;

  const num = v => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(String(v).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  };

  const canonicalWeek = age => {
    const a = num(age);
    return a != null && a >= 1 ? Math.floor((a - 1) / 7) + 1 : null;
  };

  function deriveAge(flock, row) {
    const direct = num(row?.age_days ?? row?.ageDays);
    if (direct != null && direct >= 1) return direct;

    const evaluation = row?.evaluation_date ?? row?.evaluationDate ?? row?.record_date ?? row?.recordDate;
    const start = flock?.placement_date ?? flock?.hatch_date;
    if (!evaluation || !start) return null;

    const t0 = Date.parse(String(start).slice(0,10) + "T00:00:00Z");
    const t1 = Date.parse(String(evaluation).slice(0,10) + "T00:00:00Z");
    if (!Number.isFinite(t0) || !Number.isFinite(t1)) return null;

    const base = num(flock?.start_age_days) ?? 0;
    const age = Math.round((t1 - t0) / 86400000) + base;
    return age >= 1 ? age : null;
  }

  function canonicalize(data) {
    if (!data || !Array.isArray(data.records)) return data;

    const rows = data.records.map((row, index) => {
      const age = deriveAge(data.flock, row);
      const week = canonicalWeek(age);
      return {
        ...row,
        ageDays: age ?? num(row.ageDays ?? row.age_days),
        age_days: age ?? num(row.ageDays ?? row.age_days),
        weekNumber: week ?? num(row.weekNumber ?? row.week_number),
        week_number: week ?? num(row.weekNumber ?? row.week_number),
        _canonicalPeriod: age != null,
        _originalWeekNumber: num(row.weekNumber ?? row.week_number),
        _periodOriginalIndex: index
      };
    });

    rows.sort((a,b) => {
      const aa = num(a.ageDays);
      const bb = num(b.ageDays);
      if (aa != null && bb != null && aa !== bb) return aa - bb;
      if (aa != null && bb == null) return -1;
      if (aa == null && bb != null) return 1;
      const da = String(a.evaluationDate ?? a.evaluation_date ?? a.recordDate ?? a.record_date ?? "");
      const db = String(b.evaluationDate ?? b.evaluation_date ?? b.recordDate ?? b.record_date ?? "");
      return da.localeCompare(db) || (a._periodOriginalIndex - b._periodOriginalIndex);
    });

    return {...data, records: rows};
  }

  function install(){
    if (typeof g.getCompleteReportData !== "function") return false;
    if (g.getCompleteReportData.__adineCanonicalWrapped) return true;

    const original = g.getCompleteReportData;
    const wrapped = async function(){
      const data = await original.apply(this, arguments);
      return canonicalize(data);
    };
    wrapped.__adineCanonicalWrapped = true;
    wrapped.__adineOriginal = original;
    g.getCompleteReportData = wrapped;
    return true;
  }

  // reports-data.js is loaded before this compatibility layer in normal operation.
  if (!install()) {
    let tries = 0;
    const timer = setInterval(() => {
      if (install() || ++tries >= 100) clearInterval(timer);
    }, 50);
  }

  g.AdineReportPeriodNormalizerV1 = {canonicalWeek, deriveAge, canonicalize, install};
})(window);
