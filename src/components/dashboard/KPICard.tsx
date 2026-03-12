import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  variant?: 'financial' | 'physical' | 'risk' | 'activities' | 'pending' | 'default'
  loading?: boolean
}

const VARIANT_CLASSES: Record<string, string> = {
  financial:  'kpi-bar-financial',
  physical:   'kpi-bar-physical',
  risk:       'kpi-bar-risk',
  activities: 'kpi-bar-activities',
  pending:    'kpi-bar-pending',
  default:    'border-t-3 border-t-border',
}

const ICON_BG: Record<string, string> = {
  financial:  'bg-gradient-to-br from-accent/20 to-accent/5 text-accent',
  physical:   'bg-gradient-to-br from-green-100 to-green-50 text-green-600 dark:from-green-950/30 dark:to-green-900/10 dark:text-green-400',
  risk:       'bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 dark:from-orange-950/30 dark:to-orange-900/10 dark:text-orange-400',
  activities: 'bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-600 dark:from-yellow-950/30 dark:to-yellow-900/10 dark:text-yellow-400',
  pending:    'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 dark:from-purple-950/30 dark:to-purple-900/10 dark:text-purple-400',
  default:    'bg-muted text-muted-foreground',
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, variant = 'default', loading }: KPICardProps) {
  return (
    <Card
      className={cn('p-5 hover-lift rounded-xl border-0 shadow-sm hover:shadow-md', VARIANT_CLASSES[variant])}
      role="region"
      aria-label={`${title}: ${value}`}
    >
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
            {trend && (
              <p className={cn('flex items-center gap-1 text-xs font-medium mt-2', trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                {trend.value >= 0
                  ? <TrendingUp className="w-3 h-3" aria-hidden="true" />
                  : <TrendingDown className="w-3 h-3" aria-hidden="true" />}
                {Math.abs(trend.value).toFixed(1)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm', ICON_BG[variant])} aria-hidden="true">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      )}
    </Card>
  )
}
