/* ADINEH ROLE/FARM ACCESS BRIDGE */
(function(){
'use strict';
window.AdineAccess={
 normalizeRole(p){return String(p?.user_type||p?.role||'').trim().toLowerCase()},
 async current(){const auth=await AdineAuth.requireAuth(); if(!auth)return null; return auth},
 async farmIds(){const {data,error}=await supabaseClient.rpc('get_my_farm_access'); if(error){console.error(error);return []} return (data||[]).filter(x=>x.connection_status==='active').map(x=>x.farm_id)},
 async canAccessFarm(id){const a=await this.current();if(!a)return false;if(['owner','admin'].includes(String(a.profile.role||'').toLowerCase()))return true;if(String(a.profile.user_type||'').match(/poultry_operator|poultry_manager|organization_manager/)) {const {data}=await supabaseClient.from('farms').select('id').eq('id',id).eq('owner_id',a.user.id).maybeSingle();return !!data}const ids=await this.farmIds();return ids.includes(id)},
 async openFarm(id,target='weekly.html'){if(!await this.canAccessFarm(id)){alert('دسترسی این فارم برای حساب شما فعال نیست.');return}localStorage.setItem('adine_selected_farm',id);window.location.href=target+'?farm='+encodeURIComponent(id)},
 roleLabel(p){const m={veterinarian:'دامپزشک',technical_veterinarian:'دامپزشک مسئول فنی',poultry_operator:'بهره‌بردار واحد طیور',poultry_manager:'مدیر واحد طیور',veterinary_lab:'آزمایشگاه تشخیص دامپزشکی',diagnostic_lab:'آزمایشگاه تشخیص دامپزشکی',poultry_technical_expert:'کارشناس فنی طیور',organization_manager:'مدیر / نماینده مجموعه',other:'سایر',owner:'مالک سامانه'};return m[String(p?.user_type||p?.role||'').toLowerCase()]||'کاربر'},
 esc(v){const d=document.createElement('div');d.textContent=v??'';return d.innerHTML}
};
})();
