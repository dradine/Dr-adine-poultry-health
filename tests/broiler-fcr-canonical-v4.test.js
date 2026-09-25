const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const context={console}; context.window=context; vm.createContext(context);
vm.runInContext(fs.readFileSync('broiler-official-standards-v1.js','utf8'),context);
vm.runInContext(fs.readFileSync('broiler-performance-intelligence-source-v1.js','utf8'),context);
vm.runInContext(fs.readFileSync('broiler-fcr-engine-v11.js','utf8'),context);

const R=context.BROILER_OFFICIAL_STANDARDS_V1;
const F=context.AdineBroilerFCR;
const S=context.AdineBroilerPerformanceIntelligenceSourceV1;
assert(R&&F&&S,'canonical registry, FCR engine and source adapter must load');
assert.strictEqual(F.VERSION,'BROILER-FCR-V14.2');

const expectedInitial={
  'Ross 308':44,'Ross 308 FF':44,'Ross 708':44,'Ross 308 AP':44,
  Cobb500:42,Cobb800:43,'Arbor Acres Plus':42,'Arbor Acres Plus S':42,
  'Indian River':44,'Indian River FF':44,'Efficiency Plus':43,'Hubbard EDGE':43,Arian:42
};
for(const strain of Object.keys(R.strains)){
  const s=R.strains[strain];
  assert.strictEqual(s.initialWeight,expectedInitial[strain],`${strain}: placement weight mismatch`);
  assert.strictEqual(s.records.length===8||s.managementRecords.length===8||s.records.length===8,true,`${strain}: incomplete canonical age coverage`);
  const flock={production_type:'broiler',genetics:s.family,strain};
  for(const age of R.weeklyAges){
    const row=S.enrich(flock,[{id:`${strain}-${age}`,age_days:age}])[0];
    if(strain==='Efficiency Plus' && age===7) console.log('DEBUG_EFFICIENCY_PLUS_D7',JSON.stringify(row.canonicalTargets),JSON.stringify(row));
    assert(row.canonicalTargets.weight>0,`${strain} day ${age}: weight target missing`);
    assert(row.canonicalTargets.fcr>0,`${strain} day ${age}: weekly FCR target missing`);
    assert(row.canonicalTargets.cumulativeFcr>0,`${strain} day ${age}: cumulative FCR target missing`);
    assert(row.canonicalTargets.adg>0,`${strain} day ${age}: weekly gain target missing`);
  }
}

function expectedWeekly(records,initialWeight){
  return records.map((r,i)=>{
    const [age,w,c]=r;
    if(i===0)return c;
    const [,pw,pc]=records[i-1];
    const currentFeed=c*(w-initialWeight);
    const previousFeed=pc*(pw-initialWeight);
    return (currentFeed-previousFeed)/(w-pw);
  });
}

for(const [strain,s] of Object.entries(R.strains)){
  const records=(s.records||[]).map((r)=>{
    const m=(s.managementRecords||[]).find(x=>x[0]===r[0]);
    return [r[0],r[1]??m?.[1],r[2]??m?.[2]];
  });
  const complete=records.every(r=>r[1]!=null&&r[2]!=null);
  if(!complete) continue;
  const exp=expectedWeekly(records,s.initialWeight);
  for(let i=0;i<records.length;i++){
    const row=S.weeklyEvaluationStandard({production_type:'broiler',genetics:s.family,strain},{age_days:records[i][0]});
    assert(Math.abs(row.weeklyFcr-exp[i])<0.002,`${strain} day ${records[i][0]}: weekly FCR derivation mismatch ${row.weeklyFcr} vs ${exp[i]}`);
  }
}

const ap=R.strains['Ross 308 AP'];
assert.deepStrictEqual(ap.records[0],[7,214,.772]);
assert.deepStrictEqual(ap.records[3],[28,1657,1.257]);
assert.deepStrictEqual(ap.records[7],[56,4446,1.776]);
const ap56=S.weeklyEvaluationStandard({production_type:'broiler',genetics:'Ross',strain:'Ross 308 AP'},{age_days:56});
assert.strictEqual(ap56.weight,4446);
assert.strictEqual(ap56.cumulativeFcr,1.776);
assert.strictEqual(ap56.weeklyFcr,2.520);

const cobb800=R.strains.Cobb800;
assert.strictEqual(cobb800.initialWeight,43);
assert.deepStrictEqual(cobb800.records[0],[7,202,.825]);
assert.deepStrictEqual(cobb800.records[1],[14,461,1.046]);
assert.deepStrictEqual(cobb800.records[7],[56,4358,1.762]);

const r56=S.weeklyEvaluationStandard({production_type:'broiler',genetics:'Ross',strain:'Ross 308'},{age_days:56});
assert.strictEqual(r56.weight,4318);
assert.strictEqual(r56.cumulativeFcr,1.793);
assert.strictEqual(r56.weeklyFcr,2.535);

const actualFlock={initial_average_weight_g:44,initial_bird_count:1000};
const actual=F.canonical([
  {age_days:7,average_weight_g:214,live_birds:990,feed_total_kg:168.3},
  {age_days:14,average_weight_g:540,live_birds:985,feed_total_kg:364.0}
],actualFlock);
assert(Math.abs(actual[0].weeklyFcr-(168.3/(990*(214-44)/1000)))<0.0001);
assert(Math.abs(actual[0].cumulativeFcr-actual[0].weeklyFcr)<0.0001);
assert(Math.abs(actual[1].weeklyFcr-(364/(985*(540-214)/1000)))<0.0001);
assert(Math.abs(actual[1].cumulativeFcr-((168.3+364)/(985*(540-44)/1000)))<0.0001);
assert.strictEqual(actual[1].fcrSemantics,'comparable-breeder-catalog-mortality-not-accounted-for');

console.log('broiler-fcr-canonical-v4: PASS — 13 strains × 8 weeks, catalog anchors, weekly/cumulative derivation, mortality semantics');