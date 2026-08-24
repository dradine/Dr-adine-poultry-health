# اصلاح صفحه مدیریت V2

## مشکل ۱: professional_profiles_user_type_check
علت اصلی این بود که صفحه مدیریت برای هر کاربر مقدار `user_type` را داخل `professional_profiles` نیز upsert می‌کرد؛ در حالی که این جدول فقط انواع کاربری حرفه‌ای مجاز را می‌پذیرد. بنابراین برای کاربرانی مثل بهره‌بردار واحد طیور/مدیر واحد یا `other` خطای CHECK ایجاد می‌شد.

در V2:
- `profiles.user_type` مرجع اصلی نوع کاربری است.
- فقط این انواع وارد `professional_profiles` می‌شوند:
  - veterinarian
  - technical_veterinarian
  - veterinary_lab
  - diagnostic_lab
  - poultry_technical_expert
- برای سایر کاربران، عملیات professional profile انجام نمی‌شود.
- ذخیره تغییرات به یک RPC اتمیک منتقل شده است.

## مشکل ۲: ورود و خروج سریع
صفحه owner دیگر به `auth.js` عمومی وابسته نیست تا guard عمومی صفحه باعث خروج/redirect ناخواسته مالک نشود. `owner.js` خودش session را با Supabase نگه می‌دارد و در صورت نبود session فقط خطای واقعی session را اعلام می‌کند.

## ترتیب اجرا
1. در Supabase SQL Editor فقط `OWNER_MANAGEMENT_FIX_V2.sql` را اجرا کنید.
2. `owner.html` و `owner.js` را جایگزین نسخه فعلی کنید.
3. مطمئن شوید `config.js` در کنار فایل‌ها باقی بماند.
4. مرورگر را با پاک‌کردن cache یا hard refresh باز کنید.

## تست پیشنهادی
- یک کاربر بهره‌بردار را باز کنید و فقط نام را تغییر دهید.
- یک کاربر حرفه‌ای دامپزشک را باز کنید و نوع کاربری/اطلاعات حرفه‌ای را تغییر دهید.
- یک کاربر `other` را ذخیره کنید.
- صفحه را refresh کنید.
- خارج شوید و دوباره وارد شوید.

در هیچ‌کدام نباید `professional_profiles_user_type_check` ایجاد خطا کند.
