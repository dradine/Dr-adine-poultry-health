const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={console};c.window=c;vm.createContext(c);
vm.runInContext(fs.readFileSync('broiler-official-standards-v1.js','utf8'),c);
vm.runInContext(fs.readFileSync('broiler-canonical-metric-standards-v1.js','utf8'),c);
const R=c.BROILER_OFFICIAL_STANDARDS_V1, target=c.broilerCanonicalMetricTarget;
assert(R&&target,'canonical metric resolver must load');
const metrics=['weight','fcr','cumulativeFcr','adg','feed','mortality','cv','u10','u15','water','wfr','epef'];
for(const [strain,S] of Object.entries(R.strains)){
  for(const age of R.weeklyAges){
    for(const metric of metrics){
      const x=target(strain,age,metric);
      assert(x&&Number.isFinite(Number(x.value)),`${strain} day ${age} ${metric}: target missing`);
      assert(x.sourceType&&x.sourceLabel,`${strain} day ${age} ${metric}: provenance missing`);
    }
  }
}
const ap=target('Ross 308 AP',56,'weight');assert.strictEqual(ap.value,4446);assert.strictEqual(ap.targetType,'official-direct');
const apF=target('Ross 308 AP',56,'fcr');assert(Math.abs(apF.value-2.5196793893)<1e-9);assert.strictEqual(apF.targetType,'official-derived');
const ep=target('Efficiency Plus',7,'fcr');assert.strictEqual(ep.value,.960);assert(ep.targetType.includes('management'));
const edge=target('Hubbard EDGE',14,'fcr');assert.strictEqual(edge.value,1.073);assert(edge.targetType.includes('management'));
const ar=target('Arian',56,'weight');assert.strictEqual(ar.value,3440);assert.strictEqual(ar.targetType,'management-fallback');
const u=target('Cobb800',35,'u10');assert.strictEqual(u.value,79);assert.strictEqual(u.targetType,'management');
const u15=target('Cobb800',35,'u15');assert.strictEqual(u15.value,94);assert.strictEqual(u15.targetType,'management');
console.log('BROILER CANONICAL METRIC STANDARDS V1 TESTS: PASS');
