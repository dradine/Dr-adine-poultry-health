/* Weekly chart presentation layer V10.
 * VISUALIZATION ONLY: never recalculates, writes, replaces, or mutates source data/standards.
 * It only restyles the four Chart.js instances already created by reports.html.
 */
(function(){
  'use strict';
  const IDS=['wWeight','wGain','wFcrCum','wFcrWeek'];
  const STYLE_ID='weekly-chart-presentation-v10';
  const COLORS={actual:'#1769d2',reference:'#ed8b25',analysis:'#c73535',limit:'#b38a00'};

  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent=`
      .wa-v10-box{position:relative!important;padding:18px 18px 16px!important;background:#fff!important;border:1px solid #d7e2dc!important;border-radius:14px!important;overflow:visible!important}
      .wa-v10-box h3{font-size:15px!important;font-weight:900!important;color:#19352b!important;margin:0 0 12px!important}
      .wa-v10-canvas-wrap{position:relative!important;width:100%!important;height:390px!important;min-height:390px!important}
      .wa-v10-canvas-wrap canvas{display:block!important;width:100%!important;height:100%!important}
      .wa-v10-legend{display:flex;flex-wrap:wrap;gap:10px 22px;margin:0 0 12px;padding:10px 12px;background:#f4f7f5;border:1px solid #e0e8e4;border-radius:9px;font-size:12px;font-weight:900;color:#29433a}
      .wa-v10-key{display:inline-flex;align-items:center;gap:7px}.wa-v10-swatch{display:inline-block;width:30px;height:5px;border-radius:5px}.wa-v10-dash{background:repeating-linear-gradient(90deg,#ed8b25 0 12px,transparent 12px 19px)}
      .wa-v10-info{margin-top:10px;min-height:20px;padding:10px 12px;background:#f1f6f3;border:1px solid #dce7e1;border-radius:9px;color:#27453a;font-size:12px;font-weight:800;line-height:1.9}
      @media(max-width:700px){.wa-v10-box{padding:14px 10px 12px!important}.wa-v10-canvas-wrap{height:350px!important;min-height:350px!important}.wa-v10-legend{font-size:11px;gap:8px 14px}.wa-v10-swatch{width:24px}}
    `;
    document.head.appendChild(s);
  }

  function refKind(label){
    const x=String(label||'');
    if(/واقعی|گله/.test(x)) return 'actual';
    if(/استاندارد رسمی|هدف مدیریتی|استاندارد|مرجع/.test(x)) return 'reference';
    if(/تحلیل/.test(x)) return 'analysis';
    return 'limit';
  }

  function formatValue(v,id){
    if(v==null||!Number.isFinite(Number(v))) return '—';
    const d=/Fcr/i.test(id)?3:1;
    return Number(v).toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d});
  }

  function decorate(canvas,chart){
    const box=canvas.closest('.box'); if(!box) return;
    box.classList.add('wa-v10-box');
    let title=box.querySelector('h3');
    let wrap=box.querySelector('.wa-v10-canvas-wrap');
    if(!wrap){
      wrap=document.createElement('div'); wrap.className='wa-v10-canvas-wrap';
      canvas.parentNode.insertBefore(wrap,canvas); wrap.appendChild(canvas);
    }
    let legend=box.querySelector('.wa-v10-legend');
    if(!legend){
      legend=document.createElement('div'); legend.className='wa-v10-legend';
      if(title) title.insertAdjacentElement('afterend',legend); else box.insertBefore(legend,wrap);
    }
    legend.innerHTML='';
    chart.data.datasets.forEach((ds,i)=>{
      const kind=refKind(ds.label), color=COLORS[kind];
      const item=document.createElement('span'); item.className='wa-v10-key';
      const sw=document.createElement('i'); sw.className='wa-v10-swatch'; sw.style.background=color;
      if(kind==='reference') sw.className+=' wa-v10-dash';
      const txt=document.createElement('span'); txt.textContent=ds.label||('سری '+(i+1));
      item.append(sw,txt); legend.appendChild(item);
    });
    let info=box.querySelector('.wa-v10-info');
    if(!info){info=document.createElement('div');info.className='wa-v10-info';info.textContent='برای مشاهده جزئیات، روی نقطه همان هفته لمس کنید.';box.appendChild(info)}
    if(canvas.dataset.waV10Bound==='1') return;
    canvas.dataset.waV10Bound='1';
    canvas.addEventListener('click',function(ev){
      let hits=[];
      try{hits=chart.getElementsAtEventForMode(ev,'nearest',{intersect:true},true)}catch(e){}
      if(!hits.length) return;
      const idx=hits[0].index;
      const week=chart.data.labels?.[idx]??'هفته انتخاب‌شده';
      const parts=chart.data.datasets.map(ds=>`${ds.label}: ${formatValue(ds.data?.[idx],canvas.id)}`);
      info.innerHTML=`<strong>${week}</strong> — ${parts.join(' | ')}`;
    });
  }

  function styleChart(canvas){
    if(!window.Chart) return false;
    const chart=Chart.getChart(canvas); if(!chart) return false;
    const id=canvas.id;
    chart.data.datasets.forEach((ds,i)=>{
      const kind=refKind(ds.label), color=COLORS[kind];
      ds.borderColor=color;
      ds.backgroundColor=color;
      ds.pointBackgroundColor=color;
      ds.pointBorderColor='#ffffff';
      ds.pointBorderWidth=3;
      ds.pointRadius=7;
      ds.pointHoverRadius=11;
      ds.pointHitRadius=18;
      ds.borderWidth=6;
      ds.tension=0.22;
      ds.fill=false;
      ds.spanGaps=true;
      ds.borderDash=kind==='reference'?[14,9]:kind==='analysis'?[8,8]:kind==='limit'?[18,7,3,7]:[];
    });
    chart.options.responsive=true;
    chart.options.maintainAspectRatio=false;
    chart.options.animation=false;
    chart.options.layout={padding:{top:8,right:22,bottom:20,left:20}};
    chart.options.interaction={mode:'nearest',intersect:true,axis:'x'};
    chart.options.plugins=chart.options.plugins||{};
    chart.options.plugins.legend={display:false};
    chart.options.plugins.tooltip={
      enabled:true,mode:'index',intersect:false,
      rtl:true,displayColors:true,padding:12,
      titleFont:{size:14,weight:'bold'},bodyFont:{size:13,weight:'bold'},
      callbacks:{label:(ctx)=>` ${ctx.dataset.label}: ${formatValue(ctx.parsed?.y,id)}`}
    };
    chart.options.scales=chart.options.scales||{};
    chart.options.scales.x={
      ...(chart.options.scales.x||{}),
      offset:true,
      grid:{display:true,color:'#e4ebe7',lineWidth:1},
      border:{color:'#263d34',width:3},
      ticks:{color:'#20382f',font:{family:'Tahoma,Arial,sans-serif',size:16,weight:'bold'},padding:12,maxRotation:0,minRotation:0,autoSkip:false}
    };
    chart.options.scales.y={
      ...(chart.options.scales.y||{}),
      beginAtZero:false,
      grace:'12%',
      grid:{color:'#e1e9e5',lineWidth:1},
      border:{color:'#263d34',width:3},
      ticks:{color:'#20382f',font:{family:'Tahoma,Arial,sans-serif',size:15,weight:'bold'},padding:12,maxTicksLimit:6}
    };
    chart.update('none');
    decorate(canvas,chart);
    return true;
  }

  function scan(){
    injectStyle();
    let found=0;
    IDS.forEach(id=>{const c=document.getElementById(id);if(c&&styleChart(c))found++});
    return found;
  }

  function start(){
    injectStyle();
    let attempts=0;
    const timer=setInterval(()=>{attempts++;const found=scan();if(found===IDS.length||attempts>=80)clearInterval(timer)},250);
    const root=document.getElementById('root');
    if(root){new MutationObserver(()=>{setTimeout(scan,30)}).observe(root,{childList:true,subtree:true})}
    window.addEventListener('resize',()=>setTimeout(scan,50),{passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();