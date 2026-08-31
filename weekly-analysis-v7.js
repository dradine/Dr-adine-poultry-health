/* Weekly chart presentation layer V9 — visualization only. Never changes source data, calculations, standards or database. */
(function(){'use strict';
const IDS=['wWeight','wGain','wFcrCum','wFcrWeek'];
const SERIES=[
  {border:'#1769d2',dash:[],label:'داده واقعی گله'},
  {border:'#ed8b25',dash:[16,10],label:'استاندارد / هدف مرجع'},
  {border:'#c73535',dash:[7,7],label:'مرجع تحلیلی'},
  {border:'#b38a00',dash:[20,8,3,8],label:'حد مرجع'}
];
const fa=v=>v==null||!Number.isFinite(Number(v))?'—':Number(v).toLocaleString('fa-IR',{maximumFractionDigits:3});
function axisTitle(id){return id==='wFcrWeek'||id==='wFcrCum'?'FCR':id==='wGain'?'گرم / هفته':'گرم'}
function addInfo(canvas,chart){
  const host=canvas.closest('.box')||canvas.parentElement;if(!host)return;
  let info=host.querySelector('.wa-click-info');
  if(!info){info=document.createElement('div');info.className='wa-click-info';info.innerHTML='یک نقطه از نمودار را لمس کنید تا اطلاعات همان هفته نمایش داده شود.';host.appendChild(info)}
  if(canvas.dataset.waClickBound==='1')return;
  canvas.dataset.waClickBound='1';
  canvas.addEventListener('click',ev=>{
    let hit=[];
    try{hit=chart.getElementsAtEventForMode(ev,'nearest',{intersect:true},true)}catch(e){}
    if(!hit.length)try{hit=chart.getElementsAtEventForMode(ev,'index',{intersect:false},true)}catch(e){}
    if(!hit.length)return;
    const h=hit[0],week=chart.data.labels?.[h.index]??'هفته',ds=chart.data.datasets?.[h.datasetIndex],v=ds?.data?.[h.index];
    const all=chart.data.datasets.map((d,i)=>`<span class="wa-series-row"><i style="background:${SERIES[i%SERIES.length].border}"></i>${d.label||SERIES[i%SERIES.length].label}: <b>${fa(d.data?.[h.index])}</b></span>`).join('');
    info.innerHTML=`<div class="wa-selected-week">${week}</div>${all}`;
  });
}
function apply(chart,id){
  if(!chart||!chart.options)return;
  const opts=chart.options;
  opts.responsive=true;opts.maintainAspectRatio=false;opts.animation=false;opts.resizeDelay=0;
  opts.interaction={mode:'nearest',intersect:true};
  opts.layout={padding:{top:12,right:22,bottom:18,left:18}};
  opts.plugins=opts.plugins||{};
  opts.plugins.legend={display:true,position:'top',align:'start',labels:{usePointStyle:true,pointStyle:'line',boxWidth:42,boxHeight:12,padding:20,font:{family:'Tahoma,Arial,sans-serif',size:15,weight:'900'},color:'#142a22'}};
  opts.plugins.tooltip={enabled:true,mode:'nearest',intersect:true,displayColors:true,padding:12,titleMarginBottom:7,titleFont:{family:'Tahoma,Arial,sans-serif',size:15,weight:'900'},bodyFont:{family:'Tahoma,Arial,sans-serif',size:14,weight:'800'},callbacks:{title:items=>items?.[0]?.label||''}};
  opts.scales=opts.scales||{};
  opts.scales.x={...(opts.scales.x||{}),position:'bottom',offset:false,border:{display:true,color:'#253b33',width:3},grid:{display:true,color:'#d5dfda',lineWidth:1.4},ticks:{color:'#182d25',padding:12,maxRotation:0,minRotation:0,font:{family:'Tahoma,Arial,sans-serif',size:17,weight:'900'}},title:{display:true,text:'هفته',color:'#142a22',padding:{top:12},font:{family:'Tahoma,Arial,sans-serif',size:18,weight:'900'}}};
  opts.scales.y={...(opts.scales.y||{}),position:'left',beginAtZero:false,border:{display:true,color:'#253b33',width:3},grid:{display:true,color:'#d5dfda',lineWidth:1.4},ticks:{color:'#182d25',padding:14,font:{family:'Tahoma,Arial,sans-serif',size:17,weight:'900'},maxTicksLimit:7},title:{display:true,text:axisTitle(id),color:'#142a22',padding:{bottom:14},font:{family:'Tahoma,Arial,sans-serif',size:18,weight:'900'}}};
  chart.data.datasets.forEach((d,i)=>{const s=SERIES[i%SERIES.length];d.borderColor=s.border;d.backgroundColor=s.border;d.borderWidth=7;d.pointRadius=9;d.pointHoverRadius=13;d.pointHitRadius=28;d.pointBorderWidth=4;d.pointBorderColor='#fff';d.borderDash=s.dash;d.tension=.16;d.fill=false;});
  chart.update('none');
  addInfo(chart.canvas,chart);
}
function enhance(){
  if(!window.Chart||typeof Chart.getChart!=='function')return;
  IDS.forEach(id=>{const c=document.getElementById(id);if(!c)return;const chart=Chart.getChart(c);if(!chart)return;const signature=String(chart.id)+'|'+String(chart.data?.datasets?.length||0);if(c.dataset.waEnhanced===signature)return;apply(chart,id);c.dataset.waEnhanced=signature;});
}
function css(){
  if(document.getElementById('wa-v9-css'))return;
  const s=document.createElement('style');s.id='wa-v9-css';s.textContent=`
.chart{height:430px!important;min-height:430px!important;padding:18px 16px 14px!important;position:relative;overflow:visible!important}
.chart canvas{display:block!important;width:100%!important;height:350px!important;min-height:350px!important}
.chart h3{font-size:17px!important;font-weight:900!important;margin:0 0 12px!important;line-height:1.7!important;color:#142a22!important}
.wa-click-info{margin-top:10px;padding:12px 14px;background:#f1f6f3;border:2px solid #b8cbc2;border-radius:11px;color:#18372c;font:800 13px/2 Tahoma,Arial,sans-serif;text-align:right}
.wa-selected-week{font-size:15px;font-weight:900;margin-bottom:5px;border-bottom:1px solid #cddbd5;padding-bottom:5px}
.wa-series-row{display:inline-flex;align-items:center;gap:6px;margin-left:16px;white-space:nowrap}.wa-series-row i{width:12px;height:12px;border-radius:50%;display:inline-block}
@media(max-width:850px){.chart{height:450px!important;min-height:450px!important;padding:14px 10px!important}.chart canvas{height:365px!important;min-height:365px!important}.chart h3{font-size:16px!important}.wa-click-info{font-size:12px}}
@media(max-width:600px){.chart{height:455px!important;min-height:455px!important}.chart canvas{height:365px!important;min-height:365px!important}.wa-series-row{display:flex;margin:0 0 2px}.wa-click-info{font-size:12px}.wa-selected-week{font-size:14px}}
`;
  document.head.appendChild(s)
}
function boot(){css();let tries=0;const timer=setInterval(()=>{enhance();if(++tries>120)clearInterval(timer)},150);const root=document.getElementById('root');if(root)new MutationObserver(()=>setTimeout(enhance,80)).observe(root,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();