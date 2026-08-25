/* BENCHMARK V6 - AGE / ACCESS / DIAGNOSTICS FIX
   Companion migration for Supabase.
   RLS remains the primary access boundary. */

-- Canonical flock age calculation.
create or replace function public.calculate_flock_age_days(p_flock_id uuid, p_evaluation_date date)
returns integer
language sql stable security invoker set search_path=public
as $$
  select case
    when f.placement_date is null or p_evaluation_date is null then null
    else greatest(0, coalesce(f.start_age_days,0) + (p_evaluation_date-f.placement_date))::integer
  end
  from public.flocks f where f.id=p_flock_id;
$$;

-- Do not let week_number drive age. Existing trigger implementations should
-- call calculate_flock_age_days instead.

-- Anonymous execution is never allowed for access/benchmark RPCs.
revoke execute on function public.get_flock_benchmark_v6(uuid,text,integer) from anon;
revoke execute on function public.get_flock_metric_history_v6(uuid,text,integer) from anon;
revoke execute on function public.can_view_farm(uuid) from anon;
revoke execute on function public.professional_can_view_farm(uuid) from anon;
revoke execute on function public.professional_has_active_farm_access(uuid) from anon;
