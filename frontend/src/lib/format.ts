/** Formats a duration in seconds as `m:ss` (or `h:mm:ss` past an hour). */
export function formatDuration(totalSeconds: number | undefined | null): string {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return '--:--'
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${m}:${String(sec).padStart(2, '0')}`
}

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  fetching_info: 'Fetching video info',
  downloading: 'Downloading video',
  processing: 'Cutting clips',
  completed: 'Completed',
  failed: 'Failed',
}

/** Human-readable fallback label for a job status, used when the job has no `message`. */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}
