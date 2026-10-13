/* ADINE — LAYER DAILY MONITORING V1
   Completely isolated storage/calculation path from broiler daily/weekly engines.
*/
(function(g){'use strict';
let flock=null,user=null,records=[],current=null,historyPage=1;const HISTORY_PAGE_SIZE=20;
const $=id=>document.getElementById(id);
const n=v=>{const x=Number(String(v??'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٬،,]/g,''));return Number.isFinite(x)?x:null};
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const selectedFlockId=()=>{try{if(typeof getCurrentSelection==='function'){const s=getCurrentSelection()||{};if(s.flockId)return String(s.flockId);if(s.flock_id)return String(s.flock_id);if(s.id)return String(s.id)}}catch(_){}for(const k of ['adine_poultry_current_selection','current_selection','adine_selected_flock']){try{const raw=localStorage.getItem(k);if(!raw)continue;try{const o=JSON.parse(raw);const id=o?.flockId||o?.flock_id||o?.id;if(id)return String(id)}catch(_){if(!raw.trim().startsWith('{'))return String(raw).trim()}}catch(_) {}}try{const p=new URLSearchParams(location.search);const q=p.get('flock_id')||p.get('flockId');if(q)return q}catch(_){}try{const tp=window.top&&window.top!==window?new URLSearchParams(window.top.location.search):null;const q=tp?.get('flock_id')||tp?.get('flockId');if(q)return q}catch(_){}return ''};
function ageFrom(date){if(!date||!flock?.placement_date)return null;return Math.floor((new Date(date+'T00:00:00')-new Date(flock.placement_date+'T00:00:00'))/86400000)+1}
function set(id,v){if($(id))$(id).value=v??''} function val(id){return $(id)?.value??''}
function openingBirds(){return n(flock?.current_bird_count)??n(flock?.initial_bird_count)}
function avgPop(){const d=n(val('openingBirds'));return d&&d>0?d:null}
function resolveStd(){return g.ADINE_LAYER_DAILY_STANDARDS_V1.resolve(flock||{})}
function metricRef(std,metric,age){try{return g.ADINE_LAYER_STANDARDS_ENGINE_V1.metricAtAge(std,metric,age)||{value:null}}catch(_){return {value:null}}}
function avgPrevious(metric,days){
 const d=String(val('recordDate'));const rows=records.filter(r=>String(r.record_date)<d).slice(0,days);
 const vals=rows.map(r=>n(r[metric])).filter(v=>v!=null);
 return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
}
function pctDelta(actual,ref){return actual!=null&&ref!=null&&Number(ref)!==0?((actual-ref)/ref)*100:null}
function setStatus(state,reason){
 const labels={stable:'پایدار',improving:'بهبود',watch:'نیازمند پایش',investigate:'نیازمند بررسی'};
 const el=$('sStatus');if(el){el.textContent=labels[state]||'—';el.className=state==='stable'||state==='improving'?'ok':state==='watch'?'warn':'bad';}
 return {state,reason};
}
function calc(){
 const pop=avgPop()||openingBirds(), eggs=n(val('eggCount')),feed=n(val('feedQuantity')),water=n(val('waterQuantity')),ew=n(val('eggWeight'));
 const saleable=n(val('saleableEggCount')),cracked=n(val('crackedEggCount')),dirty=n(val('dirtyEggCount')),soft=n(val('softShellEggCount')),misshapen=n(val('misshapenEggCount')),floor=n(val('floorEggCount'));
 const metrics=g.ADINE_LAYER_CALCULATION_ENGINE_V1.dailyMetrics({liveBirds:pop,placedBirds:n(flock?.initial_bird_count),eggCount:eggs,feedKg:feed,waterL:water,averageEggWeightG:ew,saleableEggCount:saleable,crackedEggCount:cracked,dirtyEggCount:dirty,softShellEggCount:soft,misshapenEggCount:misshapen,floorEggCount:floor});
 const henDay=metrics.henDayProductionPercent,feedHen=metrics.feedPerHenG,waterHen=metrics.waterPerHenMl,ratio=metrics.waterFeedRatio,mass=metrics.eggMassGPerHenDay,fpe=metrics.feedPerEggG,fpm=metrics.feedPerEggMass;
 const salePct=metrics.saleableEggPercent,defectPct=metrics.eggDefectPercent;
 set('henDay',henDay?.toFixed(2));set('feedPerHen',feedHen?.toFixed(2));set('waterPerHen',waterHen?.toFixed(1));set('waterFeedRatio',ratio?.toFixed(2));set('eggMass',mass?.toFixed(2));set('feedPerEgg',fpe?.toFixed(2));set('feedPerEggMass',fpm?.toFixed(3));set('saleableEggPercent',salePct?.toFixed(2));set('eggDefectPercent',defectPct?.toFixed(2));
 const mort=n(val('mortalityCount'))||0,cull=n(val('cullCount'))||0,init=n(flock?.initial_bird_count);
 const prev=records.filter(r=>String(r.record_date)<String(val('recordDate'))),prevMort=prev.reduce((a,r)=>a+(n(r.mortality_count)||0),0),prevCull=prev.reduce((a,r)=>a+(n(r.cull_count)||0),0),cum=prevMort+mort,cumCull=prevCull+cull;
 set('livability',g.ADINE_LAYER_CALCULATION_ENGINE_V1.livabilityPercent(init,cum,cumCull)?.toFixed(2)??'');
 $('sProd').textContent=henDay!=null?henDay.toFixed(1)+'%':'—';$('sFeed').textContent=feedHen!=null?feedHen.toFixed(1)+' g':'—';$('sWater').textContent=waterHen!=null?Math.round(waterHen)+' ml':'—';$('sMass').textContent=mass!=null?mass.toFixed(1)+' g':'—';$('sMort').textContent=pop&&mort!=null?(mort/pop*100).toFixed(3)+'%':'—';
 const std=resolveStd(),age=n(val('ageDays'))||ageFrom(val('recordDate'))||null,ref={feed:metricRef(std,'dailyFeed',age),water:metricRef(std,'dailyWater',age),henDay:metricRef(std,'henDayProduction',age),eggWeight:metricRef(std,'eggWeight',age)},daily=std.daily||std.management?.daily||g.ADINE_LAYER_STANDARDS_ENGINE_V1.management.daily||{};
 const metricRefs=[ref.feed,ref.water,ref.henDay,ref.eggWeight];
 const officialMetric=metricRefs.some(x=>x?.sourceType===g.ADINE_LAYER_STANDARDS_ENGINE_V1.OFFICIAL&&!x.isFallback);
 const provisionalMetric=metricRefs.some(x=>x?.sourceType==='provisional_breeder_guide'&&!x.isFallback);
 const managementMetric=metricRefs.some(x=>x?.isFallback)||Boolean(daily.waterFeed||daily.humidity||daily.temp||daily.mortality)||(!officialMetric&&!provisionalMetric);
 const referenceSource=officialMetric&&(managementMetric||provisionalMetric)?'mixed':officialMetric?'official':provisionalMetric&&managementMetric?'provisional_mixed':provisionalMetric?'provisional':'management';
 const deviations={source:referenceSource,sourceByMetric:{feed:ref.feed.sourceType||null,water:ref.water.sourceType||null,henDay:ref.henDay.sourceType||null,eggWeight:ref.eggWeight.sourceType||null,waterFeed:daily.waterFeed?'management-screening':null,humidity:daily.humidity?'management-screening':null,temperature:daily.temp?'management-screening':null,mortality:daily.mortality?'management-screening':null},referenceRanges:{feed:ref.feed.referenceKind==='range'?{min:ref.feed.min,max:ref.feed.max}:null,water:ref.water.referenceKind==='range'?{min:ref.water.min,max:ref.water.max}:null,henDay:ref.henDay.referenceKind==='range'?{min:ref.henDay.min,max:ref.henDay.max}:null,eggWeight:ref.eggWeight.referenceKind==='range'?{min:ref.eggWeight.min,max:ref.eggWeight.max}:null},interpolatedByMetric:{feed:Boolean(ref.feed.isInterpolated),water:Boolean(ref.water.isInterpolated),henDay:Boolean(ref.henDay.isInterpolated),eggWeight:Boolean(ref.eggWeight.isInterpolated)},feed:pctDelta(feedHen,ref.feed.value),water:pctDelta(waterHen,ref.water.value),henDay:pctDelta(henDay,ref.henDay.value),eggWeight:pctDelta(ew,ref.eggWeight.value),waterFeed:daily.waterFeed&&ratio!=null?{value:ratio,deltaPercent:null}:null};
 const prev3={prod:avgPrevious('hen_day_production_percent',3),feed:avgPrevious('feed_per_hen_g',3),water:avgPrevious('water_per_hen_ml',3),defect:avgPrevious('egg_defect_percent',3)};
 const temp=n(val('houseTemp')),hum=n(val('humidity')),mortPct=pop?mort/pop*100:null;
 const healthSignals=[val('appetite'),val('respiratory'),val('droppings'),val('activity'),val('pecking'),val('keelBone'),val('locomotion'),val('footpad'),val('nestUse'),val('eggShellQuality')];
 const assessment=g.ADINE_LAYER_CALCULATION_ENGINE_V1.assessDaily({
  actual:{feedPerHenG:feedHen,waterPerHenMl:waterHen,henDayProductionPercent:henDay,eggWeightG:ew,eggDefectPercent:defectPct,waterFeedRatio:ratio,humidityPercent:hum,temperatureC:temp,mortalityPercent:mortPct,healthSignals,eggCount:eggs,saleableEggCount:saleable,crackedEggCount:cracked,dirtyEggCount:dirty,softShellEggCount:soft,misshapenEggCount:misshapen,floorEggCount:floor,liveBirds:pop,placedBirds:init,mortalityCount:mort,cullCount:cull,feedKg:feed,waterL:water},
  reference:{feed:ref.feed,water:ref.water,henDayProductionPercent:ref.henDay,eggWeightG:ref.eggWeight,waterFeed:daily.waterFeed,humidity:daily.humidity,temperature:daily.temp,mortalityMax:daily.mortality?.max},
  previous:prev3,referenceSource
 });
 const state=assessment.state,reason=assessment.reason,reasons=assessment.reasons;
 if(saleable==null&&eggs!=null&&((cracked||0)+(dirty||0)+(soft||0)+(misshapen||0)+(floor||0))>0)reasons.push('برای محاسبه دقیق درصد قابل فروش، تعداد تخم قابل فروش ثبت شود.');
 if(assessment.dataQualityFlags.length)reasons.push('داده‌های دارای خطا باید پیش از تفسیر عملکرد اصلاح شوند.');
 setStatus(state,reason);
 let alerts=[];if(referenceSource==='management'||referenceSource==='mixed')alerts.push(referenceSource==='mixed'?'مقایسه ترکیبی است: منحنی رسمی/مرجع‌های دیگر و آستانه‌های مدیریتی برای شاخص‌های متفاوت استفاده می‌شوند.':'مقایسه از مرجع مدیریتی غربالگری استفاده می‌کند؛ این مرجع استاندارد جهانی یا منحنی رسمی سویه نیست.');
 if(referenceSource==='provisional'||referenceSource==='provisional_mixed')alerts.push('حداقل یکی از شاخص‌ها از نقاط عددی موقت راهنمای سویه استفاده می‌کند که هنوز ردیف‌به‌ردیف با نسخهٔ رسمی تطبیق نهایی نشده‌اند؛ این مقایسه را قطعی تلقی نکنید.');
 if(Object.values(deviations.interpolatedByMetric||{}).some(Boolean))alerts.push('بخشی از مقدار مرجع از درون‌یابی بین نقاط مستند به‌دست آمده و عدد مستقیم جدول سازنده نیست.');
 if(std.systemMismatchReason)alerts.push(std.systemMismatchReason);
 if(reasons.length)alerts.push(reasons.slice(0,5).join(' • '));
 $('alert').className=alerts.length?'alert show':'alert';$('alert').innerHTML=alerts.map(esc).join('<br>');
 return {state,reason,deviations,defectPct,salePct,assessment,calculationEngineVersion:g.ADINE_LAYER_CALCULATION_ENGINE_V1.version,standardsVersion:g.ADINE_LAYER_STANDARDS_ENGINE_V1.version,standardLabel:referenceSource==='official'?(std.sourceLabel||std.label||std.strain):referenceSource==='mixed'?'مرجع ترکیبی: راهنمای سویه + آستانه‌های مدیریتی غربالگری':referenceSource==='provisional_mixed'?'نقاط موقت راهنمای سویه + آستانه‌های مدیریتی غربالگری':referenceSource==='provisional'?'نقاط موقت راهنمای سویه — نیازمند تطبیق':'مرجع مدیریتی غربالگری غیررسمی',standardSource:std.sourceUrl||null,standardSystemMismatch:std.systemMismatchReason||null};
}
function payload(){const analysis=calc();const pop=avgPop()||openingBirds();const eggs=n(val('eggCount')),feed=n(val('feedQuantity')),water=n(val('waterQuantity')),ew=n(val('eggWeight'));const metrics=g.ADINE_LAYER_CALCULATION_ENGINE_V1.dailyMetrics({liveBirds:pop,placedBirds:n(flock?.initial_bird_count),eggCount:eggs,feedKg:feed,waterL:water,averageEggWeightG:ew,mortalityCount:n(val('mortalityCount')),cullCount:n(val('cullCount')),cumulativeMortalityCount:cumMort,cumulativeCullCount:cumCull,saleableEggCount:n(val('saleableEggCount')),crackedEggCount:n(val('crackedEggCount')),dirtyEggCount:n(val('dirtyEggCount')),softShellEggCount:n(val('softShellEggCount')),misshapenEggCount:n(val('misshapenEggCount')),floorEggCount:n(val('floorEggCount'))});const hen=metrics.henDayProductionPercent,henHoused=metrics.henHousedProductionPercent,mass=metrics.eggMassGPerHenDay;const prev=records.filter(r=>String(r.record_date)<String(val('recordDate')));const cumMort=prev.reduce((a,r)=>a+(n(r.mortality_count)||0),0)+(n(val('mortalityCount'))||0);const cumCull=prev.reduce((a,r)=>a+(n(r.cull_count)||0),0)+(n(val('cullCount'))||0);const init=n(flock?.initial_bird_count);
 const jj=g.ADINE_LAYER_PERIOD_ENGINE_V1.toJalali(val('recordDate'));const mm=jj?jj.year+'-'+String(jj.month).padStart(2,'0'):null;return {flock_id:flock.id,farm_id:flock.farm_id,house_id:flock.house_id,owner_id:user.id,record_date:val('recordDate'),jalali_year:jj?.year||null,jalali_month:jj?.month||null,jalali_day:jj?.day||null,monitoring_month_key:mm,age_days:n(val('ageDays')),opening_birds:pop,mortality_count:n(val('mortalityCount'))||0,cull_count:n(val('cullCount'))||0,mortality_percent:metrics.mortalityPercent,cull_percent:metrics.cullPercent,cumulative_mortality_count:cumMort,cumulative_cull_count:cumCull,cumulative_mortality_percent:metrics.cumulativeMortalityPercent,livability_percent:g.ADINE_LAYER_CALCULATION_ENGINE_V1.livabilityPercent(init,cumMort,cumCull),feed_quantity_kg:feed,feed_per_hen_g:metrics.feedPerHenG,water_quantity_l:water,water_per_hen_ml:metrics.waterPerHenMl,water_feed_ratio:metrics.waterFeedRatio,egg_count:eggs,hen_day_production_percent:hen,hen_housed_production_percent:henHoused,saleable_egg_count:n(val('saleableEggCount')),cracked_egg_count:n(val('crackedEggCount')),dirty_egg_count:n(val('dirtyEggCount')),floor_egg_count:n(val('floorEggCount')),soft_shell_egg_count:n(val('softShellEggCount')),misshapen_egg_count:n(val('misshapenEggCount')),saleable_egg_percent:metrics.saleableEggPercent,egg_defect_percent:metrics.eggDefectPercent,second_grade_egg_percent:metrics.eggDefectPercent,average_egg_weight_g:ew,egg_mass_g_hen_day:mass,haugh_unit:n(val('haughUnit')),albumen_height_mm:n(val('albumenHeight')),egg_shell_strength_g:n(val('shellStrength')),egg_shell_thickness_mm:n(val('shellThickness')),egg_color_score:n(val('eggColor')),feed_per_egg_g:metrics.feedPerEggG,feed_per_egg_mass:metrics.feedPerEggMass,body_weight_g:n(val('bodyWeight')),body_weight_sample_count:n(val('bodyWeightSample')),uniformity_10_percent:n(val('uniformity10')),uniformity_15_percent:n(val('uniformity15')),cv_percent:n(val('cv')),house_temperature_c:n(val('houseTemp')),outside_temperature_c:n(val('outsideTemp')),humidity_percent:n(val('humidity')),light_hours:n(val('lightHours')),light_intensity_lux:n(val('lightLux')),ammonia_ppm:n(val('ammonia')),co2_ppm:n(val('co2')),water_temperature_c:n(val('waterTemp')),water_ph:n(val('waterPh')),water_tds:n(val('waterTds')),water_free_chlorine:n(val('waterChlorine')),water_micro_status:val('waterMicro'),water_quality_status:val('waterQuality'),manure_condition:val('manureCondition'),appetite_status:val('appetite'),respiratory_status:val('respiratory'),droppings_status:val('droppings'),feather_condition:'',keel_bone_score:val('keelBone'),locomotion_score:val('locomotion'),footpad_score:val('footpad'),pecking_status:val('pecking'),flock_activity_status:val('activity'),nest_use_status:val('nestUse'),egg_shell_quality_status:val('eggShellQuality'),health_status:[val('appetite'),val('respiratory'),val('droppings'),val('activity'),val('pecking'),val('keelBone'),val('locomotion'),val('footpad'),val('nestUse'),val('eggShellQuality')].filter(x=>x&&x!=='طبیعی').join(' | ')||'طبیعی',clinical_signs:val('clinicalSigns'),treatment_or_intervention:val('treatment'),feed_change:val('feedChange'),vaccination_event:val('vaccinationEvent'),equipment_issue:val('equipmentIssue'),notes:val('notes'),daily_monitoring_status:analysis.state,daily_status_reason:analysis.reason,daily_reference_deviation:{...analysis.deviations,assessment:analysis.assessment,calculation_engine_version:analysis.calculationEngineVersion,standards_engine_version:analysis.standardsVersion,reference_source_label:analysis.standardLabel,reference_source_url:analysis.standardSource,system_mismatch:analysis.standardSystemMismatch},created_by:user.id};}
function isoToJalali(iso){try{return g.ADINE_LAYER_PERIOD_ENGINE_V1.toJalali(iso)?.label||''}catch(e){return ''}} function jalaliToGregorian(jy,jm,jd){jy=Number(jy)+1597;let days=-355668+365*jy+Math.floor(jy/33)*8+Math.floor(((jy%33)+3)/4)+jd+(jm<7?(jm-1)*31:(jm-1)*30+6);let gy=400*Math.floor(days/146097);days%=146097;if(days>36524){gy+=100*Math.floor(--days/36524);days%=36524;if(days>=365)days++;}gy+=4*Math.floor(days/1461);days%=1461;if(days>365){gy+=Math.floor((days-1)/365);days=(days-1)%365;}let gd=days+1,leap=((gy%4===0&&gy%100!==0)||gy%400===0);const md=[0,31,leap?29:28,31,30,31,30,31,31,30,31,30,31];let gm=1;while(gd>md[gm]){gd-=md[gm];gm++;}return gy+'-'+String(gm).padStart(2,'0')+'-'+String(gd).padStart(2,'0')} function jalaliToIso(v){const s=String(v||'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[-.]/g,'/');const m=s.match(/^(\\d{4})\/(\\d{1,2})\/(\\d{1,2})$/);if(!m)return '';const jy=+m[1],jm=+m[2],jd=+m[3];if(jm<1||jm>12||jd<1||jd>(jm<=6?31:jm<=11?30:29))return '';return jalaliToGregorian(jy,jm,jd)} function setTodayJalali(){const iso=new Date().toISOString().slice(0,10);set('recordDate',iso);set('recordDateJalali',isoToJalali(iso));} function loadForm(r){if(!r){setTodayJalali();}else{const map={recordDate:'record_date',haughUnit:'haugh_unit',albumenHeight:'albumen_height_mm',shellStrength:'egg_shell_strength_g',shellThickness:'egg_shell_thickness_mm',eggColor:'egg_color_score',waterPh:'water_ph',waterTds:'water_tds',waterChlorine:'water_free_chlorine',waterMicro:'water_micro_status',openingBirds:'opening_birds',softShellEggCount:'soft_shell_egg_count',misshapenEggCount:'misshapen_egg_count',mortalityCount:'mortality_count',cullCount:'cull_count',feedQuantity:'feed_quantity_kg',waterQuantity:'water_quantity_l',eggCount:'egg_count',saleableEggCount:'saleable_egg_count',crackedEggCount:'cracked_egg_count',dirtyEggCount:'dirty_egg_count',floorEggCount:'floor_egg_count',eggWeight:'average_egg_weight_g',saleableEggPercent:'saleable_egg_percent',eggDefectPercent:'egg_defect_percent',bodyWeight:'body_weight_g',bodyWeightSample:'body_weight_sample_count',uniformity10:'uniformity_10_percent',uniformity15:'uniformity_15_percent',cv:'cv_percent',houseTemp:'house_temperature_c',outsideTemp:'outside_temperature_c',humidity:'humidity_percent',lightHours:'light_hours',lightLux:'light_intensity_lux',ammonia:'ammonia_ppm',co2:'co2_ppm',waterTemp:'water_temperature_c',waterQuality:'water_quality_status',manureCondition:'manure_condition',keelBone:'keel_bone_score',locomotion:'locomotion_score',footpad:'footpad_score',pecking:'pecking_status',activity:'flock_activity_status',nestUse:'nest_use_status',eggShellQuality:'egg_shell_quality_status',appetite:'appetite_status',respiratory:'respiratory_status',droppings:'droppings_status',clinicalSigns:'clinical_signs',feedChange:'feed_change',vaccinationEvent:'vaccination_event',equipmentIssue:'equipment_issue',notes:'notes'};Object.keys(map).forEach(id=>set(id,r?.[map[id]]??''));set('recordDateJalali',isoToJalali(r.record_date));}set('ageDays',ageFrom(val('recordDate'))||1);calc();}
async function loadFlock(){try{const id=selectedFlockId();if(!id){$('alert').className='alert show';$('alert').textContent='گله فعال پیدا نشد.';return}let session=null;if(g.AdineAuth?.getSession){session=await g.AdineAuth.getSession();}else{const s=await supabaseClient.auth.getSession();session=s.error?null:s.data?.session||null;}if(!session?.user){location.href='login.html';return}user=session.user;const r=await supabaseClient.from('flocks').select('id,farm_id,house_id,flock_name,production_type,genetics,strain,placement_date,initial_bird_count,current_bird_count,status').eq('id',id).maybeSingle();if(r.error||!r.data){console.error('Layer daily flock query:',r.error);$('alert').className='alert show';$('alert').textContent='اطلاعات گله فعال دریافت نشد.';return}flock=r.data;const houseResult=flock.house_id?await supabaseClient.from('houses').select('housing_system').eq('id',flock.house_id).maybeSingle():null;flock.housing_system=houseResult?.data?.housing_system||null;if(String(flock.production_type).toLowerCase()!=='layer'&&!String(flock.production_type).includes('تخم')){location.href='daily-core.html'+location.search;return}renderFlock();await loadRecords();current=records.find(x=>String(x.record_date)===new Date().toISOString().slice(0,10))||records[0]||null;renderDaySelector();loadForm(current);}catch(e){console.error('Layer daily loadFlock failed:',e);$('alert').className='alert show';$('alert').textContent='خطا در بارگذاری گله فعال: '+(e?.message||'خطای نامشخص');}}
function renderFlock(){const std=resolveStd();$('flockInfo').innerHTML=[['گله',flock.flock_name],['نوع','تخم‌گذار'],['ژنتیک',flock.genetics||'—'],['سویه',flock.strain||'—'],['سیستم پرورش',flock.housing_system||'ثبت نشده'],['مرجع',std.systemMismatchReason||(std.fallback?'مرجع مدیریتی غربالگری — منحنی رسمی فعال نیست':std.sourceStatus==='provisional_selected_points'?'نقاط موقت راهنمای سویه — نیازمند تطبیق منبع':(!std.daily?'منحنی رسمی سویه + آستانه‌های مدیریتی غربالگری':std.sourceLabel||std.label||std.strain))]].map(x=>'<div class="pill"><small>'+esc(x[0])+'</small>'+esc(x[1])+'</div>').join('')}
async function loadRecords(){
 const r=await supabaseClient.from('layer_daily_monitoring').select('*').eq('flock_id',flock.id).order('record_date',{ascending:false});
 if(!r.error)records=r.data||[];
 historyPage=1;
 renderDaySelector();
 renderHistory();
}
function renderDaySelector(){
 const el=$('daySelect');if(!el)return;
 if(!records.length){el.innerHTML='<option value="">هنوز روزی ثبت نشده است</option>';return;}
 el.innerHTML=records.slice().sort((a,b)=>String(a.record_date).localeCompare(String(b.record_date))).map(r=>'<option value="'+esc(r.record_date)+'">روز '+esc(r.age_days)+' • '+esc(isoToJalali(r.record_date))+'</option>').join('');
 const preferred=current?.record_date||records[0]?.record_date;
 if(preferred)el.value=preferred;
}
function renderHistory(){
  const el=$('history');
  if(!el)return;
  if(!records.length){
    el.innerHTML='<div class="muted">هنوز رکوردی ثبت نشده است.</div>';
    return;
  }
  const totalPages=Math.max(1,Math.ceil(records.length/HISTORY_PAGE_SIZE));
  historyPage=Math.min(Math.max(historyPage,1),totalPages);
  const start=(historyPage-1)*HISTORY_PAGE_SIZE;
  const pageRows=records.slice(start,start+HISTORY_PAGE_SIZE);
  el.innerHTML=pageRows.map(r=>{
    return '<div class="history-row"><b>'+esc(isoToJalali(r.record_date))+'</b><span>سن '+esc(r.age_days)+'</span><span>تولید '+(r.hen_day_production_percent!=null?Number(r.hen_day_production_percent).toFixed(1)+'%':'—')+' | دان '+(r.feed_per_hen_g!=null?Number(r.feed_per_hen_g).toFixed(1)+'g':'—')+'</span><span class="history-actions"><button type="button" class="history-btn edit" data-action="edit" data-id="'+esc(r.id)+'">ویرایش</button><button type="button" class="history-btn delete" data-action="delete" data-id="'+esc(r.id)+'">حذف</button></span></div>';
  }).join('');
  const pager='<div class="history-pager"><button type="button" class="history-page-btn" data-page="'+(historyPage-1)+'" '+(historyPage<=1?'disabled':'')+'>‹ قبلی</button>'
    +Array.from({length:totalPages},(_,i)=>{
      const p=i+1;
      return '<button type="button" class="history-page-btn '+(p===historyPage?'active':'')+'" data-page="'+p+'">'+p+'</button>';
    }).join('')
    +'<button type="button" class="history-page-btn" data-page="'+(historyPage+1)+'" '+(historyPage>=totalPages?'disabled':'')+'>بعدی ›</button></div>';
  el.insertAdjacentHTML('beforeend',pager);
  el.querySelectorAll('[data-page]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(btn.disabled)return;
      historyPage=Number(btn.dataset.page)||1;
      renderHistory();
    });
  });
  el.querySelectorAll('[data-action="edit"]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const row=records.find(x=>String(x.id)===String(btn.dataset.id));
      if(!row)return;
      current=row;
      renderDaySelector();
      loadForm(row);
      window.scrollTo({top:0,behavior:'smooth'});
    });
  });
  el.querySelectorAll('[data-action="delete"]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const row=records.find(x=>String(x.id)===String(btn.dataset.id));
      if(!row)return;
      const displayDate=isoToJalali(row.record_date);
      if(!confirm('⚠️ هشدار بسیار مهم\n\nپایش روز '+displayDate+' به‌صورت دائمی حذف خواهد شد.\n\nاین عملیات قابل بازگشت نیست و روی تحلیل‌ها و روندهای گله اثر می‌گذارد.\n\nآیا برای ادامه آماده هستید؟'))return;
      const phrase='حذف روز '+displayDate;
      const typed=prompt('برای حذف قطعی پایش روزانه تخم‌گذار، عبارت زیر را دقیقاً وارد کنید:\n\n'+phrase+'\n\nاین عملیات قابل بازگشت نیست.');
      if(typed===null)return;
      if(typed.trim()!==phrase){
        alert('عبارت تأیید صحیح نیست؛ حذف پایش روزانه لغو شد.');
        return;
      }
      btn.disabled=true;
      btn.textContent='در حال حذف...';
      const del=await supabaseClient.from('layer_daily_monitoring').delete().eq('id',row.id).eq('flock_id',flock.id);
      if(del.error){
        btn.disabled=false;
        btn.textContent='حذف';
        alert('حذف رکورد انجام نشد: '+del.error.message);
        return;
      }
      if(current&&String(current.id)===String(row.id))current=null;
      await loadRecords();
      try{await g.ADINE_LAYER_PERIOD_ENGINE_V1.sync(flock,user,supabaseClient,records)}catch(err){console.error('Layer period re-sync after delete failed',err);alert('رکورد روزانه حذف شد، اما بازسازی گزارش‌های هفتگی/ماهانه کامل نشد: '+(err?.message||'خطای نامشخص'))}
      const next=current||records[0]||null;
      if(next){
        current=next;
        loadForm(next);
      }else{
        loadForm(null);
      }
    });
  });
}
document.addEventListener('DOMContentLoaded',()=>{const dateJ=$('recordDateJalali');if(dateJ)dateJ.addEventListener('change',()=>{const iso=jalaliToIso(dateJ.value);if(!iso){dateJ.setCustomValidity('تاریخ شمسی معتبر وارد کنید.');return}dateJ.setCustomValidity('');set('recordDate',iso);set('ageDays',ageFrom(iso)||1);calc();});document.querySelectorAll('.section-head').forEach(h=>h.addEventListener('click',()=>h.parentElement.classList.toggle('open')));document.querySelectorAll('#layerDailyForm input,#layerDailyForm select,#layerDailyForm textarea').forEach(el=>el.addEventListener('input',calc));$('layerDailyForm').addEventListener('submit',async e=>{e.preventDefault();if(!flock||!user)return;const p=payload();const r=await supabaseClient.from('layer_daily_monitoring').upsert(p,{onConflict:'flock_id,record_date'}).select().maybeSingle();if(r.error){console.error(r.error);alert('ذخیره پایش تخم‌گذار انجام نشد: '+r.error.message);return}alert('پایش روزانه تخم‌گذار ذخیره شد.');await loadRecords();try{await g.ADINE_LAYER_PERIOD_ENGINE_V1.sync(flock,user,supabaseClient,records)}catch(err){console.error('Layer period auto-sync failed',err);alert('پایش روزانه ذخیره شد، اما به‌روزرسانی پایش هفتگی/ماهانه کامل نشد. لطفاً اتصال را بررسی و دوباره بارگذاری کنید. جزئیات: '+(err?.message||'خطای نامشخص'))}});$('daySelect')?.addEventListener('change',()=>{const r=records.find(x=>String(x.record_date)===String(val('daySelect')));if(r){current=r;loadForm(r);}});$('reload').addEventListener('click',()=>loadFlock());loadFlock();});
})(window);