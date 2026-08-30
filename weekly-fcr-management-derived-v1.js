/* ADINE POULTRY HEALTH — SCIENTIFIC WEEKLY MANAGEMENT FCR V2 */
"use strict";
(function(g){
  const page=String(location.pathname||"").toLowerCase().split("/").pop();
  if(page!=="reports.html" && page!=="reports-v2.html") return;
  const client=g.supabaseClient;
  if(!client) return;
  const num=v=>{const x=Number(String(v??"").replace(/[٬,]/g,"").replace("٫","."));return Number.isFinite(x)?x:null;};
  const fmt=v=>v==null?"—":Number(v).toLocaleString("fa-IR",{minimumFractionDigits:3,maximumFractionDigits:3});
  function flockId(){
    const select=document.getElementById("flock"); if(select?.value)return select.value;
    const p=new URLSearchParams(location.search); const direct=p.get("flock_id")||p.get("flockId")||p.get("id");
    if(direct)return direct;
    try{const raw=localStorage.getItem("adine_poultry_current_selection");if(raw){const o=JSON.parse(raw);return o?.flockId||o?.flock_id||null;}}catch(_){ }
    try{return localStorage.getItem("selectedFlockId")||localStorage.getItem("activeFlockId")||null;}catch(_){return null;}
  }
  let standards=[], loadedFor=null;
  async function load(){
    const id=flockId(); if(!id)return false;
    if(loadedFor===id && standards.length)return true;
    const {data:flock,error:fe}=await client.from("flocks").select("id,production_type,genetics,strain,sex,variant").eq("id",id).maybeSingle();
    if(fe||!flock||!/broiler|گوشتی|meat/i.test(String(flock.production_type||"")))return false;
    const {data,error}=await client.rpc("get_broiler_weekly_management_fcr",{p_strain:flock.strain,p_genetics:flock.genetics||null});
    if(error||!Array.isArray(data)||!data.length)return false;
    standards=data.map(x=>({week:num(x.week_number),age:num(x.age_days),value:num(x.weekly_fcr),cum:num(x.cumulative_fcr),source:x.source_name,year:x.source_year,method:x.method})).filter(x=>x.week!=null&&x.value!=null&&x.cum!=null);
    loadedFor=id; return standards.length>0;
  }
  function targetForWeek(w){return standards.find(x=>x.week===num(w))||null;}
  function findKpiByLabel(label){
    return [...document.querySelectorAll(".kpi")].find(m=>new RegExp(label).test(m.querySelector("b")?.textContent||""));
  }
  function weeklyMethod(t){
    return t?.method||"مشتق‌شده از اهداف رسمی عملکرد: خوراک مصرفی همان هفته ÷ افزایش وزن زنده همان هفته؛ محاسبه بر پایه مقادیر رسمی سن/وزن/FCR تجمعی.";
  }
  function officialSource(t){return `${t?.source||"Performance Objectives"} (${t?.year||"—"})`;}
  function patchV2(){
    const weekly=findKpiByLabel("FCR هفتگی");
    if(!weekly)return false;
    const weekSel=document.getElementById("week"),w=num(weekSel?.value); if(w==null)return false;
    const t=targetForWeek(w); if(!t)return false;
    const old=weekly.querySelector("small"); if(old)old.textContent=`استاندارد مدیریتی FCR هفتگی: ${fmt(t.value)} | ${officialSource(t)}`;
    weekly.dataset.managementFcr=String(t.value);
    let cum=findKpiByLabel("FCR تجمعی");
    if(cum){const ref=cum.querySelector("small");if(ref)ref.textContent=`استاندارد رسمی FCR تجمعی همان هفته: ${fmt(t.cum)} | ${officialSource(t)}`;cum.dataset.officialCumulativeFcr=String(t.cum);}
    const grid=weekly.parentElement;
    const add=(after,key,label,value,refText)=>{
      let el=grid?.querySelector(`[data-adine-fcr-standard-card="${key}"]`);
      if(!el&&grid){el=document.createElement("div");el.className="kpi";el.dataset.adineFcrStandardCard=key;el.innerHTML='<b></b><strong></strong><small></small>';after.insertAdjacentElement("afterend",el);}
      if(el){el.querySelector("b").textContent=label;el.querySelector("strong").textContent=fmt(value);el.querySelector("small").textContent=refText;}
    };
    add(weekly,"weekly","استاندارد مدیریتی FCR هفتگی",t.value,officialSource(t));
    if(cum)add(cum,"cumulative","استاندارد رسمی FCR تجمعی",t.cum,officialSource(t));
    return true;
  }
  function patchLegacy(){
    const root=document.getElementById("root"); if(!root)return false;
    const metrics=[...root.querySelectorAll(".metric")];
    const wkMetric=metrics.find(m=>/FCR\s*هفتگی/.test(m.querySelector(".label")?.textContent||""));
    const cumMetric=metrics.find(m=>/FCR\s*تجمعی/.test(m.querySelector(".label")?.textContent||""));
    if(!wkMetric)return false;
    const w=num(document.getElementById("week")?.value); if(w==null)return false;
    const t=targetForWeek(w); if(!t)return false;
    const ref=wkMetric.querySelector(".ref"); if(ref)ref.textContent=`استاندارد مدیریتی FCR هفتگی: ${fmt(t.value)} | ${officialSource(t)}`;
    wkMetric.dataset.managementFcr=String(t.value);
    if(cumMetric){const cref=cumMetric.querySelector(".ref");if(cref)cref.textContent=`استاندارد رسمی FCR تجمعی همان هفته: ${fmt(t.cum)} | ${officialSource(t)}`;cumMetric.dataset.officialCumulativeFcr=String(t.cum);}
    return true;
  }
  function patchCharts(){
    const instances=g.Chart?.instances; if(!instances)return;
    Object.values(instances).forEach(ch=>{try{
      const title=(ch.canvas?.closest?.(".box")?.querySelector("h3")?.textContent||"");
      if(!/FCR/.test(title))return;
      const labels=ch.data?.labels||[]; if(!labels.length)return;
      const weekly=labels.map(label=>targetForWeek(num(String(label).replace(/[^0-9.]/g,"")))?.value??null);
      const cumulative=labels.map(label=>targetForWeek(num(String(label).replace(/[^0-9.]/g,"")))?.cum??null);
      if(!weekly.some(v=>v!=null))return;
      let official=ch.data.datasets.find(ds=>/استاندارد رسمی/.test(String(ds.label||"")));
      if(official){official.label="استاندارد رسمی تجمعی";official.data=cumulative;}
      let mg=ch.data.datasets.find(ds=>ds._adineWeeklyManagementFcr);
      if(!mg){mg={label:"استاندارد مدیریتی هفتگی",data:weekly,borderWidth:2,borderDash:[6,4],pointRadius:2,_adineWeeklyManagementFcr:true};ch.data.datasets.push(mg);}else mg.data=weekly;
      ch.update("none");
    }catch(_){}});
  }
  async function apply(){if(!await load())return;patchV2();patchLegacy();patchCharts();}
  const start=()=>{apply();
    const week=document.getElementById("week"); if(week&&!week.__adineWeeklyFcrBound){week.addEventListener("change",()=>setTimeout(apply,100));week.__adineWeeklyFcrBound=true;}
    const flock=document.getElementById("flock"); if(flock&&!flock.__adineFlockBound){flock.addEventListener("change",()=>{loadedFor=null;standards=[];setTimeout(apply,300);});flock.__adineFlockBound=true;}
    const root=document.getElementById("root")||document.getElementById("weeklyRoot"); if(root&&!root.__adineWeeklyFcrObserver){const ob=new MutationObserver(()=>apply());ob.observe(root,{childList:true,subtree:true});root.__adineWeeklyFcrObserver=ob;}
    setInterval(()=>{patchV2();patchLegacy();patchCharts();},700);
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(typeof window!=="undefined"?window:globalThis);