import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

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
  default:    'border-l-4 border-l-border',
}

const ICON_BG: Record<string, string> = {
  financial:  'bg-accent/10 text-accent',
  physical:   'bg-green-100 text-green-600',
  risk:       'bg-orange-100 text-orange-600',
  activities: 'bg-yellow-100 text-yellow-600',
  pending:    'bg-purple-100 text-purple-600',
  default:    'bg-muted text-muted-foreground',
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, variant = 'default', loading }: KPICardProps) {
  return (
    <Card className={cn('p-5 hover:shadow-md transition-shadow', VARIANT_CLASSES[variant])}>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-7 w-16 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <p className={cn('text-xs font-medium mt-2', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
                {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value).toFixed(1)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', ICON_BG[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      )}
    </Card>
  )
}
