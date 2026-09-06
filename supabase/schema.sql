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

-- ---------------------------------------------------------------------------
-- ai_usage: per-user, per-month counter for AI recipe rewrites. Enforces the
-- freemium quota (free gets a few/month, Pro a fair-use ceiling). Written only
-- by the rewrite-recipe function (service role); users may read their own row
-- so the UI can show how many rewrites remain.
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage (
  user_id    uuid not null references auth.users (id) on delete cascade,
  period     text not null,            -- 'YYYY-MM' (UTC)
  count      integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period)
);

alter table public.ai_usage enable row level security;

drop policy if exists "own usage read" on public.ai_usage;
create policy "own usage read" on public.ai_usage
  for select using (auth.uid() = user_id);
-- No write policies: only the service role (Edge Function) increments.

-- Atomic increment that upserts the month's row and returns the new count.
create or replace function public.bump_ai_usage(p_user uuid, p_period text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage (user_id, period, count, updated_at)
  values (p_user, p_period, 1, now())
  on conflict (user_id, period)
  do update set count = public.ai_usage.count + 1, updated_at = now()
  returning count into new_count;
  return new_count;
end;
$$;
