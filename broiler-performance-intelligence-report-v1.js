/* ADINE — BROILER PERFORMANCE INTELLIGENCE PRESENTATION V10.1 — DIRECTION-AWARE CHARTS */
(function(global){'use strict';
const root=()=>document.getElementById('root');
const esc=s=>String(s??'—').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const fmt=(v,d=1)=>n(v)===null?'—':n(v).toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=v=>n(v)===null?'—':fmt(v,1)+'٪';
const st=s=>({excellent:'بهتر از مرجع',good:'مطلوب',on_target:'روی مرجع',watch:'نیازمند پایش',critical:'نیازمند بررسی فوری',unavailable:'قابل ارزیابی نیست'}[s]||'قابل ارزیابی نیست');
const bc=s=>s==='critical'?'critical':s==='watch'?'watch':s==='good'||s==='excellent'?'good':'neutral';
const trendClass=d=>d==='improving'?'trend-good':d==='worsening'?'trend-bad':d==='stable'?'trend-neutral':'trend-muted';
const trendIcon=d=>d==='improving'?'↑':d==='worsening'?'↓':d==='stable'?'→':'';
function section(t,sub,body,key='neutral'){return '<section class="pi-section pi-section-'+esc(key)+'"><button class="pi-accordion-head" type="button" aria-expanded="true"><span><b>'+esc(t)+'</b><small>'+esc(sub||'')+'</small></span><i>⌃</i></button><div class="pi-accordion-body">'+body+'</div></section>'}
function metric(l,v,s,key){
 const status=s?.status||'unavailable',gap=n(s?.gapPercent),model=global.__adinePerformanceIntelligenceModel||{},q=model.states?.[key]||{},t=q.trend||{};
 const ref=s?.reference||q?.reference||{}; const gapText=key==='cv'&&gap!==null&&n(s?.statusBoundary)!==null?(fmt(s.current,1)+'٪؛ '+fmt(n(s.statusBoundary)-s.current,1)+' واحد درصد بهتر از مرز عملیاتی ۱۰٪'):(gap===null?'استاندارد قابل اتکا در این سن در دسترس نیست':(gap>0?'+':'')+fmt(gap,1)+'٪ نسبت به '+(ref.label||'استاندارد سنی'));
 const dir=t.direction==='improving'?'بهبود':t.direction==='worsening'?'افت':t.direction==='stable'?'پایدار':'سابقه کافی نیست';
 const movement=t.movement==='closer'?'نزدیک‌تر به استاندارد سنی':t.movement==='better_farther'?'بهتر از استاندارد؛ فاصله عملکردی بیشتر':t.movement==='worse_farther'?'نامطلوب‌تر؛ فاصله عملکردی بیشتر':t.movement==='crossed_to_better'?'عبور به سمت بهتر از استاندارد':t.movement==='crossed_to_worse'?'عبور به سمت نامطلوب':t.movement==='stable'?'فاصله عملکردی تقریباً ثابت':'—';
 const meaning={weight:'سطح وزن فعلی',fcr:'کارایی خوراک در ارزیابی اخیر',cumulativeFcr:'کارایی تجمعی خوراک',adg:'سرعت رشد',mortality:'وضعیت بقا',cv:'پراکندگی وزن',u10:'سهم وزن در محدوده ±۱۰٪',u15:'سهم وزن در محدوده ±۱۵٪'}[key]||'وضعیت شاخص';
 return '<article class="pi-metric '+bc(status)+'"><div class="pi-metric-top"><div class="pi-metric-label">'+esc(l)+'</div><span class="pi-metric-dot"></span></div><div class="pi-metric-value">'+esc(v)+'</div><div class="pi-metric-status">'+esc(st(status))+'</div><div class="pi-metric-gap">'+esc(gapText)+'</div><div class="pi-metric-trend"><b>'+esc(dir)+'</b><span> • '+esc(movement)+'</span></div><div class="pi-metric-meaning">'+esc(meaning)+'</div></article>';
}
function epefCard(s){const o=s?.official||{},status=o.status||'unavailable',cur=n(o.current),target=n(o.target),gap=n(o.gapPercent),bands=[['ممتاز','≥ 505','excellent'],['خوب','450–504','good'],['قابل قبول','430–449','on_target'],['نیازمند پایش','400–429','watch'],['نیازمند بررسی','< 400','critical']];return '<article class="pi-epef-hero pi-epef-'+status+'"><div class="pi-epef-head"><div><span class="pi-epef-kicker">شاخص کلیدی عملکرد</span><h3>EPEF</h3><p>شاخص بهره‌وری عملکرد گله؛ ترکیبی از وزن زنده، زنده‌مانی، سن و ضریب تبدیل خوراک.</p></div><span class="pi-epef-badge">'+esc(st(status))+'</span></div><div class="pi-epef-main"><strong>'+fmt(cur,1)+'</strong><span>مرجع صنعتی: '+fmt(target,0)+'</span><b>'+pct(gap)+' نسبت به مرجع</b></div><div class="pi-epef-scale">'+bands.map(x=>'<span class="'+x[2]+'"><b>'+x[0]+'</b><small>'+x[1]+'</small></span>').join('')+'</div><div class="pi-epef-note">مرجع 505 بر اساس آستانه عملکرد صنعتی EPEF است؛ محدوده‌های بین آن برای تفسیر مدیریتی و پایش مرحله‌ای استفاده می‌شوند. هرچه EPEF بالاتر باشد، عملکرد ترکیبی گله بهتر است.</div></article>'}
function band(m){
 const b=m.weightBand,d=m.weightDistribution,ws=(m.sampleWeights||[]).map(n).filter(v=>v!==null);
 if(!b)return '<div class="pi-empty">نمونه وزن آخرین ارزیابی یا وزن مرجع علمی سویه در سن ارزیابی در دسترس نیست.</div>';
 const t=n(b.referenceWeight);
 if(t===null)return '<div class="pi-empty">وزن مرجع علمی سویه در این سن در دسترس نیست.</div>';
 const domainMin=t*.82,domainMax=t*1.18,range=domainMax-domainMin||1;
 const xOf=w=>Math.max(1,Math.min(99,(w-domainMin)/range*100));
 // همه مشاهدات باید روی نمودار باقی بمانند. برای جلوگیری از پوشاندن نقاط هم‌وزن،
 // نقاط به‌صورت swarm/stacked strip با الگوریتم قطعی در چند ردیف عمودی چیده می‌شوند.
 const ordered=ws.map((w,i)=>({w,i,x:xOf(w)})).sort((a,z)=>a.x-z.x||a.i-z.i);
 const levels=[];
 const minGap=2.15;
 ordered.forEach(p=>{
   let level=0;
   while(levels[level]!==undefined && p.x-levels[level]<minGap) level++;
   levels[level]=p.x;
   p.level=level;
 });
 const maxLevel=ordered.length?Math.max(...ordered.map(p=>p.level)):0;
 const visualHeight=Math.max(116,Math.min(300,92+(maxLevel+1)*12));
 const centerOffset=Math.max(10,(visualHeight-(maxLevel*12+10))/2);
 const pts=ordered.map(p=>{
   const top=centerOffset+p.level*12;
   const bandName=p.w>=t*.90&&p.w<=t*1.10?'داخل ±۱۰٪':p.w>=t*.85&&p.w<=t*1.15?'بین ±۱۰ تا ±۱۵٪':'خارج ±۱۵٪';
   return '<button type="button" class="pi-weight-point '+(p.w>=t*.90&&p.w<=t*1.10?'point-safe':p.w>=t*.85&&p.w<=t*1.15?'point-mid':'point-out')+'" data-weight-point="'+p.i+'" data-weight="'+p.w.toFixed(1)+'" data-weight-index="'+p.i+'" data-weight-band="'+esc(bandName)+'" style="left:'+p.x.toFixed(2)+'%;top:'+top+'px" aria-label="نمونه '+(p.i+1)+' از '+ws.length+'، وزن '+fmt(p.w,0)+' گرم">'+
   '<span>'+fmt(p.w,0)+'</span></button>';
 }).join('');
 const p15=t*.85,p110=t*1.10,p115=t*1.15;
 return '<div class="pi-weight-health-visual">'+
 '<div class="pi-weight-summary"><b>هر نقطه = یک نمونه واقعی</b><span>'+fmt(ws.length,0)+' نمونه در آخرین ارزیابی</span></div>'+
 '<div class="pi-weight-axis" style="--pi-weight-height:'+visualHeight+'px"><div class="pi-weight-track"><div class="pi-weight-zone zone-15"></div><div class="pi-weight-zone zone-10"></div><div class="pi-weight-boundary b15l"></div><div class="pi-weight-boundary b10l"></div><div class="pi-weight-boundary b10h"></div><div class="pi-weight-boundary b15h"></div><div class="pi-weight-target"></div>'+pts+'</div>'+
 '<div class="pi-weight-legend"><span><i class="safe"></i>داخل ±۱۰٪</span><span><i class="mid"></i>بین ±۱۰ تا ±۱۵٪</span><span><i class="out"></i>خارج ±۱۵٪</span><span><i class="target"></i>وزن مرجع علمی</span></div></div>'+
 '<div class="pi-band-grid"><button data-band="10"><b>داخل ±۱۰٪</b><strong>'+fmt(b.within10,0)+' ('+pct(b.within10Percent)+')</strong></button><button data-band="mid"><b>بین ±۱۰ تا ±۱۵٪</b><strong>'+fmt(b.between10and15,0)+' ('+pct(b.between10and15Percent)+')</strong></button><button data-band="15"><b>خارج ±۱۵٪</b><strong>'+fmt(b.outside15,0)+' ('+pct(b.outside15Percent)+')</strong></button></div>'+
 '<div class="pi-weight-selected" id="piWeightSelected" aria-live="polite">برای مشاهده جزئیات هر نمونه، روی نقطه آن کلیک کنید.</div>'+
 '<div class="pi-band-note" id="piBandNote">نمونه: '+fmt(b.sampleCount,0)+' قطعه • میانگین: '+fmt(d?.mean,0)+' گرم • CV نمونه: '+pct(d?.cv)+' • دامنه: '+fmt(d?.min,0)+' تا '+fmt(d?.max,0)+' گرم</div></div>';
}
function radarPoint(v,angle){const x=120+Math.sin(angle)*v*.97,y=120-Math.cos(angle)*v*.97;return [x.toFixed(1),y.toFixed(1)].join(',')}
function radarValue(s){const g=n(s?.gapPercent),status=s?.status;if(g===null)return 75;const anchors={critical:38,watch:55,on_target:75,good:88,excellent:98};const center=anchors[status]??75;const drift=Math.max(-10,Math.min(10,g))*0.9;return Math.max(28,Math.min(100,center+drift))}
function metricName(k){return{weight:'وزن',fcr:'FCR',cumulativeFcr:'FCR تجمعی',adg:'افزایش وزن',mortality:'تلفات',cv:'CV',u10:'U10',u15:'U15',epef:'EPEF',feed:'خوراک',water:'آب',wfr:'آب/خوراک'}[k]||k}
function sparkline(model,key){
 const raw=model.series?.[key]||[],
       a=raw.map((x,i)=>({...x,_i:i,actual:n(x.actual),target:n(x.target)})).filter(x=>x.actual!==null&&x.target!==null),
       state=model.states?.[key]||{},
       t=state.trend||{},
       f=state.forecast||{},
       lowerIsBetter=['fcr','cumulativeFcr','mortality','cv'].includes(key);
 if(!a.length)return '<div class="pi-spark-empty">داده روند و مرجع سنی کافی نیست</div>';

 const w=360,h=164,px=76,pr=12,pt=18,pb=50;
 const projected=f.available?n(f.projectedGapPercent):null;
 const values=[];
 a.forEach(p=>{values.push(p.actual,p.target)});
 if(projected!==null){
   const last=a.at(-1), projectedActual=lowerIsBetter?last.target*(1-projected/100):last.target*(1+projected/100);
   if(Number.isFinite(projectedActual))values.push(projectedActual);
 }
 let lo=Math.min(...values),hi=Math.max(...values);
 const span=Math.max(1,hi-lo),pad=Math.max(span*.08,Math.abs((hi+lo)/2)*.015||1);
 lo-=pad;hi+=pad;
 const den=Math.max(1,hi-lo);
 const x=i=>px+(i/Math.max(1,a.length-1))*(w-px-pr);
 const y=v=>pt+(hi-v)/den*(h-pt-pb);

 const niceStep=(range)=>{
   const raw=Math.max(range/6,1e-9),pow=Math.pow(10,Math.floor(Math.log10(raw))),q=raw/pow;
   return (q<=1?1:q<=2?2:q<=5?5:10)*pow;
 };
 const step=niceStep(hi-lo),axisMin=Math.floor(lo/step)*step,axisMax=Math.ceil(hi/step)*step;
 let axisVals=[];
 for(let v=axisMin;v<=axisMax+step*.25;v+=step)axisVals.push(v);
 if(axisVals.length>7){
   const stride=Math.ceil((axisVals.length-1)/6);
   axisVals=axisVals.filter((_,i)=>i===0||i===axisVals.length-1||i%stride===0);
 }
 if(axisVals.length>7)axisVals=axisVals.slice(0,7);

 const directionColor=d=>d==='improving'?'#1f8a63':d==='worsening'?'#c3473e':d==='stable'?'#7b8782':'#9aa6a1';
 const pointColor=p=>{
   const gap=lowerIsBetter?(p.target-p.actual)/Math.abs(p.target):(p.actual-p.target)/Math.abs(p.target);
   return gap>0?'#1f8a63':gap<0?'#c3473e':'#7b8782';
 };
 const lineColor=directionColor(t.direction);
 const unit=key==='weight'||key==='adg'?' گرم':key==='fcr'||key==='cumulativeFcr'?'':'٪';
 const digits=key==='fcr'||key==='cumulativeFcr'?3:key==='mortality'||key==='cv'||key==='u10'||key==='u15'?1:0;

 let grid='';
 axisVals.forEach(v=>{
   const yy=y(v);
   grid+='<line class="pi-chart-grid-line" x1="'+px+'" y1="'+yy.toFixed(1)+'" x2="'+(w-pr)+'" y2="'+yy.toFixed(1)+'"></line>'+
         '<text class="pi-chart-y-label" x="'+(px-7)+'" y="'+(yy+3).toFixed(1)+'" text-anchor="end">'+fmt(v,digits)+unit+'</text>';
 });

 const xLabels=a.map((p,i)=>{
   const label=p.age!==undefined&&p.age!==null?('روز '+fmt(p.age,0)):(p.week!==undefined&&p.week!==null?('هفته '+fmt(p.week,0)):(i+1));
   return '<text class="pi-chart-x-label" x="'+x(i).toFixed(1)+'" y="'+(h-8)+'" text-anchor="middle">'+esc(label)+'</text>';
 }).join('');

 const actualPath=a.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.actual).toFixed(1)).join(' ');
 const targetPath=a.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.target).toFixed(1)).join(' ');

 const points=a.map((p,i)=>{
   const c=pointColor(p),label=p.age!==undefined&&p.age!==null?'سن '+fmt(p.age,0)+' روز':(p.week!==undefined?'هفته '+fmt(p.week,0):'ارزیابی '+(i+1));
   const d=lowerIsBetter?(p.target-p.actual)/Math.abs(p.target):(p.actual-p.target)/Math.abs(p.target);
   const gapText=(d>0?'+':'')+fmt(d*100,1)+'٪';
   return '<g class="pi-chart-point" tabindex="0"><circle cx="'+x(i).toFixed(1)+'" cy="'+y(p.actual).toFixed(1)+'" r="5" fill="'+c+'" stroke="#fff" stroke-width="2"></circle><circle cx="'+x(i).toFixed(1)+'" cy="'+y(p.actual).toFixed(1)+'" r="9" fill="transparent"><title>'+esc(label)+' — واقعی: '+fmt(p.actual,digits)+unit+'؛ مرجع: '+fmt(p.target,digits)+unit+'؛ فاصله عملکردی: '+gapText+'</title></circle></g>';
 }).join('');

 const last=a.at(-1);
 const currentGap=lowerIsBetter?(last.target-last.actual)/Math.abs(last.target):(last.actual-last.target)/Math.abs(last.target);
 const currentLabel=(currentGap>0?'+':'')+fmt(currentGap*100,1)+'٪';
 const forecast=projected!==null&&last?(()=>{
   const projectedActual=lowerIsBetter?last.target*(1-projected/100):last.target*(1+projected/100);
   if(!Number.isFinite(projectedActual))return '';
   return '<line class="pi-chart-forecast" style="stroke:'+directionColor(f.direction)+'" x1="'+x(a.length-1).toFixed(1)+'" y1="'+y(last.actual).toFixed(1)+'" x2="'+(w-pr)+'" y2="'+y(projectedActual).toFixed(1)+'"></line>';
 })() : '';

 return '<svg class="pi-spark pi-smart-gap-chart" data-pi-render-version="V11.1" data-direction-mode="'+(lowerIsBetter?'lower-is-better':'higher-is-better')+'" data-trend-direction="'+esc(t.direction||'unknown')+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="روند '+esc(metricName(key))+' و مقایسه با '+esc(last.reference?.label||state.official?.reference?.label||'استاندارد سنی')+'">'+
   grid+
   '<path class="pi-chart-reference-line" d="'+targetPath+'"></path>'+
   '<path class="pi-chart-main-line" style="stroke:'+lineColor+'" d="'+actualPath+'"></path>'+
   forecast+points+xLabels+
   '<text class="pi-chart-zero-label" x="'+(w-pr)+'" y="11" text-anchor="end">فعلی نسبت به مرجع: '+currentLabel+'</text>'+
   '<text class="pi-chart-zero-label" x="'+px+'" y="'+(h-19)+'" text-anchor="start">— مرجع سنی</text>'+
   '<text class="pi-chart-zero-label" x="'+(px+54)+'" y="'+(h-19)+'" text-anchor="start">● واقعی</text>'+
   '</svg>';
}
function trendDashboard(m){
 const keys=['weight','fcr','cumulativeFcr','adg','mortality','cv','u10','u15'];
 return '<div class="pi-trend-chart-grid">'+keys.map(k=>{
   const q=m.states?.[k]||{},t=q.trend||{},f=q.forecast||{},ser=m.series?.[k]||[],status=q.official?.status||'unavailable';
   return '<article class="pi-trend-chart-card pi-status-'+esc(status)+' '+trendClass(t.direction)+'"><div class="pi-chart-head"><b>'+esc(metricName(k))+'</b><span class="'+trendClass(t.direction)+'">'+trendIcon(t.direction)+' '+esc(t.direction==='improving'?'بهبود':t.direction==='worsening'?'افت':t.direction==='stable'?'پایدار':'داده ناکافی')+'</span></div>'+sparkline(m,k)+'<div class="pi-chart-foot"><span>'+fmt(ser.length,0)+' ارزیابی</span><span>'+esc(t.movement==='closer'?'نزدیک‌تر به استاندارد سنی':t.movement==='better_farther'?'بهتر از استاندارد؛ فاصله عملکردی بیشتر':t.movement==='worse_farther'?'نامطلوب‌تر؛ فاصله از استاندارد بیشتر':t.movement==='crossed_to_better'?'عبور به سمت بهتر از استاندارد':t.movement==='crossed_to_worse'?'عبور به سمت نامطلوب':'فاصله عملکردی تقریباً ثابت')+'</span><span>'+esc(f?.available?'چشم‌انداز مشروط':'بدون چشم‌انداز')+'</span></div><div class="pi-chart-reference"><b>مبنای مقایسه:</b> '+esc(ser.at(-1)?.reference?.label||q?.official?.reference?.label||'استاندارد سنی معتبر')+'</div></article>';
 }).join('')+'</div>';
}
function forecastText(f){
 if(!f?.available)return 'برای این شاخص داده کافی برای چشم‌انداز مشروط وجود ندارد.';
 const d=f.direction==='improving'?'بهبود':f.direction==='worsening'?'افت':'ثبات';
 return 'در صورت تداوم الگوی اخیر، چشم‌انداز '+d+' است؛ عدم‌قطعیت برآورد حدود ±'+fmt(f.uncertaintyPercent,1)+' واحد درصد فاصله از مرجع است.';
}
function evidenceCard(x){
 return '<article class="pi-smart-insight '+esc(x.severity||'watch')+' pi-severity-'+esc(x.severity||'positive')+'"><div class="pi-insight-top"><span class="pi-badge">'+(x.severity==='high'?'مهم':x.severity==='watch'?'پایش':'مثبت')+'</span><b>'+esc(x.title)+'</b></div><p>'+esc(x.text)+'</p><small>شواهد: '+esc((x.evidence||[]).join(' • '))+'</small></article>';
}
function roadmap(m){
 const fs=m.forecastSummary||{},risk=fs.risk,imp=fs.improve;
 return '<div class="pi-roadmap pi-roadmap-colored"><div class="pi-roadmap-step roadmap-now"><span>۱</span><div><b>اکنون</b><p>تمرکز اصلی: '+esc(risk?risk.label:'پایش همه شاخص‌های اصلی')+'؛ بر اساس وضعیت فعلی و روند ثبت‌شده.</p></div></div><div class="pi-roadmap-step roadmap-next"><span>۲</span><div><b>ارزیابی بعدی</b><p>بررسی کن آیا روند فعلی ادامه یافته یا فاصله از مرجع تغییر جهت داده است؛ '+esc(imp?'ظرفیت بهبود: '+imp.label:'هنوز شاخص بهبود غالب مشخص نیست')+'.</p></div></div><div class="pi-roadmap-step roadmap-later"><span>۳</span><div><b>اگر روند ادامه یابد</b><p>'+esc(risk?'ریسک غالب: '+risk.label+'. این یک سناریوی مشروط است، نه پیش‌بینی قطعی.':'با داده فعلی ریسک غالب قابل تعیین نیست.')+'</p></div></div></div>';
}
function render(){const r=root(),m=global.__adinePerformanceIntelligenceModel;if(!r)return;if(!m?.ready){r.innerHTML='<section class="section"><div class="empty">برای هوش عملکرد، حداقل یک ارزیابی معتبر لازم است.</div></section>';return}const f=global.__adineReportFlock||{},s=m.states||{},ins=m.insights||[],p=m.profile||{};const radarVals=[p.growth,p.efficiency,p.survival,p.uniformity,s.epef?.official].map(radarValue),radarAngles=[0,Math.PI*2/5,Math.PI*4/5,Math.PI*6/5,Math.PI*8/5],radarPts=radarVals.map((v,i)=>radarPoint(v,radarAngles[i])).join(' '),radarDots=radarVals.map((v,i)=>{const q=radarPoint(v,radarAngles[i]).split(','),k=['weight','fcr','mortality','u10','epef'][i],label=['رشد','کارایی خوراک','بقا','یکنواختی','EPEF'][i],o=s[k]?.official||{},score=v,cur=o.current,t=o.target;return '<g class="pi-radar-point" tabindex="0" data-radar-key="'+k+'" data-radar-label="'+label+'" data-radar-current="'+(cur??'')+'" data-radar-target="'+(t??'')+'" data-radar-gap="'+(o.gapPercent??'')+'" aria-label="'+label+'"><circle class="pi-radar-hit" cx="'+q[0]+'" cy="'+q[1]+'" r="12"></circle><circle class="pi-radar-dot" cx="'+q[0]+'" cy="'+q[1]+'" r="5"></circle></g>'}).join(''),radarSvg='<svg viewBox="0 0 240 240" role="img" aria-label="نقشه تعادل عملکرد"><polygon class="pi-radar-ring" points="120,18 217,88 180,202 60,202 23,88"></polygon><polygon class="pi-radar-ring r2" points="120,43.5 192.7,96.5 165,181.3 75,181.3 47.3,96.5"></polygon><polygon class="pi-radar-ring r3" points="120,69 168.4,105.4 150,160.6 90,160.6 71.6,105.4"></polygon><polygon class="pi-radar-ring r4" points="120,94.5 144.2,114.2 135,139.9 105,139.9 95.8,114.2"></polygon><line class="pi-radar-axis" x1="120" y1="120" x2="120" y2="18"/><line class="pi-radar-axis" x1="120" y1="120" x2="217" y2="88"/><line class="pi-radar-axis" x1="120" y1="120" x2="180" y2="202"/><line class="pi-radar-axis" x1="120" y1="120" x2="60" y2="202"/><line class="pi-radar-axis" x1="120" y1="120" x2="23" y2="88"/><polygon class="pi-radar-data" points="'+radarPts+'"></polygon>'+radarDots+'</svg>';r.innerHTML='<div class="pi-intelligence" dir="rtl"><section class="pi-hero"><div class="pi-hero-main"><div class="pi-eyebrow">ADINE PERFORMANCE INTELLIGENCE • گوشتی</div><h2>هوش عملکرد گله</h2><p>تصمیم‌یار چندلایه برای وضعیت، روند، الگو، توزیع وزن و هشدار تطبیقی؛ با مرجع استاندارد مشترک.</p><div class="pi-meta"><span>سویه: <b>'+esc(f.strain||f.genetics||'—')+'</b></span><span>سن: <b>'+fmt(m.age,0)+' روز</b></span><span>ارزیابی معتبر: <b>'+fmt(m.coverage?.records,0)+'</b></span><span>سطح اعتماد: <b>'+esc(m.confidence)+'</b></span></div></div><div class="pi-status-card '+esc(m.status)+'"><span class="pi-status-ring"></span><strong>'+(m.status==='critical'?'نیازمند بررسی':m.status==='watch'?'نیازمند پایش':'وضعیت پایدار')+'</strong><small>'+fmt(ins.length,0)+' الگوی قابل توجه</small></div></section>'+
section('پروفایل عملکرد','نمای سریع چهار محور اصلی','<div class="pi-profile">'+[['رشد',p.growth],['کارایی خوراک',p.efficiency],['بقا',p.survival],['یکنواختی',p.uniformity]].map(x=>'<div class="pi-profile-row"><span>'+x[0]+'</span><div class="pi-profile-bar"><i class="'+bc(x[1]?.status)+'" style="width:'+Math.max(8,Math.min(100,50+(x[1]?.gapPercent||0)*3))+'%"></i></div><b>'+st(x[1]?.status)+'</b></div>').join('')+'</div>')+
section('نقشه تعادل عملکرد','نمای واقعی پنج محور نسبت به مرجع علمی سویه','<div class="pi-radar-wrap"><div class="pi-radar">'+radarSvg+'<span class="pi-radar-label l1">رشد</span><span class="pi-radar-label l2">کارایی خوراک</span><span class="pi-radar-label l3">بقا</span><span class="pi-radar-label l4">یکنواختی</span><span class="pi-radar-label l5">EPEF</span></div></div></div>')+section('مهم‌ترین یافته‌ها','الگوهای قابل توجه در داده‌های فعلی',ins.length?'<div class="pi-insights">'+ins.slice(0,6).map(x=>'<article class="pi-insight '+x.severity+'"><div class="pi-insight-top"><span class="pi-badge">'+(x.severity==='high'?'مهم':x.severity==='watch'?'پایش':'مثبت')+'</span><b>'+esc(x.title)+'</b></div><p>'+esc(x.text)+'</p><details><summary>منطق و محدودیت</summary><p>این تفسیر عملکردی از داده‌های ثبت‌شده است؛ از این داده‌ها به‌تنهایی تشخیص قطعی بیماری یا رابطه علّی استنباط نمی‌شود.</p></details></article>').join('')+'</div>':'<div class="pi-positive">الگوی هشداردهنده مهمی در داده‌های فعلی شناسایی نشد.</div>')+
section('تحلیل محدوده وزنی سلامت','محدوده‌ها حول وزن هدف رسمی سویه در سن ارزیابی ساخته شده‌اند',band(m))+
section('شاخص‌های کلیدی','آخرین ارزیابی در برابر مرجع علمی عملکرد',epefCard(s.epef)+'<div class="pi-metrics">'+metric('وزن',fmt(s.weight?.official?.current,0)+' گرم',s.weight?.official,'weight')+metric('FCR هفتگی',fmt(s.fcr?.official?.current,3),s.fcr?.official,'fcr')+metric('FCR تجمعی',fmt(s.cumulativeFcr?.official?.current,3),s.cumulativeFcr?.official,'cumulativeFcr')+metric('افزایش وزن',fmt(s.adg?.official?.current,1)+' گرم/هفته',s.adg?.official,'adg')+metric('تلفات',pct(s.mortality?.official?.current),s.mortality?.official,'mortality')+metric('CV',pct(s.cv?.official?.current),s.cv?.official,'cv')+metric('U10',pct(s.u10?.official?.current),s.u10?.official,'u10')+metric('U15',pct(s.u15?.official?.current),s.u15?.official,'u15')+'</div>')+
section('تحلیل چندشاخصی','تفسیر ترکیبی وضعیت فعلی؛ نه صرفاً بررسی تک‌عددها',
(()=>{
 const xs=m.multivariate||[],df=m.differential||[];
 if(!xs.length)return '<div class="pi-positive">در داده فعلی، الگوی ترکیبی با شواهد کافی شناسایی نشد. این به معنی نبود مشکل نیست؛ ممکن است سابقه یا داده کافی نباشد.</div>';
 return '<div class="pi-smart-summary">'+xs.slice(0,8).map((x,i)=>{
  const d=df.find(z=>z.code===x.code)||x;
  const sev=x.severity==='high'?'high':x.severity==='watch'?'watch':'positive';
  const causes=(d.differential||x.possibleCauses||[]).map(q=>typeof q==='string'?q:q.domain+': '+q.check).join(' • ');
  const checks=(d.checks||x.checks||'').toString();
  return '<article class="pi-smart-insight '+sev+' pi-severity-'+esc(x.severity||'positive')+'"><div class="pi-insight-top"><span class="pi-badge">'+(x.severity==='high'?'مهم':x.severity==='watch'?'پایش':'مثبت')+'</span><b>'+esc(x.title)+'</b></div><p>'+esc(x.text)+'</p><div class="pi-multi-evidence"><b>شواهد درگیر:</b> '+esc((x.evidence||[]).join(' • '))+'<br><b>علل قابل بررسی:</b> '+esc(causes)+'<br><b>داده تکمیلی لازم:</b> '+esc(checks)+'</div><small>سطح شواهد: '+esc(x.confidence||m.confidence)+' • این رابطه، تفسیری/ارتباطی است و علت قطعی را اثبات نمی‌کند.</small></article>';
 }).join('')+'</div><div class="pi-trend-method">منطق موتور: وضعیت هر شاخص، جهت و پایداری روند، فاصله از مرجع و هم‌زمانی شاخص‌ها به‌صورت ترکیبی بررسی می‌شود؛ سناریوها به‌صورت پویا از ترکیب وضعیت‌ها ساخته می‌شوند و محدود به فهرست ثابت چند حالت نیستند.</div>';
})(),'multivariate')+section('روند هوشمند','مسیر عملکرد، رابطه شاخص‌ها و چشم‌انداز مشروط ارزیابی بعدی',
 '<div class="pi-trend-intro"><b>روند هوشمند چه می‌گوید؟</b><span>این بخش تغییر یک عدد را جداگانه گزارش نمی‌کند؛ چند ارزیابی اخیر، فاصله از مرجع، هم‌جهتی شاخص‌ها و الگوهای مشترک را کنار هم می‌گذارد.</span></div>'+
 ((m.trendInsights||[]).length?'<div class="pi-smart-summary">'+(m.trendInsights||[]).slice(0,4).map(evidenceCard).join('')+'</div>':'<div class="pi-positive">در داده‌های موجود، الگوی چندشاخصی قابل توجهی شناسایی نشد.</div>')+
 '<div class="pi-subtitle-row pi-subtitle-reference"><b>روند نسبت به استاندارد سنی</b><small>خط صفر = استاندارد همان سن • بالای صفر = بهتر از استاندارد • زیر صفر = ضعیف‌تر از استاندارد • خط نقطه‌چین = چشم‌انداز مشروط</small></div>'+trendDashboard(m)+
 '<div class="pi-outlook"><div class="pi-outlook-risk pi-outlook-risk-v2"><span>ریسک محتمل در ارزیابی بعدی</span><b>'+esc(m.forecastSummary?.risk?.label||'قابل تعیین نیست')+'</b><small>'+esc(forecastText(m.forecastSummary?.risk?.forecast))+'</small></div><div class="pi-outlook-improve pi-outlook-improve-v2"><span>شاخص دارای ظرفیت بهبود</span><b>'+esc(m.forecastSummary?.improve?.label||'قابل تعیین نیست')+'</b><small>'+esc(forecastText(m.forecastSummary?.improve?.forecast))+'</small></div></div>'+
 '<div class="pi-subtitle-row pi-roadmap-title"><b>نقشه راه تصمیم</b><small>از مشاهده فعلی تا ارزیابی بعدی</small></div>'+roadmap(m)+
 '<details class="pi-trend-details"><summary>جدول شواهد و روند همه شاخص‌ها</summary><div class="pi-table-wrap"><table class="pi-trend-table"><thead><tr><th>شاخص</th><th>آخرین فاصله</th><th>شیب اخیر</th><th>حرکت نسبت به استاندارد سنی</th><th>مبنای مقایسه</th><th>چشم‌انداز</th><th>تعداد نقاط</th></tr></thead><tbody>'+
 ['weight','fcr','cumulativeFcr','adg','mortality','cv','u10','u15'].map(k=>{const q=m.states?.[k]||{},t=q.trend||{},f=q.forecast||{};return '<tr class="pi-row-status-'+esc(q.official?.status||'unavailable')+'"><td>'+esc(metricName(k))+'</td><td>'+esc(q.official?.gapPercent===null?'—':fmt(q.official?.gapPercent,1)+'٪')+'</td><td>'+esc(t.available?(t.direction==='improving'?'مثبت':t.direction==='worsening'?'منفی':'تقریباً صفر'):'—')+'</td><td>'+esc(t.movement==='closer'?'نزدیک‌تر':t.movement==='better_farther'?'بهتر؛ فاصله بیشتر':t.movement==='worse_farther'?'بدتر؛ فاصله بیشتر':t.movement==='crossed_to_better'?'عبور به سمت بهتر':t.movement==='crossed_to_worse'?'عبور به سمت نامطلوب':t.movement==='stable'?'ثابت':'—')+'</td><td>'+esc(q.official?.reference?.label||'—')+'</td><td>'+esc(f.available?(f.direction==='improving'?'بهبود':f.direction==='worsening'?'افت':'ثبات'):'—')+'</td><td>'+fmt(t.pointsUsed||0,0)+'</td></tr>'}).join('')+
 '</tbody></table></div></details>'+
 '<div class="pi-trend-method">مبنای مقایسه در هر نقطه، استاندارد معتبر همان سن است؛ «نزدیک‌تر/دورتر» به معنی تغییر فاصله از استاندارد سنی همان ارزیابی است، نه مقایسه با روز قبل. روندهای اخیر، الگوهای چندشاخصی و پیش‌بینی مقاوم به‌صورت مشروط بررسی می‌شوند. با داده کم یا نوسان زیاد، سطح اطمینان کاهش می‌یابد و نتیجه قطعی اعلام نمی‌شود.</div>','trend')+section('هشدار تطبیقی','تشخیص تغییر غیرعادی نسبت به سابقه خود گله، همراه با شواهد و اولویت بررسی',
 (()=>{
  const warnings=[];
  const names={weight:'وزن',fcr:'FCR',cumulativeFcr:'FCR تجمعی',adg:'افزایش وزن',mortality:'تلفات',cv:'CV',u10:'U10',u15:'U15'};
  Object.keys(names).forEach(k=>{const a=m.adaptive?.[k];if(a?.available&&(a.anomaly||a.ewmaAnomaly||a.cusumAnomaly))warnings.push({key:k,name:names[k],a,kind:'adaptive'})});
  (m.trendInsights||[]).filter(x=>x.severity==='high').forEach(x=>warnings.push({key:x.type,name:x.title,kind:'pattern',x}));(m.multivariate||[]).filter(x=>x.severity==='high').forEach(x=>warnings.push({key:x.code,name:x.title,kind:'pattern',x}));
  const unique=warnings.slice(0,4);
  const confidence=m.confidence==='high'?'بالا':m.confidence==='medium'?'متوسط':m.confidence==='limited'?'محدود':'پایین';
  if(!unique.length)return '<div class="pi-no-alert"><b>هشدار تطبیقی فعالی شناسایی نشد.</b><span>با سابقه فعلی، تغییر غیرعادی یا الگوی چندشاخصی پررنگی شناسایی نشده است. سطح اطمینان این نتیجه: '+confidence+'.</span></div>';
  return '<div class="pi-adaptive-basis"><b>مبنای هشدار تطبیقی:</b> سابقه خود گله در ارزیابی‌های قبلی، با خط پایه مقاوم Median/MAD و پایش EWMA/CUSUM؛ این بخش با «استاندارد رسمی/مدیریتی همان سن» یکی نیست.</div><div class="pi-alert-list">'+unique.map(w=>{
   if(w.kind==='pattern')return '<article class="pi-alert-card high pi-alert-pattern"><div class="pi-alert-head"><span>مهم</span><b>'+esc(w.name)+'</b></div><div class="pi-alert-grid"><div><small>چه اتفاقی افتاده؟</small><p>'+esc(w.x.text)+'</p></div><div><small>شواهد</small><p>'+esc((w.x.evidence||[]).join(' • '))+'</p></div><div><small>چرا مهم است؟</small><p>هم‌جهتی چند شاخص، اهمیت الگو را بیشتر می‌کند؛ این داده‌ها علت قطعی را تعیین نمی‌کنند.</p></div><div><small>اولویت بررسی</small><p>'+esc(w.x.action||'روند شاخص‌های درگیر، خوراک، آب، محیط، مدیریت و سلامت متناسب با شرایط گله بررسی شود.')+'</p></div></div></article>';
   const a=w.a,method=[a.anomaly?'انحراف مقاوم':null,a.ewmaAnomaly?'EWMA':null,a.cusumAnomaly?'CUSUM':null].filter(Boolean).join(' + ');
   return '<article class="pi-alert-card '+((a.anomaly||a.cusumAnomaly)?'high':a.ewmaAnomaly?'watch':'positive')+'"><div class="pi-alert-head"><span>'+((a.anomaly||a.cusumAnomaly)?'مهم':'پایش')+'</span><b>'+esc(w.name)+' از الگوی معمول گله فاصله گرفته است</b></div><div class="pi-alert-grid"><div><small>چه اتفاقی افتاده؟</small><p>ارزیابی اخیر با خط پایه تاریخی خود گله اختلاف غیرمعمول نشان داده است.</p></div><div><small>شواهد عددی</small><p>فعلی: '+fmt(a.currentGapPercent,1)+'٪ • خط پایه: '+fmt(a.baselineMedianPercent,1)+'٪ • حد مقاوم: '+fmt(a.controlLimitPercent,1)+'٪</p></div><div><small>روش تشخیص</small><p>'+esc(method||'انحراف مقاوم نسبت به خط پایه')+'</p></div><div><small>اولویت بررسی</small><p>ارزیابی مجدد در ثبت بعدی و بررسی عوامل مرتبط با شاخص؛ از نسبت دادن علت قطعی بدون داده تکمیلی خودداری شود.</p></div></div></article>';
  }).join('')+'</div><div class="pi-alert-method">هشدار تطبیقی از خط پایه تاریخی گله، انحراف مقاوم و در صورت کافی بودن داده از EWMA/CUSUM استفاده می‌کند. حداقل ۴ ارزیابی برای فعال‌شدن خط پایه لازم است.</div>';
 })(),'adaptive')+section('منبع، اعتماد و محدودیت','استاندارد و داده از منبع استاندارد مشترک','<div class="pi-note"><b>منبع استاندارد:</b> '+esc(m.targetAuthority)+'<br><b>رکوردها:</b> '+fmt(m.coverage?.records,0)+' • <b>اهداف مرجع علمی:</b> '+fmt(m.coverage?.canonicalTargets,0)+' • <b>نمونه وزن:</b> '+fmt(m.coverage?.weightSamples,0)+' قطعه<br><br>هوش عملکرد هیچ استاندارد رسمی یا مدیریتی مستقلی تعریف نمی‌کند. مقادیر مرجع از منبع استاندارد مشترک دریافت می‌شوند و در نبود داده کافی، سیستم نتیجه‌گیری را محدود می‌کند.</div>')+'</div>';bind()}
function bind(){document.querySelectorAll('.pi-accordion-head').forEach(b=>b.addEventListener('click',()=>{const e=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!e));b.nextElementSibling.hidden=e;b.querySelector('i').textContent=e?'⌄':'⌃'}));document.querySelectorAll('[data-band]').forEach(b=>b.addEventListener('click',()=>{const x=global.__adinePerformanceIntelligenceModel.weightBand;if(!x)return;const k=b.dataset.band,n=k==='10'?['داخل ±۱۰٪',x.within10,x.within10Percent]:k==='mid'?['بین ±۱۰ تا ±۱۵٪',x.between10and15,x.between10and15Percent]:['خارج ±۱۵٪',x.outside15,x.outside15Percent],z=document.getElementById('piBandNote');if(z)z.textContent=n[0]+': '+fmt(n[1],0)+' قطعه • '+pct(n[2])+' از '+fmt(x.sampleCount,0)+' نمونه • مرجع: '+fmt(x.referenceWeight,0)+' گرم'}));
document.querySelectorAll('[data-weight-point]').forEach(p=>p.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();document.querySelectorAll('.pi-weight-point.selected').forEach(x=>x.classList.remove('selected'));p.classList.add('selected');const z=document.getElementById('piWeightSelected');const w=n(p.dataset.weight);if(z&&w!==null){const m=global.__adinePerformanceIntelligenceModel,b=m.weightBand,t=b?.referenceWeight,g=t?((w-t)/t*100):null;const pos=w>=t*0.9&&w<=t*1.1?'داخل ±۱۰٪':w>=t*0.85&&w<=t*1.15?'بین ±۱۰ تا ±۱۵٪':'خارج ±۱۵٪';z.innerHTML='<b>نمونه '+fmt((Number(p.dataset.weightIndex)||0)+1,0)+' از '+fmt(b.sampleCount,0)+' • '+fmt(w,0)+' گرم</b><span>فاصله از وزن مرجع: '+(g===null?'—':fmt(g,1)+'٪')+'</span><span>وضعیت محدوده: '+pos+'</span>'}}));}
global.AdineBroilerPerformanceIntelligenceReport={version:'V11.1',render};
})(typeof window!=='undefined'?window:globalThis);