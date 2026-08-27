/* ADINE - Weekly broiler completion v7
   Critical broiler KPIs + permanently visible supplemental monitoring toggle.
   The toggle is physically inside the dedicated completion panel so later
   weekly.js/weekly-specialized.js DOM rerenders cannot remove it.
*/
(function(){'use strict';
const PANEL='weeklyBroilerCompletionPanel',RATIO='weeklyBroilerWaterFeedRatio',LITTER='weeklyBroilerLitterScore',TOGGLE='weeklyBroilerAdvancedToggle',ADV='weeklyBroilerAdvancedGroup';
const n=v=>{let s=String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٬|,/g,'').replace(/٫/g,'.');let x=Number(s);return Number.isFinite(x)?x:null};
function flock(){try{if(typeof currentFlock!=='undefined'&&currentFlock)return currentFlock}catch(e){}return window.currentFlockForSpecialized||window.currentFlock||null}
function broiler(f){let t=String(f?.production_type||f?.productionType||'').toLowerCase();return /گوشتی|broiler|meat/.test(t)}
function host(){return document.getElementById('specializedMetrics')}
const common=[['avg_temp_c','میانگین دمای سالن','°C','number','پایش روزانه؛ مقدار نماینده هفتگی ثبت شود'],['relative_humidity_pct','رطوبت نسبی','%','number','در سطح پرنده و چند نقطه سالن بررسی شود'],['ammonia_ppm','آمونیاک','ppm','number','بهتر است با آمونیاک‌متر اندازه‌گیری شود'],['co2_ppm','CO₂','ppm','number','شاخص مهم تهویه در سالن‌های بسته'],['litter_moisture_pct','رطوبت بستر','%','number','در بخش نماینده سالن برآورد/اندازه‌گیری شود'],['water_quality_note','وضعیت آب','توضیح','text','شفافیت، بو، رسوب، فشار و خطوط آب'],['health_alert','رخداد یا هشدار سلامت','توضیح','text','هر تغییر غیرعادی کوتاه ثبت شود'],['management_note','ملاحظه مدیریتی هفته','توضیح','text','تهویه، دان، آب، نور، تراکم یا رفتار گله']];
const broilerFields=[['dead_bird_avg_weight_g','میانگین وزن پرندگان تلف‌شده','g','number','اختیاری؛ برای FCR اصلاح‌شده با تلفات'],['feed_form','شکل دان','توضیح','text','آردی/کرامبل/پلت و تغییرات کیفی'],['footpad_score','امتیاز کف پا','0–2','number','شاخص رفاه و وضعیت بستر'],['behavior_note','رفتار گله','توضیح','text','پخش یکنواخت، تجمع، تنفس دهانی و فعالیت']];
function htmlField(x){return '<div class="form-group weekly-special-field"><label for="wm_'+x[0]+'">'+x[1]+' <span>('+x[2]+')</span></label><input id="wm_'+x[0]+'" data-weekly-specialized="'+x[0]+'" type="text" inputmode="'+(x[3]==='number'?'decimal':'text')+'" autocomplete="off"><small>'+x[4]+'</small></div>'}
function findAdvanced(){return document.getElementById(ADV)||document.querySelector('#specializedMetrics .advanced-group')}
function ensureAdvanced(){let h=host();if(!h)return null;let g=findAdvanced();if(g)return g;g=document.createElement('div');g.id=ADV;g.className='weekly-metric-group advanced-group';g.hidden=true;g.style.display='none';g.innerHTML='<div class="weekly-metric-group-title">پایش پیشرفته و کیفیت</div><div class="form-grid">'+common.concat(broilerFields).map(htmlField).join('')+'</div>';h.appendChild(g);return g}
function setOpen(open){let g=ensureAdvanced();if(g){g.hidden=!open;g.style.display=open?'block':'none'}let b=document.getElementById(TOGGLE);if(b){b.setAttribute('aria-expanded',open?'true':'false');b.textContent=open?'− بستن پایش تکمیلی':'＋ پایش تکمیلی و کیفیت'}}
window.toggleWeeklyAdvanced=function(){let g=findAdvanced();setOpen(!(g&&g.style.display==='block'&&!g.hidden))};
function ensurePanelButton(p){let b=document.getElementById(TOGGLE);if(b)return b;let wrap=document.createElement('div');wrap.id=TOGGLE+'Wrap';wrap.className='weekly-advanced-toggle-wrap';b=document.createElement('button');b.type='button';b.id=TOGGLE;b.className='btn btn-secondary weekly-advanced-toggle';b.setAttribute('aria-expanded','false');b.textContent='＋ پایش تکمیلی و کیفیت';b.addEventListener('click',function(e){e.preventDefault();window.toggleWeeklyAdvanced()});wrap.appendChild(b);let sub=p.querySelector('.weekly-completion-sub');if(sub)sub.after(wrap);else p.appendChild(wrap);return b}
function panel(){let h=host();if(!h)return;let p=document.getElementById(PANEL);if(!p){p=document.createElement('section');p.id=PANEL;p.className='weekly-broiler-completion-panel';p.innerHTML='<div class="weekly-completion-title"><span class="required-star">★</span> تکمیل اطلاعات مهم گوشتی</div><div class="weekly-completion-sub">دو شاخص مهم و ضروری؛ سایر اطلاعات در «پایش تکمیلی و کیفیت» قرار دارند.</div><div class="form-grid weekly-completion-grid"><div class="form-group"><label><span class="required-star">★</span> نسبت آب به دان (L/kg)</label><input id="'+RATIO+'" data-weekly-specialized="water_feed_ratio" readonly inputmode="decimal"><small>خودکار: مصرف کل آب ÷ مصرف کل دان.</small></div><div class="form-group"><label><span class="required-star">★</span> وضعیت بستر (۰ تا ۵)</label><input id="'+LITTER+'" data-weekly-specialized="litter_score" inputmode="decimal"><small>۰ عالی، ۵ بسیار نامطلوب.</small></div></div>';h.insertBefore(p,h.firstChild)}let c=document.getElementById('specializedMetricsCard');if(c){c.hidden=false;c.style.display='block'}ensurePanelButton(p);ensureAdvanced();ratio()}
function ratio(){let r=document.getElementById(RATIO),f=n(document.getElementById('feedTotal')?.value),w=n(document.getElementById('waterTotal')?.value);if(r)r.value=f!=null&&f>0&&w!=null&&w>=0?(w/f).toFixed(3):''}
function bind(){['feedTotal','waterTotal'].forEach(id=>{let e=document.getElementById(id);if(e&&!e.dataset.wfr7){e.dataset.wfr7='1';e.addEventListener('input',ratio);e.addEventListener('change',ratio)}});let l=document.getElementById(LITTER);if(l&&!l.dataset.l7){l.dataset.l7='1';l.addEventListener('input',()=>{let x=n(l.value);if(x!=null)l.value=Math.max(0,Math.min(5,x))})}}
function run(){let f=flock();if(!f||!broiler(f))return;panel();bind();ratio()}
function start(){run();let mo=new MutationObserver(()=>{let f=flock();if(f&&broiler(f)){panel();bind();ratio()}});if(document.body)mo.observe(document.body,{childList:true,subtree:true});let i=0,t=setInterval(()=>{run();if(++i>160)clearInterval(t)},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
const css=document.createElement('style');css.textContent='#'+PANEL+'{display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:20!important;margin:0 0 16px!important;padding:14px!important;border-radius:14px!important}.weekly-advanced-toggle-wrap{display:flex!important;visibility:visible!important;opacity:1!important;width:100%!important;margin:12px 0!important;position:relative!important;z-index:9999!important}.weekly-advanced-toggle{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;cursor:pointer!important;min-height:42px!important;padding:8px 16px!important}.weekly-metric-group.advanced-group{transition:none!important}';document.head.appendChild(css);

/* Strict delete confirmation for weekly history */
(function(){
'use strict';
function records(){try{if(typeof weeklyRecords!=='undefined'&&Array.isArray(weeklyRecords))return weeklyRecords}catch(e){}return[]}
function decorate(){
 const box=document.getElementById('weeklyHistory');if(!box)return;
 const rows=box.querySelectorAll('table tbody tr');const rs=records();
 rows.forEach((row,i)=>{
  const cell=row.lastElementChild;if(!cell)return;
  if(cell.dataset.deleteEnhanced==='true')return;
  const weekCell=row.querySelector('td');
  const weekText=weekCell?String(weekCell.textContent||'').trim():'';
  let rec=rs[i];
  if(weekText){const numericWeek=weekText.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));const byWeek=rs.find(r=>String(r.week_number)==numericWeek);if(byWeek)rec=byWeek}
  if(!rec?.id)return;
  cell.dataset.deleteEnhanced='true';
  cell.style.setProperty('white-space','nowrap','important');
  cell.style.setProperty('text-align','center','important');
  cell.style.setProperty('min-width','170px','important');
  cell.style.setProperty('display','table-cell','important');
  const edit=cell.querySelector('button');
  if(edit){edit.style.setProperty('display','inline-flex','important');edit.style.setProperty('margin','2px','important');edit.style.setProperty('vertical-align','middle','important')}
  const b=document.createElement('button');
  b.type='button';b.className='btn btn-danger weekly-delete-record-btn';b.textContent='🗑️ حذف';
  b.setAttribute('aria-label','حذف سابقه پایش هفتگی');
  b.style.cssText='display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:relative!important;z-index:99999!important;margin:2px!important;vertical-align:middle!important;cursor:pointer!important;min-width:82px!important;';
  b.addEventListener('click',()=>strictDelete(rec,b));
  cell.appendChild(b);
 });
}
async function strictDelete(rec,button){
 if(!rec?.id)return;
 let user=null;try{const r=await window.supabaseClient.auth.getUser();user=r?.data?.user||null}catch(e){console.error(e)}
 if(!user){alert('برای حذف، ابتدا وارد سامانه شوید.');return}
 const f=(()=>{try{if(typeof currentFlock!=='undefined'&&currentFlock)return currentFlock}catch(e){}return window.currentFlockForSpecialized||window.currentFlock||null})();
 if(!f?.id){alert('گله فعال مشخص نیست؛ حذف انجام نشد.');return}
 if(String(f.status||'active').toLowerCase()==='closed'){alert('این دوره بسته شده است و حذف سابقه مجاز نیست.');return}
 const week=rec.week_number??'-';const phrase='حذف هفته '+week;
 const ok=window.confirm('⚠️ هشدار بسیار مهم\n\nشما در حال حذف سابقه پایش هفتگی هفته '+week+' هستید.\n\nاین داده پس از حذف قابل بازیابی نخواهد بود.\nاین عملیات دائمی است و ممکن است روی گزارش‌ها، روندها و محاسبات تجمعی اثر بگذارد.\n\nاگر مطمئن هستید، گزینه تأیید را انتخاب کنید.');
 if(!ok)return;
 const typed=window.prompt('برای تأیید نهایی حذف، عبارت زیر را دقیقاً وارد کنید:\n\n'+phrase);
 if(typed===null)return;
 if(String(typed).trim()!==phrase){alert('عبارت تأیید صحیح نیست؛ حذف لغو شد و هیچ داده‌ای تغییر نکرد.');return}
 button.disabled=true;button.textContent='در حال حذف...';
 const {error}=await window.supabaseClient.from('weekly_records').delete().eq('id',rec.id).eq('flock_id',f.id);
 if(error){console.error(error);button.disabled=false;button.textContent='🗑️ حذف';alert('حذف انجام نشد:\n'+error.message);return}
 try{weeklyRecords=records().filter(r=>String(r.id)!==String(rec.id))}catch(e){}
 if(typeof renderHistory==='function')renderHistory();
 setTimeout(decorate,0);
 alert('سابقه پایش هفته '+week+' با موفقیت حذف شد.');
}
function install(){decorate();setTimeout(decorate,50);setTimeout(decorate,250);setTimeout(decorate,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
if(document.body){new MutationObserver(()=>decorate()).observe(document.body,{childList:true,subtree:true})}
let tries=0;const timer=setInterval(()=>{decorate();if(++tries>=120)clearInterval(timer)},250);
})();
})();