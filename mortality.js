"use strict";

/* =========================================================
   ADINEH POULTRY HEALTH CENTER
   MORTALITY / DISEASE MODULE
   SUPABASE VERSION
========================================================= */

let healthUser = null;
let healthFlock = null;
let healthFarm = null;
let healthHouse = null;

let diseaseCatalog = [];
let clinicalSigns = [];

let healthEvents = [];
let selectedEventId = null;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initMortalityModule
);


async function initMortalityModule(){
    try{
        const sessionResult = await supabaseClient.auth.getSession();
        if(sessionResult.error || !sessionResult.data.session){
            location.href="login.html?message="+encodeURIComponent("ابتدا وارد سامانه شوید.");
            return;
        }
        healthUser=sessionResult.data.session.user;
        await loadCurrentFlock();
        setupTabs();
        setupEventForm();
        setupNecropsyForm();
        setDefaultDate();
        await loadCatalog();
        await loadEvents();
        renderDashboard();
        renderOverview();
    }catch(error){
        console.error("Mortality module error:",error);
        showHealthStatus("خطا در بارگذاری بخش سلامت: "+error.message,"error");
    }
}

async function loadCurrentFlock(){
    const selection=typeof getCurrentSelection==="function"?getCurrentSelection():{};
    if(!selection.flockId){location.href="flocks.html";return;}
    const result=await supabaseClient.from("flocks").select("*").eq("id",selection.flockId).maybeSingle();
    if(result.error)throw result.error;
    if(!result.data){location.href="flocks.html";return;}
    healthFlock=result.data;
    if(healthFlock.farm_id){const r=await supabaseClient.from("farms").select("*").eq("id",healthFlock.farm_id).maybeSingle();if(!r.error)healthFarm=r.data;}
    if(healthFlock.house_id){const r=await supabaseClient.from("houses").select("*").eq("id",healthFlock.house_id).maybeSingle();if(!r.error)healthHouse=r.data;}
    document.getElementById("flockInfo").textContent=[healthFarm?.name,healthHouse?.name,healthFlock.flock_name,healthFlock.strain].filter(Boolean).join(" | ")||"گله انتخاب‌شده";
    const age=calculateFlockAge();if(age!==null)document.getElementById("eventAge").value=age;
}
function calculateFlockAge(){if(!healthFlock||!healthFlock.placement_date)return null;const start=new Date(healthFlock.placement_date),now=new Date();return Math.max(0,Math.floor((now.getTime()-start.getTime())/86400000));}
function setupTabs(){document.querySelectorAll(".health-tab").forEach(button=>button.addEventListener("click",()=>{const tab=button.dataset.tab;document.querySelectorAll(".health-tab").forEach(item=>item.classList.remove("active"));document.querySelectorAll(".health-panel").forEach(panel=>panel.classList.remove("active"));button.classList.add("active");const panel=document.getElementById("panel-"+tab);if(panel)panel.classList.add("active")}));}
function setDefaultDate(){const input=document.getElementById("eventDate");if(input)input.value=window.jalaliDate&&typeof window.jalaliDate.todayJalali==="function"?window.jalaliDate.todayJalali():new Date().toISOString().slice(0,10);}

async function loadCatalog(){
    const diseaseResult=await supabaseClient.from("health_disease_catalog").select("*").eq("active",true).order("sort_order",{ascending:true});
    if(diseaseResult.error)throw diseaseResult.error; diseaseCatalog=diseaseResult.data||[];
    const signsResult=await supabaseClient.from("health_clinical_signs").select("*").eq("active",true).order("category",{ascending:true}).order("sort_order",{ascending:true});
    if(signsResult.error)throw signsResult.error; clinicalSigns=signsResult.data||[];
    populateDiseaseSelect("suspectedDisease");populateDiseaseSelect("confirmedDisease");renderClinicalSigns();
}
function populateDiseaseSelect(id){const select=document.getElementById(id);if(!select)return;const first=id==="confirmedDisease"?"هنوز تشخیص قطعی ندارد":"انتخاب نشده";select.innerHTML=`<option value="">${first}</option>`;diseaseCatalog.forEach(disease=>{const option=document.createElement("option");option.value=disease.id;option.textContent=disease.name_fa;select.appendChild(option);});}
function setupEventForm(){const form=document.getElementById("healthEventForm");if(!form)return;form.addEventListener("submit",saveHealthEvent);form.addEventListener("reset",()=>{setTimeout(setDefaultDate,0);setTimeout(()=>{const age=calculateFlockAge();if(age!==null)document.getElementById("eventAge").value=age;},0);});}

async function saveHealthEvent(event){
    event.preventDefault();
    if(!healthFlock){showHealthStatus("گله انتخاب نشده است.","error");return;}
    const mortality=numberValue("mortalityCount"),cull=numberValue("cullCount"),affected=numberValue("affectedCount");
    const payload={owner_id:healthUser.id,farm_id:healthFlock.farm_id||null,house_id:healthFlock.house_id||null,flock_id:healthFlock.id,event_date:(window.jalaliDate&&typeof window.jalaliDate.jalaliToISO==="function"?(window.jalaliDate.jalaliToISO(valueOf("eventDate"))||valueOf("eventDate")):valueOf("eventDate")),flock_age_days:numberValue("eventAge"),event_type:valueOf("eventType"),status:valueOf("eventStatus")||"open",mortality_count:mortality,cull_count:cull,affected_count:affected,flock_population_snapshot:getFlockPopulation(),suspected_disease_id:valueOf("suspectedDisease")||null,confirmed_disease_id:valueOf("confirmedDisease")||null,severity:valueOf("severity")||null,diagnosis_status:valueOf("diagnosisStatus")||"not_confirmed",sudden_death:valueOf("suddenDeath")==="true",notes:valueOf("eventNotes"),show_in_reports:checked("showInReports"),report_level:valueOf("reportLevel")||"private",include_in_weekly_report:checked("includeWeekly"),include_in_management_analysis:checked("includeAnalysis"),created_by:healthUser.id};
    if(payload.show_in_reports===false){payload.report_level="private";payload.include_in_weekly_report=false;}
    const result=await supabaseClient.from("health_events").insert(payload).select("*").single();
    if(result.error){console.error(result.error);showHealthStatus("خطا در ثبت رخداد: "+result.error.message,"error");return;}
    selectedEventId=result.data.id;await loadEvents();renderDashboard();renderOverview();renderReportPreview(result.data);showHealthStatus("رخداد سلامت با موفقیت ثبت شد.","success");openTab("clinical");
}

async function loadEvents(){
    if(!healthFlock)return;
    const result=await supabaseClient.from("health_reportable_events").select("*").eq("flock_id",healthFlock.id).order("event_date",{ascending:false}).limit(300);
    if(result.error){const fallback=await supabaseClient.from("health_events").select(`*, suspected_disease:health_disease_catalog!suspected_disease_id(id,name_fa), confirmed_disease:health_disease_catalog!confirmed_disease_id(id,name_fa)`).eq("flock_id",healthFlock.id).order("event_date",{ascending:false}).limit(300);if(fallback.error)throw fallback.error;healthEvents=fallback.data||[];}else healthEvents=result.data||[];renderHistory();}
function renderDashboard(){const mortality=healthEvents.reduce((s,r)=>s+Number(r.mortality_count||0),0),cull=healthEvents.reduce((s,r)=>s+Number(r.cull_count||0),0),disease=healthEvents.filter(r=>r.event_type==="disease"||r.event_type==="clinical_case").reduce((s,r)=>s+Number(r.affected_count||0),0),suspected=healthEvents.filter(r=>r.event_type==="suspected_disease").length;setText("statMortality",formatNumber(mortality));setText("statCull",formatNumber(cull));setText("statDisease",formatNumber(disease));setText("statSuspected",formatNumber(suspected));}

function renderOverview(){const container=document.getElementById("healthOverview");if(!container)return;container.innerHTML=`<div class="overview-grid"><div><strong>گله</strong><span>${escapeHtml(healthFlock?.flock_name||"-")}</span></div><div><strong>سن</strong><span>${formatNumber(calculateFlockAge()||0)} روز</span></div><div><strong>رخدادها</strong><span>${formatNumber(healthEvents.length)}</span></div></div>`;}
function renderHistory(){const tbody=document.getElementById("healthHistoryTable");if(!tbody)return;tbody.innerHTML=healthEvents.map(row=>{const disease=row.confirmed_disease_name||row.suspected_disease_name||getNestedDisease(row,"confirmed_disease")||getNestedDisease(row,"suspected_disease")||"-";const report=row.show_in_reports?"نمایش":"خصوصی";return `<tr><td>${escapeHtml(row.event_date||"-")}</td><td>${escapeHtml(typeLabel(row.event_type))}</td><td>${formatNumber(row.mortality_count)}</td><td>${formatNumber(row.cull_count)}</td><td>${formatNumber(row.affected_count)}</td><td>${escapeHtml(disease)}</td><td>${escapeHtml(severityLabel(row.severity))}</td><td>${report}</td><td><button class="btn btn-secondary" type="button" onclick="selectHealthEvent('${row.id}')">مشاهده</button><button class="btn btn-danger" type="button" onclick="deleteHealthEvent('${row.id}')">حذف</button></td></tr>`;}).join("");}
window.selectHealthEvent=async function(id){selectedEventId=id;const event=healthEvents.find(row=>row.id===id);if(!event)return;renderReportPreview(event);await loadNecropsy(id);openTab("report");};
function renderReportPreview(event){const container=document.getElementById("reportPreview");if(!container)return;const disease=event.confirmed_disease_name||event.suspected_disease_name||getNestedDisease(event,"confirmed_disease")||getNestedDisease(event,"suspected_disease")||"تشخیص ثبت نشده";container.innerHTML=`<div class="report-box"><h3>${escapeHtml(typeLabel(event.event_type))}</h3><p>تاریخ: <strong>${escapeHtml(event.event_date||"-")}</strong></p><p>بیماری: <strong>${escapeHtml(disease)}</strong></p><p>تلفات: ${formatNumber(event.mortality_count)} | حذفی: ${formatNumber(event.cull_count)} | درگیر: ${formatNumber(event.affected_count)}</p><p>شدت: ${escapeHtml(severityLabel(event.severity))}</p><p>وضعیت گزارش: ${event.show_in_reports?"نمایش داده می‌شود":"خصوصی"}</p><p>سطح: ${escapeHtml(reportLevelLabel(event.report_level))}</p>${event.notes?`<hr><strong>توضیحات</strong><p>${escapeHtml(event.notes)}</p>`:""}</div>`;}
function renderClinicalSigns(){const container=document.getElementById("clinicalSignsContainer");if(!container||!clinicalSigns.length)return;const groups={};clinicalSigns.forEach(sign=>{if(!groups[sign.category])groups[sign.category]=[];groups[sign.category].push(sign);});container.innerHTML=Object.entries(groups).map(([category,signs])=>`<h3 class="sub-title">${escapeHtml(category)}</h3><div class="check-grid">${signs.map(sign=>`<label class="check-item"><input type="checkbox" value="${sign.id}" data-sign-id="${sign.id}"><span>${escapeHtml(sign.name_fa)}</span></label>`).join("")}</div>`).join("");}
function setupNecropsyForm(){const form=document.getElementById("necropsyForm");if(!form)return;form.addEventListener("submit",saveNecropsy);}

/* =========================================================
   SAVE NECROPSY - UPSERT / SAFE RESAVE
   event_id is unique in the current data model, therefore
   repeated save must UPDATE the existing record rather than
   INSERT a second row.
========================================================= */
async function saveNecropsy(event){
    event.preventDefault();
    const eventId=document.getElementById("necropsyEventId").value||selectedEventId;
    if(!eventId){showHealthStatus("ابتدا یک رخداد سلامت را انتخاب کنید.","error");return;}
    const rawDate=valueOf("eventDate")||"";
    const necropsyDate=window.jalaliDate&&typeof window.jalaliDate.jalaliToISO==="function"?(window.jalaliDate.jalaliToISO(rawDate)||rawDate):(window.AdineDateSystem?.jalaliToISO?.(rawDate)||rawDate);
    const payload={event_id:eventId,necropsy_date:necropsyDate,birds_examined:numberValue("birdsExamined")||1,body_condition:valueOf("bodyCondition"),dehydration:valueOf("dehydration")===""?null:valueOf("dehydration")==="true",external_lesions:valueOf("externalLesions"),respiratory_findings:valueOf("respiratoryFindings"),digestive_findings:valueOf("digestiveFindings"),liver_findings:valueOf("liverFindings"),heart_findings:valueOf("heartFindings"),kidney_findings:valueOf("kidneyFindings"),bursa_findings:valueOf("bursaFindings"),intestinal_findings:valueOf("intestinalFindings"),other_findings:valueOf("otherOrganFindings"),gross_diagnosis:valueOf("grossDiagnosis"),veterinarian_notes:valueOf("veterinarianNotes"),created_by:healthUser.id};
    const result=await supabaseClient.from("health_necropsies").upsert(payload,{onConflict:"event_id"}).select("*").single();
    if(result.error){console.error("Necropsy save error:",result.error);showHealthStatus("خطا در ثبت کالبدگشایی: "+result.error.message,"error");return;}
    try{await saveSelectedClinicalSigns(eventId);}catch(signError){console.error("Clinical signs save error:",signError);showHealthStatus("کالبدگشایی ذخیره شد، اما علائم ذخیره نشد: "+signError.message,"error");return;}
    await loadNecropsy(eventId);
    showHealthStatus("کالبدگشایی و علائم با موفقیت ذخیره شد.","success");
}
async function saveSelectedClinicalSigns(eventId){const selected=Array.from(document.querySelectorAll("#clinicalSignsContainer input[data-sign-id]:checked")).map(input=>input.dataset.signId);const del=await supabaseClient.from("health_event_signs").delete().eq("event_id",eventId);if(del.error)throw del.error;if(!selected.length)return;const result=await supabaseClient.from("health_event_signs").insert(selected.map(signId=>({event_id:eventId,sign_id:signId})));if(result.error)throw result.error;}
async function loadNecropsy(eventId){selectedEventId=eventId;document.getElementById("necropsyEventId").value=eventId;const result=await supabaseClient.from("health_necropsies").select("*").eq("event_id",eventId).order("created_at",{ascending:false}).limit(1).maybeSingle();if(result.error)return;if(!result.data)return;const n=result.data;setValue("birdsExamined",n.birds_examined);setValue("bodyCondition",n.body_condition);setValue("dehydration",n.dehydration===null?"":String(n.dehydration));setValue("externalLesions",n.external_lesions);setValue("respiratoryFindings",n.respiratory_findings);setValue("digestiveFindings",n.digestive_findings);setValue("liverFindings",n.liver_findings);setValue("heartFindings",n.heart_findings);setValue("kidneyFindings",n.kidney_findings);setValue("bursaFindings",n.bursa_findings);setValue("intestinalFindings",n.intestinal_findings);setValue("otherOrganFindings",n.other_findings);setValue("grossDiagnosis",n.gross_diagnosis);setValue("veterinarianNotes",n.veterinarian_notes);await loadClinicalSigns(eventId);}
async function loadClinicalSigns(eventId){const result=await supabaseClient.from("health_event_signs").select("sign_id").eq("event_id",eventId);if(result.error)return;const ids=(result.data||[]).map(row=>row.sign_id);document.querySelectorAll("#clinicalSignsContainer input[data-sign-id]").forEach(input=>{input.checked=ids.includes(input.dataset.signId);});}
window.deleteHealthEvent=async function(id){const ok=confirm("این پرونده و اطلاعات وابسته به آن حذف شود؟");if(!ok)return;const result=await supabaseClient.from("health_events").delete().eq("id",id);if(result.error){showHealthStatus("خطا در حذف: "+result.error.message,"error");return;}if(selectedEventId===id)selectedEventId=null;await loadEvents();renderDashboard();renderOverview();showHealthStatus("پرونده حذف شد.","success");};
function getFlockPopulation(){if(!healthFlock)return null;for(const field of ["current_birds","current_population","bird_count","initial_birds","initial_population","placement_count"]){const value=Number(healthFlock[field]);if(Number.isFinite(value)&&value>0)return value;}return null;}
function showHealthStatus(message,type){const box=document.getElementById("healthStatus");if(!box)return;box.textContent=message;box.className="status-box show "+(type||"");setTimeout(()=>box.classList.remove("show"),5000);}
function valueOf(id){const el=document.getElementById(id);return el?String(el.value??""):"";}
function setValue(id,value){const el=document.getElementById(id);if(el)el.value=value??"";}
function numberValue(id){const el=document.getElementById(id);if(!el)return 0;return Number(String(el.value??"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)))||0;}
function checked(id){return !!document.getElementById(id)?.checked;}
function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
function formatNumber(value){return Number(value||0).toLocaleString("fa-IR");}
function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function getNestedDisease(row,key){return row?.[key]?.name_fa||null;}
function typeLabel(v){return ({disease:"بیماری",clinical_case:"مورد بالینی",suspected_disease:"بیماری مشکوک",mortality:"تلفات",other:"سایر"}[v]||v||"-");}
function severityLabel(v){return ({mild:"خفیف",moderate:"متوسط",severe:"شدید",critical:"بحرانی"}[v]||v||"-");}
function reportLevelLabel(v){return ({private:"خصوصی",farm:"سطح فارم",professional:"سطح حرفه‌ای",system:"سطح سامانه"}[v]||v||"خصوصی");}
function openTab(tab){document.querySelector(`.health-tab[data-tab="${tab}"]`)?.click();}
