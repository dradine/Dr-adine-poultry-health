alter table public.broiler_daily_monitoring
  add column if not exists vent_temperature_c numeric check (vent_temperature_c is null or (vent_temperature_c >= 30 and vent_temperature_c <= 45)),
  add column if not exists avg_live_population numeric check (avg_live_population is null or avg_live_population >= 0),
  add column if not exists feed_per_bird_g numeric check (feed_per_bird_g is null or feed_per_bird_g >= 0),
  add column if not exists water_per_bird_ml numeric check (water_per_bird_ml is null or water_per_bird_ml >= 0);

create or replace function public.calc_broiler_daily_consumption_metrics()
returns trigger
language plpgsql
as $$
declare
  base_count numeric;
  opening_live numeric;
  closing_live numeric;
begin
  select initial_bird_count into base_count from public.flocks where id = new.flock_id;

  if base_count is null or base_count <= 0 then
    new.avg_live_population := null;
    new.feed_per_bird_g := null;
    new.water_per_bird_ml := null;
    return new;
  end if;

  opening_live := base_count
    - case when new.age_days = 1 then coalesce(new.doa_count,0) else 0 end;

  select greatest(0, opening_live - coalesce(sum(coalesce(mortality_count,0) + coalesce(cull_count,0)),0))
    into opening_live
    from public.broiler_daily_monitoring r
   where r.flock_id = new.flock_id
     and r.age_days < new.age_days;

  opening_live := greatest(0, opening_live);
  closing_live := greatest(0, opening_live - coalesce(new.mortality_count,0) - coalesce(new.cull_count,0));
  new.avg_live_population := round(((opening_live + closing_live) / 2)::numeric, 3);

  if new.avg_live_population > 0 then
    if new.feed_quantity_kg is not null then
      new.feed_per_bird_g := round((new.feed_quantity_kg * 1000 / new.avg_live_population)::numeric, 4);
    else
      new.feed_per_bird_g := null;
    end if;
    if new.water_quantity_l is not null then
      new.water_per_bird_ml := round((new.water_quantity_l * 1000 / new.avg_live_population)::numeric, 4);
    else
      new.water_per_bird_ml := null;
    end if;
  else
    new.feed_per_bird_g := null;
    new.water_per_bird_ml := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_calc_broiler_daily_consumption_metrics on public.broiler_daily_monitoring;
create trigger trg_calc_broiler_daily_consumption_metrics
before insert or update of doa_count,mortality_count,cull_count,feed_quantity_kg,water_quantity_l,age_days,flock_id
on public.broiler_daily_monitoring
for each row execute function public.calc_broiler_daily_consumption_metrics();

update public.broiler_daily_monitoring r
set avg_live_population = x.avg_live_population,
    feed_per_bird_g = case when r.feed_quantity_kg is not null and x.avg_live_population > 0 then round((r.feed_quantity_kg*1000/x.avg_live_population)::numeric,4) else null end,
    water_per_bird_ml = case when r.water_quantity_l is not null and x.avg_live_population > 0 then round((r.water_quantity_l*1000/x.avg_live_population)::numeric,4) else null end
from (
  select r.id,
         greatest(0, (f.initial_bird_count
           - coalesce((select sum(coalesce(p.doa_count,0)+coalesce(p.mortality_count,0)+coalesce(p.cull_count,0)) from public.broiler_daily_monitoring p where p.flock_id=r.flock_id and p.age_days<r.age_days),0)
           - case when r.age_days=1 then coalesce(r.doa_count,0) else 0 end
         )) as opening_live,
         greatest(0, (f.initial_bird_count
           - coalesce((select sum(coalesce(p.doa_count,0)+coalesce(p.mortality_count,0)+coalesce(p.cull_count,0)) from public.broiler_daily_monitoring p where p.flock_id=r.flock_id and p.age_days<r.age_days),0)
           - case when r.age_days=1 then coalesce(r.doa_count,0) else 0 end
           - coalesce(r.mortality_count,0)-coalesce(r.cull_count,0))) as closing_live,
         ((greatest(0, (f.initial_bird_count - coalesce((select sum(coalesce(p.doa_count,0)+coalesce(p.mortality_count,0)+coalesce(p.cull_count,0)) from public.broiler_daily_monitoring p where p.flock_id=r.flock_id and p.age_days<r.age_days),0) - case when r.age_days=1 then coalesce(r.doa_count,0) else 0 end)) + greatest(0, (f.initial_bird_count - coalesce((select sum(coalesce(p.doa_count,0)+coalesce(p.mortality_count,0)+coalesce(p.cull_count,0)) from public.broiler_daily_monitoring p where p.flock_id=r.flock_id and p.age_days<r.age_days),0) - case when r.age_days=1 then coalesce(r.doa_count,0) else 0 end - coalesce(r.mortality_count,0)-coalesce(r.cull_count,0))))/2) as avg_live_population
    from public.broiler_daily_monitoring r join public.flocks f on f.id=r.flock_id
) x
where r.id=x.id;
