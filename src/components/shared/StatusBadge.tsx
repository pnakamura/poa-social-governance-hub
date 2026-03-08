import { cn } from '@/lib/utils'

type StatusKey = 'todo' | 'progress' | 'waiting' | 'done'
type UrgencyKey = 'Alta' | 'Media' | 'Baixa'
type RiscoNivel = 'Crítico' | 'Alto' | 'Médio' | 'Baixo' | 'Mínimo'

const STATUS_CONFIG: Record<StatusKey, { label: string; className: string }> = {
  todo:     { label: 'A fazer',     className: 'badge-todo' },
  progress: { label: 'Em andamento', className: 'badge-progress' },
  waiting:  { label: 'Aguardando',  className: 'badge-waiting' },
  done:     { label: 'Concluído',   className: 'badge-done' },
}

const URGENCY_CONFIG: Record<UrgencyKey, { className: string }> = {
  Alta:  { className: 'bg-red-100 text-red-700' },
  Media: { className: 'bg-yellow-100 text-yellow-700' },
  Baixa: { className: 'bg-green-100 text-green-700' },
}

export function StatusBadge({ status }: { status: StatusKey }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  )
}

export function UrgencyBadge({ urgencia }: { urgencia: UrgencyKey }) {
  const cfg = URGENCY_CONFIG[urgencia]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', cfg.className)}>
      {urgencia}
    </span>
  )
}

export function RiscoNivelBadge({ nivel }: { nivel: number }) {
  const label = nivel >= 16 ? 'Crítico' : nivel >= 10 ? 'Alto' : nivel >= 5 ? 'Médio' : nivel >= 2 ? 'Baixo' : 'Mínimo'
  const className =
    nivel >= 16 ? 'bg-red-100 text-red-700' :
    nivel >= 10 ? 'bg-orange-100 text-orange-700' :
    nivel >= 5  ? 'bg-yellow-100 text-yellow-700' :
    nivel >= 2  ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', className)}>
      {nivel} — {label}
    </span>
  )
}
