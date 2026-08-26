/* =========================================================
   ADINE POULTRY HEALTH — BENCHMARK CORE V2
   Canonical age/week model + growth bridge + standard resolver
   + strict deviation scoring + report presentation helpers.

   DESIGN RULES
   1. Age is authoritative. week = floor((age-1)/7)+1.
   2. Weekly gain is current closing weight - previous closing weight.
   3. First-week gain uses the flock entry weight when explicitly stored;
      otherwise it remains null (never invented).
   4. Cumulative gain = current weight - explicit entry weight.
   5. Absolute weight is compared only with the standard for the same age.
   6. Weekly gain is compared with the standard interval gain, never with
      the absolute standard weight.
   7. Official standards have priority; management standards never replace
      an available official value for the same metric/age.
   8. No extrapolation outside the documented standard curve.
   9. Missing data reduces confidence and cannot create a false high score.
========================================================= */
"use strict";

(function (global) {
    const V = "2.0.0";

    function num(v) {
        if (v === null || v === undefined || v === "") return null;
        const n = Number(String(v).replace(/,/g, "").trim());
        return Number.isFinite(n) ? n : null;
    }

    function ageToWeek(ageDays) {
        const a = num(ageDays);
        return a !== null && a >= 1 ? Math.floor((a - 1) / 7) + 1 : null;
    }

    function weekBounds(week) {
        const w = num(week);
        if (w === null || w < 1) return null;
        return { start: (w - 1) * 7 + 1, end: w * 7 };
    }

    function canonicalAge(record) {
        const a = num(record?.ageDays ?? record?.age_days);
        if (a !== null && a >= 1) return a;
        const w = num(record?.weekNumber ?? record?.week_number);
        return w !== null && w >= 1 ? w * 7 : null;
    }

    function canonicalWeek(record) {
        const a = canonicalAge(record);
        return ageToWeek(a);
    }

    function standardRecords(standard, metric) {
        const official = standard?.official?.records || [];
        const management = standard?.management?.records || [];
        const make = rows => rows.map(r => ({ age: num(r.ageDays), value: num(r[metric]) }))
            .filter(x => x.age !== null && x.value !== null)
            .sort((a,b) => a.age-b.age);
        return { official: make(official), management: make(management) };
    }

    function interpolate(points, age) {
        if (!points.length || age === null) return null;
        if (age < points[0].age || age > points[points.length - 1].age) return null;
        for (let i=0;i<points.length;i++) if (points[i].age === age) return points[i].value;
        for (let i=1;i<points.length;i++) {
            const a=points[i-1], b=points[i];
            if (age > a.age && age < b.age) {
                const t=(age-a.age)/(b.age-a.age);
                return a.value + (b.value-a.value)*t;
            }
        }
        return null;
    }

    function resolveMetric(standard, metric, age) {
        const p = standardRecords(standard, metric);
        const official = interpolate(p.official, age);
        if (official !== null) return { value: official, sourceType: standard.official.sourceType || "official", sourceLabel: standard.official.sourceLabel || "استاندارد رسمی", isFallback:false };
        const management = interpolate(p.management, age);
        if (management !== null) return { value: management, sourceType: standard.management.sourceType || "management-standard", sourceLabel: standard.management.sourceLabel || "استاندارد مدیریتی", isFallback:Boolean(standard.official) };
        return { value:null, sourceType:null, sourceLabel:null, isFallback:false };
    }

    function metricAtAge(standard, metric, ageDays) {
        return resolveMetric(standard, metric, num(ageDays));
    }

    function getStandardValueAtAgeV2(standard, metric, ageDays) {
        return metricAtAge(standard, metric, ageDays).value;
    }

    function getStandardMetaV2(standard, metric, ageDays) {
        return metricAtAge(standard, metric, ageDays);
    }

    function curveGain(standard, metric, fromAge, toAge) {
        const a=num(fromAge), b=num(toAge);
        if (!standard || a===null || b===null || b<=a) return null;
        const end=metricAtAge(standard, metric, b);
        const start=metricAtAge(standard, metric, a);
        if (end.value===null || start.value===null) return null;
        return { value:end.value-start.value, sourceType:end.sourceType, sourceLabel:end.sourceLabel };
    }

    function findEntryWeight(flock) {
        const keys=[
            "initial_weight_g","initialWeightG","initialWeight","entry_weight_g",
            "entryWeightG","arrival_weight_g","arrivalWeightG","chick_weight_g",
            "chickWeightG","placement_weight_g","placementWeightG"
        ];
        for (const k of keys) {
            const n=num(flock?.[k]);
            if (n!==null && n>0) return n;
        }
        return null;
    }

    function buildGrowth(records, flock) {
        const rows=(records||[]).map((r,i)=>({
            ...r,
            _sourceIndex:i,
            _age:canonicalAge(r),
            _weight:num(r.averageWeight ?? r.average_weight_g)
        })).filter(r=>r._age!==null).sort((a,b)=>a._age-b._age || a._sourceIndex-b._sourceIndex);
        const entry=findEntryWeight(flock);
        let previousWeight=entry;
        let previousAge=entry!==null ? 0 : null;
        return rows.map(r=>{
            const weeklyGain=(previousWeight!==null && r._weight!==null) ? r._weight-previousWeight : null;
            const intervalDays=(previousAge!==null) ? r._age-previousAge : null;
            const dailyGain=(weeklyGain!==null && intervalDays>0) ? weeklyGain/intervalDays : null;
            const cumulativeGain=(entry!==null && r._weight!==null) ? r._weight-entry : null;
            const out={
                ...r,
                canonicalAgeDays:r._age,
                canonicalWeekNumber:ageToWeek(r._age),
                openingWeightG:previousWeight,
                weeklyGainG:weeklyGain,
                dailyGainG:dailyGain,
                cumulativeGainG:cumulativeGain,
                intervalDays:intervalDays,
                entryWeightG:entry
            };
            if (r._weight!==null) { previousWeight=r._weight; previousAge=r._age; }
            return out;
        });
    }

    function deviationPercent(actual, target) {
        const a=num(actual), t=num(target);
        return a===null || t===null || t===0 ? null : ((a-t)/Math.abs(t))*100;
    }

    function absoluteDeviationPercent(actual,target) {
        const d=deviationPercent(actual,target);
        return d===null ? null : Math.abs(d);
    }

    // Strict continuous scoring. 0 deviation = 100; >=20% deviation = 0.
    function scoreDeviation(actual,target,direction,maxDeviation=20) {
        const a=num(actual), t=num(target);
        if(a===null || t===null || !Number.isFinite(t) || t===0) return null;
        const signed=(a-t)/Math.abs(t)*100;
        const adverse=direction==="lower" ? signed : direction==="higher" ? -signed : Math.abs(signed)*-1;
        const penalty=Math.max(0, adverse);
        return Math.max(0, Math.min(100, 100*(1-penalty/maxDeviation)));
    }

    const directions={
        bodyWeight:"higher", weeklyGainG:"higher", dailyGainG:"higher", cumulativeGainG:"higher",
        fcr:"lower", mortality:"lower", cv:"lower", uniformity10:"higher", uniformity15:"higher",
        feedPerBirdG:"lower", waterPerBirdMl:"lower", henDayProduction:"higher", henHousedProduction:"higher",
        eggWeight:"higher", eggMass:"higher", fertility:"higher", hatchability:"higher"
    };

    function dataCompleteness(rows, requiredFields) {
        const total=rows.length;
        if(!total) return 0;
        let present=0, possible=0;
        rows.forEach(r=>requiredFields.forEach(k=>{ possible++; if(num(r[k])!==null) present++; }));
        return possible ? present/possible : 0;
    }

    function periodScore(row, standard) {
        const metrics=[];
        const add=(name, actual, target, direction, weight)=>{
            const s=scoreDeviation(actual,target,direction);
            if(s!==null) metrics.push({name,score:s,weight});
        };
        add("وزن",row.averageWeight,metricAtAge(standard,"bodyWeight",row.canonicalAgeDays).value,"higher",3);
        add("رشد هفتگی",row.weeklyGainG,row.standardWeeklyGainG,"higher",3);
        add("CV",row.cv,metricAtAge(standard,"cv",row.canonicalAgeDays).value,"lower",1.5);
        add("یکنواختی ±10",row.uniformity10,metricAtAge(standard,"uniformity10",row.canonicalAgeDays).value,"higher",1.5);
        add("تلفات",row.mortality,metricAtAge(standard,"mortality",row.canonicalAgeDays).value,"lower",2);
        add("FCR",row.fcr,metricAtAge(standard,"fcr",row.canonicalAgeDays).value,"lower",2);
        if(!metrics.length) return null;
        const weighted=metrics.reduce((s,m)=>s+m.score*m.weight,0)/metrics.reduce((s,m)=>s+m.weight,0);
        return Math.max(0,Math.min(100,weighted));
    }

    function decorateRecords(records, flock, standard) {
        const growth=buildGrowth(records,flock);
        return growth.map((r,i)=>{
            const age=r.canonicalAgeDays;
            const prevAge=r.openingWeightG!==null && r.intervalDays!==null ? age-r.intervalDays : null;
            const sw=metricAtAge(standard,"bodyWeight",age);
            const sg=prevAge!==null ? curveGain(standard,"bodyWeight",prevAge,age) : null;
            const sf=metricAtAge(standard,"fcr",age);
            const sm=metricAtAge(standard,"mortality",age);
            const out={...r,
                standardWeight:sw.value,
                standardWeightSourceType:sw.sourceType,
                standardWeightSourceLabel:sw.sourceLabel,
                standardWeeklyGainG:sg?.value ?? null,
                standardWeeklyGainSourceType:sg?.sourceType ?? null,
                standardWeeklyGainSourceLabel:sg?.sourceLabel ?? null,
                standardFCR:sf.value,
                standardFCRSourceType:sf.sourceType,
                standardFCRSourceLabel:sf.sourceLabel,
                weightDifference:r._weight!==null && sw.value!==null ? r._weight-sw.value : null,
                weightDifferencePercent:deviationPercent(r._weight,sw.value),
                weeklyGainDifference:r.weeklyGainG!==null && sg?.value!==null ? r.weeklyGainG-sg.value : null,
                weeklyGainDifferencePercent:deviationPercent(r.weeklyGainG,sg?.value),
                scoreV2:periodScore({...r,standardWeeklyGainG:sg?.value??null},standard)
            };
            return out;
        });
    }

    function strictFarmScore(rows) {
        const valid=rows.filter(r=>r.scoreV2!==null);
        if(!valid.length) return {score:null,confidence:0,validPeriods:0};
        const weighted=valid.reduce((s,r)=>s+r.scoreV2,0)/valid.length;
        const completeness=dataCompleteness(rows,["averageWeight"]);
        // Evidence penalty: incomplete history cannot silently become a 100.
        const confidence=Math.round(completeness*100);
        const score=Math.min(weighted, confidence<100 ? 100-(100-confidence)*0.35 : 100);
        return {score:Number(score.toFixed(1)),confidence,validPeriods:valid.length};
    }

    // Public API
    global.BENCHMARK_CORE_V2={
        version:V,num,ageToWeek,weekBounds,canonicalAge,canonicalWeek,
        metricAtAge,curveGain,findEntryWeight,buildGrowth,deviationPercent,
        absoluteDeviationPercent,scoreDeviation,decorateRecords,strictFarmScore,
        directions
    };

    // Compatibility overrides: these are intentionally installed last on each page.
    global.getStandardValueAtAge=getStandardValueAtAgeV2;
    global.getStandardMeta=getStandardMetaV2;
    global.getStandardMetricAtAge=getStandardMetaV2;

    // Repair the report normalizer without changing the database schema.
    if(typeof global.normalizeReportRecord === "function") {
        const oldNormalize=global.normalizeReportRecord;
        global.normalizeReportRecord=function(record){
            const base=oldNormalize(record);
            const age=canonicalAge(base);
            return {...base, ageDays:age, weekNumber:ageToWeek(age)};
        };
    }

    // UI: make the distinction between official and management standards obvious.
    function installVisualLayer(){
        if(document.getElementById("benchmark-v2-style")) return;
        const s=document.createElement("style"); s.id="benchmark-v2-style";
        s.textContent=`
        .benchmark-v2-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:700;line-height:1.4;background:#eef2f7;color:#263238}
        .benchmark-v2-badge.official{background:#e8f5e9;color:#1b5e20}.benchmark-v2-badge.management{background:#fff8e1;color:#795548}
        .benchmark-v2-card{border:1px solid rgba(20,40,60,.08);border-radius:16px;padding:14px;margin:12px 0;background:linear-gradient(135deg,#fff,#f7faf9);box-shadow:0 5px 18px rgba(20,40,60,.06)}
        .benchmark-v2-number{font-size:24px;font-weight:800;letter-spacing:-.3px}.benchmark-v2-muted{font-size:11px;opacity:.68}
        `;
        document.head.appendChild(s);
    }
    if(typeof document!=="undefined"){
        if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",installVisualLayer,{once:true}); else installVisualLayer();
    }
})(typeof window!=="undefined"?window:globalThis);
