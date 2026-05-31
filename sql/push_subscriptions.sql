create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default now()
);

alter table push_subscriptions enable row level security;

create policy "Usuario puede gestionar sus suscripciones"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role puede leer todo"
  on push_subscriptions for select
  using (true);
