import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUltimaSyncLog } from '@/hooks/useSyncLog'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DataSourcePanelProps {
  source: string
  url: string
  tabela?: string
  lastSync?: string
  editUrl?: string
  defaultOpen?: boolean
}

export function DataSourcePanel({
  source,
  url,
  tabela,
  lastSync,
  editUrl,
  defaultOpen = false,
}: DataSourcePanelProps) {
  const [open, setOpen] = useState(defaultOpen)
  const { data: syncLog } = useUltimaSyncLog()

  const syncTime = lastSync ?? syncLog?.executado_em
  const syncLabel = syncTime
    ? formatDistanceToNow(new Date(syncTime), { addSuffix: true, locale: ptBR })
    : null

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3 h-3 flex-shrink-0" />
          <span className="font-medium text-foreground">{source}</span>
          {tabela && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{tabela}</Badge>
          )}
          {syncLabel && (
            <span className="text-[10px]">· sync {syncLabel}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="px-4 pb-3 pt-1 flex items-center gap-3 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
              Abrir fonte
            </a>
          </Button>
          {editUrl && editUrl !== url && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              asChild
            >
              <a href={editUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" />
                Editar
              </a>
            </Button>
          )}
          <span className="text-[10px] text-muted-foreground truncate flex-1">{url}</span>
        </div>
      )}
    </div>
  )
}
