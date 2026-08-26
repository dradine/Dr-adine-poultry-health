(function () {
  "use strict";
  try {
    let meta=document.querySelector('meta[name="viewport"]');
    if(!meta){meta=document.createElement("meta");meta.name="viewport";(document.head||document.documentElement).appendChild(meta);}
    meta.setAttribute("content","width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
    if(!document.getElementById("adine-global-no-zoom-style")){const s=document.createElement("style");s.id="adine-global-no-zoom-style";s.textContent='html{-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important}input,select,textarea,button{touch-action:manipulation}input,select,textarea{font-size:16px!important}';(document.head||document.documentElement).appendChild(s);}
  }catch(e){console.warn("Adine global no-zoom guard:",e);}
  const CACHE="adine_profile_cache_v2", TTL=60000; let profilePromise=null;
  const norm=v=>String(v||"").trim().toLowerCase();
  const cached=id=>{try{const x=JSON.parse(sessionStorage.getItem(CACHE)||"null");return x&&x.userId===id&&x.profile&&Date.now()-x.ts<TTL?x.profile:null;}catch(_){return null;}};
  const cache=(id,p)=>{try{sessionStorage.setItem(CACHE,JSON.stringify({userId:id,ts:Date.now(),profile:p}));}catch(_) {}};
  const clear=()=>{try{sessionStorage.removeItem(CACHE);}catch(_) {}};
  const timeout=async(p,ms)=>{let t;try{return await Promise.race([p,new Promise((_,r)=>t=setTimeout(()=>r(new Error("AUTH_TIMEOUT")),ms))]);}finally{clearTimeout(t);}};
  window.AdineAuth={
    async getUser(){try{const r=await supabaseClient.auth.getSession();if(!r.error&&r.data?.session?.user)return r.data.session.user;const f=await supabaseClient.auth.getUser();return f.data?.user||null;}catch(e){console.warn("getUser:",e);return null;}},
    async getSession(){try{const r=await supabaseClient.auth.getSession();return r.error?null:r.data?.session||null;}catch(e){console.warn("getSession:",e);return null;}},
    async getProfile(id=null,opt={}){const u=id?{id}:await this.getUser();if(!u?.id)return null;const c=!opt.force&&cached(u.id);if(c)return c;if(profilePromise&&!opt.force)return profilePromise;profilePromise=(async()=>{const a=supabaseClient.from("profiles").select("id,full_name,email,phone,role,status,is_active,approved_at,approved_by,last_seen_at,created_at,updated_at").eq("id",u.id).maybeSingle();const b=supabaseClient.from("professional_profiles").select("user_type,activity_types,organization_name,license_number,province,city,specialty,notes,is_verified").eq("user_id",u.id).maybeSingle();const [p,pro]=await timeout(Promise.all([a,b]),7000);if(p.error)throw p.error;if(!p.data)return null;const out=pro.data?{...p.data,...pro.data,user_type:pro.data.user_type||null}:p.data;cache(u.id,out);return out;})().finally(()=>{profilePromise=null;});try{return await profilePromise;}catch(e){console.warn("profile temporarily unavailable:",e);return null;}},
    async signOut(){clear();try{await supabaseClient.auth.signOut();}catch(e){console.warn("signOut:",e);}window.location.replace("login.html");},
    isActiveProfile(p){if(!p)return false;const s=norm(p.status),a=norm(p.access_status),r=norm(p.role);if(["blocked","suspended","removed"].includes(s)||["blocked","suspended","removed"].includes(a))return false;return s==="active"||a==="approved"||r==="owner"||r==="admin";},
    getAccessMessage(p){if(!p)return "اطلاعات حساب در حال دریافت است؛ لطفاً دوباره تلاش کنید.";const s=norm(p.status),a=norm(p.access_status);if(s==="pending"||a==="pending")return "ثبت‌نام شما انجام شده و در انتظار تأیید مالک سامانه است.";if(s==="suspended"||a==="suspended")return "دسترسی حساب شما موقتاً غیرفعال شده است.";if(s==="blocked"||a==="blocked")return "حساب شما مسدود شده است.";if(s==="removed"||a==="removed")return "دسترسی شما به سامانه لغو شده است.";return "دسترسی حساب شما فعال نیست.";},
    async requireAuth(){const s=await this.getSession();if(!s?.user){window.location.replace("login.html");return null;}const u=s.user;let p=await this.getProfile(u.id);if(!p)p=cached(u.id);if(!p)p=await this.getProfile(u.id,{force:true});if(!p){window.dispatchEvent(new CustomEvent("adine-auth-profile-unavailable",{detail:{userId:u.id}}));return null;}if(!this.isActiveProfile(p)){const m=this.getAccessMessage(p);clear();try{await supabaseClient.auth.signOut();}catch(_){}window.location.replace("login.html?message="+encodeURIComponent(m));return null;}return {user:u,profile:p};},
    async requireOwner(){const a=await this.requireAuth();if(!a)return null;if(norm(a.profile.role)!=="owner"){window.location.replace("Dashboard.html");return null;}return a;}
  };
  // Dashboard-only medium mobile stylesheet. Loaded here so Dashboard.html needs no structural change.
  try{if(document.body?.classList.contains("dashboard-page")&&!document.getElementById("adine-dashboard-compact-css")){const l=document.createElement("link");l.id="adine-dashboard-compact-css";l.rel="stylesheet";l.href="dashboard-compact.css?v=2";(document.head||document.documentElement).appendChild(l);}}catch(e){console.warn("Dashboard compact CSS:",e);}
})();