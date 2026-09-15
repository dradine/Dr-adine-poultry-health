const fs=require('fs');
const vm=require('vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync('broiler-daily-standards-v1.js','utf8'),context);
const S=context.window.ADINE_BROILER_DAILY_STANDARDS_V1;
if(!S) throw new Error('daily standards object missing');
const expected=[
  'Ross 308','Ross 308 FF','Ross 708','Ross 308 AP',
  'Cobb500','Cobb800','Arbor Acres Plus','Arbor Acres Plus S',
  'Indian River','Indian River FF','Efficiency Plus','Hubbard EDGE','Arian'
];
if(Object.keys(S.strains).filter(k=>k!=='default').length!==13) throw new Error('expected exactly 13 strain standards');
for(const strain of expected){
  const s=S.strains[strain];
  if(!s) throw new Error(`missing strain: ${strain}`);
  if(!s.rationale||!s.source||!s.sourceType||s.sourcePriority==null) throw new Error(`missing provenance for ${strain}`);
  if(!s.dayWeightG) throw new Error(`missing day 1-7 weight series for ${strain}`);
  for(let d=1;d<=7;d++) if(!Number.isFinite(s.dayWeightG[d])) throw new Error(`missing ${strain} day ${d}`);
  for(let d=2;d<=7;d++) if(s.dayWeightG[d]<s.dayWeightG[d-1]) throw new Error(`non-monotonic weight series: ${strain}`);
  if(s.dayWeightG[7]!==s.day7WeightG) throw new Error(`day-7 anchor mismatch: ${strain}`);
}
if(S.common.cropFill[2].min!==75||S.common.cropFill[4].min!==80||S.common.cropFill[24].min!==95) throw new Error('crop-fill anchors invalid');
if(S.common.chickVentTemperatureC.min!==39.4||S.common.chickVentTemperatureC.max!==40.5) throw new Error('vent-temperature anchor invalid');
for(let d=1;d<=7;d++){
  const l=S.common.lighting[`day${d}`];
  if(!l||Math.abs((l.light+l.dark)-24)>0.001) throw new Error(`lighting total is not 24h on day ${d}`);
  const rh=S.common.humidity[d];
  if(!Array.isArray(rh)||rh.length!==2||rh[0]>=rh[1]) throw new Error(`invalid RH band on day ${d}`);
}
if(S.strains.Arian.sourcePriority!==2) throw new Error('Arian must remain management fallback, not official');
if(S.strains['Ross 308'].sourcePriority!==1||S.strains['Cobb500'].sourcePriority!==1) throw new Error('official breeder strains must have priority 1');
if(!S.aliases['Cobb 500']||S.aliases['Arbor Acres']!=='Arbor Acres Plus'||S.aliases['Efficiency Plus']!=='Efficiency Plus') throw new Error('strain aliases incomplete');
console.log('PASS: daily standards V2 — 13 strains, day 1-7 coverage, provenance, anchors, monotonic weights, aliases');
