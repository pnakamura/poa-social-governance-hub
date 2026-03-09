import { useState } from 'react'
import { ChevronRight, ChevronDown, FileSpreadsheet, ExternalLink } from 'lucide-react'
import { usePEPEntries, usePEPVersoes } from '@/lib/queries/pep'
import { usePMROutputs, usePMROutcomes } from '@/lib/queries/pmr'
import { useAquisicoes } from '@/hooks/useAquisicoes'
import { type PepEntry } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataSourcePanel } from '@/components/DataSourcePanel'
import { HelpTooltip } from '@/components/HelpTooltip'
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

// ─── Status Gantt colors ──────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  planejado:   'bg-gray-400',
  preparacao:  'bg-blue-500',
  publicado:   'bg-yellow-500',
  em_avaliacao:'bg-orange-400',
  adjudicado:  'bg-orange-500',
  contratado:  'bg-green-500',
  em_execucao: 'bg-emerald-500',
  concluido:   'bg-slate-500',
  cancelado:   'bg-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  planejado:   'Planejado',
  preparacao:  'Preparação',
  publicado:   'Publicado',
  em_avaliacao:'Em Avaliação',
  adjudicado:  'Adjudicado',
  contratado:  'Contratado',
  em_execucao: 'Em Execução',
  concluido:   'Concluído',
  cancelado:   'Cancelado',
}

// ─── Gantt Component ─────────────────────────────────────────────────────────
function GanttChart() {
  const { data: aquisicoes = [], isLoading } = useAquisicoes()
  const [filtroComp, setFiltroComp] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const comData = aquisicoes.filter(a => a.data_inicio_previsto && a.data_fim_previsto)

  if (isLoading) {
    return <div className="space-y-2 animate-pulse p-4">{[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}</div>
  }

  if (comData.length === 0) {
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="Nenhuma aquisição com datas previstas"
        description="Execute o script import_aquisicoes_bid.py para popular a tabela de aquisições."
      />
    )
  }

  const minDate = new Date(Math.min(...comData.map(a => new Date(a.data_inicio_previsto!).getTime())))
  const maxDate = new Date(Math.max(...comData.map(a => new Date(a.data_fim_previsto!).getTime())))
  const totalMs = maxDate.getTime() - minDate.getTime()

  // Gerar labels de meses para o eixo X
  const months: { label: string; pct: number }[] = []
  const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  while (cur <= maxDate) {
    const pct = ((cur.getTime() - minDate.getTime()) / totalMs) * 100
    months.push({ label: cur.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), pct })
    cur.setMonth(cur.getMonth() + 1)
  }

  // Agrupar por componente
  const componentes = [...new Set(comData.map(a => a.componente ?? 'Sem componente'))].sort()

  const filtered = comData.filter(a => {
    if (filtroComp !== 'todos' && a.componente !== filtroComp) return false
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filtroComp} onValueChange={setFiltroComp}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Componente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os componentes</SelectItem>
            {componentes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center">{filtered.length} aquisições</span>
      </div>

      {/* Gantt */}
      <div className="overflow-x-auto custom-scrollbar border rounded-lg">
        <div className="min-w-[700px]">
          {/* Eixo X — meses */}
          <div className="relative h-7 border-b bg-muted/30">
            <div className="absolute inset-0 ml-[200px]">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute text-[10px] text-muted-foreground top-1"
                  style={{ left: `${m.pct}%` }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Linhas por componente */}
          {componentes.filter(c => filtroComp === 'todos' || c === filtroComp).map(comp => {
            const rows = filtered.filter(a => (a.componente ?? 'Sem componente') === comp)
            if (rows.length === 0) return null
            return (
              <div key={comp}>
                <div className="px-3 py-1 bg-primary/5 border-b text-[11px] font-semibold text-primary">
                  {comp}
                </div>
                {rows.map(a => {
                  const start = new Date(a.data_inicio_previsto!).getTime()
                  const end   = new Date(a.data_fim_previsto!).getTime()
                  const left  = ((start - minDate.getTime()) / totalMs) * 100
                  const width = Math.max(((end - start) / totalMs) * 100, 0.5)
                  const color = STATUS_COLORS[a.status] ?? 'bg-gray-400'
                  const label = a.titulo.slice(0, 22)
                  const tooltip = `${a.titulo}\nStatus: ${STATUS_LABELS[a.status]}\nSecretaria: ${a.secretaria}\n${a.data_inicio_previsto} → ${a.data_fim_previsto}${a.valor_usd ? `\nUS$ ${a.valor_usd.toLocaleString('pt-BR')}` : ''}`

                  return (
                    <div key={a.id} className="flex items-center border-b border-border/30 hover:bg-muted/20 transition-colors" style={{ height: '32px' }}>
                      <div className="w-[200px] flex-shrink-0 px-3 text-[11px] text-muted-foreground truncate" title={a.titulo}>
                        {label}
                      </div>
                      <div className="flex-1 relative">
                        <div
                          className={cn('absolute rounded-sm h-5 top-1/2 -translate-y-1/2 opacity-80 cursor-help', color)}
                          style={{ left: `${left}%`, width: `${width}%`, minWidth: '4px' }}
                          title={tooltip}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-sm', STATUS_COLORS[k])} />
            <span className="text-[11px] text-muted-foreground">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tabela de aquisições ─────────────────────────────────────────────────────
function AquisoesTabela() {
  const [filtroSec, setFiltroSec] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const { data: all = [] } = useAquisicoes()

  const secretarias = [...new Set(all.map(a => a.secretaria))].sort()
  const filtered = all.filter(a => {
    if (filtroSec !== 'todos' && a.secretaria !== filtroSec) return false
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false
    return true
  })

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Select value={filtroSec} onValueChange={setFiltroSec}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Secretaria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {secretarias.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center">{filtered.length} registros</span>
      </div>
      <div className="overflow-x-auto custom-scrollbar border rounded-lg">
        <table className="w-full text-xs">
          <thead>
            <tr className="gradient-bid text-white">
              <th className="text-left px-3 py-2">ID</th>
              <th className="text-left px-3 py-2 min-w-[200px]">Título</th>
              <th className="text-left px-3 py-2">Secretaria</th>
              <th className="text-left px-3 py-2">Componente</th>
              <th className="text-right px-3 py-2">Valor USD</th>
              <th className="text-center px-3 py-2">Status</th>
              <th className="text-center px-3 py-2">Início</th>
              <th className="text-center px-3 py-2">Término</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-b border-border/30 hover:bg-muted/20">
                <td className="px-3 py-1.5 font-mono text-muted-foreground">{a.id_processo ?? '—'}</td>
                <td className="px-3 py-1.5 max-w-[220px] truncate" title={a.titulo}>{a.titulo}</td>
                <td className="px-3 py-1.5">{a.secretaria}</td>
                <td className="px-3 py-1.5">{a.componente ?? '—'}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{a.valor_usd ? USD(a.valor_usd) : '—'}</td>
                <td className="px-3 py-1.5 text-center">
                  <Badge className={cn('text-[10px] px-1.5 text-white', STATUS_COLORS[a.status] ?? 'bg-gray-400')}>
                    {STATUS_LABELS[a.status] ?? a.status}
                  </Badge>
                </td>
                <td className="px-3 py-1.5 text-center text-muted-foreground">{a.data_inicio_previsto ?? '—'}</td>
                <td className="px-3 py-1.5 text-center text-muted-foreground">{a.data_fim_previsto ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma aquisição encontrada com os filtros selecionados.</div>
        )}
      </div>
    </div>
  )
}

// ─── Aba PMR ─────────────────────────────────────────────────────────────────
function PMRTab() {
  const { data: outputs = [], isLoading: loadingOut } = usePMROutputs()
  const { data: outcomes = [], isLoading: loadingOc } = usePMROutcomes()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          PMR Outputs — Indicadores Físicos
          <HelpTooltip id="pmr-outputs" />
        </h3>
        {loadingOut ? (
          <div className="space-y-1 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="gradient-bid text-white">
                  <th className="text-left px-3 py-2">Código</th>
                  <th className="text-left px-3 py-2 min-w-[200px]">Indicador</th>
                  <th className="text-right px-3 py-2">Realizado</th>
                  <th className="text-right px-3 py-2">Meta</th>
                  <th className="text-right px-3 py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {outputs.map(o => {
                  const pct = o.meta && o.meta > 0 ? Math.round((o.realizado / o.meta) * 100) : null
                  return (
                    <tr key={o.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="px-3 py-1.5 font-mono text-muted-foreground">{o.codigo}</td>
                      <td className="px-3 py-1.5 max-w-[220px] truncate" title={o.indicador}>{o.indicador}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{o.realizado ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{o.meta ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right">
                        {pct !== null && (
                          <span className={cn('font-medium', pct >= 100 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600')}>
                            {pct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          PMR Outcomes — Indicadores de Impacto
          <HelpTooltip id="pmr-outcomes" />
        </h3>
        {loadingOc ? (
          <div className="space-y-1 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="gradient-bid text-white">
                  <th className="text-left px-3 py-2">Código</th>
                  <th className="text-left px-3 py-2 min-w-[200px]">Indicador</th>
                  <th className="text-right px-3 py-2">Realizado</th>
                  <th className="text-right px-3 py-2">Meta</th>
                  <th className="text-right px-3 py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {outcomes.map(o => {
                  const pct = o.meta && o.meta > 0 ? Math.round((o.realizado / o.meta) * 100) : null
                  return (
                    <tr key={o.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="px-3 py-1.5 font-mono text-muted-foreground">{o.codigo}</td>
                      <td className="px-3 py-1.5 max-w-[220px] truncate" title={o.indicador}>{o.indicador}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{o.realizado ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{o.meta ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right">
                        {pct !== null && (
                          <span className={cn('font-medium', pct >= 100 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600')}>
                            {pct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PEPPage() {
  const [versao, setVersao] = useState('v1')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const { data: versoes = [] } = usePEPVersoes()
  const { data: entries = [], isLoading } = usePEPEntries(versao)
  const { data: aquisicoes = [] } = useAquisicoes()

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const isVisible = (row: PepEntry): boolean => {
    if (row.ref === 'C' || row.ref === 'SC') return true
    if (row.ref === 'P') return !collapsed.has(`C:${row.comp}`)
    if (row.ref === 'SP') return !collapsed.has(`C:${row.comp}`) && !collapsed.has(`P:${row.comp}:${row.prod}`)
    if (row.ref === 'PT') {
      return !collapsed.has(`C:${row.comp}`) && !collapsed.has(`P:${row.comp}:${row.prod}`) && !collapsed.has(`SP:${row.comp}:${row.prod}:${row.subp}`)
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

  // KPIs Tático
  const totalAq = aquisicoes.length
  const emExecucao = aquisicoes.filter(a => a.status === 'em_execucao').length
  const concluidas = aquisicoes.filter(a => a.status === 'concluido').length
  const valorTotal = aquisicoes.reduce((s, a) => s + (a.valor_usd ?? 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            PEP RS — Plano de Execução
            <HelpTooltip id="pep-hierarquia" />
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Estrutura hierárquica C→P→SP→PT com valores BID e Local</p>
        </div>
      </div>

      <Tabs defaultValue="orcamento">
        <TabsList>
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
          <TabsTrigger value="tatico">
            Tático — Aquisições
            <HelpTooltip id="pep-tatico" />
          </TabsTrigger>
          <TabsTrigger value="pmr">PMR</TabsTrigger>
        </TabsList>

        {/* ─── Aba Orçamento ─────────────────────────────────────────────── */}
        <TabsContent value="orcamento" className="space-y-4 mt-4">
          <DataSourcePanel
            source="Google Drive — PEP RS v2"
            url="https://drive.google.com/drive/folders/1NQKPrkIWBUBcR0tQUU3vwOKDc5_YkuYl"
          />

          {versoes.length > 1 && (
            <div className="flex justify-end">
              <Select value={versao} onValueChange={setVersao}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versoes.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

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
        </TabsContent>

        {/* ─── Aba Tático ────────────────────────────────────────────────── */}
        <TabsContent value="tatico" className="space-y-5 mt-4">
          <DataSourcePanel
            source="Google Sheets — DPF aba BID"
            url="https://docs.google.com/spreadsheets/d/1gaeY_iQFwYBB-byKFETBz54FcfRVm5mFvuMLfIR7E9Y/edit#gid=0"
          />

          {/* KPI strip */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Aquisições', value: String(totalAq) },
              { label: 'Valor Total (US$M)', value: `US$ ${(valorTotal / 1e6).toFixed(1)}M` },
              { label: 'Em Execução', value: String(emExecucao) },
              { label: 'Concluídas', value: String(concluidas) },
            ].map(item => (
              <Card key={item.label} className="p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold tabular-nums mt-0.5">{item.value}</p>
              </Card>
            ))}
          </div>

          {/* Gantt */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                Cronograma Gantt — Aquisições BID
                <HelpTooltip id="pep-tatico" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GanttChart />
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lista de Aquisições</CardTitle>
            </CardHeader>
            <CardContent>
              <AquisoesTabela />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Aba PMR ───────────────────────────────────────────────────── */}
        <TabsContent value="pmr" className="mt-4">
          <DataSourcePanel
            source="Google Sheets PMR — abas PMR-Outputs e PMR-Outcomes"
            url="https://docs.google.com/spreadsheets/d/1ZFQtIZs-pZT1jvubrx9aLk6kO7S53C02"
          />
          <div className="mt-4">
            <PMRTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
