-- Broiler intelligence V3: use exact canonical standards and derive official weekly FCR
-- from official cumulative FCR + body-weight points when a publisher does not store weekly FCR.

CREATE OR REPLACE FUNCTION public.calculate_performance_intelligence(p_flock_id uuid, p_evaluation_date date, p_age_days integer, p_metric text, p_current_value numeric, p_production_type text, p_genetics text DEFAULT NULL::text, p_strain text DEFAULT NULL::text)
RETURNS jsonb LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
declare
  m text; target numeric; delta numeric; pct numeric; direction text; score numeric; status text;
  source_type text; source_name text; source_year integer; standard_age integer; exact boolean;
  cw numeric; pw numeric; cf numeric; pf numeric; strain_match text;
begin
  m:=case lower(trim(coalesce(p_metric,''))) when 'fcr' then 'fcr_weekly' when 'weekly_fcr' then 'fcr_weekly' when 'cumulative_fcr' then 'fcr_cumulative' else lower(trim(coalesce(p_metric,''))) end;
  if p_flock_id is null or p_age_days is null or p_current_value is null then return jsonb_build_object('ok',false,'code','insufficient_data'); end if;
  strain_match:=case when lower(trim(coalesce(p_strain,'')))='arbor acres plus s' then 'Arbor Acres Plus' else p_strain end;
  if lower(trim(coalesce(p_production_type,''))) in ('broiler','گوشتی','meat') and m in ('fcr_weekly','fcr_cumulative') then
    if m='fcr_cumulative' then
      select x.target_value,x.source_type,x.source_name,x.source_year,x.age_days into target,source_type,source_name,source_year,standard_age from public.poultry_performance_standards x
      where x.active and lower(trim(coalesce(x.production_type,'')))='broiler' and lower(trim(x.metric_code))='fcr_cumulative' and x.age_days=p_age_days and (p_genetics is null or x.genetics is null or lower(trim(x.genetics))=lower(trim(p_genetics))) and (p_strain is null or x.strain is null or lower(trim(x.strain))=lower(trim(p_strain)) or lower(trim(x.strain))=lower(trim(strain_match))) and lower(trim(coalesce(x.source_type,'')))='official'
      order by (x.genetics is null),(x.strain is null),x.source_year desc nulls last limit 1;
    else
      select x.target_value,x.source_type,x.source_name,x.source_year,x.age_days into target,source_type,source_name,source_year,standard_age from public.poultry_performance_standards x
      where x.active and lower(trim(coalesce(x.production_type,'')))='broiler' and lower(trim(x.metric_code))='fcr_weekly' and x.age_days=p_age_days and (p_genetics is null or x.genetics is null or lower(trim(x.genetics))=lower(trim(p_genetics))) and (p_strain is null or x.strain is null or lower(trim(x.strain))=lower(trim(p_strain)) or lower(trim(x.strain))=lower(trim(strain_match))) and lower(trim(coalesce(x.source_type,'')))='official'
      order by (x.genetics is null),(x.strain is null),x.source_year desc nulls last limit 1;
      if target is null then
        select cur.target_value,prev.target_value,cwrow.target_value,pwrow.target_value,cur.source_name,cur.source_year into cf,pf,cw,pw,source_name,source_year
        from public.poultry_performance_standards cur
        join public.poultry_performance_standards prev on lower(trim(prev.production_type))='broiler' and lower(trim(prev.metric_code))='fcr_cumulative' and prev.age_days=p_age_days-7 and lower(trim(coalesce(prev.source_type,'')))='official' and (prev.genetics is null or p_genetics is null or lower(trim(prev.genetics))=lower(trim(p_genetics))) and (prev.strain is null or p_strain is null or lower(trim(prev.strain))=lower(trim(p_strain)) or lower(trim(prev.strain))=lower(trim(strain_match)))
        join public.poultry_performance_standards cwrow on lower(trim(cwrow.production_type))='broiler' and lower(trim(cwrow.metric_code))='body_weight' and cwrow.age_days=p_age_days and lower(trim(coalesce(cwrow.source_type,'')))='official' and (cwrow.genetics is null or p_genetics is null or lower(trim(cwrow.genetics))=lower(trim(p_genetics))) and (cwrow.strain is null or p_strain is null or lower(trim(cwrow.strain))=lower(trim(p_strain)) or lower(trim(cwrow.strain))=lower(trim(strain_match)))
        join public.poultry_performance_standards pwrow on lower(trim(pwrow.production_type))='broiler' and lower(trim(pwrow.metric_code))='body_weight' and pwrow.age_days=p_age_days-7 and lower(trim(coalesce(pwrow.source_type,'')))='official' and (pwrow.genetics is null or p_genetics is null or lower(trim(pwrow.genetics))=lower(trim(p_genetics))) and (pwrow.strain is null or p_strain is null or lower(trim(pwrow.strain))=lower(trim(p_strain)) or lower(trim(pwrow.strain))=lower(trim(strain_match)))
        where cur.active and prev.active and cwrow.active and pwrow.active and lower(trim(cur.production_type))='broiler' and lower(trim(cur.metric_code))='fcr_cumulative' and cur.age_days=p_age_days and lower(trim(coalesce(cur.source_type,'')))='official' and (cur.genetics is null or p_genetics is null or lower(trim(cur.genetics))=lower(trim(p_genetics))) and (cur.strain is null or p_strain is null or lower(trim(cur.strain))=lower(trim(p_strain)) or lower(trim(cur.strain))=lower(trim(strain_match)))
        order by (cur.genetics is null),(cur.strain is null),cur.source_year desc nulls last limit 1;
        if cf is not null and pf is not null and cw is not null and pw is not null and cw<>pw then target:=(cf*cw-pf*pw)/(cw-pw); source_type:='official'; standard_age:=p_age_days; exact:=true; end if;
      end if;
    end if;
    if target is null then return jsonb_build_object('ok',false,'code','standard_unavailable','metric_code',m,'age_days',p_age_days); end if;
    direction:='lower';
  else
    select x.target_value,x.source_type,x.source_name,x.source_year,x.age_days into target,source_type,source_name,source_year,standard_age from public.poultry_performance_standards x
    where x.active and lower(trim(coalesce(x.production_type,'')))=lower(trim(coalesce(p_production_type,''))) and lower(trim(x.metric_code))=m and x.age_days=p_age_days and (p_genetics is null or x.genetics is null or lower(trim(x.genetics))=lower(trim(p_genetics))) and (p_strain is null or x.strain is null or lower(trim(x.strain))=lower(trim(p_strain)) or lower(trim(x.strain))=lower(trim(strain_match))) and lower(trim(coalesce(x.source_type,'')))<>'management'
    order by (x.genetics is null),(x.strain is null),x.source_year desc nulls last limit 1;
    exact:=target is not null and standard_age=p_age_days;
    if target is null then
      select x.target_value,x.source_type,x.source_name,x.source_year,x.age_days into target,source_type,source_name,source_year,standard_age from public.poultry_management_benchmarks x
      where x.active and lower(trim(coalesce(x.production_type,'')))=lower(trim(coalesce(p_production_type,''))) and lower(trim(x.metric_code))=m and x.age_days=p_age_days and (p_genetics is null or x.genetics is null or lower(trim(x.genetics))=lower(trim(p_genetics))) and (p_strain is null or x.strain is null or lower(trim(x.strain))=lower(trim(p_strain)))
      order by (x.genetics is null),(x.strain is null),x.sample_size desc nulls last,x.source_year desc nulls last limit 1;
      exact:=target is not null and standard_age=p_age_days;
    end if;
  end if;
  direction:=coalesce(direction,case when m in ('fcr_weekly','fcr_cumulative','fcr_range_high','fcr_range_low','mortality','cv') then 'lower' else 'higher' end);
  delta:=p_current_value-target; pct:=case when target=0 then null else delta/abs(target)*100 end;
  score:=case when pct is null then null else greatest(0,least(100,case when direction='lower' then 100-pct*2.5 else 100+pct*2.5 end)) end;
  status:=case when score is null then 'unknown' when score>=90 then 'excellent' when score>=75 then 'good' when score>=60 then 'watch' else 'critical' end;
  return jsonb_build_object('ok',true,'metric',p_metric,'metric_code',m,'age_days',p_age_days,'current',round(p_current_value,4),'target',round(target,4),'delta',round(delta,4),'delta_percent',case when pct is null then null else round(pct,2) end,'direction',direction,'score',case when score is null then null else round(score,1) end,'status',status,'source_type',coalesce(source_type,'unknown'),'source_name',source_name,'source_year',source_year,'confidence',case when source_type='official' then 'high' when source_type='scientific' then 'medium' else 'low' end,'standard_age_days',standard_age,'is_exact_age',coalesce(exact,standard_age=p_age_days));
end;
$function$;
