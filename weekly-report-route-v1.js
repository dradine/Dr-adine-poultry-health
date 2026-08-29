/* ADINE - strict weekly -> report route */
(function(){'use strict';
function readJson(storage,key){try{var v=storage.getItem(key);return v?JSON.parse(v):null}catch(e){return null}}
function getFlock(){
  var candidates=[window.currentFlock,window.activeFlock,window.selectedFlock,readJson(sessionStorage,'currentFlock'),readJson(localStorage,'currentFlock'),readJson(sessionStorage,'activeFlock'),readJson(localStorage,'activeFlock')];
  for(var i=0;i<candidates.length;i++){var f=candidates[i];if(f&&f.id)return f}
  return null;
}
function go(){
  var f=getFlock();
  if(!f||!f.id){alert('گله فعال مشخص نیست. برای جلوگیری از نمایش گزارش گله اشتباه، ابتدا گله را انتخاب کنید.');return false}
  var p=new URLSearchParams();p.set('flock_id',String(f.id));
  var week=document.getElementById('weekNumber');if(week&&week.value)p.set('week_number',String(week.value));
  window.location.href='reports.html?'+p.toString();return true;
}
window.goToWeeklyReport=go;
window.openCurrentReport=go;
})();