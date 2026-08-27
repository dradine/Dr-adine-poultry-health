/* ADINE REPORTS ROOT CONTROLLER V10
   Single source of truth for the Reports page UI and data bootstrap.
   This controller deliberately reuses the ORIGINAL #flockSelect/#reportWeekSelect
   controls and never creates a second flock selector.
*/
(function(w,d){
'use strict';
if(w.__ADINE_REPORTS_ROOT_V10__) return;
w.__ADINE_REPORTS_ROOT_V10__=true;

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const num=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(String(v).replace(/,/g,'').trim());return Number.isFinite(n)?n:null};
const weekOf=r=>{const age=num(r.age_days??r.ageDays);if(age!=null&&age>=1)return Math.floor((age-1)/7)+1;const w=num(r.week_number??r.weekNumber);return w!=null&&w>=1?Math.trunc(w):null};
const label=f=>f.flock_name||f.flock_code||('گله '+String(f.id||'').slice(0,8));

function client(){return w.supabaseClient || (typeof supabaseClient!=='undefined'?supabaseClient:null)}

function canonicalizeLayout(){
  const page=d.querySelector('.reports-page');
  if(!page)return false;
  const source=d.getElementById('flockSelect');
  if(!source)return false;
  // Remove every generated/legacy visible selector. The original card is canonical.
  d.querySelectorAll('#adineReportsControlCard,#reportWeekSelectorCard,#adineReportFlockMirror,#adineReportWeekMirror').forEach(el=>{
    if(el.id==='adineReportsControlCard'||el.id==='reportWeekSelectorCard')el.remove();
    else el.remove();
  });
  const sourceCard=source.closest('section.card')||source.parentElement;
  if(sourceCard)sourceCard.style.display='block';
  const exec=d.getElementById('executiveReportCard');
  if(exec){exec.style.display='block';page.insertBefore(exec,page.children[1]||null)}
  if(sourceCard && exec && exec.nextSibling!==sourceCard)page.insertBefore(sourceCard,exec.nextSibling);
  const standard=d.getElementById('standardFrameworkCard');
  if(standard && sourceCard && sourceCard.parentNode===page)page.insertBefore(standard,sourceCard.nextSibling);
  return true;
}

async function waitForClient(){
  for(let i=0;i<200;i++){
    const c=client();
    if(c&&c.from&&c.auth)return c;
    await sleep(50);
  }
  throw new Error('Supabase client is not available on Reports page');
}

async function getFlocks(c){
  // Only scalar columns: no embedded farms/houses relationship can break the query.
  const {data,error}=await c.from('flocks').select('id,flock_name,flock_code,production_type,farm_id,house_id,created_at').order('created_at',{ascending:false});
  if(error)throw error;
  return Array.isArray(data)?data:[];
}

function fillFlocks(sel,rows){
  const previous=sel.value;
  sel.innerHTML='';
  const first=d.createElement('option');first.value='';first.textContent='یک گله را انتخاب کنید';sel.appendChild(first);
  rows.forEach(f=>{const o=d.createElement('option');o.value=f.id;o.textContent=label(f)+(f.production_type?' — '+f.production_type:'');sel.appendChild(o)});
  if(previous&&rows.some(f=>String(f.id)===String(previous)))sel.value=previous;
}

async function getWeekly(c,id){
  if(!id)return [];
  const {data,error}=await c.from('weekly_records').select('*').eq('flock_id',id).order('age_days',{ascending:true}).order('week_number',{ascending:true});
  if(error)throw error;
  return Array.isArray(data)?data:[];
}

function fillWeeks(sel,rows){
  const weeks=[...new Set(rows.map(weekOf).filter(Number.isInteger))].sort((a,b)=>a-b);
  const old=Number(sel.value)||null;
  sel.innerHTML='';
  const first=d.createElement('option');first.value='';first.textContent=weeks.length?'انتخاب هفته گزارش':'برای این گله پایش هفتگی ثبت نشده است';sel.appendChild(first);
  weeks.forEach(wk=>{const o=d.createElement('option');o.value=String(wk);o.textContent='هفته '+wk;sel.appendChild(o)});
  if(old&&weeks.includes(old))sel.value=String(old);else if(weeks.length)sel.value=String(weeks[weeks.length-1]);
  return weeks;
}

async function refreshReport(id,week){
  // Let the established report engine render the page; never duplicate its renderer.
  w.__adineSelectedReportWeek=week||null;
  if(typeof w.loadReport==='function'){await w.loadReport(id);return true}
  const source=d.getElementById('flockSelect');
  if(source){source.value=id;source.dispatchEvent(new Event('change',{bubbles:true}));return true}
  return false;
}

function install(){
  const source=d.getElementById('flockSelect');
  const week=d.getElementById('reportWeekSelect');
  if(!source||!week)return false;
  canonicalizeLayout();
  const c=client();
  if(!c)return false;
  if(source.dataset.v10Bound!=='1'){
    source.dataset.v10Bound='1';
    source.addEventListener('change',async()=>{
      const id=source.value;
      if(!id){week.innerHTML='<option value="">ابتدا گله را انتخاب کنید</option>';return}
      try{
        const rows=await getWeekly(c,id);
        const weeks=fillWeeks(week,rows);
        const selected=Number(week.value)||weeks.at(-1)||null;
        if(selected)w.__adineSelectedReportWeek=selected;
        await refreshReport(id,selected);
      }catch(e){console.error('ADINE V10 weekly load failed',e);week.innerHTML='<option value="">خطا در دریافت ثبت هفتگی</option>'}
    });
  }
  if(week.dataset.v10Bound!=='1'){
    week.dataset.v10Bound='1';
    week.addEventListener('change',async()=>{
      const id=source.value,selected=Number(week.value)||null;
      w.__adineSelectedReportWeek=selected;
      if(id&&selected)await refreshReport(id,selected);
    });
  }
  return true;
}

async function boot(){
  for(let i=0;i<200;i++){
    if(install())break;
    await sleep(50);
  }
  const source=d.getElementById('flockSelect');
  const week=d.getElementById('reportWeekSelect');
  if(!source||!week)return;
  try{
    const c=await waitForClient();
    canonicalizeLayout();
    const rows=await getFlocks(c);
    fillFlocks(source,rows);
    if(source.value){
      const wr=await getWeekly(c,source.value);fillWeeks(week,wr);
    }
    // Keep the canonical card visible after legacy cleanup timers run.
    setInterval(canonicalizeLayout,250);
    const page=d.querySelector('.reports-page');
    if(page)new MutationObserver(canonicalizeLayout).observe(page,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
    console.info('ADINE Reports V10 ready: flocks=',rows.length);
  }catch(e){
    console.error('ADINE Reports V10 bootstrap failed',e);
    source.innerHTML='<option value="">خطا در دریافت گله‌ها — Console را بررسی کنید</option>';
  }
}

if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);
