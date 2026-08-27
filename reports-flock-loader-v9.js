/* ADINE REPORTS — CANONICAL FLOCK LOADER V9.1
   Critical fix: supabase-config.js defines supabaseClient as a global lexical binding (const), not window.supabaseClient. Resolve both safely.
*/
(function(g){
  'use strict';
  if(g.__ADINE_REPORTS_FLOCK_LOADER_V91__) return;
  g.__ADINE_REPORTS_FLOCK_LOADER_V91__=true;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const getClient=()=>{try{if(typeof supabaseClient!=='undefined'&&supabaseClient?.auth)return supabaseClient}catch(_){}return g.supabaseClient||null};
  const label=f=>f.flock_name||f.flock_code||('گله '+String(f.id||'').slice(0,8));
  const type=f=>{const x=String(f.production_type||'').toLowerCase();if(x.includes('layer')||x.includes('تخم'))return'تخم‌گذار';if(x.includes('breeder')||x.includes('مادر'))return'مادر';if(x.includes('pullet')||x.includes('پولت'))return'پولت';return'گوشتی'};
  async function getRows(){let lastError=null;for(let i=0;i<100;i++){const client=getClient();if(client?.auth){try{const session=await client.auth.getSession();const user=session?.data?.session?.user;if(user){const q=await client.from('flocks').select('id,flock_name,flock_code,production_type,farm_id,house_id,created_at').order('created_at',{ascending:false});if(q.error){lastError=q.error;throw q.error}return Array.isArray(q.data)?q.data:[]}}catch(e){lastError=e}}await wait(150)}throw lastError||new Error('Supabase session/client is not ready')}
  function put(sel,rows,placeholder){if(!sel)return;const keep=sel.value;sel.innerHTML='';const first=document.createElement('option');first.value='';first.textContent=placeholder;sel.appendChild(first);rows.forEach(f=>{const o=document.createElement('option');o.value=String(f.id);o.textContent=label(f)+' — '+type(f);o.dataset.farmId=f.farm_id||'';o.dataset.houseId=f.house_id||'';sel.appendChild(o)});if(keep&&rows.some(f=>String(f.id)===String(keep)))sel.value=keep}
  function findSelectors(){return{source:document.getElementById('flockSelect'),mirror:document.getElementById('adineReportFlockMirror')}}
  async function load(){const {source,mirror}=findSelectors();if(!source&&!mirror)return;try{const rows=await getRows();put(source,rows,'یک گله را انتخاب کنید');put(mirror,rows,'یک گله را انتخاب کنید');const active=source?.value||mirror?.value||'';if(source&&mirror){source.value=active;mirror.value=active}if(mirror&&!mirror.dataset.v91Bound){mirror.dataset.v91Bound='1';mirror.addEventListener('change',()=>{if(source){source.value=mirror.value;source.dispatchEvent(new Event('change',{bubbles:true}))}})}if(source&&!source.dataset.v91Bound){source.dataset.v91Bound='1';source.addEventListener('change',()=>{if(mirror)mirror.value=source.value})}g.__adineReportsFlocks=rows;document.dispatchEvent(new CustomEvent('adine:reports-flocks-loaded',{detail:{rows}}));if(active&&source)source.dispatchEvent(new Event('change',{bubbles:true}));console.info('ADINE reports: loaded flocks:',rows.length)}catch(e){console.error('ADINE reports flock loader failed',e);[source,mirror].forEach(s=>{if(s){s.innerHTML='<option value="">خطا در دریافت گله‌ها</option>';s.title=String(e?.message||e)}})}}
  function boot(){load()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  g.__adineReloadReportsFlocks=load;
})(window);
