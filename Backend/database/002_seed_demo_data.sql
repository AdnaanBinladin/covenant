-- Replace these emails with the real two users you create in Supabase Auth.
-- Run this only after both users already exist and have profile rows.

with partner_a as (
  select p.id
  from public.profiles p
  where p.email = 'partner.a@covenant.local'
  limit 1
),
partner_b as (
  select p.id
  from public.profiles p
  where p.email = 'partner.b@covenant.local'
  limit 1
)
insert into public.rules (
  number,
  title,
  description,
  category,
  consequence,
  status,
  created_by
)
select *
from (
  select 1, 'We Listen Fully', 'When one speaks, the other gives undivided attention. No phones, no distractions.', 'communication', 'You owe a 30-minute undivided conversation', 'active', (select id from partner_a)
  union all
  select 2, 'Honesty Above All', 'We speak our truth with kindness, even when it is difficult.', 'trust', 'Write a letter explaining your feelings', 'active', (select id from partner_b)
  union all
  select 3, 'Never Sleep Angry', 'We resolve conflicts before the day ends, or at least agree to revisit them peacefully.', 'communication', 'Stay up and talk until resolved', 'active', (select id from partner_a)
  union all
  select 4, 'Respect Personal Space', 'Everyone needs moments of solitude. We honor that need without question.', 'boundaries', 'Plan a solo self-care day for your partner', 'active', (select id from partner_b)
  union all
  select 5, 'Daily Gratitude', 'Share one thing you appreciate about each other every day.', 'affection', 'Write 10 things you love about your partner', 'broken', (select id from partner_a)
  union all
  select 6, 'No Raising Voices', 'Disagreements are discussed calmly. Volume does not equal validity.', 'respect', 'You owe a hug and a sincere apology', 'active', (select id from partner_b)
) as seed_rows (
  number,
  title,
  description,
  category,
  consequence,
  status,
  created_by
)
where created_by is not null
on conflict (number) do nothing;

insert into public.violations (rule_id, broken_by, note, forgiven, created_at)
select
  r.id,
  p.id,
  seed.note,
  seed.forgiven,
  seed.created_at
from (
  values
    (5, 'partner.a@covenant.local', 'Forgot to share gratitude for two days in a row', false, timezone('utc', now()) - interval '10 days'),
    (1, 'partner.b@covenant.local', 'Was on phone during important conversation', true, timezone('utc', now()) - interval '12 days'),
    (6, 'partner.a@covenant.local', 'Raised voice during argument about dishes', true, timezone('utc', now()) - interval '20 days')
) as seed(rule_number, email, note, forgiven, created_at)
join public.rules r on r.number = seed.rule_number
join public.profiles p on p.email = seed.email
on conflict do nothing;
