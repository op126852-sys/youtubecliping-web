import { Button } from './Button'
import type { HealthStatus } from '../hooks/useHealthCheck'

export function BackendStatusBanner({
  status,
  onRetry,
}: {
  status: HealthStatus
  onRetry: () => void
}) {
  if (status !== 'down') return null

  return (
    <div role="alert" className="border-b border-destructive/30 bg-destructive/10">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-red-200">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            <strong className="font-semibold">Can&apos;t reach the server.</strong> Some features won&apos;t work
            until it&apos;s back.
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={onRetry} className="shrink-0">
          Retry
        </Button>
      </div>
    </div>
  )
}
