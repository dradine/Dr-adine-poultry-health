(function(){
'use strict';

document.addEventListener('DOMContentLoaded', async function(){
  const auth = await AdineAuth.requireAuth();
  if(!auth) return;
  const type = String(auth.profile?.user_type||'').trim().toLowerCase();
  const professionalTypes = ['veterinarian','technical_veterinarian','veterinary_lab','diagnostic_lab','poultry_technical_expert'];
  if(!professionalTypes.includes(type)){ window.location.replace('Dashboard.html'); return; }

  const params = new URLSearchParams(location.search);
  const farmId = params.get('farm') || params.get('farm_id') || localStorage.getItem('adine_selected_farm');
  const farmName = document.getElementById('farmName');
  const farmMeta = document.getElementById('farmMeta');
  const badge = document.getElementById('accessBadge');
  const list = document.getElementById('flocks');
  const message = document.getElementById('message');

  document.getElementById('back').onclick = ()=>location.href='professional.html';

  if(!farmId){ message.innerHTML='<div class="error">شناسه فارم مشخص نیست.</div>'; list.innerHTML=''; return; }
  if(!(await AdineAccess.canAccessFarm(farmId))){ message.innerHTML='<div class="error">دسترسی شما به این فارم فعال نیست یا توسط مالک قطع شده است.</div>'; list.innerHTML=''; return; }

  const farmRes = await supabaseClient.from('farms').select('id,name,farm_code,farm_type,location').eq('id',farmId).maybeSingle();
  if(farmRes.error || !farmRes.data){ message.innerHTML='<div class="error">اطلاعات فارم دریافت نشد.</div>'; return; }
  const farm=farmRes.data;
  farmName.textContent=farm.name || 'فارم بدون نام';
  farmMeta.textContent=[farm.farm_type, farm.farm_code, farm.location].filter(Boolean).join(' | ') || 'اطلاعات تکمیلی ثبت نشده است';
  badge.textContent='دسترسی فعال';

  const res=await supabaseClient.from('flocks').select('id,flock_name,flock_code,production_type,strain,status,current_bird_count,initial_bird_count,placement_date,house_id,houses(name)').eq('farm_id',farmId).order('placement_date',{ascending:false});
  if(res.error){ list.innerHTML='<div class="error">خطا در دریافت گله‌ها.</div>'; return; }
  const flocks=res.data||[];
  if(!flocks.length){ list.innerHTML='<div class="empty">برای این فارم هنوز گله‌ای ثبت نشده است.</div>'; return; }

  list.innerHTML=flocks.map(f=>{
    const closed=String(f.status||'').toLowerCase()==='closed';
    return `<article class="flock-card">
      <span class="badge">${escapeHtml(f.production_type||'نوع تولید نامشخص')}</span>
      <h3>${escapeHtml(f.flock_name||'گله بدون نام')}</h3>
      <div class="meta">کد گله: ${escapeHtml(f.flock_code||'—')}<br>سالن: ${escapeHtml(f.houses?.name||'—')}<br>نژاد/سویه: ${escapeHtml(f.strain||'—')}<br>تعداد فعلی: ${escapeHtml(f.current_bird_count??'—')}<br>وضعیت: ${closed?'بسته':'فعال'}</div>
      <div class="actions">
        <button class="btn btn-primary" data-go="weekly.html" data-flock="${f.id}">گزارش هفتگی</button>
        <button class="btn btn-secondary" data-go="health.html" data-flock="${f.id}">سلامت و بیماری</button>
        <button class="btn btn-secondary" data-go="reports.html" data-flock="${f.id}">گزارش جامع</button>
      </div>
    </article>`;
  }).join('');

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-go]'); if(!btn)return;
    const flockId=btn.dataset.flock;
    setCurrentSelection({farmId:farmId,houseId:null,flockId:flockId});
    localStorage.setItem('adine_selected_farm',farmId);
    const url=btn.dataset.go+'?flockId='+encodeURIComponent(flockId)+'&farm='+encodeURIComponent(farmId);
    location.href=url;
  });

  function escapeHtml(v){const d=document.createElement('div');d.textContent=v==null?'':String(v);return d.innerHTML;}
});
})();
