-- ADINEH | FARM -> HOUSE -> FLOCK ACCESS V6
-- IMPORTANT: run once in Supabase SQL Editor.
-- Owner/operator access is based on farms.owner_id.
-- Professional access remains based on professional_can_access_farm().

begin;

alter table public.houses
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.flocks
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

-- Backfill owner_id where possible so existing rows remain usable.
update public.houses h
set owner_id = f.owner_id
from public.farms f
where f.id = h.farm_id
  and h.owner_id is null;

update public.flocks fl
set owner_id = f.owner_id
from public.farms f
where f.id = fl.farm_id
  and fl.owner_id is null;

-- ---------- FARMS ----------
drop policy if exists professional_farms_select on public.farms;
create policy professional_farms_select
on public.farms for select to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role::text,'')) in ('owner','admin')
  )
  or public.professional_can_access_farm(id)
);

-- ---------- HOUSES ----------
drop policy if exists professional_houses_select on public.houses;
drop policy if exists farm_owner_houses_select on public.houses;
drop policy if exists farm_owner_houses_insert on public.houses;
drop policy if exists farm_owner_houses_update on public.houses;
drop policy if exists farm_owner_houses_delete on public.houses;

create policy farm_owner_houses_select
on public.houses for select to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.farms f
    where f.id = houses.farm_id and f.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role::text,'')) in ('owner','admin')
  )
  or public.professional_can_access_farm(farm_id)
);

create policy farm_owner_houses_insert
on public.houses for insert to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.farms f
    where f.id = houses.farm_id and f.owner_id = auth.uid()
  )
);

create policy farm_owner_houses_update
on public.houses for update to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.farms f
    where f.id = houses.farm_id and f.owner_id = auth.uid()
  )
)
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.farms f
    where f.id = houses.farm_id and f.owner_id = auth.uid()
  )
);

create policy farm_owner_houses_delete
on public.houses for delete to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.farms f
    where f.id = houses.farm_id and f.owner_id = auth.uid()
  )
);

-- ---------- FLOCKS ----------
drop policy if exists professional_flocks_select on public.flocks;
drop policy if exists farm_owner_flocks_select on public.flocks;
drop policy if exists farm_owner_flocks_insert on public.flocks;
drop policy if exists farm_owner_flocks_update on public.flocks;
drop policy if exists farm_owner_flocks_delete on public.flocks;

create policy farm_owner_flocks_select
on public.flocks for select to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.farms f
    where f.id = flocks.farm_id and f.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role::text,'')) in ('owner','admin')
  )
  or public.professional_can_access_farm(farm_id)
);

create policy farm_owner_flocks_insert
on public.flocks for insert to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.farms f
    where f.id = flocks.farm_id and f.owner_id = auth.uid()
  )
  and (
    house_id is null
    or exists (
      select 1 from public.houses h
      where h.id = flocks.house_id
        and h.farm_id = flocks.farm_id
        and h.owner_id = auth.uid()
    )
  )
);

create policy farm_owner_flocks_update
on public.flocks for update to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.farms f
    where f.id = flocks.farm_id and f.owner_id = auth.uid()
  )
)
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.farms f
    where f.id = flocks.farm_id and f.owner_id = auth.uid()
  )
  and (
    house_id is null
    or exists (
      select 1 from public.houses h
      where h.id = flocks.house_id
        and h.farm_id = flocks.farm_id
        and h.owner_id = auth.uid()
    )
  )
);

create policy farm_owner_flocks_delete
on public.flocks for delete to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.farms f
    where f.id = flocks.farm_id and f.owner_id = auth.uid()
  )
);

commit;
