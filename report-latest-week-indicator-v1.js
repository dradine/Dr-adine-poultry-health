/* ADINE — Latest recorded week indicator
   Read-only presentation helper for comprehensive and comparison reports.
   Does not change calculations, weekly reporting, standards, or selected flock state.
*/
"use strict";
(function(global){
  const $=s=>document.querySelector(s);
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  const fmt=v=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR')};
  const latestWeek=rows=>{const valid=(rows||[]).filter(r=>n(r?.week_number??r?.production_week??r?.age_days??r?.production_day)!==null);if(!valid.length)return null;const r=valid[valid.length-1];const w=n(r.week_number??r.production_week);return w!==null?Math.max(1,Math.round(w)):Math.max(1,Math.round(n(r.age_days??r.production_day)/7))};
  async function records(id){if(!id||!global.supabaseClient)return[];const {data,error}=await global.supabaseClient.from('weekly_records').select('week_number,production_week,age_days,production_day,record_date,evaluation_date').eq('flock_id',id).order('week_number',{ascending:true});if(error)throw error;return data||[]}
  function badge(text){const el=document.createElement('div');el.className='latest-week-indicator';el.innerHTML=`<span>ارزیابی آخرین هفته</span><strong>${text}</strong>`;return el}
  async function comprehensive(){try{const id=global.AdineReportRouter?.currentFlockId?.();if(!id)return;const rs=await records(id),w=latestWeek(rs);if(w===null)return;const root=$('#root');if(!root)return;let el=root.querySelector('.latest-week-indicator');if(!el){el=badge(`هفته ${fmt(w)}`);root.prepend(el)}else el.querySelector('strong').textContent=`هفته ${fmt(w)}`}catch(e){console.warn('latest-week indicator:',e)}}
  async function comparison(){const selects=[...document.querySelectorAll('[id^="fc2-flock-"]')];for(const s of selects){if(!s.value)continue;try{const rs=await records(s.value),w=latestWeek(rs),meta=s.parentElement?.querySelector('.fc-meta');if(meta&&w!==null){const f=global.__adineLatestWeekOriginalMeta?.[s.id]||meta.textContent.split(' | آخرین ثبت:')[0];global.__adineLatestWeekOriginalMeta=global.__adineLatestWeekOriginalMeta||{};global.__adineLatestWeekOriginalMeta[s.id]=f;meta.textContent=`${f} | آخرین ثبت: هفته ${fmt(w)}`}}catch(e){console.warn('latest-week comparison:',e)}}}
  function sync(){const active=document.querySelector('.report-tab.active')?.dataset.tab;if(active==='overall')setTimeout(comprehensive,0);if(active==='compare-empty')setTimeout(comparison,0)}
  document.addEventListener('click',e=>{if(e.target?.closest?.('.report-tab'))setTimeout(sync,50)});
  document.addEventListener('change',e=>{if(e.target?.matches?.('[id^="fc2-flock-"]'))setTimeout(comparison,50)});
  const observer=new MutationObserver(()=>{const active=document.querySelector('.report-tab.active')?.dataset.tab;if(active==='overall'&&!document.querySelector('.latest-week-indicator'))setTimeout(comprehensive,0);if(active==='compare-empty')setTimeout(comparison,0)});
  function init(){const root=$('#root');if(root)observer.observe(root,{childList:true,subtree:true});sync()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
