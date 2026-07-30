import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export function Badge({
  children,
  tone = 'accent',
  className,
}: {
  children: ReactNode
  tone?: 'accent' | 'primary' | 'muted'
  className?: string
}) {
  const toneClasses = {
    accent: 'bg-accent/15 text-blue-300 border-accent/30',
    primary: 'bg-primary/15 text-pink-300 border-primary/30',
    muted: 'bg-muted text-muted-foreground border-border',
  }[tone]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        toneClasses,
        className,
      )}
    >
      {children}
    </span>
  )
}
