insert into public.users (email, password)
values
  ('adaubdool@gmail.com', 'Adnaan12$'),
  ('hibah0403@gmail.com', 'Hibah12$')
on conflict (email) do nothing;
