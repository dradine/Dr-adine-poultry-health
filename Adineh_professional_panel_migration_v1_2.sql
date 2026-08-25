-- ============================================================
-- ADINEH POULTRY HEALTH CENTER
-- PROFESSIONAL / SPECIALIST PANEL - DATABASE MIGRATION
-- Version: 1.0
-- اجرای این فایل قبل از ZIP نهایی انجام شود.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1) Farm operational / monitoring status
-- ------------------------------------------------------------

alter table public.farms
    add column if not exists operational_status text not null default 'active';

alter table public.farms
    add column if not exists monitoring_status text not null default 'unknown';

alter table public.farms
    add column if not exists monitoring_message text;

alter table public.farms
    add column if not exists monitoring_updated_at timestamptz;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'farms_operational_status_check'
    ) then
        alter table public.farms
        add constraint farms_operational_status_check
        check (operational_status in ('active','inactive','preparing'));
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'farms_monitoring_status_check'
    ) then
        alter table public.farms
        add constraint farms_monitoring_status_check
        check (monitoring_status in ('unknown','good','acceptable','poor'));
    end if;
end $$;

update public.farms
set operational_status =
    case
        when coalesce(is_active,false) = true then 'active'
        else 'inactive'
    end
where operational_status is null
   or operational_status not in ('active','inactive','preparing');

-- ------------------------------------------------------------
-- 2) Professional lists: maximum 5 lists per professional
-- ------------------------------------------------------------

create table if not exists public.professional_farm_lists (
    id uuid primary key default gen_random_uuid(),
    professional_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists professional_farm_lists_owner_name_idx
on public.professional_farm_lists (professional_id, lower(name));

create index if not exists professional_farm_lists_owner_idx
on public.professional_farm_lists (professional_id);

create table if not exists public.professional_farm_list_items (
    id uuid primary key default gen_random_uuid(),
    list_id uuid not null references public.professional_farm_lists(id) on delete cascade,
    farm_id uuid not null references public.farms(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique(list_id, farm_id)
);

create index if not exists professional_farm_list_items_list_idx
on public.professional_farm_list_items(list_id);

create index if not exists professional_farm_list_items_farm_idx
on public.professional_farm_list_items(farm_id);

-- ------------------------------------------------------------
-- 3) Professional messages
-- ------------------------------------------------------------

create table if not exists public.professional_messages (
    id uuid primary key default gen_random_uuid(),
    farm_id uuid not null references public.farms(id) on delete cascade,
    sender_id uuid not null references auth.users(id) on delete cascade,
    recipient_id uuid not null references auth.users(id) on delete cascade,
    body text,
    file_path text,
    file_name text,
    file_size_bytes integer,
    created_at timestamptz not null default now(),
    read_at timestamptz
);

create index if not exists professional_messages_farm_idx
on public.professional_messages(farm_id, created_at desc);

create index if not exists professional_messages_recipient_idx
on public.professional_messages(recipient_id, created_at desc);

create index if not exists professional_messages_sender_idx
on public.professional_messages(sender_id, created_at desc);

-- ------------------------------------------------------------
-- 4) Professional notifications
-- ------------------------------------------------------------

create table if not exists public.professional_notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    farm_id uuid references public.farms(id) on delete cascade,
    notification_type text not null default 'system',
    title text not null,
    body text not null,
    metadata jsonb not null default '{}'::jsonb,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists professional_notifications_user_idx
on public.professional_notifications(user_id, is_read, created_at desc);

-- ------------------------------------------------------------
-- 5) Helper: professional account
-- Main-program users are intentionally excluded.
-- ------------------------------------------------------------

create or replace function public.is_professional_panel_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and coalesce(p.status,'active') = 'active'
          and coalesce(p.is_active,true) = true
          and coalesce(p.role,'user') not in ('owner','admin')
          and not exists (
              select 1 from public.professional_profiles pp
              where pp.user_id = p.id
                and pp.user_type in ('farm_operator','farm_manager','poultry_technical_expert')
          )
    );
$$;

-- ------------------------------------------------------------
-- 6) Helper: active professional access to a farm
-- Reuses the project's existing get_my_farm_access() contract.
-- ------------------------------------------------------------

create or replace function public.professional_can_access_farm(p_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select
        public.is_professional_panel_user()
        and exists (
            select 1
            from public.get_my_farm_access() a
            where a.farm_id = p_farm_id
              and a.connection_status = 'active'
        );
$$;

-- ------------------------------------------------------------
-- 7) Professional dashboard data
-- Includes owner name/phone, category, status and monitoring.
-- ------------------------------------------------------------

create or replace function public.professional_get_farms()
returns table (
    farm_id uuid,
    connection_id uuid,
    connection_status text,
    professional_type text,
    farm_name text,
    farm_code text,
    farm_type text,
    farm_is_active boolean,
    operational_status text,
    monitoring_status text,
    monitoring_message text,
    monitoring_updated_at timestamptz,
    farmer_id uuid,
    farmer_name text,
    farmer_phone text
)
language sql
stable
security definer
set search_path = public
as $$
    select
        a.farm_id,
        a.connection_id,
        a.connection_status,
        a.professional_type,
        f.name,
        f.farm_code,
        f.farm_type,
        coalesce(f.is_active,false),
        coalesce(f.operational_status,
            case when coalesce(f.is_active,false) then 'active' else 'inactive' end),
        coalesce(f.monitoring_status,'unknown'),
        f.monitoring_message,
        f.monitoring_updated_at,
        f.owner_id,
        p.full_name,
        p.phone
    from public.get_my_farm_access() a
    join public.farms f on f.id = a.farm_id
    left join public.profiles p on p.id = f.owner_id
    where a.connection_status in ('active','pending')
    order by
        case when a.connection_status = 'pending' then 0 else 1 end,
        f.name;
$$;

-- ------------------------------------------------------------
-- 8) Current professional identity
-- Professional code is read-only by design.
-- ------------------------------------------------------------

create or replace function public.professional_get_identity()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    p public.profiles%rowtype;
    pp public.professional_profiles%rowtype;
    code text;
begin
    select * into p
    from public.profiles
    where id = auth.uid();

    select * into pp
    from public.professional_profiles
    where user_id = auth.uid();

    select coalesce(pac.professional_code, pac.access_code)
    into code
    from public.professional_access_codes pac
    where pac.user_id = auth.uid()
    order by pac.created_at desc nulls last
    limit 1;

    return jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'phone', p.phone,
        'user_type', pp.user_type,
        'activity_types', pp.activity_types,
        'organization_name', pp.organization_name,
        'license_number', pp.license_number,
        'province', pp.province,
        'city', pp.city,
        'specialty', pp.specialty,
        'notes', pp.notes,
        'professional_code', code
    );
end;
$$;

-- ------------------------------------------------------------
-- 9) Update own registration information
-- Professional code and system role cannot be changed here.
-- ------------------------------------------------------------

create or replace function public.professional_update_my_profile(
    p_full_name text,
    p_phone text,
    p_email text,
    p_user_type text default null,
    p_activity_types jsonb default '[]'::jsonb,
    p_organization_name text default null,
    p_license_number text default null,
    p_province text default null,
    p_city text default null,
    p_specialty text default null,
    p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
begin
    if not public.is_professional_panel_user() then
        raise exception 'PROFESSIONAL_ACCESS_REQUIRED';
    end if;

    if nullif(trim(coalesce(p_full_name,'')),'') is null then
        raise exception 'FULL_NAME_REQUIRED';
    end if;

    update public.profiles
    set
        full_name = trim(p_full_name),
        phone = nullif(trim(p_phone),''),
        email = lower(nullif(trim(p_email),''))
    where id = uid;

    insert into public.professional_profiles (
        user_id,
        user_type,
        activity_types,
        organization_name,
        license_number,
        province,
        city,
        specialty,
        notes
    )
    values (
        uid,
        coalesce(nullif(trim(p_user_type),''), 'other'),
        coalesce(p_activity_types, '[]'::jsonb),
        nullif(trim(p_organization_name),''),
        nullif(trim(p_license_number),''),
        nullif(trim(p_province),''),
        nullif(trim(p_city),''),
        nullif(trim(p_specialty),''),
        nullif(trim(p_notes),'')
    )
    on conflict (user_id) do update set
        user_type = excluded.user_type,
        activity_types = excluded.activity_types,
        organization_name = excluded.organization_name,
        license_number = excluded.license_number,
        province = excluded.province,
        city = excluded.city,
        specialty = excluded.specialty,
        notes = excluded.notes,
        updated_at = now();

    return public.professional_get_identity();
end;
$$;

-- ------------------------------------------------------------
-- 10) Farm lists CRUD
-- ------------------------------------------------------------

create or replace function public.professional_create_list(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    new_id uuid;
    total_count integer;
begin
    if not public.is_professional_panel_user() then
        raise exception 'PROFESSIONAL_ACCESS_REQUIRED';
    end if;

    select count(*) into total_count
    from public.professional_farm_lists
    where professional_id = uid;

    if total_count >= 5 then
        raise exception 'MAXIMUM_5_LISTS';
    end if;

    if nullif(trim(p_name),'') is null then
        raise exception 'LIST_NAME_REQUIRED';
    end if;

    insert into public.professional_farm_lists(professional_id,name)
    values(uid,trim(p_name))
    returning id into new_id;

    return new_id;
end;
$$;

create or replace function public.professional_rename_list(
    p_list_id uuid,
    p_name text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
    if not exists (
        select 1 from public.professional_farm_lists
        where id = p_list_id
          and professional_id = auth.uid()
    ) then
        raise exception 'LIST_NOT_FOUND';
    end if;

    update public.professional_farm_lists
    set name = trim(p_name), updated_at = now()
    where id = p_list_id
      and professional_id = auth.uid();

    return true;
end;
$$;

create or replace function public.professional_delete_list(p_list_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.professional_farm_lists
    where id = p_list_id
      and professional_id = auth.uid();

    if not found then
        raise exception 'LIST_NOT_FOUND';
    end if;

    return true;
end;
$$;

create or replace function public.professional_add_farm_to_list(
    p_list_id uuid,
    p_farm_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
    if not exists (
        select 1
        from public.professional_farm_lists
        where id = p_list_id
          and professional_id = auth.uid()
    ) then
        raise exception 'LIST_NOT_FOUND';
    end if;

    if not public.professional_can_access_farm(p_farm_id) then
        raise exception 'FARM_ACCESS_REQUIRED';
    end if;

    insert into public.professional_farm_list_items(list_id,farm_id)
    values(p_list_id,p_farm_id)
    on conflict (list_id,farm_id) do nothing;

    return true;
end;
$$;

create or replace function public.professional_remove_farm_from_list(
    p_list_id uuid,
    p_farm_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
    delete from public.professional_farm_list_items i
    using public.professional_farm_lists l
    where i.list_id = p_list_id
      and i.farm_id = p_farm_id
      and l.id = i.list_id
      and l.professional_id = auth.uid()
    returning true;
$$;

create or replace function public.professional_get_lists()
returns table (
    list_id uuid,
    list_name text,
    farm_id uuid,
    farm_name text
)
language sql
stable
security definer
set search_path = public
as $$
    select
        l.id,
        l.name,
        i.farm_id,
        f.name
    from public.professional_farm_lists l
    left join public.professional_farm_list_items i on i.list_id = l.id
    left join public.farms f on f.id = i.farm_id
    where l.professional_id = auth.uid()
    order by l.created_at, f.name;
$$;

-- ------------------------------------------------------------
-- 11) Messages
-- Professional -> farmer and farmer -> professional.
-- The UI will initially expose the professional -> farmer flow.
-- ------------------------------------------------------------

create or replace function public.professional_send_message(
    p_farm_id uuid,
    p_body text default null,
    p_file_path text default null,
    p_file_name text default null,
    p_file_size_bytes integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    farmer_id uuid;
    msg_id uuid;
begin
    if not public.professional_can_access_farm(p_farm_id) then
        raise exception 'FARM_ACCESS_REQUIRED';
    end if;

    select owner_id into farmer_id
    from public.farms
    where id = p_farm_id;

    if farmer_id is null then
        raise exception 'FARM_NOT_FOUND';
    end if;

    if nullif(trim(coalesce(p_body,'')),'') is null
       and nullif(trim(coalesce(p_file_path,'')),'') is null then
        raise exception 'MESSAGE_OR_FILE_REQUIRED';
    end if;

    if coalesce(p_file_size_bytes,0) >= 716800 then
        raise exception 'FILE_MUST_BE_LESS_THAN_700KB';
    end if;

    insert into public.professional_messages(
        farm_id,
        sender_id,
        recipient_id,
        body,
        file_path,
        file_name,
        file_size_bytes
    )
    values(
        p_farm_id,
        uid,
        farmer_id,
        nullif(trim(p_body),''),
        nullif(trim(p_file_path),''),
        nullif(trim(p_file_name),''),
        p_file_size_bytes
    )
    returning id into msg_id;

    insert into public.professional_notifications(
        user_id,farm_id,notification_type,title,body,metadata
    )
    values(
        farmer_id,
        p_farm_id,
        'message',
        'پیام جدید از متخصص',
        coalesce(nullif(trim(p_body),''),'یک فایل جدید برای شما ارسال شده است.'),
        jsonb_build_object('message_id',msg_id)
    );

    return msg_id;
end;
$$;

-- ------------------------------------------------------------
-- 12) Message list for a professional
-- ------------------------------------------------------------

create or replace function public.professional_get_messages(p_farm_id uuid)
returns table (
    id uuid,
    sender_id uuid,
    sender_name text,
    body text,
    file_path text,
    file_name text,
    file_size_bytes integer,
    created_at timestamptz,
    read_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
    select
        m.id,
        m.sender_id,
        p.full_name,
        m.body,
        m.file_path,
        m.file_name,
        m.file_size_bytes,
        m.created_at,
        m.read_at
    from public.professional_messages m
    left join public.profiles p on p.id = m.sender_id
    where m.farm_id = p_farm_id
      and public.professional_can_access_farm(p_farm_id)
      and (m.sender_id = auth.uid() or m.recipient_id = auth.uid())
    order by m.created_at asc;
$$;

-- ------------------------------------------------------------
-- 13) Notifications
-- ------------------------------------------------------------

create or replace function public.professional_get_notifications()
returns table (
    id uuid,
    farm_id uuid,
    notification_type text,
    title text,
    body text,
    metadata jsonb,
    is_read boolean,
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Materialize a fresh alert for every newly-detected poor farm
    -- currently assigned to this professional.
    insert into public.professional_notifications(
        user_id,
        farm_id,
        notification_type,
        title,
        body,
        metadata
    )
    select
        auth.uid(),
        a.farm_id,
        'farm_alert',
        'هشدار وضعیت فارم',
        coalesce(f.monitoring_message,'وضعیت فارم نامناسب تشخیص داده شد.'),
        jsonb_build_object(
            'monitoring_updated_at',f.monitoring_updated_at,
            'farm_name',f.name
        )
    from public.get_my_farm_access() a
    join public.farms f on f.id = a.farm_id
    where a.connection_status = 'active'
      and f.monitoring_status = 'poor'
      and f.monitoring_updated_at is not null
      and not exists (
          select 1
          from public.professional_notifications n
          where n.user_id = auth.uid()
            and n.farm_id = f.id
            and n.notification_type = 'farm_alert'
            and n.metadata->>'monitoring_updated_at'
                = f.monitoring_updated_at::text
      );

    return query
    select
        n.id,
        n.farm_id,
        n.notification_type,
        n.title,
        n.body,
        n.metadata,
        n.is_read,
        n.created_at
    from public.professional_notifications n
    where n.user_id = auth.uid()
    order by n.created_at desc
    limit 100;
end;
$$;

create or replace function public.professional_mark_notification_read(p_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
    update public.professional_notifications
    set is_read = true
    where id = p_id
      and user_id = auth.uid()
    returning true;
$$;

-- ------------------------------------------------------------
-- 14) Automatic weekly monitoring
-- Conservative automatic red-alert logic.
-- Later the frontend score engine can add the detailed strain-based
-- standards without changing the access architecture.
-- ------------------------------------------------------------

create or replace function public.evaluate_weekly_farm_monitoring(p_weekly_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    r record;
    farm_status text := 'good';
    msg text := null;
    mortality_rate numeric := null;
begin
    select
        w.*,
        f.name as farm_name,
        f.owner_id
    into r
    from public.weekly_records w
    join public.farms f on f.id = w.farm_id
    where w.id = p_weekly_id;

    if not found then
        raise exception 'WEEKLY_RECORD_NOT_FOUND';
    end if;

    if coalesce(r.live_birds,0) > 0 then
        mortality_rate :=
            (coalesce(r.mortality_count,0)::numeric
            / r.live_birds::numeric) * 100;
    end if;

    if mortality_rate is not null and mortality_rate >= 1.0 then
        farm_status := 'poor';
        msg := 'تلفات هفتگی از آستانه هشدار عبور کرده است.';
    elsif coalesce(r.uniformity_10_percent,100) < 70 then
        farm_status := 'poor';
        msg := 'یکنواختی گله در محدوده نامناسب قرار گرفته است.';
    elsif coalesce(r.cv_percent,0) > 15 then
        farm_status := 'poor';
        msg := 'ضریب تغییرات وزن در محدوده نامناسب قرار گرفته است.';
    else
        farm_status := 'good';
        msg := null;
    end if;

    update public.farms
    set
        monitoring_status = farm_status,
        monitoring_message = msg,
        monitoring_updated_at = now()
    where id = r.farm_id;

    -- Notifications are generated for the current active professional
    -- on their next panel refresh. This avoids depending on an external
    -- push service and remains fully inside Supabase.
    if farm_status = 'poor' then
        insert into public.professional_notifications(
            user_id,
            farm_id,
            notification_type,
            title,
            body,
            metadata
        )
        select
            auth.uid(),
            r.farm_id,
            'farm_alert',
            'هشدار وضعیت فارم',
            coalesce(msg,'وضعیت فارم نامناسب تشخیص داده شد.'),
            jsonb_build_object(
                'weekly_id',r.id,
                'mortality_rate',mortality_rate,
                'farm_name',r.farm_name
            )
        where public.is_professional_panel_user();
    end if;

    return farm_status;
end;
$$;

-- ------------------------------------------------------------
-- 15) Trigger weekly evaluation automatically after save
-- ------------------------------------------------------------

create or replace function public.trg_weekly_monitoring()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.evaluate_weekly_farm_monitoring(new.id);
    return new;
end;
$$;

drop trigger if exists trg_weekly_records_monitoring on public.weekly_records;

create trigger trg_weekly_records_monitoring
after insert or update on public.weekly_records
for each row
execute function public.trg_weekly_monitoring();

-- ------------------------------------------------------------
-- 16) RLS
-- ------------------------------------------------------------

alter table public.professional_farm_lists enable row level security;
alter table public.professional_farm_list_items enable row level security;
alter table public.professional_messages enable row level security;
alter table public.professional_notifications enable row level security;

drop policy if exists professional_lists_select_own on public.professional_farm_lists;
create policy professional_lists_select_own
on public.professional_farm_lists
for select to authenticated
using (professional_id = auth.uid());

drop policy if exists professional_lists_insert_own on public.professional_farm_lists;
create policy professional_lists_insert_own
on public.professional_farm_lists
for insert to authenticated
with check (professional_id = auth.uid());

drop policy if exists professional_lists_update_own on public.professional_farm_lists;
create policy professional_lists_update_own
on public.professional_farm_lists
for update to authenticated
using (professional_id = auth.uid())
with check (professional_id = auth.uid());

drop policy if exists professional_lists_delete_own on public.professional_farm_lists;
create policy professional_lists_delete_own
on public.professional_farm_lists
for delete to authenticated
using (professional_id = auth.uid());

drop policy if exists professional_list_items_select_own on public.professional_farm_list_items;
create policy professional_list_items_select_own
on public.professional_farm_list_items
for select to authenticated
using (
    exists (
        select 1 from public.professional_farm_lists l
        where l.id = list_id and l.professional_id = auth.uid()
    )
);

drop policy if exists professional_list_items_insert_own on public.professional_farm_list_items;
create policy professional_list_items_insert_own
on public.professional_farm_list_items
for insert to authenticated
with check (
    exists (
        select 1 from public.professional_farm_lists l
        where l.id = list_id and l.professional_id = auth.uid()
    )
    and public.professional_can_access_farm(farm_id)
);

drop policy if exists professional_list_items_delete_own on public.professional_farm_list_items;
create policy professional_list_items_delete_own
on public.professional_farm_list_items
for delete to authenticated
using (
    exists (
        select 1 from public.professional_farm_lists l
        where l.id = list_id and l.professional_id = auth.uid()
    )
);

drop policy if exists professional_messages_select_participant on public.professional_messages;
create policy professional_messages_select_participant
on public.professional_messages
for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists professional_messages_insert_sender on public.professional_messages;
create policy professional_messages_insert_sender
on public.professional_messages
for insert to authenticated
with check (
    sender_id = auth.uid()
    and (
        public.professional_can_access_farm(farm_id)
        or exists (
            select 1 from public.farms f
            where f.id = farm_id and f.owner_id = auth.uid()
        )
    )
);

drop policy if exists professional_notifications_select_own on public.professional_notifications;
create policy professional_notifications_select_own
on public.professional_notifications
for select to authenticated
using (user_id = auth.uid());

drop policy if exists professional_notifications_update_own on public.professional_notifications;
create policy professional_notifications_update_own
on public.professional_notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- 17) Read access to assigned farms / flocks / reports
-- ------------------------------------------------------------

drop policy if exists professional_farms_select on public.farms;
create policy professional_farms_select
on public.farms
for select to authenticated
using (
    owner_id = auth.uid()
    or public.professional_can_access_farm(id)
    or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.role in ('owner','admin')
    )
);

drop policy if exists professional_houses_select on public.houses;
create policy professional_houses_select
on public.houses
for select to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_flocks_select on public.flocks;
create policy professional_flocks_select
on public.flocks
for select to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_weekly_select on public.weekly_records;
create policy professional_weekly_select
on public.weekly_records
for select to authenticated
using (public.professional_can_access_farm(farm_id));

-- ------------------------------------------------------------
-- 18) Professional write access ONLY to health / vaccination /
-- treatment / mortality data.
-- No write policy is granted for weekly_records, farms, houses,
-- flocks, settings or ownership data.
-- ------------------------------------------------------------

drop policy if exists professional_vaccinations_insert on public.vaccinations;
create policy professional_vaccinations_insert
on public.vaccinations
for insert to authenticated
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_vaccinations_update on public.vaccinations;
create policy professional_vaccinations_update
on public.vaccinations
for update to authenticated
using (public.professional_can_access_farm(farm_id))
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_vaccinations_delete on public.vaccinations;
create policy professional_vaccinations_delete
on public.vaccinations
for delete to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_antibody_insert on public.antibody_tests;
create policy professional_antibody_insert
on public.antibody_tests
for insert to authenticated
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_antibody_update on public.antibody_tests;
create policy professional_antibody_update
on public.antibody_tests
for update to authenticated
using (public.professional_can_access_farm(farm_id))
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_antibody_delete on public.antibody_tests;
create policy professional_antibody_delete
on public.antibody_tests
for delete to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_lab_insert on public.lab_tests;
create policy professional_lab_insert
on public.lab_tests
for insert to authenticated
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_lab_update on public.lab_tests;
create policy professional_lab_update
on public.lab_tests
for update to authenticated
using (public.professional_can_access_farm(farm_id))
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_lab_delete on public.lab_tests;
create policy professional_lab_delete
on public.lab_tests
for delete to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_treatment_insert on public.treatment_records;
create policy professional_treatment_insert
on public.treatment_records
for insert to authenticated
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_treatment_update on public.treatment_records;
create policy professional_treatment_update
on public.treatment_records
for update to authenticated
using (public.professional_can_access_farm(farm_id))
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_treatment_delete on public.treatment_records;
create policy professional_treatment_delete
on public.treatment_records
for delete to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_treatments_insert on public.treatments;
create policy professional_treatments_insert
on public.treatments
for insert to authenticated
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_treatments_update on public.treatments;
create policy professional_treatments_update
on public.treatments
for update to authenticated
using (public.professional_can_access_farm(farm_id))
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_treatments_delete on public.treatments;
create policy professional_treatments_delete
on public.treatments
for delete to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_health_events_insert on public.health_events;
create policy professional_health_events_insert
on public.health_events
for insert to authenticated
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_health_events_update on public.health_events;
create policy professional_health_events_update
on public.health_events
for update to authenticated
using (public.professional_can_access_farm(farm_id))
with check (public.professional_can_access_farm(farm_id));

drop policy if exists professional_health_events_delete on public.health_events;
create policy professional_health_events_delete
on public.health_events
for delete to authenticated
using (public.professional_can_access_farm(farm_id));

-- ------------------------------------------------------------
-- 19) Health history read access + mortality detail mutations
-- ------------------------------------------------------------

drop policy if exists professional_vaccinations_select on public.vaccinations;
create policy professional_vaccinations_select
on public.vaccinations
for select to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_antibody_select on public.antibody_tests;
create policy professional_antibody_select
on public.antibody_tests
for select to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_lab_select on public.lab_tests;
create policy professional_lab_select
on public.lab_tests
for select to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_treatment_select on public.treatment_records;
create policy professional_treatment_select
on public.treatment_records
for select to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_treatments_select on public.treatments;
create policy professional_treatments_select
on public.treatments
for select to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_health_events_select on public.health_events;
create policy professional_health_events_select
on public.health_events
for select to authenticated
using (public.professional_can_access_farm(farm_id));

drop policy if exists professional_health_event_signs_select on public.health_event_signs;
create policy professional_health_event_signs_select
on public.health_event_signs
for select to authenticated
using (
    exists (
        select 1
        from public.health_events e
        where e.id = event_id
          and public.professional_can_access_farm(e.farm_id)
    )
);

drop policy if exists professional_health_event_signs_insert on public.health_event_signs;
create policy professional_health_event_signs_insert
on public.health_event_signs
for insert to authenticated
with check (
    exists (
        select 1
        from public.health_events e
        where e.id = event_id
          and public.professional_can_access_farm(e.farm_id)
    )
);

drop policy if exists professional_health_event_signs_delete on public.health_event_signs;
create policy professional_health_event_signs_delete
on public.health_event_signs
for delete to authenticated
using (
    exists (
        select 1
        from public.health_events e
        where e.id = event_id
          and public.professional_can_access_farm(e.farm_id)
    )
);

drop policy if exists professional_health_necropsies_select on public.health_necropsies;
create policy professional_health_necropsies_select
on public.health_necropsies
for select to authenticated
using (
    exists (
        select 1
        from public.health_events e
        where e.id = event_id
          and public.professional_can_access_farm(e.farm_id)
    )
);

drop policy if exists professional_health_necropsies_insert on public.health_necropsies;
create policy professional_health_necropsies_insert
on public.health_necropsies
for insert to authenticated
with check (
    exists (
        select 1
        from public.health_events e
        where e.id = event_id
          and public.professional_can_access_farm(e.farm_id)
    )
);

drop policy if exists professional_health_necropsies_update on public.health_necropsies;
create policy professional_health_necropsies_update
on public.health_necropsies
for update to authenticated
using (
    exists (
        select 1
        from public.health_events e
        where e.id = event_id
          and public.professional_can_access_farm(e.farm_id)
    )
)
with check (
    exists (
        select 1
        from public.health_events e
        where e.id = event_id
          and public.professional_can_access_farm(e.farm_id)
    )
);

drop policy if exists professional_health_necropsies_delete on public.health_necropsies;
create policy professional_health_necropsies_delete
on public.health_necropsies
for delete to authenticated
using (
    exists (
        select 1
        from public.health_events e
        where e.id = event_id
          and public.professional_can_access_farm(e.farm_id)
    )
);

-- ------------------------------------------------------------
-- 20) Storage bucket for professional communication files
-- Client must reject files >= 700 KB.
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('professional-messages','professional-messages',false)
on conflict (id) do nothing;

drop policy if exists professional_message_storage_insert on storage.objects;
create policy professional_message_storage_insert
on storage.objects
for insert to authenticated
with check (
    bucket_id = 'professional-messages'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists professional_message_storage_select on storage.objects;
create policy professional_message_storage_select
on storage.objects
for select to authenticated
using (
    bucket_id = 'professional-messages'
    and (
        (storage.foldername(name))[1] = auth.uid()::text
        or (
            (storage.foldername(name))[2] is not null
            and exists (
                select 1
                from public.farms f
                where f.id = ((storage.foldername(name))[2])::uuid
                  and f.owner_id = auth.uid()
            )
        )
    )
);

commit;

-- ============================================================
-- POST-MIGRATION QUICK CHECKS
-- ============================================================

select
    'professional_get_farms' as check_name,
    count(*) as rows_for_current_user
from public.professional_get_farms();

select
    'professional_lists' as check_name,
    count(*) as my_lists
from public.professional_farm_lists
where professional_id = auth.uid();

select
    'professional_notifications' as check_name,
    count(*) as my_notifications
from public.professional_notifications
where user_id = auth.uid();
