section('هشدار تطبیقی','کشف تغییرات غیرعادی نسبت به سابقه خود گله؛ نه یک آستانه جهانی ثابت',(()=>{
 const warnings=[];
 const names={weight:'وزن',fcr:'FCR',cumulativeFcr:'FCR تجمعی',adg:'افزایش وزن',mortality:'تلفات',cv:'CV',u10:'U10',u15:'U15',epef:'EPEF'};
 for(const k of Object.keys(names)){const x=m.adaptive?.[k];if(x?.available&&x.anomaly)warnings.push({key:k,name:names[k],level:Math.abs(x.currentGapPercent-x.baselineMedianPercent)>x.controlLimitPercent*1.5?'مهم':'پایش',delta:x.currentGapPercent-x.baselineMedianPercent,x});}
 const pattern=(m.trendInsights||[]).filter(x=>x.severity==='high');
 pattern.forEach(x=>warnings.push({key:x.type,name:x.title,level:'مهم',pattern:true,x}));
 const unique=warnings.slice(0,4);
 if(!unique.length)return '<div class="pi-no-alert"><b>هشدار تطبیقی فعالی شناسایی نشد.</b><span>روند فعلی نسبت به سابقه موجود، الگوی غیرعادی معناداری نشان نمی‌دهد؛ پایش دوره‌ای ادامه یابد.</span></div>';
 return '<div class="pi-alert-list">'+unique.map(w=>{
   if(w.pattern)return '<article class="pi-alert-card high"><div class="pi-alert-head"><span>مهم</span><b>'+esc(w.name)+'</b></div><div class="pi-alert-grid"><div><small>چه اتفاقی افتاده؟</small><p>'+esc(w.x.text)+'</p></div><div><small>شواهد</small><p>'+esc((w.x.evidence||[]).join(' • '))+'</p></div><div><small>چرا مهم است؟</small><p>هم‌جهتی چند شاخص، اهمیت این الگو را بیشتر می‌کند؛ علت قطعی از داده فعلی قابل تعیین نیست.</p></div><div><small>اولویت بررسی</small><p>بررسی همزمان داده‌های خوراک، آب، محیط، سلامت و مدیریت متناسب با شاخص درگیر.</p></div></div></article>';
   const x=w.x;
   return '<article class="pi-alert-card '+(w.level==='مهم'?'high':'watch')+'"><div class="pi-alert-head"><span>'+w.level+'</span><b>'+esc(w.name)+' خارج از الگوی معمول گله</b></div><div class="pi-alert-grid"><div><small>چه اتفاقی افتاده؟</small><p>فاصله شاخص در ارزیابی اخیر با سابقه خود گله تفاوت غیرمعمول دارد.</p></div><div><small>شواهد عددی</small><p>فعلی: '+fmt(x.currentGapPercent,1)+'٪ • میانه سابقه: '+fmt(x.baselineMedianPercent,1)+'٪ • حد کنترل: '+fmt(x.controlLimitPercent,1)+'٪</p></div><div><small>چرا مهم است؟</small><p>این تغییر می‌تواند نشانه شروع یک روند جدید باشد و ارزش بررسی زودهنگام دارد.</p></div><div><small>اولویت بررسی</small><p>ارزیابی روند شاخص در ثبت بعدی و بررسی عوامل مدیریتی مرتبط؛ بدون نسبت دادن علت قطعی.</p></div></div></article>';
 }).join('')+'</div><div class="pi-alert-method">هشدار تطبیقی از سابقه خود گله و انحراف مقاوم نسبت به میانه تاریخی استفاده می‌کند؛ با سابقه کمتر از ۴ ارزیابی، تشخیص ناهنجاری فعال نمی‌شود.</div>';
})())+