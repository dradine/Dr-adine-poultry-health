const fs=require('fs');const vm=require('vm');const assert=require('assert');
const ctx={window:{},console};vm.createContext(ctx);vm.runInContext(fs.readFileSync('broiler-daily-standards-v1.js','utf8'),ctx);vm.runInContext(fs.readFileSync('broiler-daily-first7-report-engine-v1.js','utf8'),ctx);
const E=ctx.window.ADINE_BROILER_FIRST7_REPORT_ENGINE_V1;assert(E&&E.version==='2026-09-16.v1');
const flock={strain:'Ross 308',initial_bird_count:1000,initial_average_weight_g:44};
const records=Array.from({length:7},(_,i)=>({age_days:i+1,record_date:`2026-09-${String(i+1).padStart(2,'0')}`,doa_count:i===0?4:0,mortality_count:1,cull_count:0,feed_quantity_kg:20+i*4,water_quantity_l:36+i*7,body_weight_g:[44,59,82,110,142,176,213][i],house_temperature_c:33-i*.5,humidity_percent:50,ammonia_ppm:5,co2_ppm:1800,crop_fill_24h_percent:i===0?96:null}));
const m=E.build(flock,records);assert.equal(m.days.length,7);assert.equal(m.days[0].feedPerBird,20);assert.equal(m.days[0].waterPerBird,36);assert.equal(m.days[0].ratio,1.8);assert.equal(m.days[6].cumMort,11);assert.equal(m.days[6].live,989);assert.equal(m.days[6].bw,213);assert.equal(m.days[6].target,213);assert(E.render(m).includes('گزارش روزانه'));
const m2=E.build(flock,records.slice(0,3));assert.equal(m2.days.length,3);assert(E.render(m2).includes('تا روز ۳'));
console.log('PASS: first-7-day report engine calculations, source isolation and partial-week rendering');
