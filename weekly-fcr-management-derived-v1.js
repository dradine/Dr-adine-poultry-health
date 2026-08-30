/* ADINE POULTRY HEALTH — WEEKLY MANAGEMENT FCR TARGET ONLY */
"use strict";
(function(g){
  const page=String(location.pathname||"").toLowerCase().split("/").pop();
  if(page!=="reports.html"&&page!=="reports-v2.html")return;
  const db=g.supabaseClient;if(!db)return;
  const num=v=>{const x=Number(String(v??"").replace(/[٬,]/g,"").replace("٫","."));return Number.isFinite(x)?x:null;};
  const fmt=v=>v==null?"—":Number(v).toLocaleString("fa-IR",{minimumFractionDigits:3,maximumFractionDigits:3});
  let flock=null,rows=[],loading=false;
  function id(){const p=new URLSearchParams(location.search);return p.get("flock_id")||p.get("flockId")||p.get("id")||null;}
  function official(r,key){try{if(typeof g.resolvePoultryStandard!=="function")return null;const s=g.resolvePoultryStandard({productionType:flock?.production_type,genetics:flock?.genetics,strain:flock?.strain,variant:flock?.variant,ageDays:num(r?.age_days)});const v=num(s?.[key]);return s?.[key+"Source"]==="official"&&v!=null?v:null;}catch(_){return null;}}
  function target(r){
    const w=num(r?.week_number),cw=official(r,"weight"),cf=official(r,"fcr");
    if(w==null||cw==null||cf==null||cw<=0)return null;

    /*
      Management Weekly FCR Target — Ross 308 AP

      Week 1:
        The first week has no preceding weekly interval, so the target is
        exactly the official cumulative FCR at day 7.

      Week 2 onward:
        Weekly target = (CumFeed_end - CumFeed_start)
                        / (Weight_end - Weight_start)

        The official cumulative feed objective is reconstructed from the
        official cumulative FCR and body-weight objective using the same
        convention as the Ross performance table:
          CumFeed = CumFCR * BodyWeight

      This is a derived Management Weekly FCR Target, NOT an official
      weekly FCR published by Aviagen.
    */
    if(w===1)return cf;

    const prev=rows.find(x=>num(x.week_number)===w-1);
    if(!prev)return null;
    const pw=official(prev,"weight"),pf=official(prev,"fcr");
    if(pw==null||pf==null||cw<=pw)return null;

    const feedCumNow=cf*cw;
    const feedCumPrev=pf*pw;
    const weeklyFeed=feedCumNow-feedCumPrev;
    const weeklyGain=cw-pw;
    const v=weeklyFeed/weeklyGain;
    return Number.isFinite(v)&&v>0?v:null;
  }
  function current(){const s=document.getElementById("week");return s&&rows.length?rows[num(s.value)||0]:null;}
  function metric(label){return [...document.querySelectorAll(".metric")].find(x=>String(x.querySelector(".label")?.textContent||"").trim()===label);}
  function setRef(el,text){if(!el)return;let ref=el.querySelector(".ref");if(!ref){ref=document.createElement("div");ref.className="ref";el.appendChild(ref);}ref.textContent=text;}
  function patch(){const r=current();if(!r||!flock||!/broiler|گوشتی|meat/i.test(String(flock.production_type||"")))return;setRef(metric("FCR هفتگی"),`استاندارد مدیریتی هفتگی: ${fmt(target(r))}`);}
  async function load(){if(loading)return;const fid=id();if(!fid)return;loading=true;try{const fr=await db.from("flocks").select("*").eq("id",fid).maybeSingle();if(fr.error||!fr.data)return;flock=fr.data;const wr=await db.from("weekly_records").select("*").eq("flock_id",fid).order("week_number",{ascending:true});if(wr.error)return;rows=wr.data||[];}finally{loading=false;}}
  async function apply(){await load();patch();}
  function start(){apply();const w=document.getElementById("week");if(w&&!w.__adineMgmtFcr){w.addEventListener("change",()=>setTimeout(patch,50));w.__adineMgmtFcr=true;}const root=document.getElementById("root")||document.body;if(root&&!root.__adineMgmtFcrObs){new MutationObserver(()=>patch()).observe(root,{childList:true,subtree:true});root.__adineMgmtFcrObs=true;}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window);