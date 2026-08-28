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
      renderRiskPanel(type);
      renderSurveillance();
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
      const rank=new Map(riskRows.map((x,i)=>[x.name_fa,i]));
      opts.slice(1).sort((a,b)=>{
        const ar=rank.has(a.textContent)?rank.get(a.textContent):9999;
        const br=rank.has(b.textContent)?rank.get(b.textContent):9999;
        return ar-br || a.textContent.localeCompare(b.textContent,"fa");
      }).forEach(o=>el.appendChild(o));
      el.value=current;
    });
  }

  function renderRiskPanel(type){
    const host=document.getElementById("healthOverview"); if(!host) return;
    let box=document.getElementById("mortalityRiskV3");
    if(!box){box=document.createElement("div");box.id="mortalityRiskV3";box.className="report-box";host.appendChild(box);}
    const label=TYPE_LABEL[type]||type||"گله";
    const high=riskRows.filter(x=>x.monitoring_priority==="high"||x.monitoring_priority==="critical");
    const rows=(high.length?high:riskRows.slice(0,8)).map(x=>`<span class="badge">${esc(x.name_fa||x.code)}${x.mortality_relevance?" · تلفات":""}</span>`).join(" ");
    box.innerHTML=`<strong>پروفایل پایش بیماری — ${esc(label)}</strong><div class="form-help">این فهرست برای اولویت‌بندی پایش است و به معنی تشخیص بیماری نیست.</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">${rows||"<span class='form-help'>پروفایل اختصاصی ثبت نشده است.</span>"}</div>`;
  }

  function renderSurveillance(){
    const host=document.getElementById("healthOverview"); if(!host) return;
    let box=document.getElementById("mortalitySurveillanceV3");
    if(!box){box=document.createElement("div");box.id="mortalitySurveillanceV3";box.className="report-box";host.appendChild(box);}
    if(!surveillanceRows.length){box.innerHTML="<strong>پایش روند تلفات</strong><div class='form-help'>برای این گله هنوز داده هفتگی کافی برای تحلیل روند وجود ندارد.</div>";return;}
    const r=surveillanceRows[0], meta=LEVEL[r.surveillance_level]||LEVEL.normal;
    const ratio=r.mortality_ratio_vs_previous_week==null?"—":num(r.mortality_ratio_vs_previous_week)+" برابر";
    box.innerHTML=`<strong>پایش روند تلفات</strong><div style="margin-top:8px"><span class="badge badge-${meta.cls}">${meta.label}</span></div><div class="form-help" style="margin-top:8px">هفته ${num(r.week_number)} · تلفات ${pct(r.mortality_percent_of_snapshot)} · نسبت به هفته قبل ${ratio}</div><div style="margin-top:8px">${esc(r.surveillance_message||"")}</div><div class="form-help" style="margin-top:8px">سیگنال پایش است و جایگزین تشخیص دامپزشکی نیست.</div>`;
  }

  function renderClinicalDecisionSupport(){
    const panel=document.getElementById("panel-clinical"); if(!panel) return;
    let box=document.getElementById("mortalityClinicalV3");
    if(!box){box=document.createElement("div");box.id="mortalityClinicalV3";box.className="report-box";panel.prepend(box);}
    const critical=surveillanceRows.find(x=>x.surveillance_level==="critical");
    const steps=critical?["مرگ/بیماری را در همان روز ثبت و روند تلفات را کنترل کنید.","کالبدگشایی پرندگان تازه تلف‌شده را در صورت اندیکاسیون انجام دهید.","نوع، تعداد و زمان نمونه‌ها را ثبت کنید و در صورت نیاز آزمایش تشخیصی انجام دهید.","اقدامات کنترلی و پیگیری بعدی را در پرونده همان رخداد ثبت کنید."]:["در صورت افزایش غیرعادی تلفات، کالبدگشایی و بررسی علائم را مستندسازی کنید.","تشخیص افتراقی را با توجه به تیپ پرورشی و سندرم بالینی محدود کنید.","در صورت نیاز نمونه‌برداری و آزمایش را در پرونده همان رخداد ثبت کنید."];
    box.innerHTML=`<strong>مسیر تصمیم‌گیری سلامت گله</strong><ol style="margin:10px 0 0;padding-right:20px">${steps.map(x=>`<li style="margin:6px 0">${esc(x)}</li>`).join("")}</ol><div class="form-help">راهنمای سیستم: ثبت رخداد، علائم، کالبدگشایی، آزمایش و پیگیری را به یک پرونده متصل نگه دارید.</div>`;
  }

  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function num(v){return Number(v||0).toLocaleString("fa-IR");}
  function pct(v){return Number(v||0).toLocaleString("fa-IR",{maximumFractionDigits:3})+"٪";}
})();
