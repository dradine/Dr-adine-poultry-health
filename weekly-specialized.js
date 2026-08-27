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
    ["avg_temp_c","میانگین دمای سالن","°C","number","پایش روزانه؛ مقدار هفتگی نماینده ثبت شود"],
    ["relative_humidity_pct","رطوبت نسبی","%","number","رطوبت را در سطح پرنده و چند نقطه سالن بررسی کنید"],
    ["ammonia_ppm","آمونیاک","ppm","number","بهتر است با آمونیاک‌متر اندازه‌گیری شود"],
    ["co2_ppm","CO₂","ppm","number","در سالن‌های بسته، شاخص مهم تهویه"],
    ["litter_moisture_pct","رطوبت بستر","%","number","برآورد/اندازه‌گیری بخش نماینده سالن"],
    ["water_quality_note","وضعیت آب","توضیح","text","شفافیت، بو، رسوب، فشار و وضعیت خطوط"],
    ["health_alert","رخداد یا هشدار سلامت","توضیح","text","هر تغییر غیرعادی را کوتاه ثبت کنید"],
    ["management_note","ملاحظه مدیریتی هفته","توضیح","text","تهویه، دان، آب، نور، تراکم یا رفتار گله"]
  ],
  broiler: [
    ["water_feed_ratio","نسبت آب به دان","L/kg","number","شاخص سریع برای کشف تغییر مصرف آب"],
    ["dead_bird_avg_weight_g","میانگین وزن پرندگان تلف‌شده","g","number","اختیاری؛ برای محاسبه علمی FCR اصلاح‌شده با تلفات استفاده می‌شود"],
    ["feed_form","شکل دان","توضیح","text","آردی/کرامبل/پلت و تغییرات کیفی"],
    ["litter_score","امتیاز بستر","0–5","number","۰ عالی؛ ۵ بسیار نامطلوب"],
    ["footpad_score","امتیاز کف پا","0–2","number","شاخص رفاه/بستر"],
    ["behavior_note","رفتار گله","توضیح","text","پخش یکنواخت، تجمع، تنفس دهانی و فعالیت"]
  ],
  pullet: [
    ["light_hours","ساعات روشنایی","ساعت","number","برنامه نوری باید با سن و سویه مقایسه شود"],
    ["light_intensity_lux","شدت نور","lux","number","در ارتفاع پرنده"],
    ["weekly_gain_g","افزایش وزن هفتگی","g","number","در صورت ثبت نکردن، سامانه از وزن هفته قبل محاسبه می‌کند"],
    ["feed_form","شکل دان","توضیح","text","کیفیت فیزیکی دان و تغییر جیره"],
    ["vaccine_event","واکسیناسیون/رخداد مدیریتی","توضیح","text","واکسن، انتقال، استرس یا تغییر برنامه"],
    ["beak_condition","وضعیت نوک","توضیح","text","فقط در صورت مرتبط بودن با سیستم پرورش"]
  ],
  layer: [
    ["egg_count","تعداد کل تخم هفتگی","عدد","number","تعداد واقعی جمع‌آوری‌شده در هفته"],
    ["hen_day_pct","تولید Hen-Day","%","number","تولید بر اساس مرغ موجود"],
    ["hen_housed_pct","تولید Hen-Housed","%","number","تولید بر اساس مرغ اولیه گله"],
    ["egg_weight_g","میانگین وزن تخم","g","number","ترجیحاً نمونه استاندارد و ثابت هفتگی"],
    ["egg_mass_kg","Egg Mass هفتگی","kg","number","در صورت خالی بودن محاسبه می‌شود"],
    ["feed_per_hen_g","دان به ازای مرغ در روز","g/hen/day","number","شاخص کلیدی اقتصادی"],
    ["dirty_eggs_pct","تخم کثیف","%","number","از کل تخم تولیدی"],
    ["cracked_eggs_pct","تخم شکسته","%","number","از کل تخم تولیدی"],
    ["floor_eggs_pct","تخم کف","%","number","از کل تخم تولیدی"],
    ["haugh_unit","Haugh Unit","HU","number","در صورت وجود ابزار/آزمایش"],
    ["shell_strength","استحکام پوسته","kgf","number","در صورت وجود ابزار"],
    ["light_hours","ساعات روشنایی","ساعت","number","برنامه نوری"],
    ["light_intensity_lux","شدت نور","lux","number","در ارتفاع پرنده"],
    ["molt_status","وضعیت تولک","توضیح","text","در گله‌های درگیر تولک"]
  ],
  breeder: [
    ["female_egg_count","تعداد تخم ماده‌ها","عدد","number","مبنای محاسبات تولید"],
    ["hen_day_pct","تولید Hen-Day","%","number","شاخص اصلی تولید ماده‌ها"],
    ["egg_weight_g","میانگین وزن تخم","g","number","روند وزن تخم باید با هدف سویه مقایسه شود"],
    ["egg_mass_kg","Egg Mass هفتگی","kg","number","در صورت خالی بودن محاسبه می‌شود"],
    ["hatching_egg_pct","تخم قابل جوجه‌کشی","%","number","از کل تخم‌های تولیدی"],
    ["floor_eggs_pct","تخم کف","%","number","شاخص مهم کیفیت مدیریت لانه"],
    ["dirty_eggs_pct","تخم کثیف","%","number","از کل تخم"],
    ["cracked_eggs_pct","تخم شکسته","%","number","از کل تخم"],
    ["female_weight_g","میانگین وزن ماده","g","number","کنترل دقیق منحنی وزن"],
    ["female_uniformity_pct","یکنواختی ماده‌ها","%","number","ترجیحاً ±۱۰٪"],
    ["male_count","تعداد خروس","عدد","number","برای نسبت نر/ماده"],
    ["male_weight_g","میانگین وزن خروس","g","number","وزن خروس هفتگی"],
    ["male_female_ratio","نسبت خروس به ماده","%","number","نسبت واقعی گله"],
    ["male_mortality","تلفات خروس","عدد","number","جدا از تلفات ماده‌ها"],
    ["fertility_pct","نطفه‌داری","%","number","نتیجه باروری/هچری"],
    ["hatchability_pct","جوجه‌درآوری","%","number","نتیجه هچری"],
    ["chicks_per_hen","جوجه به ازای مرغ مادر","عدد","number","شاخص خروجی تجمعی/هفتگی"],
    ["spiking_status","Spiking","توضیح","text","وضعیت و تصمیم مدیریتی"],
    ["light_hours","ساعات روشنایی","ساعت","number","برنامه نوری"],
    ["light_intensity_lux","شدت نور","lux","number","در ارتفاع پرنده"],
    ["fleshing_score","امتیاز Fleshing ماده","1–4","number","در نقاط کلیدی سن"],
    ["pelvic_fat_pct","درصد چربی لگنی","%","number","در نقاط کلیدی پیش از تحریک نوری"]
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
function weeklySpecializedPriority(type, key){
  // ثبت هفتگی باید سریع بماند؛ فقط شاخص‌هایی که واقعاً برای تصمیم همان هفته
  // لازم‌اند در حالت اصلی دیده می‌شوند. بقیه در «پایش تکمیلی» هستند.
  const required={
    broiler:["water_feed_ratio","litter_score"],
    pullet:["weekly_gain_g"],
    layer:["egg_count","egg_weight_g","egg_mass_kg","feed_per_hen_g"],
    breeder:["female_egg_count","egg_weight_g","hatching_egg_pct","female_weight_g"]
  };
  return (required[type]||[]).includes(key) ? "primary" : "advanced";
}
function weeklyFieldHelp(key){
  const all=[...WEEKLY_SPECIALIZED_FIELDS.common,...WEEKLY_SPECIALIZED_FIELDS.broiler,...WEEKLY_SPECIALIZED_FIELDS.pullet,...WEEKLY_SPECIALIZED_FIELDS.layer,...WEEKLY_SPECIALIZED_FIELDS.breeder];
  return all.find(x=>x[0]===key)?.[4]||"";
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
    broiler:"گوشتی: رشد، یکنواختی، FCR، دان/آب و کنترل محیط؛ تغییرات کوچک آب و هوا می‌توانند زودتر از افت وزن هشدار بدهند.",
    pullet:"پولت: هدف اصلی رسیدن یکنواخت به منحنی وزن سویه و آماده‌سازی صحیح برای ورود به تولید است.",
    layer:"تخم‌گذار: تولید، وزن و جرم تخم، مصرف دان، کیفیت پوسته و شرایط محیطی باید همزمان دیده شوند.",
    breeder:"مادر: وزن و یکنواختی ماده و نر، تولید، تخم قابل جوجه‌کشی، باروری و هچ باید یک زنجیره واحد دیده شوند."
  };
  intro.innerHTML=`<strong>${labels[type]||"شاخص‌های تخصصی این گله"}</strong><div class="weekly-special-note">فیلدهای ستاره‌دار، شاخص‌های اصلی ارزیابی هستند. فیلدهای پیشرفته را در صورت داشتن ابزار یا داده ثبت کنید.</div>`;
  const primary=fields.filter(x=>weeklySpecializedPriority(type,x[0])==='primary');
  const advanced=fields.filter(x=>weeklySpecializedPriority(type,x[0])!=='primary');
  const renderGroup=(title,items,cls)=>`<div class="weekly-metric-group ${cls}"><div class="weekly-metric-group-title">${title}</div><div class="form-grid">${items.map(([id,label,unit,kind])=>`<div class="form-group weekly-special-field"><label for="wm_${id}">${weeklySpecializedPriority(type,id)==='primary'?'<b class="required-star">★</b> ':''}${label} <span>(${unit})</span></label><input id="wm_${id}" data-weekly-specialized="${id}" type="text" inputmode="${kind==='number'?'decimal':'text'}" autocomplete="off"><small>${weeklyFieldHelp(id)}</small></div>`).join('')}</div></div>`;
  host.innerHTML=renderGroup("شاخص‌های اصلی",primary,"primary-group")+`<div class="weekly-advanced-toggle-wrap"><button type="button" class="btn btn-secondary weekly-advanced-toggle" onclick="toggleWeeklyAdvanced()">+ پایش تکمیلی و کیفیت</button></div>`+renderGroup("پایش پیشرفته و کیفیت",advanced,"advanced-group");
  card.style.display="block";
  const advancedGroup=host.querySelector(".advanced-group");
  if(advancedGroup) advancedGroup.style.display="none";
  host.querySelectorAll("[data-weekly-specialized]").forEach(input=>{ input.addEventListener("input",()=>{ if(input.inputMode==="decimal") input.value=normalizeWeeklyDigits(input.value); }); });
}

function toggleWeeklyAdvanced(){
  const host=document.getElementById("specializedMetrics");
  const group=host?.querySelector(".advanced-group");
  const btn=host?.querySelector(".weekly-advanced-toggle");
  if(!group||!btn)return;
  const open=group.style.display!=="none";
  group.style.display=open?"none":"block";
  btn.textContent=open?"+ پایش تکمیلی و کیفیت":"− بستن پایش تکمیلی";
}
function normalizeWeeklyDigits(v){ return String(v??"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/,/g,"").replace(/٬/g,"").replace(/٫/g,"."); }
function getWeeklySpecializedMetrics(){
  const out={}; document.querySelectorAll("[data-weekly-specialized]").forEach(input=>{ const key=input.dataset.weeklySpecialized; const raw=String(input.value||"").trim(); if(!raw)return; if(input.inputMode==="decimal"){const n=Number(normalizeWeeklyDigits(raw)); if(Number.isFinite(n))out[key]=n;} else out[key]=raw; }); return out;
}
function loadWeeklySpecializedMetrics(metrics){ const data=(metrics&&typeof metrics==="object")?metrics:{}; document.querySelectorAll("[data-weekly-specialized]").forEach(input=>{input.value=data[input.dataset.weeklySpecialized]??"";}); }
function clearWeeklySpecializedMetrics(){document.querySelectorAll("[data-weekly-specialized]").forEach(input=>input.value="");}
function calculateWeeklySpecializedDerived(metrics,flock,previousRecords){
  const out={...(metrics||{})}; const type=weeklySpecializedType(flock); const rows=Array.isArray(previousRecords)?previousRecords:[]; const live=Number(out.live_birds||flock?.current_bird_count||flock?.live_birds||0);
  if((type==='layer'||type==='breeder')&&out.egg_mass_kg==null){const eggs=Number(out.egg_count??out.female_egg_count??0), ew=Number(out.egg_weight_g||0); if(eggs>0&&ew>0)out.egg_mass_kg=Number((eggs*ew/1000).toFixed(3));}
  if((type==='layer'||type==='breeder')&&out.hen_day_pct==null&&live>0){const eggs=Number(out.egg_count??out.female_egg_count??0); if(eggs>0)out.hen_day_pct=Number((eggs/(live*7)*100).toFixed(3));}
  if(type==='layer'&&out.hen_housed_pct==null&&live>0){const eggs=Number(out.egg_count||0); if(eggs>0)out.hen_housed_pct=Number((eggs/(live*7)*100).toFixed(3));}
  if(out.water_feed_ratio==null){const water=Number(flock?._weekly_water_total||0),feed=Number(flock?._weekly_feed_total||0); if(water>0&&feed>0)out.water_feed_ratio=Number((water/feed).toFixed(3));}
  if(out.weekly_gain_g==null&&rows.length){const last=[...rows].sort((a,b)=>Number(a.age_days||a.ageDays||0)-Number(b.age_days||b.ageDays||0)).at(-1); const w=Number(out.measured_weight_g||out.average_weight_g||0),pw=Number(last?.average_weight_g||last?.averageWeight||0); if(w>0&&pw>0)out.weekly_gain_g=Number((w-pw).toFixed(1));}
  return out;
}
function validateSpecializedMetrics(type,metrics){
  const percentKeys=["hen_day_pct","hen_housed_pct","dirty_eggs_pct","cracked_eggs_pct","floor_eggs_pct","hatching_egg_pct","fertility_pct","hatchability_pct","male_female_ratio","female_uniformity_pct","pelvic_fat_pct"];
  for(const k of percentKeys){if(metrics[k]!=null&&(metrics[k]<0||metrics[k]>100))return `${weeklyFieldLabel(k)} باید بین ۰ تا ۱۰۰ باشد.`;}
  if(metrics.egg_weight_g!=null&&metrics.egg_weight_g<=0)return "وزن تخم باید بزرگ‌تر از صفر باشد.";
  if(metrics.egg_mass_kg!=null&&metrics.egg_mass_kg<0)return "Egg Mass نمی‌تواند منفی باشد.";
  if(metrics.litter_score!=null&&(metrics.litter_score<0||metrics.litter_score>5))return "امتیاز بستر باید بین ۰ تا ۵ باشد.";
  if(metrics.footpad_score!=null&&(metrics.footpad_score<0||metrics.footpad_score>2))return "امتیاز کف پا باید بین ۰ تا ۲ باشد.";
  return null;
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
  const ok=confirm(`آیا از بستن دوره گله «${flock.flock_name||flock.flockName||""}» مطمئن هستید؟\nپس از بستن، ثبت و ویرایش هفتگی متوقف می‌شود و فارم در وضعیت غیرفعال/آرشیوی قرار می‌گیرد تا با گله جدید دوباره فعال شود.`);
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
window.toggleWeeklyAdvanced=toggleWeeklyAdvanced;
document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>{
    if(window.currentFlockForSpecialized) renderWeeklySpecializedFields(window.currentFlockForSpecialized);
  },100);
});
