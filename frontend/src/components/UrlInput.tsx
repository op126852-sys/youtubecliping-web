import type { ChangeEvent } from 'react'
import { cn } from '../lib/cn'

export function UrlInput({
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
  disabled?: boolean
}) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)
  const describedBy = error ? 'url-error' : 'url-help'

  return (
    <div>
      <label htmlFor="youtube-url" className="mb-1.5 block text-sm font-semibold text-foreground">
        YouTube video URL
      </label>
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        >
          <path d="M21.582 7.186a2.51 2.51 0 0 0-1.768-1.778C18.254 5 12 5 12 5s-6.254 0-7.814.408a2.51 2.51 0 0 0-1.768 1.778C2 8.756 2 12 2 12s0 3.244.418 4.814a2.51 2.51 0 0 0 1.768 1.778C5.746 19 12 19 12 19s6.254 0 7.814-.408a2.51 2.51 0 0 0 1.768-1.778C22 15.244 22 12 22 12s0-3.244-.418-4.814ZM10 15.5v-7l6 3.5-6 3.5Z" />
        </svg>
        <input
          id="youtube-url"
          name="url"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://www.youtube.com/watch?v=..."
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-lg border bg-card py-3.5 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground/70',
            'transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-destructive' : 'border-border focus:border-primary/50',
          )}
        />
      </div>
      {error ? (
        <p id="url-error" role="alert" className="mt-1.5 text-sm text-red-300">
          {error}
        </p>
      ) : (
        <p id="url-help" className="mt-1.5 text-sm text-muted-foreground">
          Works with youtube.com/watch, youtu.be, and Shorts links.
        </p>
      )}
    </div>
  )
}
