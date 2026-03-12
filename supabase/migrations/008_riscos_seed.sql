-- Migration 008: Seed de 15 riscos identificados para o programa POA+SOCIAL BID (BR-L1597)
-- Fontes: análise de documentos do projeto, BID, ANA, contexto pós-enchentes RS 2024
-- ON CONFLICT DO NOTHING garante idempotência (não altera riscos já cadastrados)

-- ══════════════════════════════════════════════════════════════════
-- RISCOS ESTRATÉGICOS (5)
-- ══════════════════════════════════════════════════════════════════

INSERT INTO riscos (descricao, categoria, probabilidade, impacto, nivel, tipo, componente, status, mitigacao, responsavel)
VALUES
  (
    'Vulnerabilidade climática crítica: eventos de inundação extremos recorrentes em Porto Alegre (precedente: enchente de mai/2024, 5,37m — maior da história do RS)',
    'Ambiental', 4, 5, 20, 'Estratégico', 'C2',
    'Ativo',
    'Dimensionar obras com aumento de 15-20% nas vazões máximas; integrar alertas precoces; garantir cota de projeto acima de 5,5m para infraestrutura crítica',
    'SMOI / UGP'
  ),
  (
    'Fragilidade estrutural do sistema de proteção contra cheias (comportas, diques e casas de bombas projetados nos anos 1960-1980)',
    'Técnico', 4, 5, 20, 'Estratégico', 'C2',
    'Ativo',
    'Inspecionar e reforçar infraestrutura existente antes de iniciar obras de reabilitação; plano de contingência para falhas de casas de bombas',
    'SMOI'
  ),
  (
    'Exposição geográfica das áreas-alvo: ~35% da área urbanizada abaixo da cota 3m, concentrando populações vulneráveis em zonas de alto risco de inundação',
    'Ambiental', 4, 4, 16, 'Estratégico', 'C2',
    'Ativo',
    'Elaborar mapa de risco georreferenciado por WBS; priorizar obras em áreas de maior exposição; comunicação preventiva com beneficiários',
    'ASD / DEMHAB'
  ),
  (
    'Fragmentação institucional na governança metropolitana: falta de integração entre secretarias municipais e órgãos estaduais/federais para execução coordenada',
    'Institucional', 3, 4, 12, 'Estratégico', 'Geral',
    'Ativo',
    'Estabelecer comitê de governança intersetorial com representantes de SMPG, SMOI, ASD, SMS, SMAS, SMED; protocolos formais de coordenação',
    'SMPG / UGP'
  ),
  (
    'Capacidade fiscal comprometida da PMPA para manutenção e operação pós-implantação da infraestrutura reabilitada',
    'Financeiro', 3, 4, 12, 'Estratégico', 'C3',
    'Ativo',
    'Incluir plano de sustentabilidade financeira como condicionalidade de desembolso; criar fundo de manutenção; mapear impacto nos custos operacionais da prefeitura',
    'SMPG / SMF'
  )
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- RISCOS TÁTICOS (5)
-- ══════════════════════════════════════════════════════════════════

INSERT INTO riscos (descricao, categoria, probabilidade, impacto, nivel, tipo, componente, status, mitigacao, responsavel)
VALUES
  (
    'Paralisação de obras do C2 por novas inundações (janeiro/2025 já registrou alagamentos em 5 bairros, incluindo Centro Histórico)',
    'Ambiental', 4, 4, 16, 'Tático', 'C2',
    'Ativo',
    'Incluir cláusulas de force majeure nos contratos; janelas de execução fora do período crítico (mai-jun); planos de proteção de canteiro de obra',
    'SMOI / Construtoras'
  ),
  (
    'Deficiência de capacidade técnica e administrativa das secretarias executoras para gestão de contratos BID e conformidade com procedimentos fiduciários',
    'Institucional', 3, 4, 12, 'Tático', 'Geral',
    'Ativo',
    'Programa de capacitação em procedimentos BID para equipes de SMPG, SMOI e ASD; contratação de consultoria especializada em fiduciário BID',
    'UGP / SMPG'
  ),
  (
    'Falhas recorrentes no sistema de casas de bombas (apenas Trensurb operou normalmente em jan/2025); risco de paralisação parcial durante execução de C2',
    'Técnico', 4, 4, 16, 'Tático', 'C2',
    'Ativo',
    'Incluir reabilitação/modernização das casas de bombas no escopo do C2; plano de manutenção preventiva trimestral; sistema de monitoramento remoto',
    'SMOI / DMAE'
  ),
  (
    'Participação insuficiente de stakeholders e comunidades beneficiárias na formulação e execução, gerando resistência e contestações',
    'Social', 3, 3, 9, 'Tático', 'Geral',
    'Monitorando',
    'Criar instâncias formais de participação popular por componente; audiências públicas antes da licitação de obras; canal de ouvidoria específico para o programa',
    'SMPG / ASD'
  ),
  (
    'Desempenho insuficiente de secretarias na entrega de serviços de saúde, assistência social e inclusão produtiva previstos no C1',
    'Institucional', 3, 3, 9, 'Tático', 'C1',
    'Monitorando',
    'Definir metas intermediárias mensuráveis por secretaria; reuniões mensais de acompanhamento UGP-secretarias; relatórios de progresso trimestrais ao BID',
    'UGP / SMS / SMAS'
  )
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- RISCOS OPERACIONAIS (5)
-- ══════════════════════════════════════════════════════════════════

INSERT INTO riscos (descricao, categoria, probabilidade, impacto, nivel, tipo, componente, status, mitigacao, responsavel)
VALUES
  (
    'Atrasos em desembolsos BID por documentação incompleta ou não conformidade com procedimentos fiduciários (NOPs, contratos, relatórios de progresso)',
    'Financeiro', 3, 3, 9, 'Operacional', 'C3',
    'Ativo',
    'Checklist de documentação por tipo de despesa; revisão prévia de NOPs pela UGP antes de envio ao BID; capacitação fiduciária das equipes',
    'UGP / SMPG'
  ),
  (
    'Deficiências no sistema de monitoramento e avaliação: dificuldade de coleta de indicadores PMR de múltiplas secretarias em tempo real',
    'Técnico', 2, 3, 6, 'Operacional', 'Geral',
    'Ativo',
    'Integrar sistema de M&A ao app POA+SOCIAL; designar pontos focais de monitoramento em cada secretaria; reuniões mensais de validação de indicadores',
    'SMPG / UGP'
  ),
  (
    'Atrasos e contestações em licitações de obras de reabilitação (impugnações, recurso de licitantes, descoberta de problemas estruturais em campo)',
    'Técnico', 3, 3, 9, 'Operacional', 'C2',
    'Ativo',
    'Projetos executivos detalhados antes da licitação; estudos geotécnicos prévios; cronograma com folga de 20% para imprevistos; assessoria jurídica especializada',
    'SMOI / PGM'
  ),
  (
    'Deterioração socioeconômica da população beneficiária pós-enchentes (442 mil desabrigados em 2024) compromete capacidade de participação em programas de inclusão produtiva',
    'Social', 4, 3, 12, 'Operacional', 'C1',
    'Ativo',
    'Mapear beneficiários em situação de maior vulnerabilidade; integrar ações de assistência social emergencial com atividades do C1; flexibilizar cronograma de inclusão produtiva',
    'SMAS / ASD'
  ),
  (
    'Perda de dados e documentação de execução em campo por eventos climáticos (acesso a 85% da população foi impactado pela enchente de 2024)',
    'Técnico', 2, 2, 4, 'Operacional', 'C2',
    'Monitorando',
    'Backup diário em nuvem de toda documentação de obra; armazenamento físico em local acima da cota de risco; protocolo de recuperação de documentos',
    'SMOI / UGP'
  )
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- Verificação pós-seed (execute para confirmar):
-- SELECT tipo, COUNT(*) FROM riscos GROUP BY tipo ORDER BY tipo;
-- Esperado: Estratégico=5, Operacional=5, Tático=5
-- ══════════════════════════════════════════════════════════════════
