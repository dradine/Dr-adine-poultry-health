/* ADINE — WEEKLY REPORT CHART DESIGN V5 — VISUAL ONLY
   IMPORTANT: this file contains presentation/interaction only.
   It does not calculate FCR, standards, benchmarks, or write to Supabase. */
(function(){
  'use strict';
  const FONT='Vazirmatn, Tahoma, Arial, sans-serif';
  const COLORS={actual:'#2563eb',reference:'#f59e0b',target:'#dc2626',grid:'rgba(40,60,50,.09)',text:'#33463f',muted:'#718079'};
  const faDigits=s=>String(s).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
  const fmt=(v,d=3)=>v==null||!Number.isFinite(Number(v))?'—':faDigits(Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}));
  const finite=a=>a.filter(v=>Number.isFinite(Number(v))).map(Number);
  const bounds=vals=>{const x=finite(vals);if(!x.length)return{min:0,max:1};const lo=Math.min(...x),hi=Math.max(...x),span=Math.max(hi-lo,Math.abs(hi)*.08,.01);return{min:lo-span*.16,max:hi+span*.22};};
  const weekFromLabel=s=>{const m=String(s||'').match(/([0-9۰-۹]+)/);if(!m)return null;return Number(m[1].replace(/[۰-۹]/g,d=>d.charCodeAt(0)-1776));};
  const selectWeek=week=>{const sel=document.getElementById('week');if(!sel||week==null)return;const opts=[...sel.options];const i=opts.findIndex(o=>weekFromLabel(o.textContent)===week);if(i>=0){sel.value=String(i);sel.dispatchEvent(new Event('change',{bubbles:true}));}};
  const common=(kind)=>({responsive:true,maintainAspectRatio:false,animation:false,layout:{padding:{top:4,right:8,left:4,bottom:2}},interaction:{mode:'nearest',intersect:true},plugins:{legend:{position:'top',align:'start',labels:{font:{family:FONT,size:14,weight:'700'},color:COLORS.text,padding:16,usePointStyle:true,boxWidth:10}},tooltip:{rtl:true,textDirection:'rtl',displayColors:true,backgroundColor:'#173f35',titleColor:'#fff',bodyColor:'#fff',borderColor:'rgba(255,255,255,.15)',borderWidth:1,padding:12,cornerRadius:10,titleFont:{family:FONT,size:14,weight:'800'},bodyFont:{family:FONT,size:13,weight:'600'},callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y,kind==='weight'||kind==='gain'?1:3)}`}}},scales:{x:{ticks:{font:{family:FONT,size:13,weight:'700'},color:COLORS.text,padding:8,maxRotation:0},grid:{display:false},border:{color:'rgba(50,70,62,.35)',width:1.5}},y:{ticks:{font:{family:FONT,size:12,weight:'700'},color:COLORS.text,padding:8},grid:{color:COLORS.grid,lineWidth:1},border:{color:'rgba(50,70,62,.35)',width:1.5},beginAtZero:false}}});
  const datasets=(actual,reference,labelsText)=>[
    {label:labelsText.actual,data:actual,borderColor:COLORS.actual,backgroundColor:COLORS.actual,pointBackgroundColor:COLORS.actual,pointBorderColor:'#fff',pointBorderWidth:2.5,borderWidth:3.5,pointRadius:5,pointHoverRadius:8,tension:.22,spanGaps:false},
    {label:labelsText.reference,data:reference,borderColor:COLORS.reference,backgroundColor:COLORS.reference,pointBackgroundColor:COLORS.reference,pointBorderColor:'#fff',pointBorderWidth:2,borderWidth:3,borderDash:[9,7],pointRadius:4,pointHoverRadius:7,tension:.18,spanGaps:false}
  ];
  const clickOptions=()=>({onClick:(evt,elements,chart)=>{if(!elements?.length)return;const i=elements[0].index;selectWeek(weekFromLabel(chart.data.labels[i]));}});
  window.WeeklyChartDesignV4={
    baseOptions:common,
    line(id,labels,actual,reference,labelsText,kind){
      const el=document.getElementById(id);if(!el||!window.Chart)return null;
      const b=bounds([...actual,...reference]);
      const opts=common(kind);opts.scales.y.min=b.min;opts.scales.y.max=b.max;Object.assign(opts,clickOptions());
      return new Chart(el,{type:'line',data:{labels,datasets:datasets(actual,reference,labelsText)},options:opts});
    },
    dumbbell(id,labels,actual,target,labelsText,kind){
      const el=document.getElementById(id);if(!el||!window.Chart)return null;
      const b=bounds([...actual,...target]);
      const connector={id:'adineWeeklyFcrConnector',afterDatasetsDraw(chart){const metaA=chart.getDatasetMeta(0),metaT=chart.getDatasetMeta(1),ctx=chart.ctx;ctx.save();ctx.lineWidth=3;ctx.globalAlpha=.32;ctx.strokeStyle=COLORS.target;for(let i=0;i<metaA.data.length;i++){const a=metaA.data[i],t=metaT.data[i];if(!a||!t)continue;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(t.x,t.y);ctx.stroke();}ctx.restore();}};
      const opts=common(kind);opts.scales.y.min=b.min;opts.scales.y.max=b.max;Object.assign(opts,clickOptions());
      opts.plugins.tooltip.callbacks.label=c=>`${c.dataset.label}: ${fmt(c.parsed.y,3)}`;
      return new Chart(el,{type:'line',plugins:[connector],data:{labels,datasets:[
        {label:labelsText.actual,data:actual,borderColor:'transparent',backgroundColor:COLORS.actual,pointBackgroundColor:COLORS.actual,pointBorderColor:'#fff',pointBorderWidth:2.5,pointRadius:8,pointHoverRadius:11,showLine:false},
        {label:labelsText.reference,data:target,borderColor:'transparent',backgroundColor:COLORS.target,pointBackgroundColor:COLORS.target,pointBorderColor:'#fff',pointBorderWidth:2.5,pointRadius:8,pointHoverRadius:11,showLine:false}
      ]},options:opts});
    }
  };
})();