/* ================================================================
   ADINEH OWNER MANAGEMENT FIX V2
   1) user_type is stored in profiles.
   2) professional_profiles is touched only for valid professional types.
   3) farmer/operator types never violate professional_profiles_user_type_check.
   4) owner-only SECURITY DEFINER RPC for atomic save.
   ================================================================ */

create or replace function public.owner_save_user_management(
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
begin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role <> 'owner' then
    raise exception 'OWNER_ACCESS_REQUIRED';
  end if;

  if p_user_id is null then raise exception 'USER_ID_REQUIRED'; end if;
  if nullif(trim(coalesce(p_full_name,'')),'') is null then raise exception 'FULL_NAME_REQUIRED'; end if;

  professional_type := p_user_type in (
    'veterinarian',
    'technical_veterinarian',
    'veterinary_lab',
    'diagnostic_lab',
    'poultry_technical_expert'
  );

  /* Main identity: profiles is authoritative for account/user_type. */
  update public.profiles
  set
    full_name = trim(p_full_name),
    email = lower(nullif(trim(p_email),'')),
    phone = nullif(trim(p_phone),''),
    role = coalesce(nullif(trim(p_role),''),'user'),
    status = coalesce(nullif(trim(p_status),''),'pending'),
    is_active = coalesce(p_is_active,true),
    user_type = coalesce(nullif(trim(p_user_type),''),'other'),
    activity_types = coalesce(p_activity_types,'{}'::text[]),
    updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  /* Only valid professional types may enter professional_profiles. */
  if professional_type then
    insert into public.professional_profiles(
      user_id,user_type,activity_types,organization_name,license_number,
      province,city,specialty,notes,is_verified,updated_at
    ) values (
      p_user_id,p_user_type,coalesce(p_activity_types,'{}'::text[]),
      nullif(trim(p_organization_name),''),nullif(trim(p_license_number),''),
      nullif(trim(p_province),''),nullif(trim(p_city),''),
      nullif(trim(p_specialty),''),nullif(trim(p_notes),''),
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
    /* A farmer/operator is not a professional_profiles row. Do not attempt
       to write an incompatible user_type into that table. */
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
    'role',p.role,
    'status',p.status,
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

revoke all on function public.owner_save_user_management(
  uuid,text,text,text,text,text,boolean,text,text[],text,text,text,text,text,text,boolean
) from public;
grant execute on function public.owner_save_user_management(
  uuid,text,text,text,text,text,boolean,text,text[],text,text,text,text,text,text,boolean
) to authenticated;

/* Helpful diagnostics: run these separately if you want to inspect the
   currently installed CHECK constraint before/after the patch. */
select
  conname,
  pg_get_constraintdef(oid) as constraint_definition
from pg_constraint
where conrelid = 'public.professional_profiles'::regclass
  and conname = 'professional_profiles_user_type_check';
