import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'md' | 'lg' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  // Solid fill uses `secondary` (not `primary`) with white text: #EC4899 + white
  // is only ~3.5:1 (fails WCAG AA's 4.5:1 text contrast), while #DB2777 + white
  // is ~4.6:1. `primary` still does all the accent/ring/border/text-on-dark work
  // elsewhere, where it comfortably passes contrast.
  primary: 'bg-secondary text-primary-foreground shadow-soft hover:brightness-110 active:brightness-95',
  secondary:
    'bg-card text-foreground border border-border hover:bg-muted active:bg-muted disabled:hover:bg-card',
  ghost: 'bg-transparent text-foreground hover:bg-white/5 active:bg-white/10',
  destructive:
    'bg-destructive text-white hover:bg-red-700 active:bg-red-800 disabled:hover:bg-destructive',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3.5 gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-250 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-[0.98]',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {!loading && icon}
      {children}
    </button>
  )
}
