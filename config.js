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

/* Global local Persian voice input.
   Shenava Rizeh runs on-device through ONNX Runtime Web.
   No paid API, no Supabase calls, no audio upload. */
(function loadAdineShenavaVoice(){
    try {
        if (window.AdineShenavaRuntime || window.AdineVoiceInput || document.querySelector('script[data-adine-shenava-runtime="1"]')) return;

        /* Runtime owns the complete cross-platform raw-PCM microphone,
           model/assets download, fallback and ASR path. Keeping network
           fallback in one place avoids competing fetch monkey-patches. */
        const runtime = document.createElement("script");
        runtime.src = "voice-shenava-runtime.js?v=4.2.0";
        runtime.async = false;
        runtime.dataset.adineShenavaRuntime = "1";
        (document.head || document.documentElement).appendChild(runtime);

        /* Legacy adapter supplies the established Persian/veterinary
           normalization layer. Runtime owns the actual audio/ASR path. */
        const script = document.createElement("script");
        script.src = "voice-shenava.js?v=3.0.0";
        script.async = false;
        script.dataset.adineShenavaVoice = "1";
        (document.head || document.documentElement).appendChild(script);
    } catch (error) {
        console.warn("Adine Shenava voice loader:", error);
    }
})();
