/* Run with: node tests/layer-calculation-engine-v1.test.js */
const assert=require('node:assert/strict');
global.window={};
require('../layer-calculation-engine-v1.js');
const e=window.ADINE_LAYER_CALCULATION_ENGINE_V1;
assert.ok(e,'engine is exported');
const d=e.dailyMetrics({liveBirds:9000,placedBirds:10000,eggCount:8100,feedKg:1000,waterL:2000,averageEggWeightG:60});
assert.equal(d.henDayProductionPercent,90);
assert.equal(d.henHousedProductionPercent,81);
assert.equal(d.eggMassGPerHenDay,54);
assert.equal(d.feedPerEggG,1000*1000/8100);
assert.ok(Math.abs(d.feedPerEggMass-(1000/(8100*60/1000)))<1e-12);
const agg=e.aggregate([
 {record_date:'2026-01-01',opening_birds:9000,egg_count:8100,average_egg_weight_g:60,feed_quantity_kg:1000,water_quantity_l:2000,mortality_count:10,cull_count:2},
 {record_date:'2026-01-02',opening_birds:8988,egg_count:8000,average_egg_weight_g:61,feed_quantity_kg:990,water_quantity_l:1980,mortality_count:8,cull_count:1}
],{initial_bird_count:10000});
assert.equal(agg.total_eggs,16100);
assert.ok(Math.abs(agg.feed_per_egg_mass-(1990/((8100*60+8000*61)/1000)))<1e-12);
assert.ok(Math.abs(agg.avg_hen_housed_production-(16100/(10000*2)*100))<1e-12);
assert.equal(agg.mortality_count,18);
const missing=e.aggregate([{opening_birds:1000,egg_count:500,average_egg_weight_g:null,feed_quantity_kg:10}],{initial_bird_count:1000});
assert.equal(missing.feed_per_egg_mass,null,'FCR must be null when egg-mass denominator is unavailable');
const incompleteFeed=e.aggregate([{opening_birds:1000,egg_count:500,average_egg_weight_g:60,feed_quantity_kg:10},{opening_birds:1000,egg_count:500,average_egg_weight_g:60,feed_quantity_kg:null}],{initial_bird_count:1000});
assert.equal(incompleteFeed.feed_per_egg_mass,null,'FCR must be null when any daily feed value is missing');
const incompleteEggs=e.aggregate([{opening_birds:1000,egg_count:500,average_egg_weight_g:60,feed_quantity_kg:10},{opening_birds:1000,egg_count:null,average_egg_weight_g:60,feed_quantity_kg:10}],{initial_bird_count:1000});
assert.equal(incompleteEggs.feed_per_egg_mass,null,'FCR must be null when any daily egg count is missing');
console.log('Layer calculation engine tests passed.');
