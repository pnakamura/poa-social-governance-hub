import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { usePMROutputs, useUpdatePMROutput } from '@/lib/queries/pmr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const semaforo = (pct: number) => {
  if (pct >= 75) return 'bg-green-500'
  if (pct >= 40) return 'bg-yellow-400'
  return 'bg-red-500'
}

export default function PMROutputs() {
  const { data = [], isLoading } = usePMROutputs()
  const updateMutation = useUpdatePMROutput()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleSave = (item: typeof data[0]) => {
    const realizado = parseFloat(editValue.replace(',', '.'))
    if (isNaN(realizado)) {
      toast.error('Valor inválido')
      return
    }
    updateMutation.mutate(
      { id: item.id, realizado, meta_contrato: item.meta_contrato },
      {
        onSuccess: () => {
          toast.success('Realizado atualizado')
          setEditingId(null)
        },
        onError: (e) => toast.error(`Erro: ${e.message}`),
      }
    )
  }

  const groups = data.reduce<Record<string, typeof data>>((acc, item) => {
    const key = item.componente ?? 'Sem componente'
    acc[key] = [...(acc[key] ?? []), item]
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">PMR — Indicadores de Outputs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Realização física dos produtos e serviços. Clique no valor "Realizado" para editar.</p>
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
                    <th className="text-right px-4 py-2 w-28">Realizado</th>
                    <th className="text-right px-4 py-2 w-24">% Meta</th>
                    <th className="px-4 py-2 w-28">Progresso</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.codigo ?? '—'}</td>
                      <td className="px-4 py-3">{item.descricao}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.unidade ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.meta_contrato?.toLocaleString('pt-BR') ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {editingId === item.id ? (
                          <Input
                            autoFocus
                            className="w-24 h-7 text-right text-sm ml-auto"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSave(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSave(item)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                          />
                        ) : (
                          <button
                            className="tabular-nums font-medium hover:underline cursor-pointer"
                            onClick={() => {
                              setEditingId(item.id)
                              setEditValue(String(item.realizado))
                            }}
                          >
                            {item.realizado.toLocaleString('pt-BR')}
                          </button>
                        )}
                      </td>
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
                              className={cn('h-full rounded-full transition-all', semaforo(item.pct_realizado))}
                              style={{ width: `${Math.min(item.pct_realizado, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
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
