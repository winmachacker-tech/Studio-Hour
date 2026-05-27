# Studio Hour — Design System

## Source of truth

Design exported from Claude Design as an HTML/CSS/JS prototype.
Design files: `/tmp/studio-hour-design/danielles-project/project/`

## Brand feeling

Private studio notebook + creative business dashboard. Premium, editorial, warm, artistic, calm, feminine without being childish. Serious enough for a real creative business. Mobile-first.

## Color palette

| Token | Hex | Usage |
|---|---|---|
| Night Plum | `#130D1A` | Main background |
| Studio Plum | `#251640` | Primary card surface |
| Studio Plum 2 | `#2c1b4a` | Timeline dots, platform tag bg |
| Deep Teal | `#0F2828` | Secondary/deep card surface |
| Deep Teal 2 | `#143434` | Deep teal variant |
| Danielle Teal | `#119999` | Active states, selected states, today highlights |
| Teal Soft | `#1aaaaa` | Hover state for teal elements |
| Studio Gold | `#D4A843` | Protected art time, wins, due moments |
| Rose Clay | `#C47A8A` | Mood, emotional check-in, self-care |
| Canvas Cream | `#F5EEF8` | Primary text |
| Cream Warm | `#faf3fc` | Highlighted text |
| Lavender Fog | `#9B8AAA` | Muted text, metadata |

### Color usage rules

- App is **mostly Night Plum / Studio Plum / Canvas Cream**
- **Danielle Teal** used sparingly as the signature active accent
- **Gold** only for protected art time, wins, due moments, special highlights
- **Rose** only for mood / self-care / emotional check-in
- Do not use all colors equally

## Typography

| Stack | Font | Usage |
|---|---|---|
| `--serif-display` | Fraunces (300, 400) | Large page headings |
| `--serif` | Cormorant Garamond (300–700, normal + italic) | Card titles, body serif, timeline, notes |
| `--sans` | Bricolage Grotesque (300–700) | Body text, UI, labels, chips |

### Key type styles

- **Eyebrow**: 10.5px, sans, 600 weight, 0.18em tracking, uppercase, lavender
- **Page title**: 34px, serif-display, 300 weight, cream-warm
- **Greeting title**: 38px, serif-display, 300 weight, with italic serif name
- **Card title**: 22px, serif, 400 weight, cream
- **Body**: 13.5px, sans, lavender (or cream for `.cream` variant)
- **Meta**: 11px, sans, lavender

## Card variants

| Class | Description |
|---|---|
| `.sh-card` | Default: Studio Plum surface, 22px radius, blur backdrop |
| `.sh-card-quiet` | Deep Teal surface — for rituals, recent notes |
| `.sh-card-feature` | Teal glow border — for suggested focus |
| `.sh-card-gold` | Gold glow border — for due items, protected time |

## Chip variants

`.chip-teal`, `.chip-gold`, `.chip-rose`, `.chip-lavender`, `.chip-cream`, `.chip-muted`, `.chip-quiet`

## Component patterns

- **DotScale**: 5 dots, filled to represent 1–5 value, colored per dimension
- **StatePill**: Label + DotScale (used in check-in grid)
- **FilterRow**: Horizontal scroll, pill buttons, cream-on-cream when active
- **TimeBlock**: Grid with time column + content column, timeline dots (now/protected/soft-block)
- **Platform tag**: Colored initials (TT, IG, FB, ND) or star glyph for artwork
- **Progress rail**: 4px bar, gold or teal fill
- **Prompt tile**: Serif text + teal arrow, hover glow
- **Composer**: Pill input + circular send button
- **FAB**: Teal floating action button, positioned bottom-right

## Safe area handling

- Tab bar: `padding-bottom: env(safe-area-inset-bottom)`
- Scroll area: `padding-top: calc(20px + env(safe-area-inset-top))`
- Viewport: `viewport-fit: cover`
