/* ADINE REPORTS ROOT CONTROLLER V12
   Canonical owner of report-period UI. The existing inline reports engine
   remains the only owner of flock loading and report rendering.
*/
(function(w,d){
'use strict';
if(w.__ADINE_REPORTS_ROOT_V12__)return;
w.__ADINE_REPORTS_ROOT_V12__=true;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/,/g,'').trim());return Number.isFinite(x)?x:null};
const biologicalWeek=r=>{const age=n(r?.ageDays??r?.age_days);if(age!=null&&age>=1)return Math.floor((age-1)/7)+1;const wk=n(r?.weekNumber??r?.week_number);return wk!=null&&wk>=1?Math.trunc(wk):null};
function layout(){
  const page=d.querySelector('.reports-page'),controls=d.getElementById('adineReportsControlCard'),exec=d.getElementById('executiveReportCard');
  if(!page||!controls)return false;
  controls.style.display='block';
  if(exec){exec.style.display='block';page.insertBefore(exec,page.children[1]||null);page.insertBefore(controls,exec.nextSibling)}
  d.querySelectorAll('#adineReportFlockMirror,#adineReportWeekMirror,#reportWeekSelectorCard').forEach(e=>e.remove());
  return true;
}
async function getWeeks(id){
  if(typeof w.getReportWeeklyRecords!=='function')return [];
  const rows=await w.getReportWeeklyRecords(id);
  return [...new Set((Array.isArray(rows)?rows:[]).map(biologicalWeek).filter(Number.isInteger))].sort((a,b)=>a-b);
}
function renderWeeks(weeks,selected){
  const sel=d.getElementById('reportWeekSelect');if(!sel)return;
  sel.innerHTML='';
  const first=d.createElement('option');first.value='';first.textContent=weeks.length?'انتخاب هفته گزارش':'برای این گله پایش هفتگی ثبت نشده است';sel.appendChild(first);
  weeks.forEach(x=>{const o=d.createElement('option');o.value=String(x);o.textContent='هفته '+x;sel.appendChild(o)});
  const chosen=selected!=null&&weeks.includes(selected)?selected:(weeks.length?weeks[weeks.length-1]:null);
  if(chosen!=null){sel.value=String(chosen);w.__adineSelectedReportWeek=chosen;w.__adineReportPeriodExplicit=true;}
  else{sel.value='';w.__adineSelectedReportWeek=null;w.__adineReportPeriodExplicit=false;}
  sel.disabled=!weeks.length;
  const info=d.getElementById('reportWeekSelectorInfo');
  if(info)info.innerHTML=weeks.length?`پایش‌های ثبت‌شده: <strong>${weeks.length}</strong> هفته | بازه گزارش: <strong>هفته ۱ تا ${chosen||weeks[weeks.length-1]}</strong>`:'برای این گله ثبت هفتگی وجود ندارد.';
}
async function invokeOriginalFlockChange(flock){
  const handler=flock.__adineOriginalOnChange||flock.onchange;
  if(typeof handler!=='function')throw new Error('موتور اصلی گزارش هنوز انتخاب گله را آماده نکرده است.');
  await handler.call(flock,{target:flock,currentTarget:flock});
}
async function bind(){
  const flock=d.getElementById('flockSelect'),week=d.getElementById('reportWeekSelect');
  if(!flock||!week||typeof flock.onchange!=='function')return false;
  if(flock.dataset.v12Bound!=='1'){
    flock.__adineOriginalOnChange=flock.onchange;
    flock.dataset.v12Bound='1';
    flock.onchange=async function(e){
      const id=flock.value;
      w.__adineSelectedReportWeek=null;w.__adineReportPeriodExplicit=false;
      week.disabled=true;week.innerHTML='<option value="">در حال دریافت ثبت‌های هفتگی...</option>';
      if(!id){week.innerHTML='<option value="">ابتدا گله را انتخاب کنید</option>';return}
      await invokeOriginalFlockChange(flock);
      const weeks=await getWeeks(id);
      renderWeeks(weeks,null);
    };
  }
  if(week.dataset.v12Bound!=='1'){
    week.dataset.v12Bound='1';
    week.addEventListener('change',async()=>{
      const id=flock.value,selected=n(week.value);
      if(!id||selected==null)return;
      w.__adineSelectedReportWeek=selected;w.__adineReportPeriodExplicit=true;
      await invokeOriginalFlockChange(flock);
      const weeks=await getWeeks(id);renderWeeks(weeks,selected);
    });
  }
  return true;
}
async function boot(){
  layout();
  for(let i=0;i<300;i++){if(await bind())break;await sleep(50)}
  const flock=d.getElementById('flockSelect');
  if(flock&&flock.value){const weeks=await getWeeks(flock.value);renderWeeks(weeks,n(w.__adineSelectedReportWeek));}
  layout();
  const page=d.querySelector('.reports-page');
  if(page&&!w.__adineReportsLayoutObserverV12){w.__adineReportsLayoutObserverV12=true;new MutationObserver(()=>layout()).observe(page,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']})}
  console.info('ADINE Reports V12 ready: one flock selector, one weekly-record selector');
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);