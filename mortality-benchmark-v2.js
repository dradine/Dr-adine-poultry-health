/* ADINE MORTALITY BENCHMARK V2 — weekly broiler mortality management curve
   Evidence hierarchy:
   - Cobb: cumulative 7-day mortality should not exceed 1%.
   - Commercial broiler references show week 1 is highest, week 2 should fall,
     weeks 3–4 are very low, and mortality may rise again in finishing weeks.
   This is a MANAGEMENT benchmark, not a genetic performance claim.
*/
(function(g){"use strict";
const VERSION="2026.2-mortality-weekly";
const BROILER_WEEKLY={1:1.00,2:1.00,3:0.30,4:0.20,5:0.20,6:0.30,7:0.30,8:0.30};
function n(v){if(v===null||v===undefined||v==="")return null;const x=Number(String(v).replace(/,/g,"").trim());return Number.isFinite(x)?x:null}
function weekOf(r){const w=n(r?.weekNumber);if(w!=null&&w>0)return Math.min(8,Math.ceil(w));const age=n(r?.ageDays);return age!=null&&age>0?Math.min(8,Math.ceil(age/7)):null}
function targetForRecord(r){const w=weekOf(r);return w==null?null:BROILER_WEEKLY[w]??null}
function weeklyMortalityPercent(record,flock){const initial=n(flock?.initial_bird_count??flock?.initial_birds??flock?.placement_birds??flock?.bird_count);if(initial==null||initial<=0)return null;const deaths=n(record?.mortality);if(deaths==null)return null;return deaths/initial*100}
g.AdineMortalityBenchmarkV2={VERSION,BROILER_WEEKLY,targetForRecord,weeklyMortalityPercent};
})(window);

/* =========================================================
   HEALTH REPORT RENDERER V1
   health_events is the source of truth. Report visibility is shown
   as a status, not used to hide the underlying case from the report UI.
========================================================= */
(function(){
'use strict';
if(window.__ADINE_HEALTH_REPORT_V1__)return;
window.__ADINE_HEALTH_REPORT_V1__=true;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const jal=iso=>window.AdineDateSystem?.formatJalali?window.AdineDateSystem.formatJalali(iso,true):(window.jalaliDate?.isoToJalali?window.jalaliDate.isoToJalali(iso):iso||'-');
const tl=v=>({mortality:'تلفات',cull:'حذفی',disease:'بیماری',suspected_disease:'بیماری مشکوک',clinical_case:'مورد بالینی',environmental:'محیطی / مدیریتی'}[v]||v||'رخداد سلامت');
async function render(){
 const flock=document.getElementById('flockSelect');if(!flock?.value||!window.supabaseClient)return;
 const card=document.getElementById('healthReportCard');if(card)card.style.display='block';
 const r=await supabaseClient.from('health_events').select('*').eq('flock_id',flock.value).order('event_date',{ascending:false}).limit(500);
 if(r.error){console.error('Health report:',r.error);return}
 const rows=r.data||[],summary=document.getElementById('healthReportSummary');
 if(summary){const m=rows.reduce((s,x)=>s+n(x.mortality_count),0),c=rows.reduce((s,x)=>s+n(x.cull_count),0),a=rows.reduce((s,x)=>s+n(x.affected_count),0);summary.innerHTML=`<div><strong>پرونده‌ها</strong><span>${rows.length.toLocaleString('fa-IR')}</span></div><div><strong>تلفات</strong><span>${m.toLocaleString('fa-IR')}</span></div><div><strong>حذفی</strong><span>${c.toLocaleString('fa-IR')}</span></div><div><strong>درگیر</strong><span>${a.toLocaleString('fa-IR')}</span></div>`}
 const body=document.getElementById('healthReportTableBody');if(!body)return;
 body.innerHTML=rows.length?rows.map(x=>`<tr><td>${esc(jal(x.event_date))}</td><td>${n(x.flock_age_days).toLocaleString('fa-IR')}</td><td>${esc(tl(x.event_type))}</td><td>${n(x.mortality_count||x.cull_count||x.affected_count).toLocaleString('fa-IR')}</td><td>${esc(x.confirmed_disease_name||x.suspected_disease_name||'-')}</td><td>${esc(x.severity||'-')}</td><td>${x.sudden_death?'مرگ ناگهانی':'-'}</td><td>${esc(x.notes||'-')}</td><td><span class="badge ${x.show_in_reports?'badge-success':'badge-warning'}">${x.show_in_reports?'نمایش':'خصوصی'}</span></td></tr>`).join(''):`<tr><td colspan="9"><div class="empty-state">برای این گله هیچ رخداد سلامت ثبت نشده است.</div></td></tr>`;
 const note=document.getElementById('healthReportNote');if(note)note.textContent=rows.length?`تمام ${rows.length.toLocaleString('fa-IR')} پرونده ثبت‌شده این گله در این بخش قابل مشاهده است؛ وضعیت «نمایش در گزارش» جداگانه مشخص شده است.`:'هنوز پرونده سلامت ثبت نشده است.';
}
function boot(){const f=document.getElementById('flockSelect');if(!f)return;f.addEventListener('change',()=>setTimeout(render,300));document.getElementById('healthReportRefreshBtn')?.addEventListener('click',render);setInterval(()=>{if(document.visibilityState==='visible'&&f.value)render()},30000);if(f.value)setTimeout(render,800);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();