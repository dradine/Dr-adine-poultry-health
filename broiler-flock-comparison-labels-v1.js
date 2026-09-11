/* ADINE — comparison result labels
   Result area: flock identifiers are numbers only.
   Selection dropdowns intentionally keep their full farm/house/date labels.
*/
"use strict";
(function(){
  function apply(){
    const root=document.getElementById('root');
    if(!root)return;

    /* Main snapshot comparison headers. */
    root.querySelectorAll('.fc-flock-head').forEach((h,i)=>{
      const html=`<span class="fc-flock-index">${i+1}</span>`;
      if(h.innerHTML!==html)h.innerHTML=html;
    });

    /* Weekly-detail comparison table headers are generated separately and
       therefore do not carry .fc-flock-head. Keep the first column (week)
       untouched and replace every flock header with its number only. */
    root.querySelectorAll('.fc-table thead tr').forEach(tr=>{
      Array.from(tr.children).slice(1).forEach((th,i)=>{
        const html=`<span class="fc-flock-index">${i+1}</span>`;
        if(th.innerHTML!==html)th.innerHTML=html;
      });
    });

    /* Remove any textual flock name accidentally rendered in result headings. */
    root.querySelectorAll('.fc-compact-flock-name,.fc-compact-flock-strain').forEach(el=>el.remove());
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
