-- =========================================================
-- ADINEH | Professional Center V2
-- Run once in Supabase SQL Editor
-- =========================================================

begin;

-- 1) Farm lifecycle status
alter table public.farms
  add column if not exists farm_status text;

update public.farms
set farm_status = coalesce(nullif(farm_status,''),'active')
where farm_status is null or farm_status = '';

alter table public.farms
  alter column farm_status set default 'active';

alter table public.farms
  drop constraint if exists farms_farm_status_check;

alter table public.farms
  add constraint farms_farm_status_check
  check (farm_status in ('active','inactive','preparing'));

-- 2) Health monitoring snapshot for professional dashboard
create table if not exists public.professional_farm_health_monitoring (
  farm_id uuid primary key references public.farms(id) on delete cascade,
  status text not null default 'good',
  score numeric(5,2),
  reason text,
  last_weekly_id uuid,
  last_weekly_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint professional_farm_health_status_check
    check (status in ('good','acceptable','warning','critical','unknown'))
);

create index if not exists idx_professional_farm_health_status
  on public.professional_farm_health_monitoring(status);

-- 3) Messages: optional attachment metadata
alter table public.professional_messages
  add column if not exists body text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_size integer,
  add column if not exists attachment_type text,
  add column if not exists farm_id uuid;

create index if not exists idx_professional_messages_farm
  on public.professional_messages(farm_id, created_at desc);

-- 4) Professional lists: make sure naming fields exist
alter table public.professional_farm_lists
  add column if not exists name text,
  add column if not exists updated_at timestamptz default now();

alter table public.professional_farm_list_items
  add column if not exists farm_id uuid;

create unique index if not exists uq_professional_farm_list_item
  on public.professional_farm_list_items(list_id, farm_id);

-- 5) Private attachment bucket, max file size enforced by application + bucket limit
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'professional-attachments',
  'professional-attachments',
  false,
  716800,
  array['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 716800;

-- Storage policies: users can upload only into their own first-level folder.
drop policy if exists professional_attachment_insert on storage.objects;
create policy professional_attachment_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'professional-attachments'
  and split_part(name,'/',1) = auth.uid()::text
);

drop policy if exists professional_attachment_select on storage.objects;
create policy professional_attachment_select
on storage.objects for select
to authenticated
using (
  bucket_id = 'professional-attachments'
  and (
    split_part(name,'/',1) = auth.uid()::text
    or exists (
      select 1
      from public.professional_messages pm
      where pm.attachment_path = storage.objects.name
        and (pm.sender_id = auth.uid() or pm.recipient_id = auth.uid())
    )
  )
);

drop policy if exists professional_attachment_delete on storage.objects;
create policy professional_attachment_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'professional-attachments'
  and split_part(name,'/',1) = auth.uid()::text
);

-- 6) Professional dashboard RPC
create or replace function public.professional_get_dashboard()
returns table (
  connection_id uuid,
  farm_id uuid,
  farm_name text,
  farm_code text,
  farm_type text,
  farm_status text,
  farmer_id uuid,
  farmer_name text,
  farmer_phone text,
  connection_status text,
  approved_at timestamptz,
  health_status text,
  health_score numeric,
  health_reason text,
  last_weekly_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fpa.id,
    f.id,
    f.name,
    f.farm_code,
    f.farm_type,
    coalesce(f.farm_status,'active'),
    f.owner_id,
    coalesce(p.full_name,'بدون نام'),
    p.phone,
    fpa.status,
    fpa.approved_at,
    coalesce(h.status,'unknown'),
    h.score,
    h.reason,
    h.last_weekly_at
  from public.farm_professional_access fpa
  join public.farms f on f.id = fpa.farm_id
  left join public.profiles p on p.id = f.owner_id
  left join public.professional_farm_health_monitoring h on h.farm_id = f.id
  where fpa.professional_user_id = auth.uid()
    and fpa.status in ('pending','active')
  order by f.name nulls last;
$$;

-- 7) Profile update RPC: professional can edit registration data, never the access code.
create or replace function public.professional_update_my_profile(
  p_full_name text,
  p_phone text,
  p_email text,
  p_user_type text,
  p_activity_types jsonb,
  p_organization_name text,
  p_license_number text,
  p_province text,
  p_city text,
  p_specialty text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'کاربر وارد نشده است'; end if;
  if coalesce(trim(p_full_name),'') = '' then raise exception 'نام و نام خانوادگی الزامی است'; end if;

  update public.profiles
  set full_name = trim(p_full_name),
      phone = nullif(trim(coalesce(p_phone,'')),''),
      email = nullif(lower(trim(coalesce(p_email,''))),''),
      updated_at = now()
  where id = auth.uid();

  update public.professional_profiles
  set activity_types = coalesce(p_activity_types,activity_types),
      organization_name = p_organization_name,
      license_number = p_license_number,
      province = p_province,
      city = p_city,
      specialty = p_specialty,
      notes = p_notes,
      updated_at = now()
  where user_id = auth.uid();

  return jsonb_build_object('success',true,'user_id',auth.uid());
end;
$$;

-- 8) Access-code lookup for the current professional. It is read-only.
create or replace function public.professional_get_my_access_code()
returns table(access_code text, is_active boolean)
language sql
stable
security definer
set search_path = public
as $$
  select pac.access_code, pac.is_active
  from public.professional_access_codes pac
  where pac.user_id = auth.uid()
  order by pac.created_at desc nulls last
  limit 1;
$$;

-- 9) Lists: max 5 per professional
create or replace function public.professional_create_farm_list(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'کاربر وارد نشده است'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'نام لیست را وارد کنید'; end if;
  if (select count(*) from public.professional_farm_lists where professional_id=auth.uid()) >= 5 then
    raise exception 'حداکثر ۵ لیست می‌توانید ایجاد کنید';
  end if;
  insert into public.professional_farm_lists(professional_id,name,created_at,updated_at)
  values(auth.uid(),trim(p_name),now(),now()) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.professional_add_farm_to_list(p_list_id uuid,p_farm_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists(select 1 from public.professional_farm_lists where id=p_list_id and professional_id=auth.uid()) then
    raise exception 'لیست متعلق به شما نیست';
  end if;
  if not exists(select 1 from public.farm_professional_access where farm_id=p_farm_id and professional_user_id=auth.uid() and status='active') then
    raise exception 'این فارم تحت پوشش فعال شما نیست';
  end if;
  insert into public.professional_farm_list_items(list_id,farm_id)
  values(p_list_id,p_farm_id)
  on conflict do nothing;
  return true;
end;
$$;

create or replace function public.professional_remove_farm_from_list(p_list_id uuid,p_farm_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.professional_farm_list_items i
  using public.professional_farm_lists l
  where i.list_id=p_list_id and i.farm_id=p_farm_id and l.id=i.list_id and l.professional_id=auth.uid();
  return true;
end;
$$;

-- 10) Send message from professional to a farmer.
create or replace function public.professional_send_message(
  p_farm_id uuid,
  p_recipient_id uuid,
  p_body text,
  p_attachment_path text default null,
  p_attachment_name text default null,
  p_attachment_size integer default null,
  p_attachment_type text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'کاربر وارد نشده است'; end if;
  if not exists(select 1 from public.farm_professional_access where farm_id=p_farm_id and professional_user_id=auth.uid() and status='active') then
    raise exception 'دسترسی فعال به این فارم ندارید';
  end if;
  if not exists(select 1 from public.farms where id=p_farm_id and owner_id=p_recipient_id) then
    raise exception 'گیرنده این پیام مالک این فارم نیست';
  end if;
  if nullif(trim(p_body),'') is null and p_attachment_path is null then raise exception 'متن پیام یا فایل لازم است'; end if;
  if p_attachment_size is not null and p_attachment_size > 716800 then raise exception 'حجم فایل نباید بیشتر از ۷۰۰ کیلوبایت باشد'; end if;

  insert into public.professional_messages(sender_id,recipient_id,farm_id,body,attachment_path,attachment_name,attachment_size,attachment_type,created_at)
  values(auth.uid(),p_recipient_id,p_farm_id,nullif(trim(p_body),''),p_attachment_path,p_attachment_name,p_attachment_size,p_attachment_type,now())
  returning id into v_id;

  insert into public.professional_notifications(user_id,farm_id,notification_type,title,body,metadata,is_read,created_at)
  values(p_recipient_id,p_farm_id,'professional_message','پیام جدید از متخصص','یک پیام جدید از متخصص فارم برای شما ارسال شده است.',jsonb_build_object('message_id',v_id,'farm_id',p_farm_id),false,now());

  return v_id;
end;
$$;

-- 11) Weekly health evaluator. It intentionally labels the result as a monitoring alert, not a diagnosis.
create or replace function public.evaluate_farm_weekly_health(p_farm_id uuid,p_weekly_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mortality numeric := 0;
  v_live numeric := null;
  v_fcr numeric := null;
  v_status text := 'good';
  v_score numeric := 100;
  v_reason text := 'وضعیت پایدار بر اساس آخرین گزارش هفتگی';
  v_owner uuid;
begin
  select owner_id into v_owner from public.farms where id=p_farm_id;
  if v_owner is null then raise exception 'فارم پیدا نشد'; end if;

  execute 'select coalesce(mortality_count,0), live_birds, cumulative_fcr from public.weekly_records where id=$1'
  into v_mortality,v_live,v_fcr using p_weekly_id;

  if coalesce(v_live,0) > 0 then
    v_mortality := (v_mortality / v_live) * 100;
  else
    v_mortality := 0;
  end if;

  if v_mortality >= 1.5 or coalesce(v_fcr,0) >= 2.8 then
    v_status := 'critical'; v_score := 45; v_reason := 'شاخص‌های گزارش هفتگی نیازمند بررسی فوری هستند.';
  elsif v_mortality >= 0.5 or coalesce(v_fcr,0) >= 2.3 then
    v_status := 'warning'; v_score := 70; v_reason := 'یکی از شاخص‌های گزارش هفتگی نیازمند بررسی است.';
  elsif v_mortality > 0 or v_fcr is not null then
    v_status := 'good'; v_score := 90;
  end if;

  insert into public.professional_farm_health_monitoring(farm_id,status,score,reason,last_weekly_id,last_weekly_at,updated_at)
  values(p_farm_id,v_status,v_score,v_reason,p_weekly_id,now(),now())
  on conflict(farm_id) do update set status=excluded.status,score=excluded.score,reason=excluded.reason,last_weekly_id=excluded.last_weekly_id,last_weekly_at=excluded.last_weekly_at,updated_at=now();

  if v_status in ('warning','critical') then
    insert into public.professional_notifications(user_id,farm_id,notification_type,title,body,metadata,is_read,created_at)
    select fpa.professional_user_id,p_farm_id,'farm_health_alert','هشدار وضعیت فارم',
           v_reason,jsonb_build_object('farm_id',p_farm_id,'weekly_id',p_weekly_id,'status',v_status,'score',v_score),false,now()
    from public.farm_professional_access fpa
    where fpa.farm_id=p_farm_id and fpa.status='active'
      and not exists(select 1 from public.professional_notifications n where n.user_id=fpa.professional_user_id and n.farm_id=p_farm_id and n.notification_type='farm_health_alert' and n.created_at > now()-interval '24 hours');
  end if;
  return v_status;
end;
$$;

-- 12) Ensure professionals can view weekly/archive data but cannot mutate those tables through normal RLS.
-- Existing owner-only write policies are intentionally preserved.


-- 13) Automatic alert after every weekly report save.
create or replace function public.professional_weekly_health_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.farm_id is not null then
    perform public.evaluate_farm_weekly_health(new.farm_id,new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_professional_weekly_health on public.weekly_records;
create trigger trg_professional_weekly_health
after insert or update on public.weekly_records
for each row execute function public.professional_weekly_health_trigger();

-- 14) Farmer-side reply function for two-way communication.
create or replace function public.farmer_send_professional_message(
  p_farm_id uuid,
  p_recipient_id uuid,
  p_body text,
  p_attachment_path text default null,
  p_attachment_name text default null,
  p_attachment_size integer default null,
  p_attachment_type text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'کاربر وارد نشده است'; end if;
  if not exists(select 1 from public.farms where id=p_farm_id and owner_id=auth.uid()) then raise exception 'این فارم متعلق به شما نیست'; end if;
  if not exists(select 1 from public.farm_professional_access where farm_id=p_farm_id and professional_user_id=p_recipient_id and status='active') then raise exception 'این متخصص دسترسی فعال به فارم ندارد'; end if;
  if nullif(trim(p_body),'') is null and p_attachment_path is null then raise exception 'متن پیام یا فایل لازم است'; end if;
  if p_attachment_size is not null and p_attachment_size > 716800 then raise exception 'حجم فایل نباید بیشتر از ۷۰۰ کیلوبایت باشد'; end if;

  insert into public.professional_messages(sender_id,recipient_id,farm_id,body,attachment_path,attachment_name,attachment_size,attachment_type,created_at)
  values(auth.uid(),p_recipient_id,p_farm_id,nullif(trim(p_body),''),p_attachment_path,p_attachment_name,p_attachment_size,p_attachment_type,now())
  returning id into v_id;

  insert into public.professional_notifications(user_id,farm_id,notification_type,title,body,metadata,is_read,created_at)
  values(p_recipient_id,p_farm_id,'professional_message','پیام جدید از مرغدار','یک پیام جدید از مرغدار برای شما ارسال شده است.',jsonb_build_object('message_id',v_id,'farm_id',p_farm_id),false,now());
  return v_id;
end;
$$;

commit;
