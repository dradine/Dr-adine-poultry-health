(function(){
"use strict";

document.addEventListener("DOMContentLoaded", async function(){
    const tbody=document.getElementById("usersTableBody");
    const message=document.getElementById("message");
    const search=document.getElementById("userSearch");
    const roleFilter=document.getElementById("roleFilter");
    const statusFilter=document.getElementById("statusFilter");
    const refresh=document.getElementById("refreshButton");
    const logout=document.getElementById("logoutButton");
    const identity=document.getElementById("ownerIdentity");
    let users=[];

    const roleNames={owner:"مالک",user:"سایر",veterinarian:"دامپزشک",technical_veterinarian:"دامپزشک مسئول فنی",farm_operator:"بهره‌بردار واحد طیور",farm_manager:"مدیر واحد طیور",diagnostic_lab:"آزمایشگاه تشخیص دامپزشکی",poultry_technical_expert:"کارشناس فنی طیور",company_manager:"مدیر / نماینده مجموعه",other:"سایر"};
    const statusNames={pending:"در انتظار تأیید",active:"فعال",suspended:"موقتاً غیرفعال",blocked:"مسدود",removed:"اخراج‌شده"};
    const specialistRoles=new Set(["veterinarian","technical_veterinarian","diagnostic_lab","poultry_technical_expert"]);
    const esc=v=>{const d=document.createElement("div");d.textContent=v??"";return d.innerHTML;};
    const norm=v=>String(v??"").trim().toLowerCase();
    const fmt=v=>v?new Date(v).toLocaleString("fa-IR",{dateStyle:"short",timeStyle:"short"}):"—";
    function show(text,type="success"){message.textContent=text;message.className="message "+type;}
    function roleName(r){return roleNames[norm(r)]||r||"—";}
    function statusBadge(s){const x=norm(s)||"unknown";return `<span class="badge ${esc(x)}">${esc(statusNames[x]||s||"نامشخص")}</span>`;}

    async function getCurrent(){
        const sessionRes=await supabaseClient.auth.getSession();
        if(sessionRes.error||!sessionRes.data.session?.user)return null;
        const u=sessionRes.data.session.user;
        const p=await supabaseClient.from("profiles").select("id,email,full_name,role,status,is_active").eq("id",u.id).maybeSingle();
        if(p.error){throw p.error;}
        if(!p.data){throw new Error("پروفایل مالک پیدا نشد.");}
        const owner=norm(p.data.role)==="owner" && norm(p.data.status)==="active" && p.data.is_active===true;
        if(!owner){window.location.replace("Dashboard.html");return null;}
        return {user:u,profile:p.data};
    }

    async function loadUsers(){
        tbody.innerHTML=`<tr><td colspan="8" class="loading">در حال بارگذاری کاربران...</td></tr>`;
        try{
            const res=await supabaseClient.from("profiles").select("id,email,full_name,phone,role,status,is_active,created_at,updated_at,last_seen_at").order("created_at",{ascending:false});
            if(res.error)throw res.error;
            users=res.data||[];
            render();
            updateStats();
        }catch(e){
            console.error("OWNER LOAD USERS:",e);
            tbody.innerHTML=`<tr><td colspan="8"><div class="error-box"><strong>اطلاعات کاربران بارگذاری نشد.</strong><br>${esc(e.message||"خطای نامشخص")}<br><small>اگر خطا مربوط به RLS یا permission است، Policy مالک جدول profiles باید بررسی شود.</small></div></td></tr>`;
            show("دریافت کاربران با خطا مواجه شد: "+(e.message||"خطای نامشخص"),"error");
        }
    }
    function updateStats(){
        document.getElementById("statTotal").textContent=users.length.toLocaleString("fa-IR");
        document.getElementById("statActive").textContent=users.filter(x=>norm(x.status)==="active"&&x.is_active!==false).length.toLocaleString("fa-IR");
        document.getElementById("statPending").textContent=users.filter(x=>norm(x.status)==="pending").length.toLocaleString("fa-IR");
        document.getElementById("statSpecialists").textContent=users.filter(x=>specialistRoles.has(norm(x.role))).length.toLocaleString("fa-IR");
    }
    function render(){
        const q=norm(search.value);const rf=roleFilter.value;const sf=statusFilter.value;
        const list=users.filter(u=>{
            const text=[u.full_name,u.email,u.phone,u.role].map(norm).join(" ");
            return (!q||text.includes(q))&&(rf==="all"||norm(u.role)===rf)&&(sf==="all"||norm(u.status)===sf);
        });
        if(!list.length){tbody.innerHTML=`<tr><td colspan="8" class="empty">کاربری با این فیلتر پیدا نشد.</td></tr>`;return;}
        tbody.innerHTML=list.map(u=>{
            const isOwner=norm(u.role)==="owner";
            let actions="";
            if(!isOwner){
                if(norm(u.status)!== "active")actions+=`<button class="btn btn-primary" data-id="${esc(u.id)}" data-status="active">فعال‌سازی</button>`;
                if(norm(u.status)!== "suspended")actions+=`<button class="btn" data-id="${esc(u.id)}" data-status="suspended">تعلیق</button>`;
                if(norm(u.status)!== "blocked")actions+=`<button class="btn btn-danger" data-id="${esc(u.id)}" data-status="blocked">مسدود</button>`;
            }else actions="<span class=\"badge owner\">مالک</span>";
            return `<tr><td><span class="user-name">${esc(u.full_name||"—")}</span><span class="muted">${esc(u.id)}</span></td><td dir="ltr">${esc(u.email||"—")}</td><td dir="ltr">${esc(u.phone||"—")}</td><td>${esc(roleName(u.role))}</td><td>${statusBadge(u.status)}</td><td>${fmt(u.created_at)}</td><td>${fmt(u.last_seen_at||u.updated_at)}</td><td><div class="actions">${actions}</div></td></tr>`;
        }).join("");
    }
    tbody.addEventListener("click",async e=>{
        const b=e.target.closest("button[data-status]");if(!b)return;
        const id=b.dataset.id,status=b.dataset.status;
        const u=users.find(x=>x.id===id);if(!u)return;
        const text=status==="active"?"این کاربر فعال شود؟":status==="suspended"?"دسترسی این کاربر موقتاً غیرفعال شود؟":"این کاربر مسدود شود؟";
        if(!confirm(text))return;
        b.disabled=true;
        try{
            const r=await supabaseClient.rpc("owner_set_user_status",{target_user_id:id,new_status:status});
            if(r.error)throw r.error;
            show("وضعیت کاربر با موفقیت تغییر کرد.","success");
            await loadUsers();
        }catch(e){show(e.message||"تغییر وضعیت انجام نشد.","error");}finally{b.disabled=false;}
    });
    [search,roleFilter,statusFilter].forEach(x=>x.addEventListener("input",render));
    refresh.addEventListener("click",loadUsers);
    logout.addEventListener("click",()=>AdineAuth.signOut());
    try{
        const auth=await getCurrent();if(!auth)return;
        identity.textContent=`مالک سامانه: ${auth.profile.full_name||auth.user.email} — دسترسی کامل مدیریت کاربران فعال است.`;
        await loadUsers();
        setInterval(loadUsers,30000);
    }catch(e){console.error(e);show(e.message||"خطا در بررسی دسترسی مالک.","error");tbody.innerHTML=`<tr><td colspan="8"><div class="error-box">${esc(e.message||"دسترسی مالک تأیید نشد.")}</div></td></tr>`;}
});
})();
