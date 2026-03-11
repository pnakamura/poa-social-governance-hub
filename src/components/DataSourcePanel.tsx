import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUltimaSyncLog, useUltimaSyncLogByTabela } from '@/hooks/useSyncLog'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DataSourcePanelProps {
  source: string
  url: string
  tabela?: string
  versao?: string
  lastSync?: string
  editUrl?: string
  defaultOpen?: boolean
}

export function DataSourcePanel({
  source,
  url,
  tabela,
  versao,
  lastSync,
  editUrl,
  defaultOpen = false,
}: DataSourcePanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  // Se `tabela` foi fornecida, filtra o sync_log por ela; senão usa o último geral
  const { data: syncByTabela } = useUltimaSyncLogByTabela(tabela ?? '')
  const { data: syncGeral } = useUltimaSyncLog()

  const syncLog = tabela ? syncByTabela : syncGeral
  const syncTime = lastSync ?? syncLog?.executado_em

  const syncLabel = syncTime
    ? formatDistanceToNow(new Date(syncTime), { addSuffix: true, locale: ptBR })
    : null

  const neverImported = tabela && !syncByTabela
  const staleAlert = syncTime && differenceInDays(new Date(), new Date(syncTime)) > 7

  const registros = syncLog?.registros_inseridos != null
    ? `${syncLog.registros_inseridos + (syncLog.registros_atualizados ?? 0)} registros`
    : null

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <RefreshCw className="w-3 h-3 flex-shrink-0" />
          <span className="font-medium text-foreground truncate">{source}</span>

          {versao && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 flex-shrink-0">
              {versao}
            </Badge>
          )}

          {tabela && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 flex-shrink-0">
              {tabela}
            </Badge>
          )}

          {neverImported ? (
            <span className="flex items-center gap-1 text-destructive font-medium flex-shrink-0">
              <AlertTriangle className="w-3 h-3" />
              Dados nunca importados
            </span>
          ) : staleAlert ? (
            <Badge className="text-[10px] h-4 px-1.5 bg-yellow-500/20 text-yellow-700 border-yellow-400 flex-shrink-0">
              Desatualizado
            </Badge>
          ) : syncLabel ? (
            <span className="flex items-center gap-1 text-[10px] flex-shrink-0">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              sync {syncLabel}
            </span>
          ) : null}
        </div>
        {open ? <ChevronUp className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-3 pt-2 border-t border-border/40 space-y-2">
          {neverImported && (
            <div className="flex items-center gap-2 text-[11px] text-destructive bg-destructive/10 rounded px-2 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Dados nunca importados. Execute o script de importação para popular esta tabela.</span>
            </div>
          )}

          {staleAlert && !neverImported && (
            <div className="flex items-center gap-2 text-[11px] text-yellow-700 bg-yellow-500/10 rounded px-2 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Última importação há mais de 7 dias. Re-execute o script para atualizar os dados.</span>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" />
                Abrir no Google Drive
              </a>
            </Button>

            {editUrl && editUrl !== url && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" asChild>
                <a href={editUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" />
                  Editar
                </a>
              </Button>
            )}

            {syncTime && (
              <span className="text-[10px] text-muted-foreground">
                Última importação: {new Date(syncTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                {registros && <> · {registros}</>}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
