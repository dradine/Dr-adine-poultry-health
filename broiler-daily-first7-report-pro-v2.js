/* ADINE — FIRST 7 DAILY REPORT PRO V2
   Presentation-only module. Uses the existing First-7 engine and existing standards.
   Does not change weekly reports, navigation, flock loading, or calculation engines.
*/
(function(){
'use strict';
if(window.ADINE_BROILER_FIRST7_REPORT_PRO_V2)return;

var $=function(id){return document.getElementById(id)};
var esc=function(v){return String(v==null?'—':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var N=function(v){if(v==null||v==='')return null;var x=Number(String(v).replace(/[۰-۹]/g,function(c){return String(c.charCodeAt(0)-1776)}).replace(/[٬،,]/g,''));return isFinite(x)?x:null};
var F=function(v,d){v=N(v);return v==null?'—':v.toLocaleString('fa-IR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0})};
var P=function(v,d){return N(v)==null?'—':F(v,d)+'٪'};
var delta=function(a,b){a=N(a);b=N(b);return a==null||b==null||a===0?null:(b-a)/Math.abs(a)*100};
var model=null,age=1,busy=false;

function css(){
 if($('f7pro2-css'))return;
 var s=document.createElement('style');s.id='f7pro2-css';
 s.textContent='.f7pro2{direction:rtl}.f7pro2 .p2card{background:#fff;border:1px solid #e5e9e7;border-radius:16px;padding:14px;margin:10px 0;box-shadow:0 3px 14px rgba(20,40,30,.035)}'+
 '.f7pro2 .p2head{display:flex;justify-content:space-between;align-items:center;gap:10px}.f7pro2 h2{font-size:20px;margin:3px 0}.f7pro2 h3{font-size:14px;margin:0}.f7pro2 .muted{font-size:10px;opacity:.6}'+
 '.f7pro2 .p2days{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:12px}.f7pro2 .p2day{border:1px solid #e1e6e3;background:#fafbfa;border-radius:10px;padding:8px 2px;font:inherit;cursor:pointer}.f7pro2 .p2day.active{background:#16865b;color:white;border-color:#16865b}.f7pro2 .p2day.missing{opacity:.4}.f7pro2 .p2day strong,.f7pro2 .p2day small{display:block}.f7pro2 .p2day small{font-size:9px;margin-top:3px;opacity:.7}'+
 '.f7pro2 .p2grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.f7pro2 .p2metric{border:1px solid #e5e9e7;border-radius:11px;padding:9px;min-height:72px;background:#fbfcfb}.f7pro2 .p2metric small,.f7pro2 .p2metric span{display:block;font-size:9px;opacity:.62}.f7pro2 .p2metric strong{display:block;font-size:16px;margin:5px 0}.f7pro2 .good{background:#eff9f4!important;border-color:#86cdb0!important}.f7pro2 .warn{background:#fff8e8!important;border-color:#e3b75e!important}.f7pro2 .bad{background:#fff0f0!important;border-color:#dc8585!important}'+
 '.f7pro2 .p2title{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.f7pro2 .p2charts{display:grid;grid-template-columns:1fr 1fr;gap:10px}.f7pro2 .p2chart{border:1px solid #e5e9e7;border-radius:13px;padding:9px}.f7pro2 svg{width:100%;height:175px;display:block}.f7pro2 .axis{stroke:#dfe5e1;stroke-width:1}.f7pro2 .pline{fill:none;stroke:#16865b;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}.f7pro2 .pref{fill:none;stroke:#9ca7a1;stroke-width:1.5;stroke-dasharray:5 5}.f7pro2 .pt{fill:#16865b}.f7pro2 .ptw{fill:#d39a2e;animation:p2pulse 1.8s infinite}.f7pro2 .ptb{fill:#c64d4d;animation:p2pulse 1.5s infinite}.f7pro2 .ring{fill:none;stroke:#c64d4d;stroke-width:2;animation:p2ring 1.5s infinite}.f7pro2 .chartname{font-size:11px;font-weight:700;margin-bottom:5px}.f7pro2 .compare{display:grid;grid-template-columns:1fr 1fr;gap:8px}.f7pro2 .compare>div{background:#f7f9f8;border-radius:11px;padding:9px}.f7pro2 .row{display:flex;justify-content:space-between;border-bottom:1px dashed #dfe4e1;padding:7px 0;font-size:11px}.f7pro2 .row:last-child{border-bottom:0}'+
 '.f7pro2 .p2score{display:flex;align-items:center;gap:15px}.f7pro2 .ringScore{width:80px;height:80px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#16865b var(--v),#e8edea 0);position:relative;flex:none}.f7pro2 .ringScore:after{content:"";position:absolute;inset:7px;background:#fff;border-radius:50%}.f7pro2 .scoreNum{position:relative;z-index:1;font-size:20px;font-weight:800}.f7pro2 .p2alert{display:flex;align-items:center;gap:8px;border-radius:10px;padding:9px;margin:6px 0;font-size:10px;background:#fff8e8;border:1px solid #e4c16f}.f7pro2 .p2alert.bad{background:#fff1f1;border-color:#dda0a0}.f7pro2 .dot{width:8px;height:8px;border-radius:50%;background:#d39a2e;animation:p2dot 1.3s infinite;flex:none}.f7pro2 .p2alert.bad .dot{background:#c64d4d}.f7pro2 .note{font-size:10px;line-height:1.9;opacity:.68}@keyframes p2pulse{50%{r:6;opacity:.5}}@keyframes p2ring{to{r:13;opacity:0}}@keyframes p2dot{50%{transform:scale(1.8);opacity:.4}}'+
 '@media(max-width:760px){.f7pro2 .p2grid{grid-template-columns:repeat(2,1fr)}.f7pro2 .p2charts{grid-template-columns:1fr}.f7pro2 .compare{grid-template-columns:1fr}}';
 document.head.appendChild(s);
}
function metric(l,v,r,c){return '<div class="p2metric '+(c||'')+'"><small>'+esc(l)+'</small><strong>'+v+'</strong><span>'+esc(r||'')+'</span></div>'}
function score(m,d){
 var a=[],add=function(x,w,ok){if(x!=null)a.push([w,ok])};
 if(d.dev!=null)add(25,25,Math.abs(d.dev)<=5?25:Math.abs(d.dev)<=10?18:Math.abs(d.dev)<=15?10:4);
 if(d.mortPct!=null)add(15,15,d.mortPct<.5?15:d.mortPct<1?9:3);
 if(d.ammonia!=null)add(10,10,d.ammonia<10?10:d.ammonia<20?5:0);
 if(d.co2!=null)add(10,10,d.co2<3000?10:d.co2<5000?5:0);
 var b=m.std&&m.std.common&&m.std.common.broodingTemperatureC&&m.std.common.broodingTemperatureC.default?m.std.common.broodingTemperatureC.default[d.age]:null;
 if(d.temp!=null&&b)add(10,10,d.temp>=b[0]&&d.temp<=b[1]?10:5);
 b=m.std&&m.std.common&&m.std.common.humidity&&m.std.common.humidity.default?m.std.common.humidity.default[d.age]:null;
 if(d.rh!=null&&b)add(10,10,d.rh>=b[0]&&d.rh<=b[1]?10:5);
 var r=m.std&&m.std.waterFeedRatio;
 if(d.ratio!=null&&r&&r.min!=null&&r.max!=null)add(10,10,d.ratio>=r.min&&d.ratio<=r.max?10:5);
 if(d.age<=2&&d.vent!=null)add(5,5,d.vent>=39.4&&d.vent<=40.5?5:2);
 var max=a.reduce(function(s,x){return s+x[1]},0),got=a.reduce(function(s,x){return s+x[2]},0);
 return max?Math.round(got/max*100):null;
}
function severity(d){
 if((d.dev!=null&&d.dev<=-10)||(d.ammonia!=null&&d.ammonia>=20)||(d.co2!=null&&d.co2>=5000)||(d.cumMortPct!=null&&d.cumMortPct>=1))return'bad';
 if((d.dev!=null&&d.dev<=-5)||(d.ammonia!=null&&d.ammonia>=10)||(d.co2!=null&&d.co2>=3000)||(d.cumMortPct!=null&&d.cumMortPct>=.75))return'warn';
 return'';
}
function chart(rows,key,refKey,name,unit){
 var vals=rows.map(function(d){return N(d[key])}).filter(function(v){return v!=null});if(!vals.length)return '<div class="note">داده کافی برای رسم این نمودار وجود ندارد.</div>';
 var refs=refKey?rows.map(function(d){return N(d[refKey])}).filter(function(v){return v!=null}):[],all=vals.concat(refs),mn=Math.min.apply(null,all),mx=Math.max.apply(null,all);if(mn===mx){mn--;mx++}var pad=(mx-mn)*.15;mn-=pad;mx+=pad;
 var W=600,H=175,L=35,R=10,T=10,B=25,iw=W-L-R,ih=H-T-B,x=function(i){return L+i/Math.max(rows.length-1,1)*iw},y=function(v){return T+(mx-v)/(mx-mn)*ih};
 var path='',rpath='';rows.forEach(function(d,i){var v=N(d[key]);if(v!=null)path+=(path?'L':'M')+' '+x(i)+' '+y(v)+' ';if(refKey){var q=N(d[refKey]);if(q!=null)rpath+=(rpath?'L':'M')+' '+x(i)+' '+y(q)+' '}});
 var pts='';rows.forEach(function(d,i){var v=N(d[key]);if(v==null)return;var s=severity(d),cl=s==='bad'?'ptb':s==='warn'?'ptw':'pt';var label='روز '+d.age+' · '+name+': '+F(v, key==='bw'?1:key==='cumMortPct'?2:2)+(unit?' '+unit:'');pts+='<g data-chart-point="1" data-tip="'+esc(label)+'"><title>'+esc(label)+'</title><circle cx="'+x(i)+'" cy="'+y(v)+'" r="4" class="'+cl+'"/><circle cx="'+x(i)+'" cy="'+y(v)+'" r="11" class="chart-hit"/></g>';if(s==='bad')pts+='<circle cx="'+x(i)+'" cy="'+y(v)+'" r="5" class="ring"/>'});
 var labs=rows.map(function(d,i){return '<text x="'+x(i)+'" y="'+(H-6)+'" text-anchor="middle" font-size="9" fill="#68736d">روز '+d.age+'</text>'}).join('');
 return '<div class="chartname">'+esc(name)+' <span class="muted">'+esc(unit||'')+'</span></div><div class="chart-tooltip"></div><svg viewBox="0 0 '+W+' '+H+'"><line class="axis" x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(H-B)+'"/><line class="axis" x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-R)+'" y2="'+(H-B)+'"/>'+(rpath?'<path class="pref" d="'+rpath+'"/>':'')+'<path class="pline" d="'+path+'"/>'+pts+labs+'</svg>';
}
function alerts(d,prev){
 var a=[];
 if(d.dev!=null&&d.dev<=-10)a.push(['bad','وزن','فاصله وزن از مرجع به محدوده جدی رسیده است.']);
 else if(d.dev!=null&&d.dev<=-5)a.push(['warn','وزن','وزن پایین‌تر از مرجع همان روز ثبت شده است.']);
 if(prev){var fd=delta(prev.feed,d.feed),wd=delta(prev.water,d.water);if(fd!=null&&fd<=-15)a.push([fd<=-30?'bad':'warn','دان','کاهش '+F(Math.abs(fd),0)+'٪ نسبت به روز قبل.']);if(wd!=null&&wd<=-15)a.push([wd<=-30?'bad':'warn','آب','کاهش '+F(Math.abs(wd),0)+'٪ نسبت به روز قبل.']);if(fd!=null&&wd!=null&&fd<=-15&&wd<=-15)a.push(['bad','آب و دان','افت همزمان؛ دسترسی آب/دان، محیط و سلامت بررسی شود.'])}
 if(d.ammonia!=null&&d.ammonia>=10)a.push([d.ammonia>=20?'bad':'warn','آمونیاک',F(d.ammonia,1)+' ppm.']);
 if(d.co2!=null&&d.co2>=3000)a.push([d.co2>=5000?'bad':'warn','CO₂',F(d.co2,0)+' ppm.']);
 if(d.cumMortPct!=null&&d.cumMortPct>=.75)a.push([d.cumMortPct>=1?'bad':'warn','تلفات تجمعی',P(d.cumMortPct,2)+' تا روز '+d.age+'.']);
 return a;
}
function render(){
 var root=$('root');if(!root||!model)return;var rows=model.days.filter(function(d){return d.age<=age}),d=rows[rows.length-1],prev=rows.length>1?rows[rows.length-2]:null;if(!d)return;
 var sc=score(model,d),al=alerts(d,prev),h='<div class="f7pro2">';
 h+='<div class="p2card"><div class="p2head"><div><div class="muted">گزارش مستقل پایش روزانه · هفت روز اول</div><h2>تحلیل روز '+d.age+'</h2><div class="muted">'+esc(model.strainKey||'سویه')+' · منبع: پایش روزانه گله</div></div><div class="muted">تا روز '+d.age+'</div></div><div class="p2days">';
 [1,2,3,4,5,6,7].forEach(function(x){var q=model.days.find(function(z){return z.age===x});h+='<button class="p2day '+(x===d.age?'active ':'')+(!q?'missing':'')+'" data-p2age="'+x+'"><strong>روز '+x+'</strong><small>'+(q?(q.bw==null?'بدون وزن':F(q.bw,0)+' g'):'بدون داده')+'</small></button>'});h+='</div></div>';
 h+='<div class="p2card"><div class="p2title"><h3>امتیاز پایش روز '+d.age+'</h3><span class="muted">تحلیلی · غیررسمی</span></div><div class="p2score"><div class="ringScore" style="--v:'+(sc==null?0:sc)+'%"><div class="scoreNum">'+(sc==null?'—':F(sc,0))+'</div></div><div class="note"><b>'+(sc==null?'داده کافی نیست':sc>=90?'وضعیت پایدار':sc>=75?'نیازمند پایش':'نیازمند بررسی')+'</b><br/>'+(!al.length?'سیگنال هشدار قابل توجهی از داده‌های موجود ثبت نشده است.':'در این روز '+al.length+' سیگنال تحلیلی فعال است.')+'<br/>امتیاز از شاخص‌هایی ساخته می‌شود که داده و مرجع/آستانه موجود دارند؛ داده غایب جریمه نمی‌شود.</div></div></div>';
 h+='<div class="p2card"><div class="p2title"><h3>وضعیت روز '+d.age+'</h3><span class="muted">استانداردهای موجود همان سیستم</span></div><div class="p2grid">';
 h+=metric('وزن',F(d.bw,1)+' گرم',d.target!=null?'مرجع: '+F(d.target,1)+' گرم':'مرجع ندارد',d.dev==null?'':Math.abs(d.dev)<=5?'good':Math.abs(d.dev)<=10?'warn':'bad');
 h+=metric('انحراف وزن',P(d.dev,1),'فاصله از مرجع همان روز',d.dev==null?'':Math.abs(d.dev)<=5?'good':Math.abs(d.dev)<=10?'warn':'bad');
 h+=metric('افزایش وزن',d.gain==null?'—':(d.gain>=0?'+':'')+F(d.gain,1)+' گرم',d.growthPct==null?'':(d.growthPct>=0?'+':'')+F(d.growthPct,1)+'٪ نسبت به روز قبل');
 h+=metric('دان / پرنده',d.feedPerBird==null?'—':F(d.feedPerBird,2)+' گرم','بر اساس جمعیت زنده ابتدای روز');
 h+=metric('آب / پرنده',d.waterPerBird==null?'—':F(d.waterPerBird,2)+' ml','بر اساس جمعیت زنده ابتدای روز');
 h+=metric('آب : دان',d.ratio==null?'—':F(d.ratio,2)+' L/kg','مرجع مدیریتی موجود');
 h+=metric('تلفات روز',F(d.mort,0)+' قطعه','تجمعی: '+P(d.cumMortPct,2),d.mort>0?'warn':'good');h+=metric('دمای ونت',d.vent==null?'—':F(d.vent,1)+' °C','روز ۱–۲: ۳۹٫۴–۴۰٫۵°C',d.vent==null?'':d.vent>=39.4&&d.vent<=40.5?'good':'warn');
 h+=metric('زنده‌مانی',d.live==null?'—':F(d.live,0)+' قطعه','');
 h+=metric('دما',d.temp==null?'—':F(d.temp,1)+' °C',d.minTemp!=null&&d.maxTemp!=null?'حداقل '+F(d.minTemp,1)+' · حداکثر '+F(d.maxTemp,1):'حداقل/حداکثر ثبت نشده');
 h+=metric('RH',d.rh==null?'—':F(d.rh,1)+'٪','رطوبت نسبی');
 h+=metric('دمای بستر',d.litterTemp==null?'—':F(d.litterTemp,1)+' °C','');
 h+=metric('شدت نور',d.light==null?'—':F(d.light,0)+' lux','');
 h+=metric('آمونیاک',d.ammonia==null?'—':F(d.ammonia,1)+' ppm','آستانه اقدام: ۱۰ ppm',d.ammonia==null?'':d.ammonia<10?'good':d.ammonia<20?'warn':'bad');
 h+=metric('CO₂',d.co2==null?'—':F(d.co2,0)+' ppm','آستانه اقدام: ۳۰۰۰ ppm',d.co2==null?'':d.co2<3000?'good':d.co2<5000?'warn':'bad');
 h+=metric('کیفیت هوا',d.air||'ثبت نشده','','');h+=metric('کیفیت بستر',d.litter||'ثبت نشده','','');
 h+=metric('نمونه وزن',d.bodySample==null?'—':F(d.bodySample,0)+' قطعه','','');
 h+=metric('Crop Fill 24h',d.crop24==null?'—':P(d.crop24,1),'هدف ثبت‌شده ۹۵٪',d.crop24==null?'':d.crop24>=95?'good':'warn');
 h+='</div></div>';
 if(prev){h+='<div class="p2card"><div class="p2title"><h3>مقایسه روز '+d.age+' با روز '+prev.age+'</h3><span class="muted">تغییر واقعی و درصدی</span></div><div class="compare"><div>';
 [['وزن',delta(prev.bw,d.bw),d.gain],['دان',delta(prev.feed,d.feed),null],['آب',delta(prev.water,d.water),null],['آب:دان',delta(prev.ratio,d.ratio),null]].forEach(function(x){h+='<div class="row"><span>'+x[0]+'</span><b>'+(x[2]!=null?(x[2]>=0?'+':'')+F(x[2],1)+' g · ':'')+(x[1]==null?'—':(x[1]>=0?'+':'')+F(x[1],1)+'٪')+'</b></div>'});
 h+='</div><div><div class="row"><span>فاصله از مرجع</span><b>'+(prev.dev!=null&&d.dev!=null?(d.dev-prev.dev>=0?'+':'')+F(d.dev-prev.dev,1)+' واحد٪':'—')+'</b></div><div class="row"><span>تلفات روز</span><b>'+F(d.mort,0)+'</b></div><div class="row"><span>تلفات تجمعی</span><b>'+P(d.cumMortPct,2)+'</b></div><div class="row"><span>زنده‌مانی</span><b>'+(prev.live!=null&&d.live!=null?F(d.live-prev.live,0):'—')+'</b></div></div></div></div>'}
 else h+='<div class="p2card"><h3>روز ۱ — خط پایه</h3><p class="note">روز اول مبنای مقایسه است. از روز دوم، تغییر نسبت به روز قبل و فاصله از مرجع همان سن همزمان بررسی می‌شوند.</p></div>';
 h+='<div class="p2card"><div class="p2title"><h3>روندها تا روز '+d.age+'</h3><span class="muted">فقط روزهای ۱ تا '+d.age+'</span></div><div class="p2charts">';
 h+='<div class="p2chart">'+chart(rows,'bw','target','وزن واقعی و مرجع','g')+'</div>';
 h+='<div class="p2chart">'+chart(rows,'feedPerBird',null,'دان سرانه','g')+'</div>';
 h+='<div class="p2chart">'+chart(rows,'waterPerBird',null,'آب سرانه','ml')+'</div>';
 h+='<div class="p2chart">'+chart(rows,'cumMortPct',null,'تلفات تجمعی','٪')+'</div>';
 h+='</div><p class="note">نقطه قرمز ضربان‌دار = هشدار فعال برای همان روز؛ نقطه زرد = نیازمند پایش. نمودارها همیشه فقط تا روز انتخاب‌شده رسم می‌شوند.</p></div>';
 if(d.age===1){h+='<div class="p2card"><div class="p2title"><h3>پایش شروع گله</h3><span class="muted">فقط روز اول</span></div><div class="p2grid">';
 h+=metric('دمای ونت',d.vent==null?'—':F(d.vent,1)+' °C','روز ۱–۲: ۳۹٫۴–۴۰٫۵°C');
 h+=metric('Crop Fill 2h',d.crop2==null?'—':P(d.crop2,1),'هدف ۷۵٪');h+=metric('Crop Fill 4h',d.crop4==null?'—':P(d.crop4,1),'هدف ۸۰٪');h+=metric('Crop Fill 8h',d.crop8==null?'—':P(d.crop8,1),'هدف >۸۰٪');h+=metric('Crop Fill 12h',d.crop12==null?'—':P(d.crop12,1),'هدف >۸۵٪');h+=metric('Crop Fill 24h',d.crop24==null?'—':P(d.crop24,1),'هدف >۹۵٪');h+='</div></div>';}
 h+='<div class="p2card"><div class="p2title"><h3>اتفاقات و تفسیر روز '+d.age+'</h3><span class="muted">'+al.length+' سیگنال</span></div>';
 if(al.length)al.forEach(function(a){h+='<div class="p2alert '+a[0]+'"><i class="dot"></i><b>'+esc(a[1])+'</b><span>'+esc(a[2])+'</span></div>'});else h+='<p class="note">بر اساس داده‌های موجود، سیگنال قابل توجهی برای این روز شناسایی نشد.</p>';
 h+='</div><div class="p2card"><div class="note">این لایه فقط گزارش روزانه هفت روز اول را نمایش می‌دهد. منبع داده، موتور محاسبات و استانداردها همان منابع موجود پروژه هستند؛ هیچ استاندارد رسمی یا مدیریتی جدیدی در این UI تعریف نشده است.</div></div></div>';
 root.innerHTML=h;root.querySelectorAll('[data-p2age]').forEach(function(b){b.onclick=function(){age=Number(b.getAttribute('data-p2age'));render()}});root.querySelectorAll('.p2chart').forEach(function(box){var tip=box.querySelector('.chart-tooltip');box.querySelectorAll('[data-chart-point]').forEach(function(pt){var show=function(ev){if(!tip)return;tip.textContent=pt.getAttribute('data-tip')||'';tip.style.display='block';var r=box.getBoundingClientRect(),xv=ev.clientX-r.left+8,yv=ev.clientY-r.top+8;tip.style.left=Math.max(6,Math.min(xv,r.width-170))+'px';tip.style.top=Math.max(6,Math.min(yv,145))+'px'};pt.addEventListener('mouseenter',show);pt.addEventListener('mousemove',show);pt.addEventListener('mouseleave',function(){if(tip)tip.style.display='none'});pt.addEventListener('click',show)})});
}
async function show(){
 if(busy)return;var root=$('root');if(!root)return;busy=true;
 try{var e=window.ADINE_BROILER_FIRST7_REPORT_ENGINE_V1;if(!e)throw new Error('موتور پایش روزانه بارگذاری نشده است.');model=await e.load();age=model.days&&model.days.length?model.days[0].age:1;css();render()}
 catch(err){console.error(err);root.innerHTML='<div class="error">خطا در بارگذاری گزارش روزانه: '+esc(err&&err.message?err.message:err)+'</div>'}
 finally{busy=false}
}
window.ADINE_BROILER_FIRST7_REPORT_PRO_V2=Object.freeze({show:show});
})();