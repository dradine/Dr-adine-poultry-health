-- Remove exact duplicate non-unique indexes where an equivalent unique index already exists.
-- The unique indexes continue to support the same leading-column lookups and enforce period keys.
-- Safe only because the live definitions were verified as identical on 2026-10-13.
drop index if exists public.idx_layer_daily_monitoring_flock_date;
drop index if exists public.idx_layer_weekly_monitoring_flock_week;
drop index if exists public.idx_layer_monthly_monitoring_flock_month;
