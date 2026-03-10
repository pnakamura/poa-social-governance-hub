import { useSyncLog } from '@/hooks/useSyncLog'
import { useAquisicoes } from '@/hooks/useAquisicoes'
import { useMarcos } from '@/hooks/useMarcos'
import { usePontosAtencao } from '@/hooks/usePontosAtencao'
import { formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle2, AlertCircle, XCircle, Clock, RefreshCw,
  Database, FileSpreadsheet, ShoppingCart, Calendar, AlertOctagon,
  BarChart3, Activity,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

// ─── Helpers ────────────────────────────────────────────────────────────────

type Freshness = 'ok' | 'alerta' | 'critico' | 'desconhecido'

function calcFreshness(isoDate: string | undefined | null): Freshness {
  if (!isoDate) return 'desconhecido'
  const hours = differenceInHours(new Date(), new Date(isoDate))
  if (hours <= 24) return 'ok'
  if (hours <= 72) return 'alerta'
  return 'critico'
}

function FreshnessIcon({ status }: { status: Freshness }) {
  if (status === 'ok') return <CheckCircle2 className="w-5 h-5 text-green-500" />
  if (status === 'alerta') return <AlertCircle className="w-5 h-5 text-yellow-500" />
  if (status === 'critico') return <XCircle className="w-5 h-5 text-red-500" />
  return <Clock className="w-5 h-5 text-muted-foreground" />
}

function FreshnessBadge({ status }: { status: Freshness }) {
  const map: Record<Freshness, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    ok: { label: 'Atualizado', variant: 'default' },
    alerta: { label: 'Desatualizado', variant: 'secondary' },
    critico: { label: 'Crítico', variant: 'destructive' },
    desconhecido: { label: 'Sem dados', variant: 'outline' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant} className="text-[10px]">{label}</Badge>
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

type FonteStatus = {
  nome: string
  tabela: string
  icone: React.ElementType
  ultimaSync: string | null | undefined
  registros: number | undefined
  freshness: Freshness
  descricao: string
}

// ─── Componente principal ───────────────────────────────────────────────────

export default function Qualidade() {
  const qc = useQueryClient()
  const { data: syncLogs } = useSyncLog(50)
  const { data: aquisicoes } = useAquisicoes()
  const { data: marcos } = useMarcos()
  const { data: pontos } = usePontosAtencao()

  // Para cada tabela, pega o log mais recente
  function ultimaSyncDe(tabela: string) {
    return syncLogs?.find(l => l.tabela_destino === tabela)?.executado_em ?? null
  }

  const fontes: FonteStatus[] = [
    {
      nome: 'Aquisições BID',
      tabela: 'aquisicoes',
      icone: ShoppingCart,
      ultimaSync: ultimaSyncDe('aquisicoes'),
      registros: aquisicoes?.length,
      freshness: calcFreshness(ultimaSyncDe('aquisicoes')),
      descricao: 'Processos licitatórios importados da planilha DPF (aba BID) via gspread.',
    },
    {
      nome: 'PEP RS — Entradas',
      tabela: 'pep_entries',
      icone: FileSpreadsheet,
      ultimaSync: ultimaSyncDe('pep_entries'),
      registros: undefined,
      freshness: calcFreshness(ultimaSyncDe('pep_entries')),
      descricao: 'Hierarquia orçamentária C→P→SP→PT importada do arquivo PEP_PMR.xlsx.',
    },
    {
      nome: 'PMR — Outputs',
      tabela: 'pmr_outputs',
      icone: BarChart3,
      ultimaSync: ultimaSyncDe('pmr_outputs'),
      registros: undefined,
      freshness: calcFreshness(ultimaSyncDe('pmr_outputs')),
      descricao: '30 indicadores de outputs físicos importados da aba PMR-Outputs.',
    },
    {
      nome: 'PMR — Outcomes',
      tabela: 'pmr_outcomes',
      icone: Activity,
      ultimaSync: ultimaSyncDe('pmr_outcomes'),
      registros: undefined,
      freshness: calcFreshness(ultimaSyncDe('pmr_outcomes')),
      descricao: '28 indicadores de impacto importados da aba PMR-Outcomes.',
    },
    {
      nome: 'Marcos',
      tabela: 'marcos',
      icone: Calendar,
      ultimaSync: marcos && marcos.length > 0
        ? marcos.slice().sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0].updated_at
        : null,
      registros: marcos?.length,
      freshness: marcos && marcos.length > 0 ? 'ok' : 'desconhecido',
      descricao: 'Eventos e marcos do programa inseridos manualmente no Supabase.',
    },
    {
      nome: 'Pontos de Atenção',
      tabela: 'pontos_atencao',
      icone: AlertOctagon,
      ultimaSync: pontos && pontos.length > 0
        ? pontos.slice().sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0].updated_at
        : null,
      registros: pontos?.length,
      freshness: pontos && pontos.length > 0 ? 'ok' : 'desconhecido',
      descricao: 'Semáforo institucional inserido e mantido manualmente no Supabase.',
    },
  ]

  // KPIs de resumo
  const total = fontes.length
  const ok = fontes.filter(f => f.freshness === 'ok').length
  const alerta = fontes.filter(f => f.freshness === 'alerta').length
  const critico = fontes.filter(f => f.freshness === 'critico').length

  // Últimas importações
  const ultimosSyncs = (syncLogs ?? []).slice(0, 10)

  // Consistência aquisições
  const semDatas = aquisicoes?.filter(a => !a.data_inicio_previsto && !a.data_fim_previsto).length ?? 0
  const semValor = aquisicoes?.filter(a => !a.valor_usd || a.valor_usd === 0).length ?? 0
  const totalAq = aquisicoes?.length ?? 0

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Qualidade de Dados
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Frescor, completude e consistência das fontes de dados do programa BR-L1597
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => qc.invalidateQueries()}
          className="gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </Button>
      </div>

      {/* KPI resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground mt-1">Fontes monitoradas</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-green-600">{ok}</p>
            <p className="text-xs text-muted-foreground mt-1">Atualizadas (&lt;24h)</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{alerta}</p>
            <p className="text-xs text-muted-foreground mt-1">Desatualizadas (24-72h)</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-red-600">{critico}</p>
            <p className="text-xs text-muted-foreground mt-1">Críticas (&gt;72h)</p>
          </CardContent>
        </Card>
      </div>

      {/* Painel de frescor por fonte */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Frescor por Fonte de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {fontes.map(f => {
              const Icon = f.icone
              const syncLabel = f.ultimaSync
                ? formatDistanceToNow(new Date(f.ultimaSync), { addSuffix: true, locale: ptBR })
                : 'Nunca sincronizado'
              const dias = f.ultimaSync
                ? differenceInDays(new Date(), new Date(f.ultimaSync))
                : null

              return (
                <div key={f.tabela} className="flex items-start gap-4 py-4">
                  <div className="mt-0.5">
                    <FreshnessIcon status={f.freshness} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{f.nome}</span>
                      <FreshnessBadge status={f.freshness} />
                      {f.registros !== undefined && (
                        <span className="text-[11px] text-muted-foreground">
                          {f.registros} registros
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.descricao}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Última sync:</span> {syncLabel}
                      {dias !== null && dias > 0 && (
                        <span className={dias > 3 ? 'text-red-500' : 'text-yellow-600'}>
                          {' '}({dias} {dias === 1 ? 'dia' : 'dias'} atrás)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground hidden sm:block">
                    <code className="bg-muted px-1.5 py-0.5 rounded">{f.tabela}</code>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Completude — Aquisições */}
      {totalAq > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Completude — Plano de Aquisições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{totalAq}</p>
                <p className="text-xs text-muted-foreground mt-1">Total de aquisições</p>
              </div>
              <div className={`rounded-lg p-4 text-center ${semDatas > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted/50'}`}>
                <p className={`text-2xl font-bold ${semDatas > 0 ? 'text-yellow-700' : ''}`}>{semDatas}</p>
                <p className="text-xs text-muted-foreground mt-1">Sem datas previstas</p>
                {semDatas > 0 && (
                  <p className="text-[10px] text-yellow-600 mt-0.5">
                    {((semDatas / totalAq) * 100).toFixed(0)}% do total
                  </p>
                )}
              </div>
              <div className={`rounded-lg p-4 text-center ${semValor > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted/50'}`}>
                <p className={`text-2xl font-bold ${semValor > 0 ? 'text-yellow-700' : ''}`}>{semValor}</p>
                <p className="text-xs text-muted-foreground mt-1">Sem valor US$</p>
                {semValor > 0 && (
                  <p className="text-[10px] text-yellow-600 mt-0.5">
                    {((semValor / totalAq) * 100).toFixed(0)}% do total
                  </p>
                )}
              </div>
            </div>

            {/* Aquisições sem datas — lista resumida */}
            {semDatas > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Aquisições sem datas previstas (primeiras 10):
                </p>
                <div className="space-y-1">
                  {aquisicoes
                    ?.filter(a => !a.data_inicio_previsto && !a.data_fim_previsto)
                    .slice(0, 10)
                    .map(a => (
                      <div key={a.id} className="flex items-center gap-2 text-xs p-2 bg-muted/40 rounded">
                        <Badge variant="outline" className="text-[10px] shrink-0">{a.secretaria}</Badge>
                        <span className="truncate text-muted-foreground">{a.titulo}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0 ml-auto">{a.status}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Log de importações recentes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Histórico de Importações</CardTitle>
        </CardHeader>
        <CardContent>
          {ultimosSyncs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma importação registrada.</p>
          ) : (
            <div className="divide-y text-sm">
              {ultimosSyncs.map(log => (
                <div key={log.id} className="flex items-center gap-3 py-2.5">
                  {log.status === 'ok'
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    : log.status === 'parcial'
                    ? <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{log.tabela_destino}</span>
                    <span className="text-muted-foreground ml-2 text-xs">via {log.fonte}</span>
                    {log.mensagem_erro && (
                      <p className="text-xs text-red-500 truncate">{log.mensagem_erro}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <div>
                      +{log.registros_inseridos} ins / {log.registros_atualizados} upd
                      {log.registros_erro > 0 && (
                        <span className="text-red-500"> / {log.registros_erro} err</span>
                      )}
                    </div>
                    <div className="text-[10px]">
                      {formatDistanceToNow(new Date(log.executado_em), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Como atualizar */}
      <Card className="bg-muted/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Como atualizar os dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <ShoppingCart className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
            <div>
              <span className="font-medium text-foreground">Aquisições:</span>
              {' '}Execute <code className="bg-background px-1 py-0.5 rounded border">
                PYTHONUTF8=1 python scripts/import_aquisicoes_bid.py
              </code> no repositório BID_POA
            </div>
          </div>
          <div className="flex gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
            <div>
              <span className="font-medium text-foreground">PEP / PMR:</span>
              {' '}Baixe <code className="bg-background px-1 py-0.5 rounded border">PEP_PMR.xlsx</code> do Drive
              e execute <code className="bg-background px-1 py-0.5 rounded border">import_pep_supabase.py</code>
            </div>
          </div>
          <div className="flex gap-2">
            <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
            <div>
              <span className="font-medium text-foreground">Marcos / Pontos de Atenção:</span>
              {' '}Edite diretamente no Supabase Dashboard ou via scripts Python em <code className="bg-background px-1 py-0.5 rounded border">scripts/</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
