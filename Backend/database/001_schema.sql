create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text not null,
  partner_label text check (partner_label in ('A', 'B')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, partner_label)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'partner_label'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    partner_label = coalesce(excluded.partner_label, public.profiles.partner_label),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  number integer not null,
  title text not null,
  description text not null,
  category text not null check (
    category in (
      'communication',
      'trust',
      'respect',
      'affection',
      'growth',
      'boundaries'
    )
  ),
  consequence text not null,
  status text not null default 'active' check (status in ('active', 'broken')),
  locked_for_deletion boolean not null default true,
  deletion_confirmed_by uuid[] not null default '{}'::uuid[],
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (number)
);

drop trigger if exists rules_set_updated_at on public.rules;

create trigger rules_set_updated_at
before update on public.rules
for each row execute procedure public.set_updated_at();

create table if not exists public.violations (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.rules (id) on delete cascade,
  broken_by uuid not null references public.profiles (id) on delete restrict,
  note text,
  forgiven boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_rules_created_by on public.rules (created_by);
create index if not exists idx_rules_status on public.rules (status);
create index if not exists idx_violations_rule_id on public.violations (rule_id);
create index if not exists idx_violations_broken_by on public.violations (broken_by);
create index if not exists idx_violations_created_at on public.violations (created_at desc);

alter table public.profiles enable row level security;
alter table public.rules enable row level security;
alter table public.violations enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "rules_select_authenticated" on public.rules;
create policy "rules_select_authenticated"
on public.rules
for select
to authenticated
using (true);

drop policy if exists "rules_insert_authenticated" on public.rules;
create policy "rules_insert_authenticated"
on public.rules
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "rules_update_authenticated" on public.rules;
create policy "rules_update_authenticated"
on public.rules
for update
to authenticated
using (true)
with check (true);

drop policy if exists "rules_delete_authenticated" on public.rules;
create policy "rules_delete_authenticated"
on public.rules
for delete
to authenticated
using (true);

drop policy if exists "violations_select_authenticated" on public.violations;
create policy "violations_select_authenticated"
on public.violations
for select
to authenticated
using (true);

drop policy if exists "violations_insert_authenticated" on public.violations;
create policy "violations_insert_authenticated"
on public.violations
for insert
to authenticated
with check (auth.uid() = broken_by);

drop policy if exists "violations_update_authenticated" on public.violations;
create policy "violations_update_authenticated"
on public.violations
for update
to authenticated
using (true)
with check (true);
