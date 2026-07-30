import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type Variant = 'error' | 'warning' | 'info'

const VARIANT_CLASSES: Record<Variant, string> = {
  error: 'bg-destructive/10 border-destructive/30 text-red-200',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
  info: 'bg-accent/10 border-accent/30 text-blue-200',
}

const ICONS: Record<Variant, ReactNode> = {
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a1 1 0 0 0 0 2h.01a1 1 0 1 0 0-2H9Zm.75 3a.75.75 0 0 0 0 1.5h.5v1.5a.75.75 0 0 0 1.5 0V13a1.25 1.25 0 0 0-1.25-1.25h-.75Z"
        clipRule="evenodd"
      />
    </svg>
  ),
}

export function Banner({
  variant = 'error',
  title,
  children,
  action,
  role = 'alert',
  className,
}: {
  variant?: Variant
  title?: string
  children?: ReactNode
  action?: ReactNode
  role?: 'alert' | 'status'
  className?: string
}) {
  return (
    <div
      role={role}
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 animate-fade-in',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {ICONS[variant]}
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>}
      </div>
      {action}
    </div>
  )
}
