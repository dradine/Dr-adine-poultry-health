/* ADINE — BROILER DAILY HISTORY ACTIONS V1
   Adds edit/delete controls to the independent daily-monitoring history.
   Does not modify weekly engines or daily calculation logic.
*/
(function(){
  'use strict';
  const HISTORY_ID='history';
  const STYLE_ID='daily-history-actions-v1-style';
  const ACTIONS_CLASS='daily-history-actions';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function currentFlockId(){
    try{
      if(typeof getCurrentSelection==='function'){
        const s=getCurrentSelection()||{};
        if(s.flockId)return String(s.flockId);
      }
    }catch(e){}
    try{
      return new URLSearchParams(location.search).get('flock_id')||new URLSearchParams(location.search).get('flockId')||'';
    }catch(e){return ''}
  }

  function addStyles(){
    if($(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`
      .${ACTIONS_CLASS}{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
      .${ACTIONS_CLASS} button{border:0;border-radius:8px;padding:7px 10px;font:800 11px Tahoma,Arial,sans-serif;cursor:pointer;white-space:nowrap}
      .daily-history-edit{background:#eef4ff;color:#1d4f91}
      .daily-history-delete{background:#fff0ef;color:#b42318}
      .${ACTIONS_CLASS} button:disabled{opacity:.55;cursor:wait}
    `;
    document.head.appendChild(s);
  }

  function normalizeDate(v){
    const s=String(v??'').trim();
    const m=s.match(/(\d{4}-\d{2}-\d{2})/);
    return m?m[1]:'';
  }

  function editRecord(date){
    const d=normalizeDate(date);if(!d)return;
    const p=new URLSearchParams(location.search);
    p.set('date',d);p.delete('day');
    location.search=p.toString();
  }

  async function deleteRecord(date,button){
    const d=normalizeDate(date),flockId=currentFlockId();
    if(!d||!flockId||typeof supabaseClient==='undefined'){
      alert('اطلاعات لازم برای حذف این رکورد در دسترس نیست.');return;
    }
    if(!confirm('آیا از حذف پایش ثبت‌شده برای این روز مطمئن هستید؟\nاین عملیات قابل بازگشت نیست.'))return;
    const old=button.textContent;button.disabled=true;button.textContent='در حال حذف...';
    const {error}=await supabaseClient.from('broiler_daily_monitoring').delete().eq('flock_id',flockId).eq('record_date',d);
    if(error){
      console.error('Daily monitoring delete failed:',error);
      alert('حذف رکورد انجام نشد. لطفاً دوباره تلاش کنید.');
      button.disabled=false;button.textContent=old;return;
    }
    const p=new URLSearchParams(location.search);p.set('date',d);p.delete('day');location.search=p.toString();
  }

  function decorate(){
    const box=$(HISTORY_ID);if(!box)return;
    const table=box.querySelector('table');if(!table)return;
    const head=table.querySelector('thead tr'),body=table.querySelector('tbody');
    if(!head||!body)return;
    if(!head.querySelector('.daily-history-actions-head')){
      const th=document.createElement('th');th.className='daily-history-actions-head';th.textContent='عملیات';head.appendChild(th);
    }
    body.querySelectorAll('tr').forEach(row=>{
      if(row.querySelector('.'+ACTIONS_CLASS))return;
      const cells=row.querySelectorAll('td');if(cells.length<2)return;
      const date=normalizeDate(cells[1].textContent);
      const td=document.createElement('td');
      const wrap=document.createElement('div');wrap.className=ACTIONS_CLASS;
      const edit=document.createElement('button');edit.type='button';edit.className='daily-history-edit';edit.textContent='ویرایش';edit.title='ویرایش پایش این روز';edit.onclick=()=>editRecord(date);
      const del=document.createElement('button');del.type='button';del.className='daily-history-delete';del.textContent='حذف';del.title='حذف پایش این روز';del.onclick=()=>deleteRecord(date,del);
      wrap.append(edit,del);td.appendChild(wrap);row.appendChild(td);
    });
  }

  function init(){
    addStyles();
    const box=$(HISTORY_ID);if(!box)return;
    const observer=new MutationObserver(()=>decorate());
    observer.observe(box,{childList:true,subtree:true});
    decorate();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
