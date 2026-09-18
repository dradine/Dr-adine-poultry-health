/* ADINE — FIRST 7 DAILY REPORT PRO V2
   Presentation-only module. Uses the existing First-7 engine and existing standards.
   Does not change weekly reports, navigation, flock loading, or calculation engines.
*/
(function(){
'use strict';
/* Always refresh this isolated renderer when the loader requests a new cache-busted version. */

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
 s.textContent='.f7pro2{direction:rtl;color:#17241f}.f7pro2 .p2card{background:linear-gradient(145deg,#ffffff 0%,#f5f8f6 100%);border:1px solid #d7e1db;border-radius:18px;padding:14px;margin:11px 0;box-shadow:0 7px 22px rgba(20,55,40,.08);overflow:hidden}.f7pro2 .p2card:first-child{background:linear-gradient(135deg,#103f32 0%,#176b50 58%,#218765 100%);color:#fff;border-color:#176b50}.f7pro2 .p2card:first-child .muted{color:#d9eee6;opacity:.9}.f7pro2 .p2head{display:flex;justify-content:space-between;align-items:center;gap:10px}.f7pro2 h2{font-size:21px;margin:3px 0;font-weight:850}.f7pro2 h3{font-size:14px;margin:0;font-weight:800}.f7pro2 .muted{font-size:10px;opacity:.68}.f7pro2 .p2days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:13px}.f7pro2 .p2day{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.12);color:#fff;border-radius:11px;padding:9px 2px;font:inherit;cursor:pointer;transition:.18s;backdrop-filter:blur(5px)}.f7pro2 .p2day:hover{background:rgba(255,255,255,.2);transform:translateY(-1px)}.f7pro2 .p2day.active{background:#fff;color:#126046;border-color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.14)}.f7pro2 .p2day.missing{opacity:.42}.f7pro2 .p2day strong,.f7pro2 .p2day small{display:block}.f7pro2 .p2day small{font-size:9px;margin-top:3px;opacity:.72}.f7pro2 .p2grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.f7pro2 .p2metric{border:1px solid #dce5df;border-radius:13px;padding:10px;min-height:76px;background:linear-gradient(145deg,#f8fbf9,#edf3ef);box-shadow:inset 0 1px 0 rgba(255,255,255,.9);transition:.18s}.f7pro2 .p2metric:hover{transform:translateY(-1px);box-shadow:0 5px 14px rgba(24,71,52,.09)}.f7pro2 .p2metric small,.f7pro2 .p2metric span{display:block;font-size:9px;opacity:.68}.f7pro2 .p2metric strong{display:block;font-size:16px;margin:5px 0;font-weight:850}.f7pro2 .good{background:linear-gradient(145deg,#e7f8ef,#ccefe0)!important;border-color:#62b993!important;color:#0e5d43}.f7pro2 .compareFocus.good{background:linear-gradient(135deg,#0e6249,#15956a)!important;border-color:#69d0a4!important;color:#fff}.f7pro2 .compareFocus.warn{background:linear-gradient(135deg,#9a6a00,#d6a52d)!important;border-color:#f0ca67!important;color:#fff}.f7pro2 .compareFocus.caution{background:linear-gradient(135deg,#a95512,#df914d)!important;border-color:#f4bb84!important;color:#fff}.f7pro2 .compareFocus.bad{background:linear-gradient(135deg,#9b2929,#d96b6b)!important;border-color:#ef9b9b!important;color:#fff}.f7pro2 .warn{background:linear-gradient(145deg,#fff6d9,#ffe9a6)!important;border-color:#d6a52d!important;color:#735300}.f7pro2 .caution{background:linear-gradient(145deg,#fff0dc,#ffd5ad)!important;border-color:#df914d!important;color:#864615}.f7pro2 .bad{background:linear-gradient(145deg,#ffe7e7,#ffcaca)!important;border-color:#d96b6b!important;color:#8b2525}.f7pro2 .p2title{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #dce5df}.f7pro2 .p2chart{position:relative}.f7pro2 .chart-tooltip{position:absolute;z-index:5;display:none;pointer-events:none;min-width:145px;max-width:220px;padding:8px 10px;border-radius:10px;background:#16231e;color:#fff;font-size:10px;line-height:1.8;box-shadow:0 6px 20px rgba(0,0,0,.16)}.f7pro2 .chart-hit{fill:transparent;cursor:pointer}.f7pro2 .p2charts{display:grid;grid-template-columns:1fr 1fr;gap:10px}.f7pro2 .p2chart{border:1px solid #d6e1da;border-radius:14px;padding:10px;background:linear-gradient(145deg,#f9fbfa,#eef4f0);box-shadow:0 3px 12px rgba(20,55,40,.045)}.f7pro2 svg{width:100%;height:175px;display:block}.f7pro2 .axis{stroke:#cbd8d1;stroke-width:1}.f7pro2 .pline{fill:none;stroke:#0d8a5b;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.f7pro2 .pref{fill:none;stroke:#64746d;stroke-width:1.8;stroke-dasharray:5 5}.f7pro2 .pt{fill:#0d8a5b}.f7pro2 .ptw{fill:#e0a300;animation:p2pulse 1.8s infinite}.f7pro2 .ptb{fill:#d63f3f;animation:p2pulse 1.5s infinite}.f7pro2 .ring{fill:none;stroke:#d63f3f;stroke-width:2;animation:p2ring 1.5s infinite}.f7pro2 .chartname{font-size:11px;font-weight:800;margin-bottom:5px;color:#21352d}.f7pro2 .compare{display:grid;grid-template-columns:1fr 1fr;gap:10px}.f7pro2 .compare>div{background:linear-gradient(145deg,#f7fbf9,#e9f3ee);border:1px solid #cfddd5;border-radius:16px;padding:10px;box-shadow:0 5px 16px rgba(19,72,51,.06)}.f7pro2 .compare>div:first-child{border-top:3px solid #16865b}.f7pro2 .compare>div:last-child{border-top:3px solid #397fa3}.f7pro2 .compareFocus{border:0!important;border-radius:15px!important;padding:13px!important;margin-bottom:10px;background:linear-gradient(135deg,#0e6249,#15956a)!important;color:#fff;box-shadow:0 8px 20px rgba(14,98,73,.2);position:relative;overflow:hidden}.f7pro2 .compareFocus:after{content:"";position:absolute;width:90px;height:90px;border-radius:50%;left:-30px;top:-35px;background:rgba(255,255,255,.1)}.f7pro2 .compareFocus small,.f7pro2 .compareFocus strong,.f7pro2 .compareFocus span{display:block;position:relative;z-index:1}.f7pro2 .compareFocus small{font-size:10px;opacity:.86}.f7pro2 .compareFocus strong{font-size:23px;margin:5px 0;font-weight:900}.f7pro2 .compareFocus span{font-size:9px;opacity:.88}.f7pro2 .compare .row{background:rgba(255,255,255,.62);border:1px solid #d2dfd8;border-radius:10px;padding:8px 9px;margin:5px 0;border-bottom:1px solid #d2dfd8}.f7pro2 .compare .row span{color:#52645b}.f7pro2 .compare .row b{color:#19372b;text-align:left}.f7pro2 .cmpdelta{display:block;font-size:9px;opacity:.72;margin-top:3px;font-weight:650}.f7pro2 .compareEnv{margin-top:11px;background:linear-gradient(135deg,#edf5f2,#e1ece7);border:1px solid #cbdad2;border-radius:16px;padding:11px;box-shadow:0 6px 17px rgba(19,72,51,.055);position:relative}.f7pro2 .compareEnv:before{content:"";display:block;height:4px;width:54px;border-radius:5px;background:linear-gradient(90deg,#397fa3,#7a5bb5);margin-bottom:9px}.f7pro2 .compareEnv .row{background:rgba(255,255,255,.66);border:1px solid #cfddd6;border-radius:10px;padding:8px 9px;margin:5px 0;border-bottom:1px solid #cfddd6}.f7pro2 .compareEnv .row b{text-align:left;color:#243b33}.f7pro2 .p2title{position:relative}.f7pro2 .p2title h3{letter-spacing:-.1px}.f7pro2 .row{display:flex;justify-content:space-between;gap:8px;font-size:11px}.f7pro2 .row:last-child{border-bottom:0}.f7pro2 .p2score{display:flex;align-items:center;gap:15px}.f7pro2 .ringScore{width:82px;height:82px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#0d8a5b var(--v),#dbe8e1 0);position:relative;flex:none;box-shadow:0 4px 15px rgba(13,138,91,.16)}.f7pro2 .ringScore:after{content:"";position:absolute;inset:7px;background:#f7faf8;border-radius:50%}.f7pro2 .scoreNum{position:relative;z-index:1;font-size:20px;font-weight:850}.f7pro2 .p2alert{display:flex;align-items:center;gap:8px;border-radius:11px;padding:10px;margin:6px 0;font-size:10px;background:linear-gradient(135deg,#fff5d8,#ffe9a5);border:1px solid #d6a52d}.f7pro2 .p2alert.bad{background:linear-gradient(135deg,#ffe7e7,#ffcaca);border-color:#d96b6b}.f7pro2 .dot{width:8px;height:8px;border-radius:50%;background:#e0a300;animation:p2dot 1.3s infinite;flex:none}.f7pro2 .p2alert.bad .dot{background:#d63f3f}.f7pro2 .note{font-size:10px;line-height:1.9;opacity:.7}.f7pro2 .p2card:nth-of-type(2){border-top:4px solid #0d8a5b}.f7pro2 .p2card:nth-of-type(3){border-top:4px solid #1478a0}.f7pro2 .p2card:nth-of-type(4){border-top:4px solid #7a5bb5}@keyframes p2pulse{50%{r:6;opacity:.5}}@keyframes p2ring{to{r:13;opacity:0}}@keyframes p2dot{50%{transform:scale(1.8);opacity:.4}}'+
 '@media(max-width:760px){.f7pro2 .p2grid{grid-template-columns:repeat(2,1fr)}.f7pro2 .p2charts{grid-template-columns:1fr}.f7pro2 .compare{grid-template-columns:1fr}.f7pro2 .p2metric strong{font-size:15px}}'; document.head.appendChild(s);
}
function metric(l,v,r,c){return '<div class="p2metric '+(c||'')+'"><small>'+esc(l)+'</small><strong>'+v+'</strong><span>'+esc(r||'')+'</span></div>'}
function clamp01(x){return Math.max(0,Math.min(1,x));}
function scoreBand(v,good,warn,bad,dir){v=N(v);if(v==null)return null;var s;if(dir==='low'){if(v<=good)s=1;else if(v<=warn)s=1-(v-good)/(warn-good)*.35;else if(v<=bad)s=.65-(v-warn)/(bad-warn)*.65;else s=0;}else{if(v>=good)s=1;else if(v>=warn)s=.65+(v-warn)/(good-warn)*.35;else if(v>=bad)s=(v-bad)/(warn-bad)*.65;else s=0;}return clamp01(s);}
function scoreDetails(m,d){
 var prev=m.days.filter(function(x){return x.age<d.age}).slice(-1)[0]||null,parts=[],reasons=[];
 function add(key,label,weight,value,detail){value=N(value);if(value!=null&&isFinite(value))parts.push({key:key,label:label,weight:weight,score:clamp01(value),detail:detail||''});}
 /*
  * IMPORTANT: m.std is the strain-specific object (dayWeightG, chickWeightG, ...),
  * not the complete standards registry. The common daily-management references
  * therefore come from ADINE_BROILER_DAILY_STANDARDS_V1.common.
  * This is the root fix for the previous null-score condition.
  */
 var registry=window.ADINE_BROILER_DAILY_STANDARDS_V1||{};
 var common=registry.common||{};
 var strain=m&&m.std?m.std:{};
 var tempBands=common.broodingTemperatureC&&common.broodingTemperatureC.default;
 var rhBands=common.humidity&&common.humidity.default;
 var ratioRef=common.waterFeedRatio||null;
 var airRef=common.airQuality||{};
 var ventRef=common.chickVentTemperatureC||{min:39.4,max:40.5};
 var tempRHRef=common.broodingTemperatureRH||null;

 add('weight','وزن نسبت به مرجع',20,d.dev==null?null:scoreBand(Math.abs(d.dev),5,10,15,'low'),
   d.dev==null?'مرجع موجود نیست':(d.dev>=0?'بالا ':'پایین ')+F(Math.abs(d.dev),1)+'٪ از مرجع');

 var gain=d.gain!=null?N(d.gain):null;
 if(gain==null&&d.age===1&&m.initW!=null&&d.bw!=null)gain=N(d.bw)-N(m.initW);
 var gainRef=null;
 if(d.target!=null&&strain.dayWeightG){
   if(d.age===1&&strain.chickWeightG!=null)gainRef=N(d.target)-N(strain.chickWeightG);
   else if(d.age>1&&strain.dayWeightG[d.age-1]!=null)gainRef=N(d.target)-N(strain.dayWeightG[d.age-1]);
 }
 var attain=gain!=null&&gainRef!=null&&gainRef>0?gain/gainRef*100:null;
 add('gain','افزایش وزن روزانه',10,attain==null?null:scoreBand(attain,100,85,70,'high'),
   attain==null?'مرجع موجود نیست':'تحقق '+F(attain,0)+'٪ از مرجع');

 add('mort','تلفات تجمعی',10,d.cumMortPct==null?null:scoreBand(d.cumMortPct,.50,.75,1,'low'),
   d.cumMortPct==null?'':F(d.cumMortPct,2)+'٪');
 add('dayMort','تلفات روز',5,d.mortPct==null?null:scoreBand(d.mortPct,.10,.25,.50,'low'),
   d.mortPct==null?'':F(d.mortPct,2)+'٪ از جمعیت ابتدای روز');

 function interpolate(a0,a1,v0,v1,x){return a1===a0?v0:v0+(v1-v0)*(x-a0)/(a1-a0);}
 function rhAdjustedTemperature(ageValue,rhValue){
   if(!tempRHRef||!tempRHRef.temperatureC||!tempRHRef.ageDays||!tempRHRef.humidityPercent)return null;
   var ages=tempRHRef.ageDays.map(Number),rhs=tempRHRef.humidityPercent.map(Number);
   var a=N(ageValue),r=N(rhValue);if(a==null||r==null)return null;
   var minA=ages[0],maxA=ages[ages.length-1],minR=rhs[0],maxR=rhs[rhs.length-1];
   if(a<minA||a>maxA)return null;
   var usedR=Math.max(minR,Math.min(maxR,r));
   var loR=rhs[0],hiR=rhs[rhs.length-1];
   for(var ri=0;ri<rhs.length-1;ri++){if(usedR>=rhs[ri]&&usedR<=rhs[ri+1]){loR=rhs[ri];hiR=rhs[ri+1];break;}}
   function byRH(h){
     var t=tempRHRef.temperatureC[String(h)]||tempRHRef.temperatureC[h];if(!t)return null;
     var loA=ages[0],hiA=ages[ages.length-1];
     for(var ai=0;ai<ages.length-1;ai++){if(a>=ages[ai]&&a<=ages[ai+1]){loA=ages[ai];hiA=ages[ai+1];break;}}
     var v0=N(t[String(loA)]),v1=N(t[String(hiA)]);
     return v0==null||v1==null?null:interpolate(loA,hiA,v0,v1,a);
   }
   var tLo=byRH(loR),tHi=byRH(hiR);if(tLo==null||tHi==null)return null;
   return {target:interpolate(loR,hiR,tLo,tHi,usedR),usedRH:usedR,observedRH:r,clampedRH:r<minR||r>maxR};
 }
 var tempDynamic=rhAdjustedTemperature(d.age,d.rh);
 var tr=tempBands&&tempBands[d.age]!=null?tempBands[d.age]:null;
 var tempScore=null,tempDetail='';
 if(d.temp!=null&&tempDynamic){
   var tempDist=Math.abs(d.temp-tempDynamic.target);
   tempScore=scoreBand(tempDist,0,.8,2,'low');
   tempDetail='مرجع وابسته به RH: '+F(tempDynamic.target,1)+' °C در RH '+F(tempDynamic.usedRH,0)+'٪';
   if(tempDynamic.clampedRH)tempDetail+=' · RH خارج از بازه جدول ۴۰–۷۰٪؛ نزدیک‌ترین نقطه جدول استفاده شد';
 }else if(d.temp!=null&&tr&&tr.length>=2){
   var tempDistFallback=Math.max(tr[0]-d.temp,0,d.temp-tr[1]);
   tempScore=scoreBand(tempDistFallback,0,.8,2,'low');
   tempDetail='مرجع پایه '+F(tr[0],1)+'–'+F(tr[1],1)+' °C · RH ثبت نشده';
 }else if(d.temp!=null){
   tempDetail='مرجع دمای وابسته به RH در دسترس نیست';
 }
 add('temp','دمای سالن',5,tempScore,d.temp==null?'':tempDetail);

 var rh=rhBands&&rhBands[d.age]!=null?rhBands[d.age]:null;
 var rhScore=null;
 if(d.rh!=null&&rh&&rh.length>=2){
   var rhDist=d.rh<rh[0]?rh[0]-d.rh:d.rh>rh[1]?d.rh-rh[1]:0;
   rhScore=scoreBand(rhDist,0,5,10,'low');
 }
 add('rh','رطوبت نسبی',4,rhScore,rh?'محدوده '+F(rh[0],0)+'–'+F(rh[1],0)+'٪':'مرجع مدیریت روزانه موجود نیست');

 var nh3Action=N(airRef.ammoniaAction),nh3Critical=N(airRef.ammoniaCritical);
 add('nh3','آمونیاک',4,d.ammonia==null?null:scoreBand(d.ammonia,nh3Action==null?10:nh3Action,nh3Action==null?15:nh3Action+5,nh3Critical==null?20:nh3Critical,'low'),
   d.ammonia==null?'':F(d.ammonia,1)+' ppm');
 var co2Action=N(airRef.co2Action);
 add('co2','CO₂',4,d.co2==null?null:scoreBand(d.co2,co2Action==null?3000:co2Action,co2Action==null?4000:co2Action+1000,co2Action==null?5000:co2Action+2000,'low'),
   d.co2==null?'':F(d.co2,0)+' ppm');

 /* Litter temperature remains observational here; without a validated
    age/RH/placement-specific target it is not scored against house-air temperature. */


 var rr=ratioRef;
 var ratioScore=null;
 if(d.ratio!=null&&rr){
   var rmin=N(rr.min),rmax=N(rr.max);
   ratioScore=rmin!=null&&rmax!=null&&d.ratio>=rmin&&d.ratio<=rmax?1:
     rmin!=null&&rmax!=null?scoreBand(Math.max(rmin-d.ratio,0,d.ratio-rmax),0,.25,.5,'low'):null;
 }
 add('ratio','آب : دان',7,ratioScore,d.ratio==null?'':F(d.ratio,2)+' L/kg');

 /* Consumption trend is a drop-detection signal, not a "higher is better" score.
    Use per-bird intake rather than total house consumption so mortality/population
    changes do not create a false trend. */
 var fd=prev&&prev.feedPerBird!=null&&d.feedPerBird!=null?delta(prev.feedPerBird,d.feedPerBird):null;
 var wd=prev&&prev.waterPerBird!=null&&d.waterPerBird!=null?delta(prev.waterPerBird,d.waterPerBird):null;
 add('feedTrend','تغییر دان سرانه',4,fd==null?null:(fd>=-10?1:fd>=-20?.75:fd>=-30?.4:0),
   fd==null?'روز مبنا/داده ناکافی':(fd>=0?'+':'')+F(fd,0)+'٪');
 add('waterTrend','تغییر آب سرانه',4,wd==null?null:(wd>=-10?1:wd>=-20?.75:wd>=-30?.4:0),
   wd==null?'روز مبنا/داده ناکافی':(wd>=0?'+':'')+F(wd,0)+'٪');

 if(d.age<=2){
   var vmin=N(ventRef.min)==null?39.4:N(ventRef.min),vmax=N(ventRef.max)==null?40.5:N(ventRef.max);
   var vd=d.vent==null?null:Math.max(vmin-d.vent,0,d.vent-vmax);
   add('vent','دمای ونت',4,d.vent==null?null:scoreBand(vd,0,.5,1.5,'low'),d.vent==null?'':F(d.vent,1)+' °C');
 }
 if(d.age===1){
   var cv=[],ct=[2,4,8,12,24],fallback=[75,80,80,85,95];
   ct.forEach(function(h,i){
     var v=h===2?d.crop2:h===4?d.crop4:h===8?d.crop8:h===12?d.crop12:d.crop24;
     var cfg=common.cropFill&&common.cropFill[h];
     var t=cfg&&N(cfg.min)!=null?N(cfg.min):fallback[i];
     if(v!=null)cv.push(scoreBand(v,t,t-10,t-20,'high'));
   });
   if(cv.length)add('crop','شروع تغذیه / پر بودن چینه‌دان',6,cv.reduce(function(a,b){return a+b},0)/cv.length,'میانگین نقاط ثبت‌شده');
 }

 /*
  * Weight trend is based on DISTANCE FROM THE REFERENCE, not signed deviation.
  * Example: -3.9% -> +0.5% is an improvement because |deviation| decreases.
  */
 var devTrend=prev&&d.dev!=null&&prev.dev!=null?Math.abs(d.dev)-Math.abs(prev.dev):null;
 var gainTrend=prev&&d.gain!=null&&prev.gain!=null?d.gain-prev.gain:null;
 add('weightTrend','روند فاصله وزن',4,devTrend==null?null:(devTrend<=0?1:devTrend<=2?.8:devTrend<=5?.5:0),
   devTrend==null?'داده روند کافی نیست':(devTrend<0?'بهبود ':'بدتر شدن ')+F(Math.abs(devTrend),1)+' واحد درصد'+(devTrend===0?' · ثبات':''));
 add('gainTrend','روند افزایش وزن',3,gainTrend==null?null:(gainTrend>=0?1:gainTrend>=-2?.8:gainTrend>=-5?.5:0),
   gainTrend==null?'داده روند کافی نیست':(gainTrend>=0?'بهبود/ثبات ':'کاهش ')+F(Math.abs(gainTrend),1)+' گرم');

 var combo=fd==null&&wd==null?null:fd!=null&&wd!=null?(fd>=-10&&wd>=-10?1:fd<=-30&&wd<=-30?0:.5):(fd!=null?(fd>=-10?1:fd<=-30?0:.5):(wd>=-10?1:wd<=-30?0:.5));
 add('consTrend','روند مصرف',3,combo,combo==null?'داده روند کافی نیست':'ترکیب تغییر آب و دان');

 var totalW=parts.reduce(function(s,x){return s+x.weight},0);
 var weighted=parts.reduce(function(s,x){return s+x.score*x.weight},0);
 var scoreValue=totalW>0?Math.round(weighted/totalW*100):null;

 if(scoreValue==null){
   var fallbackParts=[];
   if(d.dev!=null)fallbackParts.push(scoreBand(Math.abs(d.dev),5,10,15,'low'));
   if(d.ammonia!=null)fallbackParts.push(scoreBand(d.ammonia,10,15,20,'low'));
   if(d.co2!=null)fallbackParts.push(scoreBand(d.co2,3000,4000,5000,'low'));
   if(d.cumMortPct!=null)fallbackParts.push(scoreBand(d.cumMortPct,.50,.75,1,'low'));
   if(d.ratio!=null&&rr){
     var fm=N(rr.min),fx=N(rr.max);
     if(fm!=null&&fx!=null)fallbackParts.push(d.ratio>=fm&&d.ratio<=fx?1:scoreBand(Math.max(fm-d.ratio,0,d.ratio-fx),0,.25,.5,'low'));
   }
   fallbackParts=fallbackParts.filter(function(v){return v!=null&&isFinite(v)});
   if(fallbackParts.length)scoreValue=Math.round(fallbackParts.reduce(function(a,b){return a+b},0)/fallbackParts.length*100);
 }
 var coverage=totalW;
 var confidence=coverage>=85?'بالا':coverage>=65?'متوسط':coverage>=40?'محدود':'داده محدود';
 parts.slice().sort(function(a,b){return a.score-b.score}).slice(0,3).forEach(function(x){if(x.score<.75)reasons.push(x.label+(x.detail?' · '+x.detail:''));});
 return {score:scoreValue,confidence:confidence,coverage:Math.round(coverage),parts:parts,reasons:reasons.slice(0,3),gain:gain,gainRef:gainRef,attain:attain};
}
function score(m,d){return scoreDetails(m,d).score;}
function severity(d){
 if((d.dev!=null&&d.dev<=-10)||(d.ammonia!=null&&d.ammonia>=20)||(d.co2!=null&&d.co2>=5000)||(d.cumMortPct!=null&&d.cumMortPct>=1))return'bad';
 if((d.dev!=null&&d.dev<=-5)||(d.ammonia!=null&&d.ammonia>=10)||(d.co2!=null&&d.co2>=3000)||(d.cumMortPct!=null&&d.cumMortPct>=.75))return'warn';
 return'';
}
function researchWaterFeedReference(age){
 age=N(age);if(age==null||age<1||age>7)return null;
 var feed=.37+3.546*age;
 var water=9.73+6.142*age;
 return water/feed;
}
function waterFeedStatus(actual,ref){
 actual=N(actual);ref=N(ref);if(actual==null||ref==null)return '';
 var pct=(actual-ref)/ref*100;
 if(Math.abs(pct)>=25)return 'bad';
 if(Math.abs(pct)>=15)return 'warn';
 return '';
}
function waterFeedChart(rows){
 var vals=rows.map(function(d){return N(d.ratio)}).filter(function(v){return v!=null});
 var refs=rows.map(function(d){return researchWaterFeedReference(d.age)}).filter(function(v){return v!=null});
 if(!vals.length)return '<div class="note">داده کافی برای رسم آب:دان وجود ندارد.</div>';
 var all=vals.concat(refs),mn=Math.min.apply(null,all),mx=Math.max.apply(null,all);if(mn===mx){mn-=.1;mx+=.1}
 var pad=(mx-mn)*.2;mn-=pad;mx+=pad;
 var W=600,H=175,L=35,R=10,T=10,B=25,iw=W-L-R,ih=H-T-B,x=function(i){return L+i/Math.max(rows.length-1,1)*iw},y=function(v){return T+(mx-v)/(mx-mn)*ih};
 var path='',rpath='',pts='';
 rows.forEach(function(d,i){
   var v=N(d.ratio),q=researchWaterFeedReference(d.age);
   if(v!=null)path+=(path?'L':'M')+' '+x(i)+' '+y(v)+' ';
   if(q!=null)rpath+=(rpath?'L':'M')+' '+x(i)+' '+y(q)+' ';
   if(v==null)return;
   var st=waterFeedStatus(v,q),cl=st==='bad'?'ptb':st==='warn'?'ptw':'pt';
   var diff=q==null?null:(v-q)/q*100;
   var label='روز '+d.age+' · آب:دان: '+F(v,2)+' L/kg · مرجع پژوهشی: '+F(q,2)+' L/kg'+(diff==null?'':' · اختلاف '+(diff>=0?'+':'')+F(diff,0)+'٪');
   pts+='<g data-chart-point="1" data-tip="'+esc(label)+'"><title>'+esc(label)+'</title><circle cx="'+x(i)+'" cy="'+y(v)+'" r="4" class="'+cl+'"/>'+(st==='bad'?'<circle cx="'+x(i)+'" cy="'+y(v)+'" r="5" class="ring"/>':'')+'<circle cx="'+x(i)+'" cy="'+y(v)+'" r="11" class="chart-hit"/></g>';
 });
 var labs=rows.map(function(d,i){return '<text x="'+x(i)+'" y="'+(H-6)+'" text-anchor="middle" font-size="9" fill="#68736d">روز '+d.age+'</text>'}).join('');
 return '<div class="chartname">نسبت آب به دان <span class="muted">L/kg</span></div><div class="chart-tooltip"></div><svg viewBox="0 '+W+' '+H+'"><line class="axis" x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(H-B)+'"/><line class="axis" x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-R)+'" y2="'+(H-B)+'"/><path class="pref" d="'+rpath+'"/><path class="pline" d="'+path+'"/>'+pts+labs+'</svg><p class="note">خط‌چین: مرجع پژوهشی روزانه بر پایه معادلات مصرف روزانه آب و دان جوجه‌های گوشتی در مطالعه Journal of Applied Poultry Research (روزهای ۱ تا ۷). این خط استاندارد رسمی یا استاندارد مدیریتی سویه نیست.</p>';
}
function mortalityChart(rows){
 var vals=rows.map(function(d){return N(d.cumMortPct)}).filter(function(v){return v!=null});
 if(!vals.length)return '<div class="note">داده کافی برای رسم تلفات تجمعی وجود ندارد.</div>';
 var mn=0,mx=Math.max(1,Math.max.apply(null,vals)*1.2),W=600,H=175,L=35,R=10,T=10,B=25,iw=W-L-R,ih=H-T-B,x=function(i){return L+i/Math.max(rows.length-1,1)*iw},y=function(v){return T+(mx-v)/mx*ih};
 var path='',pts='';rows.forEach(function(d,i){var v=N(d.cumMortPct);if(v==null)return;path+=(path?'L':'M')+' '+x(i)+' '+y(v)+' ';var label='روز '+d.age+' · تلفات تجمعی: '+F(d.cumMort,0)+' قطعه · '+F(v,2)+'٪';pts+='<g data-chart-point="1" data-tip="'+esc(label)+'"><title>'+esc(label)+'</title><circle cx="'+x(i)+'" cy="'+y(v)+'" r="4" class="pt"/><circle cx="'+x(i)+'" cy="'+y(v)+'" r="11" class="chart-hit"/></g>'});
 var refY=y(1),labs=rows.map(function(d,i){return '<text x="'+x(i)+'" y="'+(H-6)+'" text-anchor="middle" font-size="9" fill="#68736d">روز '+d.age+'</text>'}).join('');
 return '<div class="chartname">تلفات تجمعی <span class="muted">قطعه + درصد</span></div><div class="chart-tooltip"></div><svg viewBox="0 0 '+W+' '+H+'"><line class="axis" x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(H-B)+'"/><line class="axis" x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-R)+'" y2="'+(H-B)+'"/><line class="pref" x1="'+L+'" y1="'+refY+'" x2="'+(W-R)+'" y2="'+refY+'"/><text x="'+(W-R-4)+'" y="'+(refY-5)+'" text-anchor="end" font-size="9" fill="#68736d">سقف ۷ روزه Cobb ≤۱٪</text><path class="pline" d="'+path+'"/>'+pts+labs+'</svg><p class="note">خط‌چین فقط معیار رسمی پایان روز ۷ است و استاندارد روزانه محسوب نمی‌شود.</p>';
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
function dailyGainFor(d,prev,m){
 var v=d&&d.gain!=null?N(d.gain):null;
 if(v!=null)return v;
 if(!d||d.bw==null)return null;
 if(d.age===1&&m&&m.initW!=null)return N(d.bw)-N(m.initW);
 if(d.age>1&&prev&&prev.bw!=null)return N(d.bw)-N(prev.bw);
 return null;
}
function dailyGainReferenceFor(d,m){
 if(!d||d.target==null||!m||!m.std||!m.std.dayWeightG)return null;
 if(d.age===1&&m.std.chickWeightG!=null)return N(d.target)-N(m.std.chickWeightG);
 if(d.age>1&&m.std.dayWeightG[d.age-1]!=null)return N(d.target)-N(m.std.dayWeightG[d.age-1]);
 return null;
}
function signed(v,dec,unit){
 v=N(v);if(v==null)return '—';
 return '<span dir="ltr">'+(v>=0?'+':'−')+F(Math.abs(v),dec)+(unit?' '+esc(unit):'')+'</span>';
}
function compareMetric(label,current,previous,unit,dec){
 current=N(current);previous=N(previous);if(current==null||previous==null)return '<div class="row"><span>'+esc(label)+'</span><b>—</b></div>';
 var ch=current-previous,pct=previous===0?null:ch/Math.abs(previous)*100;
 return '<div class="row"><span>'+esc(label)+'</span><b dir="ltr" style="text-align:right;display:block">'+F(previous,dec)+' → '+F(current,dec)+' '+esc(unit||'')+'<small class="cmpdelta" dir="ltr"> '+signed(ch,dec,unit)+(pct==null?'':' · '+signed(pct,1,'%'))+'</small></b></div>';
}
function render(){
 var root=$('root');if(!root||!model)return;var rows=model.days.filter(function(d){return d.age<=age}),d=rows[rows.length-1],prev=rows.length>1?rows[rows.length-2]:null;if(!d)return;
 var sc=score(model,d),al=alerts(d,prev),h='<div class="f7pro2">';
 h+='<div class="p2card"><div class="p2head"><div><div class="muted">گزارش مستقل پایش روزانه · هفت روز اول</div><h2>تحلیل روز '+d.age+'</h2><div class="muted">'+esc(model.strainKey||'سویه')+' · منبع: پایش روزانه گله</div></div><div class="muted">تا روز '+d.age+'</div></div><div class="p2days">';
 [1,2,3,4,5,6,7].forEach(function(x){var q=model.days.find(function(z){return z.age===x});h+='<button class="p2day '+(x===d.age?'active ':'')+(!q?'missing':'')+'" data-p2age="'+x+'"><strong>روز '+x+'</strong><small>'+(q?(q.bw==null?'بدون وزن':F(q.bw,0)+' g'):'بدون داده')+'</small></button>'});h+='</div></div>';
 var sd=scoreDetails(model,d);
 h+='<div class="p2card"><div class="p2title"><h3>امتیاز عملکرد روز '+d.age+'</h3><span class="muted">تحلیلی · از ۱۰۰</span></div><div class="p2score"><div class="ringScore" style="--v:'+(sd.score==null?0:sd.score)+'%"><div class="scoreNum">'+(sd.score==null?'—':F(sd.score,0))+'</div></div><div class="note"><b>'+(sd.score==null?'داده کافی نیست':sd.score>=90?'عالی':sd.score>=80?'خوب':sd.score>=70?'قابل قبول':sd.score>=60?'مرز هشدار':sd.score>=45?'ضعیف':'نیازمند بررسی جدی')+'</b><br/>اعتماد امتیاز: <b>'+esc(sd.confidence)+'</b> · پوشش داده: '+F(sd.coverage,0)+'٪<br/>'+(!sd.reasons.length?'عوامل کاهنده مهمی شناسایی نشد.':'عوامل مؤثر: '+esc(sd.reasons.join(' | ')))+'</div></div><div class="note" style="margin-top:9px">این امتیاز یک شاخص تحلیلی داخلی برای مقایسه عملکرد روزانه است و جایگزین استاندارد رسمی، تشخیص بیماری یا ارزیابی نهایی گله نیست.</div></div>';
 h+='<div class="p2card"><div class="p2title"><h3>وضعیت روز '+d.age+'</h3><span class="muted">استانداردهای موجود همان سیستم</span></div><div class="p2grid">';
 h+=metric('وزن',F(d.bw,1)+' گرم',d.target!=null?'مرجع: '+F(d.target,1)+' گرم':'مرجع ندارد',d.dev==null?'':Math.abs(d.dev)<=5?'good':Math.abs(d.dev)<=10?'warn':'bad');
 h+=metric('انحراف وزن',P(d.dev,1),'فاصله از مرجع همان روز',d.dev==null?'':Math.abs(d.dev)<=5?'good':Math.abs(d.dev)<=10?'warn':'bad');
 var dailyGain=dailyGainFor(d,prev,model);var gainRef=dailyGainReferenceFor(d,model);var gainRefText=gainRef!=null?'مرجع مشتق‌شده از وزن مرجع روزانه: '+(gainRef>=0?'+':'')+F(gainRef,1)+' گرم':'مرجع افزایش وزن روزانه موجود نیست';var gainClass='';if(dailyGain!=null&&gainRef!=null){var gainRatio=dailyGain/gainRef;if(gainRef<=0){gainClass=dailyGain>=gainRef?'good':'bad'}else if(gainRatio>=1){gainClass='good'}else if(gainRatio>=0.85){gainClass='warn'}else if(gainRatio>=0.70){gainClass='caution'}else{gainClass='bad'}}h+=metric('افزایش وزن',dailyGain==null?'—':signed(dailyGain,1,' گرم'),dailyGain==null?gainRefText:(gainRefText+(d.age===1?' · مبنا: وزن اولیه جوجه':' · نسبت به روز قبل')),gainClass);
 h+=metric('دان / پرنده',d.feedPerBird==null?'—':F(d.feedPerBird,2)+' گرم','بر اساس جمعیت زنده ابتدای روز');
 h+=metric('آب / پرنده',d.waterPerBird==null?'—':F(d.waterPerBird,2)+' ml','بر اساس جمعیت زنده ابتدای روز');
 h+=metric('آب : دان',d.ratio==null?'—':F(d.ratio,2)+' L/kg','مرجع مدیریتی موجود'+(researchWaterFeedReference(d.age)!=null?' · مرجع پژوهشی روز '+d.age+': '+F(researchWaterFeedReference(d.age),2)+' L/kg':''));
 var mortalityDayClass='';var mortalityDayNote='خط پایه · روز اول';if(d.age>1&&prev&&d.mort!=null&&prev.mort!=null){if(d.mort<prev.mort){mortalityDayClass='good';mortalityDayNote='↓ '+F(prev.mort-d.mort,0)+' قطعه نسبت به روز قبل'}else if(d.mort>prev.mort){mortalityDayClass='bad';mortalityDayNote='↑ '+F(d.mort-prev.mort,0)+' قطعه نسبت به روز قبل'}else{mortalityDayClass='warn';mortalityDayNote='بدون تغییر نسبت به روز قبل'}}h+=metric('تلفات روز',F(d.mort,0)+' قطعه',mortalityDayNote+' · تجمعی: '+P(d.cumMortPct,2),mortalityDayClass);
 h+=metric('تلفات تجمعی',F(d.cumMort,0)+' قطعه','('+P(d.cumMortPct,2)+')',d.cumMortPct==null?'':d.cumMortPct<=1?'good':'bad');h+=metric('دمای ونت',d.vent==null?'—':F(d.vent,1)+' °C','روز ۱–۲: ۳۹٫۴–۴۰٫۵°C',d.vent==null?'':d.vent>=39.4&&d.vent<=40.5?'good':'warn');
 h+=metric('زنده‌مانی',d.live==null?'—':F(d.live,0)+' قطعه','');
 var tempCardRef=tempDynamic?'مرجع وابسته به RH: '+F(tempDynamic.target,1)+' °C · RH '+F(tempDynamic.usedRH,0)+'٪':(d.minTemp!=null&&d.maxTemp!=null?'حداقل '+F(d.minTemp,1)+' · حداکثر '+F(d.maxTemp,1):'مرجع دما با RH ثبت‌شده در دسترس نیست');
 var tempCardClass='';
 if(d.temp!=null&&tempDynamic){var tempCardDist=Math.abs(d.temp-tempDynamic.target);tempCardClass=tempCardDist<=.8?'good':tempCardDist<=2?'warn':'bad';}
 h+=metric('دما',d.temp==null?'—':F(d.temp,1)+' °C',tempCardRef,tempCardClass);
 h+=metric('RH',d.rh==null?'—':F(d.rh,1)+'٪','رطوبت نسبی');
 h+=metric('دمای بستر',d.litterTemp==null?'—':F(d.litterTemp,1)+' °C','');
 h+=metric('شدت نور',d.light==null?'—':F(d.light,0)+' lux','');
 h+=metric('آمونیاک',d.ammonia==null?'—':F(d.ammonia,1)+' ppm','آستانه اقدام: ۱۰ ppm',d.ammonia==null?'':d.ammonia<10?'good':d.ammonia<20?'warn':'bad');
 h+=metric('CO₂',d.co2==null?'—':F(d.co2,0)+' ppm','آستانه اقدام: ۳۰۰۰ ppm',d.co2==null?'':d.co2<3000?'good':d.co2<5000?'warn':'bad');
 h+=metric('کیفیت هوا',d.air||'ثبت نشده','','');h+=metric('کیفیت بستر',d.litter||'ثبت نشده','','');
 h+=metric('نمونه وزن',d.bodySample==null?'—':F(d.bodySample,0)+' قطعه','','');
 if(d.age===1)h+=metric('Crop Fill 24h',d.crop24==null?'—':P(d.crop24,1),'هدف ثبت‌شده ۹۵٪',d.crop24==null?'':d.crop24>=95?'good':'warn');
 h+='</div></div>';
 if(prev){
 var gainToday=dailyGainFor(d,prev,model),gainRefToday=dailyGainReferenceFor(d,model);
 var gainAttain=(gainToday!=null&&gainRefToday!=null&&gainRefToday>0)?gainToday/gainRefToday*100:null;
 var gainRefLabel=gainRefToday==null?'مرجع افزایش وزن روزانه در استاندارد موجود نیست':'مرجع افزایش وزن این روز: '+signed(gainRefToday,1,' گرم');
 var gainStatus=gainAttain==null?'':gainAttain>=100?'good':gainAttain>=85?'warn':gainAttain>=70?'caution':'bad';
 h+='<div class="p2card"><div class="p2title"><h3>تغییرات روز '+d.age+' نسبت به روز '+prev.age+'</h3><span class="muted">مقایسه واقعی · بدون قضاوت از روی درصد تغییر به‌تنهایی</span></div>';
 h+='<div class="compare"><div>';
 h+='<div class="compareFocus '+gainStatus+'"><small>افزایش وزن روزانه</small><strong>'+(gainToday==null?'—':signed(gainToday,1,' گرم'))+'</strong><span>'+(gainRefToday==null?'مرجع موجود نیست':signed(gainRefToday,1,' گرم')+' مرجع · '+F(gainAttain,0)+'٪ تحقق مرجع')+'</span></div>';
 h+=compareMetric('وزن',d.bw,prev.bw,'گرم',1);
 h+=compareMetric('دان / پرنده',d.feed,prev.feed,'گرم',2);
 h+=compareMetric('آب / پرنده',d.water,prev.water,'ml',2);
 h+=compareMetric('آب : دان',d.ratio,prev.ratio,'L/kg',2);
 h+='</div><div>';
 h+='<div class="row"><span>فاصله وزن از مرجع</span><b>'+(d.dev==null?'—':signed(d.dev,1,'٪')+(prev.dev==null?'':' · روز قبل '+signed(prev.dev,1,'٪')))+'</b></div>';
 var gapDelta=d.dev!=null&&prev.dev!=null?Math.abs(d.dev)-Math.abs(prev.dev):null;
 h+='<div class="row"><span>تغییر فاصله از مرجع</span><b>'+(gapDelta==null?'—':(gapDelta<0?'بهبود ':gapDelta>0?'بدتر شدن ':'ثبات ')+F(Math.abs(gapDelta),1)+' واحد درصد')+'</b></div>';
 h+=compareMetric('تلفات روز',d.mort,prev.mort,'قطعه',0);
 h+=compareMetric('تلفات تجمعی',d.cumMort,prev.cumMort,'قطعه',0);
 h+=compareMetric('زنده‌مانی',d.live,prev.live,'قطعه',0);
 h+='</div></div>';
 h+='<div class="compareEnv"><div class="chartname">پارامترهای محیطی · فقط تغییر مشاهده‌شده</div>';
 h+=compareMetric('دما',d.temp,prev.temp,'°C',1);h+=compareMetric('RH',d.rh,prev.rh,'٪',1);h+=compareMetric('دمای بستر',d.litterTemp,prev.litterTemp,'°C',1);h+=compareMetric('آمونیاک',d.ammonia,prev.ammonia,'ppm',1);h+=compareMetric('CO₂',d.co2,prev.co2,'ppm',0);
 h+='</div><p class="note">تفسیر رشد بر اساس افزایش وزن واقعی در برابر مرجع همان روز انجام می‌شود. تغییرات دان، آب و آب:دان به‌صورت توصیفی نمایش داده می‌شوند و به‌تنهایی «خوب/بد» تلقی نمی‌شوند؛ چون این شاخص‌ها تحت‌تأثیر سن، دما، جیره، کیفیت آب و شرایط مدیریتی هستند. منابع پژوهشی نیز تغییرات آب/دان را وابسته به شرایط محیطی و تغذیه‌ای گزارش کرده‌اند.</p></div>';
} else h+='<div class="p2card"><h3>روز ۱ — خط پایه</h3><p class="note">روز اول خط پایه است و مقایسه روزبه‌روز از روز دوم آغاز می‌شود. افزایش وزن روز اول در بخش وضعیت روز بر اساس وزن اولیه جوجه تفسیر می‌شود.</p></div>';
 h+='<div class="p2card"><div class="p2title"><h3>روندها تا روز '+d.age+'</h3><span class="muted">فقط روزهای ۱ تا '+d.age+'</span></div><div class="p2charts">';
 h+='<div class="p2chart">'+chart(rows,'bw','target','وزن واقعی و مرجع','g')+'</div>';
 h+='<div class="p2chart">'+waterFeedChart(rows)+'</div>';
 h+='<div class="p2chart">'+mortalityChart(rows)+'</div>';
 h+='</div><p class="note">نمودارهای روند فقط شاخص‌هایی را نگه می‌دارند که برای تصمیم‌گیری روزانه کاربرد بیشتری دارند: وزن واقعی در برابر مرجع، نسبت آب به دان، و تلفات تجمعی. سرانه دان و آب در کارت‌ها باقی می‌مانند و فعلاً نمودار مستقل ندارند.</p></div>';
 if(d.age===1){h+='<div class="p2card"><div class="p2title"><h3>پایش شروع گله</h3><span class="muted">فقط روز اول</span></div><div class="p2grid">';
 h+=metric('دمای ونت',d.vent==null?'—':F(d.vent,1)+' °C','روز ۱–۲: ۳۹٫۴–۴۰٫۵°C');
 h+=metric('Crop Fill 2h',d.crop2==null?'—':P(d.crop2,1),'هدف ۷۵٪');h+=metric('Crop Fill 4h',d.crop4==null?'—':P(d.crop4,1),'هدف ۸۰٪');h+=metric('Crop Fill 8h',d.crop8==null?'—':P(d.crop8,1),'هدف >۸۰٪');h+=metric('Crop Fill 12h',d.crop12==null?'—':P(d.crop12,1),'هدف >۸۵٪');h+=metric('Crop Fill 24h',d.crop24==null?'—':P(d.crop24,1),'هدف >۹۵٪');h+='</div></div>';}
 h+='<div class="p2card"><div class="p2title"><h3>اتفاقات و تفسیر روز '+d.age+'</h3><span class="muted">'+al.length+' سیگنال</span></div>';
 if(al.length)al.forEach(function(a){h+='<div class="p2alert '+a[0]+'"><i class="dot"></i><b>'+esc(a[1])+'</b><span>'+esc(a[2])+'</span></div>'});else h+='<p class="note">بر اساس داده‌های موجود، سیگنال قابل توجهی برای این روز شناسایی نشد.</p>';
 h+='</div><div class="p2card"><div class="note">این لایه فقط گزارش روزانه هفت روز اول را نمایش می‌دهد. منبع داده، موتور محاسبات و استانداردها همان منابع موجود پروژه هستند؛ هیچ استاندارد رسمی یا مدیریتی جدیدی در این UI تعریف نشده است.</div></div></div>';
 root.setAttribute('data-report-view','first7-daily-pro-v2');root.innerHTML=h;root.querySelectorAll('[data-p2age]').forEach(function(b){b.onclick=function(){age=Number(b.getAttribute('data-p2age'));render()}});root.querySelectorAll('.p2chart').forEach(function(box){var tip=box.querySelector('.chart-tooltip');box.querySelectorAll('[data-chart-point]').forEach(function(pt){var show=function(ev){if(!tip)return;tip.textContent=pt.getAttribute('data-tip')||'';tip.style.display='block';var r=box.getBoundingClientRect(),xv=ev.clientX-r.left+8,yv=ev.clientY-r.top+8;tip.style.left=Math.max(6,Math.min(xv,r.width-170))+'px';tip.style.top=Math.max(6,Math.min(yv,145))+'px'};pt.addEventListener('mouseenter',show);pt.addEventListener('mousemove',show);pt.addEventListener('mouseleave',function(){if(tip)tip.style.display='none'});pt.addEventListener('click',show)})});
}
async function show(){
 if(busy)return;var root=$('root');if(!root)return;busy=true;
 try{var e=window.ADINE_BROILER_FIRST7_REPORT_ENGINE_V1;if(!e)throw new Error('موتور پایش روزانه بارگذاری نشده است.');model=await e.load();age=model.days&&model.days.length?model.days[0].age:1;css();render()}
 catch(err){console.error(err);root.innerHTML='<div class="error">خطا در بارگذاری گزارش روزانه: '+esc(err&&err.message?err.message:err)+'</div>'}
 finally{busy=false}
}
window.ADINE_BROILER_FIRST7_REPORT_PRO_V2=Object.freeze({show:show});
})();