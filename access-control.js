/* ADINEH ROLE/FARM ACCESS BRIDGE */
(function(){
'use strict';

window.AdineAccess={
  normalizeRole(p){return String(p?.user_type||p?.role||'').trim().toLowerCase()},

  async current(){
    const auth=await AdineAuth.requireAuth();
    if(!auth)return null;
    return auth;
  },

  /*
   * RLS is the primary source of truth. RPCs are fallback/enrichment only.
   * This prevents a missing/old get_my_farm_access RPC from breaking the
   * owner farm chooser and never grants access outside the database RLS.
   */
  async farmAccessRows(){
    const a=await this.current();
    if(!a)return [];

    const role=this.normalizeRole(a.profile);
    const rows=new Map();

    const add=(list,source)=>{
      (list||[]).forEach(x=>{
        const id=x?.id||x?.farm_id;
        if(!id)return;
        const existing=rows.get(id)||{};
        rows.set(id,{
          ...existing,
          ...x,
          id,
          _source:[...(existing._source||[]),source]
        });
      });
    };

    /* Owner/admin: ask farms through RLS first. */
    if(role==='owner'||role==='admin'){
      const r=await supabaseClient
        .from('farms')
        .select('id,name,farm_code,capacity,farm_type,owner_id,owner_name,manager_name,operational_status,monitoring_status,monitoring_message,monitoring_updated_at,created_at')
        .order('created_at',{ascending:false});
      if(!r.error)add(r.data,'rls');
    } else {
      /* Every professional/operator path still starts with the RLS query. */
      const r=await supabaseClient
        .from('farms')
        .select('id,name,farm_code,capacity,farm_type,owner_id,owner_name,manager_name,operational_status,monitoring_status,monitoring_message,monitoring_updated_at,created_at')
        .order('created_at',{ascending:false});
      if(!r.error)add(r.data,'rls');
    }

    /* Fallback/enrichment: old RPCs can add only rows already consistent with
       the current account; canAccessFarm performs a fresh RLS confirmation. */
    try{
      const r=await supabaseClient.rpc('get_my_farm_access');
      if(!r.error)add((r.data||[]).filter(x=>x.connection_status==='active'),'professional_rpc');
    }catch(e){console.warn('get_my_farm_access fallback unavailable',e)}

    try{
      const r=await supabaseClient.rpc('get_my_professional_farms');
      if(!r.error)add((r.data||[]).filter(x=>x.connection_status==='active'),'professional_rpc_v2');
    }catch(e){console.warn('get_my_professional_farms fallback unavailable',e)}

    return [...rows.values()].filter(x=>x.id);
  },

  async farmIds(){
    return (await this.farmAccessRows()).map(x=>x.id);
  },

  async canAccessFarm(id){
    if(!id)return false;
    const a=await this.current();
    if(!a)return false;

    /* Never trust role alone. Confirm visibility through the farms table/RLS. */
    const visible=await supabaseClient
      .from('farms')
      .select('id,owner_id')
      .eq('id',id)
      .maybeSingle();

    if(visible.error||!visible.data)return false;

    const role=this.normalizeRole(a.profile);
    if(role==='owner'||role==='admin')return true;

    const accessRows=await this.farmAccessRows();
    return accessRows.some(x=>x.id===id);
  },

  async openFarm(id,target='weekly.html'){
    if(!await this.canAccessFarm(id)){
      alert('دسترسی این فارم برای حساب شما فعال نیست.');
      return;
    }
    localStorage.setItem('adine_selected_farm',id);
    window.location.href=target+'?farm='+encodeURIComponent(id);
  },

  roleLabel(p){
    const m={
      veterinarian:'دامپزشک',
      technical_veterinarian:'دامپزشک مسئول فنی',
      poultry_operator:'بهره‌بردار واحد طیور',
      poultry_manager:'مدیر واحد طیور',
      veterinary_lab:'آزمایشگاه تشخیص دامپزشکی',
      diagnostic_lab:'آزمایشگاه تشخیص دامپزشکی',
      poultry_technical_expert:'کارشناس فنی طیور',
      organization_manager:'مدیر / نماینده مجموعه',
      other:'سایر',
      owner:'مالک سامانه'
    };
    return m[String(p?.user_type||p?.role||'').toLowerCase()]||'کاربر';
  },

  esc(v){
    const d=document.createElement('div');
    d.textContent=v??'';
    return d.innerHTML;
  }
};
})();
