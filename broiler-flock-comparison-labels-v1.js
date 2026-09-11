/* ADINE — comparison result labels
   Display: flock number + flock name + strain, inline.
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

    root.querySelectorAll('.fc-flock-head').forEach((h,i)=>{
      h.classList.add('adine-inline-flock-label');
      h.innerHTML=`<span class="fc-flock-index adine-inline-flock-text">${getLabel(i)}</span>`;
    });

    root.querySelectorAll('.fc-table thead tr').forEach(tr=>{
      Array.from(tr.children).slice(1).forEach((th,i)=>{
        th.classList.add('adine-inline-flock-label');
        th.innerHTML=`<span class="fc-flock-index adine-inline-flock-text">${getLabel(i)}</span>`;
      });
    });

    let style=document.getElementById('adine-flock-label-override');
    if(!style){
      style=document.createElement('style');
      style.id='adine-flock-label-override';
      document.head.appendChild(style);
    }
    style.textContent=`
      .fc-side-table .fc-flock-head.adine-inline-flock-label{font-size:.76rem!important;white-space:nowrap!important;min-width:175px!important;}
      .fc-side-table .fc-flock-head.adine-inline-flock-label>*{display:inline!important;}
      .fc-side-table .fc-flock-head.adine-inline-flock-label .adine-inline-flock-text{display:inline!important;width:auto!important;height:auto!important;padding:0!important;background:none!important;border-radius:0!important;color:#27443a!important;font-size:.76rem!important;font-weight:900!important;white-space:nowrap!important;}
      .fc-table thead th.adine-inline-flock-label{font-size:.76rem!important;white-space:nowrap!important;}
      .fc-table thead th.adine-inline-flock-label .adine-inline-flock-text{display:inline!important;width:auto!important;height:auto!important;padding:0!important;background:none!important;border-radius:0!important;color:#27443a!important;font-size:.76rem!important;font-weight:900!important;white-space:nowrap!important;}
      .fc-table thead th.adine-inline-flock-label::after{content:none!important;display:none!important;}
    `;
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
