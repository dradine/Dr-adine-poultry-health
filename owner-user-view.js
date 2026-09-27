(function(){
"use strict";
let client=null,targetId=null,target=null,units=[];
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const typeLabels={veterinarian:"دامپزشک",technical_veterinarian:"دامپزشک مسئول فنی",farm_operator:"بهره‌بردار واحد طیور",farm_manager:"مدیر واحد طیور",diagnostic_lab:"آزمایشگاه تشخیص دامپزشکی",poultry_technical_expert:"کارشناس فنی طیور",company_manager:"مدیر / نماینده مجموعه",other:"سایر"};
const roleLabels={owner:"مالک سامانه",admin:"مدیر سامانه",user:"کاربر"};
const farmTypeLabels={broiler:"گوشتی",layer:"تخم‌گذار",breeder:"مادر",pullet:"پولت",hatchery:"جوجه‌کشی",other:"سایر"};
const farmStatusLabels={active:"فعال",inactive:"غیرفعال",preparing:"در حال آماده‌سازی"};
function getClient(){
 if(window.supabaseClient?.auth)return window.supabaseClient;
 const cfg=window.SUPABASE_CONFIG||window.supabaseConfig||window.__SUPABASE_CONFIG__||{};
 const url=cfg.url||cfg.supabaseUrl||window.SUPABASE_URL||window.supabaseUrl;
 const key=cfg.anonKey||cfg.key||cfg.supabaseAnonKey||window.SUPABASE_ANON_KEY||window.supabaseAnonKey;
 if(url&&key&&window.supabase?.createClient){window.supabaseClient=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return window.supabaseClient}
 throw new Error("اتصال سامانه آماده نیست.");
}
function activity(v){if(!v)return "";let a=v;if(typeof v==="string"){try{a=JSON.parse(v)}catch(_){a=[]}}return Array.isArray(a)?a.map(x=>({broiler:"گوشتی",layer:"تخم‌گذار",breeder:"مادر",pullet:"پولت",hatchery:"جوجه‌کشی",other:"سایر"}[x]||x)).join("، "):""}
async function verifyOwner(){
 const {data,error}=await client.auth.getUser();if(error||!data?.user)throw new Error("جلسه مالک پیدا نشد.");
 const p=await client.from("profiles").select("id,role,status,is_active").eq("id",data.user.id).maybeSingle();
 if(p.error)throw p.error;
 if(!p.data||p.data.role!=="owner"||p.data.status!=="active"||p.data.is_active!==true)throw new Error("این صفحه فقط برای مالک فعال سامانه است.");
}
async function loadTarget(){
 const r=await client.from("profiles").select("id,email,full_name,phone,role,status,is_active,created_at,last_seen_at").eq("id",targetId).maybeSingle();
 if(r.error)throw r.error;if(!r.data)throw new Error("کاربر پیدا نشد.");
 const pp=await client.from("professional_profiles").select("user_id,user_type,activity_types,organization_name,license_number,province,city,specialty,is_verified").eq("user_id",targetId).maybeSingle();
 target={...r.data,...(pp.data||{})};
 $("userName").textContent=target.full_name||"بدون نام";
 $("userMeta").textContent=[typeLabels[target.user_type]||target.user_type||roleLabels[target.role]||"کاربر",target.email||"—"].filter(Boolean).join(" · ");
 $("userChips").innerHTML=[target.organization_name,target.province&&target.city?[target.province,target.city].filter(Boolean).join(" · "):target.province,target.specialty,activity(target.activity_types)].filter(Boolean).map(x=>'<span class="chip">'+esc(x)+'</span>').join("");
 $("systemViewBtn").hidden=false;
}
async function loadUnits(){
 const direct=await client.from("farms").select("id,name,farm_code,farm_type,location,province,region,climate_class,owner_id,owner_name,manager_name,is_active,created_at").eq("owner_id",targetId).order("created_at",{ascending:false});
 if(direct.error)throw direct.error;
 const map=new Map((direct.data||[]).map(f=>[String(f.id),{...f,relation:"مالک/بهره‌بردار"}]));
 const access=await client.from("farm_professional_access").select("farm_id,professional_user_id,connection_status,approved_at,created_at").eq("professional_user_id",targetId);
 if(!access.error && (access.data||[]).length){
   const ids=(access.data||[]).map(x=>x.farm_id).filter(Boolean).filter(id=>!map.has(String(id)));
   if(ids.length){
     const extra=await client.from("farms").select("id,name,farm_code,farm_type,location,province,region,climate_class,owner_id,owner_name,manager_name,is_active,created_at").in("id",ids);
     (extra.data||[]).forEach(f=>map.set(String(f.id),{...f,relation:"تحت پوشش حرفه‌ای"}));
   }
   (access.data||[]).forEach(a=>{const f=map.get(String(a.farm_id));if(f)f.connection_status=a.connection_status});
 }
 units=[...map.values()];
 renderUnits();
}
function renderUnits(){
 $("count").textContent=(units.length).toLocaleString("fa-IR")+" واحد";
 const box=$("groups");
 if(!units.length){box.innerHTML='<div class="empty">برای این کاربر واحدی در دسترس نیست.</div>';return}
 const groups=new Map();
 units.forEach(f=>{const key=f.relation||"واحدهای مرتبط";if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f)});
 box.innerHTML=[...groups.entries()].map(([g,rows])=>'<div class="group"><div class="group-title">'+esc(g)+'</div>'+rows.map(f=>{
   const type=farmTypeLabels[String(f.farm_type||"").toLowerCase()]||f.farm_type||"سایر";
   const status=farmStatusLabels[String(f.is_active===false?"inactive":(f.farm_status||"active")).toLowerCase()]||"فعال";
   const loc=[f.province,f.location].filter(Boolean).join(" · ");
   return '<article class="unit"><div class="unit-head"><div class="unit-name">'+esc(f.name||"بدون نام")+'</div><span class="chip">'+esc(type)+'</span></div><div class="unit-meta">'+esc([f.farm_code&&("کد "+f.farm_code),loc,status,f.connection_status&&("ارتباط: "+f.connection_status)].filter(Boolean).join(" · "))+'</div><div class="unit-actions"><button class="btn btn-main" data-farm="'+esc(f.id)+'">مشاهده فرم‌ها و اطلاعات</button></div></article>';
 }).join("")+'</div>').join("");
}
function bind(){
 $("backBtn").onclick=()=>location.href="owner.html";
 $("systemViewBtn").onclick=()=>{if(targetId)location.href="Farms.html?owner_view="+encodeURIComponent(targetId)};
 $("groups").addEventListener("click",e=>{const b=e.target.closest("[data-farm]");if(!b)return;location.href="Farms.html?owner_view="+encodeURIComponent(targetId)+"&farm_view="+encodeURIComponent(b.dataset.farm)});
}
async function init(){
 try{
   const id=new URLSearchParams(location.search).get("user");
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id||"")))throw new Error("شناسه کاربر معتبر نیست.");
   targetId=id;client=getClient();await verifyOwner();await loadTarget();await loadUnits();bind();
 }catch(e){console.error(e);document.querySelector(".main").innerHTML='<section class="card" style="padding:24px;text-align:center;color:#a32626">'+esc(e.message||"خطا در دریافت اطلاعات.")+'<div style="margin-top:12px"><button class="btn btn-main" onclick="location.href=\'owner.html\'">بازگشت</button></div></section>'}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();