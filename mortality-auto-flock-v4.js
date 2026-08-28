"use strict";

/* ADINEH mortality/disease module — active flock loading + event-date age. */
(function(){
    let lastKey = null;
    let syncing = false;
    let ageWatchTimer = null;

    function getHealthFlock(){
        try { if (typeof healthFlock !== "undefined" && healthFlock) return healthFlock; } catch (_) {}
        return window.healthFlock || null;
    }

    function getSelection(){
        try { return typeof getCurrentSelection === "function" ? (getCurrentSelection() || {}) : {}; }
        catch (_) { return {}; }
    }

    function selectionKey(){ return String(getSelection().flockId || ""); }

    function normalizeDate(value){
        if (!value) return null;
        const raw = String(value).trim().replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
        try { if (window.jalaliDate?.jalaliToISO) { const x=window.jalaliDate.jalaliToISO(raw); if(x) return String(x).slice(0,10); } } catch (_) {}
        try { if (window.AdineDateSystem?.jalaliToISO) { const x=window.AdineDateSystem.jalaliToISO(raw); if(x) return String(x).slice(0,10); } } catch (_) {}
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
        return null;
    }

    function isoToJalali(iso){
        try { if (window.jalaliDate?.isoToJalali) return window.jalaliDate.isoToJalali(iso); } catch (_) {}
        try { if (window.AdineDateSystem?.isoToJalali) return window.AdineDateSystem.isoToJalali(iso); } catch (_) {}
        return null;
    }

    function dateOnlyDiffDays(startISO,endISO){
        try {
            if(window.AdineDateSystem?.dateOnlyDiffDays){
                const n=Number(window.AdineDateSystem.dateOnlyDiffDays(startISO,endISO));
                if(Number.isFinite(n)) return n;
            }
        } catch (_) {}
        const a=String(startISO).slice(0,10).split("-").map(Number);
        const b=String(endISO).slice(0,10).split("-").map(Number);
        if(a.length!==3||b.length!==3||a.some(Number.isNaN)||b.some(Number.isNaN)) return NaN;
        return Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000);
    }

    function todayISO(){
        try { if(window.AdineDateSystem?.todayISO) return String(window.AdineDateSystem.todayISO()).slice(0,10); } catch (_) {}
        return new Date().toISOString().slice(0,10);
    }

    function setFlockInfo(){
        const flock=getHealthFlock();
        const el=document.getElementById("flockInfo");
        if(!flock||!el) return;
        const farm=window.healthFarm || null;
        const house=window.healthHouse || null;
        el.textContent=[farm?.name,house?.name,flock.flock_name,flock.strain].filter(Boolean).join(" | ") || "گله انتخاب‌شده";
    }

    /* Override the old loader: mortality.js used to redirect when flockId was absent. */
    window.loadCurrentFlock = async function(){
        let selection=getSelection();
        let flockId=selection.flockId || new URLSearchParams(location.search).get("flock") || new URLSearchParams(location.search).get("flock_id");
        let data=null;

        if(flockId){
            const r=await supabaseClient.from("flocks").select("*").eq("id",flockId).maybeSingle();
            if(r.error) throw r.error;
            data=r.data || null;
        }

        /* If the navigation did not carry a flock, recover it from the active flock context. */
        if(!data){
            let q=supabaseClient.from("flocks").select("*").eq("status","active").order("created_at",{ascending:false}).limit(1);
            if(selection.houseId) q=q.eq("house_id",selection.houseId);
            else if(selection.farmId) q=q.eq("farm_id",selection.farmId);
            let r=await q;
            if(r.error){
                r=await supabaseClient.from("flocks").select("*").order("created_at",{ascending:false}).limit(1);
            }
            data=(r.data||[])[0] || null;
        }

        if(!data){
            const box=document.getElementById("flockInfo");
            if(box) box.textContent="گله فعالی برای ثبت رخداد پیدا نشد.";
            throw new Error("گله فعال برای ثبت رخداد سلامت پیدا نشد.");
        }

        healthFlock=data;
        window.healthFlock=data;
        if(data.farm_id){
            const r=await supabaseClient.from("farms").select("*").eq("id",data.farm_id).maybeSingle();
            if(!r.error){ healthFarm=r.data; window.healthFarm=r.data; }
        }
        if(data.house_id){
            const r=await supabaseClient.from("houses").select("*").eq("id",data.house_id).maybeSingle();
            if(!r.error){ healthHouse=r.data; window.healthHouse=r.data; }
        }

        if(typeof setCurrentSelection === "function") setCurrentSelection({farmId:data.farm_id,houseId:data.house_id,flockId:data.id});
        setFlockInfo();
        syncEventDateWithFlock(true);
        return data;
    };

    function syncEventDateWithFlock(forceDefault){
        const dateInput=document.getElementById("eventDate");
        const ageInput=document.getElementById("eventAge");
        const flock=getHealthFlock();
        if(!dateInput||!ageInput||!flock?.placement_date) return;

        ageInput.readOnly=true;
        ageInput.setAttribute("aria-readonly","true");

        const placement=String(flock.placement_date).slice(0,10);
        let eventISO=normalizeDate(dateInput.value);
        const today=todayISO();

        if(forceDefault || !eventISO || eventISO < placement || !dateInput.value.trim()){
            eventISO=today < placement ? placement : today;
            const jalali=isoToJalali(eventISO);
            if(jalali) dateInput.value=jalali;
        }

        const age=dateOnlyDiffDays(placement,eventISO);
        if(Number.isFinite(age)&&age>=0){
            ageInput.value=String(age);
            ageInput.removeAttribute("aria-invalid");
            ageInput.title="سن گله در تاریخ رخداد به‌صورت خودکار محاسبه شده است.";
        }else{
            ageInput.value="";
            ageInput.setAttribute("aria-invalid","true");
        }
    }

    function bindEventDateAge(){
        const input=document.getElementById("eventDate");
        const age=document.getElementById("eventAge");
        if(!input||!age) return;
        age.readOnly=true;
        ["input","change","blur"].forEach(type=>{
            const key="ageSync_"+type;
            if(input.dataset[key]!=="1"){
                input.addEventListener(type,()=>syncEventDateWithFlock(false));
                input.dataset[key]="1";
            }
        });
        syncEventDateWithFlock(false);
    }

    function startAgeWatch(){
        if(ageWatchTimer) return;
        ageWatchTimer=setInterval(()=>syncEventDateWithFlock(false),500);
    }

    function tidyReportSettings(){
        if(document.getElementById("adineReportSettingsStyle")) return;
        const style=document.createElement("style");
        style.id="adineReportSettingsStyle";
        style.textContent=`.report-box{display:grid;grid-template-columns:1fr;gap:10px;align-items:center}.report-row{display:flex!important;align-items:center!important;gap:9px!important;margin:0!important;padding:9px 11px;border:1px solid #e1e8e4;border-radius:10px;background:#fff}.report-row input[type="checkbox"]{width:18px!important;height:18px!important;min-width:18px;margin:0!important}.report-row label{margin:0!important;font-size:12px;line-height:1.6;cursor:pointer}.report-box>.form-group{margin:0!important;padding:9px 11px;border:1px solid #e1e8e4;border-radius:10px;background:#fff}`;
        document.head.appendChild(style);
    }

    async function sync(reason){
        if(syncing) return;
        const key=selectionKey();
        if(key===lastKey && getHealthFlock()) return;
        syncing=true;
        try{
            await window.loadCurrentFlock();
            lastKey=selectionKey();
            if(typeof loadEvents==="function") await loadEvents();
            if(typeof renderDashboard==="function") renderDashboard();
            if(typeof renderOverview==="function") renderOverview();
            if(typeof renderHistory==="function") renderHistory();
            bindEventDateAge();
            tidyReportSettings();
        }catch(e){ console.error("Active flock synchronization failed:",e); }
        finally{ syncing=false; }
    }

    function start(){
        tidyReportSettings();
        bindEventDateAge();
        startAgeWatch();
        setTimeout(()=>sync("startup"),0);
        setInterval(()=>sync("poll"),1500);
        window.addEventListener("focus",()=>sync("focus"));
        document.addEventListener("visibilitychange",()=>{if(!document.hidden)sync("visibility")});
        document.addEventListener("adine:current-selection-changed",()=>sync("selection"));
        document.addEventListener("adine:jalali-date-selected",()=>syncEventDateWithFlock(false));
    }

    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
    else start();
})();