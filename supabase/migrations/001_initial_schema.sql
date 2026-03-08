-- POA+SOCIAL BID — Schema inicial
-- Programa: BR-L1597 / Contrato 5750-OC

-- ============================================================
-- PEP — Plano de Execução do Projeto (hierarquia C→P→SP→PT)
-- ============================================================
CREATE TABLE IF NOT EXISTS pep_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref          text NOT NULL,           -- C, SC, P, SP, PT
  comp         integer,
  prod         integer,
  subp         integer,
  pct          integer,
  descricao    text,
  n_atual      numeric(15,2) DEFAULT 0, -- BID atual (col N)
  o_atual      numeric(15,2) DEFAULT 0, -- Local atual (col O)
  p_atual      numeric(15,2) DEFAULT 0, -- Total atual (col P)
  r_base       numeric(15,2) DEFAULT 0, -- BID arranque (col R)
  s_base       numeric(15,2) DEFAULT 0, -- Local arranque (col S)
  t_base       numeric(15,2) DEFAULT 0, -- Total arranque (col T)
  versao       text NOT NULL DEFAULT 'v1',
  linha_excel  integer,
  importado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pep_ref    ON pep_entries(ref);
CREATE INDEX IF NOT EXISTS idx_pep_versao ON pep_entries(versao);
CREATE INDEX IF NOT EXISTS idx_pep_hier   ON pep_entries(comp, prod, subp, pct);

-- ============================================================
-- PMR — Indicadores de Outputs (realização física)
-- ============================================================
CREATE TABLE IF NOT EXISTS pmr_outputs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  componente     text,
  produto        text,
  codigo         text,
  descricao      text,
  unidade        text,
  linha_base     numeric(15,2),
  meta_contrato  numeric(15,2),
  meta_periodo   numeric(15,2),
  realizado      numeric(15,2) DEFAULT 0,
  pct_realizado  numeric(6,2)  GENERATED ALWAYS AS (
    CASE WHEN meta_contrato > 0 THEN ROUND((realizado / meta_contrato) * 100, 2) ELSE 0 END
  ) STORED,
  periodo_ref    date,
  importado_em   timestamptz DEFAULT now()
);

-- ============================================================
-- PMR — Indicadores de Outcomes (impacto)
-- ============================================================
CREATE TABLE IF NOT EXISTS pmr_outcomes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  componente     text,
  objetivo       text,
  codigo         text,
  descricao      text,
  unidade        text,
  linha_base     numeric(15,2),
  meta_contrato  numeric(15,2),
  realizado      numeric(15,2) DEFAULT 0,
  pct_realizado  numeric(6,2)  GENERATED ALWAYS AS (
    CASE WHEN meta_contrato > 0 THEN ROUND((realizado / meta_contrato) * 100, 2) ELSE 0 END
  ) STORED,
  fonte_dados    text,
  periodo_ref    date,
  importado_em   timestamptz DEFAULT now()
);

-- ============================================================
-- Riscos
-- ============================================================
CREATE TABLE IF NOT EXISTS riscos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao     text NOT NULL,
  categoria     text NOT NULL CHECK (categoria IN ('Financeiro','Político','Técnico','Ambiental','Social','Institucional')),
  probabilidade integer NOT NULL CHECK (probabilidade BETWEEN 1 AND 5),
  impacto       integer NOT NULL CHECK (impacto BETWEEN 1 AND 5),
  nivel         integer GENERATED ALWAYS AS (probabilidade * impacto) STORED,
  mitigacao     text,
  responsavel   text,
  status        text DEFAULT 'Ativo' CHECK (status IN ('Ativo','Mitigado','Monitorando','Fechado')),
  criado_em     timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_riscos_categoria ON riscos(categoria);
CREATE INDEX IF NOT EXISTS idx_riscos_nivel     ON riscos(nivel DESC);

-- ============================================================
-- Atividades / Tarefas (Kanban)
-- ============================================================
CREATE TABLE IF NOT EXISTS atividades (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        text NOT NULL,
  componente    text,
  responsavel   text,
  prazo         date,
  progresso     integer DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100),
  prioridade    text DEFAULT 'Media' CHECK (prioridade IN ('Alta','Media','Baixa')),
  status        text DEFAULT 'todo' CHECK (status IN ('todo','progress','waiting','done')),
  criado_em     timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atividades_status ON atividades(status);
CREATE INDEX IF NOT EXISTS idx_atividades_prazo  ON atividades(prazo);

-- ============================================================
-- Notas Críticas
-- ============================================================
CREATE TABLE IF NOT EXISTS notas_criticas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  componente  text,
  nota        text NOT NULL,
  autor       text,
  criado_em   timestamptz DEFAULT now()
);

-- ============================================================
-- Recomendações
-- ============================================================
CREATE TABLE IF NOT EXISTS recomendacoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      text NOT NULL,
  descricao   text,
  urgencia    text DEFAULT 'Media' CHECK (urgencia IN ('Alta','Media','Baixa')),
  componente  text,
  status      text DEFAULT 'Pendente' CHECK (status IN ('Pendente','Em Andamento','Concluída','Cancelada')),
  criado_em   timestamptz DEFAULT now()
);

-- ============================================================
-- Não-Objeções BID
-- ============================================================
CREATE TABLE IF NOT EXISTS nao_objecoes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo        text NOT NULL,
  tipo            text CHECK (tipo IN ('Aquisição','Pessoal','Consultoria','TdR','Outro')),
  solicitado_em   date,
  recebido_em     date,
  status          text DEFAULT 'Pendente' CHECK (status IN ('Pendente','Recebida','Vencida','Cancelada')),
  valor_usd       numeric(15,2),
  observacoes     text,
  criado_em       timestamptz DEFAULT now()
);

-- ============================================================
-- Enable RLS (Row Level Security) — permissive por padrão
-- ============================================================
ALTER TABLE pep_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmr_outputs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmr_outcomes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE riscos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_criticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recomendacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE nao_objecoes   ENABLE ROW LEVEL SECURITY;

-- Policies: acesso público (anon) para leitura + escrita enquanto não há auth
CREATE POLICY "public_all" ON pep_entries    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON pmr_outputs    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON pmr_outcomes   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON riscos         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON atividades     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON notas_criticas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON recomendacoes  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON nao_objecoes   FOR ALL USING (true) WITH CHECK (true);
