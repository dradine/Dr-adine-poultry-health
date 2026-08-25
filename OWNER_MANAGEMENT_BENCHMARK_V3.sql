/* ================================================================
   OWNER MANAGEMENT — BENCHMARK V3
   Purpose: make Owner > User Details save reliable.
   Important: role/status are explicitly cast to the project's enums.
   user_type/activity_types remain on profiles.
   professional_profiles is updated only for compatible professional types.
================================================================ */

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
  result jsonb;
  professional_type boolean;
  v_role user_role;
  v_status user_status;
begin
  select p.role::text
    into caller_role
  from public.profiles p
  where p.id = auth.uid();

  if caller_role <> 'owner' then
    raise exception 'OWNER_ACCESS_REQUIRED';
  end if;

  if p_user_id is null then
    raise exception 'USER_ID_REQUIRED';
  end if;

  if nullif(trim(coalesce(p_full_name,'')),'') is null then
    raise exception 'FULL_NAME_REQUIRED';
  end if;

  /* Explicit enum conversion fixes: column role is user_role, not text. */
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

  professional_type := lower(coalesce(trim(p_user_type),'other')) in (
    'veterinarian',
    'technical_veterinarian',
    'veterinary_lab',
    'diagnostic_lab',
    'poultry_technical_expert'
  );

  /* profiles is the authoritative account record. */
  update public.profiles
  set
    full_name = trim(p_full_name),
    email = nullif(lower(trim(coalesce(p_email,''))),''),
    phone = nullif(trim(coalesce(p_phone,'')),''),
    role = v_role,
    status = v_status,
    is_active = coalesce(p_is_active,true),
    user_type = coalesce(nullif(trim(p_user_type),''),'other'),
    activity_types = coalesce(p_activity_types,'{}'::text[]),
    updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  if professional_type then
    insert into public.professional_profiles (
      user_id,user_type,activity_types,organization_name,license_number,
      province,city,specialty,notes,is_verified,updated_at
    ) values (
      p_user_id,lower(trim(p_user_type)),coalesce(p_activity_types,'{}'::text[]),
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
    /* Do not put poultry operator/manager/other into professional_profiles. */
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
  )
  into result
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

/* Verification */
select
  p.id,
  p.role::text as role,
  p.status::text as status,
  p.user_type,
  p.activity_types
from public.profiles p
where p.id = auth.uid();
