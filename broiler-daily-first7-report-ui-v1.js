/* ADINE — FIRST 7 DAY DAILY REPORT UI V2
   UX model: one selected day at a time.
   Day 1 = baseline. Day 2..7 = current day + comparison with previous day + comparison with age reference.
   Data source remains the independent first-7 engine.
*/
(function(){
'use strict';
if(window.ADINE_BROILER_FIRST7_REPORT_UI_V1)return;

const ENGINE=()=>window.ADINE_BROILER_FIRST7_REPORT_ENGINE_V1;
const $=id=>document.getElementById(id);
let busy=false, model=null, selectedAge=null;

const num=v=>{
  if(v===null||v===undefined||v==='')return null;
  const s=String(v).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٬،,]/g,'');
  const x=Number(s);return Number.isFinite(x)?x:null;
};
const fmt=(v,d=1)=>num(v)==null?'—':num(v).toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=(v,d=1)=>num(v)==null?'—':fmt(v,d)+'٪';
const signedPct=(v,d=1)=>num(v)==null?'—':(v>=0?'+':'')+fmt(v,d)+'٪';
const esc=v=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const change=(a,b)=>a==null||b==null||a===0?null:(b-a)/Math.abs(a)*100;
const diff=(a,b)=>a==null||b==null?null:b-a;

function sanitize(m){
  let lastBw=null;
  (m.days||[]).forEach(d=>{
    if(d.bw!=null&&d.bw<=0)d.bw=null;
    if(d.bw==null){d.gain=null;d.growthPct=null;d.dev=null;}
    else if(lastBw!=null){d.gain=d.bw-lastBw;d.growthPct=lastBw>0?d.gain/lastBw*100:null;d.dev=d.target!=null?(d.bw-d.target)/d.target*100:null;}
    else {d.gain=null;d.growthPct=null;d.dev=d.target!=null?(d.bw-d.target)/d.target*100:null;}
    if(d.bw!=null)lastBw=d.bw;
  });
  return m;
}

function injectStyle(){
 if(document.getElementById('adine-f7-v2-style'))return;
 const s=document.createElement('style');s.id='adine-f7-v2-style';s.textContent=`
.f7v2{direction:rtl;font-family:inherit;color:var(--text-primary,#172033)}
.f7v2 *{box-sizing:border-box}.f7v2 .f7v2-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.f7v2 h2,.f7v2 h3,.f7v2 p{margin:0}.f7v2 h2{font-size:20px}.f7v2 h3{font-size:15px}.f7v2 .eyebrow{font-size:11px;opacity:.65;margin-bottom:5px}.f7v2 .sub{font-size:11px;opacity:.65;margin-top:5px}.f7v2 .badge{padding:7px 10px;border-radius:10px;background:rgba(20,140,90,.1);color:#16865b;font-size:11px;white-space:nowrap}
.f7v2 .day-nav{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:14px 0}.f7v2 .day-btn{border:1px solid rgba(120,130,145,.22);background:var(--card-bg,#fff);border-radius:10px;padding:9px 3px;cursor:pointer;font:inherit;color:inherit}.f7v2 .day-btn strong{display:block;font-size:13px}.f7v2 .day-btn small{display:block;font-size:9px;opacity:.55;margin-top:3px}.f7v2 .day-btn.active{background:#16865b;color:#fff;border-color:#16865b}.f7v2 .day-btn.missing{opacity:.4}.f7v2 .day-btn.problem{box-shadow:inset 0 -3px 0 #d64b4b}
.f7v2 .section{background:var(--card-bg,#fff);border:1px solid rgba(120,130,145,.18);border-radius:14px;padding:14px;margin:10px 0}.f7v2 .section-title{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:11px}.f7v2 .muted{font-size:10px;opacity:.6}.f7v2 .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.f7v2 .metric{border:1px solid rgba(120,130,145,.16);border-radius:11px;padding:10px;min-height:74px}.f7v2 .metric small{display:block;font-size:10px;opacity:.62}.f7v2 .metric strong{display:block;font-size:17px;margin:5px 0}.f7v2 .metric span{display:block;font-size:9px;opacity:.62;line-height:1.6}.f7v2 .good{border-color:rgba(22,134,91,.3)}.f7v2 .warn{border-color:rgba(210,150,40,.4)}.f7v2 .bad{border-color:rgba(210,65,65,.45)}
.f7v2 .status{display:inline-flex;align-items:center;gap:5px;font-size:10px;padding:4px 7px;border-radius:8px}.f7v2 .status.good{background:rgba(22,134,91,.1);color:#16865b}.f7v2 .status.warn{background:rgba(210,150,40,.12);color:#a46a00}.f7v2 .status.bad{background:rgba(210,65,65,.1);color:#b72f2f}.f7v2 .status.neutral{background:rgba(120,130,145,.1);color:inherit}
.f7v2 .compare{display:grid;grid-template-columns:1fr 1fr;gap:8px}.f7v2 .compare-card{border-radius:11px;padding:11px;background:rgba(120,130,145,.055)}.f7v2 .compare-card b{display:block;font-size:11px;margin-bottom:6px}.f7v2 .compare-row{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px dashed rgba(120,130,145,.15);font-size:11px}.f7v2 .compare-row:last-child{border-bottom:0}.f7v2 .trend-up{color:#16865b}.f7v2 .trend-down{color:#b72f2f}.f7v2 .trend-flat{opacity:.65}
.f7v2 .event{border-right:3px solid #16865b;padding:9px 10px;margin:6px 0;background:rgba(22,134,91,.055);border-radius:8px;font-size:11px;line-height:1.8}.f7v2 .event.warn{border-right-color:#c58b20;background:rgba(197,139,32,.06)}.f7v2 .event.bad{border-right-color:#c33c3c;background:rgba(195,60,60,.06)}.f7v2 .event strong{display:block;font-size:11px}.f7v2 .quality{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.f7v2 .quality>div{padding:9px;border-radius:9px;background:rgba(120,130,145,.055);font-size:10px;line-height:1.7}.f7v2 .note{font-size:10px;line-height:1.9;opacity:.7;margin-top:9px}.f7v2 .empty{padding:40px;text-align:center;opacity:.7}.f7v2 .footer-weekly{font-size:10px;line-height:1.8;opacity:.65;padding:4px 2px}
@media(max-width:760px){.f7v2 .grid{grid-template-columns:repeat(2,1fr)}.f7v2 .compare{grid-template-columns:1fr}.f7v2 .quality{grid-template-columns:1fr}.f7v2 .day-nav{gap:4px}.f7v2 .day-btn{padding:8px 1px}.f7v2 .day-btn small{display:none}.f7v2 .f7v2-head{align-items:center}.f7v2 h2{font-size:17px}}
`;
 document.head.appendChild(s);
}

function weightState(d){
 if(d.dev==null)return['neutral','مرجع وزن در دسترس نیست'];
 if(d.dev>=2)return['good','جلوتر از مرجع'];
 if(d.dev>=-5)return['good','در محدوده نزدیک مرجع'];
 if(d.dev>=-10)return['warn','پایین‌تر از مرجع'];
 return['bad','فاصله قابل توجه از مرجع'];
}
function bandState(v,band){
 if(v==null||!band)return['neutral','بدون مرجع'];
 return v>=band[0]&&v<=band[1]?['good','داخل محدوده']:['warn','خارج از محدوده'];
}
function standardStatus(d,m){
 const st=m.std||{};
 const tempBand=st.common?.broodingTemperatureC?.default?.[d.age]||null;
 const rhBand=st.common?.humidity?.default?.[d.age]||null;
 const ratioBand=st.common?.waterFeedRatio||null;
 return {tempBand,rhBand,ratioBand};
}
function metric(label,value,ref,status='neutral'){
 return `<div class="metric ${status}"><small>${esc(label)}</small><strong>${value}</strong><span>${esc(ref||'')}</span></div>`;
}
function statusClass(s){return s==='good'||s==='warn'||s==='bad'?s:'neutral'}
function statusText(s){return s==='good'?'مناسب':s==='warn'?'نیازمند توجه':s==='bad'?'نامناسب':'بدون ارزیابی'}

function dailyEvents(d,prev,m){
 const events=[];const bands=standardStatus(d,m),w=weightState(d);
 if(d.age===1)events.push({s:'good',t:'روز مبنا',x:'روز اول به‌عنوان خط پایه ثبت می‌شود؛ از روز دوم به بعد روند نسبت به روز قبل نیز سنجیده خواهد شد.'});
 else if(prev){
   if(d.bw!=null&&prev.bw!=null){const dc=change(prev.bw,d.bw);const devDelta=diff(prev.dev,d.dev);if(devDelta!=null){if(devDelta>=2)events.push({s:'good',t:'روند وزن در حال بهبود',x:`فاصله وزن از مرجع نسبت به روز ${prev.age} بهتر شده است (${signedPct(devDelta)} تغییر در انحراف).`});else if(devDelta<=-2)events.push({s:'bad',t:'روند وزن در حال تضعیف',x:`فاصله وزن از مرجع نسبت به روز ${prev.age} بدتر شده است (${signedPct(devDelta)} تغییر در انحراف). وزن امروز ${fmt(d.bw,1)} گرم در برابر مرجع ${fmt(d.target,1)} گرم است.`});else events.push({s:'good',t:'روند وزن پایدار',x:`وزن ${fmt(d.bw,1)} گرم است و فاصله آن از مرجع نسبت به روز قبل تغییر محسوسی نکرده است.`});if(dc!=null)events.push({s:dc>=0?'good':'warn',t:'افزایش وزن روزانه',x:`وزن نسبت به روز ${prev.age} ${signedPct(dc)} تغییر کرده است.`});}
   }
   const fd=change(prev.feed,d.feed),wd=change(prev.water,d.water);
   if(fd!=null&&fd<=-15)events.push({s:'bad',t:'افت مصرف دان',x:`مصرف دان نسبت به روز ${prev.age} ${fmt(Math.abs(fd),0)}٪ کاهش یافته است.`});
   else if(fd!=null&&fd>=10)events.push({s:'good',t:'افزایش مصرف دان',x:`مصرف دان نسبت به روز ${prev.age} ${signedPct(fd,0)} تغییر کرده است.`});
   if(wd!=null&&wd<=-15)events.push({s:'bad',t:'افت مصرف آب',x:`مصرف آب نسبت به روز ${prev.age} ${fmt(Math.abs(wd),0)}٪ کاهش یافته است.`});
   if(fd!=null&&wd!=null&&fd<=-15&&wd<=-15)events.push({s:'bad',t:'افت همزمان آب و دان',x:'این الگو باید از نظر دسترسی آب/دان، کیفیت محیط، دمای مؤثر و وضعیت سلامت بررسی شود.'});
 }
 if(d.dev!=null&&d.dev<=-10)events.push({s:'bad',t:'وزن پایین‌تر از مرجع',x:`${fmt(Math.abs(d.dev),1)}٪ پایین‌تر از مرجع روز ${d.age}.`});
 else if(d.dev!=null&&d.dev<=-5)events.push({s:'warn',t:'وزن زیر مرجع',x:`${fmt(Math.abs(d.dev),1)}٪ پایین‌تر از مرجع روز ${d.age}.`});
 if(d.mort!=null&&d.mort>0)events.push({s:d.mortPct>=1?'bad':d.mortPct>=.5?'warn':'neutral',t:'تلفات روز',x:`${fmt(d.mort,0)} قطعه؛ نرخ روزانه ${pct(d.mortPct,2)} و تجمعی ${pct(d.cumMortPct,2)}.`});
 const ts=bandState(d.temp,bands.tempBand);if(ts[0]!=='good'&&d.temp!=null)events.push({s:'warn',t:'دمای سالن خارج از محدوده مرجع',x:`${fmt(d.temp,1)}°C؛ محدوده عملیاتی روز ${d.age}: ${fmt(bands.tempBand?.[0],1)} تا ${fmt(bands.tempBand?.[1],1)}°C.`});
 const rs=bandState(d.rh,bands.rhBand);if(rs[0]!=='good'&&d.rh!=null)events.push({s:'warn',t:'رطوبت نسبی خارج از محدوده',x:`${fmt(d.rh,1)}٪؛ محدوده مرجع روز ${d.age}: ${fmt(bands.rhBand?.[0],0)} تا ${fmt(bands.rhBand?.[1],0)}٪.`});
 if(d.ammonia!=null&&d.ammonia>=20)events.push({s:'bad',t:'آمونیاک بالا',x:`${fmt(d.ammonia,1)} ppm؛ از آستانه اقدام عبور کرده است.`});else if(d.ammonia!=null&&d.ammonia>=10)events.push({s:'warn',t:'آمونیاک نیازمند توجه',x:`${fmt(d.ammonia,1)} ppm.`});
 if(d.co2!=null&&d.co2>=5000)events.push({s:'bad',t:'CO₂ بالا',x:`${fmt(d.co2,0)} ppm.`});else if(d.co2!=null&&d.co2>=3000)events.push({s:'warn',t:'CO₂ نیازمند توجه',x:`${fmt(d.co2,0)} ppm.`});
 if(d.age===1){
   const cf=[['۲ ساعت',d.crop2,75],['۴ ساعت',d.crop4,80],['۸ ساعت',d.crop8,80],['۱۲ ساعت',d.crop12,85],['۲۴ ساعت',d.crop24,95]];
   cf.forEach(q=>{if(q[1]!=null&&q[1]<q[2])events.push({s:'warn',t:`Crop Fill ${q[0]} پایین از هدف`,x:`${fmt(q[1],0)}٪ در برابر حداقل ${fmt(q[2],0)}٪.`});});
   if(d.vent!=null&&d.vent<39.4||d.vent>40.5)events.push({s:'warn',t:'دمای ونت خارج از مرجع',x:`${fmt(d.vent,1)}°C؛ مرجع روزهای ۱–۲ برابر ۳۹٫۴ تا ۴۰٫۵°C است و باید همراه رفتار جوجه تفسیر شود.`});
 }
 return events;
}

function dataQuality(d){
 const missing=[];[['وزن',d.bw],['دان',d.feed],['آب',d.water],['تلفات',d.mort],['دما',d.temp],['RH',d.rh]].forEach(x=>{if(x[1]==null)missing.push(x[0]);});
 const notes=[];if(d.bw==null)notes.push('وزن این روز ثبت نشده یا صفر/نامعتبر بوده و در تحلیل روند وزن وارد نشده است.');if(d.doa>0&&d.age>1)notes.push('DOA فقط باید در روز اول از جمعیت کم شود؛ تکرار آن در روزهای بعد نباید دوباره کسر شود.');
 return {missing,notes};
}

function render(m,age){
 const days=(m.days||[]).filter(d=>d.age>=1&&d.age<=7).sort((a,b)=>a.age-b.age);if(!days.length)return `<div class="f7v2 empty">برای این گله هنوز داده‌ای از پایش روزانه روزهای ۱ تا ۷ ثبت نشده است.</div>`;
 const d=days.find(x=>x.age===age)||days[0];const i=days.indexOf(d),prev=i>0?days[i-1]:null;const bands=standardStatus(d,m);const ws=weightState(d);const events=dailyEvents(d,prev,m);const q=dataQuality(d);
 const tempS=bandState(d.temp,bands.tempBand),rhS=bandState(d.rh,bands.rhBand);
 const ratioS=d.ratio==null?['neutral','بدون داده']:d.ratio>=bands.ratioBand.min&&d.ratio<=bands.ratioBand.max?['good','داخل محدوده']:['warn','خارج از محدوده'];
 const hasPrev=!!prev;
 let h=`<div class="f7v2"><div class="f7v2-head"><div><div class="eyebrow">گزارش تشخیصی پایش روزانه گوشتی</div><h2>روز ${fmt(d.age,0)} — وضعیت و روند گله</h2><p class="sub">${esc(m.strainKey||'سویه نامشخص')} · فقط داده‌های پایش روزانه</p></div><div class="badge">${d.age===7?'ورود به گزارش هفتگی پس از این مرحله':'روز '+fmt(d.age,0)+' از ۷'}</div></div>`;
 h+=`<div class="day-nav">${Array.from({length:7},(_,n)=>{const x=days.find(z=>z.age===n+1),active=x&&x.age===d.age,cls=active?'active':(!x?'missing':'');return `<button class="day-btn ${cls}" data-f7-age="${n+1}" ${x?'':'disabled'}><strong>روز ${n+1}</strong><small>${x?(x.dev==null?'بدون وزن':x.dev>=0?'بالای مرجع':`${fmt(Math.abs(x.dev),0)}٪ زیر مرجع`):'ثبت نشده'}</small></button>`}).join('')}</div>`;
 h+=`<section class="section"><div class="section-title"><h3>خلاصه روز ${d.age}</h3><span class="status ${statusClass(ws[0])}">${statusText(ws[0])}</span></div><div class="grid">`;
 h+=metric('وزن',d.bw!=null?fmt(d.bw,1)+' گرم':'ثبت نشده',d.target!=null?`مرجع ${fmt(d.target,1)} گرم · ${signedPct(d.dev,1)}`:'مرجع معتبر ندارد',statusClass(ws[0]));
 h+=metric('دان / پرنده',d.feedPerBird!=null?fmt(d.feedPerBird,2)+' گرم':'—','محاسبه بر اساس جمعیت زنده ابتدای روز');
 h+=metric('آب / پرنده',d.waterPerBird!=null?fmt(d.waterPerBird,2)+' میلی‌لیتر':'—','محاسبه بر اساس جمعیت زنده ابتدای روز');
 h+=metric('آب : دان',d.ratio!=null?fmt(d.ratio,2)+' L/kg':'—',bands.ratioBand?`محدوده عملیاتی ${bands.ratioBand.min}–${bands.ratioBand.max}`:'بدون مرجع',statusClass(ratioS[0]));
 h+=metric('تلفات روز',fmt(d.mort,0)+' قطعه',d.mortPct!=null?`نرخ روز ${pct(d.mortPct,2)}`:'');
 h+=metric('تلفات تجمعی',pct(d.cumMortPct,2),`${fmt(d.cumMort,0)} قطعه`,d.cumMortPct>=1?'bad':d.cumMortPct>=.75?'warn':'good');
 h+=metric('زنده‌مانی',d.live!=null?fmt(d.live,0)+' قطعه':'—',d.live!=null&&m.initial?pct(d.live/m.initial*100,2):'');
 h+=metric('دمای سالن',d.temp!=null?fmt(d.temp,1)+' °C':'—',bands.tempBand?`مرجع ${fmt(bands.tempBand[0],1)}–${fmt(bands.tempBand[1],1)}°C`:'' ,statusClass(tempS[0]));
 h+=metric('RH',d.rh!=null?fmt(d.rh,1)+'٪':'—',bands.rhBand?`مرجع ${fmt(bands.rhBand[0],0)}–${fmt(bands.rhBand[1],0)}٪`:'',statusClass(rhS[0]));
 h+=metric('آمونیاک',d.ammonia!=null?fmt(d.ammonia,1)+' ppm':'—',d.ammonia>=20?'آستانه بحرانی':d.ammonia>=10?'آستانه اقدام':'');
 h+=metric('CO₂',d.co2!=null?fmt(d.co2,0)+' ppm':'—',d.co2>=5000?'بحرانی':d.co2>=3000?'آستانه اقدام':'');
 if(d.age<=2)h+=metric('دمای ونت',d.vent!=null?fmt(d.vent,1)+' °C':'ثبت نشده','مرجع ۳۹٫۴–۴۰٫۵°C',d.vent==null?'neutral':d.vent>=39.4&&d.vent<=40.5?'good':'warn');
 if(d.age===1&&d.crop24!=null)h+=metric('Crop Fill در ۲۴ساعت',fmt(d.crop24,0)+'٪','هدف حداقل ۹۵٪',d.crop24>=95?'good':'warn');
 h+=`</div></section>`;

 h+=`<section class="section"><div class="section-title"><h3>${hasPrev?'مقایسه روز '+d.age+' با روز '+prev.age:'خط پایه روز ۱'}</h3><span class="muted">${hasPrev?'روند + فاصله از مرجع':'هنوز روز قبل وجود ندارد'}</span></div>`;
 if(!hasPrev){h+=`<div class="event"><strong>روز اول، روز مبناست.</strong>در این روز وضعیت وزن، شروع مصرف آب و دان، محیط، Crop Fill، تلفات و کیفیت داده ثبت می‌شود. قضاوت روندی از روز دوم آغاز می‌شود.</div>`}
 else {h+=`<div class="compare"><div class="compare-card"><b>تغییر نسبت به روز قبل</b>`;
 [['وزن',change(prev.bw,d.bw),'%'],['دان',change(prev.feed,d.feed),'%'],['آب',change(prev.water,d.water),'%'],['آب:دان',change(prev.ratio,d.ratio),'%'],['تلفات روز',diff(prev.mort,d.mort),'قطعه']].forEach(r=>{const v=r[1];const positive=r[0]==='تلفات روز'?(v==null?'':v<=0?'trend-up':'trend-down'):(v==null?'':v>=0?'trend-up':'trend-down');h+=`<div class="compare-row"><span>${r[0]}</span><b class="${positive}">${v==null?'—':(r[2]==='%'?signedPct(v,1):((v>=0?'+':'')+fmt(v,0)+' قطعه'))}</b></div>`});h+=`</div><div class="compare-card"><b>فاصله از مرجع امروز</b>`;
 [['وزن',d.dev,'%'],['دما',d.temp!=null?(tempS[0]==='good'?0:-1):null,''],['RH',d.rh!=null?(rhS[0]==='good'?0:-1):null,''],['آب:دان',d.ratio!=null?(ratioS[0]==='good'?0:-1):null,'']].forEach(r=>{let v=r[1];let label=r[0];let text=label==='وزن'?(v==null?'بدون مرجع':signedPct(v,1)):(v==null?'بدون داده':v===0?'داخل محدوده':'خارج از محدوده');let cls=label==='وزن'?(v==null?'':v>=-5?'trend-up':'trend-down'):v===0?'trend-up':'trend-down';h+=`<div class="compare-row"><span>${label}</span><b class="${cls}">${text}</b></div>`});h+=`</div></div>`;
 const devDelta=diff(prev.dev,d.dev);if(devDelta!=null)h+=`<div class="note">تفسیر وزن: ${devDelta>=2?'فاصله از مرجع در حال کاهش است و روند وزن بهتر شده است.':devDelta<=-2?'فاصله از مرجع در حال افزایش است و روند وزن نسبت به روز قبل نامطلوب‌تر شده است.':'فاصله از مرجع تقریباً پایدار است.'}</div>`;
 }
 h+=`</section>`;

 h+=`<section class="section"><div class="section-title"><h3>امروز چه اتفاقی افتاده؟</h3><span class="muted">تحلیل ترکیبی روز ${d.age}</span></div>`;
 if(events.length)events.forEach(e=>{h+=`<div class="event ${e.s}"><strong>${esc(e.t)}</strong>${esc(e.x)}</div>`});else h+=`<div class="event"><strong>سیگنال غیرعادی مهمی شناسایی نشد.</strong>این به معنی سلامت قطعی نیست؛ فقط یعنی از داده‌های ثبت‌شده این روز، هشدار ترکیبی قابل اتکایی استخراج نشده است.</div>`;
 h+=`</section>`;

 if(d.age===1){h+=`<section class="section"><div class="section-title"><h3>شاخص‌های شروع جوجه</h3><span class="muted">فقط روز اول</span></div><div class="grid">${metric('Crop Fill · ۲ ساعت',d.crop2!=null?fmt(d.crop2,0)+'٪':'—','هدف حداقل ۷۵٪',d.crop2==null?'neutral':d.crop2>=75?'good':'warn')}${metric('Crop Fill · ۴ ساعت',d.crop4!=null?fmt(d.crop4,0)+'٪':'—','هدف حداقل ۸۰٪',d.crop4==null?'neutral':d.crop4>=80?'good':'warn')}${metric('Crop Fill · ۸ ساعت',d.crop8!=null?fmt(d.crop8,0)+'٪':'—','هدف بیش از ۸۰٪',d.crop8==null?'neutral':d.crop8>80?'good':'warn')}${metric('Crop Fill · ۱۲ ساعت',d.crop12!=null?fmt(d.crop12,0)+'٪':'—','هدف بیش از ۸۵٪',d.crop12==null?'neutral':d.crop12>85?'good':'warn')}${metric('Crop Fill · ۲۴ ساعت',d.crop24!=null?fmt(d.crop24,0)+'٪':'—','هدف بیش از ۹۵٪',d.crop24==null?'neutral':d.crop24>95?'good':'warn')}</div><div class="note">مقادیر Crop Fill از مرجع رسمی Aviagen وارد منطق گزارش شده‌اند؛ آستانه‌های بالاتر از ۸۰٪، ۸۵٪ و ۹۵٪ نباید به‌صورت «استاندارد دقیق مساوی» تفسیر شوند.</div></section>`}

 h+=`<section class="section"><div class="section-title"><h3>کیفیت داده روز ${d.age}</h3><span class="muted">کنترل قبل از تصمیم‌گیری</span></div><div class="quality"><div><b>داده‌های اصلی مفقود</b><br>${q.missing.length?q.missing.map(esc).join('، '):'مورد مهمی ثبت نشده است.'}</div><div><b>وزن</b><br>${d.bw==null?'برای تحلیل وزن قابل استفاده نیست.':'قابل استفاده و با مرجع سنی مقایسه شده است.'}</div><div><b>DOA</b><br>${d.age===1?(d.doa>0?`${fmt(d.doa,0)} قطعه در روز اول لحاظ شده است.`:'ثبت نشده/صفر'):'در این روز نباید دوباره از جمعیت کسر شود.'}</div></div>${q.notes.map(x=>`<div class="note">${esc(x)}</div>`).join('')}</section>`;

 h+=`<div class="footer-weekly">${d.age===7?'روز ۷ همچنان در همین موتور تحلیل می‌شود، اما پس از آن مرجع اصلی تفسیر عملکرد وارد گزارش هفتگی می‌شود؛ بنابراین گزارش هفتگی مسئول تحلیل کامل شاخص‌های هفته خواهد بود.':'از روز بعد، همین الگو ادامه پیدا می‌کند: روز فعلی ← روز قبل ← مرجع سنی. هدف این است که دقیقاً مشخص شود در کدام روز روند گله تغییر کرده است.'}</div></div>`;
 return h;
}

async function showDaily(){
 const root=$('root'),selector=$('weeklyWeekSelectorSlot');if(!root)return;if(selector)selector.style.display='none';root.style.display='block';if(busy)return;busy=true;root.innerHTML='<div class="f7v2 empty">در حال ساخت گزارش روزانه…</div>';
 try{
   const e=ENGINE();if(!e||typeof e.load!=='function')throw new Error('موتور گزارش روزانه بارگذاری نشده است.');
   model=sanitize(await e.load());injectStyle();
   const ages=(model.days||[]).map(d=>d.age).filter(a=>a>=1&&a<=7);selectedAge=ages.includes(selectedAge)?selectedAge:(ages[0]||1);
   root.innerHTML=render(model,selectedAge);
   root.onclick=ev=>{const b=ev.target.closest('[data-f7-age]');if(!b||b.disabled)return;selectedAge=Number(b.getAttribute('data-f7-age'));root.innerHTML=render(model,selectedAge);};
 }catch(err){console.error(err);root.innerHTML=`<div class="error">خطا در بارگذاری گزارش روزانه: ${esc(err?.message||err)}</div>`}
 finally{busy=false}
}
function showWeekly(){const root=$('root'),selector=$('weeklyWeekSelectorSlot');if(selector)selector.style.display='';if(root)root.style.display=''}
function bind(){
 const shell=$('weekly-report-subtabs-v1');if(!shell)return setTimeout(bind,100);
 shell.addEventListener('click',e=>{const b=e.target.closest('[data-weekly-subtab]');if(!b)return;b.getAttribute('data-weekly-subtab')==='daily'?showDaily():showWeekly();});
 document.querySelectorAll('.report-tab[data-tab]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{if(b.getAttribute('data-tab')==='weekly'){const d=shell.querySelector('[data-weekly-subtab="daily"]');if(d?.classList.contains('active'))showDaily();}else{if($('root'))$('root').style.display='';}},80)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
window.ADINE_BROILER_FIRST7_REPORT_UI_V1=Object.freeze({showDaily,showWeekly});
})();
