-- Reporting must never calculate FCR. It only reads weekly_records.fcr/cumulative_fcr
-- produced by the canonical broiler FCR trigger.
CREATE OR REPLACE FUNCTION public.get_flock_fcr_analysis_v4(p_flock_id uuid)
RETURNS TABLE(
  record_id uuid, age_days integer, week_number integer, evaluation_date date,
  weekly_fcr numeric, cumulative_fcr numeric,
  official_weekly_fcr numeric, official_cumulative_fcr numeric,
  official_source text, official_year integer,
  management_weekly_fcr numeric, management_cumulative_fcr numeric,
  management_cohort text, management_flocks bigint, management_units bigint,
  weekly_official_delta numeric, weekly_official_delta_pct numeric,
  cumulative_official_delta numeric, cumulative_official_delta_pct numeric,
  weekly_management_delta numeric, weekly_management_delta_pct numeric,
  cumulative_management_delta numeric, cumulative_management_delta_pct numeric,
  calculation_version text
)
LANGUAGE sql
AS $function$
WITH r AS (
  SELECT w.id,w.age_days,w.week_number,coalesce(w.evaluation_date,w.record_date) evaluation_date,
         w.fcr,w.cumulative_fcr,
         lower(trim(coalesce(f.genetics,''))) g,
         lower(trim(coalesce(f.strain,''))) s
  FROM public.weekly_records w
  JOIN public.flocks f ON f.id=w.flock_id
  WHERE w.flock_id=p_flock_id
    AND lower(trim(coalesce(f.production_type,'')))='broiler'
)
SELECT r.id,r.age_days,r.week_number,r.evaluation_date,r.fcr,r.cumulative_fcr,
       ow.target_value,oc.target_value,oc.source_name,oc.source_year,
       mw.target_value,null::numeric,
       case when mw.target_value is not null then 'management-weekly-v2026.2' end,
       0::bigint,0::bigint,
       case when r.fcr is null or ow.target_value is null then null else round(r.fcr-ow.target_value,4) end,
       case when r.fcr is null or ow.target_value is null or ow.target_value=0 then null else round((r.fcr-ow.target_value)/ow.target_value*100,2) end,
       case when r.cumulative_fcr is null or oc.target_value is null then null else round(r.cumulative_fcr-oc.target_value,4) end,
       case when r.cumulative_fcr is null or oc.target_value is null or oc.target_value=0 then null else round((r.cumulative_fcr-oc.target_value)/oc.target_value*100,2) end,
       case when r.fcr is null or mw.target_value is null then null else round(r.fcr-mw.target_value,4) end,
       case when r.fcr is null or mw.target_value is null or mw.target_value=0 then null else round((r.fcr-mw.target_value)/mw.target_value*100,2) end,
       null::numeric,null::numeric,
       'BROILER-FCR-CANONICAL-V5'
FROM r
LEFT JOIN LATERAL (
  SELECT x.target_value::numeric
  FROM public.poultry_performance_standards x
  WHERE x.active AND lower(trim(x.production_type))='broiler'
    AND lower(trim(x.metric_code))='fcr' AND lower(trim(x.source_type))='official'
    AND x.age_days=r.age_days
    AND (x.genetics is null or lower(trim(x.genetics))=r.g)
    AND (x.strain is null or lower(trim(x.strain))=r.s)
  ORDER BY (x.genetics is null),(x.strain is null),x.source_year DESC NULLS LAST
  LIMIT 1
) ow ON true
LEFT JOIN LATERAL (
  SELECT x.target_value::numeric,x.source_name,x.source_year
  FROM public.poultry_performance_standards x
  WHERE x.active AND lower(trim(x.production_type))='broiler'
    AND lower(trim(x.metric_code))='fcr_cumulative' AND lower(trim(x.source_type))='official'
    AND x.age_days=r.age_days
    AND (x.genetics is null or lower(trim(x.genetics))=r.g)
    AND (x.strain is null or lower(trim(x.strain))=r.s)
  ORDER BY (x.genetics is null),(x.strain is null),x.source_year DESC NULLS LAST
  LIMIT 1
) oc ON true
LEFT JOIN LATERAL (
  SELECT x.target_value::numeric
  FROM public.poultry_management_benchmarks x
  WHERE x.active AND lower(trim(x.production_type))='broiler'
    AND lower(trim(x.metric_code)) IN ('fcr','fcr_weekly')
    AND x.age_days=r.age_days
    AND (x.genetics is null or lower(trim(x.genetics))=r.g or lower(trim(x.strain))=r.s)
  ORDER BY (x.genetics is null),(x.strain is null),x.sample_size DESC NULLS LAST,x.source_year DESC NULLS LAST
  LIMIT 1
) mw ON true
ORDER BY r.evaluation_date,r.age_days,r.id;
$function$;
