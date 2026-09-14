const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const context={console};
context.window=context;
vm.createContext(context);
vm.runInNewContext(fs.readFileSync('standard-data.js','utf8'),context);
assert(context.VERIFIED_STANDARDS?.broiler,'legacy fixture must exist before the canonical engine quarantines it');
vm.runInNewContext(fs.readFileSync('broiler-official-standards-v1.js','utf8'),context);
assert.strictEqual(context.VERIFIED_STANDARDS.broiler,undefined,'legacy broiler registry must be quarantined at runtime');
assert.strictEqual(context.ADINE_BROILER_STANDARD_AUTHORITY,'BROILER_OFFICIAL_STANDARDS_V1');
assert.strictEqual(typeof context.broilerCanonicalMetricTarget,'function');
assert.strictEqual(context.broilerCanonicalMetricTarget('Ross 308',56,'weight').value,4318);
assert.strictEqual(context.broilerCanonicalMetricTarget('Ross 308 AP',56,'cumulativeFcr').value,1.776);
assert.strictEqual(context.broilerCanonicalMetricTarget('Arian',56,'weight').value,3440);

/* Non-broiler standard data remains owned by the existing production-type
   registry; this guard only removes the duplicate broiler branch. */
assert(context.VERIFIED_STANDARDS.layer,'layer standards must remain available');
assert(context.VERIFIED_STANDARDS.pullet,'pullet standards must remain available');
assert(context.VERIFIED_STANDARDS.breeder,'breeder standards must remain available');

console.log('broiler single-source guard: PASS');
