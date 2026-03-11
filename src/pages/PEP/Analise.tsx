import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, TrendingUp, TrendingDown, Calendar, DollarSign, ShoppingCart, Activity, ArrowRight } from 'lucide-react'
import { usePEPEntries } from '@/lib/queries/pep'
import { usePMROutputs } from '@/lib/queries/pmr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, Legend,
  ReferenceLine,
} from 'recharts'

// ─── Formatadores ─────────────────────────────────────────────────────────────
const fUSD = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
const fM = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}k` : fUSD(v)

const COLORS = ['#2D6BE4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const METODO_DESC: Record<string, string> = {
  'CD': 'Consulta Direta',
  '3CV': '3 Currículos',
  'SN': 'Seleção Nacional',
  'SI': 'Seleção Internacional',
  'LPN': 'Licitação Pública Nacional',
  'LPI': 'Licitação Pública Internacional',
  'CS': 'Seleção Baseada em Custo',
  'QCBS': 'Custo e Qualidade',
}

// ─── KPI Card simples ──────────────────────────────────────────────────────────
function KPI({ label, value, sub, variant = 'default', icon: Icon, to }: {
  label: string
  value: string
  sub?: string
  variant?: 'default' | 'alert' | 'ok' | 'warn'
  icon?: React.ComponentType<{ className?: string }>
  to?: string
}) {
  const colors = {
    default: 'text-foreground',
    alert: 'text-red-600',
    ok: 'text-green-600',
    warn: 'text-yellow-600',
  }
  return (
    <Card className={cn('p-4', variant === 'alert' && 'border-red-200 bg-red-50/50 dark:bg-red-900/10')}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
          <p className={cn('text-2xl font-bold tabular-nums mt-0.5 leading-tight', colors[variant])}>{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && <Icon className={cn('w-4 h-4 flex-shrink-0', variant === 'alert' ? 'text-red-400' : 'text-muted-foreground/50')} />}
          {to && (
            <Link to={to} className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-1">
              Ver <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function PEPAnalisePage() {
  const { data: entries = [], isLoading } = usePEPEntries('v2')
  const { data: outputs = [] } = usePMROutputs()

  // ─── Derivações analíticas ────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const pt = entries.filter(e => e.ref === 'PT')
    const comp = entries.filter(e => e.ref === 'C')

    // 1. Entregas físicas por ano
    const entregasPorAno = [
      { ano: '2025', count: pt.filter(e => (e.fisica_2025 ?? 0) > 0).length },
      { ano: '2026', count: pt.filter(e => (e.fisica_2026 ?? 0) > 0).length },
      { ano: '2027', count: pt.filter(e => (e.fisica_2027 ?? 0) > 0).length },
      { ano: '2028', count: pt.filter(e => (e.fisica_2028 ?? 0) > 0).length },
      { ano: '2029', count: pt.filter(e => (e.fisica_2029 ?? 0) > 0).length },
      { ano: 'EOP',  count: pt.filter(e => (e.fisica_eop ?? 0) > 0).length },
    ]

    // 2. Variação orçamentária por componente (delta % vs base)
    const variacaoComp = comp.map(c => {
      const label = (c.descricao ?? '').replace(/^C\d+\s*[-–]\s*/i, '').substring(0, 20)
      const delta = c.t_base > 0 ? ((c.p_atual - c.t_base) / c.t_base) * 100 : 0
      return { label, delta: +delta.toFixed(1), atual: c.p_atual, base: c.t_base, comp: c.comp }
    })

    // 3. Pipeline de aquisições por método BID
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
        metodo: METODO_DESC[metodo] ?? metodo,
        metodoCode: metodo,
        count,
        valor: metodoValores[metodo] ?? 0,
      }))

    // 4. Distribuição por tipo de aquisição
    const tipoCounts: Record<string, { count: number; valor: number }> = {}
    pt.forEach(e => {
      const t = e.tipo_aquisicao?.trim() || 'Não definido'
      tipoCounts[t] = tipoCounts[t] ?? { count: 0, valor: 0 }
      tipoCounts[t].count++
      tipoCounts[t].valor += e.p_atual ?? 0
    })
    const tipos = Object.entries(tipoCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([tipo, { count, valor }]) => ({ tipo, count, valor }))

    // 5. Curva de desembolso acumulada
    const anos = ['2025', '2026', '2027', '2028', '2029'] as const
    let acumulado = 0
    const desembolsoAnual = anos.map(ano => {
      const key = `desembolso_${ano}` as keyof typeof pt[0]
      const total = pt.reduce((s, e) => s + ((e[key] as number | null) ?? 0), 0)
      acumulado += total
      return { ano, previsto: total, acumulado }
    })

    // 6. PTs críticos 2025 (entrega prevista + maior valor)
    const criticos2025 = pt
      .filter(e => (e.fisica_2025 ?? 0) > 0)
      .sort((a, b) => (b.p_atual ?? 0) - (a.p_atual ?? 0))
      .slice(0, 12)

    // 7. Correlação PEP × PMR — outputs com WBS PEP mapeado
    const pepPmrRefs = new Set(pt.flatMap(e => (e.pmr_ref ?? '').split(',').map(r => r.trim()).filter(Boolean)))
    const outputsComWBS = outputs.filter(o => o.codigo && pepPmrRefs.has(o.codigo))
    const outputsSemWBS = outputs.filter(o => !o.codigo || !pepPmrRefs.has(o.codigo))

    // 8. Concentração financeira — top 5 PT por valor
    const topPT = [...pt]
      .sort((a, b) => (b.p_atual ?? 0) - (a.p_atual ?? 0))
      .slice(0, 8)

    // 9. KPIs principais
    const totalPT = pt.length
    const ptCom2025 = pt.filter(e => (e.fisica_2025 ?? 0) > 0).length
    const ptSemMetodo = pt.filter(e => !e.metodo_aquisicao || e.metodo_aquisicao.trim() === '').length
    const totalAtual = comp.reduce((s, e) => s + (e.p_atual ?? 0), 0)
    const totalBase  = comp.reduce((s, e) => s + (e.t_base ?? 0), 0)
    const variacaoTotal = totalBase > 0 ? ((totalAtual - totalBase) / totalBase) * 100 : 0
    const totalDesembolso2025 = desembolsoAnual[0]?.previsto ?? 0

    return {
      entregasPorAno, variacaoComp, metodos, tipos, desembolsoAnual,
      criticos2025, outputsComWBS, outputsSemWBS, topPT,
      totalPT, ptCom2025, ptSemMetodo, totalAtual, totalBase, variacaoTotal,
      totalDesembolso2025,
    }
  }, [entries, outputs])

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-lg" />)}
      </div>
    )
  }

  const { variacaoTotal } = analytics

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold">Análise PEP — Gestão do Programa</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Correlações e insights derivados do PEP RS v2 · {analytics.totalPT} Planos de Trabalho
        </p>
      </div>

      {/* ─── KPIs Executivos ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI
          label="Planos de Trabalho"
          value={String(analytics.totalPT)}
          sub="Nível PT (executores)"
          icon={Activity}
          to="/pep"
        />
        <KPI
          label="Entregas previstas 2025"
          value={String(analytics.ptCom2025)}
          sub={`${((analytics.ptCom2025 / analytics.totalPT) * 100).toFixed(0)}% do total de PTs`}
          variant={analytics.ptCom2025 > 15 ? 'alert' : 'warn'}
          icon={Calendar}
        />
        <KPI
          label="Variação vs Base"
          value={`${variacaoTotal > 0 ? '+' : ''}${variacaoTotal.toFixed(1)}%`}
          sub={`De ${fM(analytics.totalBase)} → ${fM(analytics.totalAtual)}`}
          variant={Math.abs(variacaoTotal) < 5 ? 'ok' : variacaoTotal > 10 ? 'alert' : 'warn'}
          icon={variacaoTotal > 0 ? TrendingUp : TrendingDown}
        />
        <KPI
          label="Desembolso previsto 2025"
          value={fM(analytics.totalDesembolso2025)}
          sub="US$ a desembolsar em 2025"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI
          label="PTs sem método BID"
          value={String(analytics.ptSemMetodo)}
          sub="Método de aquisição indefinido"
          variant={analytics.ptSemMetodo > 5 ? 'alert' : 'ok'}
          icon={AlertTriangle}
        />
        <KPI
          label="PMR Outputs mapeados"
          value={`${analytics.outputsComWBS.length}/${analytics.outputsComWBS.length + analytics.outputsSemWBS.length}`}
          sub="Com WBS PEP associado"
          variant={analytics.outputsSemWBS.length > 3 ? 'warn' : 'ok'}
          icon={Activity}
          to="/pmr/outputs"
        />
        <KPI
          label="Total atual programa"
          value={fM(analytics.totalAtual)}
          sub="US$ BID + Local (PEP v2)"
          icon={DollarSign}
        />
        <KPI
          label="Tipos de aquisição"
          value={String(analytics.tipos.filter(t => t.tipo !== 'Não definido').length)}
          sub="Modalidades distintas"
          icon={ShoppingCart}
        />
      </div>

      {/* ─── Concentração 2025 — Alerta Imediato ─────────────────────────── */}
      {analytics.ptCom2025 > 0 && (
        <>
          <SectionTitle
            title="Planos de Trabalho com Entrega Prevista em 2025"
            sub={`${analytics.ptCom2025} PTs precisam de atenção imediata — ordenados por valor`}
          />
          <Card>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="gradient-bid text-white">
                    <th className="text-left px-3 py-2.5 w-24">WBS</th>
                    <th className="text-left px-3 py-2.5 min-w-[200px]">Descrição</th>
                    <th className="text-left px-3 py-2.5">Tipo Aquisição</th>
                    <th className="text-center px-2 py-2.5 text-white/80">Método</th>
                    <th className="text-right px-3 py-2.5">Valor US$</th>
                    <th className="text-center px-2 py-2.5 text-white/80">2026</th>
                    <th className="text-center px-2 py-2.5 text-white/80">2027</th>
                    <th className="text-center px-2 py-2.5 text-white/80">PMR</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.criticos2025.map(e => (
                    <tr key={e.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{e.codigo_wbs ?? '—'}</td>
                      <td className="px-3 py-2 max-w-[220px] truncate font-medium" title={e.descricao ?? ''}>{e.descricao}</td>
                      <td className="px-3 py-2">
                        {e.tipo_aquisicao ? (
                          <Badge variant="outline" className="text-[10px] px-1">{e.tipo_aquisicao}</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] px-1">Não definido</Badge>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {e.metodo_aquisicao ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5">{e.metodo_aquisicao}</Badge>
                        ) : (
                          <span className="text-destructive font-bold text-[10px]">⚠</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{fM(e.p_atual ?? 0)}</td>
                      <td className="px-2 py-2 text-center">{(e.fisica_2026 ?? 0) > 0 ? '●' : '○'}</td>
                      <td className="px-2 py-2 text-center">{(e.fisica_2027 ?? 0) > 0 ? '●' : '○'}</td>
                      <td className="px-2 py-2 text-center">
                        {e.pmr_ref ? (
                          <span className="font-mono text-[10px] text-primary">{e.pmr_ref}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {analytics.ptCom2025 > 12 && (
              <div className="px-3 py-2 border-t text-xs text-muted-foreground flex items-center justify-between">
                <span>Exibindo 12 de {analytics.ptCom2025} PTs com entrega em 2025</span>
                <Link to="/pep?tab=cronograma" className="text-primary hover:underline flex items-center gap-1">
                  Ver todos no Cronograma <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ─── Gráficos: Entregas + Desembolso ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distribuição de entregas físicas por ano */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribuição de Entregas Físicas por Ano</CardTitle>
            <p className="text-[11px] text-muted-foreground">Quantidade de PTs com entrega prevista por ano</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.entregasPorAno} layout="horizontal" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v: number) => [`${v} PTs`, 'Entregas']}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="count" name="PTs" radius={[3, 3, 0, 0]}>
                  {analytics.entregasPorAno.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.ano === '2025' ? '#ef4444' : entry.ano === 'EOP' ? '#94a3b8' : '#2D6BE4'}
                      fillOpacity={entry.ano === '2025' ? 1 : 0.75}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Curva de desembolso anual + acumulado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Curva de Desembolso Previsto (US$)</CardTitle>
            <p className="text-[11px] text-muted-foreground">Fluxo anual e acumulado pelos PTs do PEP</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.desembolsoAnual} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={v => `$${(Number(v)/1e6).toFixed(0)}M`}
                  tick={{ fontSize: 10 }} width={46}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={v => `$${(Number(v)/1e6).toFixed(0)}M`}
                  tick={{ fontSize: 10 }} width={46}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [fM(v), name === 'previsto' ? 'Anual' : 'Acumulado']}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="previsto"
                  name="previsto"
                  stroke="#2D6BE4"
                  fill="#2D6BE4"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="acumulado"
                  name="acumulado"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Variação orçamentária + Pipeline de métodos ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Variação por componente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Variação Orçamentária vs Linha Base (%)</CardTitle>
            <p className="text-[11px] text-muted-foreground">Delta percentual do valor atual em relação ao arranque</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.variacaoComp} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`}
                  tick={{ fontSize: 10 }}
                />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={90} />
                <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1} />
                <Tooltip
                  formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, 'Variação']}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="delta" name="Δ%" radius={[0, 3, 3, 0]}>
                  {analytics.variacaoComp.map((entry, i) => (
                    <Cell key={i} fill={entry.delta > 0 ? '#ef4444' : entry.delta < 0 ? '#22c55e' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Métodos de aquisição BID */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pipeline de Aquisições por Método BID</CardTitle>
            <p className="text-[11px] text-muted-foreground">Quantidade de PTs por método de seleção</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={analytics.metodos.slice(0, 7)}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="metodoCode" tick={{ fontSize: 10 }} width={58} />
                <Tooltip
                  formatter={(v: number, name: string, props: { payload: { metodo: string; valor: number } }) => [
                    `${v} PTs · ${fM(props.payload.valor)}`,
                    props.payload.metodo,
                  ]}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="count" name="PTs" radius={[0, 3, 3, 0]}>
                  {analytics.metodos.slice(0, 7).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Tipos de aquisição + Concentração financeira ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distribuição por tipo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribuição por Tipo de Aquisição</CardTitle>
            <p className="text-[11px] text-muted-foreground">% de PTs por modalidade</p>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={analytics.tipos.slice(0, 6)}
                  dataKey="count"
                  nameKey="tipo"
                  innerRadius={40}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {analytics.tipos.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, _: string, props: { payload: { tipo: string; valor: number } }) => [
                    `${v} PTs · ${fM(props.payload.valor)}`,
                    props.payload.tipo,
                  ]}
                  contentStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {analytics.tipos.slice(0, 6).map((t, i) => (
                <div key={t.tipo} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="truncate text-muted-foreground flex-1" title={t.tipo}>{t.tipo}</span>
                  <span className="font-medium tabular-nums">{t.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 8 PTs por valor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Concentração Financeira — Top 8 PTs</CardTitle>
            <p className="text-[11px] text-muted-foreground">Planos de Trabalho de maior valor atual</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {analytics.topPT.map((e, i) => {
                const pct = analytics.totalAtual > 0 ? ((e.p_atual ?? 0) / analytics.totalAtual) * 100 : 0
                return (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 group">
                    <span className="text-[11px] text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {e.codigo_wbs && (
                          <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1 rounded flex-shrink-0">
                            {e.codigo_wbs}
                          </span>
                        )}
                        <span className="text-xs truncate" title={e.descricao ?? ''}>{e.descricao}</span>
                      </div>
                      <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(pct * 3, 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold tabular-nums">{fM(e.p_atual ?? 0)}</p>
                      <p className="text-[10px] text-muted-foreground">{pct.toFixed(1)}% prog.</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Correlação PEP × PMR ─────────────────────────────────────────── */}
      <SectionTitle
        title="Correlação PEP × PMR — Cobertura de Indicadores"
        sub="Quais outputs PMR estão vinculados a Planos de Trabalho do PEP"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Outputs com WBS PEP associado ({analytics.outputsComWBS.length})
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
              {analytics.outputsComWBS.length === 0 && (
                <div className="px-4 py-3 text-xs text-muted-foreground">Nenhum output mapeado ainda.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={analytics.outputsSemWBS.length > 3 ? 'border-yellow-200 bg-yellow-50/30' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {analytics.outputsSemWBS.length > 0
                ? <AlertTriangle className="w-4 h-4 text-yellow-500" />
                : <span className="text-green-600">✓</span>}
              Outputs sem WBS PEP ({analytics.outputsSemWBS.length})
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
              <div className="px-4 py-3 text-xs text-green-600 font-medium">Todos os outputs estão associados a WBS do PEP.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
