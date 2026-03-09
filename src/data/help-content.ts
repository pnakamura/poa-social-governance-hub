// Registro centralizado de conteúdo de ajuda para o sistema HelpTooltip
// Usado em todo o app para tooltips contextuais com descrição e links de navegação

export type HelpEntry = {
  title: string
  description: string
  link?: string
  linkLabel?: string
}

export const HELP_CONTENT: Record<string, HelpEntry> = {
  // ─── Dashboard ──────────────────────────────────────────────────────────────
  'kpi-dotacao-bid': {
    title: 'Dotação BID',
    description: 'Valor total aprovado pelo BID para o programa (US$ 128,8M conforme Contrato 5750-OC). O percentual mede a reprogramação orçamentária acumulada em relação ao arranque.',
  },
  'kpi-contrapartida-local': {
    title: 'Contrapartida Local',
    description: 'Valor de contrapartida da PMPA ao programa (US$ 32,2M). Deve ser mantido em proporção mínima conforme o Contrato 5750-OC.',
  },
  'kpi-execucao-fisica': {
    title: 'Execução Física (PMR)',
    description: 'Percentual médio de realização dos indicadores de Outputs do PMR em relação às metas contratuais. Calculado sobre todos os indicadores com meta definida.',
    link: '/pmr/outputs',
    linkLabel: 'Ver PMR Outputs',
  },
  'kpi-riscos-criticos': {
    title: 'Riscos Críticos',
    description: 'Quantidade de riscos com nível ≥ 16 (Probabilidade × Impacto). Riscos críticos exigem plano de mitigação imediata e reporte à missão BID.',
    link: '/riscos',
    linkLabel: 'Ver Matriz de Riscos',
  },
  'chart-orcamento': {
    title: 'Orçamento por Componente',
    description: 'Distribuição do financiamento BID e contrapartida local entre os componentes do programa: C1-Transformação Digital, C2-Reabilitação e ADM.',
    link: '/pep',
    linkLabel: 'Ver PEP RS completo',
  },
  'chart-execucao-pmr': {
    title: 'Execução Física — PMR Outputs',
    description: 'Percentual de realização por indicador físico do PMR. Cada barra representa um Output contratual com sua meta e valor realizado.',
    link: '/pmr/outputs',
    linkLabel: 'Ver todos os Outputs',
  },
  'chart-riscos': {
    title: 'Riscos por Categoria',
    description: 'Distribuição dos riscos identificados por categoria (técnico, institucional, socioambiental). Nível = Probabilidade (1-5) × Impacto (1-5). Máximo: 25.',
    link: '/riscos',
    linkLabel: 'Ver Matriz de Riscos',
  },
  'chart-atividades': {
    title: 'Atividades por Status',
    description: 'Progresso do kanban de atividades operacionais da UGP por status: Pendente, Em Andamento, Concluída.',
    link: '/atividades',
    linkLabel: 'Ver Atividades',
  },
  'chart-pontos-atencao': {
    title: 'Pontos de Atenção — por Área e Criticidade',
    description: 'Semáforo institucional de riscos operacionais agrupados por área temática. Criticidades: Crítico (vermelho), Alerta (amarelo), OK (verde).',
    link: '/pontos-atencao',
    linkLabel: 'Ver todos os Pontos de Atenção',
  },
  'chart-marcos': {
    title: 'Próximos Marcos',
    description: 'Eventos-chave do programa previstos para os próximos 90 dias: missões BID, entregas documentais e contratos.',
    link: '/marcos',
    linkLabel: 'Ver Timeline de Marcos',
  },
  'chart-aquisicoes-status': {
    title: 'Aquisições por Status',
    description: 'Distribuição dos processos licitatórios por fase: Planejado → Preparação → Publicado → Adjudicado → Contratado → Em Execução → Concluído.',
    link: '/aquisicoes',
    linkLabel: 'Ver Plano de Aquisições',
  },

  // ─── PEP RS ─────────────────────────────────────────────────────────────────
  'pep-hierarquia': {
    title: 'Hierarquia PEP RS',
    description: 'Estrutura orçamentária do Plano de Execução do Projeto: Componente → Produto → Subproduto → Plano de Trabalho. Valores em US$ (BID + Local).',
    link: '/pep',
    linkLabel: 'Ver PEP completo',
  },
  'pep-tatico': {
    title: 'Aba Tático — Plano de Aquisições',
    description: 'Cronograma Gantt das aquisições previstas na aba BID da planilha DPF. Barras coloridas por fase do processo licitatório.',
  },
  'gantt-status': {
    title: 'Legenda de Status — Aquisições',
    description: 'Planejado (cinza) → Preparação (azul) → Publicado (amarelo) → Adjudicado (laranja) → Contratado (verde) → Em Execução (esmeralda) → Concluído (slate).',
  },
  'pep-pmr-tab': {
    title: 'PMR — Indicadores do Programa',
    description: 'Tabela consolidada de Outputs e Outcomes do PMR. Outputs medem produtos físicos entregues; Outcomes medem impacto e resultados no público-alvo.',
    link: '/pmr/outputs',
    linkLabel: 'Ver PMR completo',
  },

  // ─── Riscos ─────────────────────────────────────────────────────────────────
  'matriz-riscos': {
    title: 'Matriz de Riscos 5×5',
    description: 'Nível de risco = Probabilidade (1-5) × Impacto (1-5). Crítico: ≥16, Alto: 10-15, Médio: 5-9, Baixo: 1-4. Conforme metodologia BID GN-2349-15.',
    link: '/riscos',
    linkLabel: 'Ver todos os Riscos',
  },
  'risco-nivel': {
    title: 'Nível de Risco',
    description: 'Calculado automaticamente: Probabilidade × Impacto. Quanto maior o nível, maior a prioridade de tratamento e reporte à supervisão BID.',
  },
  'risco-mitigacao': {
    title: 'Plano de Mitigação',
    description: 'Ação(ões) planejada(s) para reduzir a probabilidade ou o impacto do risco. Deve ser atualizado a cada missão de supervisão BID.',
  },

  // ─── Atividades ─────────────────────────────────────────────────────────────
  'kanban-atividades': {
    title: 'Kanban de Atividades',
    description: 'Quadro Kanban com as atividades operacionais da UGP organizadas por status. Atualize regularmente para refletir o progresso real.',
    link: '/atividades',
    linkLabel: 'Ver todas as Atividades',
  },
  'atividade-status': {
    title: 'Status da Atividade',
    description: 'Pendente: aguardando início. Em Andamento: trabalho em progresso. Concluída: entregue e validada.',
  },

  // ─── Pontos de Atenção ───────────────────────────────────────────────────────
  'pontos-atencao-semaforo': {
    title: 'Semáforo de Criticidade',
    description: 'Crítico: exige ação imediata e escalada à supervisão. Alerta: monitorar e definir prazo. OK: situação sob controle. Info: apenas informativo.',
    link: '/pontos-atencao',
    linkLabel: 'Ver todos os Pontos de Atenção',
  },
  'pontos-atencao-area': {
    title: 'Área do Ponto de Atenção',
    description: 'Classificação por área temática: Obras, Digital, Social, Governança, Jurídico, Socioambiental, Aquisições, Financeiro.',
  },

  // ─── Marcos ─────────────────────────────────────────────────────────────────
  'timeline-marcos': {
    title: 'Timeline de Marcos',
    description: 'Eventos-chave do programa em linha do tempo: missões BID, entrega de documentos contratuais, obras e aquisições relevantes.',
    link: '/marcos',
    linkLabel: 'Ver Timeline completa',
  },
  'marco-tipo': {
    title: 'Tipo de Marco',
    description: 'Legislativo: norma ou decreto. Contratual: obrigação do Contrato 5750-OC. Missão BID: visita de supervisão. Entrega Doc: relatório ou POA. Obra: início/término de obra. Aquisição: contratação.',
  },

  // ─── Aquisições ─────────────────────────────────────────────────────────────
  'plano-aquisicoes': {
    title: 'Plano de Aquisições BID',
    description: 'Lista de processos licitatórios previstos no Contrato 5750-OC. Cada aquisição segue as Normas de Aquisição GN-2349-15 do BID.',
    link: '/aquisicoes',
    linkLabel: 'Ver Plano completo',
  },
  'aquisicao-fidic': {
    title: 'Contrato FIDIC',
    description: 'Aquisição que usa contrato padrão FIDIC (Fédération Internationale des Ingénieurs-Conseils). Exige aprovação prévia do BID (não-objeção) em todas as fases.',
  },
  'aquisicao-componente': {
    title: 'Componente da Aquisição',
    description: 'C1: Transformação Digital. C2: Reabilitação e Melhoria de Infraestrutura Social. ADM: Administração e Supervisão do Programa.',
  },

  // ─── Não-Objeções ────────────────────────────────────────────────────────────
  'nao-objecoes': {
    title: 'Não-Objeção BID',
    description: 'Aprovação formal do BID para prosseguir com uma etapa do processo licitatório (ex: edital, contrato, aditivamento). Obrigatória nas modalidades acima do limiar de revisão prévia.',
    link: '/nao-objecoes',
    linkLabel: 'Ver Não-Objeções',
  },

  // ─── Monitoramento de Temas ──────────────────────────────────────────────────
  'monitoramento-temas': {
    title: 'Monitoramento de Temas',
    description: 'Busca transversal por palavras-chave em todas as tabelas do sistema (riscos, atividades, aquisições, marcos, pontos de atenção). Permite acompanhar um tema específico em todas as fontes.',
    link: '/monitoramento',
    linkLabel: 'Ver Monitoramento',
  },
  'tema-palavras-chave': {
    title: 'Palavras-Chave do Tema',
    description: 'Termos de busca usados para encontrar correspondências em riscos, atividades, aquisições, marcos e pontos de atenção. Separe por vírgulas. Busca por similaridade (não exata).',
  },
  'tema-matches': {
    title: 'Correspondências do Tema',
    description: 'Registros encontrados nas 5 fontes de dados que contêm pelo menos uma das palavras-chave do tema. Atualizado a cada 5 minutos.',
  },

  // ─── Programa ────────────────────────────────────────────────────────────────
  'programa-ugp': {
    title: 'UGP — Unidade de Gestão do Programa',
    description: 'Unidade administrativa responsável pela execução do Contrato 5750-OC, subordinada ao DPF/SMPG. Equipe mínima definida no Regulamento Operacional do Programa.',
  },
  'programa-ul': {
    title: 'UL — Unidade de Ligação',
    description: 'Unidade de Ligação de cada secretaria executora (SMS, SMAS, SMED, SMID). Interface entre a UGP e a secretaria para processos licitatórios, técnicos e de prestação de contas.',
  },
  'programa-componentes': {
    title: 'Componentes do Programa',
    description: 'C1-Transformação Digital (US$27M / 16,8%): modernização e interoperabilidade. C2-Reabilitação (US$130M / 80,7%): infraestrutura social. ADM (US$4M / 2,5%): gestão e supervisão. Total: US$161M (Contrato 5750-OC).',
    link: '/programa',
    linkLabel: 'Ver Perfil do Programa',
  },
  'programa-dpf': {
    title: 'DPF — Diretoria de Programas de Financiamento',
    description: 'Diretoria da SMPG responsável pela gestão dos contratos de financiamento externo (BID, KfW, BM, AFD, CAF). Supervisiona a UGP e reporta ao BID.',
  },
  'programa-smpg': {
    title: 'SMPG — Secretaria Municipal de Planejamento e Gestão',
    description: 'Órgão Executor do programa BR-L1597, responsável pela interlocução formal com o BID e pela consolidação das prestações de contas.',
  },
  'programa-contrato': {
    title: 'Contrato BID Nº 5750-OC/BR',
    description: 'Contrato de Empréstimo firmado entre o BID e a Prefeitura de Porto Alegre para o programa POA+SOCIAL. Valor: US$128,8M (BID) + US$32,2M (Local) = US$161M.',
  },

  // ─── Análise / Inteligência ──────────────────────────────────────────────────
  'indice-saude': {
    title: 'Índice de Saúde do Programa',
    description: 'Indicador composto (0-100) calculado a partir de: % execução PMR, nível médio de riscos, pontos de atenção críticos e conformidade de cronograma. Quanto mais próximo de 100, melhor.',
    link: '/inteligencia',
    linkLabel: 'Ver Análise Inteligente',
  },
  'correlacao-pmr-risco': {
    title: 'Correlação PMR × Riscos',
    description: 'Análise cruzada entre execução física dos indicadores PMR e nível de risco por componente. Componentes com baixa execução e alto risco recebem alerta automático.',
    link: '/inteligencia',
    linkLabel: 'Ver Análise Inteligente',
  },

  // ─── Relatórios ─────────────────────────────────────────────────────────────
  'relatorio-poa': {
    title: 'Relatório POA (Plano Operativo Anual)',
    description: 'Documento de planejamento anual exigido pelo Contrato 5750-OC. Apresenta metas físicas, financeiras e cronograma de aquisições para o exercício.',
    link: '/relatorios',
    linkLabel: 'Ver Relatórios',
  },
  'relatorio-pmr': {
    title: 'Relatório PMR (Progress Monitoring Report)',
    description: 'Relatório semestral de acompanhamento do progresso do programa enviado ao BID. Cobre Outputs, Outcomes, riscos, aquisições e indicadores financeiros.',
    link: '/relatorios',
    linkLabel: 'Ver Relatórios',
  },
}
