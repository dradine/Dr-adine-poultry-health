/* ADINE Weekly History Delete UI v5
   Inline beside Edit + Persian/English digit tolerant confirmation.
*/
(function(){'use strict';
const HISTORY='weeklyHistory',CLS='weekly-delete-record-v5';
const norm=v=>String(v??'').replace(/[۰-۹]/g,d=>'0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]).replace(/[٠-٩]/g,d=>'0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]).replace(/\s+/g,' ').trim();
function recs(){try{if(typeof weeklyRecords!=='undefined'&&Array.isArray(weeklyRecords))return weeklyRecords}catch(e){}return[]}
function flock(){try{if(typeof currentFlock!=='undefined'&&currentFlock)return currentFlock}catch(e){}return window.currentFlockForSpecialized||window.currentFlock||null}
function findRecord(row,i){const rs=recs();if(!rs.length)return null;const id=row?.getAttribute('data-record-id');if(id){const r=rs.find(x=>String(x.id)===String(id));if(r)return r}const m=String(row?.textContent||'').match(/هفته\s*([0-9۰-۹٠-٩]+)/);if(m){const w=norm(m[1]);const r=rs.find(x=>norm(x.week_number??x.weekNumber??x.week)===w);if(r)return r}return rs[i]||null}
async function del(r,b){const f=flock();if(!r?.id||!f?.id){alert('شناسه سابقه یا گله فعال مشخص نیست؛ حذف انجام نشد.');return}let u=null;try{u=(await window.supabaseClient.auth.getUser())?.data?.user||null}catch(e){}if(!u){alert('برای حذف، ابتدا وارد سامانه شوید.');return}const week=r.week_number??r.weekNumber??r.week??'-';const phrase='حذف هفته '+week;if(!confirm('⚠️ هشدار بسیار مهم\n\nاین سابقه پایش هفتگی در حال حذف است.\n\nپس از حذف، این داده قابل بازیابی نخواهد بود.\nاین عملیات دائمی است و می‌تواند روی گزارش‌ها و روندهای گله اثر بگذارد.'))return;const typed=prompt('برای تأیید نهایی حذف، دقیقاً عبارت زیر را وارد کنید:\n\n'+phrase+'\n\nعدد فارسی یا انگلیسی قابل قبول است.');if(typed===null)return;if(norm(typed)!==norm(phrase)){alert('عبارت تأیید صحیح نیست؛ حذف لغو شد.');return}b.disabled=true;b.textContent='در حال حذف...';try{const {error}=await window.supabaseClient.from('weekly_records').delete().eq('id',r.id).eq('flock_id',f.id);if(error)throw error;try{weeklyRecords=weeklyRecords.filter(x=>String(x.id)!==String(r.id))}catch(e){}if(typeof loadHistory==='function')await loadHistory();else if(typeof renderHistory==='function')renderHistory();alert('سابقه پایش هفته '+week+' حذف شد.')}catch(e){b.disabled=false;b.textContent='🗑️ حذف';alert('حذف انجام نشد:\n'+(e?.message||e))}}
function decorate(){const root=document.getElementById(HISTORY);if(!root)return;const edits=Array.from(root.querySelectorAll('button,a')).filter(x=>/ویرایش|edit/i.test(x.textContent||''));edits.forEach((edit,i)=>{const host=edit.parentElement;if(!host||host.querySelector('.'+CLS))return;const row=edit.closest('tr,.history-row,.history-item,.record-row,.card')||host;const r=findRecord(row,i);if(!r?.id)return;let group=host.closest('.weekly-action-group,.actions,.action-buttons,.record-actions')||host;group.style.setProperty('display','inline-flex','important');group.style.setProperty('flex-direction','row','important');group.style.setProperty('flex-wrap','nowrap','important');group.style.setProperty('align-items','center','important');group.style.setProperty('gap','6px','important');group.style.setProperty('white-space','nowrap','important');edit.style.setProperty('display','inline-flex','important');edit.style.setProperty('flex','0 0 auto','important');edit.style.setProperty('margin','0','important');const b=document.createElement('button');b.type='button';b.className='btn btn-danger '+CLS;b.textContent='🗑️ حذف';b.title='حذف دائمی سابقه پایش';b.style.cssText='display:inline-flex!important;flex:0 0 auto!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;width:auto!important;min-width:82px!important;margin:0!important;padding:8px 12px!important;cursor:pointer!important;';b.onclick=e=>{e.preventDefault();e.stopPropagation();del(r,b)};edit.insertAdjacentElement('afterend',b)})}
function start(){decorate();if(document.body)new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});let i=0;const t=setInterval(()=>{decorate();if(++i>200)clearInterval(t)},250)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();})();

/* ADINE - Weekly results: reuse the existing performance/mortality engines.
   This layer only presents the already-calculated values; it does not replace
   or duplicate the application's calculation engine. */
(function(){'use strict';
function num(v){
  if(v===null||v===undefined||v==='') return null;
  let s=String(v).trim().replace(/,/g,'').replace(/٬/g,'')
    .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/٫/g,'.');
  const x=Number(s);
  return Number.isFinite(x)?x:null;
}
function records(){try{if(typeof weeklyRecords!=='undefined'&&Array.isArray(weeklyRecords))return weeklyRecords}catch(e){}return[]}
function activeFlock(){try{if(typeof currentFlock!=='undefined'&&currentFlock)return currentFlock}catch(e){}return window.currentFlockForSpecialized||window.currentFlock||null}
function currentSpecialized(){try{return typeof getWeeklySpecializedMetrics==='function'?(getWeeklySpecializedMetrics()||{}):{}}catch(e){return {}}}
function currentWeek(){return num(document.getElementById('weekNumber')?.value)}
function currentLive(){return num(document.getElementById('liveBirds')?.value)}
function currentMortality(){return num(document.getElementById('mortalityWeek')?.value)}
function currentFeed(){return num(document.getElementById('feedTotal')?.value)}
function currentWeight(result){return num(result?.mean)||num(document.getElementById('averageWeightDirect')?.value)}
function previousRecord(){
  const rs=records();
  const w=currentWeek();
  const editing=typeof editingRecordId!=='undefined'?editingRecordId:null;
  const candidates=rs.filter(r=>String(r?.id)!==String(editing||''));
  if(!candidates.length)return null;
  if(w!=null){
    const prior=candidates.filter(r=>{
      const rw=num(r?.week_number??r?.weekNumber??r?.week);
      return rw!=null&&rw<w;
    }).sort((a,b)=>num(a?.week_number??a?.weekNumber??a?.week)-num(b?.week_number??b?.weekNumber??b?.week));
    if(prior.length)return prior[prior.length-1];
  }
  return candidates.slice().sort((a,b)=>num(a?.age_days??a?.ageDays)-num(b?.age_days??b?.ageDays)||String(a?.evaluation_date||'').localeCompare(String(b?.evaluation_date||''))).at(-1)||null;
}
function calculateFcr(result){
  const engine=window.AdinePerformance;
  const flock=activeFlock();
  const feed=currentFeed(),live=currentLive(),weight=currentWeight(result);
  if(!engine||!flock||feed==null||feed<=0||live==null||live<=0||weight==null||weight<=0)return null;
  const type=engine.typeOf(flock);
  const pm=currentSpecialized();
  if(type==='layer'||type==='breeder') return engine.layerWeekly(feed,num(pm?.egg_mass_kg));
  const prev=previousRecord();
  if(!prev)return null;
  return engine.broilerWeeklyFCR({
    feedKg:feed,
    openBirds:num(prev.live_birds??prev.liveBirds),
    openWeight:num(prev.average_weight_g??prev.averageWeightG??prev.average_weight),
    closeBirds:live,
    closeWeight:weight
  });
}
function calculateMortality(){
  const live=currentLive(),dead=currentMortality();
  if(live==null||live<=0||dead==null||dead<0)return null;
  return Number((dead/(live+dead)*100).toFixed(3));
}
function card(title,value){
  if(typeof metric==='function')return metric(title,value);
  return '<div class="metric-card"><div class="metric-title">'+title+'</div><div class="metric-value">'+value+'</div></div>';
}
function patch(){
  if(typeof window.renderResults!=='function'||window.renderResults.__fcrMortalityV1)return false;
  const original=window.renderResults;
  function enhanced(result){
    original(result);
    const container=document.getElementById('results');
    if(!container)return;
    const fcr=calculateFcr(result);
    const mortality=calculateMortality();
    const fcrText=fcr==null?'قابل محاسبه نیست':Number(fcr).toFixed(3);
    const mortalityText=mortality==null?'قابل محاسبه نیست':Number(mortality).toFixed(2)+'%';
    container.insertAdjacentHTML('beforeend',
      card('FCR',fcrText)+
      card('درصد تلفات',mortalityText)
    );
  }
  enhanced.__fcrMortalityV1=true;
  window.renderResults=enhanced;
  return true;
}
function start(){
  if(patch())return;
  let i=0;const t=setInterval(()=>{if(patch()||++i>120)clearInterval(t)},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
