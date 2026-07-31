import { useState } from 'react'
import { api } from '../api'
import { formatDuration } from '../lib/format'
import type { Clip } from '../types'
import { Badge } from './Badge'

export function ClipCard({ clip }: { clip: Clip }) {
  const [thumbFailed, setThumbFailed] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const thumbSrc = clip.thumbnailUrl ? api.resolveUrl(clip.thumbnailUrl) : undefined
  const downloadHref = api.resolveUrl(clip.downloadUrl)
  const label = `Clip ${clip.index + 1}`
  const downloadName = downloadHref.startsWith('blob:') ? `clip-${clip.index + 1}.webm` : undefined

  // Inside the Claude Artifact viewer, blob: URLs can't be handed to the
  // browser's native download flow (no server-fetchable bytes for the host
  // to intercept). Route through the viewer's `downloads` capability instead
  // when it's available; otherwise fall back to the plain anchor download
  // below, which is what the real deployed app uses.
  async function handleDownloadClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!downloadHref.startsWith('blob:') || !window.claude?.downloads) return
    e.preventDefault()
    try {
      const blob = await fetch(downloadHref).then((r) => r.blob())
      await window.claude.downloads.save({ filename: downloadName ?? 'clip.webm', data: blob })
    } catch {
      // Viewer declined the save prompt, or the capability isn't available here.
    }
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-transform duration-250 hover:-translate-y-0.5">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {previewOpen ? (
          <>
            <video
              src={downloadHref}
              controls
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="h-full w-full bg-black object-contain"
            >
              Your browser does not support inline video playback.
            </video>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label={`Close preview for ${label}`}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors duration-200 hover:bg-black/80"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </>
        ) : (
          <>
            {thumbSrc && !thumbFailed ? (
              <img
                src={thumbSrc}
                alt={`Thumbnail for ${label}`}
                onError={() => setThumbFailed(true)}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <ThumbnailPlaceholder />
            )}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              aria-label={`Preview ${label}`}
              className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 hover:bg-black/30 focus-visible:bg-black/30"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary opacity-0 shadow-soft transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5" aria-hidden="true">
                  <path d="M8 5v14l11-7-11-7Z" />
                </svg>
              </span>
            </button>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-foreground">{label}</span>
          <span className="text-sm tabular-nums text-muted-foreground">{formatDuration(clip.duration)}</span>
        </div>

        {clip.hasSubtitles && (
          <Badge tone="primary">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
              <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 3 14.5v-9ZM6 8a1 1 0 0 0 0 2h1a1 1 0 1 0 0-2H6Zm4 0a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4ZM6 11a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H6Z" />
            </svg>
            Subtitles
          </Badge>
        )}

        <a
          href={downloadHref}
          download={downloadName}
          onClick={handleDownloadClick}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors duration-200 hover:bg-blue-600 active:scale-[0.98]"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path d="M10 3a1 1 0 0 1 1 1v7.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L9 11.586V4a1 1 0 0 1 1-1Z" />
            <path d="M4 14a1 1 0 0 1 1 1v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a1 1 0 1 1 2 0v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-1a1 1 0 0 1 1-1Z" />
          </svg>
          Download
        </a>
      </div>
    </div>
  )
}

function ThumbnailPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-shimmer text-muted-foreground animate-shimmer">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 opacity-60" aria-hidden="true">
        <path d="M4 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4Zm5.5 3.5 6 3.5-6 3.5v-7Z" />
      </svg>
      <span className="text-xs font-medium">No preview</span>
    </div>
  )
}
