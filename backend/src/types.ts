// Public API types — mirrors API_CONTRACT.md exactly. Do not add fields here
// that aren't in the contract; internal-only data (file paths, etc.) is kept
// out of band and derived by convention from jobId/clipId (see src/paths.ts).

export type SubtitleMode = "none" | "youtube" | "auto-generate";

export interface ClipOptions {
  url: string; // YouTube video URL
  numClips: number; // 1-10
  clipLength: number; // seconds, 5-180
  subtitles: SubtitleMode;
  subtitleLang?: string; // BCP-47-ish, e.g. "en". Default "en".
}

export type JobStatus =
  | "queued"
  | "fetching_info"
  | "downloading"
  | "processing"
  | "completed"
  | "failed";

export interface Clip {
  id: string;
  index: number; // 0-based order
  startTime: number; // seconds into source video
  duration: number; // seconds
  hasSubtitles: boolean;
  downloadUrl: string;
  thumbnailUrl?: string;
}

export interface Job {
  id: string;
  status: JobStatus;
  progress: number; // 0-100
  message?: string;
  error?: string; // present only when status === "failed"
  sourceUrl: string;
  videoTitle?: string;
  videoDurationSeconds?: number;
  videoThumbnail?: string;
  options: ClipOptions;
  clips: Clip[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface ApiError {
  error: string;
  field?: string;
}
