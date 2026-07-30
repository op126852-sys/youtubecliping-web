import { cn } from '../lib/cn'
import type { JobStatus } from '../types'

interface Step {
  key: JobStatus
  label: string
}

const STEPS: Step[] = [
  { key: 'queued', label: 'Queued' },
  { key: 'fetching_info', label: 'Fetching info' },
  { key: 'downloading', label: 'Downloading' },
  { key: 'processing', label: 'Cutting clips' },
  { key: 'completed', label: 'Done' },
]

const ORDER: JobStatus[] = ['queued', 'fetching_info', 'downloading', 'processing', 'completed']

/**
 * Visualizes the clip pipeline. With no `activeStatus`, renders as a static
 * decorative row (used on the Home hero). With one, highlights progress
 * through the pipeline for the current job — `failed` is shown as the last
 * reached step turning into an error state.
 */
export function StepIndicator({
  activeStatus,
  failed = false,
}: {
  activeStatus?: JobStatus
  failed?: boolean
}) {
  const activeIndex = activeStatus ? ORDER.indexOf(activeStatus === 'failed' ? 'processing' : activeStatus) : -1

  return (
    <ol className="flex w-full items-center" aria-label="Clip pipeline progress">
      {STEPS.map((step, i) => {
        const isDone = activeIndex > i
        const isCurrent = activeIndex === i
        const isFailedHere = failed && isCurrent
        const isDecorative = activeStatus === undefined

        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-300',
                  isDecorative && 'border-primary/40 bg-primary/10 text-primary',
                  !isDecorative && isFailedHere && 'border-destructive bg-destructive/20 text-destructive',
                  // secondary (not primary) so the white checkmark clears WCAG AA text contrast (see Button.tsx)
                  !isDecorative && !isFailedHere && isDone && 'border-secondary bg-secondary text-primary-foreground',
                  !isDecorative && !isFailedHere && isCurrent && 'border-primary bg-primary/20 text-primary animate-pulse-soft',
                  !isDecorative && !isFailedHere && !isDone && !isCurrent && 'border-border bg-card text-muted-foreground',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isFailedHere ? '!' : isDone ? '✓' : i + 1}
              </div>
              <span
                className={cn(
                  'hidden text-xs font-medium sm:block',
                  isFailedHere ? 'text-destructive' : isCurrent || isDone ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 flex-1 rounded transition-colors duration-300 sm:mx-2',
                  isDecorative && 'bg-primary/20',
                  !isDecorative && (isDone ? 'bg-secondary' : 'bg-border'),
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
