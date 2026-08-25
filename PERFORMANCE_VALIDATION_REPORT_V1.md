# Performance validation V1

Date: 2026-08-25

## Database sample
- 691 weekly records
- 107 flocks
- breeder 172 records / 26 flocks
- broiler 179 / 30
- layer 176 / 28
- pullet 164 / 23

## Data quality
All 691 records have age_days, feed_total_kg and average_weight_g populated in the current validation dataset. FCR is populated for 589/691 records and cumulative_fcr for 590/691.

## Important findings
1. Benchmark metric aliases were inconsistent: weekly_records uses `fcr`/`cumulative_fcr`, while the registry uses `fcr_weekly`/`fcr_cumulative`. This caused false `standard_unavailable` outcomes. Fixed in the Supabase intelligence function by canonical metric mapping.
2. Current farm data cannot safely be used to set universal alert thresholds. Broiler normalized cumulative-FCR deviation against the nearest registry target has mean +26.20%, median absolute deviation 27.00%, p90 absolute deviation 45.46%. Layer data has mean -21.11%. These systematic offsets indicate the present validation data are not a clean calibration cohort for official genetic standards.
3. Therefore no arbitrary 5/10/15% alert thresholds were promoted to production.
4. Adaptive alerts use the flock's own historical normalized deviations with a robust median/MAD control limit and require at least four prior observations. Before that, the UI is monitor-only.
5. Forecasting must operate on relative deviation from the age-specific standard, not absolute FCR difference. If actual/standard = 1.20 at one age, the same relative performance at a future standard of 2.00 forecasts 2.40.
6. The official registry remains authoritative when an exact or defensibly interpolated age point exists. A distant standard must not be silently used as if it were age-matched.

## Backtest limitation
A true prospective accuracy estimate requires historical predictions stored before the outcome occurs. The current dataset contains observations but not a history of previously issued forecasts and prediction intervals. Therefore this release validates data integrity, benchmark mapping, normalized-deviation behavior and alert calibration logic, but does not claim an out-of-sample forecast MAE/MAPE that the database cannot support.

## Production policy
- Exact official standard: high-confidence benchmark.
- Interpolated official standard: benchmark labeled as interpolated.
- Scientific reference: medium confidence.
- Management benchmark: low confidence and never presented as genetic standard.
- No valid benchmark: diagnostic state, not a fabricated number.
- Forecast requires sufficient longitudinal data; otherwise monitor-only.
