/* ADINEH | PROFESSIONAL CENTER V2 */
(function(){
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await AdineAuth.requireAuth();
  if(!auth) return;
  const p = auth.profile || {};
  const type = String(p.user_type || '').trim().toLowerCase();
  const mainTypes = ['poultry_operator','poultry_manager','poultry_technical_expert'];
  if(mainTypes.includes(type) && !['owner','admin'].includes(String(p.role||'').toLowerCase())){
    location.replace('Dashboard.html'); return;
  }
  if(['owner','admin'].includes(String(p.role||'').toLowerCase())){
    location.replace('owner.html'); return;
  }

  let rows=[];
  const esc = v => AdineAccess.esc(v);
  const labelType = t => { const m={veterinarian:'دامپزشک',technical_veterinarian:'دامپزشک مسئول فنی',veterinary_lab:'آزمایشگاه تشخیص دامپزشکی',diagnostic_lab:'آزمایشگاه تشخیص دامپزشکی',poultry_technical_expert:'کارشناس فنی طیور',organization_manager:'مدیر / نماینده مجموعه',other:'سایر'}; return m[String(t||'').toLowerCase()] || 'متخصص'; };
  const farmType = t => {
    const s=String(t||'').toLowerCase();
    if(s.includes('broil')||s.includes('گوشتی')) return ['broiler','گوشتی'];
    if(s.includes('layer')||s.includes('تخم')) return ['layer','تخم‌گذار'];
    if(s.includes('breeder')||s.includes('مادر')) return ['breeder','مادر'];
    if(s.includes('pullet')||s.includes('پولت')) return ['pullet','پولت'];
    return ['other','سایر'];
  };
  const statusLabel = s => ({active:'فعال',inactive:'غیرفعال',preparing:'در حال آماده‌سازی'}[String(s||'').toLowerCase()]||'فعال');
  const statusClass = s => String(s||'active').toLowerCase();

  document.getElementById('welcomeName').textContent = p.full_name || 'کاربر حرفه‌ای';
  document.getElementById('welcomeRole').textContent = `${labelType(type)}${p.organization_name ? ' | '+p.organization_name : ''}`;
  document.getElementById('logoutBtn').onclick=()=>AdineAuth.signOut();

  function showMessage(text, ok=false){
    const el=document.getElementById('pageMessage'); el.hidden=false; el.textContent=text;
    el.style.background=ok?'#e9f7ee':'#fff0df'; el.style.color=ok?'#176b37':'#8a4b08';
    clearTimeout(showMessage.t); showMessage.t=setTimeout(()=>el.hidden=true,4500);
  }

  function setTab(tab){
    document.querySelectorAll('.pro-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    document.querySelectorAll('.pro-tab').forEach(s=>s.classList.toggle('active',s.id==='tab-'+tab));
    if(tab==='lists') loadLists();
  }
  document.querySelectorAll('.pro-tabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
  document.getElementById('refreshBtn').onclick=loadDashboard;

  async function loadDashboard(){
    const box=document.getElementById('farmGroups'); box.innerHTML='<div class="pro-empty">در حال دریافت اطلاعات…</div>';
    const {data,error}=await supabaseClient.rpc('professional_get_dashboard');
    if(error){ box.innerHTML='<div class="pro-empty">خطا در دریافت فارم‌ها. لطفاً دوباره تلاش کنید.</div>'; showMessage(error.message); return; }
    rows=data||[];
    const active=rows.filter(x=>x.connection_status==='active');
    document.getElementById('statTotal').textContent=active.length.toLocaleString('fa-IR');
    document.getElementById('statActive').textContent=active.filter(x=>x.farm_status==='active').length.toLocaleString('fa-IR');
    document.getElementById('statInactive').textContent=active.filter(x=>x.farm_status==='inactive').length.toLocaleString('fa-IR');
    document.getElementById('statPreparing').textContent=active.filter(x=>x.farm_status==='preparing').length.toLocaleString('fa-IR');

    const pending=rows.filter(x=>x.connection_status==='pending');
    const groups={broiler:[],layer:[],breeder:[],pullet:[],other:[]};
    active.forEach(x=>groups[farmType(x.farm_type)[0]].push(x));
    const titles={broiler:'فارم‌های گوشتی',layer:'فارم‌های تخم‌گذار',breeder:'فارم‌های مادر',pullet:'فارم‌های پولت',other:'سایر فارم‌ها'};
    let html='';
    if(pending.length){
      html+=`<div class="farm-group"><div class="farm-group-head"><h3>در انتظار تأیید متخصص</h3><span class="farm-group-count">${pending.length.toLocaleString('fa-IR')}</span></div><div class="farm-cards">${pending.map(x=>pendingCard(x)).join('')}</div></div>`;
    }
    Object.keys(groups).forEach(k=>{if(groups[k].length) html+=`<div class="farm-group"><div class="farm-group-head"><h3>${titles[k]}</h3><span class="farm-group-count">${groups[k].length.toLocaleString('fa-IR')} فارم</span></div><div class="farm-cards">${groups[k].map(farmCard).join('')}</div></div>`});
    box.innerHTML=html || '';
    document.getElementById('emptyFarms').hidden=!!html;
    box.querySelectorAll('[data-open-farm]').forEach(b=>b.onclick=()=>location.href='professional-farm.html?farm='+encodeURIComponent(b.dataset.openFarm));
    box.querySelectorAll('[data-message-farm]').forEach(b=>b.onclick=()=>location.href='professional-farm.html?farm='+encodeURIComponent(b.dataset.messageFarm)+'#messages');
    box.querySelectorAll('[data-accept]').forEach(b=>b.onclick=async()=>{b.disabled=true;const r=await supabaseClient.rpc('approve_professional_access',{p_access_id:b.dataset.accept});if(r.error)showMessage(r.error.message);else{showMessage('درخواست تأیید شد.',true);loadDashboard()}});
    box.querySelectorAll('[data-reject]').forEach(b=>b.onclick=async()=>{if(!confirm('این درخواست رد شود؟'))return;b.disabled=true;const r=await supabaseClient.rpc('reject_professional_access',{p_access_id:b.dataset.reject,p_reason:'رد درخواست توسط متخصص'});if(r.error)showMessage(r.error.message);else{showMessage('درخواست رد شد.',true);loadDashboard()}});
  }
  function pendingCard(x){return `<article class="farm-card"><div class="farm-card-top"><div><h4>${esc(x.farm_name||'فارم')}</h4><div class="farmer-line">${esc(x.farmer_name||'بدون نام')} ${x.farmer_phone?' | '+esc(x.farmer_phone):''}</div></div><span class="status-pill pill-preparing">در انتظار تأیید</span></div><div class="farmer-line">${esc(x.farm_type||'نوع نامشخص')}</div><div class="farm-actions"><button class="pro-btn pro-btn-primary" data-accept="${x.connection_id}">تأیید</button><button class="pro-btn pro-btn-outline" data-reject="${x.connection_id}">رد</button></div></article>`}
  function farmCard(x){
    const health=x.health_status;
    const cls=(health==='critical'||health==='warning')?'status-critical':'status-'+statusClass(x.farm_status);
    const pill=(health==='critical'||health==='warning')?'pill-critical':x.farm_status==='inactive'?'pill-inactive':x.farm_status==='preparing'?'pill-preparing':'pill-active';
    const status=health==='critical'?'نیازمند اقدام':health==='warning'?'نیازمند بررسی':statusLabel(x.farm_status);
    return `<article class="farm-card ${cls}"><div class="farm-card-top"><div><h4><a href="professional-farm.html?farm=${encodeURIComponent(x.farm_id)}" style="color:inherit;text-decoration:none">${esc(x.farm_name||'فارم')}</a></h4><div class="farmer-line">${esc(x.farmer_name||'بدون نام')} ${x.farmer_phone?' | '+esc(x.farmer_phone):''}</div></div><span class="status-pill ${pill}">${status}</span></div><div class="farmer-line">${esc(farmType(x.farm_type)[1])} | کد فارم: ${esc(x.farm_code||'—')}</div>${health==='critical'||health==='warning'?`<div class="health-note">⚠ ${esc(x.health_reason||'آخرین گزارش هفتگی نیازمند بررسی است.')}</div>`:''}<div class="farm-actions"><button class="pro-btn pro-btn-primary" data-open-farm="${x.farm_id}">ورود به پرونده</button><button class="pro-btn pro-btn-outline" data-message-farm="${x.farm_id}">پیام به مرغدار</button></div></article>`;
  }

  async function loadProfile(){
    const fields={pFullName:p.full_name,pPhone:p.phone,pEmail:p.email,pUserType:labelType(type),pOrg:p.organization_name,pLicense:p.license_number,pProvince:p.province,pCity:p.city,pSpecialty:p.specialty,pNotes:p.notes};
    Object.entries(fields).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.value=val||''});
    document.getElementById('pActivities').value=Array.isArray(p.activity_types)?p.activity_types.join('، '):String(p.activity_types||'');
    const code=await supabaseClient.rpc('professional_get_my_access_code');
    if(!code.error && code.data?.[0]){document.getElementById('accessCode').textContent=code.data[0].access_code||'—';document.getElementById('pCodeReadonly').value=code.data[0].access_code||'—';}
  }
  document.getElementById('profileForm').onsubmit=async e=>{
    e.preventDefault(); const msg=document.getElementById('profileSaveMessage');msg.textContent='در حال ذخیره…';
    const activities=document.getElementById('pActivities').value.split(/[،,]/).map(x=>x.trim()).filter(Boolean);
    const r=await supabaseClient.rpc('professional_update_my_profile',{p_full_name:document.getElementById('pFullName').value,p_phone:document.getElementById('pPhone').value,p_email:document.getElementById('pEmail').value,p_user_type:type,p_activity_types:activities,p_organization_name:document.getElementById('pOrg').value,p_license_number:document.getElementById('pLicense').value,p_province:document.getElementById('pProvince').value,p_city:document.getElementById('pCity').value,p_specialty:document.getElementById('pSpecialty').value,p_notes:document.getElementById('pNotes').value});
    if(r.error){msg.textContent='خطا: '+r.error.message;return}msg.textContent='با موفقیت ذخیره شد.';msg.style.color='#176b37';
  };

  async function loadLists(){
    const box=document.getElementById('listsGrid'); box.innerHTML='<div class="pro-empty">در حال دریافت لیست‌ها…</div>';
    const lr=await supabaseClient.from('professional_farm_lists').select('id,name,created_at').eq('professional_id',auth.user.id).order('created_at',{ascending:true});
    if(lr.error){box.innerHTML='<div class="pro-empty">خطا در دریافت لیست‌ها.</div>';return}
    const ids=(lr.data||[]).map(x=>x.id);
    let items=[];
    if(ids.length){const ir=await supabaseClient.from('professional_farm_list_items').select('list_id,farm_id').in('list_id',ids);if(ir.error){box.innerHTML='<div class="pro-empty">خطا در دریافت اعضای لیست‌ها.</div>';return}items=ir.data||[]}
    const active=rows.filter(x=>x.connection_status==='active');
    box.innerHTML=(lr.data||[]).map(l=>`<div class="list-card"><h3>${esc(l.name||'لیست بدون نام')}</h3><div class="list-farms">${items.filter(i=>String(i.list_id)===String(l.id)).map(i=>{const f=active.find(x=>String(x.farm_id)===String(i.farm_id));return f?`<div class="list-farm"><span>${esc(f.farm_name)}</span><button class="pro-btn pro-btn-outline" data-remove-list="${l.id}" data-remove-farm="${f.farm_id}">حذف</button></div>`:''}).join('')||'<span style="font-size:11px;color:#7b8781">فارمی در این لیست نیست.</span>'}</div><div class="list-actions"><button class="pro-btn pro-btn-outline" data-add-list="${l.id}">افزودن فارم</button></div></div>`).join('')||'<div class="pro-empty">هنوز لیستی ایجاد نکرده‌اید.</div>';
    box.querySelectorAll('[data-add-list]').forEach(b=>b.onclick=()=>openAddFarmModal(b.dataset.addList));
    box.querySelectorAll('[data-remove-list]').forEach(b=>b.onclick=async()=>{const r=await supabaseClient.rpc('professional_remove_farm_from_list',{p_list_id:b.dataset.removeList,p_farm_id:b.dataset.removeFarm});if(r.error)showMessage(r.error.message);else loadLists()});
  }
  document.getElementById('newListBtn').onclick=async()=>{const name=prompt('نام لیست را وارد کنید (مثلاً «فارم‌های نیازمند پیگیری»)');if(!name)return;const r=await supabaseClient.rpc('professional_create_farm_list',{p_name:name});if(r.error)showMessage(r.error.message);else{showMessage('لیست ایجاد شد.',true);loadLists()}};
  function openAddFarmModal(listId){
    const modal=document.getElementById('listModal'), body=document.getElementById('modalBody');
    body.innerHTML=`<div class="choice-list">${rows.filter(x=>x.connection_status==='active').map(f=>`<label><input type="checkbox" data-choice-farm="${f.farm_id}"> ${esc(f.farm_name)} — ${esc(f.farmer_name||'')}</label>`).join('')||'<span>فارمی موجود نیست.</span>'}</div><button class="pro-btn pro-btn-primary" id="saveListFarms">افزودن انتخاب‌ها</button>`;
    modal.hidden=false;body.querySelectorAll('[data-choice-farm]').forEach(c=>c.checked=false);
    document.getElementById('saveListFarms').onclick=async()=>{const choices=[...body.querySelectorAll('[data-choice-farm]:checked')];for(const c of choices){const r=await supabaseClient.rpc('professional_add_farm_to_list',{p_list_id:listId,p_farm_id:c.dataset.choiceFarm});if(r.error){showMessage(r.error.message);break}}modal.hidden=true;loadLists()};
  }
  document.querySelector('[data-close]').onclick=()=>document.getElementById('listModal').hidden=true;
  document.getElementById('listModal').addEventListener('click',e=>{if(e.target.id==='listModal')e.currentTarget.hidden=true});

  await loadProfile();
  await loadDashboard();
});
})();
