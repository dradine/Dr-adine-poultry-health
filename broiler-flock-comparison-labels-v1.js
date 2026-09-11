/* ADINE — comparison result labels
   Result headers only show the flock number.
   Selection dropdowns intentionally keep their full farm/house/date labels.
*/
"use strict";
(function(){
  function apply(){
    const root=document.getElementById('root');
    if(!root)return;
    const heads=root.querySelectorAll('.fc-flock-head');
    heads.forEach((h,i)=>{
      const html=`<span class="fc-flock-index">${i+1}</span>`;
      if(h.innerHTML!==html)h.innerHTML=html;
    });
  }
  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply()});
  }
  function init(){
    const root=document.getElementById('root');
    if(!root)return;
    const mo=new MutationObserver(schedule);
    mo.observe(root,{subtree:true,childList:true});
    root.addEventListener('change',schedule);
    apply();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
