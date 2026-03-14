import {
  LayoutDashboard, Building2, FileSpreadsheet, BarChart3,
  AlertTriangle, ListChecks, MessageSquareWarning,
  FileText, Settings, TrendingUp,
  CheckSquare, Calendar, AlertOctagon, ShoppingCart, Tag, Brain, Radar,
  ShieldCheck, LineChart, BookOpen, Inbox, Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
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
      { to: '/pep/analise', icon: LineChart, label: 'Análise PEP' },
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
      { to: '/demandas', icon: Inbox, label: 'Demandas & Ações' },
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
      { to: '/conhecimento', icon: BookOpen, label: 'Base de Conhecimento' },
      { to: '/configuracoes', icon: Settings, label: 'Configurações' },
      { to: '/admin', icon: Users, label: 'Admin' },
    ],
  },
]

/** Routes that can never be hidden */
export const PROTECTED_ROUTES = ['/', '/configuracoes', '/admin']
