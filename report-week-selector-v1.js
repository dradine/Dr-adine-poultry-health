/* ADINE REPORT WEEK SELECTOR V1
   Lets the user inspect any canonical biological week while defaulting to latest.
   It never mutates weekly_records; selection is report-view state only.
*/
(function(){
  'use strict';
  const KEY='adine_report_selected_week_v1';
  let originalGet=null;
  let selectedWeek=null;

  function read(){
    const v=localStorage.getItem(KEY);
    if(v===null || v==='') return null;
    const n=Number(v);
    return Number.isInteger(n)&&n>0?n:null;
  }
  function save(v){
    if(v===null){ localStorage.removeItem(KEY); selectedWeek=null; }
    else { localStorage.setItem(KEY,String(v)); selectedWeek=v; }
  }
  function canonicalWeek(r){
    const age=Number(r?.age_days ?? r?.ageDays);
    if(Number.isFinite(age)&&age>0) return Math.ceil(age/7);
    const w=Number(r?.week_number ?? r?.weekNumber);
    return Number.isFinite(w)&&w>0?Math.trunc(w):null;
  }
  function sort(rows){
    return rows.slice().sort((a,b)=>{
      const wa=canonicalWeek(a), wb=canonicalWeek(b);
      if(wa!==null&&wb!==null&&wa!==wb) return wa-wb;
      return (Number(a?.age_days??a?.ageDays)||0)-(Number(b?.age_days??b?.ageDays)||0);
    });
  }
  function buildControl(){
    if(document.getElementById('reportWeekSelectorCard')) return;
    const flock=document.getElementById('flockSelect');
    if(!flock) return;
    const card=document.createElement('section');
    card.id='reportWeekSelectorCard'; card.className='card report-week-selector-card';
    card.innerHTML=`<div class="section-title">انتخاب هفته گزارش</div>
      <div class="report-week-selector-row">
        <div class="form-group"><label for="reportWeekSelect">هفته مورد نظر</label><select id="reportWeekSelect"><option value="">در حال آماده‌سازی...</option></select></div>
        <button type="button" id="reportWeekLatestBtn" class="btn btn-secondary">↻ نمایش آخرین هفته</button>
      </div>
      <div id="reportWeekSelectorInfo" class="info-box">به‌صورت خودکار آخرین هفته نمایش داده می‌شود.</div>`;
    flock.closest('section')?.after(card) || document.querySelector('.reports-page')?.prepend(card);
    const sel=document.getElementById('reportWeekSelect');
    const latestBtn=document.getElementById('reportWeekLatestBtn');
    sel.addEventListener('change',()=>{ const v=Number(sel.value); save(Number.isInteger(v)&&v>0?v:null); window.location.reload(); });
    latestBtn.addEventListener('click',()=>{ save(null); window.location.reload(); });
  }
  async function populate(){
    buildControl();
    const flock=document.getElementById('flockSelect'), sel=document.getElementById('reportWeekSelect');
    if(!flock||!sel||!flock.value||typeof originalGet!=='function') return;
    try{
      const rows=sort(await originalGet(flock.value));
      const weeks=[...new Set(rows.map(canonicalWeek).filter(Number.isInteger))].sort((a,b)=>a-b);
      const latest=weeks.length?weeks[weeks.length-1]:null;
      selectedWeek=read();
      if(selectedWeek!==null && !weeks.includes(selectedWeek)) save(null);
      const active=read()??latest;
      sel.innerHTML=`<option value="">آخرین هفته (خودکار)</option>`+weeks.map(w=>`<option value="${w}">هفته ${w}</option>`).join('');
      sel.value=read()===null?'':String(active??'');
      const info=document.getElementById('reportWeekSelectorInfo');
      if(info) info.innerHTML=active?`در حال نمایش گزارش <strong>هفته ${active}</strong>. برای برگشت به حالت خودکار «نمایش آخرین هفته» را بزنید.`:'هنوز رکورد هفتگی ثبت نشده است.';
    }catch(e){ console.error('Report week selector:',e); }
  }
  function install(){
    if(typeof window.getReportWeeklyRecords!=='function') return false;
    if(window.__adineReportWeekSelectorInstalled) return true;
    originalGet=window.getReportWeeklyRecords;
    window.getReportWeeklyRecords=async function(flockId){
      const rows=sort(await originalGet(flockId));
      const chosen=read();
      if(chosen===null) return rows;
      return rows.filter(r=>canonicalWeek(r)===chosen);
    };
    window.__adineReportWeekSelectorInstalled=true;
    return true;
  }
  function boot(){
    buildControl();
    install();
    const flock=document.getElementById('flockSelect');
    if(flock&&!flock.dataset.reportWeekBound){
      flock.dataset.reportWeekBound='1';
      flock.addEventListener('change',()=>{ save(null); setTimeout(populate,50); });
    }
    setTimeout(populate,150);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
