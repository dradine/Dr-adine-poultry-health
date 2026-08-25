/* ================================================================
   OWNER MANAGEMENT — BENCHMARK V5
   Fix for real project schema:
   - profiles.user_type may be missing in older installations.
   - profiles.activity_types may also be missing.
   - role/status are enum-safe.
   - professional_profiles is only used for compatible professional types.
   - Owner can edit/save users without touching benchmark/FCR/mortality logic.
   ================================================================ */

begin;

/* 1) Bring the account schema to the contract already used by the app.
      These are additive only; existing data/columns are preserved. */
alter table public.profiles
  add column if not exists user_type text not null default 'other';

alter table public.profiles
  add column if not exists activity_types text[] not null default '{}';

/* 2) Backfill professional identity where it already exists. */
update public.profiles p
set
  user_type = pp.user_type,
  activity_types = coalesce(pp.activity_types, '{}'::text[])
from public.professional_profiles pp
where pp.user_id = p.id
  and pp.user_type is not null
  and (coalesce(p.user_type,'other') = 'other' or p.activity_types = '{}');

/* 3) Owner-only atomic save. */
create or replace function public.owner_update_user_details_v2(
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_role text,
  p_status text,
  p_is_active boolean,
  p_user_type text,
  p_activity_types text[] default '{}',
  p_organization_name text default null,
  p_license_number text default null,
  p_province text default null,
  p_city text default null,
  p_specialty text default null,
  p_notes text default null,
  p_is_verified boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  v_role user_role;
  v_status user_status;
  v_user_type text := coalesce(nullif(trim(p_user_type),''),'other');
  v_activity_types text[] := coalesce(p_activity_types,'{}'::text[]);
  professional_type boolean;
  result jsonb;
begin
  select p.role::text into caller_role
  from public.profiles p
  where p.id = auth.uid();

  if caller_role <> 'owner' then
    raise exception 'OWNER_ACCESS_REQUIRED';
  end if;

  if p_user_id is null then raise exception 'USER_ID_REQUIRED'; end if;
  if nullif(trim(coalesce(p_full_name,'')),'') is null then raise exception 'FULL_NAME_REQUIRED'; end if;

  begin
    v_role := coalesce(nullif(trim(p_role),''),'user')::user_role;
  exception when invalid_text_representation then
    raise exception 'INVALID_ROLE: %', p_role;
  end;

  begin
    v_status := coalesce(nullif(trim(p_status),''),'pending')::user_status;
  exception when invalid_text_representation then
    raise exception 'INVALID_STATUS: %', p_status;
  end;

  professional_type := v_user_type in (
    'veterinarian',
    'technical_veterinarian',
    'veterinary_lab',
    'diagnostic_lab',
    'poultry_technical_expert'
  );

  update public.profiles
  set
    full_name = trim(p_full_name),
    email = nullif(lower(trim(coalesce(p_email,''))),''),
    phone = nullif(trim(coalesce(p_phone,'')),''),
    role = v_role,
    status = v_status,
    is_active = coalesce(p_is_active,true),
    user_type = v_user_type,
    activity_types = v_activity_types,
    updated_at = now()
  where id = p_user_id;

  if not found then raise exception 'USER_NOT_FOUND'; end if;

  if professional_type then
    insert into public.professional_profiles (
      user_id,user_type,activity_types,organization_name,license_number,
      province,city,specialty,notes,is_verified,updated_at
    ) values (
      p_user_id,v_user_type,v_activity_types,
      nullif(trim(coalesce(p_organization_name,'')),''),
      nullif(trim(coalesce(p_license_number,'')),''),
      nullif(trim(coalesce(p_province,'')),''),
      nullif(trim(coalesce(p_city,'')),''),
      nullif(trim(coalesce(p_specialty,'')),''),
      nullif(trim(coalesce(p_notes,'')),''),
      coalesce(p_is_verified,false),now()
    )
    on conflict (user_id) do update set
      user_type=excluded.user_type,
      activity_types=excluded.activity_types,
      organization_name=excluded.organization_name,
      license_number=excluded.license_number,
      province=excluded.province,
      city=excluded.city,
      specialty=excluded.specialty,
      notes=excluded.notes,
      is_verified=excluded.is_verified,
      updated_at=now();
  else
    delete from public.professional_profiles
    where user_id=p_user_id
      and user_type in (
        'veterinarian','technical_veterinarian','veterinary_lab',
        'diagnostic_lab','poultry_technical_expert'
      );
  end if;

  select jsonb_build_object(
    'id',p.id,
    'user_id',p.id,
    'email',p.email,
    'full_name',p.full_name,
    'phone',p.phone,
    'role',p.role::text,
    'status',p.status::text,
    'is_active',p.is_active,
    'user_type',p.user_type,
    'activity_types',p.activity_types,
    'organization_name',pp.organization_name,
    'license_number',pp.license_number,
    'province',pp.province,
    'city',pp.city,
    'specialty',pp.specialty,
    'notes',pp.notes,
    'is_verified',coalesce(pp.is_verified,false)
  ) into result
  from public.profiles p
  left join public.professional_profiles pp on pp.user_id=p.id
  where p.id=p_user_id;

  return result;
end;
$$;

revoke all on function public.owner_update_user_details_v2(
  uuid,text,text,text,text,text,boolean,text,text[],text,text,text,text,text,text,boolean
) from public;

grant execute on function public.owner_update_user_details_v2(
  uuid,text,text,text,text,text,boolean,text,text[],text,text,text,text,text,text,boolean
) to authenticated;

commit;

/* Verification: this should return the installed function signature. */
select
  n.nspname as schema_name,
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname='owner_update_user_details_v2';
