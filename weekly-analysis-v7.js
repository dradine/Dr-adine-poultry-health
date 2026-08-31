/* Weekly chart presentation layer V12.
 * VISUALIZATION ONLY. Does not calculate, write, or mutate source data/standards.
 * Replaces the four existing weekly Chart.js line charts with grouped comparison bars.
 */
(function(){
  'use strict';
  const IDS=['wWeight','wGain','wFcrCum','wFcrWeek'];
  const MARK='data-weekly-v12';
  const C={actual:'#1565c0',official:'#ef8c24',management:'#c62828',grid:'#dfe7e3',axis:'#233b32',text:'#19352c'};
  const fa=v=>Number(v).toLocaleString('fa-IR',{maximumFractionDigits:/Fcr/.test(location.hash)?3:1});
  function css(){if(document.getElementById('weekly-v12-css'))return;const s=document.createElement('style');s.id='weekly-v12-css';s.textContent=`
    .wv12-box{padding:18px!important;border-radius:16px!important;background:#fff!important;overflow:visible!important}
    .wv12-box h3{font-size:16px!important;font-weight:900!important;margin:0 0 12px!important;color:${C.text}!important}
    .wv12-wrap{height:430px!important;min-height:430px!important;position:relative!important;width:100%!important;margin-top:4px!important}
    .wv12-wrap canvas{width:100%!important;height:100%!important;display:block!important}
    .wv12-legend{display:flex!important;flex-wrap:wrap!important;gap:10px 24px!important;padding:11px 14px!important;margin:0 0 12px!important;background:#f5f8f6!important;border:1px solid #dce6e1!important;border-radius:10px!important;font-size:13px!important;font-weight:900!important;color:${C.text}!important}
    .wv12-key{display:inline-flex;align-items:center;gap:8px}.wv12-dot{width:16px;height:16px;border-radius:4px;display:inline-block}
    .wv12-info{margin-top:12px!important;padding:12px 14px!important;min-height:24px!important;background:#f3f7f5!important;border:1px solid #d9e4de!important;border-radius:10px!important;font-size:13px!important;font-weight:900!important;line-height:2!important;color:${C.text}!important}
    @media(max-width:700px){.wv12-box{padding:14px 10px!important}.wv12-wrap{height:390px!important;min-height:390px!important}.wv12-legend{font-size:12px!important;gap:8px 14px!important}}
  `;document.head.appendChild(s)}
  function kind(label){const s=String(label||'');if(/هدف مدیریتی/.test(s))return'management';if(/استاندارد رسمی|رسمی|استاندارد/.test(s))return'official';return'actual'}
  function color(k){return C[k]}
  function decorate(box,chart){box.classList.add('wv12-box');const h=box.querySelector('h3');if(h)h.classList.add('wv12-title');let wrap=box.querySelector('.wv12-wrap');if(!wrap){wrap=document.createElement('div');wrap.className='wv12-wrap';const canvas=chart.canvas;canvas.parentNode.insertBefore(wrap,canvas);wrap.appendChild(canvas)}let legend=box.querySelector('.wv12-legend');if(!legend){legend=document.createElement('div');legend.className='wv12-legend';h?h.insertAdjacentElement('afterend',legend):box.insertBefore(legend,wrap)}legend.innerHTML='';chart.data.datasets.forEach((d,i)=>{const item=document.createElement('span');item.className='wv12-key';const dot=document.createElement('i');dot.className='wv12-dot';dot.style.background=color(kind(d.label));const t=document.createElement('span');t.textContent=d.label||`سری ${i+1}`;item.append(dot,t);legend.appendChild(item)});let info=box.querySelector('.wv12-info');if(!info){info=document.createElement('div');info.className='wv12-info';info.textContent='برای مشاهده جزئیات، روی ستون هر هفته لمس کنید.';box.appendChild(info)}return info}
  function redraw(canvas){
    if(!window.Chart||!canvas||canvas.dataset[MARK]==='1')return false;
    const old=Chart.getChart(canvas);if(!old)return false;
    const labels=[...(old.data.labels||[])];const data=(old.data.datasets||[]).map(d=>({label:d.label||'',data:[...(d.data||[])]}));const box=canvas.closest('.box');if(!box)return false;const info=decorate(box,old);old.destroy();
    const isFcr=/Fcr/i.test(canvas.id);const cfg={type:'bar',data:{labels,datasets:data.map(d=>{const k=kind(d.label);return{label:d.label,data:d.data,backgroundColor:color(k),borderColor:color(k),borderWidth:1,borderRadius:7,borderSkipped:false,maxBarThickness:42,categoryPercentage:.72,barPercentage:.88}})},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:true},plugins:{legend:{display:false},tooltip:{enabled:true,rtl:true,displayColors:true,padding:12,titleFont:{family:'Tahoma',size:14,weight:'bold'},bodyFont:{family:'Tahoma',size:13,weight:'bold'},callbacks:{label:ctx=>` ${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString('fa-IR',{minimumFractionDigits:isFcr?3:1,maximumFractionDigits:isFcr?3:1})}`}}},layout:{padding:{top:10,right:28,bottom:28,left:28}},scales:{x:{offset:true,grid:{display:false},border:{color:C.axis,width:3},ticks:{color:C.text,padding:12,font:{family:'Tahoma,Arial,sans-serif',size:16,weight:'bold'},maxRotation:0,minRotation:0}},y:{beginAtZero:isFcr?false:true,grace:'12%',grid:{color:C.grid,lineWidth:1},border:{color:C.axis,width:3},ticks:{color:C.text,padding:12,font:{family:'Tahoma,Arial,sans-serif',size:15,weight:'bold'},maxTicksLimit:7}}}}};
    const fresh=new Chart(canvas,cfg);canvas.dataset[MARK]='1';canvas.onclick=function(ev){const hits=fresh.getElementsAtEventForMode(ev,'nearest',{intersect:true},true);if(!hits.length)return;const i=hits[0].index;const week=labels[i]||`هفته ${i+1}`;info.innerHTML=`<strong>${week}</strong><br>${fresh.data.datasets.map(d=>`${d.label}: ${d.data[i]==null?'—':Number(d.data[i]).toLocaleString('fa-IR',{minimumFractionDigits:isFcr?3:1,maximumFractionDigits:isFcr?3:1})}`).join(' &nbsp; | &nbsp; ')}`};return true
  }
  function scan(){css();let n=0;IDS.forEach(id=>{const c=document.getElementById(id);if(c&&redraw(c))n++});return n}
  function start(){css();let tries=0;const t=setInterval(()=>{tries++;const n=scan();if(n===IDS.length||tries>=120)clearInterval(t)},150);const root=document.getElementById('root');if(root)new MutationObserver(()=>setTimeout(scan,20)).observe(root,{childList:true,subtree:true});window.addEventListener('resize',()=>setTimeout(scan,100),{passive:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();