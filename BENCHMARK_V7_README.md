# Flock Benchmark V7 — Final Release

## وضعیت نهایی

V7 جایگزین مفهومی «Farm Benchmark» با **Flock Benchmark** شده است. در رابط کاربری و منطق مقایسه از واژه «گله» استفاده می‌شود؛ `farm_id` فقط در Backend برای استقلال آماری، امنیت و جلوگیری از وزن‌دهی بیش از حد به یک واحد تولیدی باقی می‌ماند.

**Release status: PASS — Production-ready Benchmark Engine.**

## اصول علمی نهایی

- استاندارد ژنتیکی/رسمی از Peer Benchmark جداست.
- سن مرجع از تاریخ ارزیابی/ثبت واقعی و سن شروع گله محاسبه می‌شود؛ `week_number` مرجع اصلی نیست.
- پنجره سن برای هر Metric مستقل است.
- Cohort به ترتیب `exact → genetics → production` تنزل می‌کند و تنزل فقط در صورت عبور از آستانه نمونه مجاز است.
- حداقل نمایش: 10 گله معتبر + 5 واحد مستقل.
- حداقل Peer Score: 20 گله معتبر + 10 واحد مستقل.
- Benchmark پایدار: 50 گله معتبر + 20 واحد مستقل.
- هر واحد مستقل فقط یک سهم آماری دارد.
- P10/P25/Median/P75/P90 و IQR محاسبه می‌شوند.
- Body Weight شاخص Context است و به‌صورت «بهتر/بدتر» رتبه‌بندی نمی‌شود.
- Uniformity و CV در یک Domain قرار گرفته‌اند تا یک مشکل دوبار وزن‌دهی نشود.
- داده خارج از محدوده معتبر وارد محاسبه Benchmark نمی‌شود و داده خام حذف نمی‌شود.
- Peer Score فقط با جامعه کافی فعال می‌شود.
- Confidence از Peer Percentile جداست و به حجم نمونه/استقلال واحدها وابسته است.
- دسترسی تابع بر اساس مالکیت واحد یا دسترسی حرفه‌ای فعال کنترل می‌شود.
- نوع پرورش ناشناخته به‌صورت امن `null` می‌شود و هرگز به‌صورت پیش‌فرض گوشتی فرض نمی‌شود.
- استاندارد بدون منبع و نسخه معتبر عدد ساختگی تولید نمی‌کند.

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

- Canonical Age بر اساس تاریخ ارزیابی/رکورد و سن شروع گله.
- انتخاب رکورد نزدیک به سن با tie-breaker قطعی.
- Numeric parsing امن؛ داده متنی خراب موتور را Crash نمی‌کند.
- FCR در layer/breeder از `cumulative_egg_fcr` استفاده می‌کند و با FCR زیستی مخلوط نمی‌شود.
- Egg Mass از `period_egg_mass_kg / production_baseline_birds / 7` به g/hen/day نرمال می‌شود.
- حد پایین FCR سنین ابتدایی از 0.5 به 0.1 اصلاح شده است.
- Peer جامعه به‌صورت flock-observation ولی با استقلال آماری unit-level محاسبه می‌شود.
- Privacy و access control داخل RPCهای Security Definer اعمال می‌شود.

## Standard Registry

چهار منبع رسمی نسخه‌دار در Registry ثبت شده‌اند:

1. Aviagen Ross 308 Parent Stock Performance Objectives — 2021؛ منحنی عددی Ross 308 Parent Stock شامل وزن ماده/نر در کل چرخه و شاخص‌های تولیدی کلیدی وارد Registry شده است.
2. Cobb500 Fast Feather Breeder Management Supplement — 2026-03؛ منبع رسمی جاری ثبت و نسخه آن قفل شده است.
3. Hy-Line W-80 International Standards — منبع رسمی جاری ثبت شده است.
4. LOHMANN Parent Stock Management Guide — 2025؛ منبع رسمی مدیریتی ثبت شده است.

اصل مهم: وجود منبع در Registry به معنی اجازه ساختن عدد تخمینی نیست. منابعی که هنوز extraction عددی field-by-field نشده‌اند با وضعیت `source_verified` باقی می‌مانند و موتور برای آن‌ها عدد جعلی نمی‌سازد.

برای Ross 308 Parent Stock، منحنی وزن رسمی 2021 برای ماده و نر در سن 0 تا 448 روز به‌صورت سن‌محور ثبت شده و شاخص‌های کلیدی تولید/تخم نیز با منبع رسمی ثبت شده‌اند.

## تست نهایی

### Registry

- 4 نوع پرورش: **PASS**
- 37 Metric: **PASS**
- 4 منبع رسمی: **PASS**
- حداقل یک Standard Numeric رسمی کامل برای breeder: **PASS**
- Ross 308 Parent Stock body-weight curve: **PASS** — 130 رکورد سن‌محور female/male.

### Normalization

- فارسی «مادر» → breeder: **PASS**
- فارسی «گوشتی» → broiler: **PASS**
- فارسی «پولت» → pullet: **PASS**
- فارسی «تخمگذار» → layer: **PASS**
- مقدار ناشناخته → null: **PASS**

### Metric Configuration

- range نامعتبر: **0**
- direction نامعتبر: **0**
- age window نامعتبر: **0**
- وزن منفی: **0**

### Cohort / Statistics

- Exact → Genetics → Production fallback: **PASS**
- حذف گله جاری: **PASS**
- حداقل 10 گله + 5 واحد: **PASS**
- حداقل 20 گله + 10 واحد برای Peer Score: **PASS**
- حداقل 50 گله + 20 واحد برای Stable: **PASS**
- Percentile ordering: **PASS**
- Peer Percentile 0–100: **PASS**
- Context metrics بدون رتبه Peer: **PASS**

### Age / Data Quality

- Canonical Age + Body Weight روی 106 گله تولیدی: **106/106 PASS**
- سن مفقود: **0**
- داده مشکوک: **0**
- numeric parsing امن: **PASS**
- out-of-range exclusion بدون حذف raw data: **PASS**

### چهار مدل تولیدی

- Broiler: **PASS**
- Pullet: **PASS**
- Layer: **PASS**
- Breeder: **PASS**

### Security

- RPCها Security Definer با `search_path=public`: **PASS**
- دسترسی غیرمجاز: **PASS** — 0 ردیف Benchmark
- مالک/دسترسی حرفه‌ای فعال: **PASS**

### Performance

- یک Metric RPC: **PASS** — حدود 42ms در Dataset فعلی
- Matrix RPC: **PASS** — حدود 105ms در Dataset فعلی

### Regression

- V6 حذف نشده است.
- V7 به‌صورت additive مستقر شده است.
- `internal-benchmark.js` و `performance-benchmark-v2.js` به V7-first منتقل شده‌اند.
- Renderer اصلی گزارش نباید مستقیماً V6 را صدا بزند.

## Release Gate

**PASS — هیچ Failure مسدودکننده‌ای در موتور Benchmark V7 باقی نمانده است.**

منابع جاری Cobb/Hy-Line/LOHMANN در Registry به‌عنوان source-verified نگهداری می‌شوند تا فقط پس از extraction و validation عددی وارد Numeric Registry شوند؛ این یک کنترل کیفیت است و از ورود عدد تخمینی جلوگیری می‌کند.

## منابع رسمی بررسی‌شده

- Aviagen/Ross
- Cobb Genetics
- Hy-Line
- LOHMANN Breeders

این Benchmark یک «رتبه‌بندی ساده» نیست؛ یک موتور مقایسه چندلایه شامل Genetic Standard، Management Standard، Peer Benchmark، Data Quality، Cohort، Confidence، Context و Self-performance است.
