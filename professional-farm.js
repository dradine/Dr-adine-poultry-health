/* ADINEH | Professional farm workspace */
(function(){'use strict';
document.addEventListener('DOMContentLoaded',async()=>{
 const auth=await AdineAuth.requireAuth();if(!auth)return;
 const role=String(auth.profile?.role||'').toLowerCase(), type=String(auth.profile?.user_type||'').toLowerCase();
 if(['owner','admin'].includes(role)){location.replace('owner.html');return;}
 if(['farm_operator','farm_manager','poultry_technical_expert'].includes(type)){location.replace('Dashboard.html');return;}
 const farmId=new URLSearchParams(location.search).get('farm')||localStorage.getItem('adine_selected_farm');
 const $=id=>document.getElementById(id), esc=v=>AdineAccess.esc(v);
 $('backBtn').onclick=$('backBtn2').onclick=()=>location.href='professional.html';
 if(!farmId){$('farmName').textContent='شناسه فارم مشخص نیست';return;}
 const {data:rows,error}=await supabaseClient.rpc('professional_get_dashboard');
 if(error){$('farmName').textContent='خطا در دریافت دسترسی';return;}
 const farm=rows?.find(x=>String(x.farm_id)===String(farmId)&&x.connection_status==='active');
 if(!farm){$('farmName').textContent='دسترسی این فارم برای شما فعال نیست';$('messageForm').style.display='none';return;}
 localStorage.setItem('adine_selected_farm',farmId);
 $('farmName').textContent=farm.farm_name||'فارم بدون نام';
 $('farmMeta').textContent=[farm.farm_type||'نوع نامشخص',farm.farm_code?'کد '+farm.farm_code:'',farm.farmer_name||''].filter(Boolean).join(' | ');
 $('farmerInfo').textContent=`${farm.farmer_name||'مرغدار'}${farm.farmer_phone?' | '+farm.farmer_phone:''}`;
 if(farm.health_status==='critical'||farm.health_status==='warning') $('healthAlert').innerHTML=`<div class="pro-alert">⚠ ${esc(farm.health_reason||'آخرین گزارش هفتگی نیازمند بررسی است.')}</div>`;
 const flockRes=await supabaseClient.from('flocks').select('id,flock_name,flock_code,production_type,placement_date,status').eq('farm_id',farmId).order('placement_date',{ascending:false});
 const flocks=flockRes.data||[];
 const flockSelect=$('flockSelect');
 if(flockSelect){
   flockSelect.innerHTML=flocks.map(f=>`<option value=\"${esc(f.id)}\">${esc(f.flock_name||'گله بدون نام')} — ${esc(f.production_type||'نوع نامشخص')}</option>`).join('') || '<option value=\"\">گله‌ای ثبت نشده</option>';
 }
 function updateLinks(){
   const fid=flockSelect?.value||'';
   if(fid){ localStorage.setItem('adine_selected_flock',fid); if(typeof setCurrentSelection==='function') setCurrentSelection({farmId:farmId,houseId:null,flockId:fid}); }
   const q='?farm='+encodeURIComponent(farmId)+(fid?'&flockId='+encodeURIComponent(fid):'')+'&professional=1';
   $('healthLink').href='health.html'+q; $('mortalityLink').href='mortality.html'+q; $('reportsLink').href='reports.html'+q; $('recordsLink').href='records.html'+q;
 }
 flockSelect?.addEventListener('change',updateLinks);
 updateLinks();
 
 async function loadMessages(){
   const {data,error}=await supabaseClient.from('professional_messages').select('id,sender_id,recipient_id,body,attachment_path,attachment_name,attachment_size,attachment_type,created_at').eq('farm_id',farmId).or(`sender_id.eq.${auth.user.id},recipient_id.eq.${auth.user.id}`).order('created_at',{ascending:true});
   if(error){$('messageList').innerHTML='<div class="pro-empty">خطا در دریافت پیام‌ها.</div>';return}
   if(!data?.length){$('messageList').innerHTML='<div class="pro-empty">هنوز پیامی ثبت نشده است.</div>';return}
   $('messageList').innerHTML=data.map(m=>`<div class="msg ${m.sender_id===auth.user.id?'me':'them'}"><div>${esc(m.body||'')}</div>${m.attachment_path?`<div style="margin-top:5px"><a href="#" data-download="${esc(m.attachment_path)}">📎 ${esc(m.attachment_name||'فایل پیوست')}</a></div>`:''}<small>${new Date(m.created_at).toLocaleString('fa-IR')}</small></div>`).join('');
   $('messageList').querySelectorAll('[data-download]').forEach(a=>a.onclick=async e=>{e.preventDefault();const r=await supabaseClient.storage.from('professional-attachments').createSignedUrl(a.dataset.download,300);if(r.error)alert('دریافت فایل ممکن نیست.');else window.open(r.data.signedUrl,'_blank')});
   $('messageList').scrollTop=$('messageList').scrollHeight;
 }
 $('messageForm').onsubmit=async e=>{
   e.preventDefault(); const btn=e.submitter; btn.disabled=true;
   try{
     const text=$('messageText').value.trim(); const file=$('messageFile').files[0];
     if(file&&file.size>716800)throw new Error('حجم فایل نباید بیشتر از ۷۰۰ کیلوبایت باشد.');
     let path=null;
     if(file){const safe=file.name.replace(/[^\w\-.\u0600-\u06ff ]/g,'_');path=`${auth.user.id}/${farmId}/${crypto.randomUUID()}_${safe}`;const up=await supabaseClient.storage.from('professional-attachments').upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});if(up.error)throw up.error;}
     const r=await supabaseClient.rpc('professional_send_message',{p_farm_id:farmId,p_recipient_id:farm.farmer_id,p_body:text,p_attachment_path:path,p_attachment_name:file?.name||null,p_attachment_size:file?.size||null,p_attachment_type:file?.type||null});
     if(r.error){if(path)await supabaseClient.storage.from('professional-attachments').remove([path]);throw r.error;}
     $('messageText').value='';$('messageFile').value='';await loadMessages();
   }catch(err){alert(err.message||'ارسال پیام انجام نشد.')}finally{btn.disabled=false}
 };
 await loadMessages();
});})();
