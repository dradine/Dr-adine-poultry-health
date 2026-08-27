/* Compatibility wrapper: preserve the existing specialized engine, then restore the visible primary/advanced UI. */
(function(){
  document.write('<script src="weekly-specialized-core.js"><\/script>');
})();

(function(){
  'use strict';
  function restoreWeeklySupplementalUI(){
    var card=document.getElementById('specializedMetricsCard');
    var host=document.getElementById('specializedMetrics');
    var intro=document.getElementById('specializedMetricsIntro');
    if(!card||!host) return;
    if(typeof renderWeeklySpecializedFields==='function' && !window.__weeklyRestoreWrapped){
      var original=window.renderWeeklySpecializedFields;
      window.renderWeeklySpecializedFields=function(flock){
        var result=original.call(this,flock);
        setTimeout(function(){
          var c=document.getElementById('specializedMetricsCard');
          var h=document.getElementById('specializedMetrics');
          if(!c||!h)return;
          c.style.display='block';
          c.hidden=false;
          var type=typeof weeklySpecializedType==='function'?weeklySpecializedType(flock):'broiler';
          var primary=h.querySelector('.primary-group');
          var advanced=h.querySelector('.advanced-group');
          var toggle=h.querySelector('.weekly-advanced-toggle');
          if(type==='broiler'){
            if(primary){
              primary.style.display='block';
              if(!primary.querySelector('.weekly-metric-group-title')){
                primary.insertAdjacentHTML('afterbegin','<div class="weekly-metric-group-title">شاخص‌های اصلی</div>');
              }
            }
          }
          if(toggle) toggle.textContent='+ اطلاعات تکمیلی';
          if(advanced) advanced.style.display='none';
        },0);
        return result;
      };
      window.__weeklyRestoreWrapped=true;
    }
    if(intro && !intro.querySelector('.weekly-restore-note')){
      intro.insertAdjacentHTML('beforeend','<div class="weekly-restore-note" style="margin-top:8px;font-weight:700">⭐ شاخص‌های اصلی: نسبت آب به دان و وضعیت بستر — سایر موارد در اطلاعات تکمیلی</div>');
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',restoreWeeklySupplementalUI); else restoreWeeklySupplementalUI();
  setTimeout(restoreWeeklySupplementalUI,50);
  setTimeout(restoreWeeklySupplementalUI,250);
})();
