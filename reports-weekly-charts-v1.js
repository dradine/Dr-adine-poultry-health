/* ADINE — robust weekly comparison charts v1 */
(function(){
  'use strict';
  if (window.__ADINE_WEEKLY_CHARTS_V1__) return;
  window.__ADINE_WEEKLY_CHARTS_V1__ = true;

  const $ = id => document.getElementById(id);
  const num = v => {
    if(v===null || v===undefined || v==='') return null;
    const x = Number(String(v)
      .replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-1776))
      .replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-1632))
      .replace(/[٬,]/g,'').replace('٫','.'));
    return Number.isFinite(x) ? x : null;
  };
  const pick = (r, keys) => { for(const k of keys){ const x=num(r?.[k]); if(x!==null) return x; } return null; };
  const fcr = (r, cumulative) => pick(r, cumulative ? ['fcr_cumulative','cumulative_fcr','cum_fcr'] : ['fcr_weekly','weekly_fcr','fcr']);
  const weight = r => pick(r,['average_weight_g','avg_weight_g','weight_g']);
  const standard = (flock,r,key) => {
    try{
      if(typeof resolvePoultryStandard!=='function') return null;
      const s=resolvePoultryStandard({productionType:flock.production_type,genetics:flock.genetics,strain:flock.strain,variant:flock.variant,ageDays:num(r?.age_days)});
      return num(s?.[key]);
    }catch(e){ return null; }
  };
  function managementTarget(flock,rows,r){
    const week=num(r?.week_number); if(week===null) return null;
    try{
      if(typeof resolvePoultryStandard!=='function') return null;
      const cur=resolvePoultryStandard({productionType:flock.production_type,genetics:flock.genetics,strain:flock.strain,variant:flock.variant,ageDays:num(r.age_days)});
      const prevRow=rows.find(x=>num(x.week_number)===week-1);
      if(!prevRow) return null;
      const prev=resolvePoultryStandard({productionType:flock.production_type,genetics:flock.genetics,strain:flock.strain,variant:flock.variant,ageDays:num(prevRow.age_days)});
      const cc=num(cur?.fcr),pc=num(prev?.fcr),cw=num(cur?.weight),pw=num(prev?.weight);
      if(cc===null||pc===null||cw===null||pw===null||cw<=pw) return null;
      const gain=cw-pw;
      return (cc*(cw-pw)-pc*pw)/gain;
    }catch(e){return null;}
  }
  function weeklyGain(rows,index){
    const direct=pick(rows[index],['weekly_weight_gain_g','weight_gain_g','weekly_gain_g','weight_gain']);
    if(direct!==null) return direct;
    if(index<=0) return null;
    const a=weight(rows[index]), b=weight(rows[index-1]);
    return a!==null&&b!==null ? a-b : null;
  }
  function standardGain(flock,rows,index){
    if(index<=0) return null;
    const a=standard(flock,rows[index],'weight'), b=standard(flock,rows[index-1],'weight');
    return a!==null&&b!==null ? a-b : null;
  }
  function selectedRows(all,selected){
    const wk=num(selected?.week_number);
    return wk===null ? all : all.filter(r=>num(r.week_number)<=wk);
  }
  function makeDatasets(flock,all,selected){
    const rs=selectedRows(all,selected), labels=rs.map(r=>'هفته '+(num(r.week_number)??''));
    return {labels,rs,
      weight:[rs.map(weight),rs.map(r=>standard(flock,r,'weight'))],
      gain:[rs.map((r,i)=>weeklyGain(all,all.indexOf(r))),rs.map(r=>standardGain(flock,all,all.indexOf(r)))],
      fcrCum:[rs.map(r=>fcr(r,true)),rs.map(r=>standard(flock,r,'fcr'))],
      fcrWeek:[rs.map(r=>fcr(r,false)),rs.map(r=>managementTarget(flock,all,r))]
    };
  }
  function chartJs(id,labels,a,b,nameA,nameB){
    const c=$(id); if(!c || !window.Chart) return false;
    new Chart(c,{type:'line',data:{labels,datasets:[
      {label:nameA,data:a,spanGaps:true,tension:.25},
      {label:nameB,data:b,spanGaps:true,tension:.25}
    ]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top'}},scales:{x:{ticks:{font:{family:'Tahoma,Arial'}}},y:{beginAtZero:false,ticks:{font:{family:'Tahoma,Arial'}}}}}});
    return true;
  }
  function native(id,labels,a,b,nameA,nameB){
    const c=$(id); if(!c) return;
    const ctx=c.getContext('2d'); if(!ctx) return;
    const dpr=window.devicePixelRatio||1, w=Math.max(c.clientWidth,320), h=Math.max(c.clientHeight,260);
    c.width=w*dpr; c.height=h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
    const vals=a.concat(b).filter(x=>x!==null&&Number.isFinite(x));
    if(!vals.length){ctx.font='14px Tahoma';ctx.fillText('داده کافی برای رسم نمودار وجود ندارد',w/2-115,h/2);return;}
    let min=Math.min(...vals),max=Math.max(...vals); if(min===max){min-=1;max+=1;} const pad={l:48,r:18,t:32,b:42}, pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
    const x=i=>pad.l+(labels.length<=1?pw/2:i*pw/(labels.length-1)), y=v=>pad.t+(max-v)*ph/(max-min);
    ctx.strokeStyle='#dfe8e3';ctx.lineWidth=1; for(let i=0;i<5;i++){const yy=pad.t+i*ph/4;ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();}
    ctx.font='10px Tahoma';ctx.fillStyle='#687770';ctx.textAlign='center'; labels.forEach((l,i)=>ctx.fillText(l,x(i),h-14));
    const draw=(data)=>{ctx.beginPath();let started=false;data.forEach((v,i)=>{if(v===null||!Number.isFinite(v)){started=false;return;}const xx=x(i),yy=y(v);if(!started){ctx.moveTo(xx,yy);started=true;}else ctx.lineTo(xx,yy);});ctx.stroke();data.forEach((v,i)=>{if(v===null||!Number.isFinite(v))return;ctx.beginPath();ctx.arc(x(i),y(v),3,0,Math.PI*2);ctx.fill();});};
    ctx.lineWidth=2; draw(a); ctx.setLineDash([6,4]); draw(b); ctx.setLineDash([]);
    ctx.textAlign='right';ctx.fillText(nameA,w-pad.r,16);ctx.textAlign='left';ctx.fillText(nameB,pad.l,16);
  }
  function render(){
    if(!document.querySelector('.chart canvas[id^="w"]')) return false;
    const id=(new URLSearchParams(location.search)).get('flock_id'); if(!id || !window.supabaseClient) return false;
    return Promise.resolve(window.supabaseClient.from('flocks').select('*').eq('id',id).maybeSingle()).then(fr=>{
      if(fr.error||!fr.data) return false;
      return window.supabaseClient.from('weekly_monitoring').select('*').eq('flock_id',id).order('week_number',{ascending:true}).then(wr=>{
        if(wr.error) return false;
        const all=wr.data||[]; if(!all.length) return false;
        const select=$('week');
        const selected=all[Number(select?.value)||0] || all[all.length-1];
        const d=makeDatasets(fr.data,all,selected);
        chartJs('wWeight',d.labels,d.weight[0],d.weight[1],'میانگین وزن واقعی','استاندارد رسمی وزن') || native('wWeight',d.labels,d.weight[0],d.weight[1],'واقعی','استاندارد');
        chartJs('wGain',d.labels,d.gain[0],d.gain[1],'افزایش وزن واقعی','استاندارد رسمی افزایش وزن') || native('wGain',d.labels,d.gain[0],d.gain[1],'واقعی','استاندارد');
        chartJs('wFcrCum',d.labels,d.fcrCum[0],d.fcrCum[1],'FCR تجمعی واقعی','استاندارد رسمی FCR تجمعی') || native('wFcrCum',d.labels,d.fcrCum[0],d.fcrCum[1],'واقعی','استاندارد');
        chartJs('wFcrWeek',d.labels,d.fcrWeek[0],d.fcrWeek[1],'FCR هفتگی واقعی','هدف مدیریتی FCR هفتگی') || native('wFcrWeek',d.labels,d.fcrWeek[0],d.fcrWeek[1],'واقعی','هدف مدیریتی');
        return true;
      });
    }).catch(()=>false);
  }
  let timer=null;
  function boot(){
    if(timer) return;
    let tries=0;
    timer=setInterval(async()=>{
      tries++;
      const ok=await render();
      if(ok || tries>=30){clearInterval(timer);timer=null;}
    },250);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  document.addEventListener('change',e=>{if(e.target?.id==='week') setTimeout(boot,20);});
})();