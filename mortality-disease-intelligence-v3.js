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
    box.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>🧠 تحلیل سلامت گله</strong><span class="badge badge-${meta.cls}">${meta.label}</span></div><div class="form-help" style="margin-top:8px">هفته ${num(latest.week_number)} · نرخ تلفات ${pct(latest.mortality_percent_of_snapshot)} · ${ratio}</div><div style="margin-top:9px">${esc(latest.surveillance_message||"")}</div>${buildTrendTable()}`;
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

/* =========================================================
   HEALTH HISTORY / CASE RUNTIME V1
   Purpose: make health_events the visible source of truth for
   history and case details, independent of reportability flags.
========================================================= */
(function(){
'use strict';
if(window.__ADINE_HEALTH_RUNTIME_V1__) return;
window.__ADINE_HEALTH_RUNTIME_V1__=true;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const jalali=iso=>window.AdineDateSystem?.formatJalali?window.AdineDateSystem.formatJalali(iso,true):(window.jalaliDate?.isoToJalali?window.jalaliDate.isoToJalali(iso):iso||'-');
const typeLabel=v=>({mortality:'تلفات',cull:'حذفی',disease:'بیماری',suspected_disease:'بیماری مشکوک',clinical_case:'مورد بالینی',environmental:'مشکل محیطی / مدیریتی'}[v]||v||'رخداد سلامت');
let rows=[];
async function load(){
 if(!window.supabaseClient||!window.healthFlock?.id) return;
 const r=await supabaseClient.from('health_events').select('*').eq('flock_id',healthFlock.id).order('event_date',{ascending:false}).limit(500);
 if(r.error){console.error('Health runtime load:',r.error);return;}
 rows=r.data||[];renderHistory();renderReportPreview();
}
function renderHistory(){
 const body=$('healthHistoryTable');if(!body)return;
 if(!rows.length){body.innerHTML='<tr><td colspan="10"><div class="empty-state">برای این گله هنوز رخداد سلامت ثبت نشده است.</div></td></tr>';return;}
 body.innerHTML=rows.map(r=>`<tr><td>${esc(jalali(r.event_date))}</td><td>${esc(typeLabel(r.event_type))}</td><td>${n(r.mortality_count).toLocaleString('fa-IR')}</td><td>${n(r.cull_count).toLocaleString('fa-IR')}</td><td>${n(r.affected_count).toLocaleString('fa-IR')}</td><td>${esc(r.confirmed_disease_name||r.suspected_disease_name||'-')}</td><td>${esc(r.severity||'-')}</td><td><span class="badge ${r.show_in_reports?'badge-success':'badge-warning'}">${r.show_in_reports?'نمایش':'خصوصی'}</span></td><td><button class="btn btn-secondary" type="button" data-health-view="${r.id}">مشاهده</button> <button class="btn btn-secondary" type="button" data-health-edit="${r.id}">ویرایش</button> <button class="btn btn-danger" type="button" data-health-delete="${r.id}">حذف</button></td></tr>`).join('');
 body.querySelectorAll('[data-health-view]').forEach(b=>b.onclick=()=>view(b.dataset.healthView));body.querySelectorAll('[data-health-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.healthEdit));body.querySelectorAll('[data-health-delete]').forEach(b=>b.onclick=()=>remove(b.dataset.healthDelete));
}
async function view(id){const r=rows.find(x=>x.id===id);if(!r)return;window.selectedEventId=id;const p=$('reportPreview');if(p){p.innerHTML=reportCard(r);openTabSafe('report');}await loadChildren(id);}
function reportCard(r){return `<div class="report-box"><h3>${esc(typeLabel(r.event_type))} — پرونده ${esc(r.case_code||r.id.slice(0,8))}</h3><p>تاریخ: <strong>${esc(jalali(r.event_date))}</strong> | سن: ${n(r.flock_age_days).toLocaleString('fa-IR')} روز</p><p>تلفات: ${n(r.mortality_count).toLocaleString('fa-IR')} | حذفی: ${n(r.cull_count).toLocaleString('fa-IR')} | درگیر: ${n(r.affected_count).toLocaleString('fa-IR')}</p><p>شدت: ${esc(r.severity||'-')} | تشخیص: ${esc(r.diagnosis_status||'-')} | مرگ ناگهانی: ${r.sudden_death?'بله':'خیر'}</p><p>وضعیت گزارش: ${r.show_in_reports?'نمایش':'خصوصی'} | سطح: ${esc(r.report_level||'-')}</p>${r.notes?`<p><strong>یادداشت:</strong> ${esc(r.notes)}</p>`:''}<div id="healthChildDetails" class="form-help">در حال دریافت علائم و کالبدگشایی...</div></div>`}
async function loadChildren(id){const [s,nc]=await Promise.all([supabaseClient.from('health_event_signs').select('sign_id,health_clinical_signs(name_fa)').eq('event_id',id),supabaseClient.from('health_necropsies').select('necropsy_date,birds_examined,gross_diagnosis,veterinarian_notes').eq('event_id',id).order('created_at',{ascending:false}).limit(1).maybeSingle()]);const host=$('healthChildDetails');if(!host)return;const signs=(s.data||[]).map(x=>x.health_clinical_signs?.name_fa).filter(Boolean),nec=nc.data;host.innerHTML=`${signs.length?`<p><strong>علائم:</strong> ${signs.map(esc).join('، ')}</p>`:'<p>علائم بالینی ثبت نشده است.</p>'}${nec?`<p><strong>کالبدگشایی:</strong> ${n(nec.birds_examined).toLocaleString('fa-IR')} پرنده — ${esc(nec.gross_diagnosis||'بدون تشخیص ماکروسکوپی')}</p>`:'<p>کالبدگشایی برای این پرونده ثبت نشده است.</p>'}`;}
function openTabSafe(t){const b=document.querySelector(`.health-tab[data-tab="${t}"]`);if(b)b.click();}
function edit(id){const r=rows.find(x=>x.id===id);if(!r)return;const map={eventDate:r.event_date,eventAge:r.flock_age_days,eventType:r.event_type,mortalityCount:r.mortality_count,cullCount:r.cull_count,affectedCount:r.affected_count,severity:r.severity,diagnosisStatus:r.diagnosis_status,suddenDeath:String(!!r.sudden_death),eventStatus:r.status,eventNotes:r.notes||'',reportLevel:r.report_level||'private'};Object.entries(map).forEach(([k,v])=>{const el=$(k);if(el)el.value=v;});if($('showInReports'))$('showInReports').checked=!!r.show_in_reports;if($('includeWeekly'))$('includeWeekly').checked=!!r.include_in_weekly_report;if($('includeAnalysis'))$('includeAnalysis').checked=!!r.include_in_management_analysis;$('healthEventForm')?.scrollIntoView({behavior:'smooth',block:'start'});openTabSafe('event');window.__ADINE_HEALTH_EDIT_ID__=id;const form=$('healthEventForm');if(form){const b=form.querySelector('button[type="submit"]');if(b)b.textContent='ذخیره ویرایش پرونده';}}
async function remove(id){const phrase=prompt('برای حذف دائمی این پرونده، عبارت «حذف پرونده» را وارد کنید.');if(phrase!=='حذف پرونده'){if(phrase!==null)alert('عبارت واردشده صحیح نیست.');return;}for(const t of ['health_event_signs','health_necropsies','health_event_labs','health_diagnoses','health_differentials','health_actions','health_follow_ups']){const d=await supabaseClient.from(t).delete().eq('event_id',id);if(d.error){alert('حذف پرونده کامل نشد: '+d.error.message);return;}}const d=await supabaseClient.from('health_events').delete().eq('id',id);if(d.error){alert('خطا در حذف پرونده: '+d.error.message);return;}await load();alert('پرونده با موفقیت حذف شد.');}
function installEditSave(){const form=$('healthEventForm');if(!form||form.dataset.healthRuntimeEdit==='1')return;form.dataset.healthRuntimeEdit='1';form.addEventListener('submit',async function(e){const id=window.__ADINE_HEALTH_EDIT_ID__;if(!id)return;e.preventDefault();e.stopImmediatePropagation();const p={event_date:(window.jalaliDate?.jalaliToISO?.($('eventDate')?.value)||$('eventDate')?.value),flock_age_days:n($('eventAge')?.value),event_type:$('eventType')?.value,status:$('eventStatus')?.value||'open',mortality_count:n($('mortalityCount')?.value),cull_count:n($('cullCount')?.value),affected_count:n($('affectedCount')?.value),severity:$('severity')?.value||null,diagnosis_status:$('diagnosisStatus')?.value||'not_confirmed',sudden_death:$('suddenDeath')?.value==='true',notes:$('eventNotes')?.value||'',show_in_reports:!!$('showInReports')?.checked,report_level:$('showInReports')?.checked?($('reportLevel')?.value||'farm'):'private',include_in_weekly_report:$('showInReports')?.checked&&!!$('includeWeekly')?.checked,include_in_management_analysis:$('includeAnalysis')?.checked!==false};const r=await supabaseClient.from('health_events').update(p).eq('id',id).select('*').single();if(r.error){alert('خطا در ویرایش: '+r.error.message);return;}window.__ADINE_HEALTH_EDIT_ID__=null;const b=form.querySelector('button[type="submit"]');if(b)b.textContent='ثبت رخداد';await load();alert('پرونده با موفقیت ویرایش شد.');},true);}
function boot(){setTimeout(()=>{installEditSave();load();},1200);setInterval(()=>{if(document.visibilityState==='visible')load()},30000)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
