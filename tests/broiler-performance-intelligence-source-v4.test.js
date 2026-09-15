const fs=require('fs'),vm=require('vm'),assert=require('assert');
const sourceCode=fs.readFileSync('broiler-performance-intelligence-source-v1.js','utf8');
const canonicalSourceCode=fs.readFileSync('broiler-performance-intelligence-source-v9-3.js','utf8');
const engineCode=fs.readFileSync('broiler-official-standards-v1.js','utf8');
const sandbox={console};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(engineCode,sandbox);vm.runInContext(sourceCode,sandbox);
const S=sandbox.AdineBroilerPerformanceIntelligenceSourceV1;
assert(S&&S.version==='BROILER-PI-SOURCE-V9.3');
const rows=[{id:'r1',age_days:35,standard_weight:1024,standardWeeklyFcr:1.32,standardCv:99,weight:980,fcr:1.34}];
const out=S.enrich({production_type:'broiler',genetics:'Ross',strain:'Ross 308 AP'},rows)[0];
assert.strictEqual(out.canonicalTargets.weight,2360,'PI must use the canonical engine, not stale weekly row targets');
assert.strictEqual(out.canonicalTargets.cumulativeFcr,1.386,'PI cumulative FCR must come only from canonical standards');
assert.notStrictEqual(out.canonicalTargets.weight,1024,'row standard_weight must never override canonical target');
assert.strictEqual(out.targetAuthority,'canonical-broiler-standards-engine');
assert.strictEqual(out.targetResolver,'broilerCanonicalMetricTarget');
assert.strictEqual(out.targetResolverVersion,'BROILER-CANONICAL-STANDARDS-V4');
assert.strictEqual(typeof S.enrich,'function');
assert.strictEqual(typeof S.weeklyEvaluationStandard,'function');

const canonicalSandbox={console};canonicalSandbox.window=canonicalSandbox;vm.createContext(canonicalSandbox);vm.runInContext(engineCode,canonicalSandbox);vm.runInContext(canonicalSourceCode,canonicalSandbox);
const C=canonicalSandbox.AdineBroilerPerformanceIntelligenceSourceV1;
assert(C&&C.version==='BROILER-PI-SOURCE-V9.3','canonical v9.3 entrypoint must expose the same version');
assert.strictEqual(C.enrich({strain:'Ross 308 AP'},rows)[0].canonicalTargets.weight,2360,'canonical v9.3 entrypoint must use the canonical target resolver');

console.log('BROILER PERFORMANCE INTELLIGENCE SOURCE V9.3 TESTS: PASS');
