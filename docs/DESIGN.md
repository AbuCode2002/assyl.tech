# assyl.tech — design system

Concept: **"deep-space command deck"**. A void-black canvas where colour and light come from
3D/WebGL objects and one brand signal colour; UI chrome is thin hairlines, monospace HUD
labels and oversized geometric display type. Restraint in UI, spectacle in motion.

References distilled: Axelar (mono telemetry labels, flat tonal surfaces), OHZI (3D is the
only source of depth), Aaru (numbered hairline accordion rows, particle hero), Galileo
(cobalt accent on navy void, pill buttons), Max Yinger (HUD corner layout, time readout),
Indentech / Hallucination AI dribbble shots (voxel / particle blue clouds, wide display font).

## Tokens (see `src/app/globals.css` `@theme`)

| Token | Value | Use |
|---|---|---|
| `void` | `#030407` | page background |
| `ink` / `carbon` / `graphite` / `steel` | `#06080d` `#0a0d14` `#11151f` `#1a1f2c` | stepped surfaces (cards, inputs, hovers) |
| `line` / `line-strong` | white 8% / 16% | hairline borders and dividers |
| `fg` / `dim` / `mute` | `#eef2f8` `#8d95a8` `#545b6d` | text levels |
| `signal` → `signal-2` | `#3b7bff` → `#5a5cff` | brand gradient (logo). The ONLY strong chromatic UI colour |
| `ion` | `#56e1ff` | tiny accents: focus rings, live dots, data highlights |
| `plasma` | `#9b6bff` | secondary accent inside 3D/gradients only |
| `ok` / `warn` / `danger` | `#3dffa8` `#ffb547` `#ff5a6a` | status |

Tailwind classes: `bg-void`, `text-dim`, `border-line`, `bg-signal`, `text-ion`, … plus utilities
`mono-label`, `text-signal-gradient`, `text-chrome`, `glass`, `signal-glow`, `text-outline`, `container-x`.

## Typography

- **Display** — `font-display` (Unbounded, supports Kazakh Cyrillic). Headlines weight 500–600,
  tight leading `leading-[0.95]`, tracking `-0.03em`, fluid sizes with `clamp()`:
  - H1 hero: `clamp(44px, 8.2vw, 148px)`
  - H2 section: `clamp(36px, 5.6vw, 96px)`
  - H3: `clamp(22px, 2.2vw, 34px)`
- **Body** — `font-sans` (Manrope) 16–19px, `text-dim`, leading 1.6, max ~60ch.
- **HUD / labels** — `mono-label` (JetBrains Mono 11px, uppercase, tracking .16em). Used for
  eyebrows `[02] ── SERVICES`, metadata, coordinates, counters, button text.
- Numbers (stats, indices): display font, `tabular-nums`.

## Layout

- `container-x` (max 1440, fluid side padding). Sections `py-[clamp(96px,14vw,200px)]`.
- 12-column feel; asymmetry is welcome (title left 5 cols, content right 7 cols).
- Every section starts with `<SectionEyebrow index="04">…</SectionEyebrow>` then a big H2.
- Every section root has an `id` (anchor) and `data-track-section="<id>"` (analytics).
- Full-bleed hairline dividers between sections (`border-t border-line`).

## Shape & surface

- Radius: pills `rounded-full` (buttons, chips, badges); cards `rounded-2xl` (16px) or sharp 0
  for HUD panels; inputs `rounded-xl`.
- No drop shadows except `signal-glow` on the primary CTA. Depth = tonal step + hairline.
- Decorations: `HudCorners` brackets on panels/media, `TickRail` rulers, `StatusDot`, crosshair `+`
  marks at grid intersections, faint grid lines, film grain overlay (global).

## Motion

- Library: GSAP + ScrollTrigger via `@/lib/gsap` (`gsap`, `ScrollTrigger`, `useGSAP`). Smooth
  scroll is Lenis (global). Always use `useGSAP(() => …, { scope: ref })` for cleanup.
- Easing: `expo.out` for reveals (duration 1–1.4s), `power2.inOut` for scrubbed timelines. CSS:
  `ease-out-expo`.
- Text: `RevealText` (masked word slide-up; `mode="scrub"` for manifesto paragraphs),
  `ScrambleText` (glyph decode for labels/numbers/nav hover).
- Hover: `MagneticButton` (magnetic + fill sweep + label roll), `SpotlightCard` (cursor light),
  row fills that sweep in from the left, arrows that rotate 45°.
- Respect `prefers-reduced-motion` (helpers already short-circuit; check `prefersReducedMotion()`
  before building custom timelines).
- Performance: animate only `transform`/`opacity`/`clip-path`; pause videos/WebGL off-screen.

## Components (`src/components/ui`)

`LogoMark`, `Wordmark`, `MagneticButton` (+`ArrowIcon`), `ScrambleText`, `RevealText`, `FadeIn`,
`SpotlightCard`, `HudCorners`, `SectionEyebrow`, `StatusDot`, `TickRail`. `cn()` in `@/lib/cn`.

## i18n

next-intl, locales `ru` (default, no prefix), `kz` (`/kz`, html lang `kk`), `en` (`/en`).
Messages are split per section: `src/messages/<locale>/<namespace>.json`; namespaces are listed
in `src/i18n/request.ts`. Client components: `useTranslations("services")`; server: `getTranslations`.
Use `t.raw()` for arrays/objects. `useLocale()` returns `"ru" | "kz" | "en"`.

## Analytics hooks

- `data-track-section="works"` on section roots → section view events.
- `data-track-click="cta-hero"` on important buttons/links → click events.
- `track("form_start")`, `track("video", "play", {...})` from `@/lib/tracker`.

## Admin panel

Same tokens, calmer: no grain, no WebGL, no scramble. Linear/Vercel-style density, `carbon`
cards with hairline borders, `signal` for primary actions and chart series.
