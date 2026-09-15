/* ADINE — BROILER DAILY HISTORY ACTIONS V3 */
(function(){
'use strict';
const HISTORY_ID='history', STYLE_ID='daily-history-actions-v3-style', ACTIONS_CLASS='daily-history-actions';
const $=id=>document.getElementById(id);
const F='۰۱۲۳۴۵۶۷۸۹';
const fa=x=>String(x??'').replace(/\d/g,d=>F[d]);
function currentFlockId(){
 try{if(typeof getCurrentSelection==='function'){const s=getCurrentSelection()||{};if(s.flockId)return String(s.flockId);if(s.flock_id)return String(s.flock_id);if(s.id)return String(s.id)}}catch(e){}
 try{const p=new URLSearchParams(location.search);return p.get('flock_id')||p.get('flockId')||''}catch(e){return ''}
}
function addStyles(){if($(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`.${ACTIONS_CLASS}{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.daily-history-edit,.daily-history-delete{border:0!important;border-radius:8px!important;padding:7px 11px!important;font:800 11px Tahoma,Arial,sans-serif!important;cursor:pointer!important;white-space:nowrap!important}.daily-history-edit{background:#eef4ff!important;color:#1d4f91!important}.daily-history-delete{background:#fff0ef!important;color:#b42318!important}`;document.head.appendChild(s)}
function normalizeDate(v){const s=String(v??'').trim();const m=s.match(/(\d{4}-\d{2}-\d{2})/);if(m)return m[1];const p=s.replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));const j=p.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);return j?`${j[1]}-${String(j[2]).padStart(2,'0')}-${String(j[3]).padStart(2,'0')}`:''}
function jalaliDisplay(v){
 const iso=normalizeDate(v);if(!iso)return String(v??'');
 try{
  const DS=window.AdineDateSystem;
  const j=DS?.isoToJalali(iso)||'';
  const p=String(j).split('/').map(Number);
  if(p.length===3&&p.every(Number.isFinite))return fa(`${p[2]}، ${p[1]}، ${p[0]}`);
 }catch(e){}
 return String(v??'');
}
function editRecord(date){const d=normalizeDate(date);if(!d)return;const p=new URLSearchParams(location.search);p.set('date',d);p.delete('day');location.search=p.toString()}
async function deleteRecord(date,button){const d=normalizeDate(date),flockId=currentFlockId();if(!d||!flockId||typeof supabaseClient==='undefined'){alert('اطلاعات لازم برای حذف این رکورد در دسترس نیست.');return}if(!confirm('آیا از حذف پایش ثبت‌شده برای این روز مطمئن هستید؟\nاین عملیات قابل بازگشت نیست.'))return;button.disabled=true;button.textContent='در حال حذف...';const {error}=await supabaseClient.from('broiler_daily_monitoring').delete().eq('flock_id',flockId).eq('record_date',d);if(error){console.error(error);alert('حذف رکورد انجام نشد.\n'+error.message);button.disabled=false;button.textContent='حذف';return}const p=new URLSearchParams(location.search);p.set('date',d);location.search=p.toString()}
function decorate(){const box=$(HISTORY_ID);if(!box)return false;const table=box.querySelector('table');if(!table)return false;const head=table.querySelector('thead tr'),body=table.querySelector('tbody');if(!head||!body)return false;if(!head.querySelector('.daily-history-actions-head')){const th=document.createElement('th');th.className='daily-history-actions-head';th.textContent='عملیات';head.appendChild(th)}body.querySelectorAll('tr').forEach(row=>{if(row.querySelector('.'+ACTIONS_CLASS))return;const cells=row.querySelectorAll('td');if(cells.length<2)return;const date=normalizeDate(cells[1].textContent);if(!date)return;cells[1].textContent=jalaliDisplay(date);const td=document.createElement('td');const wrap=document.createElement('div');wrap.className=ACTIONS_CLASS;const edit=document.createElement('button');edit.type='button';edit.className='daily-history-edit';edit.textContent='ویرایش';edit.onclick=()=>editRecord(date);const del=document.createElement('button');del.type='button';del.className='daily-history-delete';del.textContent='حذف';del.onclick=()=>deleteRecord(date,del);wrap.append(edit,del);td.appendChild(wrap);row.appendChild(td)});return true}
function init(){addStyles();let tries=0;const tick=()=>{decorate();if(++tries>=40)clearInterval(timer)};const timer=setInterval(tick,250);tick();const box=$(HISTORY_ID);if(box){new MutationObserver(()=>decorate()).observe(box,{childList:true,subtree:true})}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
