// Mirrors the frozen API contract in `youtube-clip-studio/API_CONTRACT.md`.
// Do not change these shapes without updating the contract first.

export type SubtitleMode = 'none' | 'youtube' | 'auto-generate'

export interface ClipOptions {
  url: string // YouTube video URL
  numClips: number // 1-10
  clipLength: number // seconds, 5-180
  subtitles: SubtitleMode
  subtitleLang?: string // BCP-47-ish, e.g. "en". Only used when subtitles !== "none"
}

export type JobStatus =
  | 'queued'
  | 'fetching_info'
  | 'downloading'
  | 'processing'
  | 'completed'
  | 'failed'

export interface Clip {
  id: string
  index: number // 0-based order
  startTime: number // seconds into source video
  duration: number // seconds
  hasSubtitles: boolean
  downloadUrl: string // e.g. /api/jobs/:jobId/clips/:clipId/download
  thumbnailUrl?: string // /api/jobs/:jobId/clips/:clipId/thumbnail
}

export interface Job {
  id: string
  status: JobStatus
  progress: number // 0-100
  message?: string
  error?: string // present only when status === "failed"
  sourceUrl: string
  videoTitle?: string
  videoDurationSeconds?: number
  videoThumbnail?: string
  options: ClipOptions
  clips: Clip[]
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

export interface ApiErrorBody {
  error: string
  field?: string
}
