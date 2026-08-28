/*
 * ADINEH POULTRY HEALTH CENTER
 * Unified Health Case Workflow v1
 *
 * Design principle:
 * One health_event = one clinical/epidemiological case.
 * Clinical signs, necropsy examinations, laboratory work, diagnoses,
 * actions and follow-ups are child records of that case.
 *
 * The existing dashboard is intentionally untouched.
 */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const esc = (v) => typeof escapeHtml === "function" ? escapeHtml(v ?? "") : String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const val = (id) => $(id)?.value ?? "";
  const setVal = (id, v) => { if ($(id)) $(id).value = v ?? ""; };
  const nval = (id) => {
    const raw = typeof window.normalizeNumberString === "function" ? window.normalizeNumberString(val(id)) : String(val(id)).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/,/g, "").replace(/٬/g, "").replace(/٫/g, ".");
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const isoFromJ = (v) => {
    const f = window.AdineDateSystem?.jalaliToISO || window.jalaliDate?.jalaliToISO;
    return f ? f(v) : null;
  };
  const jalaliFromIso = (v) => window.AdineDateSystem?.formatJalali ? window.AdineDateSystem.formatJalali(v, true) : (window.AdineDateSystem?.isoToJalali?.(v) || v || "");
  const todayJ = () => window.AdineDateSystem?.todayJalali?.() || window.jalaliDate?.todayJalali?.() || "";
  const diff = (a, b) => window.AdineDateSystem?.dateOnlyDiffDays?.(a, b);
  const notify = (msg, type) => typeof showHealthStatus === "function" ? showHealthStatus(msg, type) : alert(msg);

  let caseMode = "new";
  let caseRecord = null;
  let caseLabs = [];
  let caseDiagnoses = [];
  let caseDifferentials = [];
  let caseFollowups = [];

  function caseCode() {
    const d = isoFromJ(val("eventDate")) || new Date().toISOString().slice(0,10);
    const suffix = Math.random().toString(36).slice(2,6).toUpperCase();
    return `HC-${d.replace(/-/g, "")}-${suffix}`;
  }

  function currentAgeForDate(iso) {
    if (!healthFlock?.placement_date || !iso) return null;
    const age = diff(healthFlock.placement_date, iso);
    return age == null ? null : Math.max(0, age);
  }

  function injectStyles() {
    if ($("health-case-v1-style")) return;
    const s = document.createElement("style"); s.id = "health-case-v1-style";
    s.textContent = `
      .case-shell{border:1px solid #dce8e1;border-radius:18px;background:#fff;padding:16px;margin-bottom:16px;box-shadow:0 5px 20px rgba(0,0,0,.035)}
      .case-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
      .case-code{font-size:12px;color:#6d7772}.case-title{font-size:19px;font-weight:800;color:#173f35;margin:0 0 5px}.case-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}
      .case-chip{display:inline-flex;align-items:center;padding:6px 10px;border-radius:10px;background:#f0f5f2;color:#33413b;font-size:12px}.case-chip.alert{background:#fff0ed;color:#a61b1b}.case-chip.warn{background:#fff5e6;color:#9a4b00}.case-chip.ok{background:#eaf7ee;color:#18733a}
      .case-steps{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:15px}.case-step{font-size:11px;text-align:center;padding:8px 3px;border-radius:9px;background:#f1f3f2;color:#68736e}.case-step.done{background:#e7f3eb;color:#176b37}.case-step.current{background:#173f35;color:#fff;font-weight:700}
      .case-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.case-grid .full{grid-column:1/-1}.case-section{border-top:1px solid #e8ecea;margin-top:18px;padding-top:15px}.case-section h3{margin:0 0 12px;color:#173f35;font-size:16px}.case-help{font-size:12px;color:#75807b;margin:0 0 12px;line-height:1.7}
      .case-timeline{position:relative;margin:8px 0}.case-event{display:grid;grid-template-columns:115px 1fr;gap:12px;padding:10px 0;border-bottom:1px dashed #dfe6e2}.case-event-date{font-size:12px;color:#68736e}.case-event-body{font-size:13px;color:#26332e}.case-empty{padding:18px;text-align:center;color:#7b8580;background:#fafcfb;border-radius:12px}
      .case-table{width:100%;border-collapse:collapse}.case-table th,.case-table td{padding:8px;border-bottom:1px solid #e6ebe8;text-align:right;font-size:12px}.case-table th{color:#5d6863;background:#fafcfb}
      .case-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.case-danger{color:#a61b1b}.case-note{background:#fffaf0;border:1px solid #f1dfb8;border-radius:12px;padding:11px;font-size:12px;line-height:1.8}
      @media(max-width:800px){.case-grid{grid-template-columns:1fr 1fr}.case-steps{grid-template-columns:repeat(4,1fr)}}
      @media(max-width:520px){.case-grid{grid-template-columns:1fr}.case-steps{grid-template-columns:repeat(2,1fr)}.case-event{grid-template-columns:1fr;gap:3px}}
    `;
    document.head.appendChild(s);
  }

  function injectCaseMeta() {
    if ($("caseMetaV1")) return;
    const form = $("healthEventForm"); if (!form) return;
    const box = document.createElement("div"); box.id = "caseMetaV1"; box.className = "case-shell";
    box.innerHTML = `
      <div class="case-head"><div><div class="case-code" id="caseCodePreview">پرونده جدید</div><div class="case-title">پرونده یکپارچه رخداد سلامت</div><div class="case-help">این رخداد از لحظه مشاهده تا علائم، کالبدگشایی، آزمایش، تشخیص و پیگیری یک پرونده واحد است.</div></div><span class="case-chip" id="caseModeChip">پرونده جدید</span></div>
      <div class="case-grid">
        <div class="form-group"><label>تاریخ شروع رخداد</label><input id="caseOnsetDate" class="jalali-input" type="text" inputmode="numeric" autocomplete="off"></div>
        <div class="form-group"><label>سن گله در شروع رخداد (روز)</label><input id="caseOnsetAge" type="number" min="0" step="1" readonly></div>
        <div class="form-group"><label>اولویت بررسی</label><select id="casePriority"><option value="routine">عادی</option><option value="watch">نیازمند پایش</option><option value="high">بالا</option><option value="critical">بحرانی</option></select></div>
        <div class="form-group"><label>طبقه‌بندی پرونده</label><select id="caseClassification"><option value="undetermined">نامشخص</option><option value="suspected">مشکوک</option><option value="probable">محتمل</option><option value="confirmed">تأییدشده</option><option value="ruled_out">ردشده</option></select></div>
        <div class="form-group"><label>سندرم غالب</label><select id="caseSyndrome"><option value="">انتخاب کنید</option><option value="respiratory">تنفسی</option><option value="digestive">گوارشی</option><option value="nervous">عصبی</option><option value="reproductive">تولیدمثلی</option><option value="systemic">سیستمیک</option><option value="musculoskeletal">اسکلتی‌عضلانی</option><option value="metabolic">متابولیک/تغذیه‌ای</option><option value="environmental">محیطی/مدیریتی</option><option value="mortality_only">افزایش تلفات بدون سندرم مشخص</option><option value="mixed">مختلط</option></select></div>
        <div class="form-group"><label>اعتماد تشخیصی</label><select id="caseConfidence"><option value="">انتخاب کنید</option><option value="low">کم</option><option value="moderate">متوسط</option><option value="high">بالا</option></select></div>
        <div class="form-group full"><label>خلاصه پرونده</label><textarea id="caseSummary" rows="3" placeholder="خلاصه کوتاه و عینی از مشکل، سیر رخداد و مهم‌ترین یافته‌ها..."></textarea></div>
        <div class="form-group full"><label>نکات اپیدمیولوژیک</label><textarea id="caseEpidemiology" rows="3" placeholder="الگوی زمانی/مکانی، سالن‌های دیگر، تماس‌ها، جابه‌جایی، واکسیناسیون، درمان قبلی و عوامل خطر مهم..."></textarea></div>
      </div>
      <div class="case-actions"><button type="button" class="btn btn-secondary" id="saveCaseMetaBtn">ذخیره اطلاعات پرونده</button></div>`;
    form.prepend(box);
    setVal("caseOnsetDate", val("eventDate") || todayJ());
    updateCaseAge();
    $("caseOnsetDate")?.addEventListener("input", updateCaseAge);
    $("caseOnsetDate")?.addEventListener("change", updateCaseAge);
    $("eventDate")?.addEventListener("input", () => { if(caseMode === "new") setVal("caseOnsetDate", val("eventDate")); updateCaseAge(); });
    $("saveCaseMetaBtn")?.addEventListener("click", () => saveCaseMeta(false));
  }

  function updateCaseAge() {
    const iso = isoFromJ(val("caseOnsetDate"));
    const age = currentAgeForDate(iso);
    setVal("caseOnsetAge", age == null ? "" : age);
    if ($("eventAge") && caseMode === "new" && age != null) $("eventAge").value = age;
  }

  function setCaseHeader(event) {
    const code = event?.case_code || "پرونده جدید";
    setVal("caseCodePreview", code);
    if ($("caseModeChip")) { $("caseModeChip").textContent = caseMode === "edit" ? "ویرایش پرونده" : "پرونده جدید"; $("caseModeChip").className = "case-chip"; }
    setVal("caseOnsetDate", event?.onset_date ? jalaliFromIso(event.onset_date) : (event?.event_date ? jalaliFromIso(event.event_date) : todayJ()));
    setVal("caseOnsetAge", event?.onset_age_days ?? currentAgeForDate(event?.onset_date || event?.event_date));
    setVal("casePriority", event?.case_priority || "routine");
    setVal("caseClassification", event?.case_classification || "undetermined");
    setVal("caseSyndrome", event?.syndrome || "");
    setVal("caseConfidence", event?.diagnostic_confidence || "");
    setVal("caseSummary", event?.case_summary || "");
    setVal("caseEpidemiology", event?.epidemiology_notes || "");
  }

  function casePayload() {
    const eventISO = isoFromJ(val("eventDate"));
    const onsetISO = isoFromJ(val("caseOnsetDate")) || eventISO;
    if (!eventISO) throw new Error("تاریخ رخداد معتبر نیست.");
    if (onsetISO && eventISO < onsetISO) throw new Error("تاریخ رخداد نمی‌تواند قبل از شروع رخداد باشد.");
    const age = currentAgeForDate(onsetISO);
    if (age != null && age < 0) throw new Error("سن گله در شروع رخداد معتبر نیست.");
    return {
      event_date: eventISO,
      flock_age_days: nval("eventAge") ?? currentAgeForDate(eventISO),
      onset_date: onsetISO,
      onset_age_days: age,
      last_observed_date: eventISO,
      case_priority: val("casePriority") || "routine",
      case_classification: val("caseClassification") || "undetermined",
      syndrome: val("caseSyndrome") || null,
      diagnostic_confidence: val("caseConfidence") || null,
      case_summary: val("caseSummary") || null,
      epidemiology_notes: val("caseEpidemiology") || null
    };
  }

  async function saveCaseMeta(silent) {
    if (!caseRecord?.id) { if(!silent) notify("ابتدا رخداد را ثبت کنید.", "error"); return false; }
    try {
      const p = casePayload();
      const r = await supabaseClient.from("health_events").update(p).eq("id", caseRecord.id).select("*").single();
      if (r.error) throw r.error;
      caseRecord = r.data;
      if(!silent) notify("اطلاعات پرونده ذخیره شد.", "success");
      await refreshCaseData();
      return true;
    } catch(e) { if(!silent) notify("خطا در ذخیره پرونده: " + e.message, "error"); return false; }
  }

  async function submitEventCapture(e) {
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    try {
      if (!healthFlock || !healthUser) throw new Error("گله یا کاربر جاری در دسترس نیست.");
      const mortality = nval("mortalityCount") ?? 0, cull = nval("cullCount") ?? 0, affected = nval("affectedCount") ?? 0;
      if ([mortality,cull,affected].some(x => x < 0)) throw new Error("تعدادها نمی‌توانند منفی باشند.");
      const base = casePayload();
      const payload = {
        owner_id: healthUser.id, farm_id: healthFlock.farm_id || null, house_id: healthFlock.house_id || null, flock_id: healthFlock.id,
        event_date: base.event_date, flock_age_days: base.flock_age_days, event_type: val("eventType"), status: val("eventStatus") || "open",
        mortality_count: mortality, cull_count: cull, affected_count: affected, flock_population_snapshot: typeof getFlockPopulation === "function" ? getFlockPopulation() : null,
        suspected_disease_id: val("suspectedDisease") || null, confirmed_disease_id: val("confirmedDisease") || null, severity: val("severity") || null,
        diagnosis_status: val("diagnosisStatus") || "not_confirmed", sudden_death: val("suddenDeath") === "true", notes: val("eventNotes"),
        show_in_reports: $("showInReports")?.checked || false, report_level: $("showInReports")?.checked ? (val("reportLevel") || "farm") : "private",
        include_in_weekly_report: $("showInReports")?.checked ? !!$("includeWeekly")?.checked : false,
        include_in_management_analysis: $("includeAnalysis")?.checked !== false, created_by: healthUser.id,
        ...base
      };
      if (!payload.event_type) throw new Error("نوع رخداد را انتخاب کنید.");
      let r;
      if (caseMode === "edit" && caseRecord?.id) r = await supabaseClient.from("health_events").update(payload).eq("id", caseRecord.id).select("*").single();
      else { payload.case_code = caseCode(); r = await supabaseClient.from("health_events").insert(payload).select("*").single(); }
      if (r.error) throw r.error;
      caseRecord = r.data; caseMode = "edit"; selectedEventId = r.data.id;
      if (typeof loadEvents === "function") await loadEvents();
      if (typeof renderDashboard === "function") renderDashboard();
      if (typeof renderOverview === "function") renderOverview();
      setCaseHeader(caseRecord);
      renderCaseWorkspace();
      openClinical();
      notify(caseMode === "edit" ? "پرونده با موفقیت ذخیره شد." : "پرونده سلامت با موفقیت ایجاد شد.", "success");
    } catch(err) { console.error(err); notify("خطا در ثبت پرونده: " + err.message, "error"); }
  }

  function openClinical() { if(typeof openTab === "function") openTab("clinical"); else $("panel-clinical")?.classList.add("active"); window.scrollTo({top:0,behavior:"smooth"}); }

  function enhanceClinicalPanel() {
    const panel = $("panel-clinical"); if (!panel || $("caseWorkspaceV1")) return;
    const shell = document.createElement("div"); shell.id = "caseWorkspaceV1"; shell.className = "case-shell";
    shell.innerHTML = `<div class="case-head"><div><div class="case-code" id="workspaceCaseCode">پرونده انتخاب نشده</div><div class="case-title">بررسی یکپارچه پرونده</div></div><div class="case-meta" id="workspaceCaseChips"></div></div><div class="case-steps"><div class="case-step current" id="stepClinical">۱. علائم</div><div class="case-step" id="stepNecropsy">۲. کالبدگشایی</div><div class="case-step" id="stepLab">۳. آزمایش</div><div class="case-step" id="stepDx">۴. تشخیص</div><div class="case-step" id="stepAction">۵. اقدام</div><div class="case-step" id="stepFollow">۶. پیگیری</div><div class="case-step" id="stepClose">۷. نتیجه</div></div><div id="caseClinicalNarrative" class="case-section"></div><div id="caseDiagnosticsV1" class="case-section"></div><div id="caseTimelineV1" class="case-section"></div></div>`;
    panel.prepend(shell);
    const oldTitle = panel.querySelector("h2.section-title"); if(oldTitle) oldTitle.textContent = "بررسی پرونده سلامت";
    addNecropsyFields();
  }

  function addNecropsyFields() {
    const form = $("necropsyForm"); if(!form || $("necropsyExtraV1")) return;
    const wrap = document.createElement("div"); wrap.id="necropsyExtraV1"; wrap.className="case-section";
    wrap.innerHTML = `<h3>مشخصات نمونه و کیفیت کالبدگشایی</h3><div class="case-grid">
      <div class="form-group"><label>تاریخ کالبدگشایی</label><input id="necropsyDateV1" class="jalali-input" type="text" inputmode="numeric"></div>
      <div class="form-group"><label>وضعیت نمونه</label><select id="specimenConditionV1"><option value="fresh">تازه</option><option value="recent_dead">تازه‌تلف</option><option value="moribund">در حال احتضار/بیمار</option><option value="autolytic">اتولیز</option><option value="unknown">نامشخص</option></select></div>
      <div class="form-group"><label>فاصله مرگ تا بررسی (ساعت)</label><input id="freshnessHoursV1" type="number" min="0" step="0.1"></div>
      <div class="form-group"><label>شدت کلی ضایعات</label><select id="lesionSeverityV1"><option value="">انتخاب</option><option value="mild">خفیف</option><option value="moderate">متوسط</option><option value="severe">شدید</option></select></div>
      <div class="form-group full"><label>علت انتخاب پرنده/نمونه</label><input id="sampleReasonV1" type="text" placeholder="مثلاً تلفات تازه، پرنده بیمار با علائم تنفسی، نمونه نماینده..."></div>
      <div class="form-group full"><label>توزیع ضایعات</label><input id="lesionDistributionV1" type="text" placeholder="موضعی / چندکانونی / منتشر؛ سالن/گروه درگیر..."></div>
      <div class="form-group full"><label>روش و شرایط بررسی</label><input id="examMethodV1" type="text" placeholder="کالبدگشایی میدانی، آزمایشگاه تشخیصی، تعداد پرندگان و روش انتخاب..."></div>
    </div>`;
    const firstGrid = form.querySelector(".form-grid"); if(firstGrid) form.insertBefore(wrap, firstGrid); else form.prepend(wrap);
    const organGrid = form.querySelector(".form-grid"); if(organGrid){
      const fields = [["spleenFindings","طحال"],["pancreasFindings","پانکراس"],["cecalFindings","سکوم"],["boneJointFindings","استخوان و مفاصل"],["nervousFindings","سیستم عصبی"]];
      fields.forEach(([id,label])=>{const g=document.createElement("div");g.className="form-group";g.innerHTML=`<label>${label}</label><textarea id="${id}" rows="3"></textarea>`;const gross=form.querySelector("#grossDiagnosis")?.closest(".form-group"); if(gross) form.querySelector(".form-grid").insertBefore(g,gross); else form.querySelector(".form-grid").appendChild(g);});
    }
    if($("necropsyDateV1")) $("necropsyDateV1").value = val("eventDate") || todayJ();
    const old = form.querySelector("button[type=submit]"); if(old) old.textContent = "ثبت معاینه کالبدگشایی";
    form.addEventListener("submit", saveNecropsyV1, true);
  }

  async function saveNecropsyV1(e) {
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const eventId = selectedEventId || caseRecord?.id; if(!eventId){notify("ابتدا یک پرونده را انتخاب کنید.","error");return;}
    try{
      const dateISO = isoFromJ(val("necropsyDateV1")) || isoFromJ(val("eventDate")); if(!dateISO) throw new Error("تاریخ کالبدگشایی معتبر نیست.");
      const payload={event_id:eventId,necropsy_date:dateISO,birds_examined:nval("birdsExamined")||1,body_condition:val("bodyCondition")||null,dehydration:val("dehydration")===""?null:val("dehydration")==="true",external_lesions:val("externalLesions"),respiratory_findings:val("respiratoryFindings"),digestive_findings:val("digestiveFindings"),liver_findings:val("liverFindings"),heart_findings:val("heartFindings"),kidney_findings:val("kidneyFindings"),spleen_findings:val("spleenFindings"),bursa_findings:val("bursaFindings"),pancreas_findings:val("pancreasFindings"),intestinal_findings:val("intestinalFindings"),cecal_findings:val("cecalFindings"),bone_joint_findings:val("boneJointFindings"),nervous_findings:val("nervousFindings"),other_findings:val("otherOrganFindings"),gross_diagnosis:val("grossDiagnosis"),veterinarian_notes:val("veterinarianNotes"),created_by:healthUser.id,sample_selection_reason:val("sampleReasonV1")||null,specimen_condition:val("specimenConditionV1")||null,freshness_hours:nval("freshnessHoursV1"),lesion_distribution:val("lesionDistributionV1")||null,lesion_severity:val("lesionSeverityV1")||null,exam_method:val("examMethodV1")||null};
      const r=await supabaseClient.from("health_necropsies").insert(payload).select("*").single(); if(r.error) throw r.error;
      await saveSignsV1(eventId); await refreshCaseData(); markSteps(); notify("کالبدگشایی، یافته‌ها و علائم به همان پرونده متصل شد.","success");
    }catch(err){console.error(err);notify("خطا در ثبت کالبدگشایی: "+err.message,"error");}
  }

  async function saveSignsV1(eventId){
    const selected=[...document.querySelectorAll("#clinicalSignsContainer input[data-sign-id]:checked")].map(x=>x.dataset.signId);
    const existing=await supabaseClient.from("health_event_signs").select("id,sign_id").eq("event_id",eventId); if(existing.error) throw existing.error;
    const wanted=new Set(selected); const toDelete=(existing.data||[]).filter(r=>!wanted.has(r.sign_id)).map(r=>r.id);
    if(toDelete.length){const d=await supabaseClient.from("health_event_signs").delete().in("id",toDelete);if(d.error)throw d.error;}
    const existingIds=new Set((existing.data||[]).map(r=>r.sign_id)); const adds=selected.filter(id=>!existingIds.has(id)).map(sign_id=>({event_id:eventId,sign_id}));
    if(adds.length){const r=await supabaseClient.from("health_event_signs").insert(adds);if(r.error)throw r.error;}
  }

  async function loadSignsV1(eventId){
    const r=await supabaseClient.from("health_event_signs").select("sign_id,severity,notes").eq("event_id",eventId); if(r.error) return;
    const ids=new Set((r.data||[]).map(x=>x.sign_id)); document.querySelectorAll("#clinicalSignsContainer input[data-sign-id]").forEach(x=>x.checked=ids.has(x.dataset.signId));
  }

  function addDiagnosticsUI(){
    const c=$("caseDiagnosticsV1"); if(!c) return;
    c.innerHTML=`<h3>تشخیص، آزمایش و پیگیری</h3><p class="case-help">تشخیص احتمالی، افتراقی و قطعی باید از هم جدا بمانند؛ وجود یک ضایعه به‌تنهایی به معنی تشخیص قطعی نیست.</p>
      <div class="case-grid"><div class="form-group"><label>روش تشخیصی/مبنای تشخیص</label><select id="dxBasisV1"><option value="clinical">بالینی</option><option value="necropsy">کالبدگشایی</option><option value="laboratory">آزمایشگاهی</option><option value="epidemiology">اپیدمیولوژیک</option><option value="mixed">ترکیبی</option></select></div><div class="form-group"><label>تشخیص متنی دامپزشک</label><input id="dxTextV1" type="text"></div><div class="form-group"><label>اعتماد</label><select id="dxConfidenceV1"><option value="low">کم</option><option value="moderate" selected>متوسط</option><option value="high">بالا</option></select></div><div class="form-group full"><label>استدلال تشخیصی</label><textarea id="dxReasonV1" rows="3" placeholder="ارتباط شرح حال، علائم، ضایعات، اپیدمیولوژی و آزمایش..."></textarea></div></div>
      <div id="labListV1"></div><div class="case-actions"><button class="btn btn-secondary" type="button" id="addLabV1">+ ثبت آزمایش/نمونه</button><button class="btn btn-secondary" type="button" id="saveDxV1">ذخیره تشخیص</button></div>
      <div id="followListV1" class="case-section"></div>`;
    $("addLabV1").onclick=addLabRow; $("saveDxV1").onclick=saveDiagnosisV1;
  }

  function addLabRow(data={}){
    const box=$("labListV1"); if(!box)return; const id="lab_"+Math.random().toString(36).slice(2); const row=document.createElement("div"); row.className="case-shell"; row.dataset.labRow="1"; row.innerHTML=`<div class="case-grid"><div class="form-group"><label>نوع آزمایش</label><select data-f="test_type"><option>PCR</option><option>کشت باکتریایی</option><option>آنتی‌بیوگرام</option><option>هیستوپاتولوژی</option><option>ELISA</option><option>سرولوژی</option><option>سم‌شناسی</option><option>سایر</option></select></div><div class="form-group"><label>نوع نمونه</label><input data-f="sample_type" placeholder="سواب، بافت، خون، سرم، خوراک، آب..."></div><div class="form-group"><label>تعداد نمونه</label><input data-f="sample_count" type="number" min="1"></div><div class="form-group"><label>آزمایشگاه</label><input data-f="laboratory_name"></div><div class="form-group"><label>وضعیت نتیجه</label><select data-f="result_status"><option value="pending">در انتظار</option><option value="positive">مثبت</option><option value="negative">منفی</option><option value="inconclusive">نامشخص</option><option value="not_done">انجام نشد</option></select></div><div class="form-group"><label>تاریخ نمونه‌گیری</label><input data-f="collection_date" class="jalali-input" inputmode="numeric"></div><div class="form-group"><label>تاریخ نتیجه</label><input data-f="result_date" class="jalali-input" inputmode="numeric"></div><div class="form-group full"><label>خلاصه نتیجه</label><textarea data-f="result_summary" rows="2"></textarea></div></div><div class="case-actions"><button type="button" class="btn btn-secondary" data-save-lab>ذخیره آزمایش</button><button type="button" class="btn btn-secondary case-danger" data-remove-lab>حذف از فرم</button></div>`;
    box.querySelectorAll("[data-f]").forEach(el=>{const f=el.dataset.f; if(f.includes("date")) el.value= data[f] ? jalaliFromIso(data[f]) : (f==="collection_date"?todayJ():""); else el.value=data[f] ?? "";});
    box.querySelector("[data-save-lab]").onclick=()=>saveLabRow(box); box.querySelector("[data-remove-lab]").onclick=()=>box.remove(); box.id=id; box.scrollIntoView({behavior:"smooth",block:"center"});
  }

  async function saveLabRow(row){
    const get=(f)=>row.querySelector(`[data-f="${f}"]`)?.value||null; const payload={event_id:selectedEventId,test_type:get("test_type"),sample_type:get("sample_type"),sample_count:Number(get("sample_count"))||null,laboratory_name:get("laboratory_name"),result_status:get("result_status")||"pending",collection_date:isoFromJ(get("collection_date")),result_date:isoFromJ(get("result_date")),result_summary:get("result_summary")};
    const r=await supabaseClient.from("health_event_labs").insert(payload).select("*").single(); if(r.error){notify("خطا در ثبت آزمایش: "+r.error.message,"error");return;} caseLabs.push(r.data); notify("آزمایش به پرونده متصل شد.","success"); markSteps(); await renderTimeline();
  }

  async function saveDiagnosisV1(){
    if(!selectedEventId)return;
    const payload={event_id:selectedEventId,disease_id:val("confirmedDisease")||val("suspectedDisease")||null,diagnosis_type:val("dxBasisV1")||"clinical",diagnosis_text:val("dxTextV1"),confidence:val("dxConfidenceV1"),diagnosed_by:healthUser.id,diagnosis_date:isoFromJ(val("eventDate"))||new Date().toISOString().slice(0,10),notes:val("dxReasonV1")};
    const r=await supabaseClient.from("health_diagnoses").insert(payload).select("*").single(); if(r.error){notify("خطا در ثبت تشخیص: "+r.error.message,"error");return;}
    caseDiagnoses.push(r.data);
    const update={diagnostic_basis:val("dxBasisV1"),diagnostic_confidence:val("dxConfidenceV1"),case_classification: val("caseClassification") || "undetermined"};
    await supabaseClient.from("health_events").update(update).eq("id",selectedEventId);
    notify("تشخیص ثبت و به پرونده متصل شد.","success"); markSteps(); await renderTimeline();
  }

  async function loadDiagnostics(){
    if(!selectedEventId)return;
    const [labs,dx,diffq,fu]=await Promise.all([
      supabaseClient.from("health_event_labs").select("*").eq("event_id",selectedEventId).order("collection_date",{ascending:false}),
      supabaseClient.from("health_diagnoses").select("*,health_disease_catalog(name_fa)").eq("event_id",selectedEventId).order("diagnosis_date",{ascending:false}),
      supabaseClient.from("health_differential_diagnoses").select("*,health_disease_catalog(name_fa)").eq("event_id",selectedEventId).order("rank_order",{ascending:true}),
      supabaseClient.from("health_follow_ups").select("*").eq("event_id",selectedEventId).order("follow_up_date",{ascending:false})
    ]);
    caseLabs=labs.data||[]; caseDiagnoses=dx.data||[]; caseDifferentials=diffq.data||[]; caseFollowups=fu.data||[];
    const lc=$("labListV1"); if(lc){lc.innerHTML="";caseLabs.forEach(x=>{const row=document.createElement("div");row.className="case-note";row.innerHTML=`<strong>${esc(x.test_type||"آزمایش")}</strong> — ${esc(x.sample_type||"نمونه نامشخص")} | ${esc(x.result_status||"")} | ${esc(x.result_summary||"نتیجه ثبت نشده")}`;lc.appendChild(row);});}
    const latest=caseDiagnoses[0]; if(latest){setVal("dxBasisV1",latest.diagnosis_type);setVal("dxTextV1",latest.diagnosis_text);setVal("dxConfidenceV1",latest.confidence||"moderate");setVal("dxReasonV1",latest.notes||"");}
    const fc=$("followListV1"); if(fc){fc.innerHTML=`<h4>پیگیری‌های ثبت‌شده</h4>`+(caseFollowups.length?`<table class="case-table"><tr><th>تاریخ</th><th>تلفات</th><th>وضعیت بالینی</th><th>اقدام بعدی</th></tr>${caseFollowups.map(x=>`<tr><td>${esc(jalaliFromIso(x.follow_up_date))}</td><td>${esc(x.mortality_count)}</td><td>${esc(x.clinical_status||"-")}</td><td>${esc(x.next_action||"-")}</td></tr>`).join("")}</table>`:`<div class="case-empty">هنوز پیگیری ثبت نشده است.</div>`);}
  }

  async function renderTimeline(){
    const c=$("caseTimelineV1"); if(!c||!selectedEventId)return;
    const ev=caseRecord||healthEvents?.find(x=>x.id===selectedEventId); const items=[];
    if(ev) items.push({date:ev.event_date,title:"ثبت/به‌روزرسانی رخداد",body:`${typeLabelSafe(ev.event_type)} — تلفات ${ev.mortality_count||0}، درگیر ${ev.affected_count||0}`});
    const nec=await supabaseClient.from("health_necropsies").select("necropsy_date,birds_examined,gross_diagnosis,created_at").eq("event_id",selectedEventId).order("necropsy_date",{ascending:true}); (nec.data||[]).forEach(x=>items.push({date:x.necropsy_date,title:"کالبدگشایی",body:`${x.birds_examined||0} پرنده — ${x.gross_diagnosis||"تشخیص ماکروسکوپی ثبت نشده"}`}));
    caseLabs.forEach(x=>items.push({date:x.collection_date||x.result_date,title:"آزمایش",body:`${x.test_type||"آزمایش"} — ${x.result_status||"در انتظار"} — ${x.result_summary||""}`}));
    caseDiagnoses.forEach(x=>items.push({date:x.diagnosis_date,title:"تشخیص",body:`${x.diagnosis_type||""} — ${x.diagnosis_text||""}`}));
    caseFollowups.forEach(x=>items.push({date:x.follow_up_date,title:"پیگیری",body:`وضعیت: ${x.clinical_status||"-"} — اقدام بعدی: ${x.next_action||"-"}`}));
    items.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    c.innerHTML=`<h3>خط زمانی پرونده</h3><div class="case-timeline">${items.length?items.map(x=>`<div class="case-event"><div class="case-event-date">${esc(jalaliFromIso(x.date))}</div><div class="case-event-body"><strong>${esc(x.title)}</strong><br>${esc(x.body)}</div></div>`).join(""):`<div class="case-empty">اطلاعات زمانی کافی ثبت نشده است.</div>`}</div>`;
  }

  function typeLabelSafe(v){const m={mortality:"تلفات",cull:"حذفی",disease:"بیماری",suspected_disease:"بیماری مشکوک",clinical_case:"مورد بالینی",environmental:"محیطی/مدیریتی",other:"سایر"};return m[v]||v||"رخداد سلامت";}

  async function refreshCaseData(){
    if(!selectedEventId)return;
    const r=await supabaseClient.from("health_events").select("*, suspected_disease:health_disease_catalog!suspected_disease_id(id,name_fa), confirmed_disease:health_disease_catalog!confirmed_disease_id(id,name_fa)").eq("id",selectedEventId).maybeSingle(); if(r.data) caseRecord=r.data;
    setCaseHeader(caseRecord); addDiagnosticsUI(); await loadDiagnostics(); await loadSignsV1(selectedEventId); markSteps(); await renderTimeline();
  }

  function markSteps(){
    const hasSigns=document.querySelectorAll("#clinicalSignsContainer input[data-sign-id]:checked").length>0;
    const hasNec=!!caseRecord?.id && caseRecord.__hasNecropsy;
    const hasLab=caseLabs.length>0, hasDx=caseDiagnoses.length>0;
    ["stepClinical","stepNecropsy","stepLab","stepDx","stepAction","stepFollow","stepClose"].forEach(id=>$(id)?.classList.remove("done","current"));
    if(hasSigns) $("stepClinical")?.classList.add("done");
    if(hasNec) $("stepNecropsy")?.classList.add("done");
    if(hasLab) $("stepLab")?.classList.add("done");
    if(hasDx) $("stepDx")?.classList.add("done");
    const current=!hasSigns?"stepClinical":!hasNec?"stepNecropsy":!hasLab?"stepLab":!hasDx?"stepDx":caseRecord?.status!=="closed"?"stepFollow":"stepClose"; $(current)?.classList.add("current");
  }

  async function renderCaseWorkspace(){
    if(!caseRecord)return;
    const chips=$("workspaceCaseChips"); if(chips){chips.innerHTML=`<span class="case-chip">${esc(jalaliFromIso(caseRecord.event_date))}</span><span class="case-chip">سن ${esc(caseRecord.flock_age_days??"-")} روز</span><span class="case-chip">${esc(typeLabelSafe(caseRecord.event_type))}</span><span class="case-chip ${caseRecord.case_priority==='critical'?'alert':caseRecord.case_priority==='high'?'warn':'ok'}">اولویت: ${esc(caseRecord.case_priority||"عادی")}</span><span class="case-chip">${esc(caseRecord.case_classification||"نامشخص")}</span>`;}
    setVal("workspaceCaseCode",caseRecord.case_code||"پرونده بدون کد");
    const n=await supabaseClient.from("health_necropsies").select("id").eq("event_id",caseRecord.id).limit(1); caseRecord.__hasNecropsy=!!n.data?.length;
    addDiagnosticsUI(); await loadDiagnostics(); await loadSignsV1(caseRecord.id); markSteps(); await renderTimeline();
  }

  async function selectCase(id){
    const event=(healthEvents||[]).find(x=>x.id===id); if(!event)return;
    caseMode="edit"; caseRecord=event; selectedEventId=id;
    setCaseHeader(event); populateExistingEventForm(event); renderCaseWorkspace(); openClinical();
  }

  function populateExistingEventForm(e){
    setVal("eventDate",jalaliFromIso(e.event_date));setVal("eventAge",e.flock_age_days);setVal("eventType",e.event_type);setVal("eventStatus",e.status);setVal("mortalityCount",e.mortality_count);setVal("cullCount",e.cull_count);setVal("affectedCount",e.affected_count);setVal("suspectedDisease",e.suspected_disease_id);setVal("confirmedDisease",e.confirmed_disease_id);setVal("severity",e.severity);setVal("diagnosisStatus",e.diagnosis_status);setVal("suddenDeath",String(!!e.sudden_death));setVal("eventNotes",e.notes||"");if($("showInReports"))$("showInReports").checked=!!e.show_in_reports;if($("includeWeekly"))$("includeWeekly").checked=!!e.include_in_weekly_report;if($("includeAnalysis"))$("includeAnalysis").checked=e.include_in_management_analysis!==false;}

  function patchHistoryButtons(){
    const original=window.selectHealthEvent; window.selectHealthEvent=selectCase;
    document.querySelectorAll("#healthHistoryTable button").forEach(btn=>{ if(btn.textContent.includes("مشاهده")) btn.onclick=function(){const row=this.closest("tr");const buttons=[...row.querySelectorAll("button")];const del=buttons.find(b=>b.textContent.includes("حذف")); if(del){const m=del.getAttribute("onclick")||"";const id=(m.match(/'([^']+)'/)||[])[1];if(id)selectCase(id);}}; });
  }

  function patchAgeLogic(){
    const ed=$("eventDate"); if(!ed)return; const sync=()=>{const iso=isoFromJ(val("eventDate"));const age=currentAgeForDate(iso);if(age!=null && caseMode!=="edit")setVal("eventAge",age);}; ed.addEventListener("input",sync);ed.addEventListener("change",sync);
  }

  function setup(){
    injectStyles(); injectCaseMeta(); enhanceClinicalPanel(); addDiagnosticsUI(); patchAgeLogic();
    const form=$("healthEventForm"); if(form) form.addEventListener("submit",submitEventCapture,true);
    if(typeof window.selectHealthEvent === "function") window.selectHealthEvent=selectCase;
    patchHistoryButtons();
    setInterval(()=>{ if(caseRecord?.id && $("panel-clinical")?.classList.contains("active")) refreshCaseData().catch(()=>{}); },120000);
    window.__ADINE_HEALTH_CASE_V1__={selectCase,refreshCaseData,saveCaseMeta};
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",setup,{once:true}); else setup();
})();
