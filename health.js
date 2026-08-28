/* =========================================================
   ADINE POULTRY HEALTH — V2
   Clinical records, vaccination, treatment, laboratory and programs.
   All dates stored as ISO. All medical/product-specific values are entered
   from the actual label/prescription; no unsafe default dose/withdrawal is invented.
========================================================= */
(() => {
  'use strict';
  const db = window.supabaseClient;
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
  const fa = n => Number.isFinite(Number(n)) ? Number(n).toLocaleString('fa-IR') : '—';
  const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('fa-IR') : '—';
  const today = () => new Date().toISOString().slice(0,10);
  const boolVal = v => v === '' || v == null ? null : String(v) === 'true';
  const num = id => { const v = $(id)?.value; return v === '' || v == null ? null : Number(v); };
  const val = id => $(id)?.value?.trim?.() ?? '';
  const set = (id,v) => { if($(id)) $(id).value = v ?? ''; };

  const S = {
    user:null, flock:null, diseases:[], vaccines:[], meds:[], programs:[],
    vaccinations:[], treatments:[], events:[], labs:[], antibodies:[], editing:null
  };

  function status(message, type='ok') {
    const el=$('healthStatus'); if(!el) return;
    el.textContent=message; el.className='alert show '+(type==='err'?'err':type==='warn'?'warn':'ok');
    clearTimeout(status.t); status.t=setTimeout(()=>el.classList.remove('show'),5000);
  }
  function productionFa(x){ return ({broiler:'گوشتی',layer:'تخمگذار',breeder:'مادر',pullet:'پولت'}[x]||x||'—'); }
  function diseaseName(code){ const d=S.diseases.find(x=>x.code===code); return d?.name_fa || code || '—'; }
  function vaccineName(id){ const v=S.vaccines.find(x=>x.id===id); return v?.name || '—'; }
  function medName(id){ const m=S.meds.find(x=>x.id===id); return m?.name_fa || 'داروی ثبت‌نشده'; }
  function ownerId(){ return S.flock?.owner_id || S.user?.id; }

  async function getSelection(){
    try {
      if(typeof window.getCurrentSelection==='function'){
        const r=await Promise.resolve(window.getCurrentSelection());
        if(r?.flock?.id) return r.flock;
        if(r?.flockId) return await fetchFlock(r.flockId);
        if(r?.id && r.production_type) return r;
      }
    } catch(e) { console.warn('selection helper failed',e); }
    for(const k of ['activeFlock','selectedFlock','currentFlock','healthFlock']){
      try { const x=JSON.parse(localStorage.getItem(k)||'null'); if(x?.id) return x; } catch(e){}
    }
    const {data,error}=await db.from('flocks').select('*').eq('owner_id',S.user.id).eq('status','active').order('updated_at',{ascending:false}).limit(1);
    if(error) throw error; return data?.[0]||null;
  }
  async function fetchFlock(id){ const {data,error}=await db.from('flocks').select('*').eq('id',id).single(); if(error) throw error; return data; }

  function ageOn(date){
    if(!S.flock?.placement_date || !date) return null;
    const base=new Date(S.flock.placement_date+'T00:00:00');
    const d=new Date(date+'T00:00:00');
    const diff=Math.floor((d-base)/86400000);
    return Math.max(0,(S.flock.start_age_days||0)+diff);
  }
  function setAutoAge(dateId,ageId){ const a=ageOn(val(dateId)); if(a!==null) set(ageId,a); }
  function calcCoverage(){ const a=num('vaccinationBirdsTargeted'), b=num('vaccinationBirdsVaccinated'); return a>0&&b!=null ? Math.round((b/a)*10000)/100 : null; }
  function selectHtml(options, placeholder='انتخاب کنید') { return `<option value="">${placeholder}</option>`+options.map(o=>`<option value="${esc(o.value)}">${esc(o.label)}</option>`).join(''); }

  async function loadCatalogs(){
    const [d,v,m,p]=await Promise.all([
      db.from('diseases').select('code,name_fa,category,active').eq('active',true).order('name_fa'),
      db.from('vaccines').select('id,name,manufacturer,vaccine_type,route,target_codes,active').eq('active',true).order('name'),
      db.from('health_medication_catalog').select('*').eq('active',true).order('name_fa'),
      db.from('health_vaccination_programs').select('id,program_code,name_fa,production_type,purpose,active').eq('active',true).order('production_type')
    ]);
    if(d.error) throw d.error; if(v.error) throw v.error; if(m.error) throw m.error; if(p.error) throw p.error;
    S.diseases=d.data||[]; S.vaccines=v.data||[]; S.meds=m.data||[]; S.programs=p.data||[];
    fillDiseaseSelects(); fillVaccineSelect(); fillMedicationSelect(); fillProgramSelect();
  }
  function fillDiseaseSelects(){
    const html=selectHtml(S.diseases.map(d=>({value:d.code,label:`${d.name_fa||d.code} (${d.code})`})));
    ['vaccinationDisease','treatmentDisease','diseaseSuspected','labDisease','antibodyDisease'].forEach(id=>{if($(id)) $(id).innerHTML=html;});
  }
  function fillVaccineSelect(){
    const opts=S.vaccines.map(v=>({value:v.id,label:`${v.name}${v.manufacturer?' — '+v.manufacturer:''}`}));
    $('vaccinationVaccine').innerHTML=selectHtml(opts,'انتخاب واکسن');
  }
  function fillMedicationSelect(){
    $('treatmentMedication').innerHTML=selectHtml(S.meds.map(m=>({value:m.id,label:`${m.name_fa}${m.antimicrobial?' — آنتی‌میکروبیال':''}`})),'انتخاب دارو');
  }
  function fillProgramSelect(){
    const type=S.flock?.production_type;
    const arr=S.programs.filter(p=>p.production_type===type);
    $('programSelect').innerHTML=selectHtml(arr.map(p=>({value:p.id,label:p.name_fa})),'برنامه نوع پرورش');
    if(arr[0]) $('programSelect').value=arr[0].id;
  }

  async function loadRecords(){
    const id=S.flock.id;
    const [v,t,e,l,a]=await Promise.all([
      db.from('vaccinations').select('*').eq('flock_id',id).order('vaccine_date',{ascending:false}),
      db.from('treatments').select('*').eq('flock_id',id).order('treatment_date',{ascending:false}),
      db.from('health_events').select('*').eq('flock_id',id).order('event_date',{ascending:false}),
      db.from('lab_tests').select('*').eq('flock_id',id).order('test_date',{ascending:false}),
      db.from('antibody_tests').select('*').eq('flock_id',id).order('test_date',{ascending:false})
    ]);
    for(const r of [v,t,e,l,a]) if(r.error) throw r.error;
    S.vaccinations=v.data||[]; S.treatments=t.data||[]; S.events=e.data||[]; S.labs=l.data||[]; S.antibodies=a.data||[];
    renderAll();
  }

  function renderAll(){
    $('sumVax').textContent=fa(S.vaccinations.length); $('sumTx').textContent=fa(S.treatments.length); $('sumDisease').textContent=fa(S.events.length); $('sumLab').textContent=fa(S.labs.length);
    $('vaxMetric').textContent=fa(S.vaccinations.length); $('txMetric').textContent=fa(S.treatments.length);
    renderVaccinations(); renderTreatments(); renderEvents(); renderLabs(); renderAntibodies(); renderRecent(); renderRisks(); renderProgram();
  }
  function actionButtons(kind,id){ return `<div class="actions"><button class="iconbtn" data-edit="${kind}" data-id="${id}">ویرایش</button><button class="iconbtn" data-delete="${kind}" data-id="${id}">حذف</button></div>`; }
  function renderVaccinations(){
    $('vaccinationHistory').innerHTML=S.vaccinations.length?S.vaccinations.map(r=>`<tr><td>${fmtDate(r.vaccine_date)}</td><td>${fa(r.age_day)}</td><td>${esc(diseaseName(r.disease))}</td><td>${esc(r.vaccine_name||vaccineName(r.vaccine_id))}</td><td>${esc(r.route||'—')}</td><td>${esc(r.batch_number||'—')}</td><td>${r.coverage_percent!=null?fa(r.coverage_percent)+'٪':'—'}</td><td>${actionButtons('vaccination',r.id)}</td></tr>`).join(''):`<tr><td colspan="8" class="empty">هنوز واکسیناسیونی ثبت نشده است.</td></tr>`;
  }
  function renderTreatments(){
    $('treatmentHistory').innerHTML=S.treatments.length?S.treatments.map(r=>`<tr><td>${fmtDate(r.treatment_date)}</td><td>${esc(diseaseName(r.disease_code))}</td><td>${esc(r.medication_name||medName(r.medication_id))}</td><td>${esc(r.dose||((r.dose_value??'')+' '+(r.dose_unit||''))||'—')}</td><td>${r.duration_days!=null?fa(r.duration_days)+' روز':esc(r.duration||'—')}</td><td>${r.withdrawal_end_date?fmtDate(r.withdrawal_end_date):'ثبت نشده'}</td><td>${r.antimicrobial?'<span class="tag antimicrobial">آنتی‌میکروبیال</span>':'<span class="tag">غیرآنتی‌میکروبیال</span>'}</td><td>${actionButtons('treatment',r.id)}</td></tr>`).join(''):`<tr><td colspan="8" class="empty">هنوز درمانی ثبت نشده است.</td></tr>`;
  }
  function renderEvents(){
    $('diseaseHistory').innerHTML=S.events.length?S.events.map(r=>`<tr><td>${fmtDate(r.event_date)}</td><td>${esc(r.event_type)}</td><td>${esc(diseaseName(r.suspected_disease_id?S.diseases.find(d=>d.id===r.suspected_disease_id)?.code:null)||r.suspected_cause||'—')}</td><td>${fa(r.affected_count)}</td><td>${fa(r.mortality_count)}</td><td>${esc(r.diagnosis_status||'—')}</td><td>${actionButtons('event',r.id)}</td></tr>`).join(''):`<tr><td colspan="7" class="empty">رویداد سلامت ثبت نشده است.</td></tr>`;
  }
  function renderLabs(){ $('labHistory')?.remove(); }
  function renderAntibodies(){
    $('antibodyHistory').innerHTML=S.antibodies.length?S.antibodies.map(r=>`<tr><td>${fmtDate(r.test_date)}</td><td>${esc(diseaseName(r.disease_code))}</td><td>${esc(r.antibody_stage||'—')}</td><td>${esc(r.test_type||'—')}</td><td>${fa(r.sample_count)}</td><td>${r.mean_value??'—'}</td><td>${r.cv_percent!=null?fa(r.cv_percent)+'٪':'—'}</td><td>${actionButtons('antibody',r.id)}</td></tr>`).join(''):`<tr><td colspan="8" class="empty">تیتر آنتی‌بادی ثبت نشده است.</td></tr>`;
  }
  function renderRecent(){
    const rows=[...S.vaccinations.map(x=>({d:x.vaccine_date,t:'واکسیناسیون',s:x.vaccine_name})),...S.treatments.map(x=>({d:x.treatment_date,t:'درمان',s:x.medication_name})),...S.events.map(x=>({d:x.event_date,t:'رویداد سلامت',s:x.event_type}))].sort((a,b)=>String(b.d).localeCompare(String(a.d))).slice(0,8);
    $('recentTimeline').innerHTML=rows.length?rows.map(r=>`<div class="timeline-item"><div class="timeline-age">${fmtDate(r.d)}</div><div class="timeline-main"><b>${esc(r.t)}</b><small>${esc(r.s||'—')}</small></div><span class="tag">ثبت‌شده</span></div>`).join(''):`<div class="empty">پرونده سلامت هنوز سابقه‌ای ندارد.</div>`;
  }
  function renderRisks(){
    const risks=[];
    const open=S.events.filter(e=>e.status==='open').length;
    const withdrawals=S.treatments.filter(t=>t.withdrawal_end_date && t.withdrawal_end_date>=today()).length;
    const adverse=S.vaccinations.filter(v=>v.adverse_reaction).length;
    if(open) risks.push(`⚠️ ${fa(open)} رویداد سلامت باز نیاز به پیگیری دارد.`);
    if(withdrawals) risks.push(`⏳ ${fa(withdrawals)} درمان دارای دوره منع مصرف فعال است.`);
    if(adverse) risks.push(`🔎 ${fa(adverse)} سابقه واکنش/عارضه پس از واکسن ثبت شده است.`);
    if(!risks.length) risks.push('✅ مورد هشدار خودکار از داده‌های ثبت‌شده پیدا نشد؛ این به معنی سلامت قطعی گله نیست.');
    $('riskList').innerHTML=risks.map(x=>`<div class="timeline-item"><div class="timeline-main"><b>${esc(x)}</b><small>کنترل خودکار پرونده</small></div></div>`).join('');
  }
  async function renderProgram(){
    const pid=$('programSelect')?.value; if(!pid) { $('programTimeline').innerHTML='<div class="empty">برنامه‌ای برای این نوع پرورش موجود نیست.</div>'; return; }
    const {data,error}=await db.from('health_vaccination_program_items').select('*').eq('program_id',pid).eq('active',true).order('sort_order');
    if(error){ $('programTimeline').innerHTML='<div class="empty">بارگذاری برنامه انجام نشد.</div>'; return; }
    $('programTimeline').innerHTML=data?.length?data.map(x=>`<div class="timeline-item"><div class="timeline-age">روز ${fa(x.age_day_min)}–${x.age_day_max>=9999?'∞':fa(x.age_day_max)}</div><div class="timeline-main"><b>${esc(diseaseName(x.disease_code))}</b><small>${esc(x.route||'')} ${x.vaccine_type?'· '+esc(x.vaccine_type):''} · ${esc(x.target_note||'')}</small><small>${esc(x.administration_note||'')}</small></div><span class="tag ${x.priority}">${x.priority==='core'?'هسته':x.priority==='conditional'?'مشروط':'اختیاری'}</span></div>`).join(''):'<div class="empty">موردی ثبت نشده است.</div>';
  }

  function clearVaccination(){ $('vaccinationForm').reset(); set('vaccinationId',''); $('vaccinationCancel').classList.add('hidden'); $('vaccinationSave').textContent='ثبت واکسیناسیون'; set('vaccinationDate',today()); setAutoAge('vaccinationDate','vaccinationAge'); }
  function clearTreatment(){ $('treatmentForm').reset(); set('treatmentId',''); $('treatmentCancel').classList.add('hidden'); $('treatmentSave').textContent='ثبت درمان'; set('treatmentDate',today()); setAutoAge('treatmentDate','treatmentDurationDays'); }

  async function saveVaccination(e){
    e.preventDefault(); if(!S.flock) return status('گله فعال انتخاب نشده است.','err');
    const date=val('vaccinationDate'); const disease=val('vaccinationDisease'); const vaccineId=val('vaccinationVaccine');
    if(!date||!disease||!vaccineId) return status('تاریخ، بیماری/هدف و واکسن الزامی است.','err');
    const vac=S.vaccines.find(v=>v.id===vaccineId); const coverage=calcCoverage();
    const payload={flock_id:S.flock.id,owner_id:ownerId(),vaccine_date:date,vaccine_name:vac?.name||'واکسن ثبت‌نشده',disease,manufacturer:vac?.manufacturer||null,batch_number:val('vaccinationBatch')||null,route:val('vaccinationRoute')||vac?.route||null,dose:num('vaccinationDose'),dose_unit:val('vaccinationDoseUnit')||null,administered_by:val('vaccinationAdministeredBy')||null,notes:val('vaccinationNotes')||null,production_type:S.flock.production_type,age_day:num('vaccinationAge'),vaccine_type:val('vaccinationType')||vac?.vaccine_type||null,birds_targeted:num('vaccinationBirdsTargeted'),birds_vaccinated:num('vaccinationBirdsVaccinated'),coverage_percent:coverage,vaccine_expiry_date:val('vaccinationExpiry')||null,cold_chain_ok:boolVal(val('vaccinationColdChain')),mixing_water_quality_ok:boolVal(val('vaccinationWaterQuality')),adverse_reaction:val('vaccinationReaction')||null,verification_status:'recorded',program_item_id:null,created_by:S.user.id};
    const id=val('vaccinationId'); const q=id?db.from('vaccinations').update(payload).eq('id',id).eq('flock_id',S.flock.id):db.from('vaccinations').insert(payload);
    const {error}=await q; if(error) return status(error.message,'err'); status(id?'واکسیناسیون ویرایش شد.':'واکسیناسیون ثبت شد.'); clearVaccination(); await loadRecords();
  }
  async function saveTreatment(e){
    e.preventDefault(); if(!S.flock) return status('گله فعال انتخاب نشده است.','err');
    const date=val('treatmentDate'), medId=val('treatmentMedication'); if(!date||!medId) return status('تاریخ شروع و دارو الزامی است.','err');
    const med=S.meds.find(m=>m.id===medId); const antimicrobial=val('treatmentAntimicrobial')==='true';
    let withdrawalEnd=val('treatmentWithdrawalEnd')||null;
    const meat=num('treatmentMeatWithdrawal'), egg=num('treatmentEggWithdrawal');
    const end=val('treatmentEndDate')||date; const days=S.flock.production_type==='layer'||S.flock.production_type==='breeder'?egg:meat;
    if(!withdrawalEnd && days!=null){ const d=new Date(end+'T00:00:00'); d.setDate(d.getDate()+Math.ceil(days)); withdrawalEnd=d.toISOString().slice(0,10); }
    const payload={flock_id:S.flock.id,owner_id:ownerId(),treatment_date:date,end_date:val('treatmentEndDate')||null,disease_code:val('treatmentDisease')||null,medication_id:medId,medication_name:med?.name_fa||'داروی ثبت‌نشده',active_ingredient:val('treatmentActive')||med?.active_ingredient||null,dose:val('treatmentDoseValue')?`${val('treatmentDoseValue')} ${val('treatmentDoseUnit')}`:null,route:val('treatmentRoute')||null,duration:val('treatmentDurationDays')?`${val('treatmentDurationDays')} روز`:null,withdrawal_period:withdrawalEnd?`پایان ${withdrawalEnd}`:null,result:val('treatmentResult')||null,notes:val('treatmentNotes')||null,production_type:S.flock.production_type,indication_type:val('treatmentDisease')?'disease':'other',diagnosis_status:val('treatmentDiagnosisStatus'),prescriber:val('treatmentPrescriber')||null,prescription_number:val('treatmentPrescription')||null,supplier:null,batch_number:val('treatmentBatch')||null,expiry_date:val('treatmentExpiry')||null,dose_value:num('treatmentDoseValue'),dose_unit:val('treatmentDoseUnit')||null,frequency:val('treatmentFrequency')||null,duration_days:num('treatmentDurationDays'),birds_treated:num('treatmentBirds'),body_weight_kg:num('treatmentBodyWeight'),water_intake_l:null,feed_intake_kg:null,total_product_quantity:num('treatmentQuantity'),total_product_unit:val('treatmentQuantityUnit')||null,antimicrobial,stewardship_reason:val('treatmentStewardshipReason')||null,lab_basis:val('treatmentLabBasis')||null,response_status:val('treatmentResult')||null,meat_withdrawal_days:meat,egg_withdrawal_days:egg,withdrawal_end_date:withdrawalEnd,withdrawal_verified:val('treatmentWithdrawalVerified')==='true',created_by:S.user.id};
    if(antimicrobial && !payload.stewardship_reason && !payload.lab_basis) return status('برای آنتی‌میکروبیال دلیل انتخاب یا مبنای آزمایش/آنتی‌بیوگرام را ثبت کنید.','warn');
    const id=val('treatmentId'); const q=id?db.from('treatments').update(payload).eq('id',id).eq('flock_id',S.flock.id):db.from('treatments').insert(payload);
    const {error}=await q; if(error) return status(error.message,'err'); status(id?'درمان ویرایش شد.':'درمان ثبت شد.'); clearTreatment(); await loadRecords();
  }
  async function saveEvent(e){
    e.preventDefault(); const date=val('diseaseDate'); if(!date) return status('تاریخ رویداد الزامی است.','err');
    const payload={owner_id:ownerId(),farm_id:S.flock.farm_id,house_id:S.flock.house_id,flock_id:S.flock.id,event_date:date,flock_age_days:num('diseaseAge'),event_type:val('diseaseEventType'),status:'open',mortality_count:num('diseaseMortality')||0,cull_count:num('diseaseCull')||0,affected_count:num('diseaseAffected')||0,flock_population_snapshot:num('diseasePopulation'),severity:val('diseaseSeverity'),diagnosis_status:val('diseaseDiagnosisStatus'),sudden_death:val('diseaseEventType')==='mortality',notes:val('diseaseNotes')||null,veterinarian_notes:val('diseaseVetNotes')||null,follow_up_required:val('diseaseFollowup')==='true',follow_up_date:val('diseaseFollowupDate')||null,include_in_weekly_report:true,include_in_management_analysis:true,show_in_reports:true,report_level:'private',production_type:S.flock.production_type,syndrome:val('diseaseEventType'),suspected_cause:val('diseaseSuspected')||null,diagnostic_basis:val('diseaseDiagnosisStatus'),recurrence:false,biosecurity_alert:false,created_by:S.user.id};
    const {error}=await db.from('health_events').insert(payload); if(error) return status(error.message,'err'); status('رویداد سلامت ثبت شد.'); $('diseaseForm').reset(); set('diseaseDate',today()); setAutoAge('diseaseDate','diseaseAge'); await loadRecords();
  }
  async function saveLab(e){
    e.preventDefault(); const payload={owner_id:ownerId(),farm_id:S.flock.farm_id,house_id:S.flock.house_id,flock_id:S.flock.id,test_date:val('labDate'),test_type:val('labTestType')||'سایر',disease_code:val('labDisease')||null,sample_type:val('labSampleType')||null,sample_count:num('labSamples'),positive_count:num('labPositive'),result:val('labResult')||null,antibiotic_sensitivity:val('labSensitivity')||null,laboratory:val('labLaboratory')||null,notes:null,production_type:S.flock.production_type,test_method:val('labTestType')||null,isolate:val('labIsolate')||null,susceptibility_method:val('labSensitivity')?'recorded':null,report_date:val('labDate'),interpretation:val('labResult')||null};
    const {error}=await db.from('lab_tests').insert(payload); if(error) return status(error.message,'err'); status('آزمایش ثبت شد.'); $('labForm').reset(); set('labDate',today()); await loadRecords();
  }
  async function saveAntibody(e){
    e.preventDefault(); const payload={owner_id:ownerId(),farm_id:S.flock.farm_id,house_id:S.flock.house_id,flock_id:S.flock.id,disease_code:val('antibodyDisease'),test_type:val('antibodyTestType'),antibody_stage:val('antibodyStage'),test_date:val('antibodyDate'),flock_age_days:num('antibodyAge'),sample_count:num('antibodySamples'),mean_value:num('antibodyMean'),gmt:num('antibodyGmt'),cv_percent:num('antibodyCv'),min_value:num('antibodyMin'),max_value:num('antibodyMax'),lab_name:val('antibodyLab')||null,notes:val('antibodyNotes')||null,production_type:S.flock.production_type,assay_kit:null,laboratory_report_number:null,interpretation:val('antibodyInterpretation')||null};
    const {error}=await db.from('antibody_tests').insert(payload); if(error) return status(error.message,'err'); status('تیتر آنتی‌بادی ثبت شد.'); $('antibodyForm').reset(); set('antibodyDate',today()); setAutoAge('antibodyDate','antibodyAge'); await loadRecords();
  }

  function editVaccination(r){
    set('vaccinationId',r.id); set('vaccinationDate',r.vaccine_date); set('vaccinationAge',r.age_day); set('vaccinationDisease',r.disease); set('vaccinationVaccine',S.vaccines.find(v=>v.name===r.vaccine_name)?.id||''); set('vaccinationType',r.vaccine_type); set('vaccinationRoute',r.route); set('vaccinationDose',r.dose); set('vaccinationDoseUnit',r.dose_unit); set('vaccinationBirdsTargeted',r.birds_targeted); set('vaccinationBirdsVaccinated',r.birds_vaccinated); set('vaccinationBatch',r.batch_number); set('vaccinationExpiry',r.vaccine_expiry_date); set('vaccinationAdministeredBy',r.administered_by); set('vaccinationColdChain',r.cold_chain_ok); set('vaccinationWaterQuality',r.mixing_water_quality_ok); set('vaccinationReaction',r.adverse_reaction); set('vaccinationNotes',r.notes); $('vaccinationCancel').classList.remove('hidden'); $('vaccinationSave').textContent='ذخیره ویرایش'; switchTab('vaccination'); }
  function editTreatment(r){
    set('treatmentId',r.id); set('treatmentDate',r.treatment_date); set('treatmentEndDate',r.end_date); set('treatmentDisease',r.disease_code); set('treatmentMedication',r.medication_id); set('treatmentActive',r.active_ingredient); set('treatmentRoute',r.route); set('treatmentDoseValue',r.dose_value); set('treatmentDoseUnit',r.dose_unit); set('treatmentFrequency',r.frequency); set('treatmentDurationDays',r.duration_days); set('treatmentBirds',r.birds_treated); set('treatmentBodyWeight',r.body_weight_kg); set('treatmentQuantity',r.total_product_quantity); set('treatmentQuantityUnit',r.total_product_unit); set('treatmentAntimicrobial',r.antimicrobial); set('treatmentDiagnosisStatus',r.diagnosis_status); set('treatmentPrescriber',r.prescriber); set('treatmentPrescription',r.prescription_number); set('treatmentBatch',r.batch_number); set('treatmentExpiry',r.expiry_date); set('treatmentMeatWithdrawal',r.meat_withdrawal_days); set('treatmentEggWithdrawal',r.egg_withdrawal_days); set('treatmentWithdrawalEnd',r.withdrawal_end_date); set('treatmentWithdrawalVerified',r.withdrawal_verified); set('treatmentLabBasis',r.lab_basis); set('treatmentStewardshipReason',r.stewardship_reason); set('treatmentResult',r.result); set('treatmentNotes',r.notes); $('treatmentCancel').classList.remove('hidden'); $('treatmentSave').textContent='ذخیره ویرایش'; switchTab('treatment'); }

  async function remove(kind,id){
    const phrase=prompt('این داده حساس است و حذف آن قابل بازیابی نیست. برای تأیید عبارت «حذف شود» را دقیقاً وارد کنید:');
    if(phrase!=='حذف شود') return status('حذف لغو شد.','warn');
    const table={vaccination:'vaccinations',treatment:'treatments',event:'health_events',antibody:'antibody_tests',lab:'lab_tests'}[kind];
    if(!table) return;
    const {error}=await db.from(table).delete().eq('id',id).eq('flock_id',S.flock.id);
    if(error) return status('حذف انجام نشد: '+error.message,'err');
    status('رکورد حذف شد.'); await loadRecords();
  }

  function switchTab(tab){ document.querySelectorAll('.health-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab)); document.querySelectorAll('.health-panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+tab)); if(tab==='program') renderProgram(); }
  function bind(){
    document.querySelectorAll('.health-tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
    $('vaccinationForm').addEventListener('submit',saveVaccination); $('treatmentForm').addEventListener('submit',saveTreatment); $('diseaseForm').addEventListener('submit',saveEvent); $('labForm').addEventListener('submit',saveLab); $('antibodyForm').addEventListener('submit',saveAntibody);
    $('vaccinationCancel').onclick=clearVaccination; $('treatmentCancel').onclick=clearTreatment; $('printBtn').onclick=()=>window.print(); $('programSelect').addEventListener('change',renderProgram);
    ['vaccinationDate','treatmentDate','diseaseDate','antibodyDate'].forEach(id=>$(id)?.addEventListener('change',()=>{const map={vaccinationDate:'vaccinationAge',treatmentDate:'treatmentDurationDays',diseaseDate:'diseaseAge',antibodyDate:'antibodyAge'}; if(id!=='treatmentDate') setAutoAge(id,map[id]);}));
    $('vaccinationDisease').addEventListener('change',()=>{ const code=val('vaccinationDisease'); const filtered=S.vaccines.filter(v=>!code || !Array.isArray(v.target_codes) || v.target_codes.includes(code)); $('vaccinationVaccine').innerHTML=selectHtml(filtered.map(v=>({value:v.id,label:`${v.name}${v.manufacturer?' — '+v.manufacturer:''}`})),'انتخاب واکسن'); });
    document.addEventListener('click',e=>{ const ed=e.target.closest('[data-edit]'); const del=e.target.closest('[data-delete]'); if(ed){const kind=ed.dataset.edit,id=ed.dataset.id; const r=({vaccination:S.vaccinations,treatment:S.treatments,event:S.events,antibody:S.antibodies,lab:S.labs}[kind]||[]).find(x=>x.id===id); if(kind==='vaccination')editVaccination(r); if(kind==='treatment')editTreatment(r); if(kind==='event'){status('برای رویدادهای سلامت در این نسخه ویرایش مستقیم غیرفعال است؛ رکورد جدید ثبت کنید.','warn');} if(kind==='antibody'){status('برای تیتر آنتی‌بادی در این نسخه ویرایش مستقیم غیرفعال است؛ رکورد جدید ثبت کنید.','warn');}} if(del) remove(del.dataset.delete,del.dataset.id); });
  }

  async function init(){
    try{
      const {data,error}=await db.auth.getUser(); if(error) throw error; S.user=data?.user; if(!S.user) return location.href='login.html';
      S.flock=await getSelection(); if(!S.flock){ $('flockInfo').textContent='هیچ گله فعالی انتخاب نشده است.'; status('ابتدا از بخش گله‌ها یک گله فعال انتخاب کنید.','warn'); return; }
      $('flockName').textContent=S.flock.flock_name||S.flock.name||'گله فعال'; $('flockMeta').textContent=`${productionFa(S.flock.production_type)} · ${S.flock.flock_code||'بدون کد'} · ${S.flock.genetics||S.flock.strain||'سویه ثبت نشده'}`; $('flockInfo').textContent=`${productionFa(S.flock.production_type)} | ${S.flock.flock_name||'گله'} | شروع: ${fmtDate(S.flock.placement_date)}`; $('prodMetric').textContent=productionFa(S.flock.production_type); const age=ageOn(today()); $('ageMetric').textContent=age==null?'—':fa(age)+' روز';
      ['vaccinationDate','treatmentDate','diseaseDate','labDate','antibodyDate'].forEach(id=>set(id,today())); setAutoAge('vaccinationDate','vaccinationAge'); setAutoAge('diseaseDate','diseaseAge'); setAutoAge('antibodyDate','antibodyAge');
      await loadCatalogs(); await loadRecords(); bind();
    }catch(err){ console.error(err); status('بارگذاری بخش سلامت با خطا مواجه شد: '+(err.message||err),'err'); }
  }
  window.healthModule={reload:loadRecords};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();