-- POA+SOCIAL BID — Migration 002
-- Programa: BR-L1597 / Contrato 5750-OC
-- Novas tabelas: programa_contexto, marcos, pontos_atencao, aquisicoes, sync_log
-- Realtime habilitado em tabelas operacionais

-- ============================================================
-- 1. programa_contexto — dados socioeconômicos de Porto Alegre
-- ============================================================
CREATE TABLE IF NOT EXISTS programa_contexto (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria       text NOT NULL,          -- 'demografico','social','economico','climatico'
  indicador       text NOT NULL,
  valor           numeric,
  valor_texto     text,                   -- para valores não numéricos
  unidade         text,
  fonte           text,
  ano_referencia  integer,
  notas           text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (indicador, ano_referencia)
);

-- ============================================================
-- 2. marcos — linha do tempo de eventos do programa
-- ============================================================
CREATE TABLE IF NOT EXISTS marcos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_marco      date NOT NULL,
  tipo            text NOT NULL CHECK (tipo IN (
                    'legislativo','contratual','missao_bid',
                    'entrega_doc','obra','aquisicao','outro'
                  )),
  titulo          text NOT NULL,
  descricao       text,
  area            text CHECK (area IN (
                    'obras','digital','social','governanca',
                    'financeiro','aquisicoes','socioambiental'
                  )),
  status          text NOT NULL DEFAULT 'concluido' CHECK (status IN (
                    'concluido','em_andamento','previsto','atrasado'
                  )),
  referencia_doc  text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marcos_data    ON marcos(data_marco DESC);
CREATE INDEX IF NOT EXISTS idx_marcos_tipo    ON marcos(tipo);
CREATE INDEX IF NOT EXISTS idx_marcos_status  ON marcos(status);
CREATE INDEX IF NOT EXISTS idx_marcos_area    ON marcos(area);

-- ============================================================
-- 3. pontos_atencao — semáforo de riscos institucionais
-- ============================================================
CREATE TABLE IF NOT EXISTS pontos_atencao (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tema            text NOT NULL,
  descricao       text,
  area            text NOT NULL CHECK (area IN (
                    'obras','digital','social','governanca','juridico',
                    'socioambiental','aquisicoes','financeiro'
                  )),
  criticidade     text NOT NULL DEFAULT 'alerta' CHECK (criticidade IN (
                    'critico','alerta','ok','info'
                  )),
  status_texto    text,
  responsavel     text,
  prazo_previsto  date,
  resolucao       text,
  data_atualizacao date,
  ativo           boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pontos_criticidade  ON pontos_atencao(criticidade);
CREATE INDEX IF NOT EXISTS idx_pontos_area         ON pontos_atencao(area);
CREATE INDEX IF NOT EXISTS idx_pontos_ativo        ON pontos_atencao(ativo);

-- ============================================================
-- 4. aquisicoes — processos licitatórios (Plano de Aquisições)
-- ============================================================
CREATE TABLE IF NOT EXISTS aquisicoes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_processo          text UNIQUE,        -- número SEI ou SEPA (chave natural para upsert)
  titulo               text NOT NULL,
  tipo                 text NOT NULL CHECK (tipo IN (
                         'obra','consultoria','bem','servico','fidic'
                       )),
  modalidade           text,               -- 'contratacao_integrada','concorrencia','pregao',etc.
  secretaria           text NOT NULL CHECK (secretaria IN (
                         'SMPG','SMS','SMAS','SMED','SMID','SMDET','PROCEMPA','DEMHAB','Outro'
                       )),
  componente           text,               -- 'C1','C2','ADM'
  valor_usd            numeric(14,2),
  valor_brl            numeric(14,2),
  financiador          text DEFAULT 'BID', -- 'BID','Local','Misto'
  status               text NOT NULL DEFAULT 'planejado' CHECK (status IN (
                         'planejado','preparacao','publicado','em_avaliacao',
                         'adjudicado','contratado','em_execucao','concluido','cancelado'
                       )),
  data_inicio_previsto date,
  data_publicacao      date,
  data_adjudicacao     date,
  data_contratacao     date,
  data_fim_previsto    date,
  data_fim_real        date,
  fidic_aplicavel      boolean DEFAULT false,
  lote                 text,               -- 'Lote 1','Lote 2',etc.
  notas                text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aquisicoes_secretaria  ON aquisicoes(secretaria);
CREATE INDEX IF NOT EXISTS idx_aquisicoes_status      ON aquisicoes(status);
CREATE INDEX IF NOT EXISTS idx_aquisicoes_tipo        ON aquisicoes(tipo);
CREATE INDEX IF NOT EXISTS idx_aquisicoes_componente  ON aquisicoes(componente);

-- ============================================================
-- 5. sync_log — auditoria de importações e sincronizações
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_log (
  id                   bigserial PRIMARY KEY,
  tabela_destino       text NOT NULL,
  fonte                text NOT NULL,      -- 'google_sheets_dpf','pep_xlsx','n8n','script_manual','notebooklm'
  versao               text,              -- hash ou timestamp da fonte
  registros_lidos      integer DEFAULT 0,
  registros_inseridos  integer DEFAULT 0,
  registros_atualizados integer DEFAULT 0,
  registros_ignorados  integer DEFAULT 0,
  registros_erro       integer DEFAULT 0,
  status               text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','erro','parcial')),
  mensagem_erro        text,
  executado_por        text DEFAULT 'n8n',
  executado_em         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_tabela    ON sync_log(tabela_destino);
CREATE INDEX IF NOT EXISTS idx_sync_log_executado ON sync_log(executado_em DESC);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE programa_contexto ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_atencao     ENABLE ROW LEVEL SECURITY;
ALTER TABLE aquisicoes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log           ENABLE ROW LEVEL SECURITY;

-- Leitura pública (sem autenticação)
CREATE POLICY "public_read_programa_contexto" ON programa_contexto
  FOR SELECT USING (true);

CREATE POLICY "public_read_marcos" ON marcos
  FOR SELECT USING (true);

CREATE POLICY "public_read_pontos_atencao" ON pontos_atencao
  FOR SELECT USING (true);

CREATE POLICY "public_read_aquisicoes" ON aquisicoes
  FOR SELECT USING (true);

CREATE POLICY "public_read_sync_log" ON sync_log
  FOR SELECT USING (true);

-- Escrita via service_role (scripts Python, n8n)
CREATE POLICY "service_write_marcos" ON marcos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_write_pontos_atencao" ON pontos_atencao
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_write_aquisicoes" ON aquisicoes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_write_sync_log" ON sync_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_write_programa_contexto" ON programa_contexto
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Realtime (tabelas operacionais — não programa_contexto)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE marcos;
ALTER PUBLICATION supabase_realtime ADD TABLE pontos_atencao;
ALTER PUBLICATION supabase_realtime ADD TABLE aquisicoes;
ALTER PUBLICATION supabase_realtime ADD TABLE sync_log;
