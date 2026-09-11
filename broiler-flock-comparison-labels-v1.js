/* ADINE — comparison result labels
   Result labels: flock number + flock name + strain, inline.
   Charts use the same labels in legends.
   Farm, house and placement date remain excluded from result labels.
   Presentation-only: no calculations, data flow or report structure are changed.
*/
"use strict";
(function(){
  const digits=['۱','۲','۳'];

  function getSelectedFlock(i){
    const select=document.getElementById(`fc2-flock-${i}`);
    if(!select || !select.value)return null;
    return select.options[select.selectedIndex]||null;
  }

  function getLabel(i){
    const option=getSelectedFlock(i);
    const number=digits[i]||String(i+1);
    if(!option)return number;

    const raw=(option.textContent||'').trim();
    if(!raw || raw==='انتخاب گله…')return number;

    const parts=raw.split(/\s+—\s+/);
    let name=raw;
    if(parts.length>=4)name=parts.slice(2,-1).join(' — ').trim();

    const meta=option.parentElement?.parentElement?.querySelector('.fc-meta')?.textContent||'';
    const strain=(meta.split('|')[0]||'').trim();
    return strain && strain!=='—' ? `${number} — ${name} — ${strain}` : `${number} — ${name}`;
  }

  function allLabels(){return [0,1,2].map(getLabel)}

  function applyTableLabels(){
    const root=document.getElementById('root');
    if(!root)return;
    const labels=allLabels();

    root.querySelectorAll('.fc-side-table .fc-flock-head').forEach((h,i)=>{
      if(i>2)return;
      h.classList.add('adine-inline-flock-label');
      h.innerHTML=`<span class="adine-inline-flock-text">${labels[i]}</span>`;
    });

    root.querySelectorAll('.fc-table thead tr').forEach(tr=>{
      Array.from(tr.children).slice(1).forEach((th,i)=>{
        if(i>2)return;
        th.classList.add('adine-inline-flock-label');
        th.innerHTML=`<span class="adine-inline-flock-text">${labels[i]}</span>`;
      });
    });
  }

  function applyChartLabels(){
    const labels=allLabels();
    const ChartCtor=window.Chart;
    if(!ChartCtor || !ChartCtor.instances)return;

    Object.values(ChartCtor.instances).forEach(chart=>{
      const id=chart?.canvas?.id||'';
      if(!/^fc2-(weight|fcr|mort|quality)$/.test(id))return;
      const datasets=chart.data?.datasets||[];
      datasets.forEach((ds,i)=>{
        if(i<3)ds.label=labels[i];
      });
      try{chart.update('none')}catch(e){try{chart.update()}catch(_){}}
    });
  }

  function apply(){
    applyTableLabels();
    applyChartLabels();

    let style=document.getElementById('adine-flock-label-override');
    if(!style){
      style=document.createElement('style');
      style.id='adine-flock-label-override';
      document.head.appendChild(style);
    }
    style.textContent=`
      .fc-side-table .fc-flock-head.adine-inline-flock-label{font-size:.76rem!important;white-space:nowrap!important;min-width:175px!important;}
      .fc-side-table .fc-flock-head.adine-inline-flock-label>*{display:inline!important;}
      .fc-side-table .fc-flock-head.adine-inline-flock-label .adine-inline-flock-text{display:inline!important;width:auto!important;height:auto!important;padding:0!important;margin:0!important;background:none!important;border-radius:0!important;color:#27443a!important;font-size:.76rem!important;font-weight:900!important;line-height:1.55!important;white-space:nowrap!important;}
      .fc-table thead th.adine-inline-flock-label{font-size:.76rem!important;white-space:nowrap!important;}
      .fc-table thead th.adine-inline-flock-label .adine-inline-flock-text{display:inline!important;width:auto!important;height:auto!important;padding:0!important;margin:0!important;background:none!important;border-radius:0!important;color:#27443a!important;font-size:.76rem!important;font-weight:900!important;line-height:1.55!important;white-space:nowrap!important;}
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
    setTimeout(apply,50);
    setTimeout(apply,250);
    setTimeout(apply,700);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
