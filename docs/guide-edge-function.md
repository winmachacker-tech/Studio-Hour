# Studio Hour Guide — Edge Function Setup

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Supabase project linked
- Anthropic API key ready

## Step-by-step setup

### 1. Link your Supabase project

```bash
cd ~/code/studio-hour-mobile
supabase link --project-ref nzjfmhldlcpvkqpzkztc
```

### 2. Run database migrations

```bash
supabase db push
```

This creates:
- `guide_usage` table (daily per-user message limits)
- `conversations` table (guide conversation threads)
- `messages` table (individual messages within conversations)
- `use_guide_message()` RPC function (atomic rate limit check)
- RLS policies (users see only their own data)

### 3. Set the Anthropic API key as a secret

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

This key lives only on the Supabase server. It is never sent to the mobile app.

### 4. Deploy the Edge Function

```bash
supabase functions deploy studio-hour-guide
```

### 5. Verify

```bash
# Check the function exists
supabase functions list

# Test (will return 401 without auth, which is correct)
curl -X POST https://nzjfmhldlcpvkqpzkztc.supabase.co/functions/v1/studio-hour-guide \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

## How it works

1. App calls `supabase.functions.invoke('studio-hour-guide', { body })` — the Supabase client automatically attaches the user's JWT.
2. Edge Function verifies the JWT against Supabase Auth.
3. Checks `guide_usage` table — 30 messages/day/user max.
4. Creates or continues a conversation in the `conversations` table.
5. Saves the user message to `messages`.
6. Builds a system prompt with studio context (check-in, schedule, work items, ideas, rituals).
7. Calls Claude Sonnet via the Anthropic API using the server-side secret.
8. Saves the assistant response to `messages`.
9. Returns `{ content, conversationId, suggestions?, createdAt }`.

## Secrets required

| Secret | Purpose |
|--------|---------|
| `ANTHROPIC_API_KEY` | Claude API access (set via `supabase secrets set`) |
| `SUPABASE_URL` | Auto-provided by Supabase |
| `SUPABASE_ANON_KEY` | Auto-provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided by Supabase |

## Rate limiting

- 30 messages per user per day
- Counter increments before the Claude call (on attempt)
- Resets at midnight UTC
- Enforced server-side — cannot be bypassed from the app
