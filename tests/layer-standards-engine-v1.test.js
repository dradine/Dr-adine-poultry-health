/* Run with: node tests/layer-standards-engine-v1.test.js */
const assert=require('node:assert/strict'); global.window={}; require('../layer-daily-standards-v1.js'); const s=window.ADINE_LAYER_STANDARDS_ENGINE_V1;
const isa=s.resolve({strain:'ISA Brown',housing_system:'cage'});assert.equal(isa.fallback,false);assert.equal(isa.housingSystem,'cage');assert.equal(s.metricAtAge(isa,'henDayProduction',175).value,94.2);assert.equal(s.metricAtAge(isa,'eggWeight',700).value,65.3);
const aviary=s.resolve({strain:'ISA Brown',housing_system:'aviary'});assert.equal(aviary.numericReady,false);assert.ok(aviary.systemMismatchReason);
const floor=s.resolve({strain:'ISA Brown',housing_system:'floor'});assert.equal(floor.numericReady,false,'floor systems must not use cage curves');
const unknown=s.resolve({strain:'ISA Brown'});assert.equal(unknown.numericReady,false);
const w80=s.resolve({strain:'W-80',housing_system:'cage'});const w80feed=s.metricAtAge(w80,'dailyFeed',133);assert.equal(w80.numericReady,true);assert.equal(w80feed.min,79.3);assert.equal(w80feed.max,82.1);assert.equal(w80feed.referenceKind,'range');
const plus=s.resolve({strain:'W-80 Plus',housing_system:'cage'});const plusFeed=s.metricAtAge(plus,'dailyFeed',133);assert.equal(plus.numericReady,true);assert.equal(plusFeed.min,81.3);assert.equal(plusFeed.max,84.1);assert.equal(s.isOfficial(isa),true);
console.log('Layer standards engine tests passed.');
