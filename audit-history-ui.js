/* =========================================================
   ADINEH — HEALTH AUDIT HISTORY UI
   Read-only viewer for vaccination, treatment, health and
   mortality/disease records. Access is enforced by Supabase RLS.
========================================================= */
(() => {
  'use strict';

  const TABLE_MAP = {
    vaccination: 'vaccinations',
    treatment: 'treatments',
    event: 'health_events',
    antibody: 'antibody_tests',
    lab: 'lab_tests',
    necropsy: 'health_necropsies'
  };

  const ACTION_FA = { INSERT:'ثبت', UPDATE:'ویرایش', DELETE:'حذف' };
  const TYPE_FA = {
    operator:'بهره‌بردار طیور', poultry_operator:'بهره‌بردار طیور',
    technical_expert:'کارشناس فنی طیور', poultry_expert:'کارشناس فنی طیور',
    manager:'مدیر واحد طیور', poultry_manager:'مدیر واحد طیور',
    owner:'مالک/مدیریت', admin:'مدیر سامانه'
  };

  const esc = v => String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
  const fa = v => v == null ? '—' : String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const dateFa = v => {
    if (!v) return '—';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return fa(v);
    return d.toLocaleString('fa-IR', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  };

  function flockId() {
    return window.S?.flock?.id || window.healthFlock?.id || window.healthFlock?.flock_id || null;
  }

  function db() { return window.supabaseClient || window.supabase; }

  function ensureStyle() {
    if (document.getElementById('auditHistoryUiStyle')) return;
    const s=document.createElement('style'); s.id='auditHistoryUiStyle';
    s.textContent=`
      .audit-history-btn{border:1px solid #d8e2dd;background:#f7faf8;color:#245d4d;border-radius:8px;padding:6px 9px;font:inherit;font-size:10px;cursor:pointer;white-space:nowrap}
      .audit-history-btn:hover{background:#edf5f0}
      .audit-global-history{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 12px;padding:10px 12px;border:1px solid #d8e2dd;background:#fff;border-radius:12px;box-shadow:0 3px 12px rgba(24,44,35,.04);direction:rtl}
      .audit-global-history strong{font-size:12px;color:#173f35}.audit-global-history span{font-size:10px;color:#66746e}
      .audit-global-history button{border:0;border-radius:9px;background:#173f35;color:#fff;padding:8px 12px;font:inherit;font-size:11px;cursor:pointer;white-space:nowrap}
      .audit-modal-backdrop{position:fixed;inset:0;background:rgba(15,31,25,.45);z-index:99999;display:flex;align-items:center;justify-content:center;padding:14px}
      .audit-modal{width:min(920px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.2);padding:18px;direction:rtl}
      .audit-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.audit-head h3{margin:0;font-size:17px;color:#173f35}.audit-close{border:1px solid #dce5e0;background:#fff;border-radius:9px;padding:7px 10px;cursor:pointer;font:inherit}
      .audit-record{font-size:11px;color:#66746e;margin-bottom:10px;padding:8px;background:#f7faf8;border-radius:10px}
      .audit-list{display:flex;flex-direction:column;gap:8px}.audit-row{border:1px solid #e0e8e3;border-radius:12px;padding:11px;background:#fff}.audit-row-top{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.audit-badge{display:inline-flex;padding:4px 8px;border-radius:999px;background:#edf2ef;font-size:10px}.audit-badge.insert{background:#eaf7ef;color:#166534}.audit-badge.update{background:#fff7df;color:#8a5b00}.audit-badge.delete{background:#fff0ef;color:#a51d14}.audit-meta{color:#66746e;font-size:10px}.audit-changes{margin-top:8px;border-top:1px dashed #dce5e0;padding-top:7px}.audit-change{display:grid;grid-template-columns:minmax(110px,.7fr) 1fr 1fr;gap:6px;padding:4px 0;font-size:10px}.audit-change span{overflow-wrap:anywhere}.audit-old{color:#a51d14}.audit-new{color:#166534}.audit-empty{text-align:center;padding:25px;color:#718078}.audit-loading{text-align:center;padding:25px;color:#718078}
      @media(max-width:600px){.audit-change{grid-template-columns:1fr}.audit-modal{padding:13px}.audit-global-history{align-items:flex-start}.audit-global-history button{padding:7px 9px}}
    `; document.head.appendChild(s);
  }

  function modal(title, recordId) {
    const old=document.getElementById('auditHistoryModal'); if(old) old.remove();
    const back=document.createElement('div'); back.id='auditHistoryModal'; back.className='audit-modal-backdrop';
    back.innerHTML=`<div class="audit-modal" role="dialog" aria-modal="true" aria-labelledby="auditTitle"><div class="audit-head"><h3 id="auditTitle">${esc(title)}</h3><button class="audit-close" type="button">بستن</button></div><div class="audit-record">${recordId ? `شناسه رکورد: ${esc(recordId)}` : 'نمایش تمام فعالیت‌های ثبت‌شده برای گله فعال'}</div><div id="auditBody" class="audit-list"><div class="audit-loading">در حال دریافت تاریخچه...</div></div></div>`;
    document.body.appendChild(back);
    const close=()=>back.remove(); back.querySelector('.audit-close').onclick=close; back.addEventListener('click',e=>{if(e.target===back)close()});
    document.addEventListener('keydown', function escClose(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',escClose)}});
    return back.querySelector('#auditBody');
  }

  function extractChanges(row) {
    if (row.changed_fields && typeof row.changed_fields === 'object') {
      const obj=row.changed_fields; const keys=Array.isArray(obj)?obj:Object.keys(obj);
      if(Array.isArray(obj)) return obj.map(k=>({key:k,old:row.old_data?.[k],neo:row.new_data?.[k]}));
      return keys.map(k=>({key:k,old:obj[k]?.old ?? row.old_data?.[k],neo:obj[k]?.new ?? row.new_data?.[k]}));
    }
    const keys=new Set([...Object.keys(row.old_data||{}),...Object.keys(row.new_data||{})]);
    return [...keys].filter(k=>JSON.stringify(row.old_data?.[k])!==JSON.stringify(row.new_data?.[k])).map(k=>({key:k,old:row.old_data?.[k],neo:row.new_data?.[k]}));
  }

  function tableLabel(table) {
    return ({vaccinations:'واکسیناسیون',treatments:'دارو و درمان',health_events:'بیماری/سلامت',antibody_tests:'تیتر آنتی‌بادی',lab_tests:'آزمایش',health_necropsies:'کالبدگشایی'}[table] || table || 'فعالیت سلامت');
  }

  function renderRows(body, rows, allMode=false) {
    if(!rows.length){body.innerHTML='<div class="audit-empty">برای این گله هنوز تاریخچه‌ای ثبت نشده است.</div>';return;}
    body.innerHTML=rows.map(r=>{
      const changes=extractChanges(r);
      const who=r.actor_name||'کاربر ثبت‌نشده';
      const role=TYPE_FA[r.actor_user_type]||r.actor_user_type||r.actor_role||'—';
      const op=String(r.operation||'').toUpperCase();
      const label=allMode ? `<span class="audit-badge">${esc(tableLabel(r.table_name))}</span>` : '';
      const changeHtml=(op==='UPDATE'&&changes.length)?`<div class="audit-changes"><div class="audit-change"><b>فیلد</b><b>قبل</b><b>بعد</b></div>${changes.map(c=>`<div class="audit-change"><span>${esc(c.key)}</span><span class="audit-old">${esc(c.old==null?'—':JSON.stringify(c.old))}</span><span class="audit-new">${esc(c.neo==null?'—':JSON.stringify(c.neo))}</span></div>`).join('')}</div>`:'';
      return `<div class="audit-row"><div class="audit-row-top"><span class="audit-badge ${op.toLowerCase()}">${esc(ACTION_FA[op]||op||'رویداد')}</span>${label}<b>${esc(who)}</b><span class="audit-badge">${esc(role)}</span><span class="audit-meta">${esc(dateFa(r.occurred_at))}</span></div>${changeHtml}</div>`;
    }).join('');
  }

  async function fetchAudit(filter) {
    const client=db(); if(!client) throw new Error('اتصال سامانه آماده نیست');
    let q=client.from('health_activity_log').select('*').order('occurred_at',{ascending:false}).limit(200);
    if(filter?.recordId) q=q.eq('record_id',String(filter.recordId));
    if(filter?.flockId) q=q.eq('flock_id',String(filter.flockId));
    if(filter?.table) q=q.eq('table_name',filter.table);
    const {data,error}=await q;
    if(error) throw error;
    return data||[];
  }

  async function showHistory(kind, id, title) {
    const body=modal(title,id);
    try {
      const rows=await fetchAudit({recordId:id,flockId:flockId(),table:TABLE_MAP[kind]});
      renderRows(body,rows,false);
    } catch(error){
      console.error('Audit history:',error); body.innerHTML='<div class="audit-empty">تاریخچه قابل دریافت نیست. سطح دسترسی یا اتصال سامانه را بررسی کنید.</div>';
    }
  }

  async function showFlockHistory() {
    const fid=flockId();
    if(!fid){ alert('ابتدا یک گله را انتخاب کنید.'); return; }
    const body=modal('تاریخچه فعالیت گله',null);
    try {
      const rows=await fetchAudit({flockId:fid});
      renderRows(body,rows,true);
    } catch(error){
      console.error('Flock audit history:',error); body.innerHTML='<div class="audit-empty">تاریخچه قابل دریافت نیست. سطح دسترسی یا اتصال سامانه را بررسی کنید.</div>';
    }
  }

  function addButton(container,kind,id,title){
    if(!container||!id||container.querySelector(`[data-audit-history="${kind}:${id}"]`)) return;
    const b=document.createElement('button'); b.type='button'; b.className='audit-history-btn'; b.textContent='تاریخچه'; b.dataset.auditHistory=`${kind}:${id}`; b.onclick=()=>showHistory(kind,id,title); container.appendChild(b);
  }

  function addGlobalButton() {
    if(document.getElementById('auditGlobalHistory')) return;
    const main=document.querySelector('main') || document.body;
    if(!main) return;
    const box=document.createElement('div'); box.id='auditGlobalHistory'; box.className='audit-global-history no-print';
    box.innerHTML='<div><strong>ردیابی فعالیت کاربران</strong><br><span>ثبت، ویرایش و حذف سوابق این گله قابل مشاهده است.</span></div><button type="button">مشاهده تاریخچه</button>';
    box.querySelector('button').onclick=showFlockHistory;
    main.prepend(box);
  }

  function scan() {
    addGlobalButton();
    document.querySelectorAll('[data-delete],[data-edit]').forEach(b=>{
      const kind=b.dataset.delete||b.dataset.edit, id=b.dataset.id; if(!kind||!id) return;
      const title=({vaccination:'تاریخچه واکسیناسیون',treatment:'تاریخچه دارو و درمان',event:'تاریخچه بیماری/سلامت',antibody:'تاریخچه تیتر آنتی‌بادی',lab:'تاریخچه آزمایش'})[kind]||'تاریخچه تغییرات';
      addButton(b.parentElement,kind,id,title);
    });
    document.querySelectorAll('button[onclick*="selectHealthEvent"],button[onclick*="deleteHealthEvent"]').forEach(b=>{
      const m=(b.getAttribute('onclick')||'').match(/(?:selectHealthEvent|deleteHealthEvent)\(['"]([^'"]+)['"]\)/); if(!m) return;
      addButton(b.parentElement,'event',m[1],'تاریخچه بیماری/تلفات');
    });
  }

  function init(){ ensureStyle(); scan(); const mo=new MutationObserver(()=>scan()); mo.observe(document.body,{childList:true,subtree:true}); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.ADInehAuditHistory={showHistory,showFlockHistory};
})();
