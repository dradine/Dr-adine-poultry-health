-- Canonical broiler standards are now owned by the repository registry:
-- BROILER-CANONICAL-STANDARDS-V2.
-- The legacy Supabase standards table must not remain an alternative authority.

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
  metrics:=coalesce(new.production_metrics,'{}'::jsonb)||jsonb_build_object('feed_semantics','weekly_period_kg','water_semantics','weekly_period_liter','days_in_period',days_in_period,'average_live_birds',avg_birds,'period_feed_kg',new.feed_total_kg,'water_feed_ratio',water_ratio,'water_feed_standard_low',water_target_low,'water_feed_standard_high',water_target_high,'water_feed_hot_upper',water_hot_high,'water_feed_status',water_ratio_status,'mortality_week_percent',mortality_week,'mortality_cumulative_percent',mortality_cum,'livability_cumulative_percent',new.livability);
  new.production_metrics:=metrics;
  return new;
end;
$function$;

DROP FUNCTION IF EXISTS public.get_flock_fcr_analysis_v4(uuid);
DROP FUNCTION IF EXISTS public.refresh_broiler_management_targets_v2026_3();
DROP TABLE IF EXISTS public.poultry_performance_standards CASCADE;

COMMENT ON FUNCTION public.validate_fcr_mortality_integrity() IS
'Canonical integrity trigger. Broiler performance standards are resolved outside the database from BROILER-CANONICAL-STANDARDS-V2; this function never consults a standards table.';
