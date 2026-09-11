/* ADINE — compact flock comparison labels
   Result headers only: flock number + flock name + strain.
   Selection dropdowns intentionally keep their full farm/house/date labels.
*/
"use strict";
(function(){
  function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
  function apply(){
    const root=document.getElementById('root');
    if(!root)return;
    const selects=[0,1,2].map(i=>document.getElementById('fc2-flock-'+i));
    const heads=root.querySelectorAll('.fc-flock-head');
    heads.forEach((h,i)=>{
      const s=selects[i];
      if(!s)return;
      const opt=s.options[s.selectedIndex];
      const raw=clean(opt?.textContent);
      const parts=raw.split('/').map(clean);
      const name=parts.length>=3?parts[parts.length-1]:raw;
      const meta=clean(s.parentElement?.querySelector('.fc-meta')?.textContent||'');
      const strain=meta.split('|')[0]?.trim()||'سویه نامشخص';
      h.innerHTML=`<span class="fc-flock-index">${i+1}</span><span class="fc-compact-flock-name">${escapeHtml(name)}</span><span class="fc-compact-flock-strain">${escapeHtml(strain)}</span>`;
    });
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  const mo=new MutationObserver(()=>apply());
  function init(){const root=document.getElementById('root');if(root)mo.observe(root,{subtree:true,childList:true});apply()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
