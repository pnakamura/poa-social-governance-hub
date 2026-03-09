import { useEffect, useState } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, DollarSign, CloudRain, Users, ExternalLink, Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePMROutputs } from '@/lib/queries/pmr'
import { useRiscos } from '@/lib/queries/risks'
import { useProgramaContextoKPIs } from '@/lib/queries/contexto'
import { supabase } from '@/lib/supabase'

// ── Tipos ──────────────────────────────────────────────────────────────────

interface CambioData {
  cotacaoCompra: number
  cotacaoVenda: number
  dataHoraCotacao: string
}

interface AnaliseComponente {
  componente: string
  pmrPct: number
  nivelRiscoMax: number
  alerta: boolean
  indice: number // 0-100
}

interface Recomendacao {
  tipo: 'critico' | 'atencao' | 'info'
  titulo: string
  descricao: string
}

const CAMBIO_BASE = 5.5 // câmbio de referência do contrato

// ── Hooks de dados externos ────────────────────────────────────────────────

function useCambioBCB() {
  const [data, setData] = useState<CambioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState(false)

  useEffect(() => {
    async function fetch() {
      // Verificar cache Supabase (TTL 6h)
      try {
        const { data: cacheRow } = await supabase
          .from('analytics_cache')
          .select('dados,calculado_em')
          .eq('chave', 'bcb_ptax_usd')
          .maybeSingle()

        if (cacheRow) {
          const age = Date.now() - new Date(cacheRow.calculado_em).getTime()
          if (age < 6 * 60 * 60 * 1000) {
            setData(cacheRow.dados as CambioData)
            setCached(true)
            setLoading(false)
            return
          }
        }
      } catch { /* cache pode não existir ainda */ }

      // Buscar da API BCB PTAX
      try {
        const hoje = new Date()
        const dateStr = hoje.toLocaleDateString('pt-BR').replace(/\//g, '%2F')
        const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dateStr}'&$top=1&$format=json&$select=cotacaoCompra,cotacaoVenda,dataHoraCotacao`
        const res = await globalThis.fetch(url)
        if (!res.ok) throw new Error('BCB API indisponível')
        const json = await res.json()
        const value = json?.value?.[0]
        if (!value) throw new Error('Sem dados PTAX hoje')
        setData(value)

        // Salvar no cache
        try {
          await supabase.from('analytics_cache').upsert({
            chave: 'bcb_ptax_usd',
            dados: value,
            calculado_em: new Date().toISOString(),
          })
        } catch { /* ignore cache write errors */ }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro BCB')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { data, loading, error, cached }
}

// ── Componente principal ───────────────────────────────────────────────────

export default function Inteligencia() {
  const { data: pmrOutputs } = usePMROutputs()
  const { data: riscosList } = useRiscos()
  const { data: kpis } = useProgramaContextoKPIs()
  const { data: cambio, loading: cambioLoading, error: cambioError, cached: cambioCached } = useCambioBCB()

  // ── Seção A: Análise cruzada PMR × Riscos por Componente ──────────────

  const analiseComponentes: AnaliseComponente[] = (() => {
    if (!pmrOutputs?.length || !riscosList?.length) return []

    const comps = ['C1', 'C2', 'C3']
    return comps.map((comp) => {
      const outputs = pmrOutputs.filter((o) => (o.componente ?? '').startsWith(comp))
      const riscos = riscosList.filter((r) => (r.categoria ?? r.descricao ?? '').toLowerCase().includes(comp.toLowerCase()))

      const pmrPct = outputs.length
        ? Math.round(outputs.reduce((s, o) => s + (o.pct_realizado ?? 0), 0) / outputs.length)
        : 0

      const nivelRiscoMax = riscos.length
        ? Math.max(...riscos.map((r) => r.nivel ?? 0))
        : 0

      const alerta = nivelRiscoMax >= 16 && pmrPct < 30
      const indice = Math.round(Math.max(0, 100 - nivelRiscoMax * 2 + pmrPct * 0.5))

      return { componente: comp, pmrPct, nivelRiscoMax, alerta, indice: Math.min(100, indice) }
    })
  })()

  // ── Seção C: Recomendações automáticas ────────────────────────────────

  const recomendacoes: Recomendacao[] = (() => {
    const recs: Recomendacao[] = []

    // Regra 1: Risco crítico com baixa execução PMR
    for (const comp of analiseComponentes) {
      if (comp.alerta) {
        recs.push({
          tipo: 'critico',
          titulo: `${comp.componente}: Risco crítico com baixa execução`,
          descricao: `O componente ${comp.componente} tem nível de risco máximo ${comp.nivelRiscoMax} (≥16) e execução física PMR de apenas ${comp.pmrPct}% (< 30%). Intervenção urgente necessária.`,
        })
      }
    }

    // Regra 2: Câmbio elevado
    if (cambio && cambio.cotacaoVenda > CAMBIO_BASE * 1.1) {
      const delta = (((cambio.cotacaoVenda - CAMBIO_BASE) / CAMBIO_BASE) * 100).toFixed(1)
      recs.push({
        tipo: 'atencao',
        titulo: `Câmbio elevado: impacto orçamentário +${delta}%`,
        descricao: `A cotação atual BRL/USD (${cambio.cotacaoVenda.toFixed(4)}) está ${delta}% acima da taxa de referência do contrato (${CAMBIO_BASE}). Isso pode impactar o poder de compra em reais dos recursos BID.`,
      })
    }

    // Regra 3: Sem dados críticos → info
    if (recs.length === 0) {
      recs.push({
        tipo: 'info',
        titulo: 'Sem alertas críticos identificados',
        descricao: 'Os indicadores analisados não ativaram nenhuma regra de alerta. Continue monitorando os componentes com maior exposição a risco.',
      })
    }

    return recs
  })()

  const cambioDelta = cambio ? ((cambio.cotacaoVenda - CAMBIO_BASE) / CAMBIO_BASE) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" /> Inteligência Analítica
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Análise cruzada, dados externos e recomendações automáticas — POA+SOCIAL BID
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 print:hidden">
          <Printer className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>

      {/* ── SEÇÃO A: Análise Cruzada PMR × Riscos ── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">A — Correlação PMR × Riscos por Componente</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analiseComponentes.length > 0
            ? analiseComponentes.map((comp) => (
                <Card key={comp.componente} className={comp.alerta ? 'border-destructive/50 bg-destructive/5' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{comp.componente}</span>
                      {comp.alerta && <AlertTriangle className="w-4 h-4 text-destructive" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Execução PMR</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all"
                            style={{ width: `${comp.pmrPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium tabular-nums w-8 text-right">{comp.pmrPct}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Risco máximo</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(comp.nivelRiscoMax / 25) * 100}%`,
                              backgroundColor: comp.nivelRiscoMax >= 16 ? '#EF4444' : comp.nivelRiscoMax >= 10 ? '#EAB308' : '#22C55E',
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium tabular-nums w-8 text-right">{comp.nivelRiscoMax}</span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-border/40">
                      <p className="text-[10px] text-muted-foreground">Índice de saúde</p>
                      <p className={`text-2xl font-bold tabular-nums mt-0.5 ${comp.indice >= 70 ? 'text-green-600' : comp.indice >= 40 ? 'text-yellow-600' : 'text-destructive'}`}>
                        {comp.indice}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            : [1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      </div>

      {/* ── SEÇÃO B: Dados Externos ── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">B — Dados Externos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* BCB PTAX */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> Câmbio BRL/USD
                </span>
                <a
                  href="https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  BCB PTAX <ExternalLink className="w-3 h-3" />
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cambioLoading ? (
                <Skeleton className="h-16" />
              ) : cambioError ? (
                <div className="text-sm text-muted-foreground py-2">
                  <p>API BCB indisponível</p>
                  <p className="text-xs mt-1">Ref. contrato: R$ {CAMBIO_BASE.toFixed(2)}</p>
                </div>
              ) : cambio ? (
                <div>
                  <p className="text-3xl font-bold tabular-nums">R$ {cambio.cotacaoVenda.toFixed(4)}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {cambioDelta > 0
                      ? <TrendingUp className="w-3.5 h-3.5 text-destructive" />
                      : cambioDelta < 0
                      ? <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                      : <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className={`text-xs font-medium ${cambioDelta > 0 ? 'text-destructive' : cambioDelta < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {cambioDelta > 0 ? '+' : ''}{cambioDelta.toFixed(1)}% vs ref. contrato
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Cotação de venda · {new Date(cambio.dataHoraCotacao).toLocaleDateString('pt-BR')}
                    {cambioCached && ' · cache'}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Contexto social IBGE */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Contexto Social POA
                </span>
                <span className="text-[10px] text-muted-foreground">Supabase / IBGE</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'População', v: kpis?.populacao },
                { label: 'Famílias em pobreza extrema', v: kpis?.pobrezaExtrema },
                { label: 'Moradores de rua', v: kpis?.moradoresRua },
              ].map(({ label, v }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">
                    {(v as { valor?: number; valor_texto?: string } | undefined)?.valor_texto
                      ?? (v as { valor?: number } | undefined)?.valor?.toLocaleString('pt-BR')
                      ?? '—'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Alerta climático placeholder */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4" /> Clima — Porto Alegre
                </span>
                <span className="text-[10px] text-muted-foreground">INMET</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <p>Integração INMET configurável.</p>
                <p className="text-xs">
                  Endpoint: <code className="text-primary">apitempo.inmet.gov.br/estacao/diaria/A801/</code>
                </p>
                <p className="text-xs">Relevante para obras de reabilitação (C2) — impacto de chuvas no cronograma.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── SEÇÃO C: Recomendações Automáticas ── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">C — Recomendações Automáticas</h2>
        <div className="space-y-3">
          {recomendacoes.map((rec, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 ${
                rec.tipo === 'critico'
                  ? 'border-destructive/50 bg-destructive/5'
                  : rec.tipo === 'atencao'
                  ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20'
                  : 'border-blue-500/30 bg-blue-50 dark:bg-blue-950/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    rec.tipo === 'critico'
                      ? 'text-destructive'
                      : rec.tipo === 'atencao'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold">{rec.titulo}</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        rec.tipo === 'critico'
                          ? 'border-destructive/50 text-destructive'
                          : rec.tipo === 'atencao'
                          ? 'border-yellow-500/50 text-yellow-700'
                          : 'border-blue-500/30 text-blue-700'
                      }`}
                    >
                      {rec.tipo}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rec.descricao}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { font-size: 12px; }
          .print\\:hidden { display: none; }
        }
      `}</style>
    </div>
  )
}
