-- Migration 009: Sistema de Captura e Rastreamento de Demandas
-- Tabelas: inbox_capturas, demandas, demandas_historico

-- Tabela 1: Capturas brutas (fonte original)
CREATE TABLE IF NOT EXISTS inbox_capturas (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_fonte       TEXT        NOT NULL,
  -- 'whatsapp' | 'email' | 'ata_reuniao' | 'comunicado'
  -- | 'transcricao' | 'processo' | 'outro'
  titulo           TEXT,
  texto_bruto      TEXT        NOT NULL,
  autor_fonte      TEXT,           -- remetente / quem falou
  data_fonte       DATE,           -- data do documento original
  processado       BOOLEAN     DEFAULT FALSE,
  demandas_geradas INTEGER     DEFAULT 0,
  projeto          TEXT        DEFAULT 'BR-L1597',
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Tabela 2: Demandas extraídas pela IA
CREATE TABLE IF NOT EXISTS demandas (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_captura_id  UUID        REFERENCES inbox_capturas(id) ON DELETE SET NULL,
  tipo              TEXT        NOT NULL DEFAULT 'acao',
  -- 'acao' | 'decisao' | 'pendencia' | 'informacao' | 'alerta'
  titulo            TEXT        NOT NULL,
  descricao         TEXT,
  responsavel       TEXT,
  prazo             DATE,
  prioridade        TEXT        NOT NULL DEFAULT 'Media',
  -- 'Alta' | 'Media' | 'Baixa'
  status            TEXT        NOT NULL DEFAULT 'aberta',
  -- 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada'
  fonte_tipo        TEXT,           -- herdado da captura
  fonte_descricao   TEXT,           -- ex: "WhatsApp UGP 2026-03-10"
  data_fonte        DATE,
  contexto_original TEXT,           -- trecho exato da fonte que gerou esta demanda
  vinculo_pep_wbs   TEXT,           -- ex: "1.2.3"
  vinculo_risco_id  UUID        REFERENCES riscos(id) ON DELETE SET NULL,
  projeto           TEXT        DEFAULT 'BR-L1597',
  extraido_por_ia   BOOLEAN     DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Tabela 3: Histórico de mudanças por demanda
CREATE TABLE IF NOT EXISTS demandas_historico (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id     UUID        NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
  campo          TEXT        NOT NULL,    -- ex: 'status', 'responsavel', 'prazo'
  valor_anterior TEXT,
  valor_novo     TEXT,
  usuario        TEXT        DEFAULT 'sistema',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_demandas_status    ON demandas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_prazo     ON demandas(prazo);
CREATE INDEX IF NOT EXISTS idx_demandas_projeto   ON demandas(projeto);
CREATE INDEX IF NOT EXISTS idx_demandas_prioridade ON demandas(prioridade);
CREATE INDEX IF NOT EXISTS idx_inbox_processado   ON inbox_capturas(processado);
CREATE INDEX IF NOT EXISTS idx_inbox_projeto      ON inbox_capturas(projeto);
CREATE INDEX IF NOT EXISTS idx_demhist_demanda    ON demandas_historico(demanda_id);

-- RLS
ALTER TABLE inbox_capturas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_inbox"
  ON inbox_capturas FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_all_demandas"
  ON demandas FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_all_demandas_hist"
  ON demandas_historico FOR ALL USING (true) WITH CHECK (true);

-- Trigger: atualiza updated_at em demandas
CREATE OR REPLACE FUNCTION update_demandas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_demandas_updated_at
  BEFORE UPDATE ON demandas
  FOR EACH ROW EXECUTE FUNCTION update_demandas_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE inbox_capturas;
ALTER PUBLICATION supabase_realtime ADD TABLE demandas;
ALTER PUBLICATION supabase_realtime ADD TABLE demandas_historico;
