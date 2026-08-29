/* ADINE MANAGEMENT BENCHMARK RESOLVER V1 */
window.AdineBenchmark={
 async get({productionType,genetics,strain,variant,ageDays,metric}){
  const db=window.supabaseClient;if(!db||ageDays==null)return null;
  const eq=async(level)=>{let q=db.from('poultry_management_benchmarks').select('*').eq('active',true).eq('production_type',productionType).eq('age_days',ageDays).eq('metric_code',metric);if(level>=1&&genetics)q=q.eq('genetics',genetics);if(level>=2&&strain)q=q.eq('strain',strain);if(level>=3&&variant)q=q.eq('variant',variant);const {data,error}=await q;return error?[]:(data||[])};
  const a=await eq(3); if(a.length)return a[0];
  const b=await eq(2); if(b.length)return b.sort((x,y)=>y.sample_size-x.sample_size)[0];
  const c=await eq(1); if(c.length)return c.sort((x,y)=>y.sample_size-x.sample_size)[0];
  const d=await eq(0); if(d.length)return d.sort((x,y)=>y.sample_size-x.sample_size)[0];
  return null;
 },
 async resolve({productionType,genetics,strain,variant,ageDays,metric,official}){
  if(official!=null)return {value:official,source:'official'};
  const b=await this.get({productionType,genetics,strain,variant,ageDays,metric});
  return b?{value:Number(b.target_value),lower:Number(b.lower_value),upper:Number(b.upper_value),source:'management',sampleSize:b.sample_size,method:b.method,sourceName:b.source_name}:null;
 }
};