/* QUICK WEEKLY ENTRY - AUTHORITATIVE AUTO WEEK v5 */
(function(){
  "use strict";
  const MAX_WEEK=120;
  const START_KEYS=["placement_date","placementDate","chick_placement_date","chickPlacementDate","chick_arrival_date","chickArrivalDate","arrival_date","arrivalDate","flock_start_date","flockStartDate","start_date","startDate","entry_date","entryDate","date_of_placement","dateOfPlacement","placement"];
  const digits=v=>String(v??"").replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const norm=v=>digits(v).trim().replace(/[.\-]/g,"/").replace(/\s+/g,"");
  function toISO(v){
    const raw=String(v??"").trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const x=norm(raw), p=x.split("/");
    if(p.length!==3) return null;
    const y=Number(p[0]),m=Number(p[1]),d=Number(p[2]);
    if(![y,m,d].every(Number.isInteger)) return null;
    if(y>=1700){
      const iso=`${String(y).padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      if(window.AdineDateSystem?.dateOnlyDiffDays("2000-01-01",iso)!==null) return iso;
    }
    return window.AdineDateSystem?.jalaliToISO(x)||null;
  }
  function flock(){return window.currentFlockForSpecialized||window.currentFlock||null;}
  function startDate(f){if(!f)return null;for(const k of START_KEYS)if(f[k]!=null&&String(f[k]).trim())return f[k];return null;}
  function calc(){
    const f=flock(),e=document.getElementById("evaluationDate"),w=document.getElementById("weekNumber");
    if(!w)return null;
    const s=startDate(f), ev=e?.value||"", a=toISO(s), b=toISO(ev);
    if(!a||!b){w.value="";w.removeAttribute("readonly");return null;}
    const d=window.AdineDateSystem?.dateOnlyDiffDays(a,b);
    if(!Number.isFinite(d)||d<0){w.value="";w.removeAttribute("readonly");return null;}
    const raw=Number(f?.start_age_days??f?.startAgeDays), initial=Number.isFinite(raw)&&raw>=1?Math.floor(raw):1;
    const age=initial+d, base=Math.floor((age-1)/7)+1, pos=((age-1)%7)+1;
    const week=Math.min(MAX_WEEK,Math.max(1,base>1&&pos<=2?base-1:base));
    w.value=String(week);w.readOnly=true;w.setAttribute("readonly","readonly");w.setAttribute("aria-readonly","true");w.dataset.autoWeekValue=String(week);w.dataset.autoWeekAge=String(age);
    return {week,age};
  }
  function boot(){
    setInterval(calc,100);
    ["input","change","keyup","blur"].forEach(ev=>document.addEventListener(ev,e=>{if(e.target?.id==="evaluationDate")setTimeout(calc,0)}));
    document.addEventListener("click",()=>setTimeout(calc,50),true);
    calc();setTimeout(calc,500);setTimeout(calc,1500);
  }
  window.AdineWeeklyDirectV5={recalculate:calc,calculate:(f,e)=>{window.currentFlockForSpecialized=f;const el=document.getElementById("evaluationDate");if(el)el.value=e;return calc();},selfTest:()=>{const f=[];for(let age=1;age<=840;age++){const base=Math.floor((age-1)/7)+1,pos=((age-1)%7)+1,w=Math.min(120,Math.max(1,base>1&&pos<=2?base-1:base));if(w<1||w>120)f.push(age)}return{ok:f.length===0,testedAges:840,maxWeek:120,failures:f}}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
