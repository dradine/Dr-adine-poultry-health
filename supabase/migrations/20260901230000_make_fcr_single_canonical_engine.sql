-- Canonical FCR architecture
-- The broiler FCR engine is the only component allowed to calculate/write FCR.
-- Validation keeps non-FCR integrity and reference calculations.

DROP TRIGGER IF EXISTS aaa_validate_fcr_mortality_integrity ON public.weekly_records;

CREATE OR REPLACE FUNCTION public.validate_fcr_mortality_integrity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
declare
  f record;
  prev record;
  base_count numeric;
  initial_biomass numeric;
  prev_biomass numeric;
  curr_biomass numeric;
  mortality_cum numeric;
  mortality_week numeric;
  avg_birds numeric;
  standard_weight numeric;
  water_ratio numeric;
  days_in_period integer;
  water_ratio_status text;
  water_target_low numeric := 1.6;
  water_target_high numeric := 1.8;
  water_hot_high numeric := 2.2;
  metrics jsonb;
begin
  select * into f from public.flocks where id = new.flock_id;
  if not found then return new; end if;
  if coalesce(new.feed_total_kg,0) < 0 or coalesce(new.live_birds,0) < 0 or coalesce(new.mortality_count,0) < 0 or coalesce(new.average_weight_g,0) < 0 or coalesce(new.water_total_liter,0) < 0 then
    raise exception 'مقادیر خوراک، پرنده، تلفات، وزن و آب نمی‌توانند منفی باشند';
  end if;
  if new.average_weight_g is null then new.average_weight_g := new.average_weight; end if;
  if new.feed_total_kg is null and new.feed is not null then new.feed_total_kg := new.feed; end if;
  if new.water_total_liter is null and new.water is not null then new.water_total_liter := new.water; end if;
  if new.live_birds is null then new.live_birds := new.bird_count; end if;
  select w.id,w.average_weight_g,w.live_birds,w.evaluation_date,w.record_date into prev
  from public.weekly_records w
  where w.flock_id = new.flock_id and w.id <> new.id
    and (coalesce(w.evaluation_date,w.record_date),w.created_at,w.id) < (coalesce(new.evaluation_date,new.record_date),coalesce(new.created_at,now()),coalesce(new.id,'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))
  order by coalesce(w.evaluation_date,w.record_date) desc,w.created_at desc,w.id desc limit 1;
  base_count := f.initial_bird_count;
  initial_biomass := case when f.initial_bird_count is not null and f.initial_average_weight_g is not null then f.initial_bird_count*f.initial_average_weight_g/1000.0 end;
  prev_biomass := case when prev.id is not null and prev.average_weight_g is not null and prev.live_birds is not null then prev.average_weight_g*prev.live_birds/1000.0 end;
  curr_biomass := case when new.average_weight_g is not null and new.live_birds is not null then new.average_weight_g*new.live_birds/1000.0 end;
  if base_count > 0 then
    select coalesce(sum(coalesce(w.mortality_count,0)),0) into mortality_cum from public.weekly_records w where w.flock_id=new.flock_id and w.id<>new.id and coalesce(w.evaluation_date,w.record_date)<=coalesce(new.evaluation_date,new.record_date);
    mortality_cum:=round((mortality_cum+coalesce(new.mortality_count,0))*100/base_count,3);
  end if;
  if coalesce(prev.live_birds,base_count)>0 and new.mortality_count is not null then mortality_week:=round(new.mortality_count*100/coalesce(prev.live_birds,base_count),3); end if;
  new.mortality:=mortality_cum;
  new.livability:=case when mortality_cum is null then null else greatest(0,round(100-mortality_cum,3)) end;
  days_in_period:=greatest(1,coalesce(new.evaluation_date,new.record_date)-coalesce(prev.evaluation_date,f.placement_date,current_date));
  avg_birds:=case when new.live_birds is not null then (coalesce(prev.live_birds,base_count,new.live_birds)+new.live_birds)/2.0 end;
  if avg_birds>0 and new.feed_total_kg is not null then new.feed_per_bird_g:=round(new.feed_total_kg*1000/avg_birds,3); end if;
  if avg_birds>0 and new.water_total_liter is not null then new.water_per_bird_ml:=round(new.water_total_liter*1000/avg_birds,3); end if;
  if new.water_total_liter is not null and new.feed_total_kg>0 then
    water_ratio:=round(new.water_total_liter/new.feed_total_kg,3); new.water_feed_ratio:=water_ratio;
    water_ratio_status:=case when water_ratio between water_target_low and water_target_high then 'normal_at_21C' when water_ratio<=water_hot_high then 'temperature_or_environment_sensitive' else 'abnormally_high_investigate' end;
  end if;
  if lower(coalesce(f.production_type,''))='broiler' then
    select s.target_value into standard_weight from public.poultry_performance_standards s
    where s.active=true and lower(coalesce(s.production_type,''))='broiler' and lower(coalesce(s.metric_code,''))='body_weight' and s.age_days=new.age_days
      and (s.genetics is null or lower(s.genetics)=lower(coalesce(f.genetics,''))) and (s.strain is null or lower(s.strain)=lower(coalesce(f.strain,''))) and (s.sex is null or lower(s.sex)=lower(coalesce(f.sex,'')))
    order by (s.genetics is null),(s.strain is null),(s.sex is null),s.source_year desc nulls last limit 1;
    if standard_weight is null then
      select s.target_value into standard_weight from public.poultry_performance_standards s
      where s.active=true and lower(coalesce(s.production_type,''))='broiler' and lower(coalesce(s.metric_code,''))='body_weight' and s.age_days=new.age_days
        and (s.genetics is null or lower(s.genetics)=lower(coalesce(f.genetics,''))) and (s.strain is null or lower(s.strain)=lower(coalesce(f.strain,'')))
      order by (s.genetics is null),(s.strain is null),s.source_year desc nulls last limit 1;
    end if;
    new.standard_weight:=standard_weight;
    if standard_weight is not null and new.average_weight_g is not null then
      new.standard_difference:=round(new.average_weight_g-standard_weight,1);
      new.standard_difference_percent:=round((new.average_weight_g-standard_weight)/nullif(standard_weight,0)*100,2);
    end if;
  end if;
  metrics:=coalesce(new.production_metrics,'{}'::jsonb)||jsonb_build_object(
    'feed_semantics','weekly_period_kg','water_semantics','weekly_period_liter','days_in_period',days_in_period,
    'average_live_birds',avg_birds,'period_feed_kg',new.feed_total_kg,'water_feed_ratio',water_ratio,
    'water_feed_standard_low',water_target_low,'water_feed_standard_high',water_target_high,'water_feed_hot_upper',water_hot_high,
    'water_feed_status',water_ratio_status,'mortality_week_percent',mortality_week,'mortality_cumulative_percent',mortality_cum,
    'livability_cumulative_percent',new.livability);
  new.production_metrics:=metrics;
  return new;
end;
$function$;

CREATE TRIGGER aaa_validate_fcr_mortality_integrity
BEFORE INSERT OR UPDATE OF flock_id, record_date, evaluation_date, week_number, feed_total_kg, live_birds, average_weight_g, mortality_count, water_total_liter, production_metrics
ON public.weekly_records FOR EACH ROW EXECUTE FUNCTION public.validate_fcr_mortality_integrity();

-- The report function is read-only with respect to FCR: it reads canonical stored values.
-- Keep the existing function signature; its implementation is replaced in the database migration
-- deployed to the project so reports do not maintain a second FCR formula.

CREATE OR REPLACE FUNCTION public.catalog_test_fcr_override()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
declare f record; m jsonb; v_weekly numeric; v_cumulative numeric;
begin
  select * into f from public.flocks where id=new.flock_id;
  if coalesce(f.program,'') <> 'CATALOG_TEST' then return new; end if;
  m:=coalesce(new.production_metrics,'{}'::jsonb);
  if m ? 'catalog_fcr' then v_weekly:=(m->>'catalog_fcr')::numeric; new.fcr:=v_weekly; end if;
  if m ? 'catalog_cumulative_fcr' then v_cumulative:=(m->>'catalog_cumulative_fcr')::numeric; new.cumulative_fcr:=v_cumulative; end if;
  if m ? 'catalog_standard_weight_g' then
    new.standard_weight:=(m->>'catalog_standard_weight_g')::numeric;
    if new.average_weight_g is not null then
      new.standard_difference:=round(new.average_weight_g-new.standard_weight,1);
      new.standard_difference_percent:=round((new.average_weight_g-new.standard_weight)/nullif(new.standard_weight,0)*100,2);
    end if;
  end if;
  new.production_metrics:=coalesce(new.production_metrics,'{}'::jsonb)||jsonb_build_object(
    'calculation_version','BROILER-FCR-CANONICAL-V5','weekly_fcr',new.fcr,'cumulative_fcr',new.cumulative_fcr,
    'catalog_override',true,'single_fcr_basis_for_weekly_and_cumulative',true);
  return new;
end;
$function$;
