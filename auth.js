(function () {
  "use strict";
  try {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "viewport"; (document.head || document.documentElement).appendChild(meta); }
    meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
    if (!document.getElementById("adine-global-no-zoom-style")) {
      const style = document.createElement("style"); style.id = "adine-global-no-zoom-style";
      style.textContent = 'html{-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important}input,select,textarea,button{touch-action:manipulation}input,select,textarea{font-size:16px!important}';
      (document.head || document.documentElement).appendChild(style);
    }
  } catch (e) { console.warn("Adine global no-zoom guard:", e); }
  const PROFILE_CACHE_KEY = "adine_profile_cache_v2";
  const PROFILE_CACHE_TTL = 60 * 1000;
  let profilePromise = null;
  function normalize(value) { return String(value || "").trim().toLowerCase(); }
  function readCachedProfile(userId) { try { const raw = sessionStorage.getItem(PROFILE_CACHE_KEY); if (!raw) return null; const item = JSON.parse(raw); if (item.userId !== userId || !item.profile || Date.now() - Number(item.ts || 0) > PROFILE_CACHE_TTL) return null; return item.profile; } catch (_) { return null; } }
  function writeCachedProfile(userId, profile) { try { sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ userId, ts: Date.now(), profile })); } catch (_) {} }
  function clearCachedProfile() { try { sessionStorage.removeItem(PROFILE_CACHE_KEY); } catch (_) {} }
  async function withTimeout(promise, ms) { let timer; try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("PROFILE_REQUEST_TIMEOUT")), ms); })]); } finally { clearTimeout(timer); } }
  window.AdineAuth = {
    async getUser() { try { const { data, error } = await supabaseClient.auth.getSession(); if (!error && data?.session?.user) return data.session.user; const fallback = await supabaseClient.auth.getUser(); if (fallback.error) console.warn("getUser:", fallback.error); return fallback.data?.user || null; } catch (error) { console.warn("getUser exception:", error); return null; } },
    async getSession() { try { const { data, error } = await supabaseClient.auth.getSession(); if (error) { console.warn("getSession:", error); return null; } return data?.session || null; } catch (error) { console.warn("getSession exception:", error); return null; } },
    async getProfile(userId = null, options = {}) {
      const user = userId ? { id: userId } : await this.getUser();
      if (!user?.id) return null;
      const cached = !options.force ? readCachedProfile(user.id) : null;
      if (cached) return cached;
      if (profilePromise && !options.force) return profilePromise;
      profilePromise = (async () => {
        const profileQuery = supabaseClient.from("profiles").select("id,full_name,email,phone,role,status,is_active,approved_at,approved_by,last_seen_at,created_at,updated_at").eq("id", user.id).maybeSingle();
        const professionalQuery = supabaseClient.from("professional_profiles").select("user_type,activity_types,organization_name,license_number,province,city,specialty,notes,is_verified").eq("user_id", user.id).maybeSingle();
        const results = await withTimeout(Promise.all([profileQuery, professionalQuery]), 7000);
        if (results[0].error) throw results[0].error;
        if (!results[0].data) return null;
        const profile = results[1].data ? { ...results[0].data, ...results[1].data, user_type: results[1].data.user_type || null } : results[0].data;
        writeCachedProfile(user.id, profile);
        return profile;
      })().finally(() => { profilePromise = null; });
      try { return await profilePromise; } catch (error) { console.warn("getProfile transient failure:", error); return null; }
    },
    async signOut() { clearCachedProfile(); try { await supabaseClient.auth.signOut(); } catch (error) { console.warn("signOut:", error); } window.location.replace("login.html"); },
    isActiveProfile(profile) { if (!profile) return false; const status = normalize(profile.status), accessStatus = normalize(profile.access_status), role = normalize(profile.role); if (["blocked", "suspended", "removed"].includes(status) || ["blocked", "suspended", "removed"].includes(accessStatus)) return false; return status === "active" || accessStatus === "approved" || role === "owner" || role === "admin"; },
    getAccessMessage(profile) { if (!profile) return "اطلاعات حساب در حال دریافت است؛ لطفاً دوباره تلاش کنید."; const status = normalize(profile.status), accessStatus = normalize(profile.access_status); if (status === "pending" || accessStatus === "pending") return "ثبت‌نام شما انجام شده و در انتظار تأیید مالک سامانه است."; if (status === "suspended" || accessStatus === "suspended") return "دسترسی حساب شما موقتاً غیرفعال شده است."; if (status === "blocked" || accessStatus === "blocked") return "حساب شما مسدود شده است."; if (status === "removed" || accessStatus === "removed") return "دسترسی شما به سامانه لغو شده است."; return "دسترسی حساب شما فعال نیست."; },
    async requireAuth() {
      const session = await this.getSession();
      if (!session?.user) { window.location.replace("login.html"); return null; }
      const user = session.user;
      let profile = await this.getProfile(user.id);
      if (!profile) profile = readCachedProfile(user.id);
      if (!profile) profile = await this.getProfile(user.id, { force: true });
      if (!profile) { window.dispatchEvent(new CustomEvent("adine-auth-profile-unavailable", { detail: { userId: user.id } })); return null; }
      if (!this.isActiveProfile(profile)) { const message = this.getAccessMessage(profile); clearCachedProfile(); await supabaseClient.auth.signOut(); window.location.replace("login.html?message=" + encodeURIComponent(message)); return null; }
      try { const activityPromise = supabaseClient.rpc("update_my_activity"); await Promise.race([activityPromise, new Promise(resolve => setTimeout(resolve, 1200))]); } catch (error) { console.warn("update_my_activity non-blocking:", error); }
      return { user, profile };
    },
    async requireOwner() { const auth = await this.requireAuth(); if (!auth) return null; if (normalize(auth.profile.role) !== "owner") { window.location.replace("Dashboard.html"); return null; } return auth; }
  };
})();
