import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'violet' | 'gray' | 'orange'
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  const variantClasses = {
    green: 'badge-green',
    red: 'badge-red',
    yellow: 'badge-yellow',
    blue: 'badge-blue',
    violet: 'badge-violet',
    gray: 'badge-gray',
    orange: 'badge bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400',
  }
  return (
    <span className={cn('badge', variantClasses[variant], className)}>
      {children}
    </span>
  )
}
