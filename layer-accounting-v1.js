/* ADINE — Layer Operational Accounting V1
   Isolated module: sales + expenses for a selected Layer flock.
   Deliberately independent from Broiler engines and standards.
*/
(function(){
'use strict';
const MODULE='layer-accounting-v1';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const money=v=>Number.isFinite(Number(v))?Number(v).toLocaleString('fa-IR'):'—';
const cats={sale:['فروش تخم‌مرغ','فروش مرغ پایان دوره','فروش کود','سایر درآمد'],expense:['دان','دارو و واکسن','کارگر و دستمزد','برق و سوخت','بسته‌بندی','حمل‌ونقل','تعمیرات و نگهداری','آزمایش و تشخیص','سایر هزینه']};
let flockId='',flock=null,rows=[],editingId=null;
function getId(){try{const q=new URLSearchParams(location.search),s=typeof getCurrentSelection==='function'?(getCurrentSelection()||{}):{};return q.get('flock_id')||q.get('flockId')||s.flockId||s.flock_id||localStorage.getItem('adine_selected_flock')||'';}catch(_){return '';}}
function inject(){
 const tabs=document.querySelector('.tabs'); if(!tabs||document.getElementById('accountingTab')) return false;
 const b=document.createElement('button'); b.className='tab'; b.id='accountingTab'; b.dataset.tab='accounting'; b.textContent='حسابداری'; tabs.appendChild(b);
 const panel=document.createElement('section'); panel.id='accountingPanel'; panel.className='card panel'; panel.innerHTML=`
 <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><h2 style="margin:0 0 5px">حسابداری عملیاتی گله</h2><div class="note">ثبت فروش و هزینه برای گله انتخاب‌شده. این بخش مستقل طراحی شده تا بعداً بدون تغییر موتور پایش، به بخش دیگری منتقل شود.</div></div><button id="acctRefresh" class="btn" type="button">به‌روزرسانی</button></div>
 <div id="acctSummary" class="grid" style="margin-top:14px"></div>
 <form id="acctForm" class="card" style="margin-top:14px;background:#fbfdfb">
 <div class="grid"><div class="group"><label>تاریخ</label><input id="acctDate" type="date" required></div><div class="group"><label>نوع</label><select id="acctType"><option value="sale">فروش / درآمد</option><option value="expense">هزینه</option></select></div><div class="group"><label>دسته</label><select id="acctCategory"></select></div><div class="group"><label>طرف حساب</label><input id="acctCounterparty" placeholder="خریدار / فروشنده / ..."></div></div>
 <div class="grid" style="margin-top:10px"><div class="group"><label>شرح</label><input id="acctDescription" placeholder="مثلاً فروش تخم‌مرغ روزانه"></div><div class="group"><label>تعداد / مقدار</label><input id="acctQty" type="number" step="any" min="0"></div><div class="group"><label>واحد</label><input id="acctUnit" placeholder="کیلو، عدد، تن، ..."></div><div class="group"><label>قیمت واحد</label><input id="acctUnitPrice" type="number" step="any" min="0"></div></div>
 <div class="grid" style="margin-top:10px"><div class="group"><label>مبلغ کل (ریال)</label><input id="acctAmount" type="number" step="1" min="0" required></div><div class="group"><label>وضعیت پرداخت</label><select id="acctPayment"><option value="paid">پرداخت/دریافت شده</option><option value="pending">در انتظار</option><option value="partial">جزئی</option><option value="cancelled">لغوشده</option></select></div><div class="group"><label>شماره مرجع</label><input id="acctRef"></div><div class="group"><label>یادداشت</label><input id="acctNotes"></div></div>
 <div style="display:flex;gap:8px;margin-top:12px"><button class="btn" type="submit" id="acctSave">ثبت تراکنش</button><button class="tab" type="button" id="acctCancel" style="display:none">انصراف از ویرایش</button></div></form>
 <div class="card" style="margin-top:14px"><h3 style="margin-top:0">سوابق حسابداری</h3><div id="acctRows"></div></div>`;
 document.querySelector('main.wrap')?.appendChild(panel);
 bind();
 return true;
}
function setCats(){const type=$('acctType').value,arr=cats[type]||[];$('acctCategory').innerHTML=arr.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');}
function calc(){const q=Number($('acctQty').value),p=Number($('acctUnitPrice').value);if(q>0&&p>0)$('acctAmount').value=Math.round(q*p);}
async function load(){
 flockId=getId(); if(!flockId){$('acctRows').innerHTML='<div class="note">گله فعال انتخاب نشده است.</div>';return;}
 const f=await supabaseClient.from('flocks').select('id,farm_id,house_id,flock_name,strain,production_type').eq('id',flockId).maybeSingle();
 if(f.error||!f.data){$('acctRows').innerHTML='<div class="note">اطلاعات گله قابل دریافت نیست.</div>';return;}
 flock=f.data;
 const r=await supabaseClient.from('layer_accounting_transactions').select('*').eq('flock_id',flockId).order('event_date',{ascending:false}).order('created_at',{ascending:false});
 if(r.error){$('acctRows').innerHTML='<div class="note">خطا در دریافت حسابداری: '+esc(r.error.message)+'</div>';return;}
 rows=r.data||[]; render();
}
function render(){
 const income=rows.filter(x=>x.transaction_type==='sale'&&x.payment_status!=='cancelled').reduce((s,x)=>s+Number(x.amount||0),0);
 const expense=rows.filter(x=>x.transaction_type==='expense'&&x.payment_status!=='cancelled').reduce((s,x)=>s+Number(x.amount||0),0);
 const pendingIn=rows.filter(x=>x.transaction_type==='sale'&&x.payment_status==='pending').reduce((s,x)=>s+Number(x.amount||0),0);
 const pendingOut=rows.filter(x=>x.transaction_type==='expense'&&x.payment_status==='pending').reduce((s,x)=>s+Number(x.amount||0),0);
 $('acctSummary').innerHTML=[['فروش / درآمد',money(income)+' ریال'],['هزینه',money(expense)+' ریال'],['خالص عملیاتی',money(income-expense)+' ریال'],['دریافتنی',money(pendingIn)+' ریال'],['پرداختنی',money(pendingOut)+' ریال'],['تعداد تراکنش',rows.length]].map(x=>`<div class="metric"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('');
 $('acctRows').innerHTML=rows.length?`<div style="overflow:auto"><table class="table"><thead><tr><th>تاریخ</th><th>نوع</th><th>دسته</th><th>شرح</th><th>مقدار</th><th>مبلغ</th><th>پرداخت</th><th>عملیات</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.event_date)}</td><td>${r.transaction_type==='sale'?'فروش':'هزینه'}</td><td>${esc(r.category)}</td><td>${esc(r.description||'—')}</td><td>${r.quantity!=null?esc(r.quantity)+' '+esc(r.unit||''): '—'}</td><td>${money(r.amount)} ریال</td><td>${esc(r.payment_status)}</td><td><button type="button" class="tab" data-edit="${r.id}">ویرایش</button> <button type="button" class="tab" data-delete="${r.id}">حذف</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="note">هنوز تراکنش حسابداری برای این گله ثبت نشده است.</div>';
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));
 document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>del(b.dataset.delete));
}
function edit(id){const r=rows.find(x=>x.id===id);if(!r)return;editingId=id;for(const [id2,val] of Object.entries({acctDate:r.event_date,acctType:r.transaction_type,acctCategory:r.category,acctCounterparty:r.counterparty||'',acctDescription:r.description||'',acctQty:r.quantity??'',acctUnit:r.unit||'',acctUnitPrice:r.unit_price??'',acctAmount:r.amount,acctPayment:r.payment_status,acctRef:r.reference_no||'',acctNotes:r.notes||''})){if($(id2))$(id2).value=val;}setCats();$('acctCategory').value=r.category;$('acctSave').textContent='ذخیره ویرایش';$('acctCancel').style.display='inline-block';}
async function del(id){if(!confirm('این تراکنش حذف شود؟'))return;const r=await supabaseClient.from('layer_accounting_transactions').delete().eq('id',id).eq('flock_id',flockId);if(r.error)alert('حذف انجام نشد: '+r.error.message);else await load();}
function reset(){editingId=null;$('acctForm').reset();$('acctDate').value=new Date().toISOString().slice(0,10);$('acctType').value='sale';setCats();$('acctSave').textContent='ثبت تراکنش';$('acctCancel').style.display='none';}
function bind(){setCats();$('acctDate').value=new Date().toISOString().slice(0,10);$('acctType').onchange=()=>setCats();$('acctQty').oninput=calc;$('acctUnitPrice').oninput=calc;$('acctRefresh').onclick=load;$('acctCancel').onclick=reset;$('acctForm').onsubmit=async e=>{e.preventDefault();if(!flockId||!flock)return;const u=await AdineAuth.getUser();if(!u){alert('نشست کاربر معتبر نیست.');return}const payload={flock_id:flockId,farm_id:flock.farm_id,house_id:flock.house_id||null,owner_id:u.id,event_date:$('acctDate').value,transaction_type:$('acctType').value,category:$('acctCategory').value,description:$('acctDescription').value.trim()||null,quantity:$('acctQty').value===''?null:Number($('acctQty').value),unit:$('acctUnit').value.trim()||null,unit_price:$('acctUnitPrice').value===''?null:Number($('acctUnitPrice').value),amount:Number($('acctAmount').value||0),counterparty:$('acctCounterparty').value.trim()||null,payment_status:$('acctPayment').value,reference_no:$('acctRef').value.trim()||null,notes:$('acctNotes').value.trim()||null,source_module:MODULE};const q=editingId?await supabaseClient.from('layer_accounting_transactions').update(payload).eq('id',editingId).eq('flock_id',flockId):await supabaseClient.from('layer_accounting_transactions').insert(payload);if(q.error){alert('ثبت انجام نشد: '+q.error.message);return}reset();await load();};}
function activate(){if(!inject())return;const tab=$('accountingTab'),panel=$('accountingPanel');tab.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));tab.classList.add('active');document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));panel.classList.add('active');const pn=$('periodNav');if(pn)pn.style.display='none';await load();},{capture:true});load();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',activate,{once:true});else activate();
})();
