/* ADINE REPORTS UI V6 SYNC GUARD */
(function(){'use strict';
function sync(){
 const src=document.getElementById('flockSelect'), mirror=document.getElementById('adineReportFlockMirror');
 if(src&&mirror){
   const sig=Array.from(src.options).map(o=>o.value+'|'+o.textContent).join('\n');
   if(mirror.dataset.sourceSignature!==sig){
     const current=mirror.value;mirror.innerHTML='';Array.from(src.options).forEach(o=>{if(o.value){const n=o.cloneNode(true);mirror.appendChild(n)}});mirror.value=current&&Array.from(mirror.options).some(o=>o.value===current)?current:src.value;mirror.dataset.sourceSignature=sig;
   }
 }
 const exec=document.getElementById('executiveReportCard'), card=document.getElementById('adineReportsControlCard');
 if(exec&&card&&exec.parentNode&&exec.nextElementSibling!==card)exec.parentNode.insertBefore(card,exec.nextSibling);
}
function boot(){sync();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
const timer=setInterval(sync,250);setTimeout(()=>clearInterval(timer),20000);
})();
