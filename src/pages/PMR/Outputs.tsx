import { BarChart3 } from 'lucide-react'
import { usePMROutputs } from '@/lib/queries/pmr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

const semaforo = (pct: number) => {
  if (pct >= 75) return { color: 'bg-green-500', label: '🟢' }
  if (pct >= 40) return { color: 'bg-yellow-400', label: '🟡' }
  return { color: 'bg-red-500', label: '🔴' }
}

export default function PMROutputs() {
  const { data = [], isLoading } = usePMROutputs()

  // Group by componente
  const groups = data.reduce<Record<string, typeof data>>((acc, item) => {
    const key = item.componente ?? 'Sem componente'
    acc[key] = [...(acc[key] ?? []), item]
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">PMR — Indicadores de Outputs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Realização física dos produtos e serviços</p>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-lg" />)}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Nenhum indicador de Output"
          description="Importe o PMR-Outputs da planilha PEP em Configurações."
        />
      ) : (
        Object.entries(groups).map(([comp, items]) => (
          <Card key={comp}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-primary">{comp}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs text-muted-foreground">
                    <th className="text-left px-4 py-2 w-20">Código</th>
                    <th className="text-left px-4 py-2">Indicador</th>
                    <th className="text-left px-4 py-2 w-24">Unidade</th>
                    <th className="text-right px-4 py-2 w-24">Meta</th>
                    <th className="text-right px-4 py-2 w-24">Realizado</th>
                    <th className="text-right px-4 py-2 w-24">% Meta</th>
                    <th className="px-4 py-2 w-28">Progresso</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const s = semaforo(item.pct_realizado)
                    return (
                      <tr key={item.id} className="border-t border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.codigo ?? '—'}</td>
                        <td className="px-4 py-3">{item.descricao}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.unidade ?? '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{item.meta_contrato?.toLocaleString('pt-BR') ?? '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{item.realizado.toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          <span className={cn(
                            item.pct_realizado >= 75 ? 'text-green-600' :
                            item.pct_realizado >= 40 ? 'text-yellow-600' : 'text-red-600'
                          )}>
                            {item.pct_realizado.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', s.color)}
                                style={{ width: `${Math.min(item.pct_realizado, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
