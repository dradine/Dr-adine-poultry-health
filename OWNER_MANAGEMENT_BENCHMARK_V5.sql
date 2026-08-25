begin;

drop function if exists public.owner_update_user_details_v2(uuid,text,text,text,text,text,boolean,text,text[],text,text,text,text,text,text,boolean);

create or replace function public.owner_update_user_details_v2(
 p_user_id uuid, p_full_name text, p_email text, p_phone text, p_role text, p_status text,
 p_is_active boolean, p_user_type text, p_activity_types text[] default '{}', p_organization_name text default null,
 p_license_number text default null, p_province text default null, p_city text default null, p_specialty text default null,
 p_notes text default null, p_is_verified boolean default false
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
 caller_role text; v_role public.user_role; v_status public.user_status; v_type text; v_acts jsonb; r jsonb;
begin
 select role::text into caller_role from public.profiles where id=auth.uid();
 if caller_role <> 'owner' then raise exception 'OWNER_ACCESS_REQUIRED'; end if;
 if not exists(select 1 from public.profiles where id=p_user_id) then raise exception 'USER_NOT_FOUND'; end if;
 if nullif(trim(coalesce(p_full_name,'')),'') is null then raise exception 'FULL_NAME_REQUIRED'; end if;
 v_role:=coalesce(nullif(trim(coalesce(p_role,'')),''),'user')::public.user_role;
 v_status:=coalesce(nullif(trim(coalesce(p_status,'')),''),'pending')::public.user_status;
 v_type:=coalesce(nullif(trim(coalesce(p_user_type,'')),''),'other');
 if v_type='poultry_operator' then v_type:='farm_operator'; end if;
 if v_type='poultry_manager' then v_type:='farm_manager'; end if;
 if v_type='veterinary_lab' then v_type:='diagnostic_lab'; end if;
 if v_type='organization_manager' then v_type:='company_manager'; end if;
 select coalesce(jsonb_agg(trim(x)),'[]'::jsonb) into v_acts from unnest(coalesce(p_activity_types,'{}'::text[])) x where nullif(trim(x),'') is not null;
 update public.profiles set full_name=trim(p_full_name), email=nullif(lower(trim(coalesce(p_email,''))),''), phone=nullif(trim(coalesce(p_phone,'')),''), role=v_role, status=v_status, is_active=coalesce(p_is_active,true), updated_at=now() where id=p_user_id;
 insert into public.professional_profiles(user_id,user_type,activity_types,organization_name,license_number,province,city,specialty,notes,is_verified,updated_at)
 values(p_user_id,v_type,coalesce(v_acts,'[]'::jsonb),nullif(trim(coalesce(p_organization_name,'')),''),nullif(trim(coalesce(p_license_number,'')),''),nullif(trim(coalesce(p_province,'')),''),nullif(trim(coalesce(p_city,'')),''),nullif(trim(coalesce(p_specialty,'')),''),nullif(trim(coalesce(p_notes,'')),''),coalesce(p_is_verified,false),now())
 on conflict(user_id) do update set user_type=excluded.user_type,activity_types=excluded.activity_types,organization_name=excluded.organization_name,license_number=excluded.license_number,province=excluded.province,city=excluded.city,specialty=excluded.specialty,notes=excluded.notes,is_verified=excluded.is_verified,updated_at=now();
 select jsonb_build_object('id',p.id,'user_id',p.id,'email',p.email,'full_name',p.full_name,'phone',p.phone,'role',p.role::text,'status',p.status::text,'is_active',p.is_active,'user_type',pp.user_type,'activity_types',coalesce(pp.activity_types,'[]'::jsonb),'organization_name',pp.organization_name,'license_number',pp.license_number,'province',pp.province,'city',pp.city,'specialty',pp.specialty,'notes',pp.notes,'is_verified',coalesce(pp.is_verified,false)) into r from public.profiles p left join public.professional_profiles pp on pp.user_id=p.id where p.id=p_user_id;
 return r;
end; $$;

revoke all on function public.owner_update_user_details_v2(uuid,text,text,text,text,text,boolean,text,text[],text,text,text,text,text,text,boolean) from public;
grant execute on function public.owner_update_user_details_v2(uuid,text,text,text,text,text,boolean,text,text[],text,text,text,text,text,text,boolean) to authenticated;

commit;
