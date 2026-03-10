import { useLocation } from 'react-router-dom'
import { Bell, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import { useUltimaSyncLog } from '@/hooks/useSyncLog'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const BREADCRUMBS: Record<string, string[]> = {
  '/': ['Dashboard'],
  '/programa': ['Programa'],
  '/pep': ['Financeiro', 'PEP RS'],
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
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">POA+SOCIAL</span>
        {parts.map((part, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="text-muted-foreground">/</span>
            <span className={i === parts.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {part}
            </span>
          </span>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => qc.invalidateQueries()}
          title="Atualizar dados"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" title="Notificações">
          <Bell className="w-4 h-4" />
        </Button>
        {syncLabel && (
          <>
            <div className="h-5 w-px bg-border" />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap" title="Última importação de dados">
              sync {syncLabel}
            </span>
          </>
        )}
        <div className="ml-2 h-5 w-px bg-border" />
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </header>
  )
}
