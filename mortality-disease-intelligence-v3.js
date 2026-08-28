"use strict";

/*
 ADINEH - MORTALITY / DISEASE INTELLIGENCE V3
 Isolated enhancement: does not replace mortality.js and does not change
 existing calculation/storage contracts. It reads the existing flock,
 risk-profile and surveillance views and adds a clinical decision-support layer.
*/
(function(){
  const TYPE_LABEL={broiler:"گوشتی",pullet:"پولت",layer:"تخمگذار",breeder:"مادر","گوشتی":"گوشتی","پولت":"پولت","تخمگذار":"تخمگذار","مادر":"مادر"};
  const LEVEL={critical:{label:"بحرانی",cls:"danger"},high:{label:"هشدار بالا",cls:"danger"},monitor:{label:"نیازمند پایش",cls:"warning"},review:{label:"نیازمند بررسی",cls:"warning"},normal:{label:"عادی",cls:"success"}};
  let riskRows=[];
  let surveillanceRows=[];

  document.addEventListener("DOMContentLoaded",()=>setTimeout(init,900));

  async function init(){
    try{
      if(!window.supabaseClient || !window.healthFlock) return;
      const type=normalizeType(window.healthFlock.production_type);
      await loadRisk(type);
      await loadSurveillance(window.healthFlock.id);
      enhanceDiseaseSelects();
      renderOverview(type);
      renderClinicalDecisionSupport();
    }catch(e){console.error("Mortality intelligence v3:",e);}
  }

  function normalizeType(v){
    const s=String(v||"").trim().toLowerCase();
    if(["broiler","broilers","گوشتی"].includes(s)) return "broiler";
    if(["pullet","پولت"].includes(s)) return "pullet";
    if(["layer","layers","تخمگذار","تخم گذار"].includes(s)) return "layer";
    if(["breeder","breeders","مادر"].includes(s)) return "breeder";
    return s;
  }

  async function loadRisk(type){
    if(!type) return;
    const r=await supabaseClient.from("health_active_disease_risk_by_type").select("production_type,monitoring_priority,syndrome,mortality_relevance,code,name_fa,early_warning_signs,diagnostic_note,source_note").eq("production_type",type).order("monitoring_priority").order("name_fa");
    if(!r.error) riskRows=r.data||[];
  }

  async function loadSurveillance(flockId){
    const r=await supabaseClient.from("health_mortality_surveillance").select("*").eq("flock_id",flockId).order("week_number",{ascending:false}).limit(16);
    if(!r.error) surveillanceRows=r.data||[];
  }

  function enhanceDiseaseSelects(){
    ["suspectedDisease","confirmedDisease"].forEach(id=>{
      const el=document.getElementById(id); if(!el||!riskRows.length) return;
      const current=el.value;
      const opts=[...el.options];
      const rank=new Map(riskRows.map((x,i)=>[String(x.name_fa||"").trim(),i]));
      opts.slice(1).sort((a,b)=>{
        const ar=rank.has(a.textContent.trim())?rank.get(a.textContent.trim()):9999;
        const br=rank.has(b.textContent.trim())?rank.get(b.textContent.trim()):9999;
        return ar-br || a.textContent.localeCompare(b.textContent,"fa");
      }).forEach(o=>el.appendChild(o));
      el.value=current;
    });
  }

  function renderOverview(type){
    const host=document.getElementById("healthOverview"); if(!host) return;
    document.getElementById("mortalityRiskV3")?.remove();
    document.getElementById("mortalitySurveillanceV3")?.remove();

    // Keep the overview intentionally quiet when there is no event data.
    // The four KPI cards above already communicate zero counts; repeating them
    // here adds noise without adding clinical value.
    if(!surveillanceRows.length){
      const box=document.createElement("div");
      box.id="mortalitySurveillanceV3";
      box.className="report-box";
      box.innerHTML=`<strong>🟢 وضعیت سلامت گله</strong><div style="margin-top:8px">تاکنون رخداد سلامت برای این گله ثبت نشده است.</div><div class="form-help">با ثبت اولین رخداد، روند تلفات، تغییرات هفتگی و سیگنال‌های پایش در همین بخش نمایش داده می‌شود.</div>`;
      host.appendChild(box);
      return;
    }

    const latest=surveillanceRows[0];
    const meta=LEVEL[latest.surveillance_level]||LEVEL.normal;
    const box=document.createElement("div");
    box.id="mortalitySurveillanceV3";
    box.className="report-box";
    const ratio=latest.mortality_ratio_vs_previous_week==null?"بدون خط مبنای هفته قبل":`${num(latest.mortality_ratio_vs_previous_week)} برابر هفته قبل`;
    box.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>🧠 تحلیل سلامت گله</strong><span class="badge badge-${meta.cls}">${meta.label}</span></div><div class="form-help" style="margin-top:8px">هفته ${num(latest.week_number)} · نرخ تلفات ${pct(latest.mortality_percent_of_snapshot)} · ${ratio}</div><div style="margin-top:9px">${esc(latest.surveillance_message||"")}</div>${buildTrendTable()}</div>`;
    host.appendChild(box);
  }

  function buildTrendTable(){
    const rows=surveillanceRows.slice(0,6);
    if(!rows.length) return "";
    return `<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">📈 مشاهده روند اخیر</summary><div class="table-wrapper" style="margin-top:9px"><table class="data-table"><thead><tr><th>هفته</th><th>تلفات</th><th>حذفی</th><th>درگیر</th><th>نرخ تلفات</th><th>وضعیت</th></tr></thead><tbody>${rows.map(r=>{const m=LEVEL[r.surveillance_level]||LEVEL.normal;return `<tr><td>${num(r.week_number)}</td><td>${num(r.mortality_count)}</td><td>${num(r.cull_count)}</td><td>${num(r.affected_count)}</td><td>${pct(r.mortality_percent_of_snapshot)}</td><td><span class="badge badge-${m.cls}">${m.label}</span></td></tr>`;}).join("")}</tbody></table></div></details>`;
  }

  function renderClinicalDecisionSupport(){
    const panel=document.getElementById("panel-clinical"); if(!panel) return;
    document.getElementById("mortalityClinicalV3")?.remove();
    if(!surveillanceRows.length && !riskRows.length) return;
    const box=document.createElement("div");
    box.id="mortalityClinicalV3";
    box.className="report-box";
    const critical=surveillanceRows.find(x=>x.surveillance_level==="critical");
    const steps=critical?["رخداد و روند تلفات را همان روز بررسی و مستندسازی کنید.","در صورت اندیکاسیون، پرندگان تازه تلف‌شده را کالبدگشایی کنید.","در صورت نیاز، نمونه مناسب را برای آزمایش تشخیصی ارسال و نتیجه را به همان رخداد متصل کنید.","اقدامات کنترلی و پیگیری بعدی را در پرونده ثبت کنید."]:["در صورت افزایش غیرعادی تلفات، علائم و یافته‌های کالبدگشایی را مستندسازی کنید.","تشخیص افتراقی را با توجه به تیپ پرورشی و سندرم بالینی محدود کنید.","در صورت نیاز نمونه‌برداری و آزمایش را در پرونده همان رخداد ثبت کنید."];
    box.innerHTML=`<strong>🩺 مسیر تصمیم‌گیری سلامت گله</strong><ol style="margin:10px 0 0;padding-right:20px">${steps.map(x=>`<li style="margin:6px 0">${esc(x)}</li>`).join("")}</ol><div class="form-help">این بخش ابزار کمک‌تصمیم‌گیری و مستندسازی است و جایگزین تشخیص دامپزشکی نیست.</div>`;
    panel.prepend(box);
  }

  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function num(v){return Number(v||0).toLocaleString("fa-IR");}
  function pct(v){return Number(v||0).toLocaleString("fa-IR",{maximumFractionDigits:3})+"٪";}
})();
