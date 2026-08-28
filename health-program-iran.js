/* ADINEH HEALTH | Iran-oriented vaccination program templates
 * UI recommendation layer only. It never creates a medical order or replaces the flock veterinarian.
 * Dates remain ISO in storage; all visible dates are handled by health-date-picker.js.
 * Base design: local challenge + maternal antibodies + licensed product leaflet + veterinarian approval.
 */
(function(){
  'use strict';
  const programs={
    broiler:{label:'گوشتی',items:[
      {age:'روز ۱',target:'مارک',status:'core',note:'واکسن روز اول طبق برنامه جوجه‌کشی و محصول مجاز؛ نوع واکسن و روش اجرا بر اساس بروشور.'},
      {age:'روز ۱',target:'نیوکاسل',status:'core',note:'قالب پایه برای ایجاد ایمنی مخاطی؛ در ایران انتخاب سویه/روش با برنامه منطقه‌ای و واکسن مجاز هماهنگ شود.'},
      {age:'روز ۷–۱۲',target:'نیوکاسل',status:'core',note:'تقویت ND؛ زمان دقیق با MDA، فشار بیماری و برنامه دامپزشک تنظیم شود.'},
      {age:'روز ۱۰–۱۸',target:'گامبورو (IBD)',status:'core',note:'سن بر اساس MDA/تیتر مادری و نوع واکسن تعیین شود؛ از تقویم ثابت استفاده نشود.'},
      {age:'روز ۱۴–۲۱',target:'برونشیت عفونی (IB)',status:'conditional',note:'بر اساس سویه‌های در گردش منطقه و برنامه فارم؛ در صورت نیاز تطابق سویه واکسن بررسی شود.'},
      {age:'روز ۱۸–۲۸',target:'گامبورو (IBD) تقویتی',status:'conditional',note:'فقط در صورت نیاز اپیدمیولوژیک/سرولوژیک و مطابق واکسن مورد استفاده.'},
      {age:'سن متغیر',target:'آنفلوانزای پرندگان H9N2',status:'conditional',note:'فقط در صورت وجود برنامه مجاز، فشار بیماری و تصمیم دامپزشک؛ نباید به‌عنوان الزام عمومی نمایش داده شود.'}
    ]},
    pullet:{label:'پولت',items:[
      {age:'روز ۱',target:'مارک',status:'core',note:'بر اساس برنامه جوجه‌کشی و واکسن مجاز.'},
      {age:'روز ۱',target:'نیوکاسل + برونشیت عفونی',status:'core',note:'قالب پایه؛ سویه‌ها و روش بر اساس برنامه منطقه‌ای و بروشور محصول.'},
      {age:'روز ۷–۱۲',target:'نیوکاسل',status:'core',note:'تقویت ایمنی؛ زمان با وضعیت MDA و فشار بیماری تنظیم شود.'},
      {age:'روز ۱۰–۱۸',target:'گامبورو (IBD)',status:'core',note:'بر اساس تیتر مادری و نوع واکسن.'},
      {age:'روز ۱۸–۲۸',target:'گامبورو (IBD) تقویتی',status:'conditional',note:'بر اساس برنامه سرولوژی/چالش فارم.'},
      {age:'هفته ۴–۶',target:'نیوکاسل + برونشیت عفونی',status:'core',note:'تقویت دوره پرورش؛ سویه و روش با برنامه دامپزشک.'},
      {age:'هفته ۶–۱۰',target:'آبله',status:'conditional',note:'در مناطق/سیستم‌های پرریسک یا طبق برنامه فارم.'},
      {age:'هفته ۸–۱۲',target:'آنفلوانزا H9N2',status:'conditional',note:'فقط در برنامه مجاز و بر اساس فشار بیماری و سیاست دامپزشکی.'},
      {age:'هفته ۱۲–۱۶',target:'نیوکاسل/برونشیت پیش از انتقال',status:'core',note:'تقویت پیش از ورود به سالن تولید؛ انتخاب واکسن و فاصله با واکسن‌های زنده طبق بروشور.'}
    ]},
    layer:{label:'تخمگذار',items:[
      {age:'روز ۱',target:'مارک',status:'core',note:'طبق برنامه جوجه‌کشی.'},
      {age:'روز ۱',target:'نیوکاسل + برونشیت عفونی',status:'core',note:'قالب پایه؛ سویه و روش بر اساس چالش منطقه.'},
      {age:'روز ۷–۱۲',target:'نیوکاسل',status:'core',note:'تقویت اولیه.'},
      {age:'روز ۱۰–۱۸',target:'گامبورو (IBD)',status:'core',note:'با MDA و واکسن مورد استفاده زمان‌بندی شود.'},
      {age:'روز ۱۸–۲۸',target:'گامبورو (IBD) تقویتی',status:'conditional',note:'در صورت نیاز بر اساس سرولوژی/چالش.'},
      {age:'هفته ۴–۶',target:'نیوکاسل + برونشیت',status:'core',note:'تقویت دوره پرورش.'},
      {age:'هفته ۶–۱۰',target:'آبله',status:'conditional',note:'بر اساس منطقه، سابقه فارم و برنامه دامپزشک.'},
      {age:'هفته ۸–۱۲',target:'H9N2',status:'conditional',note:'فقط در برنامه مجاز و متناسب با فشار بیماری.'},
      {age:'هفته ۱۲–۱۴',target:'نیوکاسل + برونشیت',status:'core',note:'تقویت پیش از تولید.'},
      {age:'هفته ۱۴–۱۶',target:'واکسن کشته چندگانه پیش از تولید',status:'conditional',note:'در گله‌های تخمگذار بر اساس برنامه سازنده، آنتی‌ژن‌های مورد نیاز و نظر دامپزشک.'},
      {age:'پیش از شروع تولید',target:'کنترل تیتر/یکنواختی ایمنی',status:'core',note:'نمونه‌گیری و تفسیر سرولوژی برای اصلاح برنامه آینده.'},
      {age:'دوره تولید',target:'نیوکاسل/برونشیت تقویتی',status:'conditional',note:'بر اساس افت تیتر، فشار بیماری، محصول مجاز و برنامه دامپزشک؛ تقویم ثابت نیست.'}
    ]},
    breeder:{label:'مادر',items:[
      {age:'روز ۱',target:'مارک',status:'core',note:'طبق برنامه جوجه‌کشی.'},
      {age:'روز ۱',target:'نیوکاسل + برونشیت عفونی',status:'core',note:'قالب پایه؛ سویه و روش بر اساس منطقه و برنامه جوجه‌کشی.'},
      {age:'روز ۷–۱۲',target:'نیوکاسل',status:'core',note:'تقویت اولیه.'},
      {age:'روز ۱۰–۱۸',target:'گامبورو (IBD)',status:'core',note:'سن تابع MDA و واکسن است.'},
      {age:'روز ۱۸–۲۸',target:'گامبورو تقویتی',status:'conditional',note:'بر اساس MDA/سرولوژی و چالش.'},
      {age:'هفته ۴–۶',target:'نیوکاسل + برونشیت',status:'core',note:'تقویت دوره پرورش.'},
      {age:'هفته ۶–۱۰',target:'آبله',status:'conditional',note:'بر اساس ریسک منطقه و برنامه دامپزشک.'},
      {age:'هفته ۸–۱۲',target:'H9N2',status:'conditional',note:'فقط در برنامه مجاز و متناسب با فشار بیماری.'},
      {age:'هفته ۱۰–۱۴',target:'واکسن‌های اختصاصی گله مادر',status:'core',note:'بر اساس آنتی‌ژن‌های هدف و برنامه شرکت/دامپزشک.'},
      {age:'هفته ۱۴–۱۶',target:'نیوکاسل + برونشیت تقویتی',status:'core',note:'پیش از واکسن‌های کشته و ورود به مرحله پیش‌تولید.'},
      {age:'هفته ۱۶–۱۸',target:'واکسن کشته چندگانه پیش از تولید',status:'core',note:'برای ایجاد و یکنواخت‌سازی ایمنی مادری؛ ترکیب آنتی‌ژن‌ها باید مطابق برنامه اختصاصی گله باشد.'},
      {age:'هفته ۱۸–۲۰',target:'کنترل تیتر مادری/یکنواختی',status:'core',note:'ارزیابی سرولوژیک برای اطمینان از یکنواختی ایمنی و پیش‌بینی MDA جوجه.'},
      {age:'دوره تولید',target:'تقویت‌های دوره تولید',status:'conditional',note:'بر اساس افت تیتر، فشار بیماری و برنامه دامپزشک؛ از تقویم ثابت عمومی استفاده نشود.'}
    ]}
  };
  const faDigits=s=>String(s??'').replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
  function prodKey(){
    const txt=(document.getElementById('prodMetric')?.textContent||'').trim().toLowerCase();
    if(/مادر|breeder|parent/.test(txt)) return 'breeder';
    if(/پولت|pullet/.test(txt)) return 'pullet';
    if(/تخم|layer|egg/.test(txt)) return 'layer';
    return 'broiler';
  }
  function render(){
    const sel=document.getElementById('programSelect'), box=document.getElementById('programTimeline');
    if(!sel||!box)return;
    if(!sel.dataset.iranProgram){
      sel.innerHTML=Object.entries(programs).map(([k,p])=>`<option value="${k}">${p.label}</option>`).join('');
      sel.dataset.iranProgram='1';
      sel.addEventListener('change',()=>paint(sel.value));
    }
    const k=prodKey(); sel.value=k; paint(k);
  }
  function paint(k){
    const box=document.getElementById('programTimeline'); if(!box)return;
    const p=programs[k]||programs.broiler;
    box.innerHTML=p.items.map(x=>`<div class="timeline-item"><div class="timeline-age">${x.age.replace(/\d+/g,m=>faDigits(m))}</div><div class="timeline-main"><b>${x.target}</b><small>${x.note}</small></div><span class="tag ${x.status==='core'?'core':x.status==='conditional'?'conditional':'optional'}">${x.status==='core'?'هسته پایه':x.status==='conditional'?'مشروط':'اختیاری'}</span></div>`).join('');
  }
  function boot(){
    const run=()=>setTimeout(render,0);
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
    window.addEventListener('load',run);
  }
  boot();
})();
