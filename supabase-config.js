/* ADINE POULTRY HEALTH CENTER - SUPABASE CONFIG */
const SUPABASE_URL = "https://vzcczkavlopznljnnehp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4jMgvqKI__-MsmMQtEiCig_M9WjhvN9";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce"
  }
});

async function getCurrentUser() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (!error && data?.session?.user) return data.session.user;
    const fallback = await supabaseClient.auth.getUser();
    return fallback.data?.user || null;
  } catch (error) { console.warn("getCurrentUser:", error); return null; }
}

async function getCurrentProfile(userId = null) {
  const user = userId ? { id: userId } : await getCurrentUser();
  if (!user?.id) return null;
  try {
    const { data, error } = await supabaseClient.from("profiles")
      .select("id,full_name,email,phone,role,status,is_active,approved_at,approved_by,last_seen_at,created_at,updated_at")
      .eq("id", user.id).maybeSingle();
    if (error) { console.warn("getCurrentProfile:", error); return null; }
    return data || null;
  } catch (error) { console.warn("getCurrentProfile exception:", error); return null; }
}

function checkProfileAccess(profile) {
  if (!profile) return false;
  const status = String(profile.status || "").trim().toLowerCase();
  const accessStatus = String(profile.access_status || "").trim().toLowerCase();
  const role = String(profile.role || "").trim().toLowerCase();
  if (["blocked", "suspended", "removed"].includes(status) || ["blocked", "suspended", "removed"].includes(accessStatus)) return false;
  return status === "active" || accessStatus === "approved" || role === "owner" || role === "admin";
}

async function checkUserAccess() {
  const user = await getCurrentUser();
  if (!user) return { authenticated:false, allowed:false, user:null, profile:null, error:null };
  const profile = await getCurrentProfile(user.id);
  if (!profile) return { authenticated:true, allowed:false, user, profile:null, error:"PROFILE_NOT_FOUND_OR_UNAVAILABLE" };
  return { authenticated:true, allowed:checkProfileAccess(profile), user, profile, error:null };
}

async function logoutUser() {
  try { await supabaseClient.auth.signOut(); } catch (error) { console.warn("logoutUser:", error); }
  window.location.replace("login.html");
  return true;
}

if (supabaseClient?.auth) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    window.dispatchEvent(new CustomEvent("adine-auth-state-change", { detail:{ event, session } }));
  });
}

/* Flock baseline compatibility remains intentionally isolated in flocks.js. */
