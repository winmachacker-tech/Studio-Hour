# Studio Hour — Product Spec

## What it is

A private creative-business companion for Danielle. Helps her manage her daily check-in, schedule, mood, energy, suggested focus, active artwork tasks, mural/art projects, dashboard highlights, social/content ideas, and a Guide area for planning her day.

## Who it's for

Danielle — one user. A working artist and creative business owner who does murals, commissions, workshops, product design, and spa shifts. She has kids, variable energy, and needs an app that respects her real constraints rather than overwhelming her with tasks.

## Real-life constraints

- Not free until around 9am on days off
- Kids home around 4–5pm weekdays — creative brain shuts down
- Tuesday 10am–1pm is protected art time (never scheduled for admin)
- Spa shifts are sporadic: opening / mid / closing
- App must respect mood, energy, overwhelm, and schedule constraints
- Must never overwhelm her with too many tasks

## Navigation (5 tabs)

1. **Today** — Daily check-in, schedule, mood, energy, suggested focus
2. **Open Work** — Active queue and artwork tasks
3. **Dashboard** — Overall view with headline from each area, due items, leads, special projects
4. **Ideas** — Social media posts and artwork ideas (TikTok, Instagram, Facebook, Nextdoor)
5. **Guide** — Studio Guide / chatbot area (Claude-powered, future)

## Technical stack

- Next.js App Router + TypeScript
- Plain CSS (approved design token system)
- PWA (installable, offline-capable)
- Local persistence (localStorage) for v1
- Server-side API route for future Claude Guide integration
- No exposed API keys in the frontend

## Persistence rules

- Daily check-in resets by calendar day
- Rituals reset by calendar day
- Work items, ideas, leads, projects persist indefinitely
- Guide history persists
- Active tab persists across sessions

## Guide architecture

- Frontend calls `/api/guide` (never Anthropic directly)
- API key lives in server-side env vars only
- v1: mock responses
- v2: Claude API with Danielle's context (check-in, schedule, work, ideas)
- Designed around Studio Hour's own persisted context, not personal Claude memories
