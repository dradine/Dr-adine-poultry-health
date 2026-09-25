const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const context={console};
context.window=context;
vm.createContext(context);
vm.runInNewContext(fs.readFileSync('broiler-official-standards-v1.js','utf8'),context);
vm.runInNewContext(fs.readFileSync('standards-resolver-core-v1.js','utf8'),context);
vm.runInNewContext(fs.readFileSync('broiler-performance-intelligence-source-v1.js','utf8'),context);

const registry=context.BROILER_OFFICIAL_STANDARDS_V1;
const source=context.AdineBroilerPerformanceIntelligenceSourceV1;
assert(registry,'canonical broiler registry must exist');
assert.strictEqual(registry.version,'BROILER-CANONICAL-STANDARDS-V4.1');
assert(source&&source.version==='BROILER-PI-SOURCE-V9.3');
assert.strictEqual(typeof context.getBroilerOfficialStandard,'function');
assert.strictEqual(context.ADINE_STANDARDS_RESOLVER_VERSION,'STANDARDS-RESOLVER-V4');

const ages=registry.weeklyAges;
const strains=Object.keys(registry.strains);
assert.strictEqual(strains.length,13,'all currently registered broiler strains must be represented');
assert.deepStrictEqual(ages,[7,14,21,28,35,42,49,56]);
assert.deepStrictEqual([6,7,8,13,14,15,20,21,22,27,28,29,34,35,36,41,42,43,48,49,50,55,56,57].map(context.resolveBroilerEvaluationAge),[7,7,7,14,14,14,21,21,21,28,28,28,35,35,35,42,42,42,49,49,49,56,56,56]);
assert.strictEqual(context.resolveBroilerEvaluationAge(12),null,'day 12 must not silently attach to week 2');
assert.strictEqual(context.resolveBroilerEvaluationAge(16),null,'day 16 must not silently attach to week 2');
assert.strictEqual(context.resolveBroilerEvaluationWeek(13),2);
assert.strictEqual(context.resolveBroilerEvaluationWeek(15),2);

for(const strain of strains){
  const s=registry.strains[strain];
  const canonical=context.getBroilerOfficialStandard(strain);
  assert(canonical,'canonical strain accessor missing');
  assert.strictEqual(canonical.records.length,ages.length,`${strain}: canonical week count mismatch`);
  for(const age of ages){
    const flock={production_type:'broiler',genetics:s.family,strain};
    const row={id:`${strain}-${age}`,age_days:age};
    const out=source.enrich(flock,[row])[0];
    assert(out.canonicalTargets.weight!==null,`${strain} day ${age}: weight target missing`);
    assert(out.canonicalTargets.fcr!==null,`${strain} day ${age}: weekly FCR target missing`);
    assert(out.canonicalTargets.cumulativeFcr!==null,`${strain} day ${age}: cumulative FCR target missing`);
    assert(out.canonicalTargets.adg!==null,`${strain} day ${age}: weekly gain target missing`);
    assert(out.targetSourceType&&/^(official|management|mixed)/.test(out.targetSourceType),`${strain} day ${age}: invalid target source type`);
  }
}

const ross=source.enrich({production_type:'broiler',genetics:'Ross',strain:'Ross 308 AP'},[{id:'r13',age_days:13},{id:'r15',age_days:15},{id:'r56',age_days:56}]);
assert.strictEqual(ross[0].canonicalTargets.weight,540);
assert.strictEqual(ross[0].standardAgeDays,14);
assert.strictEqual(ross[0].evaluationWeek,2);
assert.strictEqual(ross[0].ageWindowApplied,true);
assert.strictEqual(ross[1].canonicalTargets.weight,540);
assert.strictEqual(ross[1].standardAgeDays,14);
assert.strictEqual(ross[1].evaluationWeek,2);
assert.strictEqual(ross[2].canonicalTargets.weight,4446);
assert.strictEqual(ross[2].canonicalTargets.cumulativeFcr,1.776);
assert.strictEqual(ross[2].managementFallbackUsed,false);

console.log('broiler-canonical-standards-v4: PASS');
