-- =========================================================
-- ADINEH | FLOCK / FARM LIFECYCLE V3
-- Run once in Supabase SQL Editor
-- =========================================================
begin;

-- New flock = active. When no active flock remains, farm becomes inactive.
-- The flock itself can remain "closed" as an archive record.
alter table public.farms add column if not exists farm_status text;
alter table public.farms alter column farm_status set default 'active';

create or replace function public.sync_farm_lifecycle_from_flocks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_farm_id uuid;
  v_has_active boolean;
  v_owner uuid;
begin
  v_farm_id := coalesce(new.farm_id, old.farm_id);
  if v_farm_id is null then return coalesce(new,old); end if;

  select exists(
    select 1 from public.flocks f
    where f.farm_id=v_farm_id and lower(coalesce(f.status,'active'))='active'
  ) into v_has_active;

  update public.farms
  set farm_status = case when v_has_active then 'active' else 'inactive' end
  where id=v_farm_id;

  -- Keep the professional snapshot synchronized so professional dashboards
  -- automatically classify the farm as active/inactive.
  if to_regclass('public.professional_farm_health_monitoring') is not null then
    update public.professional_farm_health_monitoring
    set updated_at=now(),
        reason=case when v_has_active then 'گله فعال ثبت شده است.' else 'دوره گله پایان یافته و فارم در بایگانی قرار گرفته است.' end
    where farm_id=v_farm_id;
  end if;

  return coalesce(new,old);
end;
$$;

drop trigger if exists trg_sync_farm_lifecycle on public.flocks;
create trigger trg_sync_farm_lifecycle
after insert or update of status or delete on public.flocks
for each row execute function public.sync_farm_lifecycle_from_flocks();

-- Reconcile all farms now.
update public.farms f
set farm_status=case when exists(select 1 from public.flocks fl where fl.farm_id=f.id and lower(coalesce(fl.status,'active'))='active') then 'active' else 'inactive' end;

-- Convenience RPC for farmer dashboard.
create or replace function public.farmer_get_farm_lifecycle(p_farm_id uuid)
returns table(farm_id uuid,farm_status text,active_flock_count bigint,latest_flock_id uuid,latest_flock_name text)
language sql stable security definer set search_path=public
as $$
  select f.id, coalesce(f.farm_status,'inactive'),
         (select count(*) from public.flocks x where x.farm_id=f.id and lower(coalesce(x.status,'active'))='active'),
         (select x.id from public.flocks x where x.farm_id=f.id order by x.created_at desc nulls last limit 1),
         (select x.flock_name from public.flocks x where x.farm_id=f.id order by x.created_at desc nulls last limit 1)
  from public.farms f
  where f.id=p_farm_id and f.owner_id=auth.uid();
$$;

commit;
