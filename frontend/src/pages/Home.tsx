import { useState, type FormEvent } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { api, ApiError } from '../api'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { ClipLengthPicker } from '../components/ClipLengthPicker'
import { NumClipsStepper } from '../components/NumClipsStepper'
import { StepIndicator } from '../components/StepIndicator'
import { SubtitleModeField } from '../components/SubtitleModeField'
import { UrlInput } from '../components/UrlInput'
import type { LayoutContext } from './layoutContext'
import { isValidYouTubeUrl } from '../lib/validation'
import type { ClipOptions, SubtitleMode } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const { health } = useOutletContext<LayoutContext>()

  const [url, setUrl] = useState('')
  const [urlTouched, setUrlTouched] = useState(false)
  const [numClips, setNumClips] = useState(3)
  const [clipLength, setClipLength] = useState(30)
  const [subtitles, setSubtitles] = useState<SubtitleMode>('none')
  const [subtitleLang, setSubtitleLang] = useState('en')

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null)

  const urlIsValid = isValidYouTubeUrl(url)
  const showUrlInlineError = urlTouched && url.trim().length > 0 && !urlIsValid
  const urlErrorMessage =
    fieldError?.field === 'url' ? fieldError.message : showUrlInlineError ? "That doesn't look like a YouTube link." : undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setUrlTouched(true)
    setFormError(null)
    setFieldError(null)

    if (!url.trim()) {
      setFieldError({ field: 'url', message: 'Paste a YouTube link to get started.' })
      return
    }
    if (!urlIsValid) {
      setFieldError({ field: 'url', message: "That doesn't look like a YouTube link." })
      return
    }

    const payload: ClipOptions = {
      url: url.trim(),
      numClips,
      clipLength,
      subtitles,
      ...(subtitles !== 'none' ? { subtitleLang } : {}),
    }

    setSubmitting(true)
    try {
      const { jobId } = await api.createJob(payload)
      navigate(`/jobs/${jobId}`)
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError('Something went wrong. Please try again.', 0)
      if (apiErr.field) {
        setFieldError({ field: apiErr.field, message: apiErr.message })
      } else {
        setFormError(apiErr.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const backendDown = health.status === 'down'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Hero */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-pink-300">
          Paste a link. Get share-ready clips.
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Turn any YouTube video into <span className="text-primary">viral clips</span>
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Drop in a link, choose how many clips and how long, and we&apos;ll auto-split it — with optional
          burned-in subtitles — ready to download.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <StepIndicator />
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-soft-lg sm:p-8"
      >
        <div className="flex flex-col gap-6">
          <UrlInput
            value={url}
            onChange={(v) => {
              setUrl(v)
              if (fieldError?.field === 'url') setFieldError(null)
            }}
            onBlur={() => setUrlTouched(true)}
            error={urlErrorMessage}
            disabled={submitting}
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <NumClipsStepper value={numClips} onChange={setNumClips} disabled={submitting} />
          </div>

          <ClipLengthPicker value={clipLength} onChange={setClipLength} disabled={submitting} />

          <SubtitleModeField
            value={subtitles}
            onChange={setSubtitles}
            lang={subtitleLang}
            onLangChange={setSubtitleLang}
            disabled={submitting}
          />

          {fieldError && fieldError.field !== 'url' && (
            <Banner variant="error">{fieldError.message}</Banner>
          )}
          {formError && <Banner variant="error">{formError}</Banner>}
          {backendDown && (
            <Banner variant="warning" title="Backend unreachable">
              You can still fill out the form, but submitting won&apos;t work until the server is back.
            </Banner>
          )}

          <Button type="submit" size="lg" loading={submitting} className="w-full">
            {submitting ? 'Creating your job…' : 'Generate clips'}
          </Button>
        </div>
      </form>
    </div>
  )
}
