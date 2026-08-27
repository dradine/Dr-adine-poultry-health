/* ADINE REPORT WEEK SELECTOR V2
   Biological-week selector for reports.
   - Default: latest recorded week.
   - Selected week: returns ALL records up to that week so cumulative metrics remain correct.
   - Never mutates weekly_records.
   - Supports up to week 120 for layer/breeder; up to week 60 for broiler/pullet.
*/
(function(){
  'use strict';
  const KEY='adine_report_selected_week_v2';
  let originalGet=null;

  function num(v){
    const n=Number(v);
    return Number.isFinite(n)?n:null;
  }
  function canonicalWeek(r){
    const age=num(r?.age_days ?? r?.ageDays);
    if(age!==null && age>0) return Math.ceil(age/7);
    const w=num(r?.week_number ?? r?.weekNumber);
    return w!==null && w>0 ? Math.trunc(w) : null;
  }
  function sort(rows){
    return rows.slice().sort((a,b)=>{
      const wa=canonicalWeek(a), wb=canonicalWeek(b);
      if(wa!==null && wb!==null && wa!==wb) return wa-wb;
      return (num(a?.age_days??a?.ageDays)||0)-(num(b?.age_days??b?.ageDays)||0);
    });
  }
  function read(){
    const v=localStorage.getItem(KEY);
    const n=num(v);
    return Number.isInteger(n)&&n>=1&&n<=120?n:null;
  }
  function save(v){
    if(v===null){ localStorage.removeItem(KEY); return; }
    localStorage.setItem(KEY,String(v));
  }
  function productionType(flock){
    const raw=String(flock?.production_type ?? flock?.productionType ?? flock?.flock_type ?? flock?.type ?? '').toLowerCase();
    if(/layer|laying|تخمگذار|تخم.?گذار/.test(raw)) return 'layer';
    if(/breeder|مادر/.test(raw)) return 'breeder';
    if(/broiler|گوشتی/.test(raw)) return 'broiler';
    if(/pullet|پولت/.test(raw)) return 'pullet';
    return 'other';
  }
  function buildControl(){
    if(document.getElementById('reportWeekSelectorCard')) return;
    const flock=document.getElementById('flockSelect');
    if(!flock) return;
    const card=document.createElement('section');
    card.id='reportWeekSelectorCard';
    card.className='card report-week-selector-card';
    card.innerHTML=`<div class="section-title">انتخاب هفته گزارش</div>
      <div class="report-week-selector-row">
        <div class="form-group"><label for="reportWeekSelect">هفته مورد نظر</label><select id="reportWeekSelect"><option value="">در حال آماده‌سازی...</option></select></div>
        <button type="button" id="reportWeekLatestBtn" class="btn btn-secondary">↻ آخرین هفته</button>
      </div>
      <div id="reportWeekSelectorInfo" class="info-box">آخرین هفته ثبت‌شده به‌صورت خودکار نمایش داده می‌شود.</div>`;
    flock.closest('section')?.after(card) || document.querySelector('.reports-page')?.prepend(card);
    const sel=document.getElementById('reportWeekSelect');
    sel.addEventListener('change',()=>{
      const v=num(sel.value);
      save(Number.isInteger(v)&&v>=1&&v<=120?v:null);
      window.location.reload();
    });
    document.getElementById('reportWeekLatestBtn')?.addEventListener('click',()=>{ save(null); window.location.reload(); });
  }
  async function populate(){
    buildControl();
    const flockEl=document.getElementById('flockSelect');
    const sel=document.getElementById('reportWeekSelect');
    if(!flockEl||!sel||!flockEl.value||typeof originalGet!=='function') return;
    try{
      const rows=sort(await originalGet(flockEl.value));
      const weeks=[...new Set(rows.map(canonicalWeek).filter(w=>Number.isInteger(w)&&w>=1&&w<=120))].sort((a,b)=>a-b);
      let type='other';
      if(typeof window.getReportFlock==='function') type=productionType(await window.getReportFlock(flockEl.value));
      const maxWeek=(type==='layer'||type==='breeder')?120:60;
      const recorded=new Set(weeks);
      const available=Array.from({length:maxWeek},(_,i)=>i+1);
      const stored=read();
      if(stored!==null && !recorded.has(stored)) save(null);
      const active=read()??(weeks.length?weeks[weeks.length-1]:null);
      sel.innerHTML=`<option value="">آخرین هفته ثبت‌شده (خودکار)</option>`+
        available.map(w=>`<option value="${w}" ${!recorded.has(w)?'disabled':''}>هفته ${w}${recorded.has(w)?'':' — ثبت نشده'}</option>`).join('');
      sel.value=read()===null?'':String(active??'');
      const info=document.getElementById('reportWeekSelectorInfo');
      if(info){
        info.innerHTML=active
          ? `در حال نمایش گزارش <strong>هفته ${active}</strong>. محاسبات تجمعی تا همین هفته حفظ می‌شود. ${read()===null?'':'برای برگشت به آخرین هفته، «آخرین هفته» را بزنید.'}`
          : 'هنوز رکورد هفتگی ثبت نشده است.';
      }
    }catch(e){ console.error('Report week selector V2:',e); }
  }
  function install(){
    if(typeof window.getReportWeeklyRecords!=='function') return false;
    if(window.__adineReportWeekSelectorInstalled) return true;
    originalGet=window.getReportWeeklyRecords;
    window.getReportWeeklyRecords=async function(flockId){
      const rows=sort(await originalGet(flockId));
      const chosen=read();
      if(chosen===null) return rows;
      // Keep all history through the selected week so weekly and cumulative calculations remain valid.
      const selectedRows=rows.filter(r=>canonicalWeek(r)===chosen);
      if(!selectedRows.length) return [];
      return rows.filter(r=>{ const w=canonicalWeek(r); return w!==null && w<=chosen; });
    };
    window.__adineReportWeekSelectorInstalled=true;
    return true;
  }
  function boot(){
    buildControl();
    install();
    const flock=document.getElementById('flockSelect');
    if(flock&&!flock.dataset.reportWeekBoundV2){
      flock.dataset.reportWeekBoundV2='1';
      flock.addEventListener('change',()=>{ save(null); setTimeout(populate,80); });
    }
    setTimeout(populate,250);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
