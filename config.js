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

/* Global local Persian voice input loader.
   Shenava Rizeh runs on-device through ONNX Runtime Web.
   No paid API, no Supabase calls, no audio upload. */
(function loadAdineShenavaVoice(){
    try {
        if (window.AdineVoiceInput || document.querySelector('script[data-adine-shenava-voice="1"]')) return;
        const script = document.createElement("script");
        script.src = "voice-shenava.js?v=2.2.0";
        script.async = false;
        script.dataset.adineShenavaVoice = "1";
        (document.head || document.documentElement).appendChild(script);
    } catch (error) {
        console.warn("Adine Shenava voice loader:", error);
    }
})();
