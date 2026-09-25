const fs=require('fs'),vm=require('vm'),assert=require('assert');
const runtimeSourceCode=fs.readFileSync('broiler-performance-intelligence-source-runtime-v1.js','utf8');
const legacySourceCode=fs.readFileSync('broiler-performance-intelligence-source-v1.js','utf8');
const canonicalSourceCode=fs.readFileSync('broiler-performance-intelligence-source-v9-3.js','utf8');
const engineCode=fs.readFileSync('broiler-official-standards-v1.js','utf8');

const sandbox={console};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(engineCode,sandbox);vm.runInContext(runtimeSourceCode,sandbox);
const R=sandbox.AdineBroilerPerformanceIntelligenceRuntimeV1;
assert(R&&R.version==='BROILER-PI-RUNTIME-V1');
assert.strictEqual(R.sourceProtocol,'PI-RUNTIME-V1');
const rows=[{id:'r1',age_days:35,standard_weight:1024,standardWeeklyFcr:1.32,standardCv:99,weight:980,fcr:1.34}];
const out=R.enrich({production_type:'broiler',genetics:'Ross',strain:'Ross 308 AP'},rows)[0];
assert.strictEqual(out.canonicalTargets.weight,2360,'PI runtime must use canonical engine, not stale weekly row targets');
assert.strictEqual(out.canonicalTargets.cumulativeFcr,1.386,'PI cumulative FCR must come only from canonical standards');
assert.notStrictEqual(out.canonicalTargets.weight,1024,'row standard_weight must never override canonical target');
assert.strictEqual(out.targetAuthority,'canonical-broiler-standards-engine');
assert.strictEqual(out.targetResolver,'broilerCanonicalMetricTarget');
assert.strictEqual(out.targetResolverVersion,'BROILER-CANONICAL-STANDARDS-V4.1');
assert.strictEqual(typeof R.enrich,'function');
assert.strictEqual(typeof R.weeklyEvaluationStandard,'function');

const legacySandbox={console};legacySandbox.window=legacySandbox;vm.createContext(legacySandbox);vm.runInContext(engineCode,legacySandbox);vm.runInContext(legacySourceCode,legacySandbox);
assert(legacySandbox.AdineBroilerPerformanceIntelligenceSourceV1,'legacy compatibility source must remain available');
assert.strictEqual(legacySandbox.AdineBroilerPerformanceIntelligenceSourceV1.version,'BROILER-PI-SOURCE-V9.3');
assert.strictEqual(legacySandbox.AdineBroilerPerformanceIntelligenceRuntimeV1,undefined,'legacy source must not impersonate the dedicated runtime global');

const canonicalSandbox={console};canonicalSandbox.window=canonicalSandbox;vm.createContext(canonicalSandbox);vm.runInContext(engineCode,canonicalSandbox);vm.runInContext(canonicalSourceCode,canonicalSandbox);
const C=canonicalSandbox.AdineBroilerPerformanceIntelligenceSourceV93;
assert(C&&C.version==='BROILER-PI-SOURCE-V9.4','canonical source must expose the isolated V93 compatibility runtime');
assert.strictEqual(C.sourceProtocol,'PI-SOURCE-V93');
assert.strictEqual(C.enrich({strain:'Ross 308 AP'},rows)[0].canonicalTargets.weight,2360,'canonical compatibility source must use canonical target resolver');

console.log('BROILER PERFORMANCE INTELLIGENCE RUNTIME V1 / SOURCE COMPATIBILITY TESTS: PASS');
