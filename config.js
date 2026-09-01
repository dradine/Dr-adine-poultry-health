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

        /* Network adapter only affects Shenava model/sidecar downloads.
           It tries the pinned official model first and then a public mirror,
           which is important for restricted networks such as Iran. */
        const network = document.createElement("script");
        network.src = "voice-shenava-network.js?v=1.0.0";
        network.async = false;
        network.dataset.adineShenavaNetwork = "1";
        (document.head || document.documentElement).appendChild(network);

        /* Runtime MUST register its capture-phase handler first. */
        const runtime = document.createElement("script");
        runtime.src = "voice-shenava-runtime.js?v=3.1.0";
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
