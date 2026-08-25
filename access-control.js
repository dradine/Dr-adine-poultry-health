/* ADINEH ROLE/FARM ACCESS BRIDGE */
(function(){
'use strict';
window.AdineAccess={
 normalizeRole(p){return String(p?.user_type||p?.role||'').trim().toLowerCase()},
 async current(){const auth=await AdineAuth.requireAuth(); if(!auth)return null; return auth},
 async farmIds(){const {data,error}=await supabaseClient.rpc('get_my_farm_access'); if(error){console.error(error);return []} return (data||[]).filter(x=>x.connection_status==='active').map(x=>x.farm_id)},
 async canAccessFarm(id){
  const a=await this.current();
  if(!a || !id) return false;
  const role=String(a.profile?.role||'').toLowerCase();
  if(['owner','admin'].includes(role)) return true;

  // Professional users must be checked against the farm-access relation,
  // not only farms.owner_id. The previous owner_id shortcut incorrectly
  // rejected assigned farms for operators/managers.
  const ids=await this.farmIds();
  if(ids.includes(id)) return true;

  // Backward-compatible fallback for legacy farm ownership.
  const userType=String(a.profile?.user_type||'').toLowerCase();
  if(['farm_operator','farm_manager','company_manager','poultry_operator','poultry_manager','poultry_operat','poultry_manage'].includes(userType)){
    const {data,error}=await supabaseClient.from('farms').select('id').eq('id',id).eq('owner_id',a.user.id).maybeSingle();
    if(!error && data) return true;
  }
  return false;
 },
 async openFarm(id,target='weekly.html'){if(!await this.canAccessFarm(id)){alert('دسترسی این فارم برای حساب شما فعال نیست.');return}localStorage.setItem('adine_selected_farm',id);window.location.href=target+'?farm='+encodeURIComponent(id)},
 roleLabel(p){const m={veterinarian:'دامپزشک',technical_veterinarian:'دامپزشک مسئول فنی',farm_operator:'بهره‌بردار واحد طیور',farm_manager:'مدیر واحد طیور',diagnostic_lab:'آزمایشگاه تشخیص دامپزشکی',poultry_technical_expert:'کارشناس فنی طیور',company_manager:'مدیر / نماینده مجموعه',other:'سایر',owner:'مالک سامانه'};return m[String(p?.user_type||p?.role||'').toLowerCase()]||'کاربر'},
 esc(v){const d=document.createElement('div');d.textContent=v??'';return d.innerHTML}
};
})();
