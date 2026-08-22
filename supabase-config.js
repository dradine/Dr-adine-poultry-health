/* =========================================================
   ADINE POULTRY HEALTH CENTER
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
    "https://vzcczkavlopznljnnehp.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_4jMgvqKI__-MsmMQtEiCig_M9WjhvN9";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: "implicit"
            }
        }
    );

/* ---------------------------------------------------------
   CURRENT USER
   Session-first is intentional: getUser() may require a
   network request, while getSession() can restore the local
   session immediately on iPhone/PWA.
--------------------------------------------------------- */

async function getCurrentUser() {

    try {

        const {
            data: sessionData,
            error: sessionError
        } = await supabaseClient.auth.getSession();

        if (!sessionError && sessionData?.session?.user) {
            return sessionData.session.user;
        }

        const {
            data,
            error
        } = await supabaseClient.auth.getUser();

        if (error) {
            console.error("Supabase user error:", error);
            return null;
        }

        return data?.user || null;

    } catch (error) {

        console.error("getCurrentUser:", error);
        return null;

    }

}


/* ---------------------------------------------------------
   CURRENT PROFILE
--------------------------------------------------------- */

async function getCurrentProfile(userId = null) {

    const user =
        userId
            ? { id: userId }
            : await getCurrentUser();

    if (!user?.id) {
        return null;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (error) {
            console.error("Profile error:", error);
            return null;
        }

        return data || null;

    } catch (error) {

        console.error("getCurrentProfile:", error);
        return null;

    }

}


/* ---------------------------------------------------------
   ACCESS
   Keep the existing access rules, but make them consistent
   with AdineAuth so login and dashboard cannot disagree.
--------------------------------------------------------- */

function checkProfileAccess(profile) {

    if (!profile) {
        return false;
    }

    const status =
        String(profile.status || "")
            .trim()
            .toLowerCase();

    const accessStatus =
        String(profile.access_status || "")
            .trim()
            .toLowerCase();

    const role =
        String(profile.role || "")
            .trim()
            .toLowerCase();

    const blocked =
        ["blocked", "suspended", "removed"].includes(status) ||
        ["blocked", "suspended", "removed"].includes(accessStatus);

    if (blocked) {
        return false;
    }

    return (
        status === "active" ||
        accessStatus === "approved" ||
        role === "owner" ||
        role === "admin"
    );

}


async function checkUserAccess() {

    const user =
        await getCurrentUser();

    if (!user) {

        return {
            authenticated: false,
            allowed: false,
            user: null,
            profile: null,
            error: null
        };

    }

    const profile =
        await getCurrentProfile(user.id);

    if (!profile) {

        return {
            authenticated: true,
            allowed: false,
            user,
            profile: null,
            error: "PROFILE_NOT_FOUND"
        };

    }

    return {

        authenticated: true,

        allowed:
            checkProfileAccess(profile),

        user,

        profile,

        error: null

    };

}


/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */

async function logoutUser() {

    try {

        const {
            error
        } = await supabaseClient
            .auth
            .signOut();

        if (error) {
            console.error("Logout error:", error);
        }

    } catch (error) {

        console.error("Logout exception:", error);

    }

    window.location.replace("login.html");

    return true;

}


/* ---------------------------------------------------------
   Keep auth state synchronized when Supabase refreshes a
   session in the background.
--------------------------------------------------------- */

if (
    typeof supabaseClient !== "undefined" &&
    supabaseClient.auth
) {

    supabaseClient.auth.onAuthStateChange(
        function (event, session) {

            window.dispatchEvent(
                new CustomEvent(
                    "adine-auth-state-change",
                    {
                        detail: {
                            event,
                            session
                        }
                    }
                )
            );

        }
    );

}
