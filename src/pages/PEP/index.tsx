import { useState } from 'react'
import { ChevronRight, ChevronDown, FileSpreadsheet } from 'lucide-react'
import { usePEPEntries, usePEPVersoes } from '@/lib/queries/pep'
import { type PepEntry } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

const USD = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const PCT_DELTA = (atual: number, base: number) => {
  if (!base) return null
  const pct = ((atual - base) / base) * 100
  return { pct, positive: pct >= 0 }
}

function DeltaCell({ atual, base }: { atual: number; base: number }) {
  const delta = PCT_DELTA(atual, base)
  if (!delta || Math.abs(delta.pct) < 0.01) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn('text-xs font-medium', delta.positive ? 'text-red-600' : 'text-green-600')}>
      {delta.positive ? '+' : ''}{delta.pct.toFixed(1)}%
    </span>
  )
}

const REF_LABELS: Record<string, string> = {
  C: 'Componente', SC: 'Subcomponente', P: 'Produto', SP: 'Subproduto', PT: 'Plano de Trabalho',
}

const REF_INDENT: Record<string, number> = { C: 0, SC: 0, P: 1, SP: 2, PT: 3 }

export default function PEPPage() {
  const [versao, setVersao] = useState('v1')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const { data: versoes = [] } = usePEPVersoes()
  const { data: entries = [], isLoading } = usePEPEntries(versao)

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const isVisible = (row: PepEntry): boolean => {
    if (row.ref === 'C' || row.ref === 'SC') return true
    if (row.ref === 'P') {
      const cKey = `C:${row.comp}`
      return !collapsed.has(cKey)
    }
    if (row.ref === 'SP') {
      const cKey = `C:${row.comp}`
      const pKey = `P:${row.comp}:${row.prod}`
      return !collapsed.has(cKey) && !collapsed.has(pKey)
    }
    if (row.ref === 'PT') {
      const cKey = `C:${row.comp}`
      const pKey = `P:${row.comp}:${row.prod}`
      const spKey = `SP:${row.comp}:${row.prod}:${row.subp}`
      return !collapsed.has(cKey) && !collapsed.has(pKey) && !collapsed.has(spKey)
    }
    return true
  }

  const getKey = (row: PepEntry): string => {
    if (row.ref === 'C') return `C:${row.comp}`
    if (row.ref === 'P') return `P:${row.comp}:${row.prod}`
    if (row.ref === 'SP') return `SP:${row.comp}:${row.prod}:${row.subp}`
    return `PT:${row.comp}:${row.prod}:${row.subp}:${row.pct}`
  }

  const hasChildren = (row: PepEntry): boolean => {
    if (row.ref === 'PT') return false
    return entries.some(e => {
      if (row.ref === 'C') return e.comp === row.comp && (e.ref === 'P' || e.ref === 'SC')
      if (row.ref === 'P') return e.comp === row.comp && e.prod === row.prod && e.ref === 'SP'
      if (row.ref === 'SP') return e.comp === row.comp && e.prod === row.prod && e.subp === row.subp && e.ref === 'PT'
      return false
    })
  }

  const totals = entries.filter(e => e.ref === 'C').reduce(
    (acc, r) => ({ n: acc.n + r.n_atual, o: acc.o + r.o_atual, p: acc.p + r.p_atual, t: acc.t + r.t_base }),
    { n: 0, o: 0, p: 0, t: 0 }
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PEP RS — Plano de Execução</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Estrutura hierárquica C→P→SP→PT com valores BID e Local</p>
        </div>
        <div className="flex items-center gap-3">
          {versoes.length > 1 && (
            <Select value={versao} onValueChange={setVersao}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versoes.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total BID Atual', value: USD(totals.n), color: 'text-primary' },
          { label: 'Total Local Atual', value: USD(totals.o), color: 'text-accent' },
          { label: 'Total Atual', value: USD(totals.p), color: 'text-foreground' },
          { label: 'Total Base', value: USD(totals.t), color: 'text-muted-foreground' },
        ].map(item => (
          <Card key={item.label} className="p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={cn('text-lg font-bold tabular-nums mt-0.5', item.color)}>{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Tree table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Árvore Hierárquica</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2 animate-pulse">
              {[...Array(8)].map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FileSpreadsheet}
                title="Nenhum dado do PEP"
                description="Importe a planilha PEP RS em Configurações para visualizar os dados."
              />
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="gradient-bid text-white text-xs">
                    <th className="text-left px-4 py-3 w-8">#</th>
                    <th className="text-left px-4 py-3 min-w-[300px]">Descrição</th>
                    <th className="text-right px-4 py-3">BID Atual</th>
                    <th className="text-right px-4 py-3">Local Atual</th>
                    <th className="text-right px-4 py-3 font-semibold">Total Atual</th>
                    <th className="text-right px-4 py-3 text-white/70">Total Base</th>
                    <th className="text-right px-4 py-3 text-white/70">Δ%</th>
                    <th className="text-center px-4 py-3 text-white/70">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.filter(isVisible).map((row, idx) => {
                    const key = getKey(row)
                    const isCollapsed = collapsed.has(key)
                    const canCollapse = hasChildren(row)
                    const indent = REF_INDENT[row.ref] ?? 0
                    const isC = row.ref === 'C'
                    const isSC = row.ref === 'SC'
                    const isPT = row.ref === 'PT'

                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          'border-b border-border/50 hover:bg-muted/30 transition-colors',
                          isC && 'bg-primary/8 font-semibold',
                          isSC && 'bg-primary/4 text-muted-foreground',
                          isPT && 'text-muted-foreground',
                        )}
                      >
                        <td className="px-4 py-2 text-xs text-muted-foreground tabular-nums">{row.linha_excel ?? idx + 1}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1" style={{ paddingLeft: `${indent * 16}px` }}>
                            {canCollapse ? (
                              <button onClick={() => toggleCollapse(key)} className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0">
                                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            ) : (
                              <span className="w-4 flex-shrink-0" />
                            )}
                            <span className={cn('truncate', isC && 'text-primary')}>{row.descricao}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-xs">{row.n_atual ? USD(row.n_atual) : '—'}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-xs">{row.o_atual ? USD(row.o_atual) : '—'}</td>
                        <td className={cn('px-4 py-2 text-right tabular-nums text-xs', isC && 'font-semibold')}>{row.p_atual ? USD(row.p_atual) : '—'}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-xs text-muted-foreground">{row.t_base ? USD(row.t_base) : '—'}</td>
                        <td className="px-4 py-2 text-right"><DeltaCell atual={row.p_atual} base={row.t_base} /></td>
                        <td className="px-4 py-2 text-center">
                          <Badge variant="outline" className="text-[10px] px-1.5">{row.ref}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
