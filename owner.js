/* =========================================================
   ADINEH OWNER MANAGEMENT — FINAL STABLE
========================================================= */
(function () {
    "use strict";

    let allUsers = [];
    let loading = false;
    let bound = false;

    const $ = id => document.getElementById(id);

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function esc(v) {
        if (v == null) return "";
        const d = document.createElement("div");
        d.textContent = String(v);
        return d.innerHTML;
    }

    function msg(text, type = "info") {
        const el = $("message");
        if (!el) return;
        el.textContent = text || "";
        el.className = "message " + type;
        el.classList.remove("hidden");
    }

    function clearMsg() {
        const el = $("message");
        if (!el) return;
        el.textContent = "";
        el.className = "message hidden";
    }

    function dateText(v) {
        if (!v) return "—";
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return "—";
        try { return d.toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" }); }
        catch (_) { return d.toLocaleString("fa-IR"); }
    }

    function roleText(v) {
        return ({ owner:"مالک سامانه", admin:"مدیر سامانه", user:"کاربر" })[v] || v || "—";
    }

    function typeText(v) {
        return ({
            veterinarian:"🩺 دامپزشک",
            technical_veterinarian:"🩺 دامپزشک مسئول فنی",
            poultry_operator:"🐔 بهره‌بردار واحد طیور",
            farm_operator:"🐔 بهره‌بردار واحد طیور",
            poultry_manager:"👨‍💼 مدیر واحد طیور",
            farm_manager:"👨‍💼 مدیر واحد طیور",
            veterinary_lab:"🔬 آزمایشگاه تشخیص دامپزشکی",
            diagnostic_lab:"🔬 آزمایشگاه تشخیص دامپزشکی",
            poultry_technical_expert:"📊 کارشناس فنی طیور",
            organization_manager:"🏢 مدیر / نماینده مجموعه",
            company_manager:"🏢 مدیر / نماینده مجموعه",
            other:"سایر"
        })[v] || v || "ثبت نشده";
    }

    function statusText(v) {
        return ({ pending:"در انتظار تأیید", active:"فعال", suspended:"موقتاً غیرفعال", blocked:"مسدود", removed:"بایگانی / حذف‌شده" })[v] || v || "نامشخص";
    }

    function activityText(v) {
        if (!v) return "—";
        let a = v;
        if (typeof v === "string") { try { a = JSON.parse(v); } catch (_) { return esc(v); } }
        if (!Array.isArray(a)) return esc(a);
        const map = {broiler:"گوشتی",layer:"تخم‌گذار",breeder:"مادر",pullet:"پولت",hatchery:"جوجه‌کشی",other:"سایر"};
        return a.length ? a.map(x => esc(map[x] || x)).join("، ") : "—";
    }

    function isSpecialist(u) {
        return ["veterinarian","technical_veterinarian","veterinary_lab","diagnostic_lab","poultry_technical_expert"].includes(u.user_type);
    }

    function normalize(r) {
        return {
            id:r.id || r.user_id,
            user_id:r.user_id || r.id,
            email:r.email || "",
            full_name:r.full_name || "",
            phone:r.phone || "",
            role:r.role || "user",
            status:r.status || "pending",
            is_active:r.is_active,
            created_at:r.created_at,
            updated_at:r.updated_at,
            last_seen_at:r.last_seen_at,
            user_type:r.user_type || r.profile_user_type || null,
            activity_types:r.activity_types || [],
            organization_name:r.organization_name || null,
            license_number:r.license_number || null,
            province:r.province || null,
            city:r.city || null,
            specialty:r.specialty || null,
            notes:r.notes || null,
            is_verified:r.is_verified === true,
            access_code:r.access_code || r.professional_code || null,
            professional_code:r.professional_code || r.access_code || null,
            professional_code_active:r.professional_code_active ?? r.code_is_active ?? r.is_active_code ?? false,
            code_created_at:r.code_created_at || null,
            code_updated_at:r.code_updated_at || null
        };
    }

    async function getClient() {
        for (let i=0;i<60;i++) {
            if (window.supabaseClient && window.supabaseClient.auth) return window.supabaseClient;
            try { if (typeof supabaseClient !== "undefined" && supabaseClient?.auth) return supabaseClient; } catch (_) {}
            await sleep(150);
        }
        throw new Error("اتصال Supabase آماده نشد.");
    }

    async function getSession(client) {
        for (let i=0;i<20;i++) {
            const {data,error} = await client.auth.getSession();
            if (error) throw error;
            if (data?.session?.user) return data.session.user;
            await sleep(250);
        }
        throw new Error("جلسه ورود پیدا نشد. ابتدا وارد سامانه شوید و سپس صفحه مدیریت را باز کنید.");
    }

    async function verifyOwner(client, authUser) {
        const {data,error} = await client.from("profiles")
            .select("id,email,full_name,phone,role,status,is_active")
            .eq("id",authUser.id).maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("پروفایل مالک برای حساب واردشده پیدا نشد.");
        if (data.role !== "owner" || data.status !== "active" || data.is_active !== true)
            throw new Error("این حساب به عنوان مالک فعال سامانه شناخته نشد.");
        const identity=$("ownerIdentity");
        if(identity) identity.textContent=`مالک: ${data.full_name || "دکتر ادینه"} | ${data.email || authUser.email || "—"}`;
        return data;
    }

    async function rpcUsers(client) {
        const {data,error}=await client.rpc("owner_get_user_directory");
        if(error) throw error;
        if(!Array.isArray(data)) return [];
        return data.map(normalize).filter(x=>x.id);
    }

    async function tableUsers(client) {
        const {data:profiles,error}=await client.from("profiles")
            .select("id,email,full_name,phone,role,status,is_active,created_at,updated_at,last_seen_at")
            .order("created_at",{ascending:false});
        if(error) throw error;
        const rows=profiles||[];
        const ids=rows.map(x=>x.id).filter(Boolean);
        const profMap=new Map(), codeMap=new Map();
        if(ids.length){
            const p=await client.from("professional_profiles")
                .select("user_id,user_type,activity_types,organization_name,license_number,province,city,specialty,notes,is_verified").in("user_id",ids);
            const c=await client.from("professional_access_codes")
                .select("user_id,access_code,is_active,created_at,updated_at").in("user_id",ids);
            if(!p.error)(p.data||[]).forEach(x=>profMap.set(x.user_id,x));
            if(!c.error)(c.data||[]).forEach(x=>codeMap.set(x.user_id,x));
        }
        return rows.map(x=>normalize({...x,...(profMap.get(x.id)||{}),...(codeMap.get(x.id)||{})}));
    }

    async function loadUsers() {
        if(loading) return;
        loading=true;
        const tbody=$("usersTableBody");
        if(tbody) tbody.innerHTML='<tr><td colspan="8" class="loading-cell">در حال دریافت اطلاعات کاربران...</td></tr>';
        try {
            const client=await getClient();
            const authUser=await getSession(client);
            await verifyOwner(client,authUser);
            let users=[];
            let rpcError=null;
            try { users=await rpcUsers(client); }
            catch(e){ rpcError=e; console.warn("owner_get_user_directory failed",e); }
            if(!users.length) {
                try { users=await tableUsers(client); }
                catch(e){
                    const a=rpcError?.message||"RPC ناموفق";
                    throw new Error(a+" | دریافت مستقیم جداول: "+(e?.message||e));
                }
            }
            allUsers=users;
            renderUsers();
            clearMsg();
            msg(`اطلاعات ${allUsers.length.toLocaleString("fa-IR")} کاربر بارگذاری شد.`,"success");
        } catch(e){
            console.error("OWNER LOAD ERROR",e);
            allUsers=[]; updateStats([]);
            if(tbody) tbody.innerHTML=`<tr><td colspan="8" class="error-cell"><strong>اطلاعات کاربران لود نشد</strong><br><small>${esc(e?.message||"خطای نامشخص")}</small></td></tr>`;
            msg(e?.message||"خطا در دریافت اطلاعات کاربران.","error");
        } finally { loading=false; }
    }

    function updateStats(users){
        const set=(id,n)=>{const e=$(id);if(e)e.textContent=Number(n||0).toLocaleString("fa-IR");};
        set("statTotal",users.length);
        set("statActive",users.filter(x=>x.status==="active"&&x.is_active!==false).length);
        set("statPending",users.filter(x=>x.status==="pending").length);
        set("statSpecialists",users.filter(isSpecialist).length);
    }

    function filtered(){
        const q=String($("userSearch")?.value||"").trim().toLowerCase();
        const t=$("roleFilter")?.value||"";
        const s=$("statusFilter")?.value||"";
        return allUsers.filter(u=>{
            const hay=[u.full_name,u.email,u.phone,u.user_type,u.organization_name,u.access_code,u.license_number,u.province,u.city,u.specialty].join(" ").toLowerCase();
            return (!q||hay.includes(q))&&(!t||u.user_type===t)&&(!s||u.status===s);
        });
    }

    function renderUsers(){
        const tbody=$("usersTableBody"); if(!tbody)return;
        updateStats(allUsers);
        const users=filtered();
        if(!users.length){tbody.innerHTML='<tr><td colspan="8" class="empty-cell">کاربری مطابق فیلترها پیدا نشد.</td></tr>';return;}
        tbody.innerHTML=users.map(u=>`<tr>
<td><div class="user-name">${esc(u.full_name||"بدون نام")}</div><div class="user-sub">${esc(roleText(u.role))}</div></td>
<td><div>${esc(u.email||"—")}</div><div class="user-sub" dir="ltr">${esc(u.phone||"شماره ثبت نشده")}</div></td>
<td><span class="role-badge">${esc(typeText(u.user_type))}</span><div class="user-sub">${activityText(u.activity_types)}</div></td>
<td>${isSpecialist(u)&&u.access_code?`<span class="access-code" data-code="${esc(u.access_code)}">••••</span><button class="code-toggle" data-action="toggle-code" data-id="${esc(u.id)}">نمایش</button>`:`<span class="muted">${isSpecialist(u)?"ثبت نشده":"—"}</span>`}</td>
<td><span class="status-badge status-${esc(u.status)}">${esc(statusText(u.status))}</span></td>
<td>${dateText(u.created_at)}</td><td>${dateText(u.last_seen_at||u.updated_at)}</td>
<td><button type="button" class="action-button action-details" data-action="details" data-id="${esc(u.id)}">جزئیات</button></td>
</tr>`).join("");
    }

    function details(u){
        const old=$("ownerDetailsModal"); if(old)old.remove();
        const m=document.createElement("div"); m.id="ownerDetailsModal"; m.className="owner-modal-backdrop";
        m.innerHTML=`<div class="owner-modal"><div class="owner-modal-head"><div><h3>جزئیات کامل کاربر</h3><p>${esc(u.full_name||"—")}</p></div><button class="modal-close" data-close>×</button></div><div class="detail-grid">
<div><span>نام</span><strong>${esc(u.full_name||"—")}</strong></div><div><span>ایمیل</span><strong dir="ltr">${esc(u.email||"—")}</strong></div><div><span>شماره تماس</span><strong dir="ltr">${esc(u.phone||"ثبت نشده")}</strong></div><div><span>نقش سامانه</span><strong>${esc(roleText(u.role))}</strong></div>
<div><span>نوع کاربری</span><strong>${esc(typeText(u.user_type))}</strong></div><div><span>کد حرفه‌ای</span><strong class="modal-code">${esc(u.access_code||"ثبت نشده")}</strong></div><div class="detail-wide"><span>نوع فعالیت</span><strong>${activityText(u.activity_types)}</strong></div>
<div><span>مجموعه</span><strong>${esc(u.organization_name||"—")}</strong></div><div><span>شماره پروانه</span><strong>${esc(u.license_number||"—")}</strong></div><div><span>استان</span><strong>${esc(u.province||"—")}</strong></div><div><span>شهر</span><strong>${esc(u.city||"—")}</strong></div><div><span>تخصص</span><strong>${esc(u.specialty||"—")}</strong></div><div><span>تأیید حرفه‌ای</span><strong>${u.is_verified?"تأیید شده":"تأیید نشده"}</strong></div><div><span>وضعیت</span><strong>${esc(statusText(u.status))}</strong></div><div><span>فعال</span><strong>${u.is_active===true?"بله":"خیر"}</strong></div><div><span>ثبت‌نام</span><strong>${dateText(u.created_at)}</strong></div><div><span>آخرین فعالیت</span><strong>${dateText(u.last_seen_at||u.updated_at)}</strong></div><div><span>ایجاد کد</span><strong>${dateText(u.code_created_at)}</strong></div><div><span>آخرین تغییر کد</span><strong>${dateText(u.code_updated_at)}</strong></div><div class="detail-wide"><span>یادداشت</span><strong>${esc(u.notes||"—")}</strong></div>
</div><div class="owner-modal-foot"><button class="action-button action-active" data-close>بستن</button></div></div>`;
        document.body.appendChild(m);
        m.addEventListener("click",e=>{if(e.target===m||e.target.closest("[data-close]"))m.remove();});
    }

    function bind(){
        if(bound)return; bound=true;
        $("usersTableBody")?.addEventListener("click",e=>{
            const b=e.target.closest("button[data-action]");if(!b)return;
            const u=allUsers.find(x=>String(x.id)===String(b.dataset.id));if(!u)return;
            if(b.dataset.action==="details")details(u);
            if(b.dataset.action==="toggle-code"){
                const c=b.parentElement?.querySelector(".access-code");if(!c)return;
                const hidden=c.textContent==="••••";c.textContent=hidden?c.dataset.code:"••••";b.textContent=hidden?"مخفی":"نمایش";
            }
        });
        $("userSearch")?.addEventListener("input",renderUsers);
        $("roleFilter")?.addEventListener("change",renderUsers);
        $("statusFilter")?.addEventListener("change",renderUsers);
        $("refreshUsers")?.addEventListener("click",loadUsers);
        $("logoutButton")?.addEventListener("click",async()=>{
            const b=$("logoutButton");if(b)b.disabled=true;
            try{const c=await getClient(); if(window.AdineAuth?.signOut)await window.AdineAuth.signOut();else await c.auth.signOut();}
            catch(e){console.error(e);if(b)b.disabled=false;}
        });
    }

    async function init(){
        try{await getClient();bind();await loadUsers();}
        catch(e){console.error("OWNER INIT",e);msg(e?.message||"خطا در راه‌اندازی پنل مالک","error");}
    }

    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
