create extension if not exists pgcrypto;

create table if not exists public.violations (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.rules (id) on delete cascade,
  broken_by text not null check (broken_by in ('A', 'B')),
  note text,
  forgiven boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_violations_rule_id on public.violations (rule_id);
create index if not exists idx_violations_broken_by on public.violations (broken_by);
create index if not exists idx_violations_created_at on public.violations (created_at desc);
