/* ADINE — Stable latest-week display slot V2
   Presentation only. The slot lives outside #root so switching report tabs does not
   replace or prepend DOM around the comprehensive report. No calculations are changed.
*/
"use strict";
(function(global){
  const $=s=>document.querySelector(s),n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null},fmt=v=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR')};
  let cache={};
  function slot(){return $('#latestWeekSlot')}
  function set(html,visible){const el=slot();if(!el)return;el.innerHTML=html;el.classList.toggle('latest-week-slot-hidden',!visible)}
  async function latest(id){if(!id)return null;if(cache[id]!==undefined)return cache[id];if(!global.supabaseClient)return null;const {data,error}=await global.supabaseClient.from('weekly_records').select('week_number,production_week,age_days,production_day').eq('flock_id',id).order('week_number',{ascending:true});if(error)throw error;let w=null;for(const r of(data||[])){const a=n(r.week_number??r.production_week);const b=n(r.age_days??r.production_day);const x=a!==null?Math.max(1,Math.round(a)):(b!==null?Math.max(1,Math.round(b/7)):null);if(x!==null)w=x}cache[id]=w;return w}
  function activeTab(){return document.querySelector('.report-tab.active')?.dataset.tab||'weekly'}
  async function overall(){try{const id=global.AdineReportRouter?.currentFlockId?.();const w=await latest(id);set(`<span>ارزیابی آخرین هفته</span><strong>${w===null?'هنوز ثبت هفتگی وجود ندارد':`هفته ${fmt(w)}`}</strong>`,true)}catch(e){set('<span>ارزیابی آخرین هفته</span><strong>—</strong>',true)}}
  async function comparison(){try{const ids=[...document.querySelectorAll('[id^="fc2-flock-"]')].map(x=>x.value).filter(Boolean);if(!ids.length){set('<span>ارزیابی آخرین هفته گله‌های انتخاب‌شده</span><strong>ابتدا گله‌ها را انتخاب کنید</strong>',true);return}const pairs=[];for(const id of ids){const w=await latest(id);const s=document.querySelector(`#fc2-flock-${ids.indexOf(id)}`);const f=s?.selectedOptions?.[0]?.textContent?.trim()||'گله';pairs.push(`<span class="latest-week-flock"><b>${esc(f)}</b><strong>${w===null?'بدون ثبت':`هفته ${fmt(w)}`}</strong></span>`)}set(`<div class="latest-week-group"><span class="latest-week-title">ارزیابی آخرین هفته گله‌های انتخاب‌شده</span>${pairs.join('')}</div>`,true)}catch(e){set('<span>ارزیابی آخرین هفته گله‌های انتخاب‌شده</span><strong>—</strong>',true)}}
  function esc(s){return String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function sync(){const t=activeTab();if(t==='overall')overall();else if(t==='compare-empty')comparison();else set('',false)}
  document.addEventListener('click',e=>{if(e.target?.closest?.('.report-tab'))setTimeout(sync,0);if(e.target?.closest?.('#fc2-run'))setTimeout(comparison,50);if(e.target?.closest?.('#fc2-clear'))setTimeout(comparison,50)},true);
  document.addEventListener('change',e=>{if(e.target?.matches?.('[id^="fc2-flock-"]'))setTimeout(comparison,0)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  global.AdineLatestWeekSlotV2={sync,overall,comparison};
})(window);
