/* ADINE POULTRY HEALTH — SCIENTIFIC WEEKLY MANAGEMENT FCR V2 */
"use strict";
(function(g){
  const page=String(location.pathname||"").toLowerCase().split("/").pop();
  if(page!=="reports.html" && page!=="reports-v2.html") return;
  const client=g.supabaseClient;
  if(!client) return;
  const num=v=>{const x=Number(String(v??"").replace(/[٬,]/g,"").replace("٫","."));return Number.isFinite(x)?x:null;};
  const fmt=v=>v==null?"—":Number(v).toLocaleString("fa-IR",{minimumFractionDigits:3,maximumFractionDigits:3});
  let rows=[],loadedFor=null;
  function flockId(){
    const s=document.getElementById("flock");
    if(s?.value) return s.value;
    try{return localStorage.getItem("selectedFlockId")||localStorage.getItem("activeFlockId")||null;}catch(_){return null;}
  }
  async function load(){
    const id=flockId(); if(!id)return false;
    if(loadedFor===id&&rows.length)return true;
    const {data,error}=await client.rpc("get_flock_fcr_analysis_v3",{p_flock_id:id});
    if(error||!Array.isArray(data)||!data.length)return false;
    rows=data.map(r=>({week:num(r.week_number),weekly:num(r.weekly_fcr),management:num(r.management_weekly_fcr),officialCum:num(r.official_cumulative_fcr),managementCum:num(r.management_cumulative_fcr),source:r.management_source_name||r.source_name||null,year:r.management_source_year||r.source_year||null})).filter(r=>r.week!=null);
    loadedFor=id;return rows.length>0;
  }
  function row(w){return rows.find(r=>r.week===num(w))||null;}
  function kpis(){return [...document.querySelectorAll(".kpi")];}
  function byLabel(text){return kpis().find(x=>text===String(x.querySelector("b")?.textContent||"").trim());}
  function setCard(el,label,value,small){if(!el)return;el.querySelector("b").textContent=label;el.querySelector("strong").textContent=fmt(value);el.querySelector("small").textContent=small||"";}
  function addCard(after,key,label,value,small){
    const grid=after?.parentElement;if(!grid)return;
    let el=grid.querySelector(`[data-adine-fcr-v2="${key}"]`);
    if(!el){el=document.createElement("div");el.className="kpi";el.dataset.adineFcrV2=key;el.innerHTML="<b></b><strong></strong><small></small>";after.insertAdjacentElement("afterend",el);}
    setCard(el,label,value,small);
  }
  function patch(){
    const w=num(document.getElementById("week")?.value);const r=row(w);if(!r)return false;
    const weekly=byLabel("FCR هفتگی");const cumulative=byLabel("FCR تجمعی");
    if(weekly){setCard(weekly,"FCR هفتگی",r.weekly,`استاندارد مدیریتی FCR هفتگی: ${fmt(r.management)} | ${r.source||"Scientific management benchmark"}${r.year?` (${r.year})`:""}`);addCard(weekly,"weekly-standard","استاندارد مدیریتی FCR هفتگی",r.management,`${r.source||"Scientific management benchmark"}${r.year?` (${r.year})`:""}`);}
    if(cumulative){setCard(cumulative,"FCR تجمعی",r.officialCum,`استاندارد رسمی FCR تجمعی: ${fmt(r.officialCum)} | استاندارد رسمی`);addCard(cumulative,"cumulative-standard","استاندارد رسمی FCR تجمعی",r.officialCum,"استاندارد رسمی");}
    return true;
  }
  async function apply(){if(await load())patch();}
  const start=()=>{apply();const w=document.getElementById("week");if(w&&!w.__adineFcrV2){w.addEventListener("change",()=>setTimeout(apply,150));w.__adineFcrV2=true;}const f=document.getElementById("flock");if(f&&!f.__adineFcrV2){f.addEventListener("change",()=>{loadedFor=null;rows=[];setTimeout(apply,250);});f.__adineFcrV2=true;}setInterval(patch,1000);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window);
