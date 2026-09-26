-- سلامت طیور TV — live streaming
create table if not exists public.tv_live_streams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  provider text not null default 'embed' check (provider in ('youtube','aparat','hls','embed')),
  source_url text not null,
  embed_url text,
  poster_url text,
  is_live boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tv_live_streams_time_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index if not exists tv_live_streams_live_idx on public.tv_live_streams (is_live, sort_order, starts_at desc);
alter table public.tv_live_streams enable row level security;
drop policy if exists "tv live public active read" on public.tv_live_streams;
create policy "tv live public active read" on public.tv_live_streams for select to anon, authenticated using (is_live = true);
drop policy if exists "tv live owner full access" on public.tv_live_streams;
create policy "tv live owner full access" on public.tv_live_streams for all to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='owner' and p.status='active' and p.is_active=true))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='owner' and p.status='active' and p.is_active=true));
create or replace function public.tv_live_streams_set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;
drop trigger if exists tv_live_streams_updated_at on public.tv_live_streams;
create trigger tv_live_streams_updated_at before update on public.tv_live_streams for each row execute function public.tv_live_streams_set_updated_at();
grant select on public.tv_live_streams to anon, authenticated;
grant insert, update, delete, select on public.tv_live_streams to authenticated;