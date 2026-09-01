-- Harden performance intelligence without changing canonical production calculations.
-- Broiler FCR targets come from the current canonical v4 analysis function.
-- Standards are exact-age only; no silent nearest-age substitution.

CREATE OR REPLACE FUNCTION public.calculate_performance_intelligence(p_flock_id uuid, p_evaluation_date date, p_age_days integer, p_metric text, p_current_value numeric, p_production_type text, p_genetics text DEFAULT NULL::text, p_strain text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
declare
  m text;
  target numeric;
  delta numeric;
  pct numeric;
  direction text;
  score numeric;
  status text;
  source_type text;
  source_name text;
  source_year integer;
  standard_age integer;
  exact boolean;
begin
  m:=case lower(trim(coalesce(p_metric,'')))
       when 'fcr' then 'fcr_weekly'
       when 'weekly_fcr' then 'fcr_weekly'
       when 'cumulative_fcr' then 'fcr_cumulative'
       else lower(trim(coalesce(p_metric,''))) end;

  if p_flock_id is null or p_age_days is null or p_current_value is null then
    return jsonb_build_object('ok',false,'code','insufficient_data');
  end if;

  if lower(trim(coalesce(p_production_type,''))) in ('broiler','گوشتی','meat') and m in ('fcr_weekly','fcr_cumulative') then
    select case when m='fcr_weekly' then x.official_weekly_fcr else x.official_cumulative_fcr end,
           x.official_source,
           x.official_year
      into target, source_name, source_year
    from public.get_flock_fcr_analysis_v4(p_flock_id) x
    where x.age_days=p_age_days
    limit 1;

    if target is not null then
      source_type:='official';
      standard_age:=p_age_days;
      exact:=true;
    else
      select x.target_value,x.source_type,x.source_name,x.source_year,x.age_days
        into target,source_type,source_name,source_year,standard_age
      from public.poultry_performance_standards x
      where x.active=true
        and lower(trim(coalesce(x.production_type,'')))='broiler'
        and lower(trim(x.metric_code))=m
        and x.age_days=p_age_days
        and lower(trim(coalesce(x.source_type,'')))<>'management'
        and (p_genetics is null or x.genetics is null or lower(trim(x.genetics))=lower(trim(p_genetics)))
        and (p_strain is null or x.strain is null or lower(trim(x.strain))=lower(trim(p_strain)))
      order by (x.genetics is null),(x.strain is null),x.source_year desc nulls last
      limit 1;
      exact:=target is not null and standard_age=p_age_days;
    end if;
  else
    select x.target_value,x.source_type,x.source_name,x.source_year,x.age_days
      into target,source_type,source_name,source_year,standard_age
    from public.poultry_performance_standards x
    where x.active=true
      and lower(trim(coalesce(x.production_type,'')))=lower(trim(coalesce(p_production_type,'')))
      and lower(trim(x.metric_code))=m
      and x.age_days=p_age_days
      and (p_genetics is null or x.genetics is null or lower(trim(x.genetics))=lower(trim(p_genetics)))
      and (p_strain is null or x.strain is null or lower(trim(x.strain))=lower(trim(p_strain)))
      and lower(trim(coalesce(x.source_type,'')))<>'management'
    order by (x.genetics is null),(x.strain is null),x.source_year desc nulls last
    limit 1;
    exact:=target is not null and standard_age=p_age_days;
    if target is null then
      select x.target_value,x.source_type,x.source_name,x.source_year,x.age_days
        into target,source_type,source_name,source_year,standard_age
      from public.poultry_management_benchmarks x
      where x.active=true
        and lower(trim(coalesce(x.production_type,'')))=lower(trim(coalesce(p_production_type,'')))
        and lower(trim(x.metric_code))=m
        and x.age_days=p_age_days
        and (p_genetics is null or x.genetics is null or lower(trim(x.genetics))=lower(trim(p_genetics)))
        and (p_strain is null or x.strain is null or lower(trim(x.strain))=lower(trim(p_strain)))
      order by (x.genetics is null),(x.strain is null),x.sample_size desc nulls last,x.source_year desc nulls last
      limit 1;
      exact:=target is not null and standard_age=p_age_days;
    end if;
  end if;

  if target is null then
    return jsonb_build_object('ok',false,'code','standard_unavailable','metric_code',m,'age_days',p_age_days);
  end if;

  direction:=case when m in ('fcr_weekly','fcr_cumulative','fcr_range_high','fcr_range_low','mortality','cv') then 'lower' else 'higher' end;
  delta:=p_current_value-target;
  pct:=case when target=0 then null else delta/abs(target)*100 end;
  score:=case when pct is null then null else greatest(0,least(100,case when direction='lower' then 100-pct*2.5 else 100+pct*2.5 end)) end;
  status:=case when score is null then 'unknown' when score>=90 then 'excellent' when score>=75 then 'good' when score>=60 then 'watch' else 'critical' end;

  return jsonb_build_object(
    'ok',true,'metric',p_metric,'metric_code',m,'age_days',p_age_days,
    'current',round(p_current_value,4),'target',round(target,4),'delta',round(delta,4),
    'delta_percent',case when pct is null then null else round(pct,2) end,
    'direction',direction,'score',case when score is null then null else round(score,1) end,'status',status,
    'source_type',coalesce(source_type,'unknown'),'source_name',source_name,'source_year',source_year,
    'confidence',case when source_type='official' then 'high' when source_type='scientific' then 'medium' else 'low' end,
    'standard_age_days',standard_age,'is_exact_age',exact
  );
end;
$function$;
