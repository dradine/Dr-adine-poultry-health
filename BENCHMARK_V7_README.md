# Flock Benchmark V7

## وضعیت

V7 جایگزین مفهومی «Farm Benchmark» با **Flock Benchmark** شده است. در رابط کاربری و منطق مقایسه از واژه «گله» استفاده می‌شود؛ شناسه `farm_id` فقط در Backend برای استقلال آماری، امنیت و جلوگیری از وزن‌دهی بیش از حد به یک واحد تولیدی باقی می‌ماند.

## اصول علمی

- استاندارد ژنتیکی/رسمی از Peer Benchmark جداست.
- سن مرجع از تاریخ‌های واقعی گله و رکورد ارزیابی محاسبه می‌شود؛ `week_number` مرجع اصلی نیست.
- پنجره سن برای هر Metric مستقل است.
- Cohort به ترتیب `exact → genetics → production` تنزل می‌کند و تنزل فقط در صورت عبور از آستانه نمونه مجاز است.
- حداقل نمایش: 10 گله معتبر + 5 واحد مستقل.
- حداقل Peer Score: 20 گله معتبر + 10 واحد مستقل.
- Benchmark پایدار: 50 گله معتبر + 20 واحد مستقل.
- هر واحد مستقل فقط یک سهم آماری دارد؛ بنابراین چند گله یک واحد تولیدی Benchmark را منحرف نمی‌کنند.
- P10/P25/Median/P75/P90 و IQR محاسبه می‌شوند.
- Body Weight شاخص Context است و به‌صورت «بهتر/بدتر» رتبه‌بندی نمی‌شود.
- Uniformity و CV در یک Domain قرار گرفته‌اند تا یک مشکل یکنواختی دوبار وزن‌دهی نشود.
- داده خارج از محدوده معتبر وارد محاسبه Benchmark نمی‌شود و داده خام حذف نمی‌شود.
- Peer Score فقط با جامعه کافی فعال می‌شود.
- Confidence از حجم نمونه، استقلال واحدها، پنجره سن و کامل‌بودن داده‌ها جدا از Peer Percentile محاسبه می‌شود.
- دسترسی تابع بر اساس مالکیت واحد یا دسترسی حرفه‌ای فعال کنترل می‌شود.

## مدل‌های چهارگانه

### گوشتی
Growth, Efficiency, Survival, Uniformity, Water

### پولت
Growth-to-Target, Uniformity, Survival, Efficiency, Water

### تخمگذار
Production, Egg Quality, Efficiency, Survival, Growth

### مادر
Reproduction, Egg Output, Hatchability/Fertility, Survival, Uniformity, Growth

## RPCها

- `public.get_flock_benchmark_v7(uuid,text)` — یک Metric
- `public.get_flock_benchmark_matrix_v7(uuid)` — ماتریس کامل گله
- `public.normalize_flock_production_type_v7(text)` — نرمال‌سازی امن نوع پرورش

## نکته اجرایی

V6 حذف نشده است تا Regression ناخواسته ایجاد نشود. V7 به‌صورت additive در Supabase مستقر شده و UI باید برای نمایش Benchmark جدید به RPCهای V7 متصل شود.

## منابع مرجع

استانداردها باید با نسخه/سال/منبع Performance Objectives رسمی ژنتیک ثبت شوند. منابع مرجع اصلی بررسی‌شده شامل Aviagen/Ross، Cobb و Hy-Line هستند.
