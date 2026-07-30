import { useState } from 'react'
import { cn } from '../lib/cn'
import { MAX_CLIP_LENGTH, MIN_CLIP_LENGTH, clamp } from '../lib/validation'

const PRESETS = [15, 30, 60, 90]

export function ClipLengthPicker({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}) {
  const [customMode, setCustomMode] = useState(!PRESETS.includes(value))

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-foreground" id="clip-length-label">
        Clip length
      </label>
      <div role="group" aria-labelledby="clip-length-label" className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const active = !customMode && value === preset
          return (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => {
                setCustomMode(false)
                onChange(preset)
              }}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                active
                  ? 'border-primary bg-secondary text-primary-foreground shadow-soft-sm'
                  : 'border-border bg-card text-foreground hover:bg-muted',
              )}
            >
              {preset}s
            </button>
          )
        })}
        <button
          type="button"
          disabled={disabled}
          aria-pressed={customMode}
          onClick={() => setCustomMode(true)}
          className={cn(
            'rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
            customMode
              ? 'border-primary bg-secondary text-primary-foreground shadow-soft-sm'
              : 'border-border bg-card text-foreground hover:bg-muted',
          )}
        >
          Custom
        </button>
      </div>

      {customMode && (
        <div className="mt-3 flex items-center gap-4 rounded-lg border border-border bg-card p-4 animate-fade-in">
          <input
            type="range"
            min={MIN_CLIP_LENGTH}
            max={MAX_CLIP_LENGTH}
            step={1}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(clamp(Number(e.target.value), MIN_CLIP_LENGTH, MAX_CLIP_LENGTH))}
            aria-label="Custom clip length in seconds"
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:cursor-not-allowed"
          />
          <div className="flex shrink-0 items-center gap-1.5">
            <input
              type="number"
              min={MIN_CLIP_LENGTH}
              max={MAX_CLIP_LENGTH}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(Number(e.target.value))}
              onBlur={(e) => onChange(clamp(Number(e.target.value) || MIN_CLIP_LENGTH, MIN_CLIP_LENGTH, MAX_CLIP_LENGTH))}
              aria-label="Custom clip length value in seconds"
              className="h-9 w-16 rounded-lg border border-border bg-background text-center text-sm font-semibold tabular-nums focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span className="text-sm text-muted-foreground">sec</span>
          </div>
        </div>
      )}
      <p className="mt-1.5 text-sm text-muted-foreground">Between {MIN_CLIP_LENGTH}–{MAX_CLIP_LENGTH} seconds.</p>
    </div>
  )
}
