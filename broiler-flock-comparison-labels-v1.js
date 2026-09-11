/* ADINE — comparison result labels
   Display only: flock number + flock name + strain.
   Farm, house and placement date remain excluded from result labels.
   No calculations, data flow or report structure are changed.
*/
"use strict";
(function(){
  const digits=['۱','۲','۳'];

  function getLabel(i){
    const select=document.getElementById(`fc2-flock-${i}`);
    if(!select)return digits[i]||String(i+1);
    const option=select.options[select.selectedIndex];
    const raw=(option?.textContent||'').trim();
    const parts=raw.split(/\s+—\s+/);
    let name=raw;
    if(parts.length>=4)name=parts.slice(2,-1).join(' — ').trim();
    const meta=select.parentElement?.querySelector('.fc-meta')?.textContent||'';
    const strain=(meta.split('|')[0]||'').trim();
    const number=digits[i]||String(i+1);
    if(!name || name==='انتخاب گله…')return number;
    return strain && strain!=='—' ? `${number} — ${name} — ${strain}` : `${number} — ${name}`;
  }

  function apply(){
    const root=document.getElementById('root');
    if(!root)return;

    /* Keep the existing layout; only replace the visible identifier text. */
    root.querySelectorAll('.fc-flock-head').forEach((h,i)=>{
      const html=`<span class="fc-flock-index">${getLabel(i)}</span>`;
      if(h.innerHTML!==html)h.innerHTML=html;
    });

    root.querySelectorAll('.fc-table thead tr').forEach(tr=>{
      Array.from(tr.children).slice(1).forEach((th,i)=>{
        const html=`<span class="fc-flock-index">${getLabel(i)}</span>`;
        if(th.innerHTML!==html)th.innerHTML=html;
      });
    });

    /* The existing stylesheet adds numeric ::after labels to the weekly table.
       Disable only those generated numbers so the new text is not duplicated. */
    let style=document.getElementById('adine-flock-label-override');
    if(!style){
      style=document.createElement('style');
      style.id='adine-flock-label-override';
      style.textContent='.fc-table thead th:nth-child(2)::after,.fc-table thead th:nth-child(3)::after,.fc-table thead th:nth-child(4)::after{content:none!important}';
      document.head.appendChild(style);
    }
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
