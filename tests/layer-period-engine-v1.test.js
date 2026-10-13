/* Run with: node tests/layer-period-engine-v1.test.js */
const assert=require('node:assert/strict');
global.window={};
require('../layer-calculation-engine-v1.js');
require('../layer-period-engine-v1.js');
const api=window.ADINE_LAYER_PERIOD_ENGINE_V1;
const saved={layer_weekly_monitoring:[],layer_monthly_monitoring:[]};
const client={from(table){return {upsert:async row=>{saved[table].push(row);return {error:null}}}}};
(async()=>{
 await api.sync(
  {id:'flock-1',farm_id:'farm-1',house_id:'house-1',initial_bird_count:1000,placement_date:'2026-01-01'},
  {id:'user-1'},
  client,
  [
   {id:'day-7',record_date:'2026-01-07',age_days:7,opening_birds:1000,egg_count:900,average_egg_weight_g:60,egg_mass_g_hen_day:54,feed_quantity_kg:100,water_quantity_l:200,mortality_count:0,cull_count:0,livability_percent:100},
   {id:'day-8',record_date:'2026-01-08',age_days:8,opening_birds:1000,egg_count:900,average_egg_weight_g:60,egg_mass_g_hen_day:54,feed_quantity_kg:100,water_quantity_l:200,mortality_count:0,cull_count:0,livability_percent:100}
  ]
 );
 assert.equal(saved.layer_weekly_monitoring.length,2);
 assert.equal(saved.layer_weekly_monitoring[0].week_no,1);
 assert.equal(saved.layer_weekly_monitoring[0].age_start_days,7);
 assert.equal(saved.layer_weekly_monitoring[0].age_end_days,7);
 assert.equal(saved.layer_weekly_monitoring[1].week_no,2);
 assert.equal(saved.layer_weekly_monitoring[1].age_start_days,8);
 assert.equal(saved.layer_weekly_monitoring[1].age_end_days,8);
 assert.equal(saved.layer_weekly_monitoring[0].feed_per_egg_mass,100/(900*60/1000));
 console.log('Layer period engine tests passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
