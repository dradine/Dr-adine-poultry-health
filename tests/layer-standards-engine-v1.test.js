/* Run with: node tests/layer-standards-engine-v1.test.js */
const assert=require('node:assert/strict'); global.window={}; require('../layer-daily-standards-v1.js'); const s=window.ADINE_LAYER_STANDARDS_ENGINE_V1;
const isa=s.resolve({strain:'ISA Brown',housing_system:'cage'});assert.equal(isa.fallback,false);assert.equal(isa.housingSystem,'cage');assert.equal(s.metricAtAge(isa,'henDayProduction',175).value,94.2);assert.equal(s.metricAtAge(isa,'eggWeight',700).value,65.3);
const aviary=s.resolve({strain:'ISA Brown',housing_system:'aviary'});assert.equal(aviary.numericReady,false);assert.ok(aviary.systemMismatchReason);
const unknown=s.resolve({strain:'ISA Brown'});assert.equal(unknown.numericReady,false);
const plus=s.resolve({strain:'W-80 Plus',housing_system:'cage'});assert.equal(plus.numericReady,false);assert.equal(s.isOfficial(isa),true);
console.log('Layer standards engine tests passed.');
