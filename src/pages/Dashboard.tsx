import { DollarSign, BarChart2, AlertTriangle, ListChecks, CheckSquare, Clock } from 'lucide-react'
import { KPICard } from '@/components/dashboard/KPICard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePEPKPIs, usePEPChartData } from '@/lib/queries/pep'
import { usePMRKPIs } from '@/lib/queries/pmr'
import { useRiscoKPIs } from '@/lib/queries/risks'
import { useAtividadeKPIs } from '@/lib/queries/activities'
import { useNaoObjecaoKPIs } from '@/lib/queries/misc'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const USD = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const PCT = (v: number) => `${v.toFixed(1)}%`

export default function Dashboard() {
  const { data: pep, isLoading: pepLoading }       = usePEPKPIs()
  const { data: chart, isLoading: chartLoading }    = usePEPChartData()
  const { data: pmr, isLoading: pmrLoading }        = usePMRKPIs()
  const { data: riscos, isLoading: riscosLoading }  = useRiscoKPIs()
  const { data: atv, isLoading: atvLoading }        = useAtividadeKPIs()
  const { data: nob }                               = useNaoObjecaoKPIs()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Executivo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          POA+SOCIAL BID — Contrato 5750-OC / BR-L1597
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Dotação BID"
          value={pep ? PCT(pep.execucaoBID) : '—'}
          subtitle={pep ? `${USD(pep.totalBID)} atual` : undefined}
          icon={DollarSign}
          variant="financial"
          loading={pepLoading}
        />
        <KPICard
          title="Execução Física"
          value={pmr ? PCT(pmr.execucaoFisica) : '—'}
          subtitle={pmr ? `${pmr.totalOutputs} indicadores` : undefined}
          icon={BarChart2}
          variant="physical"
          loading={pmrLoading}
        />
        <KPICard
          title="Variação Orçam."
          value={pep ? `${pep.deltaPct >= 0 ? '+' : ''}${PCT(pep.deltaPct)}` : '—'}
          subtitle={pep ? USD(pep.deltaP) : undefined}
          icon={DollarSign}
          variant={pep && pep.deltaPct > 5 ? 'risk' : 'financial'}
          loading={pepLoading}
        />
        <KPICard
          title="Riscos Críticos"
          value={riscos ? `${riscos.criticos}` : '—'}
          subtitle={riscos ? `${riscos.total} ativos` : undefined}
          icon={AlertTriangle}
          variant="risk"
          loading={riscosLoading}
        />
        <KPICard
          title="Em Atraso"
          value={atv ? `${atv.emAtraso}` : '—'}
          subtitle={atv ? `${atv.total} atividades` : undefined}
          icon={Clock}
          variant="activities"
          loading={atvLoading}
        />
        <KPICard
          title="Não-Objeções"
          value={nob ? `${nob.pendentes}` : '—'}
          subtitle={nob ? `${nob.total} processos` : undefined}
          icon={CheckSquare}
          variant="pending"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget by component — dados reais do PEP RS (Supabase) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Orçamento por Componente — US$ atual</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-60 bg-muted animate-pulse rounded" />
            ) : chart && chart.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => USD(v)}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="bid"   name="BID"             fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="local" name="Local (contrapartida)" fill="hsl(var(--accent))"  radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-16">Sem dados de orçamento.</p>
            )}
          </CardContent>
        </Card>

        {/* Risk summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Perfil de Riscos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {riscosLoading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}
              </div>
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
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum risco cadastrado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Status das Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {atvLoading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)
            ) : atv ? (
              [
                { label: 'A Fazer', count: atv.total - atv.emAndamento - atv.concluidas - atv.aguardando, color: 'text-muted-foreground' },
                { label: 'Em Andamento', count: atv.emAndamento, color: 'text-accent' },
                { label: 'Aguardando', count: atv.aguardando, color: 'text-yellow-600' },
                { label: 'Concluídas', count: atv.concluidas, color: 'text-green-600' },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 rounded-lg bg-muted/40">
                  <p className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </div>
              ))
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
