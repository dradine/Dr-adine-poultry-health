# ممیزی نهایی نسخه متخصصان فارم

## موارد اصلاح‌شده
- مسیر ورود حساب‌های حرفه‌ای به `professional.html` اصلاح شد.
- خطای JavaScript در `login.js` که از متغیر تعریف‌نشده `user` استفاده می‌کرد برطرف شد؛ این خطا می‌توانست بعد از ورود موفق مانع redirect شود.
- `Dashboard.html` برای جلوگیری از ورود دامپزشک/آزمایشگاه/کارشناس فنی به داشبورد مرغدار Guard دارد.
- پنل متخصصان به‌جای بازکردن مستقیم `weekly.html`، ابتدا `professional-farm.html` را باز می‌کند تا فارم و سپس گله مشخص شود.
- `professional-farm.html/js` اضافه شد؛ دسترسی فعال از Supabase بررسی می‌شود و گله‌ها از همان فارم خوانده می‌شوند.
- قبل از بازکردن هفتگی/سلامت/گزارش، `farmId` و `flockId` در انتخاب جاری ثبت می‌شوند.
- لینک‌های محلی خراب در `main.html` اصلاح شدند.
- همه فایل‌های JavaScript با `node --check` بررسی شدند.
- تمام ارجاعات محلی HTML به فایل‌های موجود بررسی شدند.
- شناسه‌های تکراری HTML بررسی شدند.

## تست‌های انجام‌شده
- JavaScript syntax: PASS
- Local HTML/CSS/JS references: PASS
- Duplicate HTML ids: PASS
- Role routing static audit: PASS
- Professional farm workspace access guard: PASS

## الزام Supabase
فایل `professional_access_compatibility.sql` برای هماهنگی نام `diagnostic_lab` در اتصال فارم با پروفایل‌های قدیمی `veterinary_lab` نگه داشته شده است. این migration باید در Supabase اجرا شود تا مجوز آزمایشگاه نیز با ساختار فعلی کاملاً هماهنگ باشد.

## سناریوی اصلی
مرغدار → کد حرفه‌ای → انتخاب نوع متخصص → درخواست pending → متخصص تأیید → active → مشاهده فارم → انتخاب گله → هفتگی/سلامت/گزارش → قطع دسترسی توسط مالک → عدم دسترسی مجدد متخصص.
