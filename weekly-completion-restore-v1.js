/* ADINE - Weekly completion restore v1 */
(function(){
'use strict';
function n(v){return Number(String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/,/g,'').replace(/٬/g,'').replace(/٫/g,'.'));}
function isBroiler(f){const t=String(f?.production_type||f?.productionType||'').toLowerCase();return t.includes('گوشتی')||t.includes('broiler')||t.includes('meat');}
function ensure(){
 const f=window.currentFlock||window.currentFlockForSpecialized; if(!f||!isBroiler(f)) return false;
 const host=document.getElementById('specializedMetrics'); const card=document.getElementById('specializedMetricsCard'); if(!host||!card)return false;
 const ratio=host.querySelector('[data-weekly-specialized="water_feed_ratio"]'); const litter=host.querySelector('[data-weekly-specialized="litter_score"]');
 if(!ratio||!litter){
   host.innerHTML='<div class="weekly-completion-restore"><div class="weekly-completion-title">تکمیل اطلاعات مهم گوشتی</div><div class="weekly-completion-sub">برای ثبت سریع، فقط دو شاخص مهم اینجا نمایش داده می‌شود.</div><div class="form-grid"><div class="form-group"><label for="wm_water_feed_ratio"><b class="required-star">★</b> نسبت آب به دان <span>(L/kg)</span></label><input id="wm_water_feed_ratio" data-weekly-specialized="water_feed_ratio" type="text" inputmode="decimal" readonly><small>خودکار: مصرف کل آب ÷ مصرف کل دان.</small></div><div class="form-group"><label for="wm_litter_score"><b class="required-star">★</b> وضعیت بستر <span>(۰ تا ۵)</span></label><input id="wm_litter_score" data-weekly-specialized="litter_score" type="text" inputmode="decimal" autocomplete="off"><small>۰ = عالی، ۵ = بسیار نامطلوب.</small></div></div></div>';
 }
 card.style.display='block'; card.hidden=false;
 const r=host.querySelector('[data-weekly-specialized="water_feed_ratio"]'); if(r){const feed=n(document.getElementById('feedTotal')?.value), water=n(document.getElementById('waterTotal')?.value); r.value=(feed>0&&water>=0)?(water/feed).toFixed(3):'';}
 return true;
}
function bind(){
 ensure();
 ['feedTotal','waterTotal'].forEach(id=>{const el=document.getElementById(id);if(el&&!el.dataset.wfrBound){el.dataset.wfrBound='1';el.addEventListener('input',ensure);}});
}
let tries=0; const timer=setInterval(()=>{bind(); if(window.currentFlock&&document.getElementById('specializedMetrics')){tries++; if(tries>30)clearInterval(timer);}},250);
document.addEventListener('DOMContentLoaded',bind);
window.restoreWeeklyCompletion=bind;
})();
