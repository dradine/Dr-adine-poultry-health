/* ADINE — Farm region persistence bridge.
   Reliable post-save bridge for the legacy Farms.js flow.
   It never guesses the newest farm blindly: it looks for a farm created after this submit. */
(function(){'use strict';
function wait(ms){return new Promise(r=>setTimeout(r,ms));}
async function getSession(){return await window.supabaseClient?.auth?.getSession?.();}
async function findNewFarm(sb,uid,submittedAt,attempts){
 for(let i=0;i<attempts;i++){
  const q=await sb.from('farms').select('id,created_at,region').eq('owner_id',uid).order('created_at',{ascending:false}).limit(8);
  if(q.error)throw q.error;
  const row=(q.data||[]).find(x=>x.created_at && new Date(x.created_at).getTime()>=submittedAt-2000);
  if(row)return row;
  await wait(400);
 }
 return null;
}
document.addEventListener('DOMContentLoaded',function(){
 const form=document.getElementById('farmForm'); if(!form)return;
 form.addEventListener('submit',function(){
  const region=document.getElementById('farmRegion')?.value||''; if(!region)return;
  const submittedAt=Date.now();
  setTimeout(async function(){
   try{
    const sb=window.supabaseClient;if(!sb)return;
    const session=await getSession();
    const uid=session?.data?.session?.user?.id;if(!uid)return;
    const row=await findNewFarm(sb,uid,submittedAt,20);
    if(!row||row.region===region)return;
    const u=await sb.from('farms').update({region}).eq('id',row.id).eq('owner_id',uid);
    if(u.error)throw u.error;
   }catch(e){console.warn('Farm region save bridge:',e)}
  },250);
 },false);
});
})();
