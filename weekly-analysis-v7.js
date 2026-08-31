/* Weekly chart presentation layer V11.
 * VISUALIZATION ONLY.
 * Source data, calculations, official standards and management targets are not changed.
 * Reads the already-created Chart.js datasets and redraws them as clearer comparison charts.
 */
(function(){
  'use strict';
  const IDS=['wWeight','wGain','wFcrCum','wFcrWeek'];
  const STYLE_ID='weekly-chart-presentation-v11';
  const DONE='data-wa-v11';
  const C={actual:'#1769d2',reference:'#ed8b25',management:'#c73535',grid:'#dfe8e4',axis:'#263d34',text:'#20382f'};

  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`
      .wa-v11-box{position:relative!important;padding:18px!important;background:#fff!important;border:1px solid #d6e2dc!important;border-radius:16px!important;overflow:visible!important}
      .wa-v11-title{font-size:16px!important;font-weight:900!important;color:#17382d!important;margin:0 0 12px!important}
      .wa-v11-wrap{position:relative!important;width:100%!important;height:390px!important;min-height:390px!important}
      .wa-v11-wrap canvas{display:block!important;width:100%!important;height:100%!important}
      .wa-v11-legend{display:flex;flex-wrap:wrap;gap:10px 22px;margin:0 0 14px;padding:10px 13px;background:#f5f8f6;border:1px solid #dfe8e4;border-radius:10px;font-size:13px;font-weight:900;color:#29443a}
      .wa-v11-key{display:inline-flex;align-items:center;gap:8px}.wa-v11-swatch{width:28px;height:7px;border-radius:6px;display:inline-block}.wa-v11-dash{background:repeating-linear-gradient(90deg,#ed8b25 0 10px,transparent 10px 16px)}
      .wa-v11-info{margin-top:12px;padding:11px 13px;min-height:24px;background:#f2f7f4;border:1px solid #d9e5df;border-radius:10px;color:#24443a;font-size:13px;font-weight:800;line-height:2}
      @media(max-width:700px){.wa-v11-box{padding:14px 10px!important}.wa-v11-wrap{height:350px!important;min-height:350px!important}.wa-v11-legend{font-size:12px;gap:8px 14px}.wa-v11-swatch{width:23px}}
    `;document.head.appendChild(s);
  }
  function kind(label){const x=String(label||'');if(/واقعی|گله/.test(x))return'actual';if(/هدف مدیریتی/.test(x))return'management';return'reference'}
  function val(v,id){if(v==null||!Number.isFinite(Number(v)))return'—';const d=/Fcr/i.test(id)?3:1;return Number(v).toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})}
  function setupBox(canvas,chart){
    const box=canvas.closest('.box');if(!box)return null;box.classList.add('wa-v11-box');
    const h=box.querySelector('h3');if(h)h.classList.add('wa-v11-title');
    let wrap=box.querySelector('.wa-v11-wrap');if(!wrap){wrap=document.createElement('div');wrap.className='wa-v11-wrap';canvas.parentNode.insertBefore(wrap,canvas);wrap.appendChild(canvas)}
    let legend=box.querySelector('.wa-v11-legend');if(!legend){legend=document.createElement('div');legend.className='wa-v11-legend';if(h)h.insertAdjacentElement('afterend',legend);else box.insertBefore(legend,wrap)}
    legend.innerHTML='';chart.data.datasets.forEach((ds,i)=>{const k=kind(ds.label),item=document.createElement('span');item.className='wa-v11-key';const sw=document.createElement('i');sw.className='wa-v11-swatch'+(k==='reference'?' wa-v11-dash':'');sw.style.background=k==='actual'?C.actual:k==='management'?C.management:C.reference;const t=document.createElement('span');t.textContent=ds.label||('سری '+(i+1));item.append(sw,t);legend.appendChild(item)});
    let info=box.querySelector('.wa-v11-info');if(!info){info=document.createElement('div');info.className='wa-v11-info';info.textContent='برای مشاهده ارقام، روی ستون یا نقطه همان هفته لمس کنید.';box.appendChild(info)}
    return info;
  }
  function redraw(canvas){
    if(!window.Chart)return false;
    if(canvas.getAttribute(DONE)==='1')return true;
    const old=Chart.getChart(canvas);if(!old)return false;
    const original={labels:Array.from(old.data.labels||[]),datasets:(old.data.datasets||[]).map(d=>({label:d.label,data:Array.from(d.data||[])}))};
    const id=canvas.id, info=setupBox(canvas,old);
    if(!info)return false;
    const fcr=/Fcr/i.test(id), config={type:fcr?'bar':'bar',data:{labels:original.labels,datasets:original.datasets.map((d,i)=>{const k=kind(d.label);return{label:d.label,data:d.data,backgroundColor:k==='actual'?C.actual:k==='management'?C.management:C.reference,borderColor:k==='actual'?C.actual:k==='management'?C.management:C.reference,borderWidth:2,borderRadius:6,maxBarThickness:32}})},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:true},plugins:{legend:{display:false},tooltip:{enabled:true,rtl:true,displayColors:true,padding:12,titleFont:{size:14,weight:'bold'},bodyFont:{size:13,weight:'bold'},callbacks:{label:ctx=>` ${ctx.dataset.label}: ${val(ctx.raw,id)}`}}},scales:{x:{offset:true,grid:{color:C.grid,lineWidth:1},border:{color:C.axis,width:3},ticks:{color:C.text,font:{family:'Tahoma,Arial,sans-serif',size:15,weight:'bold'},padding:10,maxRotation:0,minRotation:0}},y:{beginAtZero:!fcr,grace:'10%',grid:{color:C.grid,lineWidth:1},border:{color:C.axis,width:3},ticks:{color:C.text,font:{family:'Tahoma,Arial,sans-serif',size:14,weight:'bold'},padding:10,maxTicksLimit:7}}}}};
    if(fcr){config.options.indexAxis='y';config.options.scales.x.beginAtZero=false;config.options.scales.x.grace='12%';config.options.scales.y.beginAtZero=true;config.options.scales.y.grace=undefined;config.options.scales.y.ticks.autoSkip=false;config.options.scales.y.ticks.font={family:'Tahoma,Arial,sans-serif',size:14,weight:'bold'};}
    old.destroy();
    const fresh=new Chart(canvas,config);
    canvas.setAttribute(DONE,'1');
    canvas.onclick=function(ev){const hits=fresh.getElementsAtEventForMode(ev,'nearest',{intersect:true},true);if(!hits.length)return;const idx=hits[0].index;const week=fresh.data.labels?.[idx]||'هفته انتخاب‌شده';const parts=fresh.data.datasets.map(ds=>`${ds.label}: ${val(ds.data?.[idx],id)}`);info.innerHTML=`<strong>${week}</strong> — ${parts.join(' | ')}`};
    return true;
  }
  function scan(){injectStyle();let n=0;IDS.forEach(id=>{const c=document.getElementById(id);if(c&&redraw(c))n++});return n}
  function start(){injectStyle();let tries=0;const t=setInterval(()=>{tries++;const n=scan();if(n===IDS.length||tries>80)clearInterval(t)},200);const root=document.getElementById('root');if(root)new MutationObserver(()=>setTimeout(scan,40)).observe(root,{childList:true,subtree:true});window.addEventListener('resize',()=>setTimeout(()=>{IDS.forEach(id=>{const c=document.getElementById(id);if(c){const ch=Chart.getChart(c);if(ch)ch.resize()}})},80),{passive:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();