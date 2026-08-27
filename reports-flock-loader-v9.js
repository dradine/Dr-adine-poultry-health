/* ADINE REPORTS — CANONICAL FLOCK LOADER V9
   Single source of truth for the visible report flock selector.
   No owner_id filter: Supabase RLS decides which flocks the signed-in user may see.
*/
(function(g){
  'use strict';
  if(g.__ADINE_REPORTS_FLOCK_LOADER_V9__) return;
  g.__ADINE_REPORTS_FLOCK_LOADER_V9__=true;

  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const label=f=>f.flock_name||f.flock_code||('گله '+String(f.id||'').slice(0,8));
  const type=f=>{const x=String(f.production_type||'').toLowerCase();if(x.includes('layer')||x.includes('تخم'))return'تخم‌گذار';if(x.includes('breeder')||x.includes('مادر'))return'مادر';if(x.includes('pullet')||x.includes('پولت'))return'پولت';return'گوشتی'};

  async function getRows(){
    for(let i=0;i<80;i++){
      if(g.supabaseClient?.auth){
        const auth=await g.supabaseClient.auth.getUser();
        if(auth?.data?.user){
          const q=await g.supabaseClient.from('flocks').select('id,flock_name,flock_code,production_type,farm_id,house_id,created_at').order('created_at',{ascending:false});
          if(q.error) throw q.error;
          return Array.isArray(q.data)?q.data:[];
        }
      }
      await wait(100);
    }
    throw new Error('Supabase session is not ready');
  }

  function put(sel,rows,placeholder){
    if(!sel)return;
    const keep=sel.value;
    sel.innerHTML='';
    const first=document.createElement('option');first.value='';first.textContent=placeholder;sel.appendChild(first);
    rows.forEach(f=>{const o=document.createElement('option');o.value=f.id;o.textContent=label(f)+' — '+type(f);o.dataset.farmId=f.farm_id||'';o.dataset.houseId=f.house_id||'';sel.appendChild(o)});
    if(keep && rows.some(f=>String(f.id)===String(keep))) sel.value=keep;
  }

  async function load(){
    const source=document.getElementById('flockSelect');
    const mirror=document.getElementById('adineReportFlockMirror');
    if(!source && !mirror)return;
    try{
      const rows=await getRows();
      put(source,rows,'یک گله را انتخاب کنید');
      put(mirror,rows,'یک گله را انتخاب کنید');
      const active=source?.value||mirror?.value||'';
      if(source&&mirror){source.value=active;mirror.value=active;}
      if(mirror&&!mirror.dataset.v9Bound){
        mirror.dataset.v9Bound='1';
        mirror.addEventListener('change',()=>{if(source){source.value=mirror.value;source.dispatchEvent(new Event('change',{bubbles:true}))}});
      }
      if(source&&!source.dataset.v9Bound){
        source.dataset.v9Bound='1';
        source.addEventListener('change',()=>{if(mirror)mirror.value=source.value;});
      }
      g.__adineReportsFlocks=rows;
      document.dispatchEvent(new CustomEvent('adine:reports-flocks-loaded',{detail:{rows}}));
      if(active && source) source.dispatchEvent(new Event('change',{bubbles:true}));
    }catch(e){
      console.error('ADINE V9 flock loader failed',e);
      [source,mirror].forEach(s=>{if(s)s.innerHTML='<option value="">خطا در دریافت گله‌ها</option>'});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
  g.__adineReloadReportsFlocks=load;
})(window);
