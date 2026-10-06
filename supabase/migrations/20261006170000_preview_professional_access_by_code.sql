create or replace function public.preview_professional_access_by_code(
  p_farm_id uuid,
  p_access_code text,
  p_professional_type text
)
returns table(
  professional_user_id uuid,
  professional_name text,
  professional_type text,
  is_verified boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_code text;
  v_requested_type text;
begin
  if auth.uid() is null then
    raise exception 'کاربر وارد نشده است';
  end if;
  select f.owner_id into v_owner_id from public.farms f where f.id = p_farm_id;
  if v_owner_id is null then raise exception 'فارم پیدا نشد'; end if;
  if v_owner_id <> auth.uid() then raise exception 'فقط مالک فارم می‌تواند متخصص انتخاب کند'; end if;
  v_code := trim(p_access_code);
  v_requested_type := trim(p_professional_type);
  if v_code is null or v_code = '' then raise exception 'کد حرفه‌ای وارد نشده است'; end if;
  if v_requested_type not in ('veterinarian','technical_veterinarian','diagnostic_lab','poultry_technical_expert') then
    raise exception 'نوع متخصص معتبر نیست';
  end if;
  return query
  select pac.user_id, p.full_name, pp.user_type, coalesce(pp.is_verified, false)
  from public.professional_access_codes pac
  join public.professional_profiles pp on pp.user_id = pac.user_id
  join public.profiles p on p.id = pac.user_id
  where trim(pac.access_code) = v_code
    and pac.is_active = true
    and pp.user_type = v_requested_type
    and coalesce(p.status::text, 'active') = 'active'
    and coalesce(p.is_active, true) = true
  order by pac.created_at desc nulls last
  limit 1;
  if not found then raise exception 'کد حرفه‌ای معتبر نیست یا با نوع متخصص انتخاب‌شده مطابقت ندارد'; end if;
end;
$$;