/* ADINE — comparison result labels
   Display: flock number + flock name + strain only.
   Normalizes duplicate/company-only text in both flock name and strain.
   Farm, house and placement date remain excluded from result labels.
   Chart legends use the same presentation label.
   Presentation-only: no calculations, data flow, Supabase writes or report structure changed.
*/
"use strict";
(function(){
  const digits=['۱','۲','۳'];
  const COMPANY_NAMES=/^(?:aviagen(?:\s+group)?|cobb(?:\s+vantress|\s+broilers)?|hubbard|sasso|lohmann|hendrix(?:\s+genetics)?|h&n|novogen|hy[-\s]?line|isa(?:\s+brown)?|dek[bB]|bovans|hisex|shaver|ross(?:\s+breeders|\s+poultry)?)$/i;
  const COMPANY_PREFIX=/^(?:aviagen(?:\s+group)?|cobb[-\s]?vantress|cobb[-\s]?broilers|hubbard|sasso|lohmann|hendrix(?:\s+genetics)?|h&n|novogen|hy[-\s]?line|isa(?:\s+brown)?|dek[bB]|bovans|hisex|shaver|ross\s+breeders|ross\s+poultry)\s*(?:[-:|]+\s*|\s+)/i;

  function key(value){
    return String(value||'').toLowerCase().replace(/[\s_\-–—|:]+/g,'');
  }

  function cleanParts(value, removeCompany=true){
    let s=String(value||'').trim();
    if(!s)return [];
    s=s.replace(/[–—|]+/g,' - ').replace(/\s+/g,' ').trim();
    s=s.replace(/^(?:[-:|]\s*)+|(?:\s*[-:|]\s*)+$/g,'').trim();
    let parts=s.split(/\s+-\s*/).map(x=>x.trim()).filter(Boolean);
    parts=parts.map(part=>removeCompany?part.replace(COMPANY_PREFIX,'').trim():part).filter(Boolean);
    if(removeCompany)parts=parts.filter(part=>!COMPANY_NAMES.test(part));
    const unique=[];
    parts.forEach(part=>{
      if(!unique.some(existing=>key(existing)===key(part)))unique.push(part);
    });
    return unique;
  }

  function normalizeStrain(value){
    let parts=cleanParts(value,true);
    if(!parts.length)return '';
    let s=parts.join(' - ');
    const words=s.split(/\s+/).filter(Boolean);
    if(words.length>=2){
      for(let cut=1;cut<=Math.floor(words.length/2);cut++){
        if(words.length===cut*2 && key(words.slice(0,cut).join(' '))===key(words.slice(cut).join(' '))){
          s=words.slice(0,cut).join(' '); break;
        }
      }
    }
    return s.replace(/^(?:[-:]\s*)+|(?:\s*[-:]\s*)+$/g,'').replace(/\s+/g,' ').trim();
  }

  function normalizeFlockName(value){
    const parts=cleanParts(value,false);
    if(!parts.length)return '';
    return parts.join(' - ').replace(/\s+/g,' ').trim();
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
    const rawParts=raw.split(/\s+—\s+/);
    let name=raw;
    if(rawParts.length>=4)name=rawParts.slice(2,-1).join(' — ').trim();

    const flock=getSelectedFlock(i);
    const flockName=flock?.flock_name?.trim();
    if(flockName)name=flockName;
    name=normalizeFlockName(name);

    // Only the actual strain field is allowed here; never genetics/company fallback.
    let strain=normalizeStrain(flock?.strain);
    if(!strain){
      const meta=select.parentElement?.querySelector('.fc-meta')?.textContent||'';
      const metaFirst=meta.split('|')[0];
      // Use meta only when it is not an obvious genetics/company-only value.
      strain=normalizeStrain(metaFirst);
    }

    const number=digits[i]||String(i+1);
    if(!name || name==='انتخاب گله…')return number;
    if(!strain || key(name)===key(strain))return `${number} — ${name}`;

    // If the strain is already a complete segment of the flock name, do not repeat it.
    const nameParts=cleanParts(name,false);
    if(nameParts.some(p=>key(p)===key(strain)))return `${number} — ${name}`;

    return `${number} — ${name} — ${strain}`;
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
          if(/^(?:1|2|3|۱|۲|۳)$/.test(current)){
            ds.label=getLabel(i);
          }else{
            const normalized=normalizeStrain(current);
            if(normalized && normalized!==current)ds.label=normalized;
          }
        });
        chart.update('none');
      }catch(e){/* presentation-only */}
    });
  }

  function apply(){
    const root=document.getElementById('root');
    if(!root)return;

    root.querySelectorAll('.fc-flock-head').forEach((h,i)=>{
      h.classList.add('adine-inline-flock-label');
      h.innerHTML=`<span class="fc-flock-index adine-inline-flock-text">${getLabel(i)}</span>`;
    });

    // Direct-comparison table: replace the old numeric-only headers with the same flock labels.
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
      .fc-table thead th.adine-inline-flock-label{font-size:.76rem!important;white-space:nowrap!important;min-width:175px!important;}
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
