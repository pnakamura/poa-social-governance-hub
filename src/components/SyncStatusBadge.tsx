import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useUltimaSyncLog } from '@/hooks/useSyncLog'

function tempoRelativo(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export function SyncStatusBadge() {
  const { data: log, isLoading } = useUltimaSyncLog()

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-sidebar-foreground/40 px-3">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Sync...</span>
      </div>
    )
  }

  if (!log) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-sidebar-foreground/40 px-3">
        <WifiOff className="w-3 h-3" />
        <span>Sem sync</span>
      </div>
    )
  }

  const ok = log.status === 'ok'
  return (
    <div
      className={`flex items-center gap-1 text-[10px] px-3 ${ok ? 'text-green-500/80' : 'text-amber-500/80'}`}
      title={`${log.tabela_destino} · ${log.registros_inseridos + log.registros_atualizados} registros`}
    >
      {ok ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      <span>Sync {tempoRelativo(log.executado_em)}</span>
    </div>
  )
}
