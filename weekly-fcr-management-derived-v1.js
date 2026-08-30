/* ADINE POULTRY HEALTH — SCIENTIFIC WEEKLY MANAGEMENT FCR V3 */
"use strict";
(function(g){
  const page=String(location.pathname||"").toLowerCase().split("/").pop();
  if(page!=="reports.html" && page!=="reports-v2.html") return;
  const client=g.supabaseClient; if(!client)return;
  const num=v=>{const x=Number(String(v??"").replace(/[٬,]/g,"").replace("٫","."));return Number.isFinite(x)?x:null;};
  const fmt=v=>v==null?"—":Number(v).toLocaleString("fa-IR",{minimumFractionDigits:3,maximumFractionDigits:3});
  function flockId(){
    const s=document.getElementById("flock"); if(s?.value)return s.value;
    const p=new URLSearchParams(location.search); const d=p.get("flock_id")||p.get("flockId")||p.get("id"); if(d)return d;
    try{const o=JSON.parse(localStorage.getItem("adine_poultry_current_selection")||"null");if(o)return o.flockId||o.flock_id||null;}catch(_){ }
    try{return localStorage.getItem("selectedFlockId")||localStorage.getItem("activeFlockId")||null;}catch(_){return null;}
  }
  let standards=[],loadedFor=null;
  async function load(){
    const id=flockId();if(!id)return false;if(loadedFor===id&&standards.length)return true;
    const {data:f,error:fe}=await client.from("flocks").select("id,production_type,genetics,strain").eq("id",id).maybeSingle();
    if(fe||!f||!/broiler|گوشتی|meat/i.test(String(f.production_type||"")))return false;
    const {data,error}=await client.rpc("get_broiler_weekly_management_fcr",{p_strain:f.strain,p_genetics:f.genetics||null});
    if(error||!Array.isArray(data)||!data.length)return false;
    standards=data.map(x=>({week:num(x.week_number),age:num(x.age_days),target:num(x.weekly_fcr),officialCum:num(x.cumulative_fcr),source:x.source_name,year:x.source_year,method:x.method})).filter(x=>x.week!=null&&x.target!=null&&x.officialCum!=null);
    loadedFor=id;return !!standards.length;
  }
  const target=w=>standards.find(x=>x.week===num(w))||null;
  function week(){return num(document.getElementById("week")?.value)||num(new URLSearchParams(location.search).get("week"));}
  function kpi(label){return [...document.querySelectorAll(".kpi")].find(x=>new RegExp(label).test(x.querySelector("b")?.textContent||""));}
  function actualValue(el){
    if(!el)return null;
    const nodes=[...el.querySelectorAll("strong,.value,[data-value],span")];
    for(const n of nodes){const v=num(n.textContent);if(v!=null)return v;}
    return num(el.textContent);
  }
  function source(t){return `${t?.source||"Ross Broiler Performance Objectives"} (${t?.year||"—"})`;}
  function classify(actual,t){
    if(actual==null||!t)return null;
    const d=actual-t.target, pct=(d/t.target)*100;
    // Lower FCR is better. Thresholds are deliberately expressed relative to the weekly target.
    if(pct<=2)return {status:"مطلوب",className:"good",delta:d,pct};
    if(pct<=5)return {status:"قابل پیگیری",className:"warn",delta:d,pct};
    return {status:"نیازمند بررسی",className:"bad",delta:d,pct};
  }
  function patch(){
    const w=week(),t=target(w);if(!t)return false;
    const weekly=kpi("FCR هفتگی"),cum=kpi("FCR تجمعی");
    if(weekly){
      weekly.dataset.managementFcrTarget=String(t.target);
      const small=weekly.querySelector("small");if(small)small.textContent=`هدف مدیریتی FCR هفتگی: ${fmt(t.target)} | ${source(t)}`;
      let ev=weekly.querySelector("[data-adine-fcr-evaluation]");if(!ev){ev=document.createElement("div");ev.dataset.adineFcrEvaluation="true";ev.style.fontSize="12px";ev.style.marginTop="4px";weekly.appendChild(ev);}
      const a=actualValue(weekly),c=classify(a,t);
      if(c)ev.textContent=`انحراف از هدف: ${c.delta>=0?"+":""}${fmt(c.delta)} (${c.pct>=0?"+":""}${c.pct.toFixed(1)}٪) — ${c.status}`;
    }
    if(cum){
      cum.dataset.officialCumulativeFcr=String(t.officialCum);
      const small=cum.querySelector("small");if(small)small.textContent=`استاندارد رسمی FCR تجمعی تا روز ${t.age}: ${fmt(t.officialCum)} | ${source(t)}`;
    }
    // Existing duplicate standard cards are updated, not added repeatedly.
    const cards=[...document.querySelectorAll('[data-adine-fcr-standard-card]')];
    cards.forEach(card=>{const key=card.dataset.adineFcrStandardCard;const b=card.querySelector("b"),s=card.querySelector("strong"),sm=card.querySelector("small");if(key==="weekly"){if(b)b.textContent="هدف مدیریتی FCR هفتگی";if(s)s.textContent=fmt(t.target);if(sm)sm.textContent=`مشتق‌شده علمی از اهداف رسمی عملکرد — ${source(t)}`;}if(key==="cumulative"){if(b)b.textContent="استاندارد رسمی FCR تجمعی";if(s)s.textContent=fmt(t.officialCum);if(sm)sm.textContent=`استاندارد رسمی در سن ${t.age} روز — ${source(t)}`;}});
    return true;
  }
  async function apply(){if(await load())patch();}
  function start(){apply();const w=document.getElementById("week");if(w&&!w.__adineFcr){w.addEventListener("change",()=>setTimeout(apply,100));w.__adineFcr=true;}const f=document.getElementById("flock");if(f&&!f.__adineFcr){f.addEventListener("change",()=>{loadedFor=null;standards=[];setTimeout(apply,200);});f.__adineFcr=true;}const r=document.getElementById("root")||document.body;if(r&&!r.__adineFcrObs){new MutationObserver(()=>patch()).observe(r,{childList:true,subtree:true});r.__adineFcrObs=true;}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window);