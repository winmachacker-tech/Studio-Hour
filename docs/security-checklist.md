# Studio Hour — Security Checklist

Complete before deploying to production.

## Anthropic spend safety

- [ ] Set a monthly spend cap in the Anthropic Console (Settings > Limits)
- [ ] Confirm `ANTHROPIC_API_KEY` is set as a Vercel environment variable (production + preview), not in client code
- [ ] Confirm `ANTHROPIC_API_KEY` is never logged or returned in API responses

## Supabase configuration

- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` in Vercel env vars
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel env vars
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars (production + preview only — never client-visible)
- [ ] Run `docs/sql/guide-usage.sql` in the Supabase SQL Editor
- [ ] Confirm RLS is enabled on `guide_usage` table (no policies = service role only)

## Route protection verification

- [ ] `POST /api/guide` without Authorization header returns `401`
- [ ] `POST /api/guide` with invalid/expired token returns `401`
- [ ] `POST /api/guide` with valid token returns a guide response
- [ ] After 30 messages in one day, `POST /api/guide` returns `429` with friendly message

## Client behavior

- [ ] Unauthenticated users are redirected to `/login`
- [ ] Guide tab sends `Authorization: Bearer <token>` with every request
- [ ] 401 response shows "session expired" message
- [ ] 429 response shows the limit message in the chat thread

## Keys that must never appear in client JavaScript

- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

These are only read via `process.env` inside `src/app/api/` route handlers. They are never imported by any `"use client"` file.
