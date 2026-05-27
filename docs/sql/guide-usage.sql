-- Studio Hour: Guide usage tracking table
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Create the table
create table if not exists guide_usage (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  date       date        not null default current_date,
  messages_used integer  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- 2. Enable RLS — no policies means only the service role key can access
alter table guide_usage enable row level security;

-- 3. Atomic check-and-increment function
-- Called from /api/guide via supabase.rpc('use_guide_message', { ... })
-- Increments the count BEFORE the Claude call is made (i.e., "increment on attempt").
-- If the daily limit is reached, returns allowed=false without incrementing.
create or replace function use_guide_message(
  p_user_id uuid,
  p_limit   integer default 30
)
returns json
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  -- Ensure a row exists for today
  insert into guide_usage (user_id, date, messages_used, updated_at)
  values (p_user_id, current_date, 0, now())
  on conflict (user_id, date) do nothing;

  -- Read current count
  select messages_used into v_count
  from guide_usage
  where user_id = p_user_id and date = current_date;

  -- Over limit → reject without incrementing
  if v_count >= p_limit then
    return json_build_object(
      'allowed',       false,
      'messages_used',  v_count,
      'daily_limit',   p_limit
    );
  end if;

  -- Under limit → increment
  update guide_usage
  set messages_used = messages_used + 1, updated_at = now()
  where user_id = p_user_id and date = current_date;

  return json_build_object(
    'allowed',       true,
    'messages_used',  v_count + 1,
    'daily_limit',   p_limit
  );
end;
$$;
