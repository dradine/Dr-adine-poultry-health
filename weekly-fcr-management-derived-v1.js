/* ADINE POULTRY HEALTH — WEEKLY MANAGEMENT FCR TARGET ONLY */
"use strict";
(function(g){
  const page=String(location.pathname||"").toLowerCase().split("/").pop();
  if(page!=="reports.html"&&page!=="reports-v2.html")return;
  const db=g.supabaseClient;if(!db)return;
  const num=v=>{const x=Number(String(v??"").replace(/[٬,]/g,"").replace("٫","."));return Number.isFinite(x)?x:null;};
  const fmt=v=>v==null?"—":Number(v).toLocaleString("fa-IR",{minimumFractionDigits:3,maximumFractionDigits:3});
  let flock=null,rows=[],officialByAge=new Map(),targetsByWeek=new Map(),loading=false;
  function id(){const p=new URLSearchParams(location.search);return p.get("flock_id")||p.get("flockId")||p.get("id")||null;}
  function pickOfficial(list,age){
    const candidates=(list||[]).filter(x=>num(x.age_days)===num(age)&&x.source_type==='official'&&x.active!==false);
    if(!candidates.length)return null;
    const exact=candidates.filter(x=>!flock?.strain||String(x.strain||'').trim().toLowerCase()===String(flock.strain||'').trim().toLowerCase());
    const pool=exact.length?exact:candidates;
    const withGen=pool.filter(x=>flock?.genetics&&String(x.genetics||'').trim().toLowerCase()===String(flock.genetics||'').trim().toLowerCase());
    const ranked=(withGen.length?withGen:pool).slice().sort((a,b)=>{
      const av=num(a.target_value),bv=num(b.target_value);
      return (av??Infinity)-(bv??Infinity);
    });
    return ranked[0]?.target_value==null?null:num(ranked[0].target_value);
  }
  function target(r){return targetsByWeek.get(num(r?.week_number))??null;}
  function buildTargets(standards){
    officialByAge=new Map();
    const weights=(standards||[]).filter(x=>x.metric_code==='body_weight');
    const fcrs=(standards||[]).filter(x=>x.metric_code==='fcr_cumulative');
    rows.forEach(r=>{
      const age=num(r.age_days); if(age==null)return;
      const w=pickOfficial(weights,age),f=pickOfficial(fcrs,age);
      if(w!=null&&f!=null)officialByAge.set(age,{weight:w,fcr:f});
    });
    targetsByWeek=new Map();
    const ordered=[...rows].sort((a,b)=>num(a.week_number)-num(b.week_number));
    ordered.forEach(r=>{
      const week=num(r.week_number),cur=officialByAge.get(num(r.age_days));
      if(week==null||!cur)return;
      if(week===1){targetsByWeek.set(week,cur.fcr);return;}
      const prev=ordered.find(x=>num(x.week_number)===week-1);
      const p=prev?officialByAge.get(num(prev.age_days)):null;
      if(!p||cur.weight<=p.weight)return;
      const cumFeedNow=cur.fcr*cur.weight;
      const cumFeedPrev=p.fcr*p.weight;
      const weeklyFeed=cumFeedNow-cumFeedPrev;
      const weeklyGain=cur.weight-p.weight;
      const value=weeklyFeed/weeklyGain;
      if(Number.isFinite(value)&&value>0)targetsByWeek.set(week,value);
    });
  }
  function current(){const s=document.getElementById("week");return s&&rows.length?rows[num(s.value)||0]:null;}
  function metric(label){return [...document.querySelectorAll(".metric")].find(x=>String(x.querySelector(".label")?.textContent||"").trim()===label);}
  function setRef(el,text){if(!el)return;let ref=el.querySelector(".ref");if(!ref){ref=document.createElement("div");ref.className="ref";el.appendChild(ref);}ref.textContent=text;}
  function patch(){
    const r=current();
    if(!r||!flock||!/broiler|گوشتی|meat/i.test(String(flock.production_type||"")))return;
    setRef(metric("FCR هفتگی"),`استاندارد مدیریتی هفتگی: ${fmt(target(r))}`);
    document.querySelectorAll("canvas").forEach(canvas=>{
      const ch=g.Chart?.getChart?.(canvas); if(!ch)return;
      const title=canvas.closest('.box')?.querySelector('h3')?.textContent||'';
      if(!/FCR/.test(title))return;
      const labels=ch.data.labels||[];
      const weekly=labels.map((_,i)=>targetsByWeek.get(i+1)??null);
      let ds=ch.data.datasets.find(d=>String(d.label||'').includes('هدف مدیریتی FCR هفتگی'));
      if(!ds){ds=ch.data.datasets.find(d=>String(d.label||'').includes('استاندارد مدیریتی هفتگی'));}
      if(ds){ds.label='هدف مدیریتی FCR هفتگی';ds.data=weekly;}
      ch.update('none');
    });
  }
  async function load(){
    if(loading)return;
    const fid=id();if(!fid)return;
    loading=true;
    try{
      const fr=await db.from("flocks").select("*").eq("id",fid).maybeSingle();
      if(fr.error||!fr.data)return; flock=fr.data;
      const wr=await db.from("weekly_records").select("*").eq("flock_id",fid).order("week_number",{ascending:true});
      if(wr.error)return; rows=wr.data||[];
      const ages=[...new Set(rows.map(r=>num(r.age_days)).filter(Number.isFinite))];
      if(!ages.length)return;
      const sr=await db.from('poultry_performance_standards').select('age_days,target_value,metric_code,source_type,source_name,strain,genetics,variant,active').eq('production_type','broiler').in('metric_code',['body_weight','fcr_cumulative']).in('age_days',ages).eq('active',true);
      if(sr.error)return; buildTargets(sr.data||[]);
    }finally{loading=false;}
  }
  async function apply(){await load();patch();}
  function start(){
    apply();
    const w=document.getElementById("week");
    if(w&&!w.__adineMgmtFcr){w.addEventListener("change",()=>setTimeout(patch,50));w.__adineMgmtFcr=true;}
    const root=document.getElementById("root")||document.body;
    if(root&&!root.__adineMgmtFcrObs){new MutationObserver(()=>patch()).observe(root,{childList:true,subtree:true});root.__adineMgmtFcrObs=true;}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window);