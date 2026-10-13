-- ADINE — LAYER DAILY MONITORING SCHEMA COMPLETION
-- Additive, layer-only fields used by the existing daily form/payload.
alter table public.layer_daily_monitoring
  add column if not exists soft_shell_egg_count integer,
  add column if not exists misshapen_egg_count integer,
  add column if not exists saleable_egg_percent numeric,
  add column if not exists egg_defect_percent numeric,
  add column if not exists appetite_status text,
  add column if not exists respiratory_status text,
  add column if not exists droppings_status text,
  add column if not exists daily_monitoring_status text,
  add column if not exists daily_status_reason text,
  add column if not exists daily_reference_deviation jsonb;
