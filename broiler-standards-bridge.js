/* Connect the strain-specific broiler registry to the existing resolver shape. */
(function(g){
  if(!g.VERIFIED_STANDARDS||!g.BROILER_OFFICIAL_STANDARDS_V1)return;
  const ids={
    aviagen_ross:['Ross 308','Ross 308 FF','Ross 708','Ross 308 AP'],
    cobb:['Cobb500','Cobb800'],
    aviagen_arbor:['Arbor Acres Plus','Arbor Acres Plus S'],
    aviagen_indian:['Indian River','Indian River FF'],
    hubbard:['Efficiency Plus','Hubbard EDGE'],
    arian:['Arian']
  };
  const out={};
  for(const [gid,names] of Object.entries(ids)){
    out[gid]={};
    for(const name of names){
      const s=g.BROILER_OFFICIAL_STANDARDS_V1.strains[name];
      if(!s)continue;
      out[gid][name]={
        official:{sourceType:s.sourceType,sourceLabel:s.sourceLabel,sourceUrl:s.sourceUrl,
          records:s.records.map(([ageDays,bodyWeight,fcr])=>({ageDays,bodyWeight,fcr}))},
        interpolationPolicy:'exact-only'
      };
    }
  }
  g.VERIFIED_STANDARDS.broiler=out;
})(typeof window!=='undefined'?window:globalThis);
