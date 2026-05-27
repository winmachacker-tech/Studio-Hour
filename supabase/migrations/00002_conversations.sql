-- Studio Hour: Guide conversations

create table conversations (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  started_at  timestamptz not null default now(),
  summary     text,
  created_at  timestamptz not null default now()
);

create index idx_conversations_user on conversations (user_id, created_at desc);

alter table conversations enable row level security;

create policy "users_own_conversations"
  on conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
