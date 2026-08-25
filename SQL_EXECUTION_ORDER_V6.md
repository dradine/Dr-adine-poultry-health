# ترتیب اجرای SQL نسخه V6

## 1) Benchmark V6
فایل زیر را **یک بار** در Supabase SQL Editor اجرا کنید:

`BENCHMARK_V6_CORE.sql`

این migration فقط توابع جدید V6 و ایندکس‌های لازم را ایجاد می‌کند و به توابع V5 دست نمی‌زند؛ بنابراین در صورت rollback می‌توان توابع V6 را حذف کرد.

## 2) تست سریع
پس از اجرای SQL، یک گله واقعی را در صفحه گزارش باز کنید. اگر کمتر از ۱۰ فارم مستقل مشابه داده معتبر داشته باشید، باید پیام «داده کافی برای بنچمارک وجود ندارد» دیده شود. این رفتار عمدی است.

## 3) نکته مهم
بنچمارک داخلی با استاندارد رسمی/مدیریتی جایگزین نمی‌شود. امتیاز جایگاه فقط از جامعه‌ای با حداقل ۲۰ فارم مستقل وارد امتیاز نهایی می‌شود؛ زیر ۲۰ فارم فقط مقایسه اولیه نمایش داده می‌شود.


## 3) Owner management patch — V5
Before testing Owner > User Details, run `OWNER_MANAGEMENT_BENCHMARK_V5.sql` once.
This patch only adds missing `profiles.user_type` / `profiles.activity_types` columns when absent, backfills compatible professional data, and installs the enum-safe owner save RPC.
