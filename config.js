/* =========================================================
   ADINE POULTRY HEALTH CENTER
   AUTH CLIENT CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
    "https://vzcczkavlopznljnnehp.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_4jMgvqKI__-MsmMQtEiCig_M9WjhvN9";

window.supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: "implicit"
            }
        }
    );

/* Global Persian voice input loader. UI-only; no data/business logic. */
(function loadAdineVoiceInput(){
    try {
        if (window.AdineVoiceInput || document.querySelector('script[data-adine-voice-input="1"]')) return;
        const script = document.createElement("script");
        script.src = "voice-input.js?v=1.0.0";
        script.async = false;
        script.dataset.adineVoiceInput = "1";
        (document.head || document.documentElement).appendChild(script);
    } catch (error) {
        console.warn("Adine voice input loader:", error);
    }
})();
