# Design System

Before building anything, read and apply this design system completely.
Make NO design decisions outside of these tokens. You implement; you don't design.

## Aesthetic brief

A calm but confident aesthetic that feels premium without being sterile. The design balances professional polish with warmth — technical enough for developer tools but approachable enough for any SaaS product. Think "Linear meets Airbnb": the precision of a dev tool with the warmth of a hospitality brand. Substantial minimalism — clean but never empty.

## Anti-patterns — NEVER do these

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

## Tokens (use these exactly)

### Typography
- **Display font:** Plus Jakarta Sans — use for all headlines and hero text
- **Body font:** DM Sans — use for all prose and UI labels  
- **Mono font:** JetBrains Mono — use for code, data values, metadata
- **Load from Google Fonts:**
  ```
  https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@100..800&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap
  ```

### Colors — Dark theme (default)
- Page background: `#0a0a0a` (true black)
- Card/surface: `#141414`
- Elevated surface: `#1a1a1a`
- Text primary: `#fafafa`
- Text secondary: `#a1a1aa`
- Text muted: `#71717a`
- Border subtle: `rgba(255,255,255,0.06)`
- Border default: `rgba(255,255,255,0.10)`
- Accent 1 (primary): `#818cf8` (indigo)
- Accent 2 (secondary): `#fbbf24` (amber)
- Success: `#4ade80` / Warning: `#fbbf24` / Danger: `#f87171`

### Colors — Light theme
- Page background: `#faf9f7` (warm off-white)
- Card/surface: `#ffffff`
- Elevated surface: `#f5f4f0`
- Text primary: `#18181b`
- Text secondary: `#52525b`
- Text muted: `#a1a1aa`
- Border subtle: `rgba(0,0,0,0.06)`
- Border default: `rgba(0,0,0,0.10)`
- Accent 1 (primary): `#4f46e5` (deeper indigo)
- Accent 2 (secondary): `#d97706` (deeper amber)
- Success: `#16a34a` / Warning: `#d97706` / Danger: `#dc2626`

### Shape & motion
- Card border radius: `8px` (--radius-lg)
- Button border radius: `6px` (--radius-md)
- Input border radius: `4px` (--radius-sm)
- Default transition: `all 100ms ease-out`
- **No drop shadows** — use borders for depth

### Implementation rules

1. **Implement light/dark toggle** using `[data-theme]` attribute on `<html>`
2. **Use CSS custom properties** — do not hardcode any color hex values
3. **Cards** get 1px border at `--border-0`, hover shifts to `--border-1`
4. **Focus states:** border-color `--accent-1` + box-shadow `0 0 0 3px var(--accent-1-sub)`
5. **Buttons:** primary uses `--accent-1` bg with white text; default uses `--surface` bg
6. **All badge/tag text** must use a color from the same hue family as its background
7. **Data/numbers** use the mono font (JetBrains Mono)
8. **Section labels:** uppercase, letter-spacing 0.08em, `--text-3` color, 12px mono
9. **Spacing scale:** 4px base — 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px
10. **Typography scale:** 0.75rem xs, 0.8125rem sm, 0.875rem base, 1rem md, 1.125rem lg, 1.375rem xl, 1.75rem 2xl, 2.25rem 3xl

The full token file is at `tokens.json`. The rationale is in `TASTE.md`.
