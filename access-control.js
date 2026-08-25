/* ADINEH ROLE/FARM ACCESS BRIDGE */
(function(){
'use strict';

window.AdineAccess={
  normalizeRole(p){return String(p?.user_type||p?.role||'').trim().toLowerCase()},
  async current(){const auth=await AdineAuth.requireAuth();if(!auth)return null;return auth},

  async farmAccessRows(){
    const a=await this.current();
    if(!a)return [];
    const rls=await supabaseClient
      .from('farms')
      .select('id,name,farm_code,capacity,farm_type,owner_id,owner_name,manager_name,operational_status,monitoring_status,monitoring_message,monitoring_updated_at,created_at')
      .order('created_at',{ascending:false});
    if(rls.error){console.error('RLS farm access query failed',rls.error);return []}

    const rows=new Map((rls.data||[]).map(x=>[x.id,{...x,_source:['rls']} ]));
    const allowed=new Set(rows.keys());

    for(const rpcName of ['get_my_farm_access','get_my_professional_farms']){
      try{
        const r=await supabaseClient.rpc(rpcName);
        if(r.error)continue;
        for(const x of (r.data||[])){
          if(x.connection_status && x.connection_status!=='active')continue;
          const id=x.id||x.farm_id;
          if(!id||!allowed.has(id))continue;
          const old=rows.get(id)||{};
          rows.set(id,{...old,...x,id,_source:[...(old._source||[]),rpcName]});
        }
      }catch(error){console.warn(rpcName+' fallback unavailable',error)}
    }
    return [...rows.values()];
  },

  async farmIds(){return (await this.farmAccessRows()).map(x=>x.id)},

  async canAccessFarm(id){
    if(!id)return false;
    const a=await this.current();
    if(!a)return false;
    const r=await supabaseClient.from('farms').select('id').eq('id',id).maybeSingle();
    if(r.error||!r.data)return false;
    const role=this.normalizeRole(a.profile);
    if(role==='owner'||role==='admin')return true;
    return (await this.farmIds()).includes(id);
  },

  async openFarm(id,target='weekly.html'){
    if(!await this.canAccessFarm(id)){alert('دسترسی این فارم برای حساب شما فعال نیست.');return}
    localStorage.setItem('adine_selected_farm',id);
    window.location.href=target+'?farm='+encodeURIComponent(id);
  },

  roleLabel(p){
    const m={veterinarian:'دامپزشک',technical_veterinarian:'دامپزشک مسئول فنی',poultry_operator:'بهره‌بردار واحد طیور',poultry_manager:'مدیر واحد طیور',veterinary_lab:'آزمایشگاه تشخیص دامپزشکی',diagnostic_lab:'آزمایشگاه تشخیص دامپزشکی',poultry_technical_expert:'کارشناس فنی طیور',organization_manager:'مدیر / نماینده مجموعه',other:'سایر',owner:'مالک سامانه'};
    return m[String(p?.user_type||p?.role||'').toLowerCase()]||'کاربر';
  },
  esc(v){const d=document.createElement('div');d.textContent=v??'';return d.innerHTML}
};

/* flocks.js is loaded immediately after this bridge. Its original chooser
   used get_my_farm_access directly. Replace that UI entry point before the
   flocks DOMContentLoaded handler executes. */
document.addEventListener('DOMContentLoaded',function(){
  window.renderFarmChooser=async function(){
    const container=document.getElementById('selectedFarm');
    if(!container)return;
    try{
      const farms=await window.AdineAccess.farmAccessRows();
      if(!farms.length){
        container.innerHTML='<p>هنوز فارمی برای این حساب ثبت نشده است.</p><button class="btn btn-primary" type="button" onclick="location.href=\'Farms.html\'">ثبت / انتخاب فارم</button>';
        return;
      }
      container.innerHTML='<div class="form-group"><label for="directFarmSelect">انتخاب فارم</label><select id="directFarmSelect"><option value="">انتخاب فارم</option></select></div>';
      const select=document.getElementById('directFarmSelect');
      farms.forEach(farm=>{
        const option=document.createElement('option');
        option.value=farm.id;
        option.textContent=(farm.name||'بدون نام')+(farm.farm_code?' — '+farm.farm_code:'');
        select.appendChild(option);
      });
      select.addEventListener('change',async function(){
        if(!this.value)return;
        if(!await window.AdineAccess.canAccessFarm(this.value)){
          alert('دسترسی این فارم برای حساب شما فعال نیست.');
          this.value='';
          return;
        }
        setCurrentSelection({farmId:this.value,houseId:null,flockId:null});
        await loadSelectedFarm();
        enableForms();
      });
    }catch(error){
      console.error('Unified farm chooser error:',error);
      container.innerHTML='<p>دریافت فهرست فارم‌ها انجام نشد.</p><button class="btn btn-secondary" type="button" onclick="location.reload()">تلاش مجدد</button>';
    }
  };
});
})();
