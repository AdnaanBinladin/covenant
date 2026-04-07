alter table public.rules
add column if not exists approval_status text not null default 'pending'
check (approval_status in ('pending', 'approved'));

alter table public.rules
add column if not exists approval_confirmed_by uuid[] not null default '{}'::uuid[];
