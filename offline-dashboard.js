(async function(){
  'use strict';
  const status=document.getElementById('offlineStatus');
  const welcome=document.getElementById('offlineWelcome');
  function fail(message){status.textContent=message;status.style.background='#fff1f0';status.style.color='#8b1e1e';}
  function active(p){
    if(!p)return false;
    const state=String(p.status||'').trim().toLowerCase();
    const flag=String(p.is_active).trim().toLowerCase();
    return state==='active' && p.is_active!==false && p.is_active!==0 && flag!=='false' && flag!=='0';
  }
  try{
    if(!window.AdineOffline?.getLastCachedProfile)throw new Error('ذخیره‌ساز آفلاین بارگذاری نشده است.');
    const saved=await window.AdineOffline.getLastCachedProfile();
    if(!saved||saved.expired||!active(saved.profile))throw new Error('اعتبار ورود آفلاین پیدا نشد یا منقضی شده است. یک بار با اینترنت وارد سامانه شوید.');
    const p=saved.profile;
    const role=String(p.role||'').trim().toLowerCase();
    const raw=String(p.user_type||p.userType||'').trim().toLowerCase();
    const type=({poultry_operator:'farm_operator',poultry_manager:'farm_manager'})[raw]||raw;
    if(['owner','admin'].includes(role)||!['farm_operator','farm_manager'].includes(type))throw new Error('این نوع حساب در حال حاضر از ورود آفلاین پشتیبانی نمی‌کند.');
    welcome.textContent='خوش آمدید '+(p.full_name||p.email||'کاربر سامانه')+'؛ اطلاعات ذخیره‌شده این دستگاه در دسترس است.';
    const uid=String(p.id);
    const [farms,houses,flocks]=await Promise.all([
      window.AdineOffline.getRows('farms',uid),
      window.AdineOffline.getRows('houses',uid),
      window.AdineOffline.getRows('flocks',uid)
    ]);
    status.textContent='حالت آفلاین فعال است · '+farms.length+' فارم · '+houses.length+' سالن · '+flocks.length+' گله ذخیره‌شده';
    status.style.background='#edf7f0';status.style.color='#1f5135';
  }catch(e){fail(e?.message||'ورود آفلاین انجام نشد.');}
})();