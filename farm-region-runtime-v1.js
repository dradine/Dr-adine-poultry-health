/* ADINE — Farm region persistence bridge. Keeps the legacy Farms.js untouched. */
(function(){'use strict';
document.addEventListener('DOMContentLoaded',function(){
 const form=document.getElementById('farmForm'); if(!form)return;
 form.addEventListener('submit',function(){
  const region=document.getElementById('farmRegion')?.value||''; if(!region)return;
  const user=window.currentUser||window.__ADINEH_CURRENT_USER__||null;
  const uid=user?.id||null;
  if(!uid||!window.supabaseClient)return;
  setTimeout(async function(){
   try{
    const q=await window.supabaseClient.from('farms').select('id,created_at,region').eq('owner_id',uid).order('created_at',{ascending:false}).limit(1);
    const row=q.data?.[0]; if(!row||row.region===region)return;
    await window.supabaseClient.from('farms').update({region}).eq('id',row.id).eq('owner_id',uid);
   }catch(e){console.warn('Farm region save bridge:',e)}
  },1200);
 },false);
});
})();
