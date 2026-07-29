# YouTube Clip Studio — Backend

Node.js + Express + TypeScript implementation of the API in
[`../API_CONTRACT.md`](../API_CONTRACT.md). Downloads a YouTube video with
`yt-dlp`, cuts it into N clips with `ffmpeg`, optionally burns in subtitles
(YouTube captions or local speech-to-text), and serves the results over a
small REST API backed by an in-memory job store.

## Prerequisites

- **Node.js** 18+
- **yt-dlp** on `PATH` (`yt-dlp --version` should work)
- **ffmpeg** and **ffprobe** on `PATH` (`ffmpeg -version` should work)
- **Python 3** on `PATH` — only required if you use `subtitles: "auto-generate"`
- **faster-whisper** (optional, only for `subtitles: "auto-generate"`):
  ```bash
  pip install faster-whisper
  ```
  If a job requests `auto-generate` and this isn't installed, that job fails
  cleanly with `error: "Auto-generated subtitles require faster-whisper
  installed on the server (pip install faster-whisper)..."` — it does not
  crash the server or silently skip subtitles.

## Setup

```bash
npm install
npm run dev     # ts-node-style dev server with reload, via tsx
```

Other scripts:

```bash
npm run build   # compile src/ -> dist/
npm start       # run the compiled server (dist/index.js)
npm run test:pipeline  # local ffmpeg/subtitle pipeline test, see below
```

## Environment variables

| Var              | Default                 | Purpose                                   |
|-------------------|-------------------------|--------------------------------------------|
| `PORT`            | `8787`                  | Port the API listens on                    |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS-allowed origin for the Vite dev server |

## Architecture

```
src/
  index.ts            Express app setup, CORS, error handlers
  types.ts            Public API types (mirrors API_CONTRACT.md exactly)
  paths.ts            Storage path conventions (storage/<jobId>/...)
  routes/
    health.ts         GET /api/health
    jobs.ts           POST/GET/DELETE jobs, clip download/thumbnail streaming
  store/
    jobStore.ts        In-memory Map<jobId, Job>
  services/
    validation.ts      Request body validation for POST /api/jobs
    clipMath.ts         Pure function: numClips/clipLength/duration -> start times
    srt.ts              Hand-rolled SRT parse/shift/window/stringify
    youtube.ts           yt-dlp wrapper: video info, video download, YouTube captions
    ffmpeg.ts            ffmpeg/ffprobe wrapper: cut clip, thumbnail, probe duration
    transcribe.ts        Wraps python/transcribe.py (faster-whisper) for auto-generate mode
    worker.ts            The async pipeline: queued -> fetching_info -> downloading ->
                          processing -> completed|failed
  utils/exec.ts         Promisified child_process.spawn wrapper
python/
  transcribe.py         faster-whisper CLI helper, invoked by transcribe.ts
storage/                Gitignored. storage/<jobId>/source.<ext>, clip_<id>.mp4, etc.
test/
  ffmpeg-pipeline.test.ts   Local, network-free pipeline verification (see below)
  fixtures/sample.srt       Hand-written SRT fixture used by the test
```

### Storage layout

Everything for a job lives under `storage/<jobId>/`:

- `source.<ext>` — the downloaded full video
- `source.<lang>.srt` — full-video subtitles (from YouTube captions or whisper)
- `clip_<clipId>.mp4` — a cut (and possibly subtitle-burned) clip
- `clip_<clipId>_thumb.jpg` — that clip's thumbnail
- `clip_<clipId>.srt` — that clip's shifted/windowed subtitle file (intermediate)

The download/thumbnail routes derive these paths purely from `(jobId,
clipId)` — no extra internal fields leak into the public `Job`/`Clip` JSON,
which stays exactly the shape in `API_CONTRACT.md`.

`DELETE /api/jobs/:id` removes the job from the store and recursively
deletes `storage/<jobId>/`.

### The subtitle-timing gotcha, and how it's handled

When ffmpeg does `-ss <startTime> -i source.mp4 ...`, the *output* clip's
internal timeline restarts at 0 — but an SRT fetched for the whole video
(from YouTube captions or from whisper transcribing the full file) has
timestamps relative to the *original, untrimmed* video. Burning that
untouched SRT into a seeked clip produces offset/wrong captions.

`src/services/srt.ts` fixes this: for each clip, `shiftAndWindow(cues,
start, start + duration)` drops every cue outside that window, shifts the
survivors so the window's start becomes t=0, and clamps any cue that
straddles a window edge so it never runs negative or past the clip's own
length. The resulting per-clip SRT is written to
`storage/<jobId>/clip_<clipId>.srt` and only *that* is passed to ffmpeg's
`subtitles=` filter for that clip.

### Subtitle modes

- `none` — no subtitle processing at all.
- `youtube` — `yt-dlp --write-subs --write-auto-subs --sub-langs <lang>
  --convert-subs srt --skip-download` fetches an SRT for the whole video.
  This is best-effort: if no captions exist in the requested language, the
  job **does not fail** — it just proceeds without subtitles and says so in
  `message`.
- `auto-generate` — shells out to `python3 python/transcribe.py <video>
  <output.srt> <lang>`, which lazily imports `faster_whisper` *inside* the
  script (never at Node startup, and never at Python module import time
  outside the function that needs it) and runs local speech-to-text on the
  full downloaded video. If the import fails, the script exits with a
  recognizable marker on stderr and the job fails with an actionable
  `error` message rather than pretending to have produced subtitles.

## How the pipeline was verified without real YouTube access

This sandbox's network proxy blocks `youtube.com` (`yt-dlp` gets a 403 from
the proxy on any real video — confirmed, and expected here, not a bug).
So instead of an end-to-end YouTube test, verification here is split in two:

1. **HTTP layer, live against the running server** (no network needed):
   - `GET /api/health` → `200 {"status":"ok"}`
   - `POST /api/jobs` with a non-YouTube URL → `400
     {"error":"That doesn't look like a YouTube link.","field":"url"}`
   - `GET /api/jobs/:id` for an unknown id → `404 {"error":"job not found"}`
   - `POST /api/jobs` with a real-looking YouTube URL → `202 {"jobId":...}`
     immediately (proving the endpoint never blocks on the pipeline), and
     polling `GET /api/jobs/:id` shows it walk to `status: "failed"` with
     the proxy's 403 surfaced in `error` — proving the async worker runs,
     updates job state correctly, and a failed download degrades to a
     failed *job*, not a crashed *server*.
   - `DELETE /api/jobs/:id` → `204`, then `404` on a second delete and on a
     subsequent `GET` (idempotent per the contract).

2. **The actual ffmpeg/subtitle pipeline, against a synthetic local video**
   (this is the real proof, since it exercises code that doesn't touch the
   network at all):
   ```bash
   npm run test:pipeline
   ```
   This generates a 16s local video with `ffmpeg -f lavfi -i testsrc ... -f
   lavfi -i sine ...` (no binary fixtures committed), then runs the *exact*
   `computeClipPlan`, `parseSrt`/`shiftAndWindow`/`stringifySrt`, `cutClip`,
   and `generateThumbnail` functions the worker uses — asserting on real
   output files: clip durations (via `ffprobe`), non-empty thumbnails, and
   correctly shifted/clamped/dropped subtitle cues (including cues that
   straddle a clip boundary). It currently passes 15/15 checks, including
   three clips cut with burned-in subtitles from a hand-written SRT
   fixture (`test/fixtures/sample.srt`).

   The missing-dependency path for `auto-generate` mode was also verified
   directly: with `faster-whisper` not installed in this sandbox, `python3
   python/transcribe.py <in> <out> en` exits with code 3 and
   `FASTER_WHISPER_NOT_INSTALLED` on stderr, which `transcribe.ts` turns
   into the documented actionable error message.

## Judgment calls worth double-checking in review

- **YouTube captions are best-effort, not required.** If `subtitles:
  "youtube"` is requested but no captions exist for the language, the job
  still completes (without subtitles) rather than failing — the contract
  doesn't say either way, and "no captions available" felt like a
  non-fatal, expected outcome rather than an error.
- **Clips always re-encode (`libx264`/`aac`)**, even when no subtitles are
  burned in, rather than `-c copy` for the no-subtitle case. This trades a
  bit of speed for exact `-ss`/`-t` boundaries regardless of keyframe
  placement, and keeps one code path instead of two.
- **`auto-generate` transcribes the whole source video once**, then reuses
  the same shift/window logic as `youtube` mode per clip, rather than
  re-running whisper per clip. This should be more consistent and 10x
  cheaper than per-clip transcription, but means one whisper pass has to
  finish before any clip in that job can be cut.
- **Video thumbnail (`Job.videoThumbnail`) is yt-dlp's own thumbnail URL**
  (typically an i.ytimg.com link), not something we re-host — only
  per-clip thumbnails are generated and served by this backend.
