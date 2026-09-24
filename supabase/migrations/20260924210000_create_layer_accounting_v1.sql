-- ADINE — LAYER OPERATIONAL ACCOUNTING V1
-- Isolated Layer-only transaction ledger. Designed as a detachable module.
create table if not exists public.layer_accounting_transactions (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid not null references public.flocks(id) on delete cascade,
  farm_id uuid not null references public.farms(id) on delete cascade,
  house_id uuid references public.houses(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_date date not null,
  transaction_type text not null check (transaction_type in ('sale','expense')),
  category text not null,
  description text,
  quantity numeric,
  unit text,
  unit_price numeric,
  amount numeric not null check (amount >= 0),
  currency text not null default 'IRR',
  counterparty text,
  payment_status text not null default 'paid' check (payment_status in ('paid','pending','partial','cancelled')),
  reference_no text,
  notes text,
  source_module text not null default 'layer-accounting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_layer_accounting_flock_date on public.layer_accounting_transactions(flock_id,event_date desc);
create index if not exists idx_layer_accounting_flock_type on public.layer_accounting_transactions(flock_id,transaction_type);
alter table public.layer_accounting_transactions enable row level security;
drop policy if exists layer_accounting_select on public.layer_accounting_transactions;
drop policy if exists layer_accounting_insert on public.layer_accounting_transactions;
drop policy if exists layer_accounting_update on public.layer_accounting_transactions;
drop policy if exists layer_accounting_delete on public.layer_accounting_transactions;
create policy layer_accounting_select on public.layer_accounting_transactions for select using (owner_id = auth.uid() or exists (select 1 from public.farm_professional_access a where a.farm_id = layer_accounting_transactions.farm_id and a.professional_user_id = auth.uid() and a.status = 'active'));
create policy layer_accounting_insert on public.layer_accounting_transactions for insert with check (owner_id = auth.uid() or exists (select 1 from public.farm_professional_access a where a.farm_id = layer_accounting_transactions.farm_id and a.professional_user_id = auth.uid() and a.status = 'active'));
create policy layer_accounting_update on public.layer_accounting_transactions for update using (owner_id = auth.uid() or exists (select 1 from public.farm_professional_access a where a.farm_id = layer_accounting_transactions.farm_id and a.professional_user_id = auth.uid() and a.status = 'active')) with check (owner_id = auth.uid() or exists (select 1 from public.farm_professional_access a where a.farm_id = layer_accounting_transactions.farm_id and a.professional_user_id = auth.uid() and a.status = 'active'));
create policy layer_accounting_delete on public.layer_accounting_transactions for delete using (owner_id = auth.uid() or exists (select 1 from public.farm_professional_access a where a.farm_id = layer_accounting_transactions.farm_id and a.professional_user_id = auth.uid() and a.status = 'active'));
create or replace function public.touch_layer_accounting_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_layer_accounting_updated_at on public.layer_accounting_transactions;
create trigger trg_layer_accounting_updated_at before update on public.layer_accounting_transactions for each row execute function public.touch_layer_accounting_updated_at();
