# TASTE.md — Personal Design Brief
_v1.0.0 · Updated 2025-03-28_

## Project context
Primarily building: **Dashboards & SaaS Applications** — data-heavy interfaces, admin panels, analytics views, and productivity tools. Needs to work for both internal tools and customer-facing features.

## Aesthetic direction

A **calm but confident** aesthetic that feels premium without being sterile. The design system balances professional polish with warmth — it's technical enough for developer tools but approachable enough for any SaaS product. Think of it as "Linear meets Airbnb": the precision and information density of a dev tool, but with the warmth and human feel of a hospitality brand.

The key is **substantial minimalism** — clean and uncluttered like Apple, but with enough visual interest and content density to never feel empty or cold. Every element should feel intentional and high-quality.

## Inspiration references

- **Airbnb (airbnb.com)** — Warm, inviting palette that never feels cold or sterile; card-based layouts with generous padding; professional but approachable vibe → signals: warmth through color, rounded but not bubbly cards (8-12px), strong imagery, clean metadata
- **Apple (apple.com)** — Minimal, refined aesthetic where every element is intentional; premium feel through restraint → signals: quality through simplicity, generous whitespace used purposefully; **anti-signal**: when implemented poorly can feel empty — we avoid this by maintaining content density
- **Linear (linear.app)** — True blacks (#0a0a0a) for premium dark feel; layered depth with subtle surface elevations; technical precision with monospace for data; snappy interactions → signals: information density without clutter, sophisticated dark mode, fast/responsive UI
- **Vercel (vercel.com)** — Developer-focused clarity; strategic accent colors; clean component boundaries; data tables with monospace values → signals: technical credibility, purple/indigo accent heritage, clear hierarchy

## Shared signals across references

1. **Premium, professional polish** — Every reference feels trustworthy, high-quality, and intentionally designed
2. **Clean but substantial** — Uncluttered like Apple, but with enough warmth (Airbnb) and content density (Linear/Vercel) to avoid emptiness
3. **Technical clarity** — Good information architecture, appropriate use of monospace for data, developer-friendly without being cold

## Color

- **Mood:** Both dark and light modes (dark default for dev tools feel)
- **Strategy:** Two complementary accents — deep indigo/violet primary (technical, bold) + warm amber secondary (personality, warmth)
- **Never:** Generic blue primary buttons, harsh pure #000/#fff, complex gradients, heavy drop shadows

## Typography

- **Display:** Plus Jakarta Sans — modern geometric sans with personality, friendly but professional, great for headlines
- **Body:** DM Sans — warm, readable, pairs beautifully with Plus Jakarta
- **Mono:** JetBrains Mono — excellent for code/data, slightly rounded for approachability
- **Never:** System fonts as primary (Arial, Roboto, Inter), overly thin weights, tight leading on body text

## Shape & form

- **Border radius:** 4px (slight) — professional but not sharp, modern but not bubbly
- **Borders:** 1px rgba-based borders for depth instead of shadows; subtle in light (rgba black 8%), stronger in dark (rgba white 12%)
- **Shadows:** Avoid heavy shadows; prefer subtle elevation through surface color changes and 1px borders

## Motion

- **Duration:** 100ms (snappy) — immediate feedback, professional feel
- **Easing:** ease-out for enters, ease-in for exits; cubic-bezier(0.34, 1.56, 0.64, 1) for emphasis
- **Never:** Slow 300ms+ transitions that feel sluggish, bouncy/elastic animations that feel unprofessional

## Density

**Generous but not empty** — the "Airbnb middle ground." Cards get comfortable padding (20-24px), but information is dense enough that the UI feels productive. Data-heavy views (tables, metrics) prioritize scannability; marketing views can breathe more. The key is purposeful whitespace — every gap should have a reason.

## The gap (words vs references)

User described aesthetic as "mix of Editorial/Expressive + Bold/Loud" but references reveal something more nuanced: **Professional restraint with bold accents**. The "bold" comes through in confident typography and distinctive accent colors, not loudness. The "editorial" shows in careful typographic hierarchy and generous spacing. We landed on a system that's bold through precision and quality, not through flashiness.

## Anti-patterns

Things an agent must NEVER do when building with this design system:
- Use Inter, Roboto, or system-ui as the primary display font
- Create generic blue primary buttons (Bootstrap-style)
- Use pure #000000 black or #ffffff white as page backgrounds
- Apply drop shadows everywhere for depth
- Use excessive whitespace that creates "empty" feeling pages
- Use overly minimal whitespace that feels cramped
- Apply rounded corners on everything (bubbly/unprofessional look)
- Skip the dark/light mode toggle implementation
- Hardcode colors instead of using CSS custom properties
- Use complex gradients or rainbow color schemes

## What makes this memorable

**"Premium precision with approachable warmth"** — a technical design system that feels human, not corporate; bold through quality and restraint, not noise.
