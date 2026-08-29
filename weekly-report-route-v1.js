/* ADINE - strict weekly -> report route v2 */
(function(){'use strict';
function readJson(storage,key){try{var v=storage.getItem(key);return v?JSON.parse(v):null}catch(e){return null}}
function isUuid(v){return typeof v==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim())}
function flockFrom(v){
  if(!v)return null;
  if(typeof v==='object' && isUuid(v.id))return v;
  if(typeof v==='string'){
    var s=v.trim();
    if(isUuid(s))return {id:s};
    if(s==='currentFlock'||s==='activeFlock'||s==='selectedFlock'){
      return flockFrom(readJson(localStorage,s)||readJson(sessionStorage,s));
    }
    try{return flockFrom(JSON.parse(s))}catch(e){}
  }
  return null;
}
function getFlock(){
  var candidates=[window.currentFlock,window.activeFlock,window.selectedFlock,
    readJson(sessionStorage,'currentFlock'),readJson(localStorage,'currentFlock'),
    readJson(sessionStorage,'activeFlock'),readJson(localStorage,'activeFlock'),
    readJson(sessionStorage,'selectedFlock'),readJson(localStorage,'selectedFlock')];
  for(var i=0;i<candidates.length;i++){var f=flockFrom(candidates[i]);if(f)return f}
  return null;
}
function go(){
  var f=getFlock();
  if(!f||!isUuid(f.id)){alert('گله فعال مشخص نیست. برای جلوگیری از نمایش گزارش گله اشتباه، ابتدا گله را انتخاب کنید.');return false}
  var p=new URLSearchParams();p.set('flock_id',f.id);
  var week=document.getElementById('weekNumber');if(week&&week.value)p.set('week_number',week.value);
  window.location.href='reports.html?'+p.toString();return true;
}
window.goToWeeklyReport=go;
window.openCurrentReport=go;
})();