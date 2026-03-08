import { FileText, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

export default function Reports() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Centro de Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Templates e geração de relatórios do programa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RELATORIOS.map(rel => (
          <Card key={rel.id} className={`border-l-4 ${rel.color} hover:shadow-md transition-shadow`}>
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled>
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled>
                  <Download className="w-3.5 h-3.5" />
                  Excel
                </Button>
                <Button size="sm" className="gap-1.5 text-xs ml-auto">
                  <FileText className="w-3.5 h-3.5" />
                  Gerar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Geração automática em desenvolvimento</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            A geração automatizada de PDF e Word utilizará os dados em tempo real do Supabase para popular os templates.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
