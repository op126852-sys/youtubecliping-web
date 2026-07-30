import { MAX_CLIPS, MIN_CLIPS, clamp } from '../lib/validation'

export function NumClipsStepper({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}) {
  const setValue = (next: number) => onChange(clamp(next, MIN_CLIPS, MAX_CLIPS))

  return (
    <div>
      <label htmlFor="num-clips" className="mb-1.5 block text-sm font-semibold text-foreground">
        Number of clips
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setValue(value - 1)}
          disabled={disabled || value <= MIN_CLIPS}
          aria-label="Decrease number of clips"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-lg font-semibold text-foreground transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <input
          id="num-clips"
          type="number"
          inputMode="numeric"
          min={MIN_CLIPS}
          max={MAX_CLIPS}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(Number(e.target.value))}
          onBlur={(e) => setValue(Number(e.target.value) || MIN_CLIPS)}
          className="h-11 w-16 shrink-0 rounded-lg border border-border bg-card text-center text-base font-semibold tabular-nums text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setValue(value + 1)}
          disabled={disabled || value >= MAX_CLIPS}
          aria-label="Increase number of clips"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-lg font-semibold text-foreground transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
        <span className="text-sm text-muted-foreground">clip{value === 1 ? '' : 's'} (1–10)</span>
      </div>
    </div>
  )
}
