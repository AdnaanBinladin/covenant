create extension if not exists pgcrypto;

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
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
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved')),
  approval_confirmed_by uuid[] not null default '{}'::uuid[],
  locked_for_deletion boolean not null default true,
  deletion_confirmed_by uuid[] not null default '{}'::uuid[],
  created_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_rules_number on public.rules (number);
create index if not exists idx_rules_created_by on public.rules (created_by);
