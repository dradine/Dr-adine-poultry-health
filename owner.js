/* ADINEH OWNER PANEL — coordinated with current Supabase owner RPCs */
(function(){"use strict";
let client=null,users=[],selected=null,busy=false,initialized=false;
const $=id=>document.getElementById(id);const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const roleLabels={user:"کاربر",owner:"مالک سامانه"};
const statusLabels={pending:"در انتظار تأیید",active:"فعال",suspended:"موقتاً غیرفعال",blocked:"مسدود",removed:"بایگانی"};
const typeLabels={veterinarian:"دامپزشک",technical_veterinarian:"دامپزشک مسئول فنی",poultry_operator:"بهره‌بردار واحد طیور",farm_operator:"بهره‌بردار واحد طیور",poultry_manager:"مدیر واحد طیور",farm_manager:"مدیر واحد طیور",veterinary_lab:"آزمایشگاه تشخیص دامپزشکی",diagnostic_lab:"آزمایشگاه تشخیص دامپزشکی",poultry_technical_expert:"کارشناس فنی طیور",organization_manager:"مدیر / نماینده مجموعه",company_manager:"مدیر / نماینده مجموعه",other:"سایر"};
const activityLabels={broiler:"گوشتی",layer:"تخم‌گذار",breeder:"مادر",pullet:"پولت",hatchery:"جوجه‌کشی",other:"سایر"};
function esc(v){return v==null?"":String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));}
function fa(v){return Number(v||0).toLocaleString("fa-IR");}
function dateFa(v){if(!v)return"—";const d=new Date(v);if(Number.isNaN(d.getTime()))return"—";try{return d.toLocaleString("fa-IR-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});}catch(_){return d.toLocaleString("fa-IR");}}
function notify(text,type="info"){const e=$("message");if(!e)return;e.textContent=text;e.className="message "+type;e.hidden=false;}
function clearNotify(){const e=$("message");if(e)e.hidden=true;}
function text(map,v){return map[v]||v||"—";}
function activityText(v){let a=v;if(typeof v==="string"){try{a=JSON.parse(v)}catch(_){return esc(v)}}if(!Array.isArray(a)||!a.length)return"—";return a.map(x=>esc(activityLabels[x]||x)).join("، ");}
function normalize(r){return{id:r.id||r.user_id,user_id:r.user_id||r.id,full_name:r.full_name||"",email:r.email||"",phone:r.phone||"",role:r.role||"user",status:r.status||"pending",is_active:r.is_active===true,created_at:r.created_at||null,updated_at:r.updated_at||null,last_seen_at:r.last_seen_at||null,approved_at:r.approved_at||null,user_type:r.user_type||"other",activity_types:r.activity_types||[],organization_name:r.organization_name||null,license_number:r.license_number||null,province:r.province||null,city:r.city||null,specialty:r.specialty||null,notes:r.notes||null,is_verified:r.is_verified===true,professional_code:r.professional_code||r.access_code||null,access_code:r.access_code||r.professional_code||null,professional_code_active:r.professional_code_active===true||r.is_active_code===true};}
async function getClient(){for(let i=0;i<100;i++){if(window.supabaseClient?.auth)return window.supabaseClient;try{if(typeof supabaseClient!=="undefined"&&supabaseClient?.auth)return supabaseClient}catch(_){}await sleep(80)}throw new Error("اتصال Supabase آماده نشد.");}
async function getUser(){const {data,error}=await client.auth.getUser();if(error)throw error;if(!data?.user)throw new Error("جلسه ورود پیدا نشد. دوباره وارد سامانه شوید.");return data.user;}
async function verifyOwner(u){const {data,error}=await client.from("profiles").select("id,email,full_name,role,status,is_active").eq("id",u.id).maybeSingle();if(error)throw error;if(!data||data.role!=="owner"||data.status!=="active"||data.is_active!==true)throw new Error("این حساب مالک فعال سامانه نیست.");const e=$("ownerIdentity");if(e)e.textContent=`مالک: ${data.full_name||"دکتر ادینه"} | ${data.email||u.email||"—"}`;}
function faError(error, fallback="انجام عملیات ناموفق بود."){
  const raw=String(error?.message||error?.details||error?.hint||error||"");
  const map=[
    [/column .*full_name.*user_activity_logs/i,"ثبت فعالیت سامانه با ساختار پایگاه داده هماهنگ نیست. لطفاً migration بخش مالک را اجرا کنید."],
    [/not found|does not exist|could not find the function/i,"عملیات موردنظر در پایگاه داده سامانه پیدا نشد."],
    [/permission denied|row-level security|rls/i,"دسترسی لازم برای انجام این عملیات وجود ندارد."],
    [/jwt|session|auth/i,"نشست ورود شما معتبر نیست. لطفاً دوباره وارد سامانه شوید."],
    [/duplicate|already exists|unique/i,"این اطلاعات قبلاً ثبت شده است."],
    [/owner/i,"این عملیات فقط برای مالک فعال سامانه مجاز است."],
    [/کاربر موردنظر پیدا نشد/i,"کاربر موردنظر پیدا نشد."],
    [/کد حرفه‌ای/i,raw],
    [/نام و نام خانوادگی/i,raw]
  ];
  for(const [re,msg] of map) if(re.test(raw)) return msg;
  if(/^[\u0600-\u06ff\s،؛:()._\-0-9]+$/.test(raw)&&raw.length<220) return raw;
  return fallback;
}
async function rpc(name,args={}){const {data,error}=await client.rpc(name,args);if(error){console.error("RPC",name,error);throw new Error(faError(error));}return data;}
async function loadDirectory(){const data=await rpc("owner_get_user_directory");return Array.isArray(data)?data.map(normalize).filter(x=>x.id):[];}
async function loadUsers(){if(busy)return;busy=true;const b=$("usersTableBody");if(b)b.innerHTML='<tr><td colspan="8" style="text-align:center;padding:30px">در حال بارگذاری اطلاعات کاربران...</td></tr>';clearNotify();try{client=await getClient();const u=await getUser();await verifyOwner(u);users=await loadDirectory();render();await loadStatistics();await loadActivity();notify(`اطلاعات ${fa(users.length)} کاربر بارگذاری شد.`,"success");}catch(e){console.error("OWNER LOAD",e);users=[];render();notify(faError(e,"خطا در دریافت اطلاعات پنل مدیریت."),"error");}finally{busy=false;}}
async function loadStatistics(){try{const d=await rpc("owner_get_statistics");const r=Array.isArray(d)?d[0]:d;if(!r)return;$("statTotal").textContent=fa(r.total_users);$("statActive").textContent=fa(r.active_users);$("statPending").textContent=fa(r.pending_users);$("statSuspended").textContent=fa(r.suspended_users);$("statBlocked").textContent=fa(Number(r.blocked_users||0)+Number(r.removed_users||0));$("statSpecialists").textContent=fa(Number(r.veterinarians||0)+Number(r.technical_veterinarians||0)+Number(r.operators||0)+Number(r.managers||0)+Number(r.laboratories||0)+Number(r.technical_experts||0));}catch(e){console.warn("STATISTICS",e);renderStatsLocal();}}
function renderStatsLocal(){$("statTotal").textContent=fa(users.length);$("statActive").textContent=fa(users.filter(x=>x.status==="active"&&x.is_active).length);$("statPending").textContent=fa(users.filter(x=>x.status==="pending").length);$("statSuspended").textContent=fa(users.filter(x=>x.status==="suspended").length);$("statBlocked").textContent=fa(users.filter(x=>["blocked","removed"].includes(x.status)).length);$("statSpecialists").textContent=fa(users.filter(x=>["veterinarian","technical_veterinarian","poultry_operator","farm_operator","poultry_manager","farm_manager","veterinary_lab","diagnostic_lab","poultry_technical_expert","organization_manager","company_manager"].includes(x.user_type)).length);}
async function loadActivity(){const box=$("activityList");if(!box)return;try{const d=await rpc("owner_get_activity");const a=Array.isArray(d)?d:[];box.innerHTML=a.length?a.slice(0,30).map(x=>`<div class="activity-item"><strong>${esc(x.full_name||"کاربر")}</strong> — ${esc(x.action||"فعالیت")}${x.page?`<span>صفحه: ${esc(x.page)}</span>`:""}<span>${dateFa(x.created_at)}${x.details?` | ${esc(typeof x.details==="string"?x.details:JSON.stringify(x.details))}`:""}</span></div>`).join(""):'<div class="muted">فعالیتی ثبت نشده است.</div>';}catch(e){box.innerHTML='<div class="muted">اطلاعات فعالیت در دسترس نیست.</div>';}}
function filtered(){const q=String($("userSearch")?.value||"").trim().toLowerCase(),r=$("roleFilter")?.value||"",s=$("statusFilter")?.value||"";return users.filter(u=>{const hay=[u.full_name,u.email,u.phone,u.user_type,u.organization_name,u.license_number,u.province,u.city,u.specialty].join(" ").toLowerCase();return(!q||hay.includes(q))&&(!r||u.role===r)&&(!s||u.status===s)});}
function render(){renderStatsLocal();const b=$("usersTableBody");if(!b)return;const list=filtered();if(!list.length){b.innerHTML='<tr><td colspan="8" style="text-align:center;padding:30px;color:#75827c">کاربری مطابق فیلترها پیدا نشد.</td></tr>';return;}b.innerHTML=list.map(u=>`<tr><td><strong class="name">${esc(u.full_name||"بدون نام")}</strong><span class="muted">${esc(text(roleLabels,u.role))}</span></td><td>${esc(u.email||"—")}<span class="muted" dir="ltr">${esc(u.phone||"—")}</span></td><td><span class="badge">${esc(text(typeLabels,u.user_type))}</span><span class="muted">${activityText(u.activity_types)}</span></td><td>${u.is_verified?'<span class="badge verified">تأیید حرفه‌ای</span>':'<span class="muted">تأیید نشده</span>'}<span class="muted">${u.professional_code_active?'کد فعال':'کد غیرفعال / ندارد'}</span></td><td><span class="badge ${esc(u.status)}">${esc(text(statusLabels,u.status))}</span></td><td>${dateFa(u.created_at)}</td><td>${dateFa(u.last_seen_at||u.updated_at)}</td><td><div class="actions"><button class="action" data-action="open" data-id="${esc(u.id)}">جزئیات</button><button class="action" data-action="code" data-id="${esc(u.id)}">کد</button><button class="action" data-action="status" data-id="${esc(u.id)}">وضعیت</button></div></td></tr>`).join("");}
function setVal(id,v){const e=$(id);if(e)e.value=v==null?"":v;}
function openModal(u){selected=u;setVal("editFullName",u.full_name);setVal("editEmail",u.email);setVal("editPhone",u.phone);setVal("editRole",u.role);setVal("editStatus",u.status);setVal("editActive",u.is_active?"true":"false");setVal("editUserType",u.user_type||"other");setVal("editOrganization",u.organization_name);setVal("editLicense",u.license_number);setVal("editProvince",u.province);setVal("editCity",u.city);setVal("editSpecialty",u.specialty);setVal("editNotes",u.notes);setVal("editVerified",u.is_verified?"true":"false");const acts=Array.isArray(u.activity_types)?u.activity_types:[];document.querySelectorAll("#editActivities input").forEach(c=>c.checked=acts.includes(c.value));$("currentCode").textContent=u.professional_code||"کد ندارد";$("codeState").textContent=u.professional_code_active?"فعال":"غیرفعال";$("codeState").className="badge "+(u.professional_code_active?"active":"removed");$("createdState").textContent=dateFa(u.created_at);$("seenState").textContent=dateFa(u.last_seen_at||u.updated_at);$("modalSubtitle").textContent=`${u.full_name||"بدون نام"} | ${u.email||"بدون ایمیل"}`;$("userModal").classList.remove("hidden");document.body.classList.add("modal-open");}
function closeModal(){$("userModal").classList.add("hidden");document.body.classList.remove("modal-open");selected=null;}
async function saveUser(){
  if(!selected)return;
  const btn=$("saveUser");
  btn.disabled=true;
  try{
    const uid=selected.id;
    const full=$("editFullName").value.trim();
    const role=$("editRole").value;
    const status=$("editStatus").value;
    const active=$("editActive").value==="true";
    const current=await getUser();
    if(!full)throw new Error("نام و نام خانوادگی نمی‌تواند خالی باشد.");
    if(selected.role!=="owner"&&role==="owner")throw new Error("ایجاد مالک دیگر از پنل مدیریت مجاز نیست.");
    if(uid===current.id&&(role!=="owner"||status!=="active"||!active))throw new Error("وضعیت یا نقش مالک اصلی قابل تغییر نیست.");
    if((status==="active")!==active)throw new Error("فعال بودن حساب باید با وضعیت حساب هماهنگ باشد.");
    const acts=[...document.querySelectorAll("#editActivities input:checked")].map(x=>x.value);
    await rpc("owner_save_user",{
      p_user_id:uid,
      p_full_name:full,
      p_phone:$("editPhone").value.trim()||null,
      p_email:$("editEmail").value.trim()||null,
      p_role:role,
      p_status:status,
      p_is_active:active,
      p_user_type:$("editUserType").value,
      p_activity_types:acts,
      p_organization_name:$("editOrganization").value.trim()||null,
      p_license_number:$("editLicense").value.trim()||null,
      p_province:$("editProvince").value.trim()||null,
      p_city:$("editCity").value.trim()||null,
      p_specialty:$("editSpecialty").value.trim()||null,
      p_notes:$("editNotes").value.trim()||null,
      p_is_verified:$("editVerified").value==="true"
    });
    notify("تغییرات با موفقیت و به‌صورت کامل ذخیره شد.","success");
    await loadUsers();
    const fresh=users.find(x=>String(x.id)===String(uid));
    if(fresh)openModal(fresh);
  }catch(e){
    console.error("SAVE",e);
    notify(faError(e,"ذخیره تغییرات انجام نشد."),"error");
  }finally{btn.disabled=false;}
}
async function generateCode(){
  if(!selected)return;
  const btn=$("generateCode");btn.disabled=true;
  try{
    const uid=selected.id;
    const code=await rpc("owner_generate_professional_code",{p_user_id:uid});
    if(!code)throw new Error("کد از سرور دریافت نشد.");
    await loadUsers();
    const fresh=users.find(x=>String(x.id)===String(uid));
    if(fresh)openModal(fresh);
    notify("کد حرفه‌ای با موفقیت در پایگاه داده ذخیره شد.","success");
  }catch(e){
    console.error("CODE",e);
    notify(faError(e,"تولید کد حرفه‌ای انجام نشد."),"error");
  }finally{btn.disabled=false;}
}
async function toggleCode(){
  if(!selected||!selected.professional_code)return notify("ابتدا برای این کاربر کد حرفه‌ای تولید کنید.","error");
  const btn=$("toggleCode");btn.disabled=true;
  try{
    const uid=selected.id;
    await rpc("owner_set_professional_code_status",{p_user_id:uid,p_is_active:!selected.professional_code_active});
    await loadUsers();
    const fresh=users.find(x=>String(x.id)===String(uid));
    if(fresh)openModal(fresh);
    notify("وضعیت کد حرفه‌ای با موفقیت ذخیره شد.","success");
  }catch(e){
    console.error("TOGGLE CODE",e);
    notify(faError(e,"تغییر وضعیت کد انجام نشد."),"error");
  }finally{btn.disabled=false;}
}
async function quickCode(uid){
  const u=users.find(x=>String(x.id)===String(uid));if(!u)return;
  selected=u;await generateCode();
}
function quickStatus(uid){
  const u=users.find(x=>String(x.id)===String(uid));if(u)openModal(u);
  const e=$("editStatus");if(e)e.focus();
}
function bind(){if(initialized)return;initialized=true;$("usersTableBody").addEventListener("click",async e=>{const b=e.target.closest("[data-action]");if(!b)return;const u=users.find(x=>String(x.id)===String(b.dataset.id));if(!u)return;const action=b.dataset.action;if(action==="open")openModal(u);else if(action==="code")await quickCode(u.id);else if(action==="status")quickStatus(u.id);});$("userSearch").addEventListener("input",render);$("roleFilter").addEventListener("change",render);$("statusFilter").addEventListener("change",render);$("refreshButton").addEventListener("click",loadUsers);$("refreshUsers").addEventListener("click",loadUsers);$("saveUser").addEventListener("click",saveUser);$("generateCode").addEventListener("click",generateCode);$("toggleCode").addEventListener("click",toggleCode);$("closeModal").addEventListener("click",closeModal);$("closeModal2").addEventListener("click",closeModal);$("userModal").addEventListener("click",e=>{if(e.target===$("userModal"))closeModal();});$("logoutButton").addEventListener("click",async()=>{try{client=client||await getClient();await client.auth.signOut();location.href="login.html";}catch(e){notify(faError(e,"خروج از سامانه ناموفق بود."),"error");}});document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("tab-"+b.dataset.tab).classList.add("active");}));document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("userModal").classList.contains("hidden"))closeModal();});}
async function init(){try{bind();await loadUsers();}catch(e){console.error(e);notify(e.message||"خطای راه‌اندازی پنل مالک.","error");}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
