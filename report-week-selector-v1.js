/* ADINE REPORT WEEK SELECTOR V3
   Biological-week selector for reports.
   - Default: latest recorded week.
   - Selected week: keeps history through selected week for cumulative calculations.
   - Report renderer receives the selected period through a shared state API.
   - Never mutates weekly_records.
   - Supports up to week 120 for layer/breeder; up to week 60 for broiler/pullet.
   - Boot is retry-safe so script order cannot leave the selector stuck on «در حال آماده‌سازی». 
*/
(function(){
  'use strict';
  const KEY='adine_report_selected_week_v3';
  let originalGet=null;
  let installed=false;

  function num(v){
    if(v===null||v===undefined||v==='') return null;
    const n=Number(v); return Number.isFinite(n)?n:null;
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
    const n=num(localStorage.getItem(KEY));
    return Number.isInteger(n)&&n>=1&&n<=120?n:null;
  }
  function save(v){
    if(v===null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY,String(v));
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
    if(document.getElementById('reportWeekSelectorCard')) return true;
    const flock=document.getElementById('flockSelect');
    if(!flock) return false;
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
      // Full reload is intentional: it guarantees every report renderer starts from
      // the same selected-period state while the underlying records remain untouched.
      window.location.reload();
    });
    document.getElementById('reportWeekLatestBtn')?.addEventListener('click',()=>{ save(null); window.location.reload(); });
    return true;
  }
  async function populate(){
    buildControl();
    const flockEl=document.getElementById('flockSelect');
    const sel=document.getElementById('reportWeekSelect');
    if(!flockEl||!sel||!flockEl.value||typeof originalGet!=='function') return false;
    try{
      const rows=sort(await originalGet(flockEl.value));
      const weeks=[...new Set(rows.map(canonicalWeek).filter(w=>Number.isInteger(w)&&w>=1&&w<=120))].sort((a,b)=>a-b);
      let type='other';
      if(typeof window.getReportFlock==='function') type=productionType(await window.getReportFlock(flockEl.value));
      const maxWeek=(type==='layer'||type==='breeder')?120:60;
      const recorded=new Set(weeks);
      const stored=read();
      if(stored!==null && !recorded.has(stored)) save(null);
      const active=read()??(weeks.length?weeks[weeks.length-1]:null);
      sel.innerHTML=`<option value="">آخرین هفته ثبت‌شده (خودکار)</option>`+
        Array.from({length:maxWeek},(_,i)=>i+1).map(w=>`<option value="${w}" ${!recorded.has(w)?'disabled':''}>هفته ${w}${recorded.has(w)?'':' — ثبت نشده'}</option>`).join('');
      sel.value=read()===null?'':String(active??'');
      const info=document.getElementById('reportWeekSelectorInfo');
      if(info){
        info.innerHTML=active
          ? `در حال نمایش گزارش <strong>هفته ${active}</strong>. محاسبات تجمعی تا همین هفته حفظ می‌شود. ${read()===null?'':'برای برگشت به آخرین هفته، «آخرین هفته» را بزنید.'}`
          : 'هنوز رکورد هفتگی ثبت نشده است.';
      }
      window.__adineSelectedReportWeek=active;
      window.__adineReportWeekReady=true;
      return true;
    }catch(e){
      console.error('Report week selector V3:',e);
      return false;
    }
  }
  function install(){
    if(installed) return true;
    if(typeof window.getReportWeeklyRecords!=='function') return false;
    originalGet=window.getReportWeeklyRecords;
    window.getReportWeeklyRecords=async function(flockId){
      const rows=sort(await originalGet(flockId));
      const chosen=read();
      if(chosen===null) return rows;
      return rows.filter(r=>{
        const w=canonicalWeek(r);
        return w!==null && w<=chosen;
      });
    };
    installed=true;
    window.__adineReportWeekSelectorInstalled=true;
    return true;
  }
  function boot(){
    buildControl();
    install();
    const flock=document.getElementById('flockSelect');
    if(flock&&!flock.dataset.reportWeekBoundV3){
      flock.dataset.reportWeekBoundV3='1';
      flock.addEventListener('change',()=>{ save(null); window.__adineSelectedReportWeek=null; setTimeout(populate,80); });
    }
    populate();
  }
  function retryBoot(){
    boot();
    if(!installed || !document.getElementById('reportWeekSelect')){
      setTimeout(retryBoot,100);
    } else {
      let attempts=0;
      const timer=setInterval(async()=>{
        attempts++;
        if(document.getElementById('flockSelect')?.value) await populate();
        if(attempts>=50) clearInterval(timer);
      },200);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',retryBoot,{once:true}); else retryBoot();
})();
