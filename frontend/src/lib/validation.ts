// Client-side "does this look right" check only. The backend is the source of
// truth for validation (see API_CONTRACT.md) — this just gives fast inline
// feedback before we ever hit the network.
const YOUTUBE_URL_RE =
  /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com\/(watch\?(?:.*&)?v=[\w-]{6,}|shorts\/[\w-]{6,})|youtu\.be\/[\w-]{6,})/i

export function isValidYouTubeUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return YOUTUBE_URL_RE.test(trimmed)
}

export const MIN_CLIPS = 1
export const MAX_CLIPS = 10
export const MIN_CLIP_LENGTH = 5
export const MAX_CLIP_LENGTH = 180

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}
