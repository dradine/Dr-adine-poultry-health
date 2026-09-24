-- ADINE — LAYER DAILY MONITORING V1
-- Canonical storage for the independent layer daily engine.
-- Applied to Supabase project separately; retained here as source-of-truth migration text.

create table if not exists public.layer_daily_monitoring (
 id uuid primary key default gen_random_uuid(),
 flock_id uuid not null references public.flocks(id) on delete cascade,
 farm_id uuid not null references public.farms(id) on delete cascade,
 house_id uuid references public.houses(id) on delete set null,
 owner_id uuid not null references auth.users(id) on delete cascade,
 record_date date not null,
 age_days integer not null check (age_days >= 1 and age_days <= 1200),
 opening_birds integer check (opening_birds is null or opening_birds >= 0),
 mortality_count integer not null default 0 check (mortality_count >= 0),
 cull_count integer not null default 0 check (cull_count >= 0),
 mortality_percent numeric, cull_percent numeric,
 cumulative_mortality_count integer, cumulative_cull_count integer,
 cumulative_mortality_percent numeric, livability_percent numeric,
 feed_quantity_kg numeric, feed_per_hen_g numeric,
 water_quantity_l numeric, water_per_hen_ml numeric, water_feed_ratio numeric,
 egg_count integer, hen_day_production_percent numeric, hen_housed_production_percent numeric,
 saleable_egg_count integer, cracked_egg_count integer, dirty_egg_count integer, floor_egg_count integer,
 second_grade_egg_percent numeric, average_egg_weight_g numeric, egg_mass_g_hen_day numeric,
 feed_per_egg_g numeric, feed_per_egg_mass numeric,
 body_weight_g numeric, body_weight_sample_count integer, uniformity_10_percent numeric,
 uniformity_15_percent numeric, cv_percent numeric,
 house_temperature_c numeric, outside_temperature_c numeric, humidity_percent numeric,
 light_hours numeric, dark_hours numeric, light_intensity_lux numeric,
 ammonia_ppm numeric, co2_ppm numeric, water_temperature_c numeric,
 water_quality_status text, litter_quality_status text, manure_condition text,
 feather_condition text, keel_bone_score text, locomotion_score text, footpad_score text,
 pecking_status text, flock_activity_status text, nest_use_status text, egg_shell_quality_status text,
 health_status text, clinical_signs text, treatment_or_intervention text, feed_change text,
 vaccination_event text, equipment_issue text, notes text,
 created_by uuid references auth.users(id), created_at timestamptz not null default now(),
 haugh_unit numeric, albumen_height_mm numeric, egg_shell_strength_g numeric, egg_shell_thickness_mm numeric, egg_color_score numeric, egg_size_distribution jsonb, water_ph numeric, water_tds numeric, water_free_chlorine numeric, water_micro_status text,\n jalali_year integer, jalali_month integer, jalali_day integer, monitoring_week_no integer, monitoring_month_key text,\n updated_at timestamptz not null default now(), unique(flock_id,record_date)
);
create index if not exists idx_layer_daily_monitoring_flock_date on public.layer_daily_monitoring(flock_id,record_date);
alter table public.layer_daily_monitoring enable row level security;
-- RLS policies are defined in the applied database version.