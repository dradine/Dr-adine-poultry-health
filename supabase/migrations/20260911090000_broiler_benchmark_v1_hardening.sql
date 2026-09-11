-- ADINE BROILER BENCHMARK V1 HARDENING
-- Remove retired V7 benchmark runtime/schema, clean synthetic benchmark fixtures,
-- and add the age-first index needed by the flock-level V1 cohort query.

revoke execute on function public.get_flock_benchmark_v7(uuid,text) from public,anon,authenticated;
revoke execute on function public.get_flock_benchmark_matrix_v7(uuid) from public,anon,authenticated;
revoke execute on function public.can_view_flock_benchmark(uuid) from public,anon,authenticated;

drop function if exists public.get_flock_benchmark_matrix_v7(uuid);
drop function if exists public.get_flock_benchmark_v7(uuid,text);
drop function if exists public.can_view_flock_benchmark(uuid);

drop table if exists public.flock_benchmark_metric_config_v7 cascade;
drop table if exists public.benchmark_standard_sources_v7 cascade;
drop table if exists public.benchmark_v7_release_audit cascade;

create index if not exists idx_weekly_records_benchmark_age_v1
  on public.weekly_records(age_days,flock_id,created_at desc);

-- These rows were synthetic Benchmark test fixtures, not user production data.
-- Their farm codes were deliberately generated with the TEST-BM-ADINEH- prefix.
delete from public.farms
where upper(coalesce(farm_code,'')) like 'TEST-BM-ADINEH-%';
