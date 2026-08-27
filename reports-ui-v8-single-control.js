/* ADINE REPORTS UI V8.2 — CANONICAL REPORT CONTROLLER
   Root fix: the original reports.html #flockSelect and #reportWeekSelect
   are the ONLY visible controls. No mirrors are created or hidden.
*/
(function(w,d){
'use strict';
if(w.__ADINE_REPORTS_UI_V82__)return;
w.__ADINE_REPORTS_UI_V82__=true;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const client=()=>w.supabaseClient || (typeof supabaseClient!=='undefined'?supabaseClient:null);
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/,/g,'').trim());return Number.isFinite(x)?x:null};
const week=r=>{const a=n(r.age_days??r.ageDays);if(a!=null&&a>=1)return Math.floor((a-1)/7)+1;const x=n(r.week_number??r.weekNumber);return x!=null&&x>=1?Math.trunc(x):null};
const label=f=>f.flock_name||f.flock_code||('گله '+String(f.id||'').slice(0,8));
function cleanup(){
  d.querySelectorAll('#adineReportFlockMirror,#adineReportWeekMirror,#adineReportsControlCard,#reportWeekSelectorCard').forEach(e=>e.remove());
  const s=d.getElementById('flockSelect'),wk=d.getElementById('reportWeekSelect');
  if(s){s.disabled=false;s.removeAttribute('disabled');const c=s.closest('section.card');if(c)c.style.display='block';}
  if(wk){wk.disabled=true;}
}
async function wait(){for(let i=0;i<240;i++){const c=client();if(c&&c.from&&c.auth)return c;await sleep(50)}throw Error('Supabase client unavailable');}
async function flocks(c){const q=await c.from('flocks').select('id,flock_name,flock_code,production_type,farm_id,house_id,created_at').order('created_at',{ascending:false});if(q.error)throw q.error;return q.data||[];}
async function weekly(c,id){const q=await c.from('weekly_records').select('*').eq('flock_id',id).order('age_days',{ascending:true}).order('week_number',{ascending:true});if(q.error)throw q.error;return q.data||[];}
function fillFlocks(s,rows){s.innerHTML='<option value="">انتخاب گله</option>';rows.forEach(f=>{const o=d.createElement('option');o.value=f.id;o.textContent=label(f)+(f.production_type?' — '+f.production_type:'');s.appendChild(o)});s.disabled=false;s.removeAttribute('disabled');}
function fillWeeks(s,rows){const ws=[...new Set(rows.map(week).filter(Number.isInteger))].sort((a,b)=>a-b);s.innerHTML=ws.length?'<option value="">انتخاب هفته گزارش</option>':'<option value="">برای این گله پایش هفتگی ثبت نشده است</option>';ws.forEach(x=>{const o=d.createElement('option');o.value=x;o.textContent='هفته '+x;s.appendChild(o)});s.disabled=!ws.length;s.removeAttribute('disabled');if(ws.length)s.disabled=false;return ws;}
async function report(id,selected){w.__adineSelectedReportWeek=selected||null;w.__adineReportAvailableWeeks=w.__adineReportAvailableWeeks||[];if(typeof w.loadReport==='function'){try{await w.loadReport(id)}catch(e){console.error('ADINE report render failed',e)}}}
function bind(s,wk){if(s.dataset.v82==='1')return;s.dataset.v82='1';s.addEventListener('change',async()=>{cleanup();const id=s.value;wk.innerHTML='<option value="">در حال دریافت هفته‌ها...</option>';wk.disabled=true;if(!id){wk.innerHTML='<option value="">ابتدا گله را انتخاب کنید</option>';return}try{const rows=await weekly(client(),id);const ws=fillWeeks(wk,rows);if(ws.length){const selected=ws[ws.length-1];wk.value=String(selected);w.__adineSelectedReportWeek=selected;await report(id,selected)}}catch(e){console.error('ADINE weekly records load failed',e);wk.innerHTML='<option value="">خطا در دریافت ثبت هفتگی</option>';wk.disabled=true}});wk.addEventListener('change',async()=>{const selected=n(wk.value),id=s.value;w.__adineSelectedReportWeek=selected;if(id&&selected)await report(id,selected)});}
async function boot(){for(let i=0;i<240;i++){cleanup();const s=d.getElementById('flockSelect'),wk=d.getElementById('reportWeekSelect');if(s&&wk){try{const c=await wait();fillFlocks(s,await flocks(c));bind(s,wk);console.info('ADINE V8.2 ready');return}catch(e){console.error('ADINE V8.2 failed',e);s.innerHTML='<option value="">خطا در دریافت گله‌ها</option>';return}}await sleep(50)}}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);