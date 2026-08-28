/* =========================================================
   ADINEH — MORTALITY FLOCK BOOTSTRAP
   Ensures mortality.js never starts before the active flock context
   has been recovered. This is intentionally loaded BEFORE mortality.js.
========================================================= */
(function(){
    "use strict";

    const originalAddEventListener = document.addEventListener.bind(document);
    let captured = false;

    async function recoverFlockContext(){
        if(typeof supabaseClient === "undefined" || !supabaseClient) return;

        let selection = {};
        try{
            if(typeof getCurrentSelection === "function")
                selection = getCurrentSelection() || {};
        }catch(_){ selection = {}; }

        const params = new URLSearchParams(location.search);
        const urlFlockId = params.get("flock") || params.get("flock_id");

        if(selection.flockId || urlFlockId) return;

        let query = supabaseClient
            .from("flocks")
            .select("id,farm_id,house_id,flock_name,strain,placement_date,status,bird_count")
            .eq("status","active")
            .order("created_at",{ascending:false})
            .limit(1);

        if(selection.houseId) query = query.eq("house_id",selection.houseId);
        else if(selection.farmId) query = query.eq("farm_id",selection.farmId);

        let result = await query;

        /* Some older datasets may not have a usable status value. */
        if(result.error || !(result.data || []).length){
            result = await supabaseClient
                .from("flocks")
                .select("id,farm_id,house_id,flock_name,strain,placement_date,status,bird_count")
                .order("created_at",{ascending:false})
                .limit(1);
        }

        const flock = (result.data || [])[0];
        if(!flock) return;

        if(typeof setCurrentSelection === "function"){
            setCurrentSelection({
                farmId: flock.farm_id || selection.farmId || null,
                houseId: flock.house_id || selection.houseId || null,
                flockId: flock.id
            });
        }

        window.__adineMortalityBootstrappedFlock = flock;
    }

    /* mortality.js registers initMortalityModule on DOMContentLoaded.
       Delay only that handler until flock context is ready. */
    document.addEventListener = function(type, listener, options){
        if(!captured && type === "DOMContentLoaded" && typeof listener === "function" && listener.name === "initMortalityModule"){
            captured = true;
            return originalAddEventListener("DOMContentLoaded", async function(event){
                try{ await recoverFlockContext(); }
                catch(error){ console.error("Mortality flock bootstrap failed:", error); }
                return listener.call(document, event);
            }, options);
        }
        return originalAddEventListener(type, listener, options);
    };
})();
