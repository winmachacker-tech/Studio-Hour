-- Studio Hour: Google Calendar connection storage
--
-- Stores OAuth token metadata for Google Calendar integration.
-- Google Calendar remains the source of truth — Studio Hour never
-- persists calendar events. This table holds only connection/token state.
--
-- access_token and refresh_token are placeholders for future encrypted
-- token storage. They must never be exposed to client queries or app logs.
-- Only Edge Functions (service role) may read or write token fields.

create table google_tokens (
  user_id        uuid        primary key references auth.users(id) on delete cascade,
  provider       text        not null default 'google',
  access_token   text,
  refresh_token  text,
  token_expiry   timestamptz,
  scope          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table google_tokens enable row level security;
-- No user-facing policies. Only the service role (Edge Functions) can
-- read or write this table. The app checks connection status via the
-- get_calendar_connection_status() function below.

-- ── Connection status helper ─────────────────────────────────────────
--
-- Returns whether the authenticated user has a Google token row and
-- safe metadata (provider, scope, expiry). Never returns raw tokens.
--
-- SECURITY DEFINER is required because google_tokens has no user-facing
-- RLS policies — the function must bypass RLS to read the row.

create or replace function get_calendar_connection_status()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  if auth.uid() is null then
    return json_build_object(
      'connected', false,
      'provider',  null,
      'scope',     null,
      'expired',   null
    );
  end if;

  select
    provider,
    scope,
    token_expiry
  into v_row
  from google_tokens
  where user_id = auth.uid();

  if not found then
    return json_build_object(
      'connected', false,
      'provider',  null,
      'scope',     null,
      'expired',   null
    );
  end if;

  return json_build_object(
    'connected', true,
    'provider',  v_row.provider,
    'scope',     v_row.scope,
    'expired',   coalesce(v_row.token_expiry < now(), true)
  );
end;
$$;

revoke all on function get_calendar_connection_status() from public;
revoke all on function get_calendar_connection_status() from anon;
grant execute on function get_calendar_connection_status() to authenticated;
