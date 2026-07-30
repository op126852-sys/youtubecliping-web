import { cn } from '../lib/cn'
import type { SubtitleMode } from '../types'

const OPTIONS: { value: SubtitleMode; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'Clips with no subtitles.' },
  {
    value: 'youtube',
    label: 'Burn in YouTube captions',
    description: "Use the video's existing YouTube captions, if available.",
  },
  {
    value: 'auto-generate',
    label: 'Auto-generate captions',
    description: 'Transcribe the audio and burn in generated captions.',
  },
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
]

export function SubtitleModeField({
  value,
  onChange,
  lang,
  onLangChange,
  disabled,
}: {
  value: SubtitleMode
  onChange: (value: SubtitleMode) => void
  lang: string
  onLangChange: (lang: string) => void
  disabled?: boolean
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-foreground" id="subtitles-label">
        Subtitles
      </span>
      <div role="radiogroup" aria-labelledby="subtitles-label" className="flex flex-col gap-2">
        {OPTIONS.map((option) => {
          const active = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors duration-200',
                active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name="subtitles"
                value={option.value}
                checked={active}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span>
                <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                <span className="block text-sm text-muted-foreground">{option.description}</span>
              </span>
            </label>
          )
        })}
      </div>

      {value !== 'none' && (
        <div className="mt-3 flex items-center gap-3 animate-fade-in">
          <label htmlFor="subtitle-lang" className="text-sm font-medium text-muted-foreground">
            Caption language
          </label>
          <select
            id="subtitle-lang"
            value={lang}
            disabled={disabled}
            onChange={(e) => onLangChange(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
