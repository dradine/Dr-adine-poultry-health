/* Keep the Iran vaccination template synchronized with the asynchronously loaded flock type. */
(function(){
  'use strict';
  function key(){
    const t=(document.getElementById('prodMetric')?.textContent||'').toLowerCase();
    if(/مادر|breeder|parent/.test(t)) return 'breeder';
    if(/پولت|pullet/.test(t)) return 'pullet';
    if(/تخم|layer|egg/.test(t)) return 'layer';
    if(/گوشتی|broiler/.test(t)) return 'broiler';
    return null;
  }
  function sync(){
    const s=document.getElementById('programSelect'); const k=key();
    if(!s||!k||!s.querySelector(`option[value="${k}"]`)) return;
    if(s.value!==k){s.value=k;s.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  function boot(){
    sync();
    const m=document.getElementById('prodMetric');
    if(m&&!m.dataset.healthProgramObserver){
      m.dataset.healthProgramObserver='1';
      new MutationObserver(sync).observe(m,{childList:true,characterData:true,subtree:true});
    }
    const s=document.getElementById('programSelect');
    if(s&&!s.dataset.healthProgramObserver){
      s.dataset.healthProgramObserver='1';
      new MutationObserver(sync).observe(s,{childList:true});
    }
    [250,750,1500,3000].forEach(ms=>setTimeout(sync,ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
