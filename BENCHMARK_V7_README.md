# Flock Benchmark V7

## وضعیت

V7 جایگزین مفهومی «Farm Benchmark» با **Flock Benchmark** شده است. در رابط کاربری و منطق مقایسه از واژه «گله» استفاده می‌شود؛ شناسه `farm_id` فقط در Backend برای استقلال آماری، امنیت و جلوگیری از وزن‌دهی بیش از حد به یک واحد تولیدی باقی می‌ماند.

## اصول علمی

- استاندارد ژنتیکی/رسمی از Peer Benchmark جداست.
- سن مرجع از تاریخ ارزیابی/ثبت واقعی و سن شروع گله محاسبه می‌شود؛ `week_number` مرجع اصلی نیست.
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
- Confidence از حجم نمونه و استقلال واحدها جدا از Peer Percentile محاسبه می‌شود.
- دسترسی تابع بر اساس مالکیت واحد یا دسترسی حرفه‌ای فعال کنترل می‌شود.
- عدد ساختگی برای استاندارد ژنتیکی تولید نمی‌شود. اگر استاندارد رسمی/مدیریتی نسخه‌دار در Registry وجود نداشته باشد، مقدار استاندارد `null` می‌ماند.

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

## اصلاحات بحرانی V7

- انتخاب سن فعلی بر اساس تاریخ ارزیابی/رکورد، نه ترتیب تصادفی `created_at` در رکوردهای هم‌زمان.
- Numeric parsing با الگوی امن؛ داده متنی خراب باعث Crash موتور نمی‌شود.
- FCR در گله‌های layer/breeder از `cumulative_egg_fcr` خوانده می‌شود؛ FCR زیستی با FCR تخم قاطی نمی‌شود.
- Egg Mass از `period_egg_mass_kg / production_baseline_birds / 7` به g/hen/day نرمال می‌شود تا با Performance Standardهای لایه/مادر قابل مقایسه باشد.
- حد پایین FCR برای سنین ابتدایی از 0.5 به 0.1 اصلاح شده تا مقادیر واقعی early-age حذف نشوند.

## وضعیت استانداردها

Registry فعلی استانداردهای فعال برای گوشتی، پولت و تخمگذار دارد. برای مادر، موتور عمداً عدد ساختگی تولید نمی‌کند. منابع رسمی Aviagen برای Ross 308 Parent Stock و منابع 2026 Cobb Breeder بررسی شده‌اند و باید در مرحله بعد منحنی‌های عددی قابل ردیابی آن‌ها به Standard Registry وارد شوند؛ این یک **گیت کیفیت** است، نه نقص محاسبات Benchmark. Aviagen برای Ross 308 Parent Stock Performance Objectives جداگانه منتشر می‌کند و Cobb نیز Supplementهای breeder سال 2026 را منتشر کرده است.

## تست و پذیرش

- تست ساختار Registry: **PASS** — 37 Metric در 4 نوع پرورش.
- تست نرمال‌سازی نوع پرورش: **PASS**.
- تست آستانه Peer Score: **PASS** — کمتر از 20 گله و 10 واحد مستقل Peer Score فعال نمی‌شود.
- تست استقلال واحد: **PASS** — هر واحد تولیدی فقط یک سهم آماری دارد.
- تست ترتیب Percentileها: **PASS**.
- تست بازه Peer Percentile: **PASS** — 0 تا 100.
- تست Context Metrics: **PASS** — Peer Score دریافت نمی‌کنند.
- تست حذف تابع قدیمی مبهم سه‌پارامتری: **PASS**.
- تست Canonical Age و Body Weight روی 106 گله تولیدی: **106/106 PASS**؛ سن مفقود 0، داده مشکوک 0.
- تست دسترسی غیرمجاز: **PASS** — کاربر غیرمجاز 0 ردیف دریافت کرد.
- تست چهار مدل تولیدی: **PASS**؛ موتور برای گوشتی، پولت، تخمگذار و مادر بدون خطای SQL اجرا شد.

## نکته اجرایی

V6 حذف نشده است تا Regression ناخواسته ایجاد نشود. V7 به‌صورت additive در Supabase مستقر شده است. لایه UI فعلی هنوز باید به RPCهای V7 متصل شود تا V7 به‌عنوان Renderer اصلی گزارش جایگزین V6 شود؛ تا آن زمان V6 نقش compatibility layer را حفظ می‌کند.

## منابع مرجع

استانداردها باید با نسخه/سال/منبع Performance Objectives رسمی ژنتیک ثبت شوند. منابع مرجع بررسی‌شده شامل Aviagen/Ross، Cobb و Hy-Line هستند.
