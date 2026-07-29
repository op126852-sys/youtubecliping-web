# YouTube Clip Studio — API Contract (v1)

This is the frozen contract between `frontend/` and `backend/`. Both sides build
against this document in parallel. **Do not change these shapes without
updating this file first** (the reviewer pass is the place to negotiate
changes, not silent drift).

Base URL: configurable via `VITE_API_URL` on the frontend (default
`http://localhost:8787`). All bodies are JSON. All endpoints are prefixed
with `/api`.

## Data model

```ts
type SubtitleMode = "none" | "youtube" | "auto-generate";

interface ClipOptions {
  url: string;            // YouTube video URL
  numClips: number;       // 1-10
  clipLength: number;     // seconds, 5-180
  subtitles: SubtitleMode;
  subtitleLang?: string;  // BCP-47-ish, e.g. "en". Default "en". Only used when subtitles !== "none"
}

type JobStatus =
  | "queued"
  | "fetching_info"
  | "downloading"
  | "processing"
  | "completed"
  | "failed";

interface Clip {
  id: string;
  index: number;          // 0-based order
  startTime: number;      // seconds into source video
  duration: number;       // seconds
  hasSubtitles: boolean;
  downloadUrl: string;    // absolute path, e.g. /api/jobs/:jobId/clips/:clipId/download
  thumbnailUrl?: string;  // /api/jobs/:jobId/clips/:clipId/thumbnail
}

interface Job {
  id: string;
  status: JobStatus;
  progress: number;       // 0-100
  message?: string;       // human-readable current step, e.g. "Downloading video…"
  error?: string;         // present only when status === "failed"
  sourceUrl: string;
  videoTitle?: string;
  videoDurationSeconds?: number;
  videoThumbnail?: string;
  options: ClipOptions;
  clips: Clip[];
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
}
```

## Endpoints

### `GET /api/health`
Returns `{ status: "ok" }`. Used by frontend to show a "backend unreachable"
banner and by the reviewer to smoke-test the server is up.

### `POST /api/jobs`
Body: `ClipOptions`.

Validation (return `400` with `{ error: string, field?: string }` on failure):
- `url` must look like a YouTube URL (`youtube.com/watch?v=`, `youtu.be/`,
  `youtube.com/shorts/`). Reject anything else with a clear message.
- `numClips` integer 1-10.
- `clipLength` integer 5-180.
- `subtitles` one of the three enum values.

Response `202`: `{ jobId: string }`. The job is created in `queued` status
and processed asynchronously — this endpoint must return immediately, it
must never block on the download/ffmpeg work.

### `GET /api/jobs/:id`
Response `200`: full `Job` object (see above). `404` with
`{ error: "job not found" }` if unknown.

Frontend polls this every 2s while status is not `completed`/`failed`.

### `GET /api/jobs/:id/clips/:clipId/download`
Streams the clip's video file (`video/mp4`), `Content-Disposition: attachment`.
`404` if job or clip unknown, or file missing on disk (e.g. cleaned up).

### `GET /api/jobs/:id/clips/:clipId/thumbnail`
Streams a JPEG thumbnail for the clip. `404` if missing — frontend must
render a placeholder in that case, this is not fatal.

### `DELETE /api/jobs/:id`
Cancels/cleans up a job and its files on disk. Response `204`. Idempotent
(404 is fine if already gone, frontend doesn't need to treat that as an
error when cleaning up on unmount).

## Error shape (all non-2xx)
```json
{ "error": "human readable message", "field": "optional field name for 400s" }
```
The frontend renders `error` directly to the user — keep messages
non-technical (e.g. "That doesn't look like a YouTube link" not "regex
mismatch").

## CORS
Backend must allow the frontend's dev origin (`http://localhost:5173`) via
CORS, credentials not needed (no auth in v1 — this is an anonymous,
job-ID-based flow, no accounts).

## Ports (local dev)
- Backend: `8787`
- Frontend (Vite dev server): `5173`

## Division of ownership
- `backend/` — Node.js + Express + TypeScript, yt-dlp + ffmpeg orchestration,
  in-memory job store, static file serving for clips/thumbnails.
- `frontend/` — React + Vite + TypeScript + Tailwind CSS, all UI/UX.
- Neither agent touches the other's directory, nor anything outside
  `youtube-clip-studio/` (that's the rest of the ui-ux-pro-max-skill repo —
  unrelated, do not touch it).
