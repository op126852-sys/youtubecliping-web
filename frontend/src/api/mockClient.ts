// DEV-ONLY mock backend. Never used in production — see `src/api/index.ts`,
// which only wires this in when VITE_USE_MOCK_API === 'true'. Lets us click
// through every job-status state (queued/processing/completed/failed) and the
// "backend unreachable" banner without a live backend.
import type { ClipOptions, Job } from '../types'
import { ApiError } from './apiError'
import { accentFor, generateMockThumbnail, generateMockVideo } from './mockMedia'
import type { ApiClient } from './types'

const NOW = () => new Date().toISOString()

interface MockJobRecord {
  job: Job
  createdAtMs: number
  shouldFail: boolean
  /** clipId -> object URL of a synthesized, genuinely playable/downloadable clip. */
  media: Map<string, string>
}

const store = new Map<string, MockJobRecord>()

const YOUTUBE_URL_RE = /(youtube\.com\/(watch\?(?:.*&)?v=[\w-]{6,}|shorts\/[\w-]{6,})|youtu\.be\/[\w-]{6,})/i

function validate(options: ClipOptions): { field: string; error: string } | null {
  if (!YOUTUBE_URL_RE.test(options.url || '')) {
    return { field: 'url', error: "That doesn't look like a YouTube link." }
  }
  if (!Number.isInteger(options.numClips) || options.numClips < 1 || options.numClips > 10) {
    return { field: 'numClips', error: 'Number of clips must be an integer between 1 and 10.' }
  }
  if (!Number.isInteger(options.clipLength) || options.clipLength < 5 || options.clipLength > 180) {
    return { field: 'clipLength', error: 'Clip length must be an integer between 5 and 180 seconds.' }
  }
  if (!['none', 'youtube', 'auto-generate'].includes(options.subtitles)) {
    return { field: 'subtitles', error: 'Unrecognized subtitle mode.' }
  }
  return null
}

// Deterministic, elapsed-time-based state machine so `getJob` is a pure
// function of "how long ago was this created" — no timers to leak/clean up.
const STAGE_END_MS = {
  queued: 1200,
  fetching_info: 3000,
  downloading: 7000,
  processing: 10500,
}

function computeState(record: MockJobRecord): Pick<Job, 'status' | 'progress' | 'message' | 'error'> {
  const elapsed = Date.now() - record.createdAtMs

  if (elapsed < STAGE_END_MS.queued) {
    return { status: 'queued', progress: 2, message: 'Waiting in queue…' }
  }
  if (elapsed < STAGE_END_MS.fetching_info) {
    return { status: 'fetching_info', progress: 15, message: 'Fetching video info…' }
  }
  if (elapsed < STAGE_END_MS.downloading) {
    const t = (elapsed - STAGE_END_MS.fetching_info) / (STAGE_END_MS.downloading - STAGE_END_MS.fetching_info)
    return { status: 'downloading', progress: Math.round(25 + t * 45), message: 'Downloading source video…' }
  }
  if (record.shouldFail) {
    return {
      status: 'failed',
      progress: 70,
      error: 'This video is age-restricted and could not be downloaded without sign-in.',
    }
  }
  if (elapsed < STAGE_END_MS.processing) {
    const t = (elapsed - STAGE_END_MS.downloading) / (STAGE_END_MS.processing - STAGE_END_MS.downloading)
    return { status: 'processing', progress: Math.round(70 + t * 28), message: 'Cutting and encoding clips…' }
  }
  return { status: 'completed', progress: 100, message: 'Done!' }
}

function buildClips(options: ClipOptions, jobId: string, media: Map<string, string>): Job['clips'] {
  return Array.from({ length: options.numClips }, (_, i) => {
    const id = `${jobId}-clip-${i}`
    const label = `Clip ${i + 1}`
    const accent = accentFor(i)
    return {
      id,
      index: i,
      startTime: i * options.clipLength,
      duration: options.clipLength,
      hasSubtitles: options.subtitles !== 'none',
      // Synthesized clip if ready; falls back to an unreachable path (matching
      // the real API's shape) if canvas video recording isn't available yet/at all.
      downloadUrl: media.get(id) ?? `/api/jobs/${jobId}/clips/${id}/download`,
      // Every third clip deliberately has no thumbnail, so the UI's placeholder
      // fallback still gets exercised alongside the real generated ones.
      thumbnailUrl: i % 3 === 0 ? undefined : generateMockThumbnail(label, accent),
    }
  })
}

/** Fire-and-forget: synthesizes each clip's video in the background so it's
 * ready well before the job's simulated pipeline reaches "completed". */
async function warmMedia(jobId: string, options: ClipOptions) {
  await Promise.all(
    Array.from({ length: options.numClips }, async (_, i) => {
      const id = `${jobId}-clip-${i}`
      try {
        const url = await generateMockVideo(`Clip ${i + 1}`, accentFor(i))
        store.get(jobId)?.media.set(id, url)
      } catch {
        // Browser can't record canvas video — clip keeps its unreachable fallback URL.
      }
    }),
  )
}

let mockHealthDown = import.meta.env.VITE_MOCK_HEALTH_DOWN === 'true'

/** Test-only escape hatch (see mock-check.html) to flip the simulated backend-down banner at runtime. */
;(globalThis as unknown as { __setMockHealthDown?: (v: boolean) => void }).__setMockHealthDown = (v: boolean) => {
  mockHealthDown = v
}

export const mockApiClient: ApiClient = {
  health: async () => {
    await delay(150)
    if (mockHealthDown) {
      throw new ApiError('Could not reach the server. Is the backend running?', 0)
    }
    return { status: 'ok' }
  },

  createJob: async (options: ClipOptions) => {
    await delay(300)
    const invalid = validate(options)
    if (invalid) {
      throw new ApiError(invalid.error, 400, invalid.field)
    }
    const jobId = `mock-${Math.random().toString(36).slice(2, 10)}`
    const createdAtMs = Date.now()
    const job: Job = {
      id: jobId,
      status: 'queued',
      progress: 0,
      message: 'Waiting in queue…',
      sourceUrl: options.url,
      videoTitle: 'Mock Video — How To Build Great Products',
      videoDurationSeconds: 843,
      videoThumbnail: undefined,
      options,
      clips: [],
      createdAt: NOW(),
      updatedAt: NOW(),
    }
    const shouldFail = /fail/i.test(options.url)
    store.set(jobId, {
      job,
      createdAtMs,
      // Magic trigger for QA: any URL containing "fail" simulates a failed job.
      shouldFail,
      media: new Map(),
    })
    if (!shouldFail) void warmMedia(jobId, options)
    return { jobId }
  },

  getJob: async (id: string) => {
    await delay(150)
    const record = store.get(id)
    if (!record) {
      throw new ApiError('job not found', 404)
    }
    const state = computeState(record)
    const job: Job = {
      ...record.job,
      ...state,
      clips: state.status === 'completed' ? buildClips(record.job.options, id, record.media) : [],
      updatedAt: NOW(),
    }
    record.job = job
    return job
  },

  cancelJob: async (id: string) => {
    await delay(150)
    for (const url of store.get(id)?.media.values() ?? []) URL.revokeObjectURL(url)
    store.delete(id)
  },

  resolveUrl: (path: string) => path,
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
