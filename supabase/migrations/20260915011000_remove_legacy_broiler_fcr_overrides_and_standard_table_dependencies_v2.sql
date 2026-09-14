-- Broiler FCR canonical V5
-- One actual FCR calculation path. No catalog-test override and no dependency
-- on the retired poultry_performance_standards table.

drop function if exists public.catalog_test_fcr_override() cascade;
drop function if exists public.apply_broiler_fcr_v11();

create or replace function public.canonicalize_broiler_fcr()
returns trigger
language plpgsql
set search_path to 'pg_catalog','public'
as $function$
declare f record; v_feed numeric; v_cum_feed numeric:=0; v_previous_weight numeric; v_weekly_fcr numeric; v_cumulative_fcr numeric; v_cum_feed_prior numeric:=0; metrics jsonb;
begin
  select * into f from public.flocks where id=new.flock_id;
  if not found or lower(coalesce(f.production_type,'')) not in ('broiler','گوشتی','meat') then return new; end if;
  v_feed:=greatest(coalesce(new.feed_total_kg,0),0);
  select p.average_weight_g into v_previous_weight from public.weekly_records p where p.flock_id=new.flock_id and (new.id is null or p.id<>new.id) and (coalesce(p.age_days,p.week_number*7),coalesce(p.evaluation_date,p.record_date),p.created_at,p.id)<(coalesce(new.age_days,new.week_number*7),coalesce(new.evaluation_date,new.record_date),coalesce(new.created_at,now()),coalesce(new.id,'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)) order by coalesce(p.age_days,p.week_number*7) desc,coalesce(p.evaluation_date,p.record_date) desc,p.created_at desc,p.id desc limit 1;
  select coalesce(sum(coalesce(w.feed_total_kg,0)),0) into v_cum_feed_prior from public.weekly_records w where w.flock_id=new.flock_id and (new.id is null or w.id<>new.id) and coalesce(w.week_number,w.production_week,case when w.age_days is not null then greatest(1,ceil(w.age_days/7.0)::int) end)<=coalesce(new.week_number,new.production_week,case when new.age_days is not null then greatest(1,ceil(new.age_days/7.0)::int) end);
  if new.feed_total_kg is not null and new.average_weight_g is not null and new.live_birds is not null and new.live_birds>0 then
    if v_previous_weight is null then v_previous_weight:=f.initial_average_weight_g; end if;
    if v_previous_weight is not null and new.average_weight_g>v_previous_weight then v_weekly_fcr:=round((v_feed/((new.live_birds*(new.average_weight_g-v_previous_weight))/1000.0))::numeric,4); end if;
    if f.initial_average_weight_g is not null and new.average_weight_g>f.initial_average_weight_g then v_cum_feed:=v_cum_feed_prior+v_feed; v_cumulative_fcr:=round((v_cum_feed/((new.live_birds*(new.average_weight_g-f.initial_average_weight_g))/1000.0))::numeric,4); end if;
  end if;
  new.fcr:=v_weekly_fcr; new.cumulative_fcr:=v_cumulative_fcr;
  metrics:=coalesce(new.production_metrics,'{}'::jsonb)||jsonb_build_object('calculation_version','BROILER-FCR-CANONICAL-V5','fcr_formula','feed_kg / comparable_live_weight_gain_kg','weekly_fcr',v_weekly_fcr,'cumulative_fcr',v_cumulative_fcr,'weekly_fcr_semantics','period_feed_kg / (current_live_birds × period_per_bird_weight_gain_g / 1000)','cumulative_fcr_semantics','cumulative_feed_kg / (current_live_birds × total_per_bird_weight_gain_from_placement_g / 1000)','mortality_in_comparable_fcr',false,'standard_source','BROILER-CANONICAL-STANDARDS-V2')-'catalog_override'-'catalog_fcr'-'catalog_cumulative_fcr'-'catalog_standard_weight_g';
  new.production_metrics:=metrics; return new;
end;
$function$;

create or replace function public.validate_fcr_mortality_integrity()
returns trigger language plpgsql set search_path to 'public'
as $function$
declare f record; prev record; base_count numeric; mortality_cum numeric; mortality_week numeric; avg_birds numeric; water_ratio numeric; water_ratio_status text; water_target_low numeric:=1.6; water_target_high numeric:=1.8; water_hot_high numeric:=2.2; days_in_period integer; metrics jsonb;
begin
  select * into f from public.flocks where id=new.flock_id; if not found then return new; end if;
  if coalesce(new.feed_total_kg,0)<0 or coalesce(new.live_birds,0)<0 or coalesce(new.mortality_count,0)<0 or coalesce(new.average_weight_g,0)<0 or coalesce(new.water_total_liter,0)<0 then raise exception 'مقادیر خوراک، پرنده، تلفات، وزن و آب نمی‌توانند منفی باشند'; end if;
  if new.average_weight_g is null then new.average_weight_g:=new.average_weight; end if; if new.feed_total_kg is null and new.feed is not null then new.feed_total_kg:=new.feed; end if; if new.water_total_liter is null and new.water is not null then new.water_total_liter:=new.water; end if; if new.live_birds is null then new.live_birds:=new.bird_count; end if;
  select w.id,w.live_birds,w.evaluation_date,w.record_date into prev from public.weekly_records w where w.flock_id=new.flock_id and w.id<>new.id and (coalesce(w.evaluation_date,w.record_date),w.created_at,w.id)<(coalesce(new.evaluation_date,new.record_date),coalesce(new.created_at,now()),coalesce(new.id,'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)) order by coalesce(w.evaluation_date,w.record_date) desc,w.created_at desc,w.id desc limit 1;
  base_count:=f.initial_bird_count;
  if base_count>0 then select coalesce(sum(coalesce(w.mortality_count,0)),0) into mortality_cum from public.weekly_records w where w.flock_id=new.flock_id and w.id<>new.id and coalesce(w.evaluation_date,w.record_date)<=coalesce(new.evaluation_date,new.record_date); mortality_cum:=round((mortality_cum+coalesce(new.mortality_count,0))*100/base_count,3); end if;
  if coalesce(prev.live_birds,base_count)>0 and new.mortality_count is not null then mortality_week:=round(new.mortality_count*100/coalesce(prev.live_birds,base_count),3); end if;
  new.mortality:=mortality_cum; new.livability:=case when mortality_cum is null then null else greatest(0,round(100-mortality_cum,3)) end;
  days_in_period:=greatest(1,coalesce(new.evaluation_date,new.record_date)-coalesce(prev.evaluation_date,f.placement_date,current_date)); avg_birds:=case when new.live_birds is not null then (coalesce(prev.live_birds,base_count,new.live_birds)+new.live_birds)/2.0 end;
  if avg_birds>0 and new.feed_total_kg is not null then new.feed_per_bird_g:=round(new.feed_total_kg*1000/avg_birds,3); end if; if avg_birds>0 and new.water_total_liter is not null then new.water_per_bird_ml:=round(new.water_total_liter*1000/avg_birds,3); end if;
  if new.water_total_liter is not null and new.feed_total_kg>0 then water_ratio:=round(new.water_total_liter/new.feed_total_kg,3); new.water_feed_ratio:=water_ratio; water_ratio_status:=case when water_ratio between water_target_low and water_target_high then 'normal_at_21C' when water_ratio<=water_hot_high then 'temperature_or_environment_sensitive' else 'abnormally_high_investigate' end; end if;
  metrics:=coalesce(new.production_metrics,'{}'::jsonb)||jsonb_build_object('feed_semantics','weekly_period_kg','water_semantics','weekly_period_liter','days_in_period',days_in_period,'average_live_birds',avg_birds,'period_feed_kg',new.feed_total_kg,'water_feed_ratio',water_ratio,'water_feed_standard_low',water_target_low,'water_feed_standard_high',water_target_high,'water_feed_hot_upper',water_hot_high,'water_feed_status',water_ratio_status,'mortality_week_percent',mortality_week,'mortality_cumulative_percent',mortality_cum,'livability_cumulative_percent',new.livability);
  new.production_metrics:=metrics; return new;
end;
$function$;

update public.weekly_records w set feed_total_kg=w.feed_total_kg where exists (select 1 from public.flocks f where f.id=w.flock_id and lower(coalesce(f.production_type,'')) in ('broiler','گوشتی','meat'));