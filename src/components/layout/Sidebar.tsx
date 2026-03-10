import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, FileSpreadsheet, BarChart3,
  AlertTriangle, ListChecks, MessageSquareWarning,
  FileText, Settings, ChevronLeft, ChevronRight, TrendingUp,
  CheckSquare, Calendar, AlertOctagon, ShoppingCart, Tag, Brain, Radar,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SyncStatusBadge } from '@/components/SyncStatusBadge'

const NAV_GROUPS = [
  {
    label: 'Visão Geral',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/programa', icon: Building2, label: 'Programa' },
    ],
  },
  {
    label: 'Fontes de Dados',
    items: [
      { to: '/pep', icon: FileSpreadsheet, label: 'PEP RS' },
      { to: '/pmr/outputs', icon: BarChart3, label: 'PMR — Outputs' },
      { to: '/pmr/outcomes', icon: TrendingUp, label: 'PMR — Outcomes' },
      { to: '/aquisicoes', icon: ShoppingCart, label: 'Aquisições' },
      { to: '/nao-objecoes', icon: CheckSquare, label: 'Não-Objeções' },
    ],
  },
  {
    label: 'Acompanhamento',
    items: [
      { to: '/marcos', icon: Calendar, label: 'Timeline' },
      { to: '/atividades', icon: ListChecks, label: 'Atividades' },
      { to: '/riscos', icon: AlertTriangle, label: 'Riscos' },
      { to: '/pontos-atencao', icon: AlertOctagon, label: 'Pontos de Atenção' },
      { to: '/temas', icon: Tag, label: 'Temas' },
    ],
  },
  {
    label: 'Análise',
    items: [
      { to: '/qualidade-dados', icon: ShieldCheck, label: 'Qualidade de Dados' },
      { to: '/monitoramento', icon: Radar, label: 'Monitoramento' },
      { to: '/inteligencia', icon: Brain, label: 'Inteligência' },
      { to: '/analise', icon: MessageSquareWarning, label: 'Análise Crítica' },
    ],
  },
  {
    label: 'Saída',
    items: [
      { to: '/relatorios', icon: FileText, label: 'Relatórios' },
      { to: '/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-sidebar-border', collapsed && 'justify-center px-0')}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-xs">PS</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">POA+SOCIAL</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">BID BR-L1597</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => {
                const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-primary text-white font-medium'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        collapsed && 'justify-center px-0'
                      )}
                      title={collapsed ? label : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sync status */}
      {!collapsed && (
        <div className="border-t border-sidebar-border py-1.5">
          <SyncStatusBadge />
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Footer */}
      <div className={cn('p-3 border-t border-sidebar-border', collapsed && 'flex justify-center')}>
        {!collapsed ? (
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">PN</div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">Paulo Nakamura</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">DPF / SMPG</p>
            </div>
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">PN</div>
        )}
      </div>
    </aside>
  )
}
