import { Building2, Calendar, DollarSign, FileText, Users2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const PROGRAMA = {
  nome: 'POA+SOCIAL',
  contrato: '5750-OC / BR-L1597',
  valorBID: 132_000_000,
  valorLocal: 33_000_000,
  cambio: 5.50,
  inicio: '2024-01-01',
  fim: '2028-12-31',
  status: 'Em execução',
  objetivos: [
    {
      titulo: 'Melhorar serviços urbanos integrados',
      descricao: 'Ampliar a capacidade de gestão integrada de dados urbanos pela PMPA via plataforma de interoperabilidade.',
    },
    {
      titulo: 'Reabilitar infraestrutura social',
      descricao: 'Recuperar equipamentos de saúde, educação, esporte e assistência social em áreas vulneráveis.',
    },
    {
      titulo: 'Fortalecer capacidade institucional',
      descricao: 'Aprimorar os processos de gestão, monitoramento e avaliação da SMPG e órgãos executores.',
    },
    {
      titulo: 'Promover sustentabilidade social',
      descricao: 'Garantir impacto duradouro nas comunidades beneficiadas por meio de indicadores mensuráveis.',
    },
  ],
  executores: [
    { sigla: 'SMPG', nome: 'Secretaria Municipal de Planejamento e Gestão', papel: 'Coordenação geral (UGP)' },
    { sigla: 'SMOI', nome: 'Secretaria Municipal de Obras e Infraestrutura', papel: 'Obras de reabilitação' },
    { sigla: 'ASD', nome: 'Agência de Desenvolvimento de Porto Alegre', papel: 'Interoperabilidade' },
    { sigla: 'SMS', nome: 'Secretaria Municipal de Saúde', papel: 'Equipamentos de saúde' },
    { sigla: 'SMAS', nome: 'Secretaria Municipal de Assistência Social', papel: 'Centros sociais' },
    { sigla: 'SMED', nome: 'Secretaria Municipal de Educação', papel: 'Escolas e creches' },
  ],
  documentos: [
    { nome: 'Contrato de Empréstimo 5750-OC', tipo: 'Contrato', data: '2024-01-15' },
    { nome: 'Regulamento Operacional (ROP)', tipo: 'Regulamento', data: '2024-02-01' },
    { nome: 'PEP RS v2 — Plano de Execução', tipo: 'Planilha', data: '2026-03-06' },
    { nome: 'PMR — Plano de Monitoramento', tipo: 'Plano', data: '2025-02-26' },
    { nome: 'Fluxograma de Processos BID', tipo: 'Diagrama', data: '2024-03-01' },
    { nome: 'Manual do Executor BID', tipo: 'Manual', data: '2024-01-01' },
  ],
}

const USD = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function ProgramProfile() {
  const totalUSD = PROGRAMA.valorBID + PROGRAMA.valorLocal
  const totalBRL = totalUSD * PROGRAMA.cambio

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="gradient-bid rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{PROGRAMA.nome}</h1>
            <p className="text-white/80 mt-1">Contrato BID {PROGRAMA.contrato}</p>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20">
            {PROGRAMA.status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { icon: DollarSign, label: 'Valor Total', value: `${USD(totalUSD)}` },
            { icon: DollarSign, label: 'Valor BID', value: USD(PROGRAMA.valorBID) },
            { icon: Calendar, label: 'Início', value: new Date(PROGRAMA.inicio).toLocaleDateString('pt-BR') },
            { icon: Calendar, label: 'Término', value: new Date(PROGRAMA.fim).toLocaleDateString('pt-BR') },
          ].map(item => (
            <div key={item.label} className="bg-white/10 rounded-lg p-3">
              <p className="text-white/60 text-xs">{item.label}</p>
              <p className="text-white font-semibold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Objetivos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Objetivos Estratégicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PROGRAMA.objetivos.map((obj, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">{obj.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{obj.descricao}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Executores */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Órgãos Executores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PROGRAMA.executores.map(exec => (
              <div key={exec.sigla} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {exec.sigla}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{exec.nome}</p>
                  <p className="text-xs text-muted-foreground">{exec.papel}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* OrgChart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users2 className="w-4 h-4" /> Estrutura Organizacional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-0 text-xs">
            {/* Nível 1 */}
            <div className="bg-primary text-white rounded-lg px-4 py-2 font-semibold text-center">PMPA</div>
            <div className="w-px h-4 bg-border" />
            {/* Nível 2 */}
            <div className="bg-primary/80 text-white rounded-lg px-4 py-2 font-semibold text-center">SMPG</div>
            <div className="w-px h-4 bg-border" />
            {/* Nível 3 */}
            <div className="bg-primary/60 text-white rounded-lg px-4 py-2 font-semibold text-center">DPF — Departamento de Projetos e Financiamentos</div>
            <div className="w-px h-4 bg-border" />
            {/* Nível 4 */}
            <div className="bg-primary/40 text-white rounded-lg px-4 py-2 font-semibold text-center">UGP — Unidade de Gerenciamento do Programa</div>
            <div className="w-px h-4 bg-border" />
            {/* Nível 5 — ULPs */}
            <p className="text-[10px] text-muted-foreground mb-1">Unidades de Licitação e Programação (ULPs)</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {['SMS', 'SMAS', 'SMED', 'SMID', 'PROCEMPA', 'DEMHAB'].map(ulp => (
                <div key={ulp} className="bg-muted rounded-md px-3 py-1.5 text-xs font-medium border border-border">
                  {ulp}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contexto Social */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Contexto Social — Porto Alegre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Famílias em pobreza extrema', value: '64.395', sub: '~13% da população' },
              { label: 'Moradores de rua', value: '3.368', sub: '+59,2% entre 2016-2020' },
              { label: 'Crianças fora da escola', value: '6.749', sub: '7-17 anos (SMED 2021)' },
              { label: 'Jovens nem-nem', value: '8,7%', sub: 'Não estudam, não trabalham' },
              { label: 'Valor total do programa', value: 'US$ 161M', sub: 'BID + Contrapartida local' },
              { label: 'Prazo de execução', value: '5 anos', sub: 'Início: Dez/2024' },
            ].map(item => (
              <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold text-primary mt-0.5">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Documentos de Referência</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {PROGRAMA.documentos.map(doc => (
              <div key={doc.nome} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.tipo} · {new Date(doc.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">{doc.tipo}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
