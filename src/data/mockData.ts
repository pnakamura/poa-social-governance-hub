export interface Risk {
  id: string;
  description: string;
  category: "Financeiro" | "Político" | "Técnico" | "Ambiental" | "Social";
  probability: number; // 1-5
  impact: number; // 1-5
  mitigation: string;
  owner: string;
}

export interface Task {
  id: string;
  title: string;
  responsible: string;
  deadline: string;
  progress: number;
  priority: "Baixa" | "Média" | "Alta";
  status: "A fazer" | "Em andamento" | "Aguardando Aprovação" | "Concluído";
  component: string;
}

export interface CriticalNote {
  id: string;
  component: string;
  note: string;
  author: string;
  date: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  urgency: "Alta" | "Média" | "Baixa";
  component: string;
}

export const contractInfo = {
  number: "BRL-5234/OC-BR",
  totalUSD: 150_000_000,
  totalBRL: 750_000_000,
  startDate: "2023-01-15",
  endDate: "2028-12-31",
  objectives: [
    "Fortalecimento institucional e governança municipal",
    "Melhoria da infraestrutura social urbana",
    "Inclusão social e redução de desigualdades",
    "Desenvolvimento sustentável e resiliência climática",
  ],
};

export const baseDocuments = [
  { name: "PAD - Project Appraisal Document", type: "PDF", date: "2022-11-20" },
  { name: "Contrato de Empréstimo BRL-5234/OC-BR", type: "PDF", date: "2023-01-15" },
  { name: "Manual de Operações do Programa v3.2", type: "PDF", date: "2024-06-01" },
  { name: "Regulamento Operativo do Programa", type: "PDF", date: "2023-03-10" },
  { name: "Plano de Aquisições Atualizado", type: "XLSX", date: "2025-01-15" },
  { name: "Marco Lógico de Resultados", type: "PDF", date: "2023-02-28" },
];

export const risks: Risk[] = [
  { id: "R1", description: "Atraso na liberação de contrapartida local", category: "Financeiro", probability: 4, impact: 5, mitigation: "Negociação antecipada com Tesouro Municipal", owner: "Secretaria de Finanças" },
  { id: "R2", description: "Mudança de gestão municipal em ciclo eleitoral", category: "Político", probability: 5, impact: 4, mitigation: "Institucionalização via decreto e capacitação da equipe técnica", owner: "UGP" },
  { id: "R3", description: "Dificuldade na obtenção de licenças ambientais", category: "Ambiental", probability: 3, impact: 4, mitigation: "Articulação prévia com órgãos ambientais", owner: "Secretaria de Meio Ambiente" },
  { id: "R4", description: "Capacidade técnica insuficiente para gestão de contratos", category: "Técnico", probability: 3, impact: 3, mitigation: "Programa de capacitação continuada e contratação de consultores", owner: "UGP" },
  { id: "R5", description: "Baixa adesão comunitária aos programas sociais", category: "Social", probability: 2, impact: 4, mitigation: "Estratégia de comunicação e mobilização social", owner: "Secretaria de Assistência Social" },
  { id: "R6", description: "Variação cambial impactando custo do programa", category: "Financeiro", probability: 4, impact: 3, mitigation: "Hedge cambial e revisão periódica do orçamento", owner: "Secretaria de Finanças" },
  { id: "R7", description: "Falhas no sistema de monitoramento e avaliação", category: "Técnico", probability: 2, impact: 3, mitigation: "Implantação de sistema integrado de M&A", owner: "UGP" },
  { id: "R8", description: "Descumprimento de cláusulas contratuais (Covenants)", category: "Financeiro", probability: 2, impact: 5, mitigation: "Monitoramento mensal de indicadores e relatórios preventivos", owner: "UGP" },
];

export const tasks: Task[] = [
  { id: "T1", title: "Elaborar TDR para consultoria de M&A", responsible: "UGP", deadline: "2025-04-15", progress: 75, priority: "Alta", status: "Em andamento", component: "Componente 1" },
  { id: "T2", title: "Licitar obras de infraestrutura urbana - Lote 3", responsible: "Secretaria de Obras", deadline: "2025-05-30", progress: 30, priority: "Alta", status: "Em andamento", component: "Componente 2" },
  { id: "T3", title: "Capacitação de agentes comunitários", responsible: "Secretaria de Assistência Social", deadline: "2025-06-20", progress: 0, priority: "Média", status: "A fazer", component: "Componente 3" },
  { id: "T4", title: "Relatório semestral de progresso ao BID", responsible: "UGP", deadline: "2025-03-31", progress: 90, priority: "Alta", status: "Aguardando Aprovação", component: "Componente 1" },
  { id: "T5", title: "Atualizar Plano de Aquisições", responsible: "UGP", deadline: "2025-04-01", progress: 100, priority: "Média", status: "Concluído", component: "Componente 1" },
  { id: "T6", title: "Diagnóstico socioeconômico das áreas de intervenção", responsible: "Secretaria de Planejamento", deadline: "2025-07-15", progress: 15, priority: "Média", status: "Em andamento", component: "Componente 3" },
  { id: "T7", title: "Revisão do Marco Lógico de Resultados", responsible: "UGP", deadline: "2025-05-01", progress: 0, priority: "Baixa", status: "A fazer", component: "Componente 1" },
  { id: "T8", title: "Processo licitatório para equipamentos de TI", responsible: "Secretaria de Administração", deadline: "2025-04-30", progress: 50, priority: "Média", status: "Aguardando Aprovação", component: "Componente 1" },
];

export const criticalNotes: CriticalNote[] = [
  { id: "N1", component: "Componente 1", note: "A execução financeira está abaixo da meta prevista para o semestre. Necessária revisão do cronograma de desembolsos.", author: "Coordenador UGP", date: "2025-02-15" },
  { id: "N2", component: "Componente 2", note: "Obras do Lote 2 apresentam atraso de 45 dias. Empresa construtora solicitou aditivo de prazo.", author: "Eng. Fiscal", date: "2025-02-20" },
  { id: "N3", component: "Componente 3", note: "Indicadores de cobertura dos programas sociais precisam ser revisados conforme nova metodologia do BID.", author: "Especialista Social", date: "2025-01-30" },
];

export const recommendations: Recommendation[] = [
  { id: "REC1", title: "Acelerar processos licitatórios", description: "Implementar sistema de acompanhamento semanal das licitações pendentes para evitar atrasos na execução.", urgency: "Alta", component: "Componente 1" },
  { id: "REC2", title: "Reforçar equipe da UGP", description: "Contratar dois especialistas em salvaguardas (ambiental e social) para atender exigências do BID.", urgency: "Alta", component: "Componente 1" },
  { id: "REC3", title: "Revisar metas do componente social", description: "Ajustar indicadores de resultado conforme realidade verificada no diagnóstico de campo.", urgency: "Média", component: "Componente 3" },
  { id: "REC4", title: "Estabelecer comitê de gestão de riscos", description: "Criar rotina mensal de revisão da matriz de riscos com participação de todas as secretarias envolvidas.", urgency: "Média", component: "Governança" },
];

export const kpis = {
  financialExecution: 34.5,
  physicalExecution: 28.2,
  disbursementRate: 22.8,
  tasksOnTrack: 62.5,
  activeRisks: 8,
  criticalRisks: 2,
};
