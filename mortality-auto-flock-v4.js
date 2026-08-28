"use strict";

/* ADINEH — mortality/disease bootstrap + report-settings UI */
(function(){
    let flockPromise = null;
    let intelligenceLoaded = false;
    const KEY = "adine_poultry_current_selection";

    function selection(){
        try { if(typeof getCurrentSelection === "function") return getCurrentSelection() || {}; } catch(e) {}
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
        if(!data && sel.houseId){
            const r = await supabaseClient.from("flocks").select("*").eq("house_id", sel.houseId).eq("status", "active").order("created_at", {ascending:false}).limit(1);
            if(!r.error) data = (r.data || [])[0] || null;
        }
        if(!data && sel.farmId){
            const r = await supabaseClient.from("flocks").select("*").eq("farm_id", sel.farmId).eq("status", "active").order("created_at", {ascending:false}).limit(1);
            if(!r.error) data = (r.data || [])[0] || null;
        }
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
        const f=ctx.flock, farm=ctx.farm, house=ctx.house;
        el.textContent=[farm?.name,house?.name,f.flock_name,f.strain].filter(Boolean).join(" | ") || "گله انتخاب‌شده";
    }

    function normalizeDigits(v){
        return String(v || "").replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    }

    function toISO(v){
        const raw=normalizeDigits(v).trim();
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
        age.readOnly=true;
        age.setAttribute("aria-readonly","true");
        let iso=toISO(date.value);
        const today=todayISO();
        if(force || !iso || iso < placement){
            iso=today < placement ? placement : today;
            try {
                const j=window.jalaliDate?.isoToJalali?.(iso) || window.AdineDateSystem?.isoToJalali?.(iso);
                if(j) date.value=j;
            } catch(e) {}
        }
        const n=diffDays(placement,iso);
        age.value=Number.isFinite(n) && n>=0 ? String(n) : "";
    }

    /* Keep the four report settings in one deterministic order regardless of
       inherited CSS or later DOM manipulation:
       1) show in reports, 2) report level, 3) weekly report, 4) health analysis. */
    function tidyReportSettings(){
        const box=document.querySelector(".report-box");
        if(!box || box.dataset.adineReportSettingsTidy === "1") return;
        const title=box.querySelector(":scope > strong");
        const show=box.querySelector("#showInReports")?.closest(".report-row");
        const level=box.querySelector("#reportLevel")?.closest(".form-group");
        const weekly=box.querySelector("#includeWeekly")?.closest(".report-row");
        const analysis=box.querySelector("#includeAnalysis")?.closest(".report-row");
        if(!show || !level || !weekly || !analysis) return;

        /* Re-append in canonical order. Re-append does not change values/events. */
        if(title) box.appendChild(title);
        box.appendChild(show);
        box.appendChild(level);
        box.appendChild(weekly);
        box.appendChild(analysis);

        title?.classList.add("report-settings-title");
        [show,weekly,analysis].forEach(row=>row.classList.add("report-settings-row"));
        level.classList.add("report-settings-level");
        box.dataset.adineReportSettingsTidy="1";

        if(!document.getElementById("adineReportSettingsStyle")){
            const style=document.createElement("style");
            style.id="adineReportSettingsStyle";
            style.textContent=`
                .report-box{display:flex!important;flex-direction:column!important;gap:10px!important;align-items:stretch!important}
                .report-box>.report-settings-title{display:block!important;order:0!important;margin:0 0 2px!important;font-size:15px!important;font-weight:800!important;color:#173f35!important;line-height:1.8!important}
                .report-box>.report-settings-row{display:flex!important;order:initial!important;align-items:center!important;justify-content:flex-start!important;gap:10px!important;margin:0!important;padding:10px 12px!important;min-height:42px!important;box-sizing:border-box!important;border:1px solid #dfe8e3!important;border-radius:10px!important;background:#fff!important}
                .report-box>.report-settings-row input[type=checkbox]{flex:0 0 18px!important;width:18px!important;height:18px!important;margin:0!important}
                .report-box>.report-settings-row label{flex:1 1 auto!important;margin:0!important;padding:0!important;font-size:13px!important;line-height:1.8!important;cursor:pointer!important}
                .report-box>.report-settings-level{order:initial!important;margin:0!important;padding:10px 12px!important;box-sizing:border-box!important;border:1px solid #dfe8e3!important;border-radius:10px!important;background:#fff!important}
                .report-box>.report-settings-level label{display:block!important;margin:0 0 6px!important;font-size:12px!important;font-weight:700!important;color:#33443d!important}
                .report-box>.report-settings-level select{display:block!important;width:100%!important;box-sizing:border-box!important;min-height:40px!important;margin:0!important}
                .report-box>#showInReports-row{}
            `;
            document.head.appendChild(style);
        }
    }

    async function authoritativeLoader(){
        if(!flockPromise) flockPromise=findFlock();
        const ctx=await flockPromise;
        flockInfo(ctx);
        syncDateAndAge(ctx,false);
        return ctx.flock;
    }

    function installLoader(){
        setTimeout(()=>{ window.loadCurrentFlock=authoritativeLoader; },0);
    }

    function bindDate(){
        const date=document.getElementById("eventDate"), age=document.getElementById("eventAge");
        if(!date || !age || date.dataset.adineAgeBound === "1") return;
        date.dataset.adineAgeBound="1";
        age.readOnly=true;
        ["input","change","blur"].forEach(ev=>date.addEventListener(ev,()=>flockPromise?.then(ctx=>syncDateAndAge(ctx,false))));
        document.addEventListener("adine:jalali-date-selected",()=>flockPromise?.then(ctx=>syncDateAndAge(ctx,false)));
    }

    function loadOldSmartAnalysis(){
        if(intelligenceLoaded) return;
        if(document.getElementById("adine-mortality-v2-script")) return;
        intelligenceLoaded=true;
        const s=document.createElement("script");
        s.id="adine-mortality-v2-script";
        s.src="mortality-disease-intelligence-v2.js?v=restore-v2-2";
        s.onload=()=>console.info("ADINEH: legacy mortality intelligence V2 restored.");
        s.onerror=e=>console.error("ADINEH: legacy mortality intelligence V2 failed to load",e);
        document.head.appendChild(s);
    }

    async function start(){
        installLoader();
        bindDate();
        tidyReportSettings();
        try{
            const ctx=await authoritativeLoader();
            bindDate();
            tidyReportSettings();
            syncDateAndAge(ctx,true);
            loadOldSmartAnalysis();
        }catch(e){
            console.error("ADINEH mortality flock bootstrap:",e);
            const box=document.getElementById("flockInfo");
            if(box) box.textContent="خطا در بارگذاری گله: "+e.message;
        }
    }

    installLoader();
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{once:true});
    else start();
})();
