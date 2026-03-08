import { TrendingUp } from 'lucide-react'
import { usePMROutcomes } from '@/lib/queries/pmr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

const semaforo = (pct: number) => {
  if (pct >= 75) return 'bg-green-500'
  if (pct >= 40) return 'bg-yellow-400'
  return 'bg-red-500'
}

export default function PMROutcomes() {
  const { data = [], isLoading } = usePMROutcomes()

  const groups = data.reduce<Record<string, typeof data>>((acc, item) => {
    const key = item.componente ?? 'Sem componente'
    acc[key] = [...(acc[key] ?? []), item]
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">PMR — Indicadores de Outcomes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Impactos e resultados do programa</p>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-lg" />)}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Nenhum indicador de Outcome"
          description="Importe o PMR-Outcomes da planilha PEP em Configurações."
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
                    <th className="text-right px-4 py-2 w-28">Linha base</th>
                    <th className="text-right px-4 py-2 w-28">Meta</th>
                    <th className="text-right px-4 py-2 w-24">Realizado</th>
                    <th className="text-right px-4 py-2 w-24">% Meta</th>
                    <th className="text-left px-4 py-2 w-32">Fonte</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.codigo ?? '—'}</td>
                      <td className="px-4 py-3">{item.descricao}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.unidade ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{item.linha_base?.toLocaleString('pt-BR') ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.meta_contrato?.toLocaleString('pt-BR') ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{item.realizado.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', semaforo(item.pct_realizado))} style={{ width: `${Math.min(item.pct_realizado, 100)}%` }} />
                          </div>
                          <span className={cn('text-xs font-medium w-10 text-right tabular-nums',
                            item.pct_realizado >= 75 ? 'text-green-600' :
                            item.pct_realizado >= 40 ? 'text-yellow-600' : 'text-red-600'
                          )}>
                            {item.pct_realizado.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[8rem]">{item.fonte_dados ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
