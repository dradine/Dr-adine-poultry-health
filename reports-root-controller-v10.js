/* ADINE REPORTS ROOT CONTROLLER V11
   Single source of truth for report-period selection.
   The page's existing inline report engine remains the ONLY owner of flock loading.
   This controller owns only: layout, week options, selected week, and report refresh.
*/
(function(w,d){
'use strict';
if(w.__ADINE_REPORTS_ROOT_V11__) return;
w.__ADINE_REPORTS_ROOT_V11__=true;

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const num=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(String(v).replace(/,/g,'').trim());return Number.isFinite(n)?n:null};
const weekOf=r=>{const age=num(r?.ageDays??r?.age_days);if(age!=null&&age>=1)return Math.floor((age-1)/7)+1;const x=num(r?.weekNumber??r?.week_number);return x!=null&&x>=1?Math.trunc(x):null};

function layout(){
  const page=d.querySelector('.reports-page');
  const controls=d.getElementById('adineReportsControlCard');
  const exec=d.getElementById('executiveReportCard');
  if(!page||!controls)return false;
  controls.style.display='block';
  if(exec){exec.style.display='block';page.insertBefore(exec,page.children[1]||null);page.insertBefore(controls,exec.nextSibling);}
  d.querySelectorAll('#adineReportFlockMirror,#adineReportWeekMirror,#reportWeekSelectorCard').forEach(e=>e.remove());
  return true;
}

function populateWeeks(){
  const sel=d.getElementById('reportWeekSelect');
  const records=Array.isArray(w.__adineReportRecords)?w.__adineReportRecords:[];
  if(!sel)return [];
  const weeks=[...new Set(records.map(weekOf).filter(Number.isInteger))].sort((a,b)=>a-b);
  const current=num(sel.value);
  sel.innerHTML='';
  const first=d.createElement('option');
  first.value='';
  first.textContent=weeks.length?'انتخاب هفته گزارش':'برای این گله پایش هفتگی ثبت نشده است';
  sel.appendChild(first);
  weeks.forEach(x=>{const o=d.createElement('option');o.value=String(x);o.textContent='هفته '+x;sel.appendChild(o)});
  const stored=num(sessionStorage.getItem('adine_report_week_v11'));
  const chosen=current&&weeks.includes(current)?current:(stored&&weeks.includes(stored)?stored:(weeks.length?weeks[weeks.length-1]:null));
  if(chosen!=null){sel.value=String(chosen);w.__adineSelectedReportWeek=chosen;}
  sel.disabled=!weeks.length;
  const info=d.getElementById('reportWeekSelectorInfo');
  if(info)info.innerHTML=weeks.length?`پایش‌های ثبت‌شده: <strong>${weeks.length}</strong> هفته | بازه: <strong>هفته ۱ تا ${weeks[weeks.length-1]}</strong>`:'برای این گله ثبت هفتگی وجود ندارد.';
  return weeks;
}

async function waitForFlocks(){
  const sel=d.getElementById('flockSelect');
  if(!sel)return false;
  for(let i=0;i<240;i++){
    if(sel.options.length>1 && sel.value) return true;
    if(sel.options.length>1) return true;
    await sleep(50);
  }
  return sel.options.length>1;
}

async function bind(){
  const flock=d.getElementById('flockSelect');
  const week=d.getElementById('reportWeekSelect');
  if(!flock||!week)return false;
  if(flock.dataset.v11Bound!=='1'){
    flock.dataset.v11Bound='1';
    flock.addEventListener('change',async()=>{
      const id=flock.value;
      w.__adineSelectedReportWeek=null;
      sessionStorage.removeItem('adine_report_week_v11');
      week.disabled=true;
      week.innerHTML='<option value="">در حال دریافت ثبت‌های هفتگی...</option>';
      if(!id){week.innerHTML='<option value="">ابتدا گله را انتخاب کنید</option>';return;}
      if(typeof w.loadReport!=='function'){console.error('ADINE V11: loadReport is unavailable');return;}
      await w.loadReport(id);
      populateWeeks();
    });
  }
  if(week.dataset.v11Bound!=='1'){
    week.dataset.v11Bound='1';
    week.addEventListener('change',async()=>{
      const id=flock.value;
      const selected=num(week.value);
      if(!id||selected==null)return;
      w.__adineSelectedReportWeek=selected;
      sessionStorage.setItem('adine_report_week_v11',String(selected));
      if(typeof w.loadReport==='function') await w.loadReport(id);
      populateWeeks();
    });
  }
  return true;
}

async function boot(){
  layout();
  for(let i=0;i<240;i++){if(await bind())break;await sleep(50);}
  await waitForFlocks();
  layout();
  if(d.getElementById('flockSelect')?.value){
    const flock=d.getElementById('flockSelect');
    if(typeof w.loadReport==='function'){
      w.__adineSelectedReportWeek=null;
      await w.loadReport(flock.value);
      populateWeeks();
    }
  }
  const page=d.querySelector('.reports-page');
  if(page && !w.__adineReportsLayoutObserver){
    w.__adineReportsLayoutObserver=true;
    new MutationObserver(()=>layout()).observe(page,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  }
  console.info('ADINE Reports V11 ready: canonical flock selector + weekly-record period selector');
}

if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);