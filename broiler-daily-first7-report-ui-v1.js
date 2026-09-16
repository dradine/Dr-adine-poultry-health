/* ADINE — FIRST 7 DAY REPORT UI V1 */
(function(){
'use strict';
if(window.ADINE_BROILER_FIRST7_REPORT_UI_V1)return;
const ENGINE=()=>window.ADINE_BROILER_FIRST7_REPORT_ENGINE_V1;
const $=id=>document.getElementById(id);let busy=false;
async function showDaily(){const root=$('root'),selector=$('weeklyWeekSelectorSlot');if(!root)return;if(selector)selector.style.display='none';root.style.display='block';if(busy)return;busy=true;root.innerHTML='<div class="f7-empty" style="padding:48px;text-align:center">در حال ساخت گزارش روزانه هفت روز اول…</div>';try{const e=ENGINE();if(!e)throw new Error('موتور گزارش روزانه بارگذاری نشده است.');const m=await e.load();root.innerHTML=e.render(m)}catch(err){console.error(err);root.innerHTML=`<div class="error">خطا در بارگذاری گزارش روزانه: ${String(err?.message||err)}</div>`}finally{busy=false}}
function showWeekly(){const root=$('root'),selector=$('weeklyWeekSelectorSlot');if(selector)selector.style.display='';if(root)root.style.display=''}
function bind(){const shell=$('weekly-report-subtabs-v1');if(!shell)return setTimeout(bind,100);shell.addEventListener('click',e=>{const b=e.target.closest('[data-weekly-subtab]');if(!b)return;b.getAttribute('data-weekly-subtab')==='daily'?showDaily():showWeekly()});document.querySelectorAll('.report-tab[data-tab]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{if(b.getAttribute('data-tab')==='weekly'){const d=shell.querySelector('[data-weekly-subtab="daily"]');if(d?.classList.contains('active'))showDaily()}else{$('root').style.display=''}},80)));setTimeout(()=>{const d=shell.querySelector('[data-weekly-subtab="daily"]');if(d?.classList.contains('active'))showDaily()},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();window.ADINE_BROILER_FIRST7_REPORT_UI_V1=Object.freeze({showDaily,showWeekly});
})();
