"use strict";

/*
 ADINEH — mortality/disease bootstrap

This layer is intentionally authoritative for flock context.  The old
mortality.js loader requires current_selection.flockId and redirects when it
is absent.  Because this file is loaded immediately before mortality.js, the
loader is installed on the next event-loop turn, after mortality.js has
created its global function but before DOMContentLoaded initializes the page.
*/
(function(){
    let flockPromise = null;
    let intelligenceLoaded = false;

    const KEY = "adine_poultry_current_selection";

    function selection(){
        try {
            if(typeof getCurrentSelection === "function") return getCurrentSelection() || {};
        } catch(e) {}
        try {
            const raw = localStorage.getItem(KEY) || localStorage.getItem("adine_poultry_current_selection");
            return raw ? JSON.parse(raw) : {};
        } catch(e) { return {}; }
    }

    function urlFlockId(){
        try {
            const q = new URLSearchParams(location.search);
            return q.get("flock") || q.get("flock_id") || q.get("flockId");
        } catch(e) { return null; }
    }

    function saveSelection(data){
        const value = {farmId:data.farm_id || null, houseId:data.house_id || null, flockId:data.id};
        try {
            if(typeof setCurrentSelection === "function") setCurrentSelection(value);
            else localStorage.setItem(KEY, JSON.stringify(value));
        } catch(e) {}
        try { window.dispatchEvent(new CustomEvent("adine:current-selection-changed", {detail:value})); } catch(e) {}
    }

    async function findFlock(){
        if(!window.supabaseClient) throw new Error("Supabase هنوز آماده نیست.");
        const sel = selection();
        const id = sel.flockId || urlFlockId();
        let data = null;

        if(id){
            const r = await supabaseClient.from("flocks").select("*").eq("id", id).maybeSingle();
            if(r.error) throw r.error;
            data = r.data || null;
        }

        /* Recover the same active flock by house/farm when navigation lost flockId. */
        if(!data && sel.houseId){
            const r = await supabaseClient.from("flocks").select("*").eq("house_id", sel.houseId).eq("status", "active").order("created_at", {ascending:false}).limit(1);
            if(!r.error) data = (r.data || [])[0] || null;
        }
        if(!data && sel.farmId){
            const r = await supabaseClient.from("flocks").select("*").eq("farm_id", sel.farmId).eq("status", "active").order("created_at", {ascending:false}).limit(1);
            if(!r.error) data = (r.data || [])[0] || null;
        }

        /* Final fallback: newest active flock visible to the authenticated user. */
        if(!data){
            const r = await supabaseClient.from("flocks").select("*").eq("status", "active").order("created_at", {ascending:false}).limit(1);
            if(!r.error) data = (r.data || [])[0] || null;
        }

        if(!data) throw new Error("گله فعال برای ثبت رخداد سلامت پیدا نشد.");

        let farm = null, house = null;
        if(data.farm_id){
            const r = await supabaseClient.from("farms").select("*").eq("id", data.farm_id).maybeSingle();
            if(!r.error) farm = r.data;
        }
        if(data.house_id){
            const r = await supabaseClient.from("houses").select("*").eq("id", data.house_id).maybeSingle();
            if(!r.error) house = r.data;
        }

        /* Keep both the global property and the global lexical binding used by mortality.js. */
        try { healthFlock = data; } catch(e) {}
        try { window.healthFlock = data; } catch(e) {}
        try { healthFarm = farm; window.healthFarm = farm; } catch(e) {}
        try { healthHouse = house; window.healthHouse = house; } catch(e) {}

        saveSelection(data);
        return {flock:data, farm:farm, house:house};
    }

    function flockInfo(ctx){
        const el = document.getElementById("flockInfo");
        if(!el || !ctx?.flock) return;
        const f = ctx.flock, farm = ctx.farm, house = ctx.house;
        el.textContent = [farm?.name, house?.name, f.flock_name, f.strain].filter(Boolean).join(" | ") || "گله انتخاب‌شده";
    }

    function normalizeDigits(v){
        return String(v || "").replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    }

    function toISO(v){
        const raw = normalizeDigits(v).trim();
        if(!raw) return null;
        try { if(window.jalaliDate?.jalaliToISO){ const x=window.jalaliDate.jalaliToISO(raw); if(x) return String(x).slice(0,10); } } catch(e) {}
        try { if(window.AdineDateSystem?.jalaliToISO){ const x=window.AdineDateSystem.jalaliToISO(raw); if(x) return String(x).slice(0,10); } } catch(e) {}
        return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
    }

    function todayISO(){
        try { if(window.AdineDateSystem?.todayISO) return String(window.AdineDateSystem.todayISO()).slice(0,10); } catch(e) {}
        return new Date().toISOString().slice(0,10);
    }

    function diffDays(a,b){
        try { if(window.AdineDateSystem?.dateOnlyDiffDays){ const n=Number(window.AdineDateSystem.dateOnlyDiffDays(a,b)); if(Number.isFinite(n)) return n; } } catch(e) {}
        const x=a.split("-").map(Number), y=b.split("-").map(Number);
        return Math.round((Date.UTC(y[0],y[1]-1,y[2])-Date.UTC(x[0],x[1]-1,x[2]))/86400000);
    }

    function syncDateAndAge(ctx, force){
        const date=document.getElementById("eventDate"), age=document.getElementById("eventAge");
        const placement=ctx?.flock?.placement_date ? String(ctx.flock.placement_date).slice(0,10) : null;
        if(!date || !age || !placement) return;
        age.readOnly = true;
        age.setAttribute("aria-readonly", "true");
        let iso=toISO(date.value);
        const today=todayISO();
        if(force || !iso || iso < placement){
            iso = today < placement ? placement : today;
            try {
                const j = window.jalaliDate?.isoToJalali?.(iso) || window.AdineDateSystem?.isoToJalali?.(iso);
                if(j) date.value=j;
            } catch(e) {}
        }
        const n=diffDays(placement, iso);
        age.value=Number.isFinite(n) && n>=0 ? String(n) : "";
    }

    async function authoritativeLoader(){
        if(!flockPromise) flockPromise=findFlock();
        const ctx=await flockPromise;
        flockInfo(ctx);
        syncDateAndAge(ctx, false);
        return ctx.flock;
    }

    function installLoader(){
        /* mortality.js is the immediately following script; wait one turn so its
           function declaration exists, then replace it before DOMContentLoaded. */
        setTimeout(function(){
            window.loadCurrentFlock = authoritativeLoader;
        }, 0);
    }

    function bindDate(){
        const date=document.getElementById("eventDate"), age=document.getElementById("eventAge");
        if(!date || !age || date.dataset.adineAgeBound === "1") return;
        date.dataset.adineAgeBound="1";
        age.readOnly=true;
        ["input","change","blur"].forEach(ev=>date.addEventListener(ev,()=>flockPromise?.then(ctx=>syncDateAndAge(ctx,false))));
    }

    function loadOldSmartAnalysis(){
        if(intelligenceLoaded) return;
        intelligenceLoaded=true;
        if(document.getElementById("adine-mortality-v2-script")) return;
        const s=document.createElement("script");
        s.id="adine-mortality-v2-script";
        s.src="mortality-disease-intelligence-v2.js?v=restore-v2";
        s.onload=()=>console.info("ADINEH: legacy mortality intelligence V2 restored.");
        s.onerror=e=>console.error("ADINEH: legacy mortality intelligence V2 failed to load",e);
        document.head.appendChild(s);
    }

    async function start(){
        installLoader();
        bindDate();
        try {
            const ctx=await authoritativeLoader();
            bindDate();
            syncDateAndAge(ctx,true);
            loadOldSmartAnalysis();
        } catch(e) {
            console.error("ADINEH mortality flock bootstrap:", e);
            const box=document.getElementById("flockInfo");
            if(box) box.textContent="خطا در بارگذاری گله: " + e.message;
        }
    }

    /* Start as soon as possible.  This script is loaded before mortality.js. */
    installLoader();
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
    else start();
})();