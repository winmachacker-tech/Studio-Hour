-- Studio Hour: Guide messages

create table messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references conversations(id) on delete cascade,
  role            text        not null check (role in ('user', 'assistant')),
  content         text        not null,
  created_at      timestamptz not null default now()
);

create index idx_messages_conversation on messages (conversation_id, created_at asc);

alter table messages enable row level security;

create policy "users_own_messages"
  on messages for all
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
