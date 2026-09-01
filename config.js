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

/* Global Persian voice input.
   Primary path: local Shenava Rizeh through ONNX Runtime Web.
   UI: explicit Start and Stop buttons; Stop automatically transcribes.
   Fallback: existing authenticated STT function if local inference fails. */
(function loadAdineVoice(){
    try {
        const load = (src, attr) => new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[${attr}="1"]`);
            if (existing) { resolve(); return; }
            const s = document.createElement("script");
            s.src = src;
            s.async = false;
            s.setAttribute(attr, "1");
            s.onload = resolve;
            s.onerror = reject;
            (document.head || document.documentElement).appendChild(s);
        });
        load("voice-shenava-runtime.js?v=6.4.0", "data-adine-shenava-runtime")
            .then(() => load("voice-universal-controls.js?v=6.3.0", "data-adine-universal-voice"))
            .catch(error => console.warn("Adine voice loader:", error));
    } catch (error) {
        console.warn("Adine voice loader:", error);
    }
})();