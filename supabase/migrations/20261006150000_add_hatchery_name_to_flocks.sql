-- ADINE | Store hatchery name for each flock.
alter table public.flocks
  add column if not exists hatchery_name text;
