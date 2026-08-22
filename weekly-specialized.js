/*
 ADINE POULTRY HEALTH CENTER
 SPECIALIZED WEEKLY MONITORING ENGINE
 - Dynamic KPI form by production type
 - Weekly feed/water
 - Cumulative conversion
 - Layer / pullet / breeder metrics
 - Persian UI, no dependency on extra libraries
*/
"use strict";

const WEEKLY_SPECIALIZED_FIELDS = {
  common: [
    ["avg_temp_c","میانگین دمای سالن","°C","number"],
    ["relative_humidity_pct","رطوبت نسبی","%","number"],
    ["ammonia_ppm","آمونیاک","ppm","number"],
    ["water_quality_note","وضعیت آب","توضیح","text"],
    ["health_alert","رخداد/هشدار سلامت","توضیح","text"]
  ],
  broiler: [],
  pullet: [
    ["light_hours","ساعات روشنایی","ساعت","number"],
    ["light_intensity_lux","شدت نور","lux","number"],
    ["feed_form","شکل دان","توضیح","text"],
    ["vaccine_event","واکسیناسیون/یادآوری","توضیح","text"]
  ],
  layer: [
    ["egg_count","تعداد تخم هفتگی","عدد","number"],
    ["hen_day_pct","تولید Hen-Day","%","number"],
    ["hen_housed_pct","تولید Hen-Housed","%","number"],
    ["egg_weight_g","میانگین وزن تخم","g","number"],
    ["egg_mass_kg","Egg Mass هفتگی","kg","number"],
    ["dirty_eggs_pct","تخم کثیف","%","number"],
    ["cracked_eggs_pct","تخم شکسته","%","number"],
    ["floor_eggs_pct","تخم کف","%","number"],
    ["eggs_per_hen","تخم/مرغ","عدد","number"],
    ["haugh_unit","Haugh Unit","HU","number"],
    ["shell_strength","استحکام پوسته","kgf","number"],
    ["molt_status","وضعیت تولک","توضیح","text"]
  ],
  breeder: [
    ["female_egg_count","تعداد تخم ماده‌ها","عدد","number"],
    ["hen_day_pct","تولید Hen-Day","%","number"],
    ["egg_weight_g","میانگین وزن تخم","g","number"],
    ["egg_mass_kg","Egg Mass هفتگی","kg","number"],
    ["hatching_egg_pct","تخم قابل جوجه‌کشی","%","number"],
    ["floor_eggs_pct","تخم کف","%","number"],
    ["dirty_eggs_pct","تخم کثیف","%","number"],
    ["cracked_eggs_pct","تخم شکسته","%","number"],
    ["male_count","تعداد خروس","عدد","number"],
    ["male_weight_g","میانگین وزن خروس","g","number"],
    ["male_female_ratio","نسبت خروس به ماده","%","number"],
    ["male_mortality","تلفات خروس","عدد","number"],
    ["fertility_pct","نطفه‌داری","%","number"],
    ["hatchability_pct","جوجه‌درآوری","%","number"],
    ["chicks_per_hen","جوجه/مرغ مادر","عدد","number"],
    ["spiking_status","Spiking","توضیح","text"],
    ["spiking_date","تاریخ Spike","شمسی","text"],
    ["molt_status","وضعیت تولک","توضیح","text"],
    ["light_hours","ساعات روشنایی","ساعت","number"],
    ["light_intensity_lux","شدت نور","lux","number"]
  ]
};

function weeklySpecializedType(flock){
  const t=String(flock?.production_type||flock?.productionType||"broiler").toLowerCase();
  if(t==="گوشتی") return "broiler";
  if(t==="تخمگذار"||t==="تخم‌گذار") return "layer";
  if(t==="پولت") return "pullet";
  if(t==="مادر"||t==="مرغ مادر") return "breeder";
  return t;
}
function weeklyFieldLabel(key){
  const all=[...WEEKLY_SPECIALIZED_FIELDS.common,...WEEKLY_SPECIALIZED_FIELDS.broiler,...WEEKLY_SPECIALIZED_FIELDS.pullet,...WEEKLY_SPECIALIZED_FIELDS.layer,...WEEKLY_SPECIALIZED_FIELDS.breeder];
  return all.find(x=>x[0]===key)?.[1]||key;
}
function renderWeeklySpecializedFields(flock){
  const card=document.getElementById("specializedMetricsCard");
  const host=document.getElementById("specializedMetrics");
  const intro=document.getElementById("specializedMetricsIntro");
  if(!card||!host) return;
  const type=weeklySpecializedType(flock);
  const fields=[...WEEKLY_SPECIALIZED_FIELDS.common,...(WEEKLY_SPECIALIZED_FIELDS[type]||[])];
  const labels={
    broiler:"پایش گوشتی: تمرکز بر رشد، دان، آب، FCR، تلفات و یکنواختی.",
    pullet:"پایش پولت: تمرکز بر وزن هدف، یکنواختی، دان، آب، نور، واکسیناسیون و آماده‌سازی گله.",
    layer:"پایش تخم‌گذار: تمرکز بر تولید، وزن تخم، Egg Mass، مصرف دان/آب و کیفیت تخم.",
    breeder:"پایش مادر: ماده، نر، تخم جوجه‌کشی، باروری، هچ، Spike، تولک و نور."
  };
  intro.textContent=labels[type]||"شاخص‌های تخصصی این گله.";
  host.innerHTML=`<div class="form-grid">${
    fields.map(([id,label,unit,kind])=>`
      <div class="form-group">
        <label for="wm_${id}">${label} <span>(${unit})</span></label>
        <input id="wm_${id}" data-weekly-specialized="${id}" type="${kind==="text"?"text":"text"}" inputmode="${kind==="number"?"decimal":"text"}" autocomplete="off">
      </div>`).join("")
  }</div>
  <div class="info-box" style="margin-top:12px">
    فیلدهای بدون مقدار اجباری نیستند؛ فقط شاخص‌هایی را ثبت کنید که در فارم اندازه‌گیری می‌شوند.
  </div>`;
  card.style.display="block";
  host.querySelectorAll("[data-weekly-specialized]").forEach(input=>{
    input.addEventListener("input",()=>{ if(input.type==="text"&&input.inputMode==="decimal") input.value=normalizeWeeklyDigits(input.value); });
  });
}
function normalizeWeeklyDigits(v){
  return String(v??"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/,/g,"").replace(/٬/g,"");
}
function getWeeklySpecializedMetrics(){
  const out={};
  document.querySelectorAll("[data-weekly-specialized]").forEach(input=>{
    const key=input.dataset.weeklySpecialized;
    const raw=String(input.value||"").trim();
    if(!raw) return;
    if(input.inputMode==="decimal"){
      const n=Number(normalizeWeeklyDigits(raw));
      if(Number.isFinite(n)) out[key]=n;
    }else out[key]=raw;
  });
  return out;
}
function loadWeeklySpecializedMetrics(metrics){
  const data=(metrics&&typeof metrics==="object")?metrics:{};
  document.querySelectorAll("[data-weekly-specialized]").forEach(input=>{
    const key=input.dataset.weeklySpecialized;
    input.value=data[key]??"";
  });
}
function clearWeeklySpecializedMetrics(){
  document.querySelectorAll("[data-weekly-specialized]").forEach(input=>input.value="");
}

function calculateWeeklySpecializedDerived(metrics, flock, previousRecords) {
  const out={...(metrics||{})};
  const type=weeklySpecializedType(flock);
  const rows=Array.isArray(previousRecords)?previousRecords:[];
  const live=Number(out.live_birds||flock?.live_birds||0);

  if((type==='layer'||type==='breeder') && out.egg_mass_kg==null){
    const eggs=Number(out.egg_count??out.female_egg_count??0);
    const eggWeight=Number(out.egg_weight_g||0);
    if(eggs>0 && eggWeight>0) out.egg_mass_kg=Number((eggs*eggWeight/1000).toFixed(3));
  }
  if((type==='layer'||type==='breeder') && out.hen_day_pct==null && live>0){
    const eggs=Number(out.egg_count??out.female_egg_count??0);
    if(eggs>0) out.hen_day_pct=Number((eggs/(live*7)*100).toFixed(3));
  }
  if(type==='layer' && out.hen_housed_pct==null && live>0){
    const eggs=Number(out.egg_count||0);
    if(eggs>0) out.hen_housed_pct=Number((eggs/(live*7)*100).toFixed(3));
  }
  if(type==='breeder' && out.hatching_egg_pct==null && Number(out.female_egg_count)>0 && Number(out.hatching_egg_count)>0){
    out.hatching_egg_pct=Number((Number(out.hatching_egg_count)/Number(out.female_egg_count)*100).toFixed(3));
  }
  return out;
}

function calculateWeeklyCumulativeConversion(records,current,type){
  const rows=Array.isArray(records)?[...records]:[];
  const currentFeed=Number(current?.feed_total_kg||0);
  if(currentFeed<=0) return null;
  const all=[...rows.filter(r=>String(r.id)!==String(current?.id)),current].sort((a,b)=>Number(a.week_number)-Number(b.week_number));
  const t=weeklySpecializedType({production_type:type});
  const first=all.find(r=>Number(r.average_weight_g)>0);
  if(!first) return null;
  const feed=all.reduce((sum,r)=>sum+Number(r.feed_total_kg||0),0);
  if(t==="layer"||t==="breeder"){
    const eggMass=all.reduce((sum,r)=>sum+Number(r.production_metrics?.egg_mass_kg||0),0);
    return eggMass>0?Number((feed/eggMass).toFixed(3)):null;
  }
  const last=all[all.length-1];
  const birds0=Number(first.live_birds||0), birdsn=Number(last.live_birds||0);
  const w0=Number(first.average_weight_g||0), wn=Number(last.average_weight_g||0);
  if(!birds0||!birdsn||!w0||!wn) return null;
  const gainKg=(birdsn*wn-birds0*w0)/1000;
  return gainKg>0?Number((feed/gainKg).toFixed(3)):null;
}
function validateSpecializedMetrics(type,metrics){
  const percentKeys=["hen_day_pct","hen_housed_pct","dirty_eggs_pct","cracked_eggs_pct","floor_eggs_pct","hatching_egg_pct","fertility_pct","hatchability_pct","male_female_ratio"];
  for(const k of percentKeys){
    if(metrics[k]!=null&&(metrics[k]<0||metrics[k]>100)) return `${weeklyFieldLabel(k)} باید بین ۰ تا ۱۰۰ باشد.`;
  }
  if(metrics.egg_weight_g!=null&&metrics.egg_weight_g<=0) return "وزن تخم باید بزرگ‌تر از صفر باشد.";
  if(metrics.egg_mass_kg!=null&&metrics.egg_mass_kg<0) return "Egg Mass نمی‌تواند منفی باشد.";
  return null;
}
async function closeCurrentFlockPeriod(){
  if(!window.currentFlockForSpecialized) {
    alert("گله فعال پیدا نشد."); return;
  }
  const flock=window.currentFlockForSpecialized;
  if(String(flock.status||"active").toLowerCase()==="closed"){
    alert("این دوره قبلاً بسته شده است."); return;
  }
  const ok=confirm(`آیا از بستن دوره گله «${flock.flock_name||flock.flockName||""}» مطمئن هستید؟\nپس از بستن، ثبت و ویرایش هفتگی متوقف می‌شود.`);
  if(!ok) return;
  const typed=prompt("برای تأیید، عبارت «بستن دوره» را وارد کنید:");
  if(typed!=="بستن دوره"){ alert("عملیات لغو شد."); return; }
  const {error}=await supabaseClient.from("flocks").update({status:"closed",closed_at:new Date().toISOString(),closed_by:currentUser.id}).eq("id",flock.id).eq("owner_id",currentUser.id);
  if(error){console.error(error);alert("بستن دوره انجام نشد:\n"+error.message);return;}
  flock.status="closed";
  alert("دوره با موفقیت بسته شد. برای بایگانی، از گزارش دوره استفاده کنید.");
  location.reload();
}
window.WEEKLY_SPECIALIZED_FIELDS=WEEKLY_SPECIALIZED_FIELDS;
window.getWeeklySpecializedMetrics=getWeeklySpecializedMetrics;
window.loadWeeklySpecializedMetrics=loadWeeklySpecializedMetrics;
window.clearWeeklySpecializedMetrics=clearWeeklySpecializedMetrics;
window.calculateWeeklyCumulativeConversion=calculateWeeklyCumulativeConversion;
window.calculateWeeklySpecializedDerived=calculateWeeklySpecializedDerived;
window.validateSpecializedMetrics=validateSpecializedMetrics;
window.closeCurrentFlockPeriod=closeCurrentFlockPeriod;
document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>{
    if(window.currentFlockForSpecialized) renderWeeklySpecializedFields(window.currentFlockForSpecialized);
  },100);
});
