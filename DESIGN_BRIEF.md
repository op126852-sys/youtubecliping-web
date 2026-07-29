# Design brief (from ui-ux-pro-max search)

Product type match: **Short Video Editor** (dark, video-tool aesthetic).

## Palette (use as Tailwind theme extension / CSS variables)
- Primary: `#EC4899` (video pink) — on-primary `#FFFFFF`
- Secondary: `#DB2777`
- Accent: `#2563EB` (timeline blue) — on-accent `#FFFFFF`
- Background: `#0F172A`
- Foreground: `#FFFFFF`
- Card: `#192134`
- Muted: `#201A32` / muted-foreground `#94A3B8`
- Border: `rgba(255,255,255,0.08)`
- Destructive: `#DC2626`
- Ring/focus: `#EC4899`

Rationale: dark canvas reads as a pro editing tool, pink primary signals
"clip/creative," blue accent doubles as a timeline/progress-bar color so it's
visually distinct from primary CTAs.

## Style direction
Soft UI Evolution cues (soft multi-layer shadows, 8-12px radius, 200-300ms
transitions, WCAG AA+ contrast) applied on the dark palette above, plus
Interactive-Product-Demo landing patterns (hero with a live "paste a link"
demo, step indicators for the clip pipeline, prominent primary CTA).

## Required screens
1. **Home / paste-link** — hero, URL input, options (number of clips 1-10,
   clip length preset chips 15/30/60/90s + custom, subtitle mode radio:
   none / burn in YouTube captions / auto-generate), submit CTA.
2. **Processing** — job status, progress bar, human-readable step message,
   cancel button.
3. **Results** — grid of clip cards (thumbnail, duration, subtitle badge,
   download button, per-clip preview via `<video>` if feasible), "start
   over" CTA.
4. Error / empty / backend-unreachable states for all of the above.

## Non-negotiables
- Fully responsive (mobile input is a primary use case — people paste links
  from their phone).
- Keyboard accessible forms, visible focus rings (use the `ring` color
  above), labelled inputs, WCAG AA contrast minimum.
- Loading and error states are not afterthoughts — every async action needs
  both.
