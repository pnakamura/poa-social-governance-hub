import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, TrendingUp, TrendingDown, Calendar, DollarSign,
  ShoppingCart, Activity, ArrowRight, Shield, Ban, Info, Filter, BarChart3,
} from 'lucide-react'
import { usePEPEntries } from '@/lib/queries/pep'
import { usePMROutputs } from '@/lib/queries/pmr'
import { useAllPepGestao, useAllPepImpedimentos, useAllPepRiscos } from '@/lib/queries/pep-gestao'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts'

// ─── Formatadores ─────────────────────────────────────────────────────────────
const fUSD = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
const fM = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}k` : fUSD(v)

const COLORS = [
  'hsl(213 73% 24%)', 'hsl(142 71% 45%)', 'hsl(43 96% 56%)', 'hsl(0 84% 60%)',
  'hsl(211 60% 44%)', 'hsl(330 80% 60%)', 'hsl(190 80% 45%)', 'hsl(80 60% 50%)',
]

const METODO_DESC: Record<string, string> = {
  'CD': 'Consulta Direta', '3CV': '3 Currículos', 'SN': 'Seleção Nacional',
  'SI': 'Seleção Internacional', 'LPN': 'Licitação Pública Nacional',
  'LPI': 'Licitação Pública Internacional', 'CS': 'Seleção Baseada em Custo', 'QCBS': 'Custo e Qualidade',
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function SectionHeader({ title, sub, tip }: { title: string; sub?: string; tip?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {tip && <InfoTip text={tip} />}
      </div>
      {sub && <p className="text-[11px] text-muted-foreground hidden sm:block">— {sub}</p>}
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function KPI({ label, value, sub, variant = 'default', icon: Icon, to }: {
  label: string; value: string; sub?: string
  variant?: 'default' | 'alert' | 'ok' | 'warn'
  icon?: React.ComponentType<{ className?: string }>; to?: string
}) {
  const border = {
    default: '', alert: 'border-destructive/30 bg-destructive/5',
    ok: 'border-green-200 bg-green-50/50 dark:bg-green-900/10',
    warn: 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10',
  }
  const textColor = {
    default: 'text-foreground', alert: 'text-destructive',
    ok: 'text-green-600 dark:text-green-400', warn: 'text-yellow-600 dark:text-yellow-400',
  }
  return (
    <Card className={cn('p-4 hover:shadow-md transition-shadow', border[variant])}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          <p className={cn('text-2xl font-bold tabular-nums mt-0.5 leading-tight', textColor[variant])}>{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-muted/60')}><Icon className="w-4 h-4 text-muted-foreground" /></div>}
          {to && <Link to={to} className="text-[10px] text-primary hover:underline flex items-center gap-0.5"><ArrowRight className="w-2.5 h-2.5" /></Link>}
        </div>
      </div>
    </Card>
  )
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
}

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────
function ChartTip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      {label && <p className="font-medium text-popover-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: p.color }} />
          {formatter ? formatter(p.value, p.name, p) : `${p.name}: ${typeof p.value === 'number' ? p.value.toLocaleString('pt-BR') : p.value}`}
        </p>
      ))}
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function PEPAnalisePage() {
  const { data: entries = [], isLoading: loadingEntries } = usePEPEntries('v2')
  const { data: outputs = [], isLoading: loadingOutputs } = usePMROutputs()
  const { data: allGestao = [], isLoading: loadingGestao } = useAllPepGestao()
  const { data: allImpedimentos = [], isLoading: loadingImp } = useAllPepImpedimentos()
  const { data: allRiscos = [], isLoading: loadingRiscos } = useAllPepRiscos()

  // Filters
  const [filterComp, setFilterComp] = useState<string>('all')
  const [filterSecretaria, setFilterSecretaria] = useState<string>('all')
  const [filterLote, setFilterLote] = useState<string>('all')

  const isLoading = loadingEntries || loadingOutputs || loadingGestao || loadingImp || loadingRiscos

  // Distinct filter options
  const filterOptions = useMemo(() => {
    const comps = [...new Set(entries.filter(e => e.ref === 'C').map(e => e.comp).filter(Boolean))].sort((a, b) => (a ?? 0) - (b ?? 0))
    const secs = [...new Set(entries.map(e => e.secretaria).filter(Boolean) as string[])].sort()
    const lotes = [...new Set(entries.map(e => e.lote).filter(Boolean) as string[])].sort()
    return { comps, secs, lotes }
  }, [entries])

  // Filtered entries
  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (filterComp !== 'all' && e.comp !== Number(filterComp)) return false
      if (filterSecretaria !== 'all' && e.secretaria !== filterSecretaria) return false
      if (filterLote !== 'all' && e.lote !== filterLote) return false
      return true
    })
  }, [entries, filterComp, filterSecretaria, filterLote])

  // Gestão map
  const gestaoMap = useMemo(() => {
    const m = new Map<string, typeof allGestao[0]>()
    allGestao.forEach(g => m.set(g.pep_entry_id, g))
    return m
  }, [allGestao])

  // ─── Analytics derivations ────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const pt = filtered.filter(e => e.ref === 'PT')
    const comp = filtered.filter(e => e.ref === 'C')
    const ptIds = new Set(pt.map(e => e.id))

    // KPIs
    const totalPT = pt.length
    const ptCom2025 = pt.filter(e => (e.fisica_2025 ?? 0) > 0).length
    const ptSemMetodo = pt.filter(e => !e.metodo_aquisicao?.trim()).length
    const totalAtual = comp.reduce((s, e) => s + (e.p_atual ?? 0), 0)
    const totalBase = comp.reduce((s, e) => s + (e.t_base ?? 0), 0)
    const variacaoTotal = totalBase > 0 ? ((totalAtual - totalBase) / totalBase) * 100 : 0

    // Impedimentos & riscos filtered
    const impAbertos = allImpedimentos.filter(i => !i.resolvido && ptIds.has(i.pep_entry_id))
    const riscosAtivos = allRiscos.filter(r => r.status === 'Ativo' && ptIds.has(r.pep_entry_id))

    // 1. Entregas físicas por ano
    const entregasPorAno = [
      { ano: '2025', count: pt.filter(e => (e.fisica_2025 ?? 0) > 0).length },
      { ano: '2026', count: pt.filter(e => (e.fisica_2026 ?? 0) > 0).length },
      { ano: '2027', count: pt.filter(e => (e.fisica_2027 ?? 0) > 0).length },
      { ano: '2028', count: pt.filter(e => (e.fisica_2028 ?? 0) > 0).length },
      { ano: '2029', count: pt.filter(e => (e.fisica_2029 ?? 0) > 0).length },
      { ano: 'EOP', count: pt.filter(e => (e.fisica_eop ?? 0) > 0).length },
    ]

    // 2. Variação por componente
    const variacaoComp = comp.map(c => {
      const label = (c.descricao ?? '').replace(/^C\d+\s*[-–]\s*/i, '').substring(0, 22)
      const delta = c.t_base > 0 ? ((c.p_atual - c.t_base) / c.t_base) * 100 : 0
      return { label, delta: +delta.toFixed(1), atual: c.p_atual, base: c.t_base, comp: c.comp }
    })

    // 3. Pipeline por método
    const metodoCounts: Record<string, number> = {}
    const metodoValores: Record<string, number> = {}
    pt.forEach(e => {
      const m = e.metodo_aquisicao?.trim() || 'Não definido'
      metodoCounts[m] = (metodoCounts[m] ?? 0) + 1
      metodoValores[m] = (metodoValores[m] ?? 0) + (e.p_atual ?? 0)
    })
    const metodos = Object.entries(metodoCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([metodo, count]) => ({
        metodo: METODO_DESC[metodo] ?? metodo, metodoCode: metodo,
        count, valor: metodoValores[metodo] ?? 0,
      }))

    // 4. Tipo aquisição
    const tipoCounts: Record<string, { count: number; valor: number }> = {}
    pt.forEach(e => {
      const t = e.tipo_aquisicao?.trim() || 'Não definido'
      tipoCounts[t] = tipoCounts[t] ?? { count: 0, valor: 0 }
      tipoCounts[t].count++
      tipoCounts[t].valor += e.p_atual ?? 0
    })
    const tipos = Object.entries(tipoCounts).sort((a, b) => b[1].count - a[1].count)
      .map(([tipo, { count, valor }]) => ({ tipo, count, valor }))

    // 5. Desembolso
    const anos = ['2025', '2026', '2027', '2028', '2029'] as const
    let acumulado = 0
    const desembolsoAnual = anos.map(ano => {
      const key = `desembolso_${ano}` as keyof typeof pt[0]
      const total = pt.reduce((s, e) => s + ((e[key] as number | null) ?? 0), 0)
      acumulado += total
      return { ano, previsto: total, acumulado }
    })
    const totalDesembolso2025 = desembolsoAnual[0]?.previsto ?? 0

    // 6. PTs críticos 2025
    const criticos2025 = pt.filter(e => (e.fisica_2025 ?? 0) > 0)
      .sort((a, b) => (b.p_atual ?? 0) - (a.p_atual ?? 0)).slice(0, 12)

    // 7. PEP×PMR
    const pepPmrRefs = new Set(pt.flatMap(e => (e.pmr_ref ?? '').split(',').map(r => r.trim()).filter(Boolean)))
    const outputsComWBS = outputs.filter(o => o.codigo && pepPmrRefs.has(o.codigo))
    const outputsSemWBS = outputs.filter(o => !o.codigo || !pepPmrRefs.has(o.codigo))

    // 8. Top PTs
    const topPT = [...pt].sort((a, b) => (b.p_atual ?? 0) - (a.p_atual ?? 0)).slice(0, 8)

    // 9. Saúde da execução por componente
    const saudeComp = comp.map(c => {
      const compPTs = pt.filter(e => e.comp === c.comp)
      const compPTIds = new Set(compPTs.map(e => e.id))
      const gestaoItems = compPTs.map(e => gestaoMap.get(e.id)).filter(Boolean) as typeof allGestao
      const avgProg = gestaoItems.length > 0 ? gestaoItems.reduce((s, g) => s + g.progresso, 0) / gestaoItems.length : 0
      const impCount = allImpedimentos.filter(i => !i.resolvido && compPTIds.has(i.pep_entry_id)).length
      const riskCount = allRiscos.filter(r => r.status === 'Ativo' && compPTIds.has(r.pep_entry_id)).length
      return {
        label: `C${c.comp}`,
        progresso: +avgProg.toFixed(0),
        impedimentos: impCount,
        riscos: riskCount,
        pts: compPTs.length,
      }
    }).filter(c => c.pts > 0)

    return {
      entregasPorAno, variacaoComp, metodos, tipos, desembolsoAnual,
      criticos2025, outputsComWBS, outputsSemWBS, topPT, saudeComp,
      totalPT, ptCom2025, ptSemMetodo, totalAtual, totalBase, variacaoTotal,
      totalDesembolso2025, impAbertos, riscosAtivos,
    }
  }, [filtered, outputs, allGestao, allImpedimentos, allRiscos, gestaoMap])

  const activeFilters = [filterComp, filterSecretaria, filterLote].filter(f => f !== 'all').length

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Análise PEP — Dashboard Analítico
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dados consolidados do PEP v2 · {analytics.totalPT} Planos de Trabalho
            {activeFilters > 0 && <Badge variant="secondary" className="ml-2 text-[10px]">{activeFilters} filtro(s)</Badge>}
          </p>
        </div>
      </div>

      {/* ─── Filtros Globais ───────────────────────────────────────────────── */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" /> Filtros:
          </div>
          <Select value={filterComp} onValueChange={setFilterComp}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Componente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos componentes</SelectItem>
              {filterOptions.comps.map(c => <SelectItem key={c} value={String(c)}>C{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSecretaria} onValueChange={setFilterSecretaria}>
            <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Secretaria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas secretarias</SelectItem>
              {filterOptions.secs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLote} onValueChange={setFilterLote}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Lote" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos lotes</SelectItem>
              {filterOptions.lotes.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <button onClick={() => { setFilterComp('all'); setFilterSecretaria('all'); setFilterLote('all') }}
              className="text-[11px] text-destructive hover:underline">Limpar</button>
          )}
          <span className="text-[11px] text-muted-foreground ml-auto">{filtered.length} itens</span>
        </div>
      </Card>

      {isLoading ? <SectionSkeleton rows={4} /> : (
        <>
          {/* ─── KPIs Executivos ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPI label="Planos de Trabalho" value={String(analytics.totalPT)} sub="Nível PT" icon={Activity} to="/pep" />
            <KPI label="Entregas 2025" value={String(analytics.ptCom2025)}
              sub={`${analytics.totalPT > 0 ? ((analytics.ptCom2025 / analytics.totalPT) * 100).toFixed(0) : 0}% do total`}
              variant={analytics.ptCom2025 > 15 ? 'alert' : 'warn'} icon={Calendar} />
            <KPI label="Variação vs Base"
              value={`${analytics.variacaoTotal > 0 ? '+' : ''}${analytics.variacaoTotal.toFixed(1)}%`}
              sub={`${fM(analytics.totalBase)} → ${fM(analytics.totalAtual)}`}
              variant={Math.abs(analytics.variacaoTotal) < 5 ? 'ok' : analytics.variacaoTotal > 10 ? 'alert' : 'warn'}
              icon={analytics.variacaoTotal > 0 ? TrendingUp : TrendingDown} />
            <KPI label="Desembolso 2025" value={fM(analytics.totalDesembolso2025)}
              sub="Previsto para o ano" icon={DollarSign} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPI label="PTs sem método BID" value={String(analytics.ptSemMetodo)}
              sub="Método de aquisição indefinido" variant={analytics.ptSemMetodo > 5 ? 'alert' : 'ok'} icon={AlertTriangle} />
            <KPI label="Impedimentos abertos" value={String(analytics.impAbertos.length)}
              sub="Bloqueios não resolvidos" variant={analytics.impAbertos.length > 3 ? 'alert' : analytics.impAbertos.length > 0 ? 'warn' : 'ok'} icon={Ban} />
            <KPI label="Riscos ativos" value={String(analytics.riscosAtivos.length)}
              sub="Riscos operacionais PEP" variant={analytics.riscosAtivos.length > 5 ? 'alert' : analytics.riscosAtivos.length > 0 ? 'warn' : 'ok'} icon={Shield} />
            <KPI label="PMR mapeados" value={`${analytics.outputsComWBS.length}/${analytics.outputsComWBS.length + analytics.outputsSemWBS.length}`}
              sub="Outputs com WBS PEP" variant={analytics.outputsSemWBS.length > 3 ? 'warn' : 'ok'} icon={Activity} to="/pmr/outputs" />
          </div>

          {/* ─── Entregas + Desembolso ───────────────────────────────────── */}
          <SectionHeader title="Entregas Físicas e Desembolso"
            tip="Distribuição anual de PTs com entrega física prevista e curva de desembolso acumulada em US$. O ano 2025 é destacado como crítico." />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Entregas Físicas por Ano</CardTitle>
                <p className="text-[11px] text-muted-foreground">PTs com entrega prevista</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.entregasPorAno}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RTooltip content={<ChartTip formatter={(v: number) => `${v} PTs`} />} />
                    <Bar dataKey="count" name="PTs" radius={[4, 4, 0, 0]}>
                      {analytics.entregasPorAno.map((entry, i) => (
                        <Cell key={i}
                          fill={entry.ano === '2025' ? 'hsl(0 84% 60%)' : entry.ano === 'EOP' ? 'hsl(215 16% 47%)' : 'hsl(213 73% 24%)'}
                          fillOpacity={entry.ano === '2025' ? 1 : 0.75} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Curva de Desembolso (US$)</CardTitle>
                <p className="text-[11px] text-muted-foreground">Fluxo anual + acumulado</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={analytics.desembolsoAnual}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tickFormatter={v => `$${(Number(v) / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} width={46} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={v => `$${(Number(v) / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} width={46} />
                    <RTooltip content={<ChartTip formatter={(v: number, name: string) => `${name === 'previsto' ? 'Anual' : 'Acumulado'}: ${fM(v)}`} />} />
                    <Area yAxisId="left" type="monotone" dataKey="previsto" name="previsto" stroke="hsl(213 73% 24%)" fill="hsl(213 73% 24%)" fillOpacity={0.2} strokeWidth={2} />
                    <Area yAxisId="right" type="monotone" dataKey="acumulado" name="acumulado" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45%)" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ─── Variação + Pipeline ─────────────────────────────────────── */}
          <SectionHeader title="Orçamento e Aquisições"
            tip="Variação % do valor atual vs linha base por componente. Valores positivos indicam aumento de custo. O pipeline mostra a distribuição de PTs por método de aquisição do BID." />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Variação Orçamentária vs Base (%)</CardTitle>
                <p className="text-[11px] text-muted-foreground">Delta por componente</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.variacaoComp} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={100} />
                    <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
                    <RTooltip content={<ChartTip formatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} />} />
                    <Bar dataKey="delta" name="Δ%" radius={[0, 4, 4, 0]}>
                      {analytics.variacaoComp.map((entry, i) => (
                        <Cell key={i} fill={entry.delta > 0 ? 'hsl(0 84% 60%)' : entry.delta < 0 ? 'hsl(142 71% 45%)' : 'hsl(215 16% 47%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pipeline por Método BID</CardTitle>
                <p className="text-[11px] text-muted-foreground">PTs por método de seleção</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.metodos.slice(0, 7)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="metodoCode" tick={{ fontSize: 10 }} width={60} />
                    <RTooltip content={<ChartTip formatter={(v: number, _: string, p: any) => `${v} PTs · ${fM(p?.payload?.valor ?? 0)} — ${p?.payload?.metodo ?? ''}`} />} />
                    <Bar dataKey="count" name="PTs" radius={[0, 4, 4, 0]}>
                      {analytics.metodos.slice(0, 7).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ─── Tipos + Concentração ────────────────────────────────────── */}
          <SectionHeader title="Distribuição e Concentração"
            tip="Donut mostra a distribuição de PTs por tipo de aquisição. A lista rankeada mostra os 8 maiores PTs por valor, permitindo identificar concentração de recursos." />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tipo de Aquisição</CardTitle>
                <p className="text-[11px] text-muted-foreground">Distribuição dos PTs</p>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={analytics.tipos.slice(0, 6)} dataKey="count" nameKey="tipo" innerRadius={40} outerRadius={75} paddingAngle={2}>
                      {analytics.tipos.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RTooltip content={<ChartTip formatter={(v: number, _: string, p: any) => `${v} PTs · ${fM(p?.payload?.valor ?? 0)}`} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {analytics.tipos.slice(0, 6).map((t, i) => (
                    <div key={t.tipo} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="truncate text-muted-foreground flex-1">{t.tipo}</span>
                      <span className="font-medium tabular-nums">{t.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top 8 PTs por Valor</CardTitle>
                <p className="text-[11px] text-muted-foreground">Concentração financeira</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {analytics.topPT.map((e, i) => {
                    const pct = analytics.totalAtual > 0 ? ((e.p_atual ?? 0) / analytics.totalAtual) * 100 : 0
                    return (
                      <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30">
                        <span className="text-[11px] text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {e.codigo_wbs && <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1 rounded flex-shrink-0">{e.codigo_wbs}</span>}
                            <span className="text-xs truncate">{e.descricao}</span>
                          </div>
                          <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(pct * 3, 100)}%` }} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-semibold tabular-nums">{fM(e.p_atual ?? 0)}</p>
                          <p className="text-[10px] text-muted-foreground">{pct.toFixed(1)}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Saúde da Execução ───────────────────────────────────────── */}
          <SectionHeader title="Saúde da Execução"
            tip="Cruza dados de progresso (pep_gestao), impedimentos abertos e riscos ativos por componente. Componentes com impedimentos ou riscos altos merecem atenção." />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Progresso Médio por Componente</CardTitle>
                <p className="text-[11px] text-muted-foreground">Baseado nos dados de gestão dos PTs</p>
              </CardHeader>
              <CardContent>
                {analytics.saudeComp.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.saudeComp}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                      <RTooltip content={<ChartTip formatter={(v: number, name: string, p: any) =>
                        name === 'progresso' ? `${v}% (${p?.payload?.pts ?? 0} PTs)` :
                        name === 'impedimentos' ? `${v} bloqueios` : `${v} riscos`
                      } />} />
                      <Bar dataKey="progresso" name="progresso" fill="hsl(213 73% 24%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
                    Nenhum dado de gestão registrado ainda.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              {analytics.saudeComp.map(c => (
                <Card key={c.label} className="p-3">
                  <p className="text-xs font-semibold text-foreground">{c.label} <span className="text-muted-foreground font-normal">· {c.pts} PTs</span></p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${c.progresso}%`,
                          background: c.progresso >= 60 ? 'hsl(142 71% 45%)' : c.progresso >= 30 ? 'hsl(43 96% 56%)' : 'hsl(0 84% 60%)'
                        }} />
                      </div>
                    </div>
                    <span className="text-[11px] font-medium tabular-nums w-8 text-right">{c.progresso}%</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                    {c.impedimentos > 0 && <span className="flex items-center gap-0.5 text-destructive"><Ban className="w-3 h-3" />{c.impedimentos}</span>}
                    {c.riscos > 0 && <span className="flex items-center gap-0.5 text-yellow-600"><Shield className="w-3 h-3" />{c.riscos}</span>}
                    {c.impedimentos === 0 && c.riscos === 0 && <span className="text-green-600">✓ Sem alertas</span>}
                  </div>
                </Card>
              ))}
              {analytics.saudeComp.length === 0 && (
                <Card className="p-4"><p className="text-xs text-muted-foreground">Sem dados de gestão.</p></Card>
              )}
            </div>
          </div>

          {/* ─── PTs Críticos 2025 ──────────────────────────────────────── */}
          {analytics.ptCom2025 > 0 && (
            <>
              <SectionHeader title="PTs com Entrega Prevista em 2025"
                sub={`${analytics.ptCom2025} PTs — ordenados por valor`}
                tip="Lista detalhada dos Planos de Trabalho com entrega física prevista para 2025, indicando método de aquisição, valor e correlação PMR." />
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="text-left px-3 py-2.5 w-24">WBS</th>
                        <th className="text-left px-3 py-2.5 min-w-[200px]">Descrição</th>
                        <th className="text-left px-3 py-2.5">Tipo</th>
                        <th className="text-center px-2 py-2.5">Método</th>
                        <th className="text-right px-3 py-2.5">Valor US$</th>
                        <th className="text-center px-2 py-2.5">2026</th>
                        <th className="text-center px-2 py-2.5">2027</th>
                        <th className="text-center px-2 py-2.5">PMR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.criticos2025.map(e => (
                        <tr key={e.id} className="border-b border-border/30 hover:bg-muted/30">
                          <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{e.codigo_wbs ?? '—'}</td>
                          <td className="px-3 py-2 max-w-[220px] truncate font-medium" title={e.descricao ?? ''}>{e.descricao}</td>
                          <td className="px-3 py-2">
                            {e.tipo_aquisicao ? <Badge variant="outline" className="text-[10px] px-1">{e.tipo_aquisicao}</Badge>
                              : <Badge variant="destructive" className="text-[10px] px-1">N/D</Badge>}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {e.metodo_aquisicao ? <Badge variant="secondary" className="text-[10px] px-1.5">{e.metodo_aquisicao}</Badge>
                              : <span className="text-destructive font-bold text-[10px]">⚠</span>}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium">{fM(e.p_atual ?? 0)}</td>
                          <td className="px-2 py-2 text-center">{(e.fisica_2026 ?? 0) > 0 ? '●' : '○'}</td>
                          <td className="px-2 py-2 text-center">{(e.fisica_2027 ?? 0) > 0 ? '●' : '○'}</td>
                          <td className="px-2 py-2 text-center">
                            {e.pmr_ref ? <span className="font-mono text-[10px] text-primary">{e.pmr_ref}</span> : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {analytics.ptCom2025 > 12 && (
                  <div className="px-3 py-2 border-t text-xs text-muted-foreground flex items-center justify-between">
                    <span>Exibindo 12 de {analytics.ptCom2025}</span>
                    <Link to="/pep?tab=cronograma" className="text-primary hover:underline flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></Link>
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ─── Correlação PEP × PMR ───────────────────────────────────── */}
          <SectionHeader title="Correlação PEP × PMR"
            tip="Mostra quais indicadores do PMR (outputs) estão vinculados a Planos de Trabalho do PEP via campo pmr_ref. Outputs sem vínculo representam lacunas de rastreabilidade." />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-green-600">✓</span> Mapeados ({analytics.outputsComWBS.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40 max-h-52 overflow-y-auto">
                  {analytics.outputsComWBS.map(o => (
                    <div key={o.id} className="flex items-center gap-3 px-4 py-2">
                      <span className="font-mono text-[10px] text-primary w-16 flex-shrink-0">{o.codigo}</span>
                      <span className="text-xs text-muted-foreground truncate">{o.descricao}</span>
                    </div>
                  ))}
                  {analytics.outputsComWBS.length === 0 && <div className="px-4 py-3 text-xs text-muted-foreground">Nenhum mapeado.</div>}
                </div>
              </CardContent>
            </Card>
            <Card className={analytics.outputsSemWBS.length > 3 ? 'border-yellow-200 bg-yellow-50/30 dark:bg-yellow-900/10' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {analytics.outputsSemWBS.length > 0 ? <AlertTriangle className="w-4 h-4 text-yellow-500" /> : <span className="text-green-600">✓</span>}
                  Sem vínculo ({analytics.outputsSemWBS.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {analytics.outputsSemWBS.length > 0 ? (
                  <div className="divide-y divide-border/40 max-h-52 overflow-y-auto">
                    {analytics.outputsSemWBS.map(o => (
                      <div key={o.id} className="flex items-center gap-3 px-4 py-2">
                        <span className="font-mono text-[10px] text-yellow-600 w-16 flex-shrink-0">{o.codigo ?? '—'}</span>
                        <span className="text-xs text-muted-foreground truncate">{o.descricao}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-xs text-green-600 font-medium">Todos os outputs estão vinculados.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
