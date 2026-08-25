-- ADINEH | FARM / HOUSE / FLOCK ACCESS FIX V4
-- Purpose: restore owner/operator access to houses and flocks.
-- Run once in Supabase SQL Editor.

begin;

-- ------------------------------------------------------------
-- FARMS: owner/admin access + professional assigned access
-- ------------------------------------------------------------

drop policy if exists professional_farms_select on public.farms;
create policy professional_farms_select
on public.farms
for select to authenticated
using (
    owner_id = auth.uid()
    or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and lower(coalesce(p.role::text,'')) in ('owner','admin')
    )
    or public.professional_can_access_farm(id)
);

-- ------------------------------------------------------------
-- HOUSES: owner/operator must be able to read/write own farm houses.
-- Professionals remain read-only through professional_can_access_farm().
-- ------------------------------------------------------------

drop policy if exists professional_houses_select on public.houses;
create policy professional_houses_select
on public.houses
for select to authenticated
using (
    owner_id = auth.uid()
    or exists (
        select 1 from public.farms f
        where f.id = houses.farm_id
          and f.owner_id = auth.uid()
    )
    or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and lower(coalesce(p.role::text,'')) in ('owner','admin')
    )
    or public.professional_can_access_farm(farm_id)
);

drop policy if exists farm_owner_houses_insert on public.houses;
create policy farm_owner_houses_insert
on public.houses
for insert to authenticated
with check (
    owner_id = auth.uid()
    and exists (
        select 1 from public.farms f
        where f.id = houses.farm_id
          and f.owner_id = auth.uid()
    )
);

drop policy if exists farm_owner_houses_update on public.houses;
create policy farm_owner_houses_update
on public.houses
for update to authenticated
using (
    owner_id = auth.uid()
    or exists (select 1 from public.farms f where f.id = houses.farm_id and f.owner_id = auth.uid())
)
with check (
    owner_id = auth.uid()
    and exists (select 1 from public.farms f where f.id = houses.farm_id and f.owner_id = auth.uid())
);

drop policy if exists farm_owner_houses_delete on public.houses;
create policy farm_owner_houses_delete
on public.houses
for delete to authenticated
using (
    owner_id = auth.uid()
    or exists (select 1 from public.farms f where f.id = houses.farm_id and f.owner_id = auth.uid())
);

-- ------------------------------------------------------------
-- FLOCKS: owner/operator must be able to read/write own farm flocks.
-- ------------------------------------------------------------

drop policy if exists professional_flocks_select on public.flocks;
create policy professional_flocks_select
on public.flocks
for select to authenticated
using (
    owner_id = auth.uid()
    or exists (
        select 1 from public.farms f
        where f.id = flocks.farm_id
          and f.owner_id = auth.uid()
    )
    or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and lower(coalesce(p.role::text,'')) in ('owner','admin')
    )
    or public.professional_can_access_farm(farm_id)
);

drop policy if exists farm_owner_flocks_insert on public.flocks;
create policy farm_owner_flocks_insert
on public.flocks
for insert to authenticated
with check (
    owner_id = auth.uid()
    and exists (
        select 1 from public.farms f
        where f.id = flocks.farm_id
          and f.owner_id = auth.uid()
    )
);

drop policy if exists farm_owner_flocks_update on public.flocks;
create policy farm_owner_flocks_update
on public.flocks
for update to authenticated
using (
    owner_id = auth.uid()
    or exists (select 1 from public.farms f where f.id = flocks.farm_id and f.owner_id = auth.uid())
)
with check (
    owner_id = auth.uid()
    and exists (select 1 from public.farms f where f.id = flocks.farm_id and f.owner_id = auth.uid())
);

drop policy if exists farm_owner_flocks_delete on public.flocks;
create policy farm_owner_flocks_delete
on public.flocks
for delete to authenticated
using (
    owner_id = auth.uid()
    or exists (select 1 from public.farms f where f.id = flocks.farm_id and f.owner_id = auth.uid())
);

commit;
