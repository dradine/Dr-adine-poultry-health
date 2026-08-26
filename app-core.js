/* =========================================================
   ADINE POULTRY HEALTH CENTER
   GLOBAL MOBILE VIEWPORT / NO-AUTO-ZOOM GUARD
   Presentation only. No business/data logic is changed.
========================================================= */
(function installAdineNoZoom(){
    "use strict";
    try {
        var meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "viewport";
            (document.head || document.documentElement).appendChild(meta);
        }
        meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
        if (!document.getElementById("adine-global-no-zoom-style")) {
            var style = document.createElement("style");
            style.id = "adine-global-no-zoom-style";
            style.textContent = 'html{-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important}input,select,textarea,button{touch-action:manipulation}input,select,textarea{font-size:16px!important}';
            (document.head || document.documentElement).appendChild(style);
        }
    } catch (error) {
        console.warn("Adine global no-zoom guard:", error);
    }
})();

const APP_CONFIG = {
    name: "مرکز تخصصی سلامت طیور آدینه",
    shortName: "آدینه",
    version: "2.0.0",
    storagePrefix: "adine_poultry_"
};

function createId(prefix = "id") {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `${prefix}_${crypto.randomUUID()}`;
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
}
function storageKey(name) { return APP_CONFIG.storagePrefix + name; }
function readStorage(name, fallback = []) { try { const raw = localStorage.getItem(storageKey(name)); return raw ? JSON.parse(raw) : fallback; } catch (error) { console.error("Storage read error:", error); return fallback; } }
function writeStorage(name, value) { try { localStorage.setItem(storageKey(name), JSON.stringify(value)); return true; } catch (error) { console.error("Storage write error:", error); return false; } }
function getFarms() { return readStorage("farms", []); }
function saveFarm(farm) { const farms=getFarms(); const item={id:farm.id||createId("farm"),name:String(farm.name||"").trim(),code:String(farm.code||"").trim(),location:String(farm.location||"").trim(),owner:String(farm.owner||"").trim(),manager:String(farm.manager||"").trim(),type:farm.type||"",capacity:Number(farm.capacity||0),notes:farm.notes||"",createdAt:farm.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()}; const index=farms.findIndex(x=>x.id===item.id); if(index>=0) farms[index]=item; else farms.push(item); writeStorage("farms",farms); return item; }
function deleteFarm(farmId) { writeStorage("farms",getFarms().filter(farm=>farm.id!==farmId)); return true; }
function getHouses() { return readStorage("houses", []); }
function getFarmHouses(farmId) { return getHouses().filter(house=>house.farmId===farmId); }
function saveHouse(house) { const houses=getHouses(); const item={id:house.id||createId("house"),farmId:house.farmId,name:String(house.name||"").trim(),code:String(house.code||"").trim(),capacity:Number(house.capacity||0),length:Number(house.length||0),width:Number(house.width||0),ventilation:house.ventilation||"",housingSystem:house.housingSystem||"",notes:house.notes||"",createdAt:house.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()}; const index=houses.findIndex(x=>x.id===item.id); if(index>=0) houses[index]=item; else houses.push(item); writeStorage("houses",houses); return item; }
function getFlocks() { return readStorage("flocks", []); }
function getHouseFlocks(houseId) { return getFlocks().filter(flock=>flock.houseId===houseId); }
function saveFlock(flock) { const flocks=getFlocks(); const item={id:flock.id||createId("flock"),farmId:flock.farmId,houseId:flock.houseId,flockName:String(flock.flockName||"").trim(),flockCode:String(flock.flockCode||"").trim(),productionType:flock.productionType||"",genetics:flock.genetics||"",strain:flock.strain||"",program:flock.program||"",sex:flock.sex||"mixed",birdCount:Number(flock.birdCount||0),placementDate:flock.placementDate||"",startAgeDays:Number(flock.startAgeDays||1),status:flock.status||"active",notes:flock.notes||"",createdAt:flock.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()}; const index=flocks.findIndex(x=>x.id===item.id); if(index>=0) flocks[index]=item; else flocks.push(item); writeStorage("flocks",flocks); return item; }
function deleteFlock(flockId) { writeStorage("flocks",getFlocks().filter(flock=>flock.id!==flockId)); return true; }
function getCurrentSelection() { return readStorage("current_selection", {}); }
function setCurrentSelection(selection) { return writeStorage("current_selection", {...getCurrentSelection(),...selection}); }
function clearCurrentSelection() { localStorage.removeItem(storageKey("current_selection")); }
function todayISO() { const now=new Date(), offset=now.getTimezoneOffset(); return new Date(now.getTime()-offset*60000).toISOString().slice(0,10); }
function calculateAgeDays(placementDate,targetDate=todayISO()) { if(!placementDate||!targetDate)return null; const start=new Date(placementDate+"T00:00:00"), target=new Date(targetDate+"T00:00:00"); if(Number.isNaN(start.getTime())||Number.isNaN(target.getTime()))return null; return Math.max(0,Math.floor((target.getTime()-start.getTime())/86400000)); }
function daysToWeeks(days) { const value=Number(days); return Number.isFinite(value)?value/7:null; }
function escapeHTML(value) { return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function safeNumber(value,fallback=0) { const number=Number(value); return Number.isFinite(number)?number:fallback; }
function normalizeText(value) { return String(value||"").trim().toLowerCase(); }
(function loadCompactPagePresentation(){ try { const path=String(window.location.pathname||"").toLowerCase(), page=path.split("/").pop(), targets=new Set(["farms.html","flocks.html","weekly.html","reports.html"]); if(!targets.has(page))return; document.documentElement.classList.add("cp-compact-root"); document.body.classList.add("cp-compact-page"); if(page==="farms.html")document.body.classList.add("cp-farm-page"); if(page==="flocks.html")document.body.classList.add("cp-flock-page"); if(page==="weekly.html")document.body.classList.add("cp-weekly-page"); if(page==="reports.html")document.body.classList.add("cp-reports-page"); if(!document.querySelector('link[data-adine-compact-ui="1"]')){const link=document.createElement("link");link.rel="stylesheet";link.href="compact-pages.css";link.dataset.adineCompactUi="1";document.head.appendChild(link);} } catch(error){console.warn("Compact UI layer was not loaded:",error);} })();
