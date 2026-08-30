/* ADINE — weekly charts v2: replace the old 2-chart area with 4 explicit charts */
(function(){
'use strict';
if(window.__ADINE_WEEKLY_CHARTS_V2__) return;
window.__ADINE_WEEKLY_CHARTS_V2__=true;
const $=id=>document.getElementById(id);
const num=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-1776)).replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-1632)).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
const pick=(r,ks)=>{for(const k of ks){const x=num(r?.[k]);if(x!==null)return x}return null};
const weight=r=>pick(r,['average_weight_g','avg_weight_g','weight_g']);
const fcr=(r,c)=>pick(r,c?['fcr_cumulative','cumulative_fcr','cum_fcr']:['fcr_weekly','weekly_fcr','fcr']);
function std(f,r,key){try{if(typeof resolvePoultryStandard!=='function')return null;const s=resolvePoultryStandard({productionType:f.production_type,genetics:f.genetics,strain:f.strain,variant:f.variant,ageDays:num(r?.age_days)});return num(s?.[key])}catch(e){return null}}
function gain(rows,i){if(i<1)return null;const direct=pick(rows[i],['weekly_weight_gain_g','weight_gain_g','weekly_gain_g','weight_gain']);if(direct!==null)return direct;const a=weight(rows[i]),b=weight(rows[i-1]);return a!==null&&b!==null?a-b:null}
function stdGain(f,rows,i){if(i<1)return null;const a=std(f,rows[i],'weight'),b=std(f,rows[i-1],'weight');return a!==null&&b!==null?a-b:null}
function target(f,rows,r){const w=num(r?.week_number);if(w===null||w<=1)return null;try{const cur=resolvePoultryStandard({productionType:f.production_type,genetics:f.genetics,strain:f.strain,variant:f.variant,ageDays:num(r.age_days)}),pr=rows.find(x=>num(x.week_number)===w-1);if(!pr)return null;const prev=resolvePoultryStandard({productionType:f.production_type,genetics:f.genetics,strain:f.strain,variant:f.variant,ageDays:num(pr.age_days)}),cc=num(cur?.fcr),pc=num(prev?.fcr),cw=num(cur?.weight),pw=num(prev?.weight);if([cc,pc,cw,pw].some(x=>x===null)||cw<=pw)return null;return(cc*(cw-pw)-pc*pw)/(cw-pw)}catch(e){return null}}
function box(title,id){return `<div class="box weekly-chart-box" style="height:310px;background:#fff;border:1px solid #dfe8e4;border-radius:12px;padding:10px;box-sizing:border-box"><h3 style="color:#17231f!important;background:#fff!important;display:block;font-weight:900;font-size:13px;margin:0 0 9px;text-align:right">${title}</h3><div style="height:260px;position:relative"><canvas id="${id}" style="display:block;width:100%;height:100%"></canvas></div></div>`}
function render(){
 const root=$('root');if(!root)return false;
 const old=root.querySelector('#w1,#w2');if(!old)return false;
 const chartSection=old.closest('.section');if(!chartSection)return false;
 if(root.querySelector('#wWeight'))return true;
 chartSection.innerHTML='<div class="grid weekly-four-charts" style="grid-template-columns:1fr 1fr;gap:10px">'+box('میانگین وزن واقعی و استاندارد رسمی','wWeight')+box('افزایش وزن هفتگی واقعی و استاندارد رسمی','wGain')+box('FCR تجمعی واقعی و استاندارد رسمی','wFcrCum')+box('FCR هفتگی واقعی و هدف مدیریتی','wFcrWeek')+'</div>';
 return draw();
}
function draw(){
 const id=new URLSearchParams(location.search).get('flock_id');if(!id||!window.supabaseClient)return false;
 return Promise.resolve(window.supabaseClient.from('flocks').select('*').eq('id',id).maybeSingle()).then(fr=>{
  if(fr.error||!fr.data)return false;
  return window.supabaseClient.from('weekly_monitoring').select('*').eq('flock_id',id).order('week_number',{ascending:true}).then(wr=>{
   if(wr.error)return false;const rows=wr.data||[];if(!rows.length)return false;
   const sel=Number($('week')?.value)||0, selected=rows[sel]||rows[rows.length-1], maxW=num(selected.week_number), rs=rows.filter(r=>num(r.week_number)<=maxW), labels=rs.map(r=>'هفته '+num(r.week_number));
   const sets=[
    ['wWeight',rs.map(weight),rs.map(r=>std(fr.data,r,'weight')),'وزن واقعی','استاندارد رسمی'],
    ['wGain',rs.map(r=>gain(rows,rows.indexOf(r))),rs.map(r=>stdGain(fr.data,rows,rows.indexOf(r))),'افزایش وزن واقعی','استاندارد رسمی'],
    ['wFcrCum',rs.map(r=>fcr(r,true)),rs.map(r=>std(fr.data,r,'fcr')),'FCR تجمعی واقعی','استاندارد رسمی تجمعی'],
    ['wFcrWeek',rs.map(r=>fcr(r,false)),rs.map(r=>target(fr.data,rows,r)),'FCR هفتگی واقعی','هدف مدیریتی']
   ];
   sets.forEach(s=>paint(...s,labels));return true;
  });
 });
}
function paint(id,a,b,nameA,nameB,labels){const c=$(id);if(!c)return;if(window.Chart){new Chart(c,{type:'line',data:{labels,datasets:[{label:nameA,data:a,spanGaps:true,tension:.25},{label:nameB,data:b,spanGaps:true,tension:.25}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:'#17231f',font:{family:'Tahoma,Arial',size:10}}}},scales:{x:{ticks:{color:'#17231f',font:{family:'Tahoma,Arial'}}},y:{ticks:{color:'#17231f',font:{family:'Tahoma,Arial'}},beginAtZero:false}}}});return}
 const ctx=c.getContext('2d');if(!ctx)return;const dpr=devicePixelRatio||1,w=Math.max(c.clientWidth,320),h=Math.max(c.clientHeight,250);c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const vals=a.concat(b).filter(Number.isFinite);if(!vals.length){ctx.fillStyle='#17231f';ctx.font='13px Tahoma';ctx.fillText('داده کافی برای رسم نمودار وجود ندارد',w/2-100,h/2);return}let mn=Math.min(...vals),mx=Math.max(...vals);if(mn===mx){mn-=1;mx+=1}const p={l:45,r:15,t:25,b:35},pw=w-p.l-p.r,ph=h-p.t-p.b,x=i=>p.l+(labels.length<2?pw/2:i*pw/(labels.length-1)),y=v=>p.t+(mx-v)*ph/(mx-mn);ctx.strokeStyle='#dfe8e4';for(let i=0;i<5;i++){const yy=p.t+i*ph/4;ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(w-p.r,yy);ctx.stroke()}ctx.fillStyle='#17231f';ctx.font='9px Tahoma';ctx.textAlign='center';labels.forEach((l,i)=>ctx.fillText(l,x(i),h-12));const line=(d,dash)=>{ctx.beginPath();ctx.setLineDash(dash?[6,4]:[]);let on=false;d.forEach((v,i)=>{if(v===null||!Number.isFinite(v)){on=false;return}const xx=x(i),yy=y(v);if(!on){ctx.moveTo(xx,yy);on=true}else ctx.lineTo(xx,yy)});ctx.stroke()};ctx.lineWidth=2;line(a,false);line(b,true);ctx.setLineDash([]);ctx.textAlign='right';ctx.fillText(nameA,w-p.r,13);ctx.textAlign='left';ctx.fillText(nameB,p.l,13)}
let timer=null;function boot(){if(timer)return;let tries=0;timer=setInterval(async()=>{tries++;const ok=render();if(ok||tries>=40){clearInterval(timer);timer=null}},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();document.addEventListener('change',e=>{if(e.target?.id==='week'){setTimeout(()=>{const r=$('root');const c=r?.querySelector('.weekly-four-charts');if(c){const x=new Event('click');document.dispatchEvent(new Event('adine-week-refresh'))}boot()},30)}});document.addEventListener('adine-week-refresh',()=>{const c=document.querySelector('.weekly-four-charts');if(c){const fake=c.parentElement.querySelector('#wWeight');if(fake){['wWeight','wGain','wFcrCum','wFcrWeek'].forEach(id=>{const el=$(id);if(el)el.remove()});c.outerHTML='<div class="grid weekly-four-charts" style="grid-template-columns:1fr 1fr;gap:10px">'+box('میانگین وزن واقعی و استاندارد رسمی','wWeight')+box('افزایش وزن هفتگی واقعی و استاندارد رسمی','wGain')+box('FCR تجمعی واقعی و استاندارد رسمی','wFcrCum')+box('FCR هفتگی واقعی و هدف مدیریتی','wFcrWeek')+'</div>';draw()}}});
})();