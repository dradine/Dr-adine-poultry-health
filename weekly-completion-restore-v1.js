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
})();

/* Load the dedicated v3 history-delete integration after the weekly page has rendered. */
(function(){
  function loadDeleteUI(){
    if(document.querySelector('script[data-weekly-delete-v3]')) return;
    var s=document.createElement('script');
    s.src='weekly-delete-ui-v3.js?v=3';
    s.async=false;
    s.setAttribute('data-weekly-delete-v3','true');
    (document.head||document.documentElement).appendChild(s);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadDeleteUI); else loadDeleteUI();
})();
