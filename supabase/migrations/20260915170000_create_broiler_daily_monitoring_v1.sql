create table if not exists public.broiler_daily_monitoring (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid not null references public.flocks(id) on delete cascade,
  farm_id uuid not null references public.farms(id) on delete cascade,
  house_id uuid references public.houses(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null,
  age_days integer not null check (age_days between 1 and 365),
  doa_count integer not null default 0 check (doa_count >= 0),
  doa_percent numeric,
  mortality_count integer not null default 0 check (mortality_count >= 0),
  mortality_percent numeric,
  cumulative_mortality_count integer,
  cumulative_mortality_percent numeric,
  cull_count integer not null default 0 check (cull_count >= 0),
  cull_percent numeric,
  cull_reason text,
  feed_form text,
  feed_quantity_kg numeric check (feed_quantity_kg is null or feed_quantity_kg >= 0),
  water_quantity_l numeric check (water_quantity_l is null or water_quantity_l >= 0),
  water_feed_ratio numeric,
  outside_temperature_c numeric,
  house_temperature_c numeric,
  minimum_temperature_c numeric,
  maximum_temperature_c numeric,
  litter_temperature_c numeric,
  humidity_percent numeric,
  light_hours numeric,
  dark_hours numeric,
  light_intensity_lux numeric,
  body_weight_g numeric check (body_weight_g is null or body_weight_g >= 0),
  body_weight_sample_count integer check (body_weight_sample_count is null or body_weight_sample_count >= 0),
  crop_fill_2h_percent numeric,
  crop_fill_4h_percent numeric,
  crop_fill_8h_percent numeric,
  crop_fill_12h_percent numeric,
  crop_fill_24h_percent numeric,
  air_quality_status text,
  ammonia_ppm numeric,
  co2_ppm numeric,
  litter_quality_status text,
  chick_quality_observation text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(flock_id, record_date)
);

create index if not exists idx_broiler_daily_monitoring_flock_date on public.broiler_daily_monitoring(flock_id, record_date);
alter table public.broiler_daily_monitoring enable row level security;
drop policy if exists broiler_daily_monitoring_select on public.broiler_daily_monitoring;
drop policy if exists broiler_daily_monitoring_insert on public.broiler_daily_monitoring;
drop policy if exists broiler_daily_monitoring_update on public.broiler_daily_monitoring;
drop policy if exists broiler_daily_monitoring_delete on public.broiler_daily_monitoring;
create policy broiler_daily_monitoring_select on public.broiler_daily_monitoring for select to authenticated using (owner_id = auth.uid() or exists (select 1 from public.farm_professional_access a where a.farm_id = broiler_daily_monitoring.farm_id and a.professional_user_id = auth.uid() and a.status = 'active'));
create policy broiler_daily_monitoring_insert on public.broiler_daily_monitoring for insert to authenticated with check (owner_id = auth.uid() or exists (select 1 from public.farm_professional_access a where a.farm_id = broiler_daily_monitoring.farm_id and a.professional_user_id = auth.uid() and a.status = 'active'));
create policy broiler_daily_monitoring_update on public.broiler_daily_monitoring for update to authenticated using (owner_id = auth.uid() or exists (select 1 from public.farm_professional_access a where a.farm_id = broiler_daily_monitoring.farm_id and a.professional_user_id = auth.uid() and a.status = 'active')) with check (owner_id = auth.uid() or exists (select 1 from public.farm_professional_access a where a.farm_id = broiler_daily_monitoring.farm_id and a.professional_user_id = auth.uid() and a.status = 'active'));
create policy broiler_daily_monitoring_delete on public.broiler_daily_monitoring for delete to authenticated using (owner_id = auth.uid() or exists (select 1 from public.farm_professional_access a where a.farm_id = broiler_daily_monitoring.farm_id and a.professional_user_id = auth.uid() and a.status = 'active'));
create or replace function public.set_broiler_daily_monitoring_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_broiler_daily_monitoring_updated_at on public.broiler_daily_monitoring;
create trigger trg_broiler_daily_monitoring_updated_at before update on public.broiler_daily_monitoring for each row execute function public.set_broiler_daily_monitoring_updated_at();
