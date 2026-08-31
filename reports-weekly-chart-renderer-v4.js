/* VISUAL-ONLY weekly chart renderer. No calculation, standard, or database mutation. */
(function(){
  'use strict';
  const faDigits = s => String(s).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const fmt = (v, d=3) => v == null || !Number.isFinite(Number(v)) ? '—' : faDigits(Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}));
  const finite = a => a.filter(v => Number.isFinite(Number(v))).map(Number);
  const bounds = vals => { const x=finite(vals); if(!x.length) return {min:0,max:1}; const lo=Math.min(...x), hi=Math.max(...x), span=Math.max(hi-lo, Math.abs(hi)*0.08, 0.01); return {min:lo-span*.16,max:hi+span*.22}; };
  window.WeeklyChartDesignV4 = {
    baseOptions(kind){
      return {responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'nearest',intersect:false},plugins:{legend:{position:'top',labels:{font:{family:'Vazirmatn, Tahoma, Arial',size:16,weight:'700'},padding:18,usePointStyle:true}},tooltip:{titleFont:{family:'Vazirmatn, Tahoma, Arial',size:16,weight:'700'},bodyFont:{family:'Vazirmatn, Tahoma, Arial',size:16},callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y,kind==='weight'||kind==='gain'?1:3)}`}}},scales:{x:{ticks:{font:{family:'Vazirmatn, Tahoma, Arial',size:17,weight:'700'},padding:10},grid:{display:false},border:{width:2}},y:{ticks:{font:{family:'Vazirmatn, Tahoma, Arial',size:16,weight:'700'},padding:9},grid:{lineWidth:1,color:'rgba(40,60,50,.10)'},border:{width:2},beginAtZero:false}}};
    },
    line(id,labels,actual,reference,labelsText,kind){
      const el=document.getElementById(id); if(!el||!window.Chart)return null;
      const b=bounds([...actual,...reference]);
      return new Chart(el,{type:'line',data:{labels,datasets:[
        {label:labelsText.actual,data:actual,borderWidth:5,pointRadius:6,pointHoverRadius:8,tension:.15,spanGaps:false},
        {label:labelsText.reference,data:reference,borderWidth:4,borderDash:[10,7],pointRadius:4,pointHoverRadius:7,tension:.15,spanGaps:false}
      ]},options:Object.assign(this.baseOptions(kind),{scales:Object.assign(this.baseOptions(kind).scales,{y:Object.assign(this.baseOptions(kind).scales.y,{min:b.min,max:b.max})})})});
    },
    dumbbell(id,labels,actual,target,labelsText,kind){
      const el=document.getElementById(id); if(!el||!window.Chart)return null;
      const b=bounds([...actual,...target]);
      const connectorPlugin={id:'weeklyDumbbellConnector',afterDatasetsDraw(chart){const {ctx,scales}=chart; const a=chart.getDatasetMeta(0),t=chart.getDatasetMeta(1); ctx.save();ctx.lineWidth=4;ctx.globalAlpha=.55; for(let i=0;i<a.data.length;i++){const p=a.data[i],q=t.data[i];if(!p||!q)continue;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}ctx.restore();}};
      return new Chart(el,{type:'line',plugins:[connectorPlugin],data:{labels,datasets:[
        {label:labelsText.actual,data:actual,borderColor:'rgba(0,0,0,0)',backgroundColor:'rgba(0,0,0,0)',pointRadius:8,pointHoverRadius:10,pointBorderWidth:3,showLine:false},
        {label:labelsText.reference,data:target,borderColor:'rgba(0,0,0,0)',backgroundColor:'rgba(0,0,0,0)',pointRadius:8,pointHoverRadius:10,pointBorderWidth:3,showLine:false}
      ]},options:Object.assign(this.baseOptions(kind),{plugins:Object.assign(this.baseOptions(kind).plugins,{legend:{position:'top',labels:{font:{family:'Vazirmatn, Tahoma, Arial',size:16,weight:'700'},padding:18,usePointStyle:true}}}),scales:Object.assign(this.baseOptions(kind).scales,{y:Object.assign(this.baseOptions(kind).scales.y,{min:b.min,max:b.max})})})});
    }
  };
})();
