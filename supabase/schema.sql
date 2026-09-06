-- Allergen Pal — Supabase schema, row-level security, and Stripe plumbing.
-- Run this in the Supabase SQL editor (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- user_state: one JSON document per user holding their profiles + all data
-- (allergens, foods, reactions, emergency info). The client reads/writes only
-- its own row. This is the sync source of truth for app data.
-- ---------------------------------------------------------------------------
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "own state read"  on public.user_state;
drop policy if exists "own state write" on public.user_state;
drop policy if exists "own state update" on public.user_state;

create policy "own state read" on public.user_state
  for select using (auth.uid() = user_id);
create policy "own state write" on public.user_state
  for insert with check (auth.uid() = user_id);
create policy "own state update" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- subscriptions: the AUTHORITATIVE entitlement record. Written ONLY by the
-- Stripe webhook (service-role key bypasses RLS). Users may read their own row
-- but can never write it — so nobody can grant themselves Pro by editing data.
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  provider              text not null default 'stripe',
  status                text not null default 'none',   -- none|trialing|active|canceled|expired
  plan                  text,                            -- monthly|yearly
  stripe_customer_id    text,
  stripe_subscription_id text,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean not null default false,
  updated_at            timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "own sub read" on public.subscriptions;
create policy "own sub read" on public.subscriptions
  for select using (auth.uid() = user_id);
-- No insert/update/delete policies: only the service role (webhook) may write.

create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);
