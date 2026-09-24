const fs=require('fs');
const vm=require('vm');
const assert=require('assert/strict');

const context={console};
context.window=context;
vm.createContext(context);

const load=p=>vm.runInContext(fs.readFileSync(p,'utf8'),context,{filename:p});

load('standard-data.js');
load('broiler-official-standards-v1.js');
load('standards-resolver-core-v1.js');
load('guangming2-integration-v1.js');

assert.ok(context.POULTRY_CATALOG.broiler.genetics.some(x=>x.id==='guangming'));
assert.deepStrictEqual(context.POULTRY_CATALOG.broiler.genetics.find(x=>x.id==='guangming').strains,['Guangming No.2']);

const g=context.ADINE_GUANGMING2;
assert.equal(g.strain,'Guangming No.2');
assert.equal(g.sourceType,'official-through-day-42-management-extension-after-day-42');
assert.equal(g.weeklyRecords.find(x=>x.age===42).weight,3027);
assert.equal(g.weeklyRecords.find(x=>x.age===42).cumulativeFcr,1.544);
assert.equal(g.weeklyRecords.find(x=>x.age===42).sourceType,'official-performance-objective');
assert.equal(g.weeklyRecords.find(x=>x.age===49).sourceType,'management-derived');

assert.equal(context.broilerCanonicalMetricTarget('Guangming No.2',42,'weight').value,3027);
assert.equal(context.broilerCanonicalMetricTarget('Guangming No.2',42,'cumulativeFcr').value,1.544);
assert.equal(context.broilerCanonicalMetricTarget('Guangming No.2',42,'mortality').value,2.6);
assert.equal(context.broilerCanonicalMetricTarget('Guangming No.2',42,'cv').value,8);
assert.equal(context.broilerCanonicalMetricTarget('Guangming No.2',42,'u10').value,79);
assert.equal(context.broilerCanonicalMetricTarget('Guangming No.2',42,'u15').value,94);
assert.equal(context.broilerCanonicalMetricTarget('Guangming No.2',49,'weight').value,3755);
assert.equal(context.broilerCanonicalMetricTarget('Guangming No.2',49,'weight').sourceType,'management-derived');

// Existing breeder standards are untouched.
assert.equal(context.broilerCanonicalMetricTarget('Ross 308',42,'weight').value,2998);
assert.equal(context.broilerCanonicalMetricTarget('Ross 308 AP',56,'cumulativeFcr').value,1.776);

// Daily standards bridge: Guangming is installed when the isolated daily file loads later.
load('broiler-daily-standards-v1.js');
const daily=context.ADINE_BROILER_DAILY_STANDARDS_V1;
assert.ok(daily.strains['Guangming No.2']);
assert.deepStrictEqual(daily.strains['Guangming No.2'].dayWeightG,{1:58,2:71,3:92,4:117,5:145,6:175,7:208});
assert.equal(daily.strains['Guangming No.2'].sourceType,'official-anchor+management-derived-daily');
assert.equal(daily.aliases['گوانمینگ ۲'],'Guangming No.2');

console.log('Guangming No.2 integration tests passed.');
