-- ADINE — Benchmark community catalog preservation
-- Keeps the existing benchmark calculations intact while ensuring the UI always
-- receives the full configured community selector, even when a cohort has no data.
-- Empty cohorts return metrics={} and are handled by the existing read-only UI.

alter function public.get_broiler_benchmark_v1(uuid,integer,integer,integer)
  rename to get_broiler_benchmark_v1_core;

create or replace function public.get_broiler_benchmark_v1(
  p_flock_id uuid,
  p_age_days integer default null,
  p_age_window_days integer default 3,
  p_recent_limit integer default 30
)
returns jsonb
language sql
security invoker
stable
set search_path=''
as $$
with base as (
  select public.get_broiler_benchmark_v1_core(
    p_flock_id,p_age_days,p_age_window_days,p_recent_limit
  ) as data
), catalog as (
  select * from (values
    ('all','کل گله‌های گوشتی'),
    ('genetics','همان ژنتیک / شرکت'),
    ('strain','همان سویه'),
    ('climate','همان اقلیم'),
    ('region','همان منطقه جغرافیایی'),
    ('recent30','۳۰ گله اخیر'),
    ('recent50','۵۰ گله اخیر')
  ) v(key,label)
), existing as (
  select coalesce(data->'cohorts','[]'::jsonb) cohorts from base
), missing as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'key',c.key,
        'label',c.label,
        'metrics','{}'::jsonb
      ) order by c.key
    ),
    '[]'::jsonb
  ) additions
  from catalog c
  where not exists (
    select 1
    from jsonb_array_elements((select cohorts from existing)) e
    where e->>'key'=c.key
  )
), final_data as (
  select data,
         (select cohorts from existing) || (select additions from missing) as cohorts
  from base
)
select jsonb_set(data,'{cohorts}',cohorts,true)
from final_data;
$$;

revoke execute on function public.get_broiler_benchmark_v1(uuid,integer,integer,integer) from public,anon;
grant execute on function public.get_broiler_benchmark_v1(uuid,integer,integer,integer) to authenticated;
