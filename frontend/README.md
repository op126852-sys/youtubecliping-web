# YouTube Clip Studio — Frontend

React + Vite + TypeScript + Tailwind CSS frontend for YouTube Clip Studio.
Paste a YouTube link, choose how many clips / how long / subtitle mode, and
watch the job process through to downloadable clips.

Built against the frozen API contract in
[`../API_CONTRACT.md`](../API_CONTRACT.md) and the palette/style direction in
[`../DESIGN_BRIEF.md`](../DESIGN_BRIEF.md).

## Setup

```bash
npm install
npm run dev       # starts the Vite dev server on http://localhost:5173
```

By default the app talks to a backend at `http://localhost:8787` (see
`API_CONTRACT.md`). Run the `backend/` service separately — this app does not
start it for you.

## Environment variables

Copy `.env.example` to `.env.local` to override any of these:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8787` | Base URL of the backend API. All requests are made to `${VITE_API_URL}/api/...`. |
| `VITE_USE_MOCK_API` | unset (`false`) | **Dev only.** Set to `true` to swap in an in-memory mock backend (`src/api/mockClient.ts`) instead of calling the real API — useful for building/demoing the UI without a live backend. **Must stay unset/false in any real deployment** — the shipped default always calls the real API per the contract. |
| `VITE_MOCK_HEALTH_DOWN` | unset (`false`) | **Dev only,** only read by the mock backend. Set to `true` (together with `VITE_USE_MOCK_API=true`) to simulate a dead backend and see the "can't reach the server" banner. |

## Scripts

```bash
npm run dev        # dev server with HMR
npm run build      # tsc -b (typecheck) + vite build -> dist/
npm run preview    # preview the production build locally
npm run lint       # oxlint
```

`npm run build` runs a full TypeScript typecheck before bundling, so a clean
build implies a clean `tsc --noEmit`.

## Verifying the UI without a live backend

Every job status the UI needs to handle (`queued` → `fetching_info` →
`downloading` → `processing` → `completed`, plus `failed`, plus a dead
backend) can be exercised without the real API:

```bash
# .env.local
VITE_USE_MOCK_API=true
```

Then `npm run dev` and:
- Any normal-looking YouTube URL walks through queued → completed over ~11s,
  with fabricated clips (including a deliberately-missing thumbnail on some
  clips, to exercise the "thumbnail 404 → placeholder" fallback).
- A URL containing the word `fail` (e.g.
  `https://www.youtube.com/watch?v=FAILFAILFAIL`) walks through to a
  `failed` status with a sample error message, to check the failed-job view.
- Add `VITE_MOCK_HEALTH_DOWN=true` to simulate `GET /api/health` failing and
  see the backend-unreachable banner.

This mock is dev-only and lives entirely behind the `VITE_USE_MOCK_API` flag
(`src/api/index.ts` picks between `src/api/client.ts`, the real client, and
`src/api/mockClient.ts`). Leave the flag unset for the app to call the real
backend, which is the default and what ships.

## Project structure

```
src/
  api/            API client (real + dev-only mock), shared ApiClient type, ApiError
  components/     Reusable UI: form controls, Button, Banner, ProgressBar, ClipCard, ...
  hooks/          useHealthCheck (polls GET /api/health), useJobPolling (polls GET /api/jobs/:id every 2s)
  lib/            Small helpers: className joiner, duration/status formatting, URL validation
  pages/          Home (paste-link form), JobPage (processing/failed/results views), NotFound
  types.ts        TypeScript mirror of the API contract's data model
```

### Screens

- **Home** (`/`) — hero, URL input with inline validation, clip count
  stepper, clip length presets + custom, subtitle mode radios, submit.
- **Processing** (`/jobs/:id` while not completed/failed) — pipeline step
  indicator, progress bar, human-readable status message, cancel button.
- **Results** (`/jobs/:id` once `status === "completed"`) — grid of clip
  cards (thumbnail with placeholder fallback, duration, subtitles badge,
  inline `<video>` preview, download button), start-over CTA.
- **Failed** (`/jobs/:id` once `status === "failed"`) — the job's `error`
  message and a "try again" CTA back to Home.
- A backend-unreachable banner (from `GET /api/health`, polled every 15s)
  appears app-wide whenever the backend can't be reached.

Processing, Results, and Failed are three render branches of one `JobPage`
component keyed off `job.status`, rather than three separate routes — this
was a judgment call (the contract only requires the `jobId` to land in the
URL after submission, not a distinct results URL) made to keep all polling
state in one place and avoid a re-fetch/flicker on the completed transition.

## Accessibility & responsiveness

- All inputs have associated `<label>`s; radio/checkbox groups use
  `role="radiogroup"`/`role="group"` with `aria-labelledby`.
- Focus is always visible via a global `:focus-visible` style using the
  brief's ring color (`--color-ring`, `#EC4899`).
- Progress bar exposes `role="progressbar"` with `aria-valuenow/min/max`.
- Layout is mobile-first and fully responsive (single-column form and clip
  grid on small screens, up to a 3-column clip grid on desktop).

## Design system

The brief's palette lives as CSS variables in `src/index.css` (stored as `R G
B` triples) and is wired into Tailwind via `tailwind.config.js`'s `colors`
using `rgb(var(--color-x) / <alpha-value>)`, so both plain utilities
(`bg-primary`) and opacity-modified ones (`bg-primary/10`) work. Components
consume the resulting Tailwind classes (`bg-primary`, `text-muted-foreground`,
`ring-ring`, etc.) — no hex codes are hardcoded in component JSX.
