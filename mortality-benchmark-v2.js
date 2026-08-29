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

(function(){
'use strict';
if(window.__ADINE_HEALTH_REPORT_V1__)return;
window.__ADINE_HEALTH_REPORT_V1__=true;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const jal=iso=>window.AdineDateSystem?.formatJalali?window.AdineDateSystem.formatJalali(iso,true):(window.jalaliDate?.isoToJalali?window.jalaliDate.isoToJalali(iso):iso||'-');
const tl=v=>({mortality:'تلفات',cull:'حذفی',disease:'بیماری',suspected_disease:'بیماری مشکوک',clinical_case:'مورد بالینی',environmental:'محیطی / مدیریتی'}[v]||v||'رخداد سلامت');
let lastFlock='';
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
 lastFlock=flock.value;
}
function boot(){
 const f=document.getElementById('flockSelect');if(!f)return;
 f.addEventListener('change',()=>setTimeout(render,300));
 document.getElementById('healthReportRefreshBtn')?.addEventListener('click',render);
 setInterval(()=>{if(document.visibilityState==='visible'&&f.value&&f.value!==lastFlock)render()},500);
 setInterval(()=>{if(document.visibilityState==='visible'&&f.value)render()},30000);
 if(f.value)setTimeout(render,800);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();

/* FINAL HEALTH REPORT BRIDGE V2
   Runs after the existing report engine and prevents the health card from
   disappearing when the weekly-report engine has no rows or has a stale flock.
*/
(function(){
'use strict';
if(window.__ADINE_HEALTH_FINAL_BRIDGE_V2__)return;
window.__ADINE_HEALTH_FINAL_BRIDGE_V2__=true;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num=v=>Number(v||0).toLocaleString('fa-IR');
const label=v=>({mortality:'تلفات',cull:'حذفی',disease:'بیماری',suspected_disease:'بیماری مشکوک',clinical_case:'مورد بالینی',environmental:'محیطی / مدیریتی'}[v]||v||'رخداد سلامت');
const date=v=>{try{return window.AdineDateSystem?.formatJalali?window.AdineDateSystem.formatJalali(v,true):(window.jalaliDate?.isoToJalali?window.jalaliDate.isoToJalali(v):v||'-')}catch(_){return v||'-'}};
async function render(){
 const select=document.getElementById('flockSelect');if(!select?.value||!window.supabaseClient)return;
 const card=document.getElementById('healthReportCard');const body=document.getElementById('healthReportTableBody');if(!card||!body)return;
 const r=await supabaseClient.from('health_events').select('*').eq('flock_id',select.value).order('event_date',{ascending:false}).order('created_at',{ascending:false}).limit(500);
 if(r.error){console.error('FINAL HEALTH BRIDGE:',r.error);body.innerHTML=`<tr><td colspan="9" class="health-report-empty">خطا در دریافت health_events: ${esc(r.error.message)}</td></tr>`;card.style.display='block';return;}
 const rows=r.data||[];card.style.display='block';
 if(!rows.length){body.innerHTML='<tr><td colspan="9" class="health-report-empty">برای این گله در health_events پرونده‌ای پیدا نشد.</td></tr>';return;}
 body.innerHTML=rows.map(x=>`<tr><td>${esc(date(x.event_date))}</td><td>${num(x.flock_age_days)}</td><td>${esc(label(x.event_type))}</td><td>${num(x.mortality_count||x.cull_count||x.affected_count)}</td><td>${esc(x.confirmed_disease_name||x.suspected_disease_name||'-')}</td><td>${esc(x.severity||'-')}</td><td>${x.sudden_death?'مرگ ناگهانی':'-'}</td><td>${esc(x.notes||'-')}</td><td><span class="badge ${x.show_in_reports?'badge-success':'badge-warning'}">${x.show_in_reports?'نمایش':'خصوصی'}</span></td></tr>`).join('');
 const note=document.getElementById('healthReportNote');if(note)note.textContent=`منبع مستقیم: health_events | ${num(rows.length)} پرونده | نمایش خصوصی/عمومی فقط وضعیت گزارش است و باعث حذف پرونده از سوابق نمی‌شود.`;
}
async function boot(){
 for(let i=0;i<160;i++){
  const f=document.getElementById('flockSelect');if(f?.value){await render();setInterval(()=>{if(document.visibilityState==='visible'&&f.value)render()},15000);return}
  await sleep(100);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();