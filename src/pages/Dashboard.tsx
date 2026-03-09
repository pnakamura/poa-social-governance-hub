import { DollarSign, BarChart2, AlertTriangle, CheckSquare, Clock, Calendar, MapPin } from 'lucide-react'
import { KPICard } from '@/components/dashboard/KPICard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePEPKPIs, usePEPChartData } from '@/lib/queries/pep'
import { usePMRKPIs, usePMROutputs } from '@/lib/queries/pmr'
import { useRiscoKPIs, useRiscos } from '@/lib/queries/risks'
import { useAtividadeKPIs } from '@/lib/queries/activities'
import { useNaoObjecaoKPIs } from '@/lib/queries/misc'
import { useAquisicoes } from '@/hooks/useAquisicoes'
import { usePontosAtencao } from '@/hooks/usePontosAtencao'
import { useProximosMarcos } from '@/lib/queries/marcos'
import { useProgramaContextoKPIs } from '@/lib/queries/contexto'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'

const USD = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const PCT = (v: number) => `${v.toFixed(1)}%`

const PIE_COLORS = ['#1E3A5F', '#2D6BE4', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#EC4899']

const MARCO_COLORS: Record<string, string> = {
  concluido: '#22C55E', em_andamento: '#2D6BE4', previsto: '#94A3B8', atrasado: '#EF4444',
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {title}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

export default function Dashboard() {
  const { data: pep, isLoading: pepLoading }       = usePEPKPIs()
  const { data: chart, isLoading: chartLoading }   = usePEPChartData()
  const { data: pmr, isLoading: pmrLoading }       = usePMRKPIs()
  const { data: pmrOutputs }                       = usePMROutputs()
  const { data: riscos, isLoading: riscosLoading } = useRiscoKPIs()
  const { data: riscosList }                       = useRiscos()
  const { data: atv, isLoading: atvLoading }       = useAtividadeKPIs()
  const { data: nob }                              = useNaoObjecaoKPIs()
  const { data: aquisicoes }                       = useAquisicoes()
  const { data: pontos }                           = usePontosAtencao()
  const { data: proximosMarcos }                   = useProximosMarcos(4)
  const { data: kpis }                             = useProgramaContextoKPIs()

  // PMR outputs agrupados por componente (média % realizado)
  const pmrPorComp = (() => {
    if (!pmrOutputs?.length) return []
    const acc: Record<string, { soma: number; n: number }> = {}
    for (const o of pmrOutputs) {
      const c = o.componente ?? 'Outro'
      if (!acc[c]) acc[c] = { soma: 0, n: 0 }
      acc[c].soma += o.pct_realizado ?? 0
      acc[c].n++
    }
    return Object.entries(acc).map(([name, { soma, n }]) => ({ name: name.substring(0, 22), pct: Math.round(soma / n) }))
  })()

  // Riscos por categoria
  const riscosPorCat = (() => {
    if (!riscosList?.length) return []
    const acc: Record<string, number> = {}
    for (const r of riscosList) acc[r.categoria ?? 'Outro'] = (acc[r.categoria ?? 'Outro'] ?? 0) + 1
    return Object.entries(acc).map(([name, value]) => ({ name, value }))
  })()

  // Aquisições por status
  const aquisicoesPorStatus = (() => {
    if (!aquisicoes?.length) return []
    const acc: Record<string, number> = {}
    for (const a of aquisicoes) acc[a.status] = (acc[a.status] ?? 0) + 1
    return Object.entries(acc).map(([name, value]) => ({ name, value }))
  })()

  // Pontos de atenção por área e criticidade
  const pontosPorArea = (() => {
    if (!pontos?.length) return []
    const acc: Record<string, { critico: number; alerta: number; ok: number }> = {}
    for (const p of pontos) {
      const area = p.area ?? 'Outro'
      if (!acc[area]) acc[area] = { critico: 0, alerta: 0, ok: 0 }
      if (p.criticidade === 'critico') acc[area].critico++
      else if (p.criticidade === 'alerta') acc[area].alerta++
      else acc[area].ok++
    }
    return Object.entries(acc).map(([name, v]) => ({ name, ...v }))
  })()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Executivo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">POA+SOCIAL BID — Contrato 5750-OC / BR-L1597</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Dotação BID" value={pep ? PCT(pep.execucaoBID) : '—'} subtitle={pep ? `${USD(pep.totalBID)} atual` : undefined} icon={DollarSign} variant="financial" loading={pepLoading} />
        <KPICard title="Execução Física" value={pmr ? PCT(pmr.execucaoFisica) : '—'} subtitle={pmr ? `${pmr.totalOutputs} indicadores` : undefined} icon={BarChart2} variant="physical" loading={pmrLoading} />
        <KPICard title="Variação Orçam." value={pep ? `${pep.deltaPct >= 0 ? '+' : ''}${PCT(pep.deltaPct)}` : '—'} subtitle={pep ? USD(pep.deltaP) : undefined} icon={DollarSign} variant={pep && pep.deltaPct > 5 ? 'risk' : 'financial'} loading={pepLoading} />
        <KPICard title="Riscos Críticos" value={riscos ? `${riscos.criticos}` : '—'} subtitle={riscos ? `${riscos.total} ativos` : undefined} icon={AlertTriangle} variant="risk" loading={riscosLoading} />
        <KPICard title="Em Atraso" value={atv ? `${atv.emAtraso}` : '—'} subtitle={atv ? `${atv.total} atividades` : undefined} icon={Clock} variant="activities" loading={atvLoading} />
        <KPICard title="Não-Objeções" value={nob ? `${nob.pendentes}` : '—'} subtitle={nob ? `${nob.total} processos` : undefined} icon={CheckSquare} variant="pending" />
      </div>

      {/* ── FINANCEIRO ── */}
      <SectionDivider title="Financeiro" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Orçamento por Componente — BID vs Contrapartida</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? <Skeleton className="h-52 w-full" /> : chart?.length ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => USD(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="bid" name="BID" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="local" name="Contrapartida" fill="#2D6BE4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-14">Sem dados de orçamento.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">PEP — BID Atual vs BID Arranque (base)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? <Skeleton className="h-52 w-full" /> : chart?.length ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => USD(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="bid" name="BID Atual" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bid_base" name="BID Arranque" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-14">Sem dados de PEP.</p>}
          </CardContent>
        </Card>
      </div>

      {/* ── EXECUÇÃO ── */}
      <SectionDivider title="Execução" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">PMR — % Realizado por Componente</CardTitle>
          </CardHeader>
          <CardContent>
            {pmrPorComp.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={pmrPorComp} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="pct" name="% Realizado" fill="#22C55E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-14">Sem dados de PMR.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status das Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {atvLoading
                ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
                : atv
                ? [
                    { label: 'A Fazer', count: Math.max(0, atv.total - atv.emAndamento - atv.concluidas - atv.aguardando), color: 'text-muted-foreground', bg: 'bg-muted/40' },
                    { label: 'Em Andamento', count: atv.emAndamento, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
                    { label: 'Aguardando', count: atv.aguardando, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
                    { label: 'Concluídas', count: atv.concluidas, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20' },
                  ].map((item) => (
                    <div key={item.label} className={`text-center p-4 rounded-lg ${item.bg}`}>
                      <p className={`text-3xl font-bold tabular-nums ${item.color}`}>{item.count}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    </div>
                  ))
                : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── RISCOS ── */}
      <SectionDivider title="Riscos" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Perfil de Riscos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {riscosLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : riscos && riscos.total > 0 ? (
              <div className="space-y-3">
                {[
                  { label: 'Críticos (≥16)', count: riscos.criticos, color: 'bg-risk-critical', pct: (riscos.criticos / riscos.total) * 100 },
                  { label: 'Altos (10–15)', count: riscos.altos, color: 'bg-risk-high', pct: (riscos.altos / riscos.total) * 100 },
                  { label: 'Médios (5–9)', count: riscos.medios, color: 'bg-risk-medium', pct: (riscos.medios / riscos.total) * 100 },
                  { label: 'Baixos (<5)', count: riscos.baixos, color: 'bg-risk-low', pct: (riscos.baixos / riscos.total) * 100 },
                ].map((row) => (
                  <div key={row.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium">{row.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Nenhum risco cadastrado.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Riscos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {riscosPorCat.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={riscosPorCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                    {riscosPorCat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-14">Sem dados de riscos.</p>}
          </CardContent>
        </Card>
      </div>

      {/* ── OPERACIONAL ── */}
      <SectionDivider title="Operacional" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aquisições por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {aquisicoesPorStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={aquisicoesPorStatus} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={110} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="value" name="Qtd" fill="#2D6BE4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-14">Sem aquisições cadastradas.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pontos de Atenção — por Área e Criticidade</CardTitle>
          </CardHeader>
          <CardContent>
            {pontosPorArea.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={pontosPorArea} margin={{ top: 0, right: 0, left: 0, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="critico" name="Crítico" stackId="a" fill="#EF4444" />
                  <Bar dataKey="alerta" name="Alerta" stackId="a" fill="#EAB308" />
                  <Bar dataKey="ok" name="Ok" stackId="a" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-14">Sem pontos cadastrados.</p>}
          </CardContent>
        </Card>
      </div>

      {/* ── CONTEXTO & MARCOS ── */}
      <SectionDivider title="Contexto & Marcos" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Próximos Marcos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximosMarcos?.length ? (
              <div className="space-y-2">
                {proximosMarcos.map((marco) => (
                  <div key={marco.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30">
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: MARCO_COLORS[marco.status] ?? '#94A3B8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{marco.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(marco.data_marco + 'T00:00:00').toLocaleDateString('pt-BR')}
                        {marco.area ? ` · ${marco.area}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0 capitalize">
                      {marco.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Nenhum marco previsto.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Contexto Social — Porto Alegre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'pobrezaExtrema', label: 'Famílias em pobreza', fallback: '64.395' },
                { key: 'moradoresRua', label: 'Moradores de rua', fallback: '3.368' },
                { key: 'criancasFora', label: 'Crianças fora da escola', fallback: '6.749' },
                { key: 'jovensNemNem', label: 'Jovens nem-nem', fallback: '8,7%' },
              ].map(({ key, label, fallback }) => {
                const item = kpis?.[key as keyof typeof kpis] as { valor?: number; valor_texto?: string } | undefined
                const value = item?.valor_texto ?? item?.valor?.toLocaleString('pt-BR') ?? fallback
                return (
                  <div key={key} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
                    <p className="text-xl font-bold text-primary mt-1">{value}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
