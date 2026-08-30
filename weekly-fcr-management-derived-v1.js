/* ADINE POULTRY HEALTH — SCIENTIFIC WEEKLY MANAGEMENT FCR V1 */
"use strict";
(function(g){
  const page=String(location.pathname||"").toLowerCase().split("/").pop();
  if(page!=="reports.html") return;
  const client=g.supabaseClient;
  if(!client) return;
  const num=v=>{const x=Number(String(v??"").replace(/[٬,]/g,"").replace("٫","."));return Number.isFinite(x)?x:null;};
  const fmt=v=>v==null?"—":Number(v).toLocaleString("fa-IR",{minimumFractionDigits:3,maximumFractionDigits:3});
  function flockId(){
    const p=new URLSearchParams(location.search); const direct=p.get("flock_id")||p.get("flockId")||p.get("id");
    if(direct)return direct;
    try{const raw=localStorage.getItem("adine_poultry_current_selection");if(raw){const o=JSON.parse(raw);return o?.flockId||o?.flock_id||null;}}catch(_){ }
    return null;
  }
  let standards=[], loaded=false;
  async function load(){
    if(loaded)return true;
    const id=flockId(); if(!id)return false;
    const {data:flock,error:fe}=await client.from("flocks").select("id,production_type,genetics,strain,sex,variant").eq("id",id).maybeSingle();
    if(fe||!flock||!/broiler|گوشتی|meat/i.test(String(flock.production_type||"")))return false;
    const {data,error}=await client.rpc("get_broiler_weekly_management_fcr",{p_strain:flock.strain,p_genetics:flock.genetics||null});
    if(error||!Array.isArray(data)||!data.length)return false;
    standards=data.map(x=>({week:num(x.week_number),age:num(x.age_days),value:num(x.weekly_fcr),cum:num(x.cumulative_fcr),source:x.source_name,year:x.source_year,method:x.method})).filter(x=>x.week&&x.value!=null);
    loaded=true; return true;
  }
  function targetForWeek(w){return standards.find(x=>x.week===num(w))||null;}
  function patchCards(){
    const root=document.getElementById("root"); if(!root)return;
    const metrics=[...root.querySelectorAll(".metric")];
    const wkMetric=metrics.find(m=>/FCR\s*هفتگی/.test(m.querySelector(".label")?.textContent||""));
    if(!wkMetric)return;
    const weekSel=document.getElementById("week"),w=num(weekSel?.value); if(w==null)return;
    const t=targetForWeek(w); if(!t)return;
    const ref=wkMetric.querySelector(".ref"); if(ref){ref.textContent=`استاندارد مدیریتی هفتگی: ${fmt(t.value)} | ${t.source||"مرجع رسمی Performance Objectives"} (${t.year||"—"})`;}
    wkMetric.dataset.managementFcr=String(t.value);
  }
  function patchCharts(){
    const instances=g.Chart?.instances; if(!instances)return;
    Object.values(instances).forEach(ch=>{
      try{
        const box=ch.canvas?.closest?.(".box"); if(!box)return;
        const title=box.querySelector("h3")?.textContent||""; if(!/FCR/.test(title))return;
        const labels=ch.data?.labels||[]; if(!labels.length)return;
        const targets=labels.map(label=>targetForWeek(num(String(label).replace(/[^0-9.]/g,"")))?.value??null);
        if(!targets.some(v=>v!=null))return;
        let official=ch.data.datasets.find(ds=>/استاندارد رسمی/.test(String(ds.label||"")));
        if(!official)return;
        if(!official._adineOfficialFcr){official._adineOfficialFcr=true;official.label="استاندارد رسمی تجمعی";}
        let mg=ch.data.datasets.find(ds=>ds._adineWeeklyManagementFcr);
        if(!mg){mg={label:"استاندارد مدیریتی هفتگی",data:targets,borderWidth:2,borderDash:[6,4],pointRadius:2,_adineWeeklyManagementFcr:true};ch.data.datasets.splice(2,0,mg);}else mg.data=targets;
        ch.update("none");
      }catch(_){ }
    });
  }
  async function apply(){if(!await load())return;patchCards();patchCharts();}
  const start=()=>{apply();const root=document.getElementById("root");if(root&&!root.__adineWeeklyFcrObserver){const ob=new MutationObserver(()=>apply());ob.observe(root,{childList:true,subtree:true});root.__adineWeeklyFcrObserver=ob;}const w=document.getElementById("week");if(w&&!w.__adineWeeklyFcrBound){w.addEventListener("change",()=>setTimeout(apply,50));w.__adineWeeklyFcrBound=true;}setInterval(()=>{if(loaded){patchCards();patchCharts();}},700);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(typeof window!=="undefined"?window:globalThis);