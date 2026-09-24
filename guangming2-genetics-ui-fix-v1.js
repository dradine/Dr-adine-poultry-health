/* ADINE — GUANGMING NO.2 FLOCK SELECTOR FIX
   Additive UI bridge only. Does not replace existing genetics or standards.
*/
(function(){
  'use strict';
  var GM={id:'guangming',name:'Guangming / گوانگ‌مینگ',strains:['Guangming No.2']};
  function install(){
    try{
      if(window.POULTRY_CATALOG && window.POULTRY_CATALOG.broiler && Array.isArray(window.POULTRY_CATALOG.broiler.genetics)){
        var a=window.POULTRY_CATALOG.broiler.genetics;
        if(!a.some(function(x){return String(x.id)==='guangming';})) a.push(GM);
      }
    }catch(e){console.warn('[GUANGMING2 UI] catalog patch skipped',e);}
    try{
      if(window.AdineFinalGeneticsSelector && typeof window.AdineFinalGeneticsSelector.sync==='function'){
        var t=document.getElementById('productionType');
        if(t && String(t.value)==='broiler') window.AdineFinalGeneticsSelector.sync();
      }
    }catch(e){console.warn('[GUANGMING2 UI] selector sync skipped',e);}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  window.setTimeout(install,0);
})();
