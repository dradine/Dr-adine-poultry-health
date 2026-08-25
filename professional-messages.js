(function(){'use strict';document.addEventListener('DOMContentLoaded',async()=>{
 const auth=await AdineAuth.requireAuth();if(!auth)return;
 const type=String(auth.profile?.user_type||'').toLowerCase();if(!['poultry_operator','poultry_manager','poultry_technical_expert'].includes(type)){location.replace('professional.html');return;}
 const esc=v=>{const d=document.createElement('div');d.textContent=v??'';return d.innerHTML};
 async function load(){
  const r=await supabaseClient.from('professional_messages').select('id,sender_id,recipient_id,farm_id,body,attachment_path,attachment_name,attachment_size,created_at').or(`sender_id.eq.${auth.user.id},recipient_id.eq.${auth.user.id}`).order('created_at',{ascending:true});
  if(r.error){document.getElementById('messages').innerHTML='<div class="pro-empty">خطا در دریافت پیام‌ها.</div>';return}
  const data=r.data||[];if(!data.length){document.getElementById('messages').innerHTML='<div class="pro-empty">پیامی از متخصصان ندارید.</div>';return}
  const farms=await supabaseClient.from('farms').select('id,name').in('id',[...new Set(data.map(x=>x.farm_id).filter(Boolean))]);
  const fm=Object.fromEntries((farms.data||[]).map(x=>[x.id,x.name]));
  const pros=[...new Set(data.map(x=>x.sender_id===auth.user.id?x.recipient_id:x.sender_id))];
  document.getElementById('messages').innerHTML=`<div class="section-head"><div><h2>گفتگوهای فارم</h2><p>پیام و فایل متخصصان را مشاهده و پاسخ دهید.</p></div></div>`+data.map(m=>`<div class="conv"><h3>${esc(fm[m.farm_id]||'فارم')} <small>${m.sender_id===auth.user.id?'— پیام شما':'— پیام متخصص'}</small></h3><div class="line ${m.sender_id===auth.user.id?'me':'them'}">${esc(m.body||'')}${m.attachment_path?`<div><a href="#" data-download="${esc(m.attachment_path)}">📎 ${esc(m.attachment_name||'فایل')}</a></div>`:''}<small>${new Date(m.created_at).toLocaleString('fa-IR')}</small></div></div>`).join('');
  document.getElementById('messages').querySelectorAll('[data-download]').forEach(a=>a.onclick=async e=>{e.preventDefault();const q=await supabaseClient.storage.from('professional-attachments').createSignedUrl(a.dataset.download,300);if(q.error)alert('دریافت فایل ممکن نیست.');else open(q.data.signedUrl,'_blank')});
 }
 await load();
});})();
