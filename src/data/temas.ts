export type Tema = {
  id: string
  titulo: string
  icone: string
  descricao: string
  subtemas: string[]
  areasRelacionadas: string[]
  componentes: string[]
}

export const TEMAS: Tema[] = [
  {
    id: 'obras',
    titulo: 'Obras e Licitações',
    icone: '🏗️',
    descricao:
      'Reabilitação de equipamentos públicos de saúde, educação, esporte e assistência social em áreas vulneráveis de Porto Alegre. Componente C2 do programa BR-L1597.',
    subtemas: [
      'Hospital de Pronto Socorro (HPS) — reabilitação e ampliação',
      'Policlínica IAPI — reabilitação',
      'Clínicas de Família (CFam) — padronização construtiva',
      'Unidades Básicas de Saúde (UBS)',
      'CAPS e equipamentos de saúde mental',
      'Contratos FIDIC Yellow Book',
      'Aglutinação de lotes de obras',
      'Padronização construtiva LEED/EDGE',
    ],
    areasRelacionadas: ['obras', 'financeiro', 'aquisicoes'],
    componentes: ['C2'],
  },
  {
    id: 'digital',
    titulo: 'Transformação Digital',
    icone: '💻',
    descricao:
      'Desenvolvimento da plataforma de interoperabilidade social InterPOA. Integração de sistemas da rede de proteção social da PMPA. Componente C1 do programa.',
    subtemas: [
      'Arquitetura empresarial — planejamento InterPOA',
      'Ambiente integrado de dados sociais',
      'Portal do Cliente BID (Client Portal)',
      'Integração SMPG / PROCEMPA',
      'Gestão de dados de beneficiários',
      'Painéis de monitoramento em tempo real',
    ],
    areasRelacionadas: ['digital', 'governanca'],
    componentes: ['C1'],
  },
  {
    id: 'social',
    titulo: 'Componente Social',
    icone: '🤝',
    descricao:
      'Proteção e inclusão social de populações vulneráveis impactadas pelas enchentes de 2024 e pela pobreza estrutural. ~64 mil famílias em extrema pobreza em POA.',
    subtemas: [
      'Famílias em situação de vulnerabilidade social',
      'População em situação de rua (3.368 pessoas)',
      'Crianças e adolescentes fora da escola',
      'Jovens nem-nem (8,7% da população jovem)',
      'Marco de Política Ambiental e Social (MPAS)',
      'Plano de Gestão Ambiental e Social (PDAS)',
      'Impactos das enchentes de 2024',
    ],
    areasRelacionadas: ['social', 'socioambiental'],
    componentes: ['C2', 'ADM'],
  },
  {
    id: 'governanca',
    titulo: 'Gestão e Governança',
    icone: '📋',
    descricao:
      'Fortalecimento da capacidade institucional da PMPA na gestão do programa. UGP como coordenadora geral com ULPs setoriais nas secretarias executoras.',
    subtemas: [
      'Unidade de Gerenciamento do Programa (UGP / SMPG)',
      'Unidades de Licitação e Programação (ULPs)',
      'Regulamento Operativo (ROP)',
      'Plano de Execução do Projeto (PEP RS)',
      'Plano de Monitoramento e Resultados (PMR)',
      'Norma NOP SEI DPF 001 — processos de aquisição',
      'Relatórios semestrais ao BID',
      'Missões de acompanhamento BID',
      'Condições prévias ao primeiro desembolso',
    ],
    areasRelacionadas: ['governanca', 'financeiro', 'aquisicoes'],
    componentes: ['ADM', 'C1', 'C2'],
  },
]
