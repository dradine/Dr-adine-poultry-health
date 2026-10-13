/* Run with: node tests/layer-calculation-engine-v1.test.js */
const assert=require('node:assert/strict'); global.window={}; require('../layer-calculation-engine-v1.js');
const e=window.ADINE_LAYER_CALCULATION_ENGINE_V1;
const d=e.dailyMetrics({liveBirds:9000,placedBirds:10000,eggCount:8100,feedKg:1000,waterL:2000,averageEggWeightG:60,saleableEggCount:8000,mortalityCount:9,cullCount:3,cumulativeMortalityCount:90,cumulativeCullCount:30});
assert.equal(d.henDayProductionPercent,90); assert.equal(d.henHousedProductionPercent,81); assert.equal(d.eggMassGPerHenDay,54);
assert.ok(Math.abs(d.feedPerEggMass-(1000/(8100*60/1000)))<1e-12); assert.ok(Math.abs(d.mortalityPercent-.1)<1e-12); assert.ok(Math.abs(d.cumulativeMortalityPercent-.9)<1e-12);
assert.equal(d.saleableEggPercent,8000/8100*100); assert.equal(d.eggDefectPercent,100-8000/8100*100);
assert.equal(e.dailyMetrics({liveBirds:1000,eggCount:900,averageEggWeightG:60,crackedEggCount:10,dirtyEggCount:10,floorEggCount:20}).eggDefectPercent,null,'overlapping categories must not be summed');
const agg=e.aggregate([{record_date:'2026-01-01',opening_birds:9000,egg_count:8100,average_egg_weight_g:60,feed_quantity_kg:1000,water_quantity_l:2000,mortality_count:10,cull_count:2,body_weight_g:1600,body_weight_sample_count:10},{record_date:'2026-01-02',opening_birds:8988,egg_count:8000,average_egg_weight_g:61,feed_quantity_kg:990,water_quantity_l:1980,mortality_count:8,cull_count:1,body_weight_g:1700,body_weight_sample_count:30}],{initial_bird_count:10000});
assert.equal(agg.total_eggs,16100); assert.ok(Math.abs(agg.feed_per_egg_mass-(1990/((8100*60+8000*61)/1000)))<1e-12); assert.ok(Math.abs(agg.avg_hen_housed_production-80.5)<1e-12); assert.ok(Math.abs(agg.avg_body_weight_g-1675)<1e-12); assert.equal(agg.mortality_count,18); assert.equal(agg.fcr_available,true);
assert.equal(e.aggregate([{opening_birds:1000,egg_count:500,average_egg_weight_g:null,feed_quantity_kg:10}],{initial_bird_count:1000}).feed_per_egg_mass,null);
assert.equal(e.aggregate([{opening_birds:1000,egg_count:500,average_egg_weight_g:60,feed_quantity_kg:10},{opening_birds:1000,egg_count:500,average_egg_weight_g:60,feed_quantity_kg:null}],{initial_bird_count:1000}).feed_per_egg_mass,null);
assert.equal(e.aggregate([{opening_birds:1000,egg_count:500,average_egg_weight_g:60,feed_quantity_kg:10},{opening_birds:1000,egg_count:null,average_egg_weight_g:60,feed_quantity_kg:10}],{initial_bird_count:1000}).feed_per_egg_mass,null);
assert.equal(e.aggregate([{opening_birds:1000,egg_count:500,average_egg_weight_g:60,feed_quantity_kg:10},{opening_birds:null,egg_count:500,average_egg_weight_g:60,feed_quantity_kg:10}],{initial_bird_count:1000}).avg_hen_day_production,null);
assert.equal(e.assessDaily({actual:{feedPerHenG:90},reference:{feed:100}}).state,'watch');
const highFeed=e.assessDaily({actual:{feedPerHenG:112},reference:{feed:100}}); assert.equal(highFeed.state,'watch'); assert.equal(highFeed.score,null);
const bad=e.assessDaily({actual:{eggCount:100,saleableEggCount:120}}); assert.equal(bad.state,'investigate'); assert.ok(bad.dataQualityFlags.includes('saleable_eggs_exceed_total'));
console.log('Layer calculation engine tests passed.');
