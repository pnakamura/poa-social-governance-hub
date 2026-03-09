import { useState } from 'react'
import { FileText, Printer, Copy, X, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePEPKPIs } from '@/lib/queries/pep'
import { usePMRKPIs } from '@/lib/queries/pmr'
import { useRiscoKPIs } from '@/lib/queries/risks'
import { useAtividadeKPIs } from '@/lib/queries/activities'
import { useUltimaSyncLog } from '@/hooks/useSyncLog'
import { DataSourcePanel } from '@/components/DataSourcePanel'

const RELATORIOS = [
  {
    id: 'quinzenal',
    titulo: 'Relatório Quinzenal',
    descricao: 'Progresso das atividades, status físico-financeiro e bloqueios identificados.',
    periodicidade: 'Quinzenal',
    color: 'border-l-accent',
    secoes: ['Status das atividades por componente', 'Progresso físico (% PMR)', 'Bloqueios e pendências', 'Próximos passos'],
  },
  {
    id: 'mensal',
    titulo: 'Relatório Mensal',
    descricao: 'Execução financeira, atualização da matriz de riscos e desvios orçamentários.',
    periodicidade: 'Mensal',
    color: 'border-l-primary',
    secoes: ['Execução financeira BID/Local', 'Atualização da matriz de riscos', 'Desvios vs. PEP base', 'Não-Objeções em andamento'],
  },
  {
    id: 'semestral',
    titulo: 'Relatório Semestral (PMR)',
    descricao: 'Indicadores de impacto, cumprimento de covenants e análise de sustentabilidade.',
    periodicidade: 'Semestral',
    color: 'border-l-[hsl(var(--status-done))]',
    secoes: ['Indicadores PMR-Outputs', 'Indicadores PMR-Outcomes', 'Cumprimento de covenants', 'Análise de sustentabilidade'],
  },
  {
    id: 'missao',
    titulo: 'Relatório de Missão BID',
    descricao: 'Preparação de documentos para missões de supervisão e Ajuda Memória.',
    periodicidade: 'Sob demanda',
    color: 'border-l-[hsl(var(--risk-high))]',
    secoes: ['Sumário executivo do programa', 'Progresso por produto (PEP)', 'Conformidade contratual', 'Questões para discussão BID'],
  },
]

function fmtUSD(v?: number | null) {
  if (v == null) return 'N/D'
  return `US$ ${(v / 1_000_000).toFixed(1)}M`
}

function fmtPct(v?: number | null) {
  if (v == null) return 'N/D'
  return `${v.toFixed(1)}%`
}

function ReportPreview({ templateId }: { templateId: string }) {
  const { data: pep, isLoading: pepLoading } = usePEPKPIs()
  const { data: pmr, isLoading: pmrLoading } = usePMRKPIs()
  const { data: risco, isLoading: riscoLoading } = useRiscoKPIs()
  const { data: atv, isLoading: atvLoading } = useAtividadeKPIs()
  const { data: sync } = useUltimaSyncLog()

  const isLoading = pepLoading || pmrLoading || riscoLoading || atvLoading
  const dataRef = sync?.executado_em
    ? new Date(sync.executado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const template = RELATORIOS.find(r => r.id === templateId)!

  if (isLoading) return (
    <div className="space-y-3 p-6">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
    </div>
  )

  const bidAtual = pep?.totalBID ?? 0
  const localAtual = pep?.totalLocal ?? 0
  const totalAtual = pep?.totalAtual ?? 0
  const totalBase = pep?.totalBase ?? 0
  const deltaTotal = pep?.deltaPct ?? 0

  const pmrPct = pmr?.execucaoFisica ?? 0
  const pmrTotal = (pmr?.totalOutputs ?? 0) + (pmr?.totalOutcomes ?? 0)
  const riscosCriticos = risco?.criticos ?? 0
  const riscosAltos = risco?.altos ?? 0
  const riscosTotal = risco?.total ?? 0
  const atvTotal = atv?.total ?? 0
  const atvEmAndamento = atv?.emAndamento ?? 0
  const atvConcluidas = atv?.concluidas ?? 0
  const atvEmAtraso = atv?.emAtraso ?? 0

  return (
    <div id="report-preview" className="report-content text-sm leading-relaxed space-y-6">
      {/* Cabeçalho */}
      <div className="border-b pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Programa BR-L1597 — POA+SOCIAL</p>
            <h2 className="text-xl font-bold mt-0.5">{template.titulo}</h2>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Data de referência</p>
            <p className="font-medium text-foreground">{dataRef}</p>
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span>Financiador: BID — BR-L1597</span>
          <span>Executor: SMPG / DPF / UGP</span>
          <span>Valor: US$ 132,0M</span>
        </div>
      </div>

      {/* Seção 1 — Execução Financeira */}
      {(templateId === 'mensal' || templateId === 'missao' || templateId === 'semestral') && (
        <section>
          <h3 className="font-semibold text-base mb-3 border-b pb-1">1. Execução Financeira (PEP RS)</h3>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="bg-muted/30 rounded p-3">
              <p className="text-xs text-muted-foreground">BID Atual</p>
              <p className="text-lg font-bold">{fmtUSD(bidAtual)}</p>
              <p className="text-[10px] text-muted-foreground">Contrapartida: {fmtUSD(localAtual)}</p>
            </div>
            <div className="bg-muted/30 rounded p-3">
              <p className="text-xs text-muted-foreground">Total Atual</p>
              <p className="text-lg font-bold">{fmtUSD(totalAtual)}</p>
              <p className="text-[10px] text-muted-foreground">Base: {fmtUSD(totalBase)}</p>
            </div>
            <div className={`rounded p-3 ${Math.abs(deltaTotal) > 5 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-muted/30'}`}>
              <p className="text-xs text-muted-foreground">Δ vs Arranque</p>
              <p className={`text-lg font-bold ${deltaTotal > 0 ? 'text-red-600' : deltaTotal < 0 ? 'text-green-600' : ''}`}>
                {deltaTotal >= 0 ? '+' : ''}{fmtPct(deltaTotal)}
              </p>
              <p className="text-[10px] text-muted-foreground">{Math.abs(deltaTotal) > 5 ? 'Exige justificativa BID' : 'Dentro do limite'}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            * Valores extraídos do PEP RS versão v2 importados no Supabase. Δ refere-se à variação percentual do total do projeto (N+O) em relação à versão de arranque (R+S).
          </p>
        </section>
      )}

      {/* Seção — Progresso Físico */}
      {(templateId === 'quinzenal' || templateId === 'semestral' || templateId === 'missao') && (
        <section>
          <h3 className="font-semibold text-base mb-3 border-b pb-1">
            {templateId === 'quinzenal' ? '1.' : '2.'} Progresso Físico (PMR — Outputs)
          </h3>
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-muted/30 rounded p-3 flex-1 text-center">
              <p className="text-xs text-muted-foreground">Média de Realização</p>
              <p className={`text-2xl font-bold ${pmrPct >= 70 ? 'text-green-600' : pmrPct >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {fmtPct(pmrPct)}
              </p>
              <p className="text-[10px] text-muted-foreground">dos {pmrTotal} indicadores</p>
            </div>
            <div className="bg-muted/30 rounded p-3 flex-1 text-center">
              <p className="text-xs text-muted-foreground">Outputs</p>
              <p className="text-2xl font-bold text-blue-600">{pmr?.totalOutputs ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">indicadores físicos</p>
            </div>
            <div className="bg-muted/30 rounded p-3 flex-1 text-center">
              <p className="text-xs text-muted-foreground">Outcomes</p>
              <p className="text-2xl font-bold text-purple-600">{pmr?.totalOutcomes ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">indicadores de impacto</p>
            </div>
          </div>
        </section>
      )}

      {/* Seção — Atividades */}
      {(templateId === 'quinzenal' || templateId === 'mensal') && (
        <section>
          <h3 className="font-semibold text-base mb-3 border-b pb-1">
            {templateId === 'quinzenal' ? '2.' : '3.'} Status das Atividades
          </h3>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { label: 'Total', val: atvTotal, color: '' },
              { label: 'Em andamento', val: atvEmAndamento, color: 'text-blue-600' },
              { label: 'Concluídas', val: atvConcluidas, color: 'text-green-600' },
              { label: 'Em atraso', val: atvEmAtraso, color: 'text-red-600' },
            ].map(item => (
              <div key={item.label} className="bg-muted/30 rounded p-3 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{item.val}</p>
              </div>
            ))}
          </div>
          {atvEmAtraso > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Atenção: {atvEmAtraso} atividade(s) com prazo vencido e status pendente.
            </p>
          )}
        </section>
      )}

      {/* Seção — Matriz de Riscos */}
      {(templateId === 'mensal' || templateId === 'missao' || templateId === 'semestral') && (
        <section>
          <h3 className="font-semibold text-base mb-3 border-b pb-1">
            {templateId === 'mensal' ? '2.' : '3.'} Matriz de Riscos
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-red-50 dark:bg-red-950/20 rounded p-3 text-center">
              <p className="text-xs text-muted-foreground">Críticos (≥16)</p>
              <p className="text-2xl font-bold text-red-600">{riscosCriticos}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded p-3 text-center">
              <p className="text-xs text-muted-foreground">Altos (10–15)</p>
              <p className="text-2xl font-bold text-orange-600">{riscosAltos}</p>
            </div>
            <div className="bg-muted/30 rounded p-3 text-center">
              <p className="text-xs text-muted-foreground">Total ativos</p>
              <p className="text-2xl font-bold">{riscosTotal}</p>
            </div>
          </div>
          {riscosCriticos > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Atenção: {riscosCriticos} risco(s) crítico(s) requerem plano de resposta imediata.
            </p>
          )}
        </section>
      )}

      {/* Rodapé */}
      <div className="border-t pt-4 text-xs text-muted-foreground">
        <p>Dados extraídos automaticamente do sistema POA+SOCIAL BID (Supabase) em {dataRef}.</p>
        <p className="mt-1">Fonte: PEP RS v2 | PMR-Outputs | Matriz de Riscos | Atividades — Programa BR-L1597</p>
        <p className="mt-1">SMPG / DPF — Prefeitura de Porto Alegre</p>
      </div>
    </div>
  )
}

export default function Reports() {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopiarMarkdown = () => {
    const el = document.getElementById('report-preview')
    if (!el) return
    const text = el.innerText
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Centro de Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Templates e geração de relatórios com dados reais do programa</p>
      </div>

      <DataSourcePanel
        source="Supabase — pep_entries, pmr_outputs, riscos, atividades"
        url="https://dvqnlnxkwcrxbctujajl.supabase.co"
        tabela="múltiplas tabelas"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RELATORIOS.map(rel => (
          <Card
            key={rel.id}
            className={`border-l-4 ${rel.color} hover:shadow-md transition-shadow ${activeTemplate === rel.id ? 'ring-2 ring-primary' : ''}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{rel.titulo}</CardTitle>
                <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">{rel.periodicidade}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{rel.descricao}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 mb-4">
                {rel.secoes.map(s => (
                  <li key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                className="gap-1.5 text-xs w-full"
                variant={activeTemplate === rel.id ? 'default' : 'outline'}
                onClick={() => setActiveTemplate(activeTemplate === rel.id ? null : rel.id)}
              >
                <FileText className="w-3.5 h-3.5" />
                {activeTemplate === rel.id ? 'Fechar preview' : 'Gerar preview'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview do relatório */}
      {activeTemplate && (
        <Card className="print:shadow-none">
          <CardHeader className="pb-3 print:hidden">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Preview — {RELATORIOS.find(r => r.id === activeTemplate)?.titulo}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleCopiarMarkdown}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar texto'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => window.print()}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir / PDF
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setActiveTemplate(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ReportPreview templateId={activeTemplate} />
          </CardContent>
        </Card>
      )}

      <style>{`
        @media print {
          body > * { display: none !important; }
          #root > * { display: none !important; }
          .print\\:hidden { display: none !important; }
          #report-preview { display: block !important; }
          #report-preview * { display: revert !important; }
        }
      `}</style>
    </div>
  )
}
