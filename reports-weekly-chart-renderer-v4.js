/* ADINE — WEEKLY REPORT CHART DESIGN V6
   VISUAL/INTERACTION ONLY.
   IMPORTANT: this module does not calculate FCR, standards, targets, or write to Supabase.
   It consumes only the values already supplied by reports.html.
*/
(function(){
  'use strict';
  const FONT='Vazirmatn, Tahoma, Arial, sans-serif';
  const C={
    actual:'#2563eb',
    reference:'#f59e0b',
    target:'#dc2626',
    good:'#16a34a',
    bad:'#dc2626',
    grid:'rgba(40,60,50,.09)',
    axis:'#52635c',
    text:'#23352e',
    muted:'#718079',
    surface:'#ffffff'
  };
  const fa=s=>String(s??'').replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null;};
  const fmt=(v,d=2)=>{const n=num(v);return n==null?'—':fa(n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}));};
  const finite=a=>(a||[]).map(num).filter(v=>v!==null);
  const bounds=(vals)=>{
    const x=finite(vals); if(!x.length)return{min:0,max:1};
    const lo=Math.min(...x),hi=Math.max(...x);
    const span=Math.max(hi-lo,Math.abs(hi)*.08,.01);
    return {min:lo-span*.18,max:hi+span*.22};
  };
  const weekFromLabel=s=>{const m=String(s||'').match(/([0-9۰-۹]+)/);if(!m)return null;return Number(m[1].replace(/[۰-۹]/g,d=>d.charCodeAt(0)-1776));};
  const selectWeek=week=>{
    const sel=document.getElementById('week'); if(!sel||week==null)return;
    const i=[...sel.options].findIndex(o=>weekFromLabel(o.textContent)===week);
    if(i>=0){sel.value=String(i);sel.dispatchEvent(new Event('change',{bubbles:true}));}
  };
  const common=(kind)=>({
    responsive:true,
    maintainAspectRatio:false,
    animation:{duration:450,easing:'easeOutQuart'},
    interaction:{mode:'index',intersect:false},
    layout:{padding:{top:8,right:12,left:8,bottom:2}},
    elements:{line:{cap:'round',join:'round'},point:{hitRadius:14}},
    plugins:{
      legend:{
        position:'top',align:'start',rtl:true,
        labels:{font:{family:FONT,size:13,weight:'700'},color:C.text,padding:18,usePointStyle:true,pointStyle:'circle',boxWidth:9}
      },
      tooltip:{
        rtl:true,textDirection:'rtl',displayColors:true,
        backgroundColor:'#173f35',titleColor:'#fff',bodyColor:'#fff',
        borderColor:'rgba(255,255,255,.16)',borderWidth:1,padding:12,cornerRadius:11,
        titleFont:{family:FONT,size:13,weight:'800'},bodyFont:{family:FONT,size:12,weight:'600'},
        callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y,kind==='weight'||kind==='gain'?1:3)}`}
      }
    },
    scales:{
      x:{
        ticks:{font:{family:FONT,size:12,weight:'700'},color:C.axis,padding:9,maxRotation:0},
        grid:{display:false},border:{color:'rgba(50,70,62,.28)',width:1.2}
      },
      y:{
        ticks:{font:{family:FONT,size:11,weight:'700'},color:C.axis,padding:8,callback:v=>fa(Number(v).toLocaleString('en-US',{maximumFractionDigits:kind==='weight'||kind==='gain'?0:3}))},
        grid:{color:C.grid,lineWidth:1},border:{display:false},beginAtZero:false
      }
    }
  });
  const lineDatasets=(actual,reference,labelsText)=>[
    {
      label:labelsText.actual,data:actual,
      borderColor:C.actual,backgroundColor:'rgba(37,99,235,.10)',
      pointBackgroundColor:C.actual,pointBorderColor:'#fff',pointBorderWidth:2,
      borderWidth:3.2,pointRadius:4.5,pointHoverRadius:7.5,tension:.28,spanGaps:false,
      fill:false
    },
    {
      label:labelsText.reference,data:reference,
      borderColor:C.reference,backgroundColor:'rgba(245,158,11,.08)',
      pointBackgroundColor:C.reference,pointBorderColor:'#fff',pointBorderWidth:2,
      borderWidth:2.5,borderDash:[8,6],pointRadius:3.5,pointHoverRadius:7,tension:.2,spanGaps:false,
      fill:false
    }
  ];
  const clickOptions=()=>({
    onClick:(evt,elements,chart)=>{
      if(!elements?.length)return;
      const i=elements[0].index;
      selectWeek(weekFromLabel(chart.data.labels[i]));
    }
  });
  const deviationPlugin=(kind)=>({
    id:'adineWeeklyDeviationV6',
    afterDatasetsDraw(chart){
      const a=chart.getDatasetMeta(0),r=chart.getDatasetMeta(1),ctx=chart.ctx;
      if(!a?.data||!r?.data)return;
      ctx.save();ctx.lineWidth=1.5;
      for(let i=0;i<a.data.length;i++){
        const p=a.data[i],q=r.data[i];
        const av=num(chart.data.datasets[0].data[i]),rv=num(chart.data.datasets[1].data[i]);
        if(!p||!q||av==null||rv==null)continue;
        const unfavorable=kind==='fcr'||kind==='gain'?av>rv:av<rv;
        ctx.strokeStyle=unfavorable?'rgba(220,38,38,.22)':'rgba(22,163,74,.20)';
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
      }
      ctx.restore();
    }
  });
  const safeCanvas=id=>{const el=document.getElementById(id);return el&&window.Chart?el:null;};
  window.WeeklyChartDesignV4={
    version:'6.0',
    baseOptions:common,
    line(id,labels,actual,reference,labelsText,kind){
      const el=safeCanvas(id);if(!el)return null;
      const b=bounds([...(actual||[]),...(reference||[])]);
      const opts=common(kind);
      opts.scales.y.min=b.min;opts.scales.y.max=b.max;
      Object.assign(opts,clickOptions());
      return new Chart(el,{type:'line',data:{labels,datasets:lineDatasets(actual,reference,labelsText)},options:opts,plugins:[deviationPlugin(kind)]});
    },
    dumbbell(id,labels,actual,target,labelsText,kind){
      const el=safeCanvas(id);if(!el)return null;
      const b=bounds([...(actual||[]),...(target||[])]);
      const opts=common(kind);
      opts.scales.y.min=b.min;opts.scales.y.max=b.max;
      Object.assign(opts,clickOptions());
      opts.plugins.tooltip.callbacks.label=c=>`${c.dataset.label}: ${fmt(c.parsed.y,3)}`;
      const connector={
        id:'adineWeeklyFcrConnectorV6',
        afterDatasetsDraw(chart){
          const metaA=chart.getDatasetMeta(0),metaT=chart.getDatasetMeta(1),ctx=chart.ctx;
          ctx.save();ctx.lineWidth=3;ctx.lineCap='round';
          for(let i=0;i<metaA.data.length;i++){
            const a=metaA.data[i],t=metaT.data[i];
            const av=num(chart.data.datasets[0].data[i]),tv=num(chart.data.datasets[1].data[i]);
            if(!a||!t||av==null||tv==null)continue;
            ctx.strokeStyle=av>tv?'rgba(220,38,38,.32)':'rgba(22,163,74,.30)';
            ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(t.x,t.y);ctx.stroke();
          }
          ctx.restore();
        }
      };
      return new Chart(el,{type:'line',data:{labels,datasets:[
        {label:labelsText.actual,data:actual,borderColor:'transparent',backgroundColor:C.actual,pointBackgroundColor:C.actual,pointBorderColor:'#fff',pointBorderWidth:2.5,pointRadius:8,pointHoverRadius:11,showLine:false},
        {label:labelsText.reference,data:target,borderColor:'transparent',backgroundColor:C.target,pointBackgroundColor:C.target,pointBorderColor:'#fff',pointBorderWidth:2.5,pointRadius:8,pointHoverRadius:11,showLine:false}
      ]},options:opts,plugins:[connector]});
    }
  };
})();
