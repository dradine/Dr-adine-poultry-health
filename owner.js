/* =========================================================
   ADINEH OWNER MANAGEMENT — STABLE V5
========================================================= */
(function () {
  "use strict";

  let client = null;
  let allUsers = [];
  let selectedUser = null;
  let initialized = false;
  let busy = false;

  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function esc(v) {
    if (v === null || v === undefined) return "";
    return String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  }
  function fa(v) { return Number(v || 0).toLocaleString("fa-IR"); }
  function notify(text, type="info") {
    const b=$("ownerMessage"); if(!b)return;
    b.textContent=text||""; b.className="owner-message "+type; b.hidden=false;
  }
  function clearNotify(){const b=$("ownerMessage");if(b)b.hidden=true;}
  function dateText(v){
    if(!v)return "—"; const d=new Date(v); if(Number.isNaN(d.getTime()))return "—";
    try{return d.toLocaleString("fa-IR",{dateStyle:"short",timeStyle:"short"});}catch(_){return d.toLocaleString("fa-IR");}
  }

  const typeLabels={
    veterinarian:"دامپزشک",technical_veterinarian:"دامپزشک مسئول فنی",
    poultry_operator:"بهره‌بردار واحد طیور",farm_operator:"بهره‌بردار واحد طیور",
    poultry_manager:"مدیر واحد طیور",farm_manager:"مدیر واحد طیور",
    veterinary_lab:"آزمایشگاه تشخیص دامپزشکی",diagnostic_lab:"آزمایشگاه تشخیص دامپزشکی",
    poultry_technical_expert:"کارشناس فنی طیور",organization_manager:"مدیر / نماینده مجموعه",
    company_manager:"مدیر / نماینده مجموعه",other:"سایر"
  };
  const roleLabels={owner:"مالک سامانه",admin:"مدیر سامانه",user:"کاربر"};
  const statusLabels={pending:"در انتظار تأیید",active:"فعال",suspended:"موقتاً غیرفعال",blocked:"مسدود",removed:"بایگانی / حذف‌شده"};
  const activityLabels={broiler:"گوشتی",layer:"تخم‌گذار",breeder:"مادر",pullet:"پولت",hatchery:"جوجه‌کشی",other:"سایر"};
  const typeText=v=>typeLabels[v]||v||"ثبت نشده";
  const roleText=v=>roleLabels[v]||v||"—";
  const statusText=v=>statusLabels[v]||v||"نامشخص";
  function activityText(v){
    if(!v)return "—"; let a=v;
    if(typeof v==="string"){try{a=JSON.parse(v)}catch(_){return esc(v)}}
    if(!Array.isArray(a))return esc(a);
    return a.length?a.map(x=>esc(activityLabels[x]||x)).join("، "):"—";
  }
  function normalize(r){return {
    id:r.id||r.user_id,user_id:r.user_id||r.id,email:r.email||"",full_name:r.full_name||"",phone:r.phone||"",
    role:r.role||"user",status:r.status||"pending",is_active:r.is_active===true,created_at:r.created_at||null,
    updated_at:r.updated_at||null,last_seen_at:r.last_seen_at||null,user_type:r.user_type||"other",activity_types:r.activity_types||[],
    organization_name:r.organization_name||null,license_number:r.license_number||null,province:r.province||null,city:r.city||null,
    specialty:r.specialty||null,notes:r.notes||null,is_verified:r.is_verified===true,
    professional_code:r.professional_code||r.access_code||null,access_code:r.access_code||r.professional_code||null,
    professional_code_active:r.professional_code_active===true||r.is_active_code===true,
    code_created_at:r.code_created_at||null,code_updated_at:r.code_updated_at||null
  };}

  async function getClient(){
    for(let i=0;i<100;i++){
      if(window.supabaseClient?.auth)return window.supabaseClient;
      try{if(typeof supabaseClient!=="undefined"&&supabaseClient?.auth)return supabaseClient}catch(_){ }
      const cfg=window.SUPABASE_CONFIG||window.supabaseConfig||window.__SUPABASE_CONFIG__||{};
      const url=cfg.url||cfg.supabaseUrl||window.SUPABASE_URL||window.supabaseUrl;
      const key=cfg.anonKey||cfg.key||cfg.supabaseAnonKey||window.SUPABASE_ANON_KEY||window.supabaseAnonKey;
      if(url&&key&&window.supabase?.createClient){
        window.supabaseClient=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
        return window.supabaseClient;
      }
      await sleep(100);
    }
    throw new Error("اتصال Supabase آماده نشد. config.js را بررسی کنید.");
  }
  async function getAuthUser(){
    const {data,error}=await client.auth.getUser();
    if(error)throw error;if(!data?.user)throw new Error("جلسه ورود پیدا نشد. دوباره وارد سامانه شوید.");return data.user;
  }
  async function verifyOwner(user){
    const {data,error}=await client.from("profiles").select("id,email,full_name,phone,role,status,is_active").eq("id",user.id).maybeSingle();
    if(error)throw error;
    if(!data||data.role!=="owner"||data.status!=="active"||data.is_active!==true)throw new Error("این حساب مالک فعال سامانه نیست.");
    const el=$("ownerIdentity");if(el)el.textContent=`مالک: ${data.full_name||"دکتر ادینه"} | ${data.email||user.email||"—"}`;
    return data;
  }

  async function loadViaRpc(){
    const {data,error}=await client.rpc("owner_get_user_directory");
    if(error)throw error; return Array.isArray(data)?data.map(normalize).filter(x=>x.id):[];
  }
  async function loadDirect(){
    const {data,error}=await client.from("profiles").select("id,email,full_name,phone,role,status,is_active,created_at,updated_at,last_seen_at").order("created_at",{ascending:false});
    if(error)throw error;
    const rows=data||[],ids=rows.map(x=>x.id).filter(Boolean),pm=new Map(),cm=new Map();
    if(ids.length){
      const [p,c]=await Promise.all([
        client.from("professional_profiles").select("user_id,user_type,activity_types,organization_name,license_number,province,city,specialty,notes,is_verified").in("user_id",ids),
        client.from("professional_access_codes").select("user_id,access_code,is_active,created_at,updated_at").in("user_id",ids)
      ]);
      if(p.error)console.warn("professional_profiles",p.error); if(c.error)console.warn("professional_access_codes",c.error);
      (p.data||[]).forEach(x=>pm.set(x.user_id,x));(c.data||[]).forEach(x=>cm.set(x.user_id,x));
    }
    return rows.map(x=>{
      const pp=pm.get(x.id)||{}, cc=cm.get(x.id)||{};
      return normalize({...x,...pp,...cc,user_type:x.user_type||pp.user_type||"other",activity_types:x.activity_types||pp.activity_types||[]});
    });
  }
  async function loadUsers(){
    if(busy)return;busy=true;const body=$("usersTableBody");
    if(body)body.innerHTML='<tr><td colspan="8" class="owner-loading">در حال بارگذاری اطلاعات کاربران...</td></tr>';
    clearNotify();
    try{
      client=await getClient();const auth=await getAuthUser();await verifyOwner(auth);
      let users=[];try{users=await loadViaRpc()}catch(e){console.warn("RPC directory failed; direct load used",e)}
      if(!users.length)users=await loadDirect();allUsers=users;render();notify(`اطلاعات ${fa(allUsers.length)} کاربر بارگذاری شد.`,'success');
    }catch(e){console.error("OWNER LOAD ERROR",e);allUsers=[];render();notify(e?.message||"خطا در دریافت اطلاعات کاربران.","error");}
    finally{busy=false;}
  }

  function filteredUsers(){
    const q=String($("userSearch")?.value||"").trim().toLowerCase(),t=$("roleFilter")?.value||"",s=$("statusFilter")?.value||"";
    return allUsers.filter(u=>{
      const hay=[u.full_name,u.email,u.phone,u.user_type,u.organization_name,u.access_code,u.license_number,u.province,u.city,u.specialty].join(" ").toLowerCase();
      return (!q||hay.includes(q))&&(!t||u.user_type===t)&&(!s||u.status===s);
    });
  }
  function renderStats(){
    const set=(id,n)=>{const e=$(id);if(e)e.textContent=fa(n)};
    set("statTotal",allUsers.length);set("statActive",allUsers.filter(x=>x.status==="active"&&x.is_active).length);
    set("statPending",allUsers.filter(x=>x.status==="pending").length);
    set("statSpecialists",allUsers.filter(x=>["veterinarian","technical_veterinarian","veterinary_lab","diagnostic_lab","poultry_technical_expert"].includes(x.user_type)).length);
  }
  function render(){
    renderStats();const body=$("usersTableBody");if(!body)return;const users=filteredUsers();
    if(!users.length){body.innerHTML='<tr><td colspan="8" class="owner-empty">کاربری مطابق فیلترها پیدا نشد.</td></tr>';return;}
    body.innerHTML=users.map(u=>`<tr>
      <td><strong class="owner-name">${esc(u.full_name||"بدون نام")}</strong><small>${esc(roleText(u.role))}</small></td>
      <td><div>${esc(u.email||"—")}</div><small dir="ltr">${esc(u.phone||"شماره ثبت نشده")}</small></td>
      <td><span class="type-badge">${esc(typeText(u.user_type))}</span><small>${activityText(u.activity_types)}</small></td>
      <td><span class="code-preview">${u.professional_code?"••••":"ندارد"}</span></td>
      <td><span class="status status-${esc(u.status)}">${esc(statusText(u.status))}</span></td>
      <td>${dateText(u.created_at)}</td><td>${dateText(u.last_seen_at||u.updated_at)}</td>
      <td><button type="button" class="owner-action" data-action="details" data-id="${esc(u.id)}">جزئیات و ویرایش</button></td>
    </tr>`).join("");
  }

  function setVal(id,v){const e=$(id);if(e)e.value=v==null?"":v;}
  function openModal(u){
    selectedUser=u;const m=$("ownerEditModal");if(!m)return;
    setVal("editUserId",u.id);setVal("editFullName",u.full_name);setVal("editEmail",u.email);setVal("editPhone",u.phone);
    setVal("editRole",u.role);setVal("editStatus",u.status);setVal("editUserType",u.user_type||"other");
    setVal("editOrganization",u.organization_name);setVal("editLicense",u.license_number);setVal("editProvince",u.province);
    setVal("editCity",u.city);setVal("editSpecialty",u.specialty);setVal("editNotes",u.notes);
    const active=$("editActive");if(active)active.value=u.is_active?"true":"false";
    const verified=$("editVerified");if(verified)verified.value=u.is_verified?"true":"false";
    const acts=Array.isArray(u.activity_types)?u.activity_types:[];
    document.querySelectorAll("#editActivities input[type=checkbox]").forEach(c=>c.checked=acts.includes(c.value));
    const code=$("currentCode");if(code)code.textContent=u.professional_code||"کد ندارد";
    const state=$("codeState");if(state)state.textContent=u.professional_code_active?"فعال":"غیرفعال";
    const ver=$("verifiedState");if(ver)ver.textContent=u.is_verified?"تأیید شده":"تأیید نشده";
    const cr=$("createdState");if(cr)cr.textContent=dateText(u.created_at);const se=$("seenState");if(se)se.textContent=dateText(u.last_seen_at||u.updated_at);
    m.hidden=false;document.body.classList.add("owner-modal-open");
  }
  function closeModal(){const m=$("ownerEditModal");if(m)m.hidden=true;document.body.classList.remove("owner-modal-open");selectedUser=null;}

  const PROFESSIONAL_TYPES = new Set([
    "veterinarian","technical_veterinarian","veterinary_lab",
    "diagnostic_lab","poultry_technical_expert"
  ]);

  async function saveUser(){
    if(!selectedUser||!client)return;
    const btn=$("saveUserButton"); if(btn)btn.disabled=true;
    try{
      const uid=selectedUser.id;
      const full=$("editFullName")?.value.trim()||"";
      if(!full)throw new Error("نام کاربر نمی‌تواند خالی باشد.");

      const nextUserType=$("editUserType")?.value||"other";
      const nextRole=$("editRole")?.value||"user";
      const nextStatus=$("editStatus")?.value||"pending";
      const nextActive=$("editActive")?.value==="true";
      const nextVerified=$("editVerified")?.value==="true";
      const acts=[...document.querySelectorAll("#editActivities input[type=checkbox]:checked")].map(x=>x.value);
      const payload={
        p_user_id:uid,p_full_name:full,
        p_email:$("editEmail")?.value.trim()||null,
        p_phone:$("editPhone")?.value.trim()||null,
        p_role:nextRole,p_status:nextStatus,p_is_active:nextActive,
        p_user_type:nextUserType,p_activity_types:acts,
        p_organization_name:$("editOrganization")?.value.trim()||null,
        p_license_number:$("editLicense")?.value.trim()||null,
        p_province:$("editProvince")?.value.trim()||null,
        p_city:$("editCity")?.value.trim()||null,
        p_specialty:$("editSpecialty")?.value.trim()||null,
        p_notes:$("editNotes")?.value.trim()||null,
        p_is_verified:nextVerified
      };

      /* V4: use the enum-safe RPC first. The fallback name keeps this ZIP
         compatible with installations that already have the V3 RPC. */
      let data=null,error=null;
      ({data,error}=await client.rpc("owner_update_user_details_v2",payload));
      if(error && /function .*owner_update_user_details_v2.*does not exist/i.test(String(error.message||""))){
        ({data,error}=await client.rpc("owner_save_user_management",payload));
      }
      if(error)throw error;

      const fresh=Array.isArray(data)?data[0]:data;
      if(fresh){
        const normalized=normalize(fresh);
        const idx=allUsers.findIndex(x=>String(x.id)===String(uid));
        if(idx>=0)allUsers[idx]=normalized; else allUsers.unshift(normalized);
        selectedUser=normalized;
      }
      render();
      notify("اطلاعات کاربر با موفقیت ذخیره شد.","success");
    }catch(e){
      console.error("SAVE USER",e);
      const msg=String(e?.message||e?.details||e?.hint||"ذخیره اطلاعات ناموفق بود.");
      notify(msg,"error");
    }finally{if(btn)btn.disabled=false;}
  }
  async function generateCode(){
    if(!selectedUser)return;const btn=$("generateCodeButton");if(btn)btn.disabled=true;
    try{const {data,error}=await client.rpc("owner_generate_professional_code",{p_user_id:selectedUser.id});if(error)throw error;
      const code=typeof data==="string"?data:(data?.access_code||data?.professional_code);if(!code)throw new Error("کد از سرور دریافت نشد.");
      selectedUser.professional_code=code;selectedUser.access_code=code;selectedUser.professional_code_active=true;
      if($("currentCode"))$("currentCode").textContent=code;if($("codeState"))$("codeState").textContent="فعال";render();notify("کد حرفه‌ای با موفقیت ایجاد / تغییر کرد.","success");
    }catch(e){console.error("GENERATE CODE",e);notify(e?.message||"تولید کد حرفه‌ای ناموفق بود.","error");}
    finally{if(btn)btn.disabled=false;}
  }
  async function toggleCode(){
    if(!selectedUser||!client)return;const btn=$("toggleCodeButton");if(btn)btn.disabled=true;const next=!selectedUser.professional_code_active;
    try{const {error}=await client.from("professional_access_codes").update({is_active:next}).eq("user_id",selectedUser.id);if(error)throw error;
      selectedUser.professional_code_active=next;if($("codeState"))$("codeState").textContent=next?"فعال":"غیرفعال";notify(next?"کد فعال شد.":"کد غیرفعال شد.","success");render();
    }catch(e){console.error("TOGGLE CODE",e);notify(e?.message||"تغییر وضعیت کد ناموفق بود.","error");}
    finally{if(btn)btn.disabled=false;}
  }
  function bind(){
    if(initialized)return;initialized=true;
    document.addEventListener("click",async e=>{
      const detail=e.target.closest?.('[data-action="details"]');
      if(detail){
        const u=allUsers.find(x=>String(x.id)===String(detail.dataset.id));
        if(u)openModal(u);
        return;
      }
      const id=e.target.closest?.("#saveUserButton")?.id;
      if(id){e.preventDefault();await saveUser();return;}
      if(e.target.closest?.("#closeOwnerModal,#cancelEditButton")){e.preventDefault();closeModal();return;}
      if(e.target.closest?.("#generateCodeButton")){e.preventDefault();await generateCode();return;}
      if(e.target.closest?.("#toggleCodeButton")){e.preventDefault();await toggleCode();return;}
      if(e.target.closest?.("#refreshUsers")){e.preventDefault();await loadUsers();return;}
      if(e.target.closest?.("#logoutButton")){e.preventDefault();try{client=client||await getClient();await client.auth.signOut();location.href="login.html"}catch(err){notify(err.message||"خروج ناموفق بود.","error")}return;}
      if(e.target===$("ownerEditModal")){closeModal();}
    },{passive:false});
    $("userSearch")?.addEventListener("input",render);
    $("roleFilter")?.addEventListener("change",render);
    $("statusFilter")?.addEventListener("change",render);
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("ownerEditModal")?.hidden)closeModal();});
  }
  async function init(){try{bind();await loadUsers()}catch(e){console.error(e);notify(e.message||"خطای راه‌اندازی پنل مالک.","error")}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
