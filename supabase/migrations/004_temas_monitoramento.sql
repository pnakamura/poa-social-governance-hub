-- 004_temas_monitoramento.sql
-- Tabela de temas de monitoramento transversal com palavras-chave
-- Criado para o Epic E003 — Monitoramento de Temas
-- Aplicar manualmente no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS temas_monitoramento (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT        NOT NULL,
  descricao   TEXT,
  palavras_chave TEXT[]   NOT NULL DEFAULT '{}',
  ativo       BOOLEAN     DEFAULT TRUE,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por palavras-chave (array GIN)
CREATE INDEX IF NOT EXISTS idx_temas_palavras ON temas_monitoramento USING GIN (palavras_chave);

-- RLS: leitura pública + escrita aberta (app sem auth por ora)
ALTER TABLE temas_monitoramento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "temas_select" ON temas_monitoramento
  FOR SELECT USING (true);

CREATE POLICY "temas_all" ON temas_monitoramento
  FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE temas_monitoramento;
