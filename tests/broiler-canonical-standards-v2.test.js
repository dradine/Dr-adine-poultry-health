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
assert.strictEqual(registry.version,'BROILER-CANONICAL-STANDARDS-V2');
assert(source&&source.version==='BROILER-PI-SOURCE-V7');
assert.strictEqual(typeof context.getBroilerOfficialStandard,'function');

const ages=registry.weeklyAges;
const strains=Object.keys(registry.strains);
assert.strictEqual(strains.length,13,'all currently registered broiler strains must be represented');

for(const strain of strains){
  const s=registry.strains[strain];
  const legacy=context.getBroilerOfficialStandard(strain);
  assert(legacy,'legacy registry bridge missing');
  assert.strictEqual(legacy.records.length,ages.length,`${strain}: legacy bridge week count mismatch`);
  for(const age of ages){
    const flock={production_type:'broiler',genetics:s.family,strain};
    const row={id:`${strain}-${age}`,age_days:age};
    const out=source.enrich(flock,[row])[0];
    assert(out.canonicalTargets.weight!==null,`${strain} day ${age}: weight target missing`);
    assert(out.canonicalTargets.fcr!==null,`${strain} day ${age}: weekly FCR target missing`);
    assert(out.canonicalTargets.cumulativeFcr!==null,`${strain} day ${age}: cumulative FCR target missing`);
    assert(out.canonicalTargets.adg!==null,`${strain} day ${age}: weekly gain target missing`);
    const legacyRow=legacy.records.find(x=>Number(x[0])===age);
    assert(legacyRow&&legacyRow[1]!==null&&legacyRow[2]!==null,`${strain} day ${age}: legacy bridge target missing`);
    assert(['official-performance-objective','management-standard'].includes(out.targetSourceType),`${strain} day ${age}: invalid target source type`);
  }
}

const ross=source.enrich({production_type:'broiler',genetics:'Ross',strain:'Ross 308 AP'},[{id:'r56',age_days:56}])[0];
assert.strictEqual(ross.canonicalTargets.weight,4446);
assert.strictEqual(ross.canonicalTargets.cumulativeFcr,1.776);
assert.strictEqual(ross.managementFallbackUsed,false);

const ep7=source.enrich({production_type:'broiler',genetics:'Hubbard',strain:'Efficiency Plus'},[{id:'ep7',age_days:7}])[0];
assert.strictEqual(ep7.canonicalTargets.weight,216);
assert.strictEqual(ep7.canonicalTargets.cumulativeFcr,null);
assert.strictEqual(ep7.canonicalTargets.fcr,0.960);
assert.strictEqual(ep7.managementFallbackUsed,true);
assert.strictEqual(ep7.targetSourceType,'management-standard');

const ep21=source.enrich({production_type:'broiler',genetics:'Hubbard',strain:'Efficiency Plus'},[{id:'ep21',age_days:21}])[0];
assert.strictEqual(ep21.canonicalTargets.weight,1035);
assert.strictEqual(ep21.canonicalTargets.cumulativeFcr,1.13);
assert.strictEqual(ep21.managementFallbackUsed,true,'weekly FCR at week 3 depends on the derived week-2 endpoint');

const ep28=source.enrich({production_type:'broiler',genetics:'Hubbard',strain:'Efficiency Plus'},[{id:'ep28',age_days:28}])[0];
assert.strictEqual(ep28.canonicalTargets.weight,1647,'official week-4 weight must remain authoritative');
assert.strictEqual(ep28.managementFallbackUsed,false,'week-4 weekly FCR has two official cumulative endpoints');
assert.strictEqual(ep28.targetSourceType,'official-performance-objective');

const edge7=source.enrich({production_type:'broiler',genetics:'Hubbard',strain:'Hubbard EDGE'},[{id:'edge7',age_days:7}])[0];
assert.strictEqual(edge7.canonicalTargets.weight,217);
assert.strictEqual(edge7.canonicalTargets.fcr,0.971);
assert.strictEqual(edge7.managementFallbackUsed,true);

const edge=source.enrich({production_type:'broiler',genetics:'Hubbard',strain:'Hubbard EDGE'},[{id:'edge21',age_days:21}])[0];
assert.strictEqual(edge.canonicalTargets.weight,1058,'official weight must survive when the current FCR was not available until the breeder table begins reporting it');
assert.strictEqual(edge.canonicalTargets.cumulativeFcr,1.13);
assert.strictEqual(edge.managementFallbackUsed,true,'week-3 weekly FCR still depends on the derived week-2 endpoint');

const arian=source.enrich({production_type:'broiler',genetics:'آرین ایران',strain:'Arian'},[{id:'a56',age_days:56}])[0];
assert.strictEqual(arian.targetSourceType,'management-standard');
assert.strictEqual(arian.canonicalTargets.weight,3440);
assert.strictEqual(arian.canonicalTargets.cumulativeFcr,1.98);
assert(arian.canonicalTargets.fcr!==null&&arian.canonicalTargets.adg!==null);

console.log('broiler-canonical-standards-v2: PASS');
