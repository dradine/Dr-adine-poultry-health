-- Fix canonical broiler FCR report output.
-- V3: weekly FCR uses period feed / period live-weight gain;
-- cumulative FCR uses cumulative feed / initial population x current live weight,
-- matching the Total Feed / Total Live Weight comparison basis used by Aviagen.
-- The previous V2 function accidentally returned cumulative feed (cf) instead of
-- calculated cumulative FCR (cfcr), producing values such as 8,300.000.

create or replace function public.get_flock_fcr_analysis_v4(p_flock_id uuid)
returns table(
  record_id uuid,
  age_days integer,
  week_number integer,
  evaluation_date date,
  weekly_fcr numeric,
  cumulative_fcr numeric,
  official_weekly_fcr numeric,
  official_cumulative_fcr numeric,
  official_source text,
  official_year integer,
  management_weekly_fcr numeric,
  management_cumulative_fcr numeric,
  management_cohort text,
  management_flocks bigint,
  management_units bigint,
  weekly_official_delta numeric,
  weekly_official_delta_pct numeric,
  cumulative_official_delta numeric,
  cumulative_official_delta_pct numeric,
  weekly_management_delta numeric,
  weekly_management_delta_pct numeric,
  cumulative_management_delta numeric,
  cumulative_management_delta_pct numeric,
  calculation_version text
)
language sql
stable
security definer
set search_path = public
as $function$
with b as (
  select f.*, lower(trim(coalesce(f.production_type,''))) pt,
         lower(trim(coalesce(f.genetics,''))) g,
         lower(trim(coalesce(f.strain,''))) s
  from public.flocks f where f.id = p_flock_id
),
r as (
  select w.id record_id,w.age_days,w.week_number,w.evaluation_date,w.record_date,
         w.live_birds,w.average_weight_g,w.feed_total_kg,
         row_number() over(order by coalesce(w.age_days,w.week_number*7),coalesce(w.evaluation_date,w.record_date),w.created_at,w.id) rn,
         lag(w.live_birds) over(order by coalesce(w.age_days,w.week_number*7),coalesce(w.evaluation_date,w.record_date),w.created_at,w.id) pl,
         lag(w.average_weight_g) over(order by coalesce(w.age_days,w.week_number*7),coalesce(w.evaluation_date,w.record_date),w.created_at,w.id) pw,
         sum(coalesce(w.feed_total_kg,0)) over(order by coalesce(w.age_days,w.week_number*7),coalesce(w.evaluation_date,w.record_date),w.created_at,w.id rows unbounded preceding) cf
  from public.weekly_records w where w.flock_id=p_flock_id
),
c as (
  select r.*,b.pt,b.g,b.s,b.initial_bird_count,b.initial_average_weight_g,
         case when r.rn=1 then b.initial_bird_count else r.pl end ob,
         case when r.rn=1 then b.initial_average_weight_g else r.pw end ow
  from r cross join b
),
d as (
  select c.*,
    case when feed_total_kg>0 and live_birds>0 and average_weight_g>0 and ob>0 and ow is not null and average_weight_g>ow
         then round((feed_total_kg/((live_birds*(average_weight_g-ow))/1000.0))::numeric,4) end wf,
    case when cf>0 and initial_bird_count>0 and live_birds>0 and average_weight_g>0
         then round((cf/((initial_bird_count*average_weight_g)/1000.0))::numeric,4) end cfcr,
    (select x.target_value::numeric from public.poultry_performance_standards x
      where x.active and lower(trim(x.production_type))=c.pt and lower(trim(x.metric_code))='fcr_cumulative'
        and lower(trim(x.source_type))='official' and x.age_days=c.age_days
        and (x.genetics is null or lower(trim(x.genetics))=c.g)
        and (x.strain is null or lower(trim(x.strain))=c.s)
      order by (x.genetics is null),(x.strain is null),x.source_year desc nulls last limit 1) oc,
    (select x.source_name from public.poultry_performance_standards x
      where x.active and lower(trim(x.production_type))=c.pt and lower(trim(x.metric_code))='fcr_cumulative'
        and lower(trim(x.source_type))='official' and x.age_days=c.age_days
        and (x.genetics is null or lower(trim(x.genetics))=c.g)
        and (x.strain is null or lower(trim(x.strain))=c.s)
      order by (x.genetics is null),(x.strain is null),x.source_year desc nulls last limit 1) os,
    (select x.source_year from public.poultry_performance_standards x
      where x.active and lower(trim(x.production_type))=c.pt and lower(trim(x.metric_code))='fcr_cumulative'
        and lower(trim(x.source_type))='official' and x.age_days=c.age_days
        and (x.genetics is null or lower(trim(x.genetics))=c.g)
        and (x.strain is null or lower(trim(x.strain))=c.s)
      order by (x.genetics is null),(x.strain is null),x.source_year desc nulls last limit 1) oy,
    (select x.target_value::numeric from public.poultry_management_benchmarks x
      where x.active and lower(trim(x.production_type))=c.pt
        and lower(trim(x.metric_code)) in ('fcr','fcr_weekly') and x.age_days=c.age_days
        and (x.genetics is null or lower(trim(x.genetics))=c.g or lower(trim(x.strain))=c.s)
      order by (x.genetics is null),(x.strain is null),x.sample_size desc nulls last,x.source_year desc nulls last limit 1) mw
  from c
)
select record_id,age_days,week_number,coalesce(evaluation_date,record_date),wf,cfcr,null::numeric,oc,os,oy,mw,null::numeric,
       case when mw is not null then 'management-weekly-v2026.2' end,0::bigint,0::bigint,
       case when oc is null or wf is null then null else round(wf-oc,4) end,
       case when oc is null or oc=0 or wf is null then null else round((wf-oc)/oc*100,2) end,
       case when oc is null or cfcr is null then null else round(cfcr-oc,4) end,
       case when oc is null or oc=0 or cfcr is null then null else round((cfcr-oc)/oc*100,2) end,
       case when mw is null or wf is null then null else round(wf-mw,4) end,
       case when mw is null or mw=0 or wf is null then null else round((wf-mw)/mw*100,2) end,
       null::numeric,null::numeric,'BROILER-FCR-CANONICAL-V3'
from d where pt='broiler'
order by coalesce(evaluation_date,record_date),coalesce(age_days,week_number*7),record_id;
$function$;
