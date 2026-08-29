/* ADINE - strict weekly -> report route v3 */
(function(){
  'use strict';
  function isUuid(v){return typeof v==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim());}
  function go(){
    // weekly.js declares currentFlock as a global lexical binding; read that
    // authoritative object directly. Never treat the key name as an id.
    var f=(typeof currentFlock!=='undefined')?currentFlock:null;
    var id=f && typeof f==='object' ? String(f.id||'').trim() : '';
    if(!isUuid(id)){
      alert('گله فعال هنوز به‌درستی بارگذاری نشده است. ابتدا صبر کنید اطلاعات گله نمایش داده شود و سپس گزارش را باز کنید.');
      return false;
    }
    var p=new URLSearchParams();
    p.set('flock_id',id);
    var w=document.getElementById('weekNumber');
    if(w && String(w.value||'').trim()) p.set('week_number',String(w.value).trim());
    window.location.assign('reports.html?'+p.toString());
    return true;
  }
  window.goToWeeklyReport=go;
  window.openCurrentReport=go;
})();