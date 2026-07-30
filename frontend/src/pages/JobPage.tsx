import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { ClipCard } from '../components/ClipCard'
import { ProgressBar } from '../components/ProgressBar'
import { Spinner } from '../components/Spinner'
import { StepIndicator } from '../components/StepIndicator'
import { useJobPolling } from '../hooks/useJobPolling'
import { formatDuration, statusLabel } from '../lib/format'
import type { Job } from '../types'

export default function JobPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { job, error, loading } = useJobPolling(id)

  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  async function handleCancel() {
    if (!id) return
    setCancelling(true)
    setCancelError(null)
    try {
      await api.cancelJob(id)
      navigate('/')
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError('Could not cancel the job.', 0)
      // Idempotent per the contract: if it's already gone, treat as success.
      if (apiErr.status === 404) {
        navigate('/')
        return
      }
      setCancelError(apiErr.message)
      setCancelling(false)
    }
  }

  // First load, nothing to show yet.
  if (loading && !job) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-muted-foreground">Loading job…</p>
      </div>
    )
  }

  // Job genuinely doesn't exist (404) and we never got a successful fetch.
  if (!job && error?.status === 404) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <Banner variant="error" title="Job not found" className="text-left">
          We couldn&apos;t find a job with that ID. It may have been cancelled or already cleaned up.
        </Banner>
        <Button className="mt-6" onClick={() => navigate('/')}>
          Back to home
        </Button>
      </div>
    )
  }

  // Network/backend-unreachable error and we've never had a successful fetch.
  if (!job && error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <Banner variant="error" title="Backend unreachable" className="text-left">
          {error.message} We&apos;ll keep trying automatically.
        </Banner>
        <Button className="mt-6" variant="secondary" onClick={() => navigate('/')}>
          Back to home
        </Button>
      </div>
    )
  }

  if (!job) {
    return null
  }

  if (job.status === 'failed') {
    return <FailedView job={job} onTryAgain={() => navigate('/')} />
  }

  if (job.status === 'completed') {
    return <ResultsView job={job} onStartOver={() => navigate('/')} />
  }

  return (
    <ProcessingView
      job={job}
      staleConnection={Boolean(error)}
      cancelling={cancelling}
      cancelError={cancelError}
      onCancel={handleCancel}
    />
  )
}

function ProcessingView({
  job,
  staleConnection,
  cancelling,
  cancelError,
  onCancel,
}: {
  job: Job
  staleConnection: boolean
  cancelling: boolean
  cancelError: string | null
  onCancel: () => void
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Processing your video</h1>
        <p className="mt-2 truncate text-muted-foreground">
          {job.videoTitle ?? job.sourceUrl}
        </p>
      </div>

      <div className="mt-8">
        <StepIndicator activeStatus={job.status} />
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-soft-lg sm:p-8">
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5 text-primary" />
          <p className="font-medium text-foreground">{job.message ?? statusLabel(job.status)}</p>
        </div>
        <div className="mt-5">
          <ProgressBar progress={job.progress} />
        </div>

        {staleConnection && (
          <Banner variant="warning" className="mt-5">
            Having trouble reaching the server — still trying in the background.
          </Banner>
        )}
        {cancelError && (
          <Banner variant="error" className="mt-5">
            {cancelError}
          </Banner>
        )}

        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={onCancel} loading={cancelling}>
            {cancelling ? 'Cancelling…' : 'Cancel job'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function FailedView({ job, onTryAgain }: { job: Job; onTryAgain: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mt-2 text-muted-foreground">We couldn&apos;t finish processing this video.</p>
      </div>

      <Banner variant="error" title="Error" className="mt-8">
        {job.error ?? 'An unknown error occurred.'}
      </Banner>

      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={onTryAgain}>
          Try again
        </Button>
      </div>
    </div>
  )
}

function ResultsView({ job, onStartOver }: { job: Job; onStartOver: () => void }) {
  // The backend treats missing YouTube captions (or an auto-generate pass
  // that yields no cues) as non-fatal — the job still completes, just
  // without subtitles. That's the right call (see backend/README.md), but
  // a completed job where every clip silently lacks the subtitles the user
  // asked for would otherwise look like a bug rather than an expected
  // "captions weren't available" outcome, so call it out explicitly.
  const requestedSubtitles = job.options.subtitles !== 'none'
  const noClipHasSubtitles = job.clips.length > 0 && job.clips.every((clip) => !clip.hasSubtitles)
  const showMissingSubtitlesNote = requestedSubtitles && noClipHasSubtitles

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-pink-300">
            Done
          </span>
          <h1 className="mt-3 truncate text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {job.videoTitle ?? 'Your clips are ready'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.clips.length} clip{job.clips.length === 1 ? '' : 's'}
            {job.videoDurationSeconds != null && <> · source video {formatDuration(job.videoDurationSeconds)}</>}
          </p>
        </div>
        <Button variant="secondary" onClick={onStartOver} className="shrink-0">
          Start over
        </Button>
      </div>

      {showMissingSubtitlesNote && (
        <Banner variant="warning" className="mt-6">
          {job.options.subtitles === 'youtube'
            ? "This video didn't have YouTube captions available in the selected language, so these clips were created without burned-in subtitles."
            : "Subtitles couldn't be generated for this video, so these clips were created without burned-in subtitles."}
        </Banner>
      )}

      {job.clips.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          The job finished but produced no clips.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {job.clips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      )}
    </div>
  )
}
