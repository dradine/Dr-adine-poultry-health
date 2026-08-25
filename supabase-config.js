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


/* =========================================================
   FLOCK / HOUSE BASELINE UI COMPATIBILITY
   Only active on flocks.html. It supplies the fields required
   by the database baseline validator without touching any
   calculation engine or other pages.
========================================================= */
(function setupFlockBaselineCompatibility(){

    const page = String(window.location.pathname || "").toLowerCase().split("/").pop();
    if (page !== "flocks.html") return;

    function numberValue(id){
        const el = document.getElementById(id);
        if (!el) return null;
        const value = String(el.value ?? "")
            .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776))
            .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632))
            .replace(/[٬،,]/g, "")
            .trim();
        if (!value) return null;
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    function addField(parent, id, label, placeholder, options = {}){
        if (document.getElementById(id)) return document.getElementById(id);
        const wrap = document.createElement("div");
        wrap.className = "form-group";
        if (options.full) wrap.classList.add("full");
        const labelEl = document.createElement("label");
        labelEl.htmlFor = id;
        labelEl.textContent = label + (options.required ? " *" : "");
        const input = document.createElement("input");
        input.id = id;
        input.type = options.type || "text";
        input.inputMode = options.inputmode || "decimal";
        input.autocomplete = "off";
        input.placeholder = placeholder || "";
        if (options.required) input.required = true;
        wrap.append(labelEl, input);
        parent.appendChild(wrap);
        return input;
    }

    function injectFields(){
        const houseForm = document.getElementById("houseForm");
        const flockForm = document.getElementById("flockForm");
        if (!houseForm || !flockForm) return;

        const houseGrid = houseForm.querySelector(".form-grid");
        if (houseGrid) {
            const field = addField(
                houseGrid,
                "houseInitialBirdCount",
                "تعداد اولیه جوجه / مرغ سالن",
                "مثلاً ۵۰۰۰۰",
                {required:true,inputmode:"numeric"}
            );
            field.addEventListener("input", function(){
                const bird = document.getElementById("birdCount");
                if (bird && !bird.value) bird.value = field.value;
            });
        }

        const flockGrid = flockForm.querySelector(".form-grid");
        if (!flockGrid) return;

        addField(
            flockGrid,
            "initialAverageWeightG",
            "میانگین وزن اولیه (گرم)",
            "مثلاً ۴۵ گرم",
            {required:true,inputmode:"decimal"}
        );

        addField(
            flockGrid,
            "productionStartDate",
            "تاریخ شروع تولید / انتقال به سالن تولید",
            "YYYY-MM-DD",
            {type:"date",inputmode:"numeric"}
        );

        addField(
            flockGrid,
            "productionStartAgeDays",
            "سن گله هنگام شروع تولید (روز)",
            "مثلاً ۱۱۰",
            {inputmode:"numeric"}
        );

        addField(
            flockGrid,
            "productionBaselineBirdCount",
            "تعداد پرنده در شروع تولید",
            "مثلاً ۴۸۰۰۰",
            {inputmode:"numeric"}
        );

        addField(
            flockGrid,
            "productionBaselineWeightG",
            "میانگین وزن در شروع تولید (گرم)",
            "مثلاً ۱۵۵۰",
            {inputmode:"decimal"}
        );

        const type = document.getElementById("productionType");
        const avg = document.getElementById("initialAverageWeightG");
        const prodFields = [
            "productionStartDate",
            "productionStartAgeDays",
            "productionBaselineBirdCount",
            "productionBaselineWeightG"
        ].map(id => document.getElementById(id)).filter(Boolean);

        function refreshRequirements(){
            const value = String(type?.value || "").toLowerCase();
            const broilerLike = ["broiler","pullet","گوشتی","پولت"].includes(value);
            const layerLike = ["layer","breeder","تخمگذار","مادر"].includes(value);
            if (avg) avg.required = broilerLike;
            prodFields.forEach(el => { el.required = layerLike; });
            prodFields.forEach(el => {
                const wrap = el.closest(".form-group");
                if (wrap) wrap.style.display = layerLike ? "" : "none";
            });
        }
        type?.addEventListener("change", refreshRequirements);
        refreshRequirements();

        document.getElementById("flockHouse")?.addEventListener("change", function(){
            const house = Array.isArray(window.houses)
                ? window.houses.find(h => String(h.id) === String(this.value))
                : null;
            const count = document.getElementById("birdCount");
            if (house?.initial_bird_count && count && !count.value) {
                count.value = Number(house.initial_bird_count).toLocaleString("fa-IR");
            }
        });
    }

    function isoDateOrNull(id){
        const value = document.getElementById(id)?.value?.trim();
        return value || null;
    }

    const originalFrom = supabaseClient.from.bind(supabaseClient);
    supabaseClient.from = function(table){
        const query = originalFrom(table);
        if (table !== "flocks" && table !== "houses") return query;
        const originalInsert = query.insert.bind(query);
        query.insert = function(values, options){
            const rows = Array.isArray(values) ? values.map(v => ({...v})) : [{...(values || {})}];

            if (table === "houses") {
                const initialCount = numberValue("houseInitialBirdCount");
                if (initialCount !== null) rows.forEach(r => {
                    if (r.initial_bird_count == null) r.initial_bird_count = Math.round(initialCount);
                });
            }

            if (table === "flocks") {
                const initialWeight = numberValue("initialAverageWeightG");
                const initialCount = numberValue("birdCount") ?? numberValue("houseInitialBirdCount");
                const prodStartAge = numberValue("productionStartAgeDays");
                const prodBaselineCount = numberValue("productionBaselineBirdCount");
                const prodBaselineWeight = numberValue("productionBaselineWeightG");
                const prodStartDate = isoDateOrNull("productionStartDate");
                rows.forEach(r => {
                    if (r.initial_bird_count == null && initialCount !== null) r.initial_bird_count = Math.round(initialCount);
                    if (r.initial_average_weight_g == null && initialWeight !== null) r.initial_average_weight_g = initialWeight;
                    if (r.production_start_date == null && prodStartDate) r.production_start_date = prodStartDate;
                    if (r.production_start_age_days == null && prodStartAge !== null) r.production_start_age_days = Math.round(prodStartAge);
                    if (r.production_baseline_bird_count == null && prodBaselineCount !== null) r.production_baseline_bird_count = Math.round(prodBaselineCount);
                    if (r.production_baseline_weight_g == null && prodBaselineWeight !== null) r.production_baseline_weight_g = prodBaselineWeight;
                });
            }

            return originalInsert(Array.isArray(values) ? rows : rows[0], options);
        };
        return query;
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectFields, {once:true});
    } else {
        injectFields();
    }

})();
