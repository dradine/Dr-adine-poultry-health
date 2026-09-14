const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const context={console};
context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('broiler-official-standards-v1.js','utf8'),context);
vm.runInContext(fs.readFileSync('standards-resolver-core-v1.js','utf8'),context);
vm.runInContext(fs.readFileSync('broiler-performance-intelligence-source-v1.js','utf8'),context);

const registry=context.BROILER_OFFICIAL_STANDARDS_V1;
const source=context.AdineBroilerPerformanceIntelligenceSourceV1;
assert(registry,'canonical broiler registry must exist');
assert.strictEqual(registry.version,'BROILER-CANONICAL-STANDARDS-V2');
assert(source&&source.version==='BROILER-PI-SOURCE-V6');

const ages=registry.weeklyAges;
const strains=Object.keys(registry.strains);
assert.strictEqual(strains.length,12,'all currently selectable broiler strains must be represented');

for(const strain of strains){
  const s=registry.strains[strain];
  for(const age of ages){
    const flock={production_type:'broiler',genetics:s.family,strain};
    const row={id:`${strain}-${age}`,age_days:age};
    const out=source.enrich(flock,[row])[0];
    assert(out.canonicalTargets.weight!==null,`${strain} day ${age}: weight target missing`);
    assert(out.canonicalTargets.fcr!==null,`${strain} day ${age}: weekly FCR target missing`);
    assert(out.canonicalTargets.cumulativeFcr!==null,`${strain} day ${age}: cumulative FCR target missing`);
    assert(out.canonicalTargets.adg!==null,`${strain} day ${age}: weekly gain target missing`);
    assert(['official-performance-objective','management-standard'].includes(out.targetSourceType),`${strain} day ${age}: invalid target source type`);
  }
}

const ross=source.enrich({production_type:'broiler',genetics:'Ross',strain:'Ross 308 AP'},[{id:'r56',age_days:56}])[0];
assert.strictEqual(ross.canonicalTargets.weight,4446);
assert.strictEqual(ross.canonicalTargets.cumulativeFcr,1.776);
assert.strictEqual(ross.managementFallbackUsed,false);

const ep=source.enrich({production_type:'broiler',genetics:'Hubbard',strain:'Efficiency Plus'},[{id:'ep7',age_days:7}])[0];
assert.strictEqual(ep.managementFallbackUsed,true);
assert.strictEqual(ep.targetSourceType,'management-standard');
assert(ep.canonicalTargets.weight!==null&&ep.canonicalTargets.fcr!==null);

const edge=source.enrich({production_type:'broiler',genetics:'Hubbard',strain:'Hubbard EDGE'},[{id:'edge21',age_days:21}])[0];
assert.strictEqual(edge.canonicalTargets.weight,1058,'official weight must survive when only FCR is missing');
assert.strictEqual(edge.managementFallbackUsed,true);

const arian=source.enrich({production_type:'broiler',genetics:'آرین ایران',strain:'Arian'},[{id:'a56',age_days:56}])[0];
assert.strictEqual(arian.targetSourceType,'management-standard');
assert(arian.canonicalTargets.weight!==null&&arian.canonicalTargets.fcr!==null);

console.log('broiler-canonical-standards-v2: PASS');
