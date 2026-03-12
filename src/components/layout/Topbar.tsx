import { useLocation } from 'react-router-dom'
import { Bell, RefreshCw, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import { useUltimaSyncLog } from '@/hooks/useSyncLog'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const BREADCRUMBS: Record<string, string[]> = {
  '/': ['Dashboard'],
  '/programa': ['Programa'],
  '/pep': ['Financeiro', 'PEP RS'],
  '/pep/analise': ['Financeiro', 'PEP RS', 'Análise'],
  '/pep/auditoria': ['Financeiro', 'PEP RS', 'Auditoria M1'],
  '/pep/comparativo': ['Financeiro', 'PEP RS', 'Comparativo M2'],
  '/pmr/outputs': ['PMR', 'Outputs'],
  '/pmr/outcomes': ['PMR', 'Outcomes'],
  '/riscos': ['Riscos'],
  '/atividades': ['Atividades'],
  '/nao-objecoes': ['BID', 'Não-Objeções'],
  '/analise': ['Análise Crítica'],
  '/monitoramento': ['Análise', 'Monitoramento de Temas'],
  '/inteligencia': ['Análise', 'Inteligência Analítica'],
  '/marcos': ['Operacional', 'Timeline de Marcos'],
  '/pontos-atencao': ['Operacional', 'Pontos de Atenção'],
  '/aquisicoes': ['Aquisições / PMR', 'Plano de Aquisições'],
  '/temas': ['Operacional', 'Temas Estratégicos'],
  '/qualidade-dados': ['Análise', 'Qualidade de Dados'],
  '/relatorios': ['Saída', 'Relatórios'],
  '/configuracoes': ['Saída', 'Configurações'],
}

export function Topbar() {
  const location = useLocation()
  const qc = useQueryClient()
  const parts = BREADCRUMBS[location.pathname] ?? [location.pathname]
  const { data: syncLog } = useUltimaSyncLog()
  const syncLabel = syncLog?.executado_em
    ? formatDistanceToNow(new Date(syncLog.executado_em), { addSuffix: true, locale: ptBR })
    : null

  return (
    <header className="h-14 glass-topbar border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* Breadcrumb */}
      <nav aria-label="Navegação em breadcrumb" className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground font-medium gradient-bid-text">POA+SOCIAL</span>
        {parts.map((part, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-muted-foreground/40" aria-hidden="true" />
            <span className={i === parts.length - 1
              ? 'font-medium text-foreground'
              : 'text-muted-foreground hover:text-foreground transition-colors cursor-default'
            }>
              {part}
            </span>
          </span>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={() => qc.invalidateQueries()}
          title="Atualizar dados"
          aria-label="Atualizar dados"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg relative hover:bg-primary/10 hover:text-primary transition-colors"
          title="Notificações"
          aria-label="Notificações"
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
        </Button>
        {syncLabel && (
          <>
            <div className="h-5 w-px bg-border/60 mx-1" />
            <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap" title="Última importação de dados">
              sync {syncLabel}
            </span>
          </>
        )}
        <div className="h-5 w-px bg-border/60 mx-1" />
        <span className="text-xs text-muted-foreground/70 font-medium">
          {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </header>
  )
}
