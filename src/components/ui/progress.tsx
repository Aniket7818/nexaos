import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  className?: string
  barClassName?: string
  showLabel?: boolean
}

export function Progress({ value, className, barClassName, showLabel = false }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden', className)}>
        <div
          className={cn('h-full bg-violet-600 rounded-full transition-all duration-500', barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>}
    </div>
  )
}
