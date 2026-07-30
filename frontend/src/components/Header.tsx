import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="border-b border-border/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg text-lg font-extrabold tracking-tight text-foreground transition-opacity duration-200 hover:opacity-80"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-sm text-white shadow-soft-sm"
          >
            ▶
          </span>
          YouTube Clip Studio
        </Link>
        <span className="hidden rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground sm:block">
          v1.0
        </span>
      </div>
    </header>
  )
}
