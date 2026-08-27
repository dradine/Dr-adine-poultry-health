/* ADINE REPORTS UI V8.4 — SINGLE SOURCE OF TRUTH
   IMPORTANT: reports.html already owns flock loading via loadFlocks().
   This file must NEVER query/rewrite flocks or create a mirror selector.
   It only cleans legacy UI and populates the existing #reportWeekSelect
   from weekly_records after the canonical #flockSelect has been populated.
*/
(function(w,d){
'use strict';
if(w.__ADINE_REPORTS_UI_V84__)return;
w.__ADINE_REPORTS_UI_V84__=true;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const num=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(String(v).replace(/,/g,'').trim());return Number.isFinite(n)?n:null};
const weekOf=r=>{const a=num(r?.age_days??r?.ageDays);if(a!=null&&a>=1)return Math.floor((a-1)/7)+1;const x=num(r?.week_number??r?.weekNumber);return x!=null&&x>=1?Math.trunc(x):null};
function client(){try{return w.supabaseClient||(typeof supabaseClient!=='undefined'?supabaseClient:null)}catch(_){return w.supabaseClient||null}}
function cleanup(){d.querySelectorAll('#adineReportFlockMirror,#adineReportWeekMirror,#adineReportsControlCard,#reportWeekSelectorCard').forEach(e=>e.remove());const s=d.getElementById('flockSelect');if(s){s.disabled=false;s.removeAttribute('disabled');const c=s.closest('section.card');if(c)c.style.display='block'}}
async function getWeekly(id){const c=client();if(!c)throw Error('Supabase client unavailable');const q=await c.from('weekly_records').select('*').eq('flock_id',id).order('week_number',{ascending:true});if(q.error)throw q.error;return Array.isArray(q.data)?q.data:[]}
function fillWeeks(sel,rows){const weeks=[...new Set(rows.map(weekOf).filter(Number.isInteger))].sort((a,b)=>a-b);const stored=num(localStorage.getItem('adine_report_selected_week_v4'));sel.innerHTML='';const first=d.createElement('option');first.value='';first.textContent=weeks.length?'انتخاب هفته گزارش':'برای این گله پایش هفتگی ثبت نشده است';sel.appendChild(first);weeks.forEach(x=>{const o=d.createElement('option');o.value=String(x);o.textContent='هفته '+x;sel.appendChild(o)});sel.disabled=!weeks.length;sel.removeAttribute('disabled');if(weeks.length){const chosen=stored&&weeks.includes(stored)?stored:weeks[weeks.length-1];sel.value=String(chosen);w.__adineSelectedReportWeek=chosen;w.__adineReportAvailableWeeks=weeks}else{w.__adineSelectedReportWeek=null;w.__adineReportAvailableWeeks=[]}return weeks}
let lastId='',request=0;
async function refreshWeeks(){const source=d.getElementById('flockSelect'),week=d.getElementById('reportWeekSelect');if(!source||!week)return;if(!source.value){week.disabled=true;week.innerHTML='<option value="">ابتدا گله را انتخاب کنید</option>';lastId='';return}const id=source.value;if(id===lastId&&week.options.length>1)return;const token=++request;week.disabled=true;week.innerHTML='<option value="">در حال دریافت ثبت‌های هفتگی...</option>';try{const rows=await getWeekly(id);if(token!==request||source.value!==id)return;const weeks=fillWeeks(week,rows);lastId=id;const info=d.getElementById('reportWeekSelectorInfo');if(info)info.innerHTML=weeks.length?`پایش‌های ثبت‌شده: <strong>${weeks.length}</strong> هفته | بازه: <strong>هفته ۱ تا ${weeks[weeks.length-1]}</strong>`:'برای این گله ثبت هفتگی وجود ندارد.'}catch(e){if(token!==request)return;console.error('ADINE V8.4 weekly load failed',e);week.disabled=false;week.innerHTML='<option value="">خطا در دریافت ثبت هفتگی</option>'}}
function bind(){cleanup();const source=d.getElementById('flockSelect'),week=d.getElementById('reportWeekSelect');if(!source||!week)return false;if(source.dataset.v84Bound!=='1'){source.dataset.v84Bound='1';source.addEventListener('change',()=>refreshWeeks())}if(week.dataset.v84Bound!=='1'){week.dataset.v84Bound='1';week.addEventListener('change',()=>{const v=num(week.value);w.__adineSelectedReportWeek=v;if(v!=null)localStorage.setItem('adine_report_selected_week_v4',String(v));else localStorage.removeItem('adine_report_selected_week_v4')})}if(source.value)refreshWeeks();return true}
async function boot(){for(let i=0;i<240;i++){if(bind())break;await sleep(50)}const source=d.getElementById('flockSelect'),page=d.querySelector('.reports-page');if(source)new MutationObserver(()=>{cleanup();if(source.value!==lastId)refreshWeeks()}).observe(source,{childList:true,subtree:true});if(page)new MutationObserver(()=>{cleanup()}).observe(page,{childList:true,subtree:true});setInterval(cleanup,1500)}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);
