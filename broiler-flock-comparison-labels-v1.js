/* ADINE — comparison result labels
   Display: flock number + flock name + strain only.
   Strain is normalized to remove manufacturer/company text and duplicate strain text.
   Farm, house and placement date remain excluded from result labels.
   Chart legends use the exact same flock label.
   No calculations, data flow or report structure are changed.
*/
"use strict";
(function(){
  const digits=['۱','۲','۳'];
  const COMPANY_RE=/(?:aviagen|aviagen group|cobb[-\s]?vantress|cobb[-\s]?broilers|cobb|hubbard|sasso|lohmann|hendrix|h&n|hendrix genetics|novogen|hy[-\s]?line|hyline|isa|isabrown|dek[bB]|bovans|hisex|shaver|ross poultry|ross breeders)/ig;

  function normalizeStrain(value){
    let s=String(value||'').trim();
    if(!s)return '';

    s=s.replace(/[|]+/g,' ')
      .replace(/[–—]+/g,' - ')
      .replace(/\s+/g,' ')
      .trim();

    // Split compound values first. Company/manufacturer-only segments are discarded.
    let parts=s.split(/\s+-\s+|\s*:\s*/).map(x=>x.trim()).filter(Boolean);
    parts=parts.map(part=>{
      // Remove company names wherever they were concatenated with the strain.
      return part.replace(COMPANY_RE,' ').replace(/\s+/g,' ').trim();
    }).filter(Boolean);

    // If a segment became empty, it was company/manufacturer text only.
    // Keep unique strain segments in their original order.
    const compact=x=>String(x||'').toLowerCase().replace(/[\s_\-]+/g,'');
    const unique=[];
    parts.forEach(p=>{
      if(!unique.some(u=>compact(u)===compact(p)))unique.push(p);
    });
    parts=unique;

    s=parts.join(' - ').trim();

    // Handle common concatenated forms such as "Ross 308 FF Ross 308 FF".
    const words=s.split(/\s+/).filter(Boolean);
    if(words.length>=2){
      for(let cut=1;cut<=Math.floor(words.length/2);cut++){
        const a=words.slice(0,cut).join(' ');
        const b=words.slice(cut,cut*2).join(' ');
        if(a.toLowerCase()===b.toLowerCase() && words.length===cut*2){s=a;break;}
      }
    }

    // Remove company names one more time after joining segments, then clean separators.
    s=s.replace(COMPANY_RE,' ').replace(/\s+-\s+/g,' - ').replace(/\s+/g,' ').trim();
    s=s.replace(/^(?:[-:]\s*)+|(?:\s*[-:]\s*)+$/g,'').trim();

    return s;
  }

  function getSelectedFlock(i){
    const select=document.getElementById(`fc2-flock-${i}`);
    if(!select)return null;
    const option=select.options[select.selectedIndex];
    if(!option || !select.value)return null;
    return window.__adineComparisonFlocks?.[i] || null;
  }

  function getLabel(i){
    const select=document.getElementById(`fc2-flock-${i}`);
    if(!select)return digits[i]||String(i+1);
    const option=select.options[select.selectedIndex];
    const raw=(option?.textContent||'').trim();
    const parts=raw.split(/\s+—\s+/);
    let name=raw;
    if(parts.length>=4)name=parts.slice(2,-1).join(' — ').trim();

    const flock=getSelectedFlock(i);
    const flockName=flock?.flock_name?.trim();
    if(flockName)name=flockName;

    // Result labels use only the actual strain field, never genetics/company.
    let strain=normalizeStrain(flock?.strain);
    if(!strain){
      const meta=select.parentElement?.querySelector('.fc-meta')?.textContent||'';
      strain=normalizeStrain(meta.split('|')[0]);
    }

    const number=digits[i]||String(i+1);
    if(!name || name==='انتخاب گله…')return number;
    return strain ? `${number} — ${name} — ${strain}` : `${number} — ${name}`;
  }

  function patchCharts(){
    if(!window.Chart)return;
    const instances=window.Chart.instances;
    const list=instances instanceof Map ? Array.from(instances.values()) : Array.isArray(instances) ? instances : Object.values(instances||{});
    list.forEach(chart=>{
      try{
        const canvas=chart?.canvas;
        if(!canvas || !document.getElementById('root')?.contains(canvas))return;
        const datasets=chart.data?.datasets||[];
        datasets.forEach((ds,i)=>{
          const current=String(ds.label??'').trim();
          if(/^(?:[1-3]|[۱-۳])$/.test(current))ds.label=getLabel(i);
          else if(COMPANY_RE.test(current) || /(?:ross|cobb|hubbard|sasso|lohmann)/i.test(current)){
            const normalized=normalizeStrain(current);
            if(normalized)ds.label=normalized;
          }
          COMPANY_RE.lastIndex=0;
        });
        chart.update('none');
      }catch(e){/* presentation-only; never affect report calculations */}
    });
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
      .fc-chart-legend .adine-flock-label,.fc2-chart-legend .adine-flock-label{white-space:nowrap!important;}
    `;

    patchCharts();
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
    setTimeout(apply,250);
    setTimeout(apply,750);
    setTimeout(apply,1500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();