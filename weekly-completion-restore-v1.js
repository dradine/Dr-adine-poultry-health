/* ADINE weekly completion compatibility wrapper v2
   Keeps the exact weekly implementation intact and loads daily-only
   enhancements into the daily iframe without touching weekly-core.
*/
(function(){'use strict';
  var ORIGINAL='weekly-completion-restore-v1-original.js?v=977a08';
  var s=document.createElement('script');
  s.src=ORIGINAL;
  s.async=false;
  (document.head||document.documentElement).appendChild(s);

  function digits(v){
    return String(v==null?'':v).replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)}).replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)});
  }
  function esc(v){
    if(typeof escapeHTML==='function') return escapeHTML(v==null?'':v);
    return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});
  }
  function selectedId(){
    try{ if(typeof getCurrentSelection==='function'){var x=getCurrentSelection()||{};if(x.flockId)return String(x.flockId)} }catch(e){}
    var keys=['adine_poultry_current_selection','adine_selected_flock'];
    for(var i=0;i<keys.length;i++){
      try{var raw=localStorage.getItem(keys[i]);if(raw){try{var obj=JSON.parse(raw);if(obj&&obj.flockId)return String(obj.flockId)}catch(e){} if(!raw.startsWith('{'))return String(raw)}}catch(e){}
    }
    try{var p=new URLSearchParams(location.search);return p.get('flock_id')||p.get('flockId')||''}catch(e){return ''}
  }
  async function rescue(){
    var box=document.getElementById('currentFlock');
    if(!box)return false;
    try{if(typeof currentFlock!=='undefined'&&currentFlock&&currentFlock.id){return true}}catch(e){}
    var text=(box.textContent||'').trim();
    if(text && !/در حال دریافت|در حال بارگذاری/.test(text))return false;
    var id=selectedId();
    if(!id||typeof supabaseClient==='undefined')return false;
    var q=await supabaseClient.from('flocks').select('*').eq('id',id).maybeSingle();
    if(q.error||!q.data){console.warn('Weekly flock rescue:',q.error);return false}
    var data=q.data;
    try{currentFlock=data}catch(e){}
    window.currentFlockForSpecialized=data;
    if(typeof renderWeeklySpecializedFields==='function'){
      try{renderWeeklySpecializedFields(data)}catch(e){console.warn(e)}
    }
    var farmName='-';
    var houseName='-';
    try{
      if(data.farm_id){var fq=await supabaseClient.from('farms').select('name').eq('id',data.farm_id).maybeSingle();if(!fq.error&&fq.data)farmName=fq.data.name||'-'}
      if(data.house_id){var hq=await supabaseClient.from('houses').select('name').eq('id',data.house_id).maybeSingle();if(!hq.error&&hq.data)houseName=hq.data.name||'-'}
    }catch(e){console.warn('Weekly flock relation rescue:',e)}
    var prod=data.production_type||data.productionType||'';
    var prodLabel=typeof getProductionLabel==='function'?getProductionLabel(prod):prod||'-';
    box.innerHTML='<div class="farm-summary"><strong>🐔 '+esc(data.flock_name||data.flockName||'-')+'</strong><br>فارم: '+esc(farmName)+'<br>سالن: '+esc(houseName)+'<br>نوع: '+esc(prodLabel)+'<br>سویه: '+esc(data.genetics||data.strain||'-')+'</div>';
    if(typeof loadHistory==='function'){try{await loadHistory()}catch(e){console.warn('Weekly history after rescue:',e)}}
    return true;
  }
  function loadDailyEnhancement(){
    var frame=document.getElementById('dailyFrame');
    if(!frame)return false;
    try{
      var doc=frame.contentDocument||frame.contentWindow.document;
      if(!doc||!doc.head)return false;
      if(doc.getElementById('adineDailyEnhancementLoader'))return true;
      var js=doc.createElement('script');
      js.id='adineDailyEnhancementLoader';
      js.src='broiler-daily-monitoring-enhancements-v1.js?v=20260916-daily-consumption-v5';
      js.async=false;
      doc.head.appendChild(js);
      return true;
    }catch(e){console.warn('Daily enhancement injection:',e);return false}
  }
  function startDailyEnhancement(){
    var frame=document.getElementById('dailyFrame');
    if(!frame)return;
    frame.addEventListener('load',function(){loadDailyEnhancement();setTimeout(loadDailyEnhancement,250);setTimeout(loadDailyEnhancement,1000)},{once:false});
    var tries=0;
    var t=setInterval(function(){tries++;if(loadDailyEnhancement()||tries>=30)clearInterval(t)},500);
  }
  function start(){
    var tries=0;
    var t=setInterval(function(){tries++;rescue().then(function(ok){if(ok||tries>=24)clearInterval(t)}).catch(function(e){console.warn('Weekly flock rescue:',e);if(tries>=24)clearInterval(t)})},500);
    startDailyEnhancement();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
