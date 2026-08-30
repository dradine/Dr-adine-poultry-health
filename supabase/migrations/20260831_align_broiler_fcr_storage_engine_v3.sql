-- Align stored broiler FCR fields with the canonical report engine V3.
-- Weekly: period feed / current live birds x period weight gain.
-- Cumulative: cumulative feed / initial bird count x current live weight.
-- This removes the previous biological-vs-comparable ambiguity from the report fields.

create or replace function public.apply_broiler_fcr_v11()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  f record;
  prev record;
  v_week integer;
  v_feed numeric;
  v_cum_feed numeric;
  v_current_weight numeric;
  v_weekly_fcr numeric;
  v_cumulative_fcr numeric;
  metrics jsonb;
begin
  select * into f from public.flocks where id = new.flock_id;
  if not found then return new; end if;
  if lower(coalesce(f.production_type,'')) not in ('broiler','گوشتی','meat') then return new; end if;
  v_week := coalesce(new.week_number,new.production_week,case when new.age_days is not null then greatest(1,ceil(new.age_days/7.0)::int) end);
  v_feed := nullif(new.feed_total_kg,0);
  v_current_weight := nullif(new.average_weight_g,0);
  select w.id,w.average_weight_g,w.live_birds into prev
  from public.weekly_records w
  where w.flock_id=new.flock_id and w.id<>new.id
    and (coalesce(w.age_days,w.week_number*7),coalesce(w.evaluation_date,w.record_date),w.created_at,w.id)
        < (coalesce(new.age_days,v_week*7),coalesce(new.evaluation_date,new.record_date),coalesce(new.created_at,now()),new.id)
  order by coalesce(w.age_days,w.week_number*7) desc nulls last,
           coalesce(w.evaluation_date,w.record_date) desc nulls last,w.created_at desc,w.id desc
  limit 1;
  if v_feed is not null and v_current_weight is not null and new.live_birds is not null and new.live_birds>0 then
    if prev.id is not null and prev.average_weight_g is not null and v_current_weight>prev.average_weight_g then
      v_weekly_fcr := round((v_feed/((new.live_birds*(v_current_weight-prev.average_weight_g))/1000.0))::numeric,4);
    elsif prev.id is null and f.initial_average_weight_g is not null and v_current_weight>f.initial_average_weight_g then
      v_weekly_fcr := round((v_feed/((new.live_birds*(v_current_weight-f.initial_average_weight_g))/1000.0))::numeric,4);
    end if;
  end if;
  select coalesce(sum(coalesce(w.feed_total_kg,0)),0) into v_cum_feed
  from public.weekly_records w
  where w.flock_id=new.flock_id and w.id<>new.id
    and coalesce(w.week_number,w.production_week,case when w.age_days is not null then greatest(1,ceil(w.age_days/7.0)::int) end)<=v_week;
  v_cum_feed := v_cum_feed + coalesce(new.feed_total_kg,0);
  if v_cum_feed>0 and f.initial_bird_count is not null and f.initial_bird_count>0 and v_current_weight is not null and v_current_weight>0 then
    v_cumulative_fcr := round((v_cum_feed/((f.initial_bird_count*v_current_weight)/1000.0))::numeric,4);
  end if;
  new.fcr := v_weekly_fcr;
  new.cumulative_fcr := v_cumulative_fcr;
  metrics := coalesce(new.production_metrics,'{}'::jsonb)
    || jsonb_build_object(
      'calculation_version','BROILER-FCR-CANONICAL-V3',
      'calculation_scope','week_scoped',
      'selected_week',v_week,
      'weekly_fcr',v_weekly_fcr,
      'cumulative_fcr',v_cumulative_fcr,
      'weekly_fcr_semantics','period_feed_kg / (current_live_birds × period_weight_gain_g / 1000)',
      'cumulative_fcr_semantics','cumulative_feed_kg / (initial_bird_count × current_average_weight_g / 1000)',
      'cumulative_feed_scope','weeks_1_through_selected_week_only',
      'mortality_in_comparable_fcr',false,
      'official_fcr_comparison_basis','Total Feed Consumed / Total Live Weight'
    );
  new.production_metrics := metrics;
  return new;
end;
$function$;

update public.weekly_records w
set feed_total_kg=w.feed_total_kg
where exists (select 1 from public.flocks f where f.id=w.flock_id and lower(coalesce(f.production_type,'')) in ('broiler','گوشتی','meat'));
