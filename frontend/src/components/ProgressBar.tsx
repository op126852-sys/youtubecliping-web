export function ProgressBar({ progress, label }: { progress: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)))
  return (
    <div className="w-full">
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Job progress'}
        className="h-3 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-end">
        <span className="text-xs font-medium tabular-nums text-muted-foreground">{clamped}%</span>
      </div>
    </div>
  )
}
